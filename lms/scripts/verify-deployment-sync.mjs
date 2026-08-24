import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const sha256 = value => createHash('sha256').update(value).digest('hex');

const normalizeBaseUrl = value => {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error(`Invalid deployment URL: ${value}`);
  }
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
  url.search = '';
  url.hash = '';
  return url;
};

const fetchBytes = async url => {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {'cache-control': 'no-cache'},
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}.`);
  return Buffer.from(await response.arrayBuffer());
};

const mapLimit = async (items, limit, task) => {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({length: Math.min(limit, items.length)}, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await task(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
};

const validateManifest = (baseUrl, manifest) => {
  if (manifest.schemaVersion !== 1) throw new Error(`${baseUrl} has an unsupported release manifest.`);
  if (!/^[a-f0-9]{40}$/i.test(manifest.gitSha || '')) throw new Error(`${baseUrl} has no full Git SHA.`);
  if (manifest.dirty !== false) throw new Error(`${baseUrl} was built from a dirty worktree.`);
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) throw new Error(`${baseUrl} has no release file inventory.`);
  const seenPaths = new Set();
  manifest.files.forEach(file => {
    const safePath = typeof file.path === 'string'
      && !file.path.startsWith('/')
      && !file.path.includes('..')
      && !file.path.includes('://');
    if (!safePath || seenPaths.has(file.path)) throw new Error(`${baseUrl} has an unsafe release file path.`);
    if (!Number.isInteger(file.bytes) || file.bytes < 0 || !/^[a-f0-9]{64}$/i.test(file.sha256 || '')) {
      throw new Error(`${baseUrl} has invalid release file metadata for ${file.path}.`);
    }
    seenPaths.add(file.path);
  });

  const calculatedArtifact = sha256(
    manifest.files.map(file => `${file.path}:${file.bytes}:${file.sha256}`).join('\n'),
  );
  if (calculatedArtifact !== manifest.artifactSha256) {
    throw new Error(`${baseUrl} release manifest has an invalid artifact digest.`);
  }
};

const verifyTarget = async value => {
  const baseUrl = normalizeBaseUrl(value);
  const manifestUrl = new URL('release.json', baseUrl);
  let manifest;
  try {
    manifest = JSON.parse((await fetchBytes(manifestUrl)).toString('utf8'));
  } catch (error) {
    throw new Error(`${baseUrl} does not expose a valid release.json.`, {cause: error});
  }
  validateManifest(baseUrl, manifest);

  await mapLimit(manifest.files, 8, async file => {
    const bytes = await fetchBytes(new URL(file.path, baseUrl));
    if (bytes.byteLength !== file.bytes || sha256(bytes) !== file.sha256) {
      throw new Error(`${baseUrl}${file.path} does not match release.json.`);
    }
  });

  const indexHtml = (await fetchBytes(baseUrl)).toString('utf8');
  const referencedAssets = [...indexHtml.matchAll(/(?:src|href)="\/(assets\/[^"?#]+)/g)]
    .map(match => match[1]);
  const inventory = new Set(manifest.files.map(file => file.path));
  referencedAssets.forEach(path => {
    if (!inventory.has(path)) throw new Error(`${baseUrl} index.html references untracked asset ${path}.`);
  });

  return {baseUrl: baseUrl.href, manifest};
};

export const verifyDeploymentSync = async targets => {
  if (targets.length < 2) throw new Error('Provide at least two deployment base URLs.');
  const results = await Promise.all(targets.map(verifyTarget));
  const baseline = results[0].manifest;
  const mismatches = results.slice(1).filter(result =>
    result.manifest.gitSha !== baseline.gitSha
    || result.manifest.artifactSha256 !== baseline.artifactSha256,
  );
  if (mismatches.length > 0) {
    throw new Error('Deployments do not serve the same Git SHA and immutable artifact.');
  }
  return results;
};

const isMain = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    const results = await verifyDeploymentSync(process.argv.slice(2));
    results.forEach(result => {
      console.log(`${result.baseUrl} ${result.manifest.gitSha} ${result.manifest.artifactSha256}`);
    });
    console.log('All deployment targets serve the same verified release.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

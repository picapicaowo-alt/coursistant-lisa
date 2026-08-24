import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const lockPath = resolve(projectRoot, 'contracts/backend-contract.json');
const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head']);

const sortDeep = value => {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map(key => [key, sortDeep(value[key])]),
    );
  }
  return value;
};

const fingerprint = document => createHash('sha256')
  .update(JSON.stringify(sortDeep({
    paths: document.paths || {},
    schemas: document.components?.schemas || {},
  })))
  .digest('hex');

const summarize = document => {
  const paths = Object.values(document.paths || {});
  return {
    openapiVersion: document.openapi,
    apiTitle: document.info?.title,
    apiVersion: document.info?.version,
    pathCount: paths.length,
    operationCount: paths.reduce(
      (count, pathItem) => count + Object.keys(pathItem).filter(key => HTTP_METHODS.has(key)).length,
      0,
    ),
    schemaCount: Object.keys(document.components?.schemas || {}).length,
    fingerprintSha256: fingerprint(document),
  };
};

const readSource = async source => {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source, {signal: AbortSignal.timeout(20_000)});
    if (!response.ok) throw new Error(`OpenAPI request failed with HTTP ${response.status}.`);
    return response.json();
  }
  return JSON.parse(readFileSync(resolve(process.cwd(), source), 'utf8'));
};

export const verifyContract = async source => {
  const actual = summarize(await readSource(source));
  const expected = lock.contract;
  const mismatches = Object.keys(actual)
    .filter(key => actual[key] !== expected[key])
    .map(key => `${key}: expected ${expected[key]}, received ${actual[key]}`);

  if (mismatches.length > 0) {
    throw new Error(`Backend contract drift detected:\n${mismatches.map(item => `- ${item}`).join('\n')}`);
  }
  return actual;
};

const validateLock = () => {
  if (lock.schemaVersion !== 1) throw new Error('Unsupported backend contract lock schema.');
  if (!/^[a-f0-9]{64}$/i.test(lock.contract?.fingerprintSha256 || '')) {
    throw new Error('backend-contract.json has no valid SHA-256 fingerprint.');
  }
  if (lock.database?.attestation !== 'VERIFIED') {
    console.warn('Database migration state is not attested; see docs/RELEASE_SYNC.md.');
  }
};

const isMain = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    validateLock();
    const source = process.argv[2] || process.env.OPENAPI_SOURCE;
    if (!source) {
      console.log(`Contract lock is valid: ${lock.contract.pathCount} paths, ${lock.contract.operationCount} operations, ${lock.contract.schemaCount} schemas.`);
    } else {
      const actual = await verifyContract(source);
      console.log(`OpenAPI contract matches ${actual.fingerprintSha256}.`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

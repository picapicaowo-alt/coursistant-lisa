import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import type {OutputAsset, OutputBundle, OutputChunk} from 'rollup';
import type {Plugin} from 'vite';

interface PackageMetadata {
  version?: string;
  repository?: string | {url?: string};
}

export interface ReleaseInfo {
  version: string;
  gitSha: string;
  dirty: boolean;
  source: string;
}

interface ReleaseFile {
  path: string;
  bytes: number;
  sha256: string;
}

const sha256 = (value: string | Uint8Array): string =>
  createHash('sha256').update(value).digest('hex');

const runGit = (repositoryRoot: string, args: string[]): string =>
  execFileSync('git', args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();

const readRepositoryUrl = (metadata: PackageMetadata): string => {
  if (typeof metadata.repository === 'string') return metadata.repository;
  return metadata.repository?.url?.trim() || 'unknown';
};

export const resolveReleaseInfo = (
  projectRoot: string,
  repositoryRoot = resolve(projectRoot, '..'),
): ReleaseInfo => {
  const metadata = JSON.parse(
    readFileSync(resolve(projectRoot, 'package.json'), 'utf8'),
  ) as PackageMetadata;

  const gitSha = process.env.VITE_GIT_SHA?.trim() || runGit(repositoryRoot, ['rev-parse', 'HEAD']);
  if (!/^[a-f0-9]{40}$/i.test(gitSha)) {
    throw new Error('VITE_GIT_SHA must be a full 40-character Git commit SHA.');
  }

  const dirtyOverride = process.env.VITE_RELEASE_DIRTY?.trim();
  if (dirtyOverride !== undefined && !['true', 'false'].includes(dirtyOverride)) {
    throw new Error('VITE_RELEASE_DIRTY must be either true or false.');
  }
  const dirty = dirtyOverride === undefined
    ? runGit(repositoryRoot, ['status', '--porcelain']).length > 0
    : dirtyOverride === 'true';
  const fallbackVersion = metadata.version && metadata.version !== '0.0.0'
    ? metadata.version
    : gitSha.slice(0, 12);

  return {
    version: process.env.VITE_APP_VERSION?.trim() || fallbackVersion,
    gitSha,
    dirty,
    source: readRepositoryUrl(metadata),
  };
};

const bundleFile = (path: string, item: OutputAsset | OutputChunk): ReleaseFile => {
  const content = item.type === 'chunk'
    ? Buffer.from(item.code)
    : typeof item.source === 'string'
      ? Buffer.from(item.source)
      : Buffer.from(item.source);

  return {
    path,
    bytes: content.byteLength,
    sha256: sha256(content),
  };
};

const collectReleaseFiles = (bundle: OutputBundle): ReleaseFile[] =>
  Object.entries(bundle)
    .filter(([path]) => path !== 'release.json')
    .map(([path, item]) => bundleFile(path, item))
    .sort((left, right) => left.path.localeCompare(right.path));

export const releaseManifestPlugin = (release: ReleaseInfo): Plugin => ({
  name: 'coursistant-release-manifest',
  enforce: 'post',
  config: () => ({
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(release.version),
      'import.meta.env.VITE_GIT_SHA': JSON.stringify(release.gitSha),
      'import.meta.env.VITE_RELEASE_DIRTY': JSON.stringify(String(release.dirty)),
    },
  }),
  generateBundle: {
    order: 'post',
    handler(_options, bundle) {
      const files = collectReleaseFiles(bundle);
      const artifactSha256 = sha256(
        files.map(file => `${file.path}:${file.bytes}:${file.sha256}`).join('\n'),
      );

      this.emitFile({
        type: 'asset',
        fileName: 'release.json',
        source: `${JSON.stringify({
          schemaVersion: 1,
          ...release,
          artifactSha256,
          files,
        }, null, 2)}\n`,
      });
    },
  },
});

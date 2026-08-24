import {readFileSync, readdirSync, statSync} from 'node:fs';
import {relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const sourceRoot = resolve(projectRoot, 'src');
const runtimeExtensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const errors = [];

const toProjectPath = path => relative(projectRoot, path).replaceAll('\\', '/');

const walk = directory => readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
  const path = resolve(directory, entry.name);
  if (entry.isDirectory()) return walk(path);
  const extension = entry.name.slice(entry.name.lastIndexOf('.'));
  return runtimeExtensions.has(extension) ? [path] : [];
});

const readAllowlist = name => new Set(
  readFileSync(resolve(projectRoot, 'scripts', name), 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#')),
);

const compareAllowlist = (label, actualPaths, allowlist) => {
  actualPaths.forEach(path => {
    if (!allowlist.has(path)) errors.push(`${label}: unapproved file ${path}`);
  });
  allowlist.forEach(path => {
    if (!actualPaths.has(path)) errors.push(`${label}: remove stale allowlist entry ${path}`);
  });
};

const runtimeFiles = walk(sourceRoot);
const runtimePaths = new Set(runtimeFiles.map(toProjectPath));
const legacyJavaScript = new Set(
  [...runtimePaths].filter(path => path.endsWith('.js') || path.endsWith('.jsx')),
);
compareAllowlist('legacy JS/JSX', legacyJavaScript, readAllowlist('legacy-js-allowlist.txt'));

const noCheckFiles = new Set();
const forbiddenHost = /(?:[a-z0-9-]+\.)*xlearnedu\.com|(?:[a-z0-9-]+\.)*coursistant\.com|https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i;
const demoCredential = /(?:email|password)\s*:\s*['"]123['"]/i;
const secretMaterial = /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|Bearer\s+[A-Za-z0-9._-]{32,}/i;

runtimeFiles.forEach(file => {
  const path = toProjectPath(file);
  const source = readFileSync(file, 'utf8');
  if (/^\s*(?:\/\/|\/\*)\s*@ts-nocheck/m.test(source)) noCheckFiles.add(path);
  if (forbiddenHost.test(source)) errors.push(`environment host is hardcoded in ${path}`);
  if (demoCredential.test(source)) errors.push(`demo credential is committed in ${path}`);
  if (secretMaterial.test(source)) errors.push(`secret-like material is committed in ${path}`);

  const maintainedTypeScript = (path.endsWith('.ts') || path.endsWith('.tsx'))
    && !path.includes('.test.')
    && !path.includes('.spec.');
  if (maintainedTypeScript && path !== 'src/config/env.ts' && /import\.meta\.env\.VITE_/.test(source)) {
    errors.push(`public environment access must go through src/config/env.ts: ${path}`);
  }

  const isUiModule = /^(?:src\/(?:components|pages|sections|layouts)\/)/.test(path);
  if (maintainedTypeScript && isUiModule && /(?:from\s+['"]axios['"]|\bfetch\s*\()/.test(source)) {
    errors.push(`maintained UI must use an API service instead of direct HTTP: ${path}`);
  }
});

compareAllowlist(
  '@ts-nocheck',
  noCheckFiles,
  readAllowlist('legacy-ts-nocheck-allowlist.txt'),
);

['.env.development', '.env.production'].forEach(name => {
  const path = resolve(projectRoot, name);
  if (!statSync(path).isFile()) return;
  const value = readFileSync(path, 'utf8');
  if (forbiddenHost.test(value)) errors.push(`environment host is committed in ${name}`);
  const publicValues = value
    .split(/\r?\n/)
    .filter(line => /^VITE_[A-Z0-9_]+=/.test(line))
    .map(line => line.slice(line.indexOf('=') + 1));
  publicValues.forEach(publicValue => {
    if (!/^\/(?!\/)/.test(publicValue)) {
      errors.push(`${name} contains a non-relative browser value: ${publicValue}`);
    }
  });
});

if (errors.length > 0) {
  console.error(`Source audit failed with ${errors.length} issue(s):`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Source audit passed: ${runtimeFiles.length} runtime modules; ${legacyJavaScript.size} quarantined JS/JSX files.`);
}

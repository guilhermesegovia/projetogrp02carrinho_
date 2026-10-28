import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = join(webRoot, 'public');
const repositoryRoot = resolve(webRoot, '..');
const destination = join(repositoryRoot, 'backend', 'src', 'main', 'resources', 'static');
const manifestPath = join(webRoot, '.spring-static-manifest.json');

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

const files = listFiles(publicRoot);
const paths = files.map((file) => relative(publicRoot, file).replaceAll('\\', '/')).sort();
const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : [];
for (const path of paths) {
  const target = join(destination, path);
  if (existsSync(target) && !previous.includes(path)) throw new Error(`Refusing to overwrite un-managed static file: ${target}`);
}
for (const path of previous) {
  if (!paths.includes(path)) rmSync(join(destination, path), { force: true });
}
for (const path of paths) {
  const target = join(destination, path);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(join(publicRoot, path), target);
}
writeFileSync(manifestPath, `${JSON.stringify(paths, null, 2)}\n`);
console.log(`Published ${paths.length} editable static files to ${destination}`);

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const platformDefinitions = [
  {
    key: 'darwin-aarch64',
    matches: (name) => /\.dmg$/i.test(name) && /(aarch64|arm64)/i.test(name)
  },
  {
    key: 'linux-x86_64',
    matches: (name) => /\.AppImage$/i.test(name)
  },
  {
    key: 'linux-rpm',
    matches: (name) => /\.rpm$/i.test(name)
  },
  {
    key: 'windows-x86_64',
    matches: (name) => /\.exe$/i.test(name) && /setup/i.test(name)
  }
];

export function findLegacyTauriAssets(assetsDir) {
  const files = readdirSync(assetsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  return platformDefinitions.flatMap((definition) => {
    const fileName = files.find((name) => definition.matches(name));
    return fileName ? [{ platform: definition.key, path: join(assetsDir, fileName), fileName }] : [];
  });
}

export function createLegacyTauriManifest({ assetsDir, version, tag, repo, pubDate = new Date() }) {
  const assets = findLegacyTauriAssets(assetsDir);

  if (assets.length === 0) {
    throw new Error(`No Electron release assets found in ${assetsDir}`);
  }

  const platforms = Object.fromEntries(
    assets.map((asset) => {
      const signaturePath = `${asset.path}.sig`;
      const signature = readFileSync(signaturePath, 'utf8').trim();

      if (!signature) {
        throw new Error(`Empty Tauri signature for ${asset.fileName}`);
      }

      return [
        asset.platform,
        {
          signature,
          url: `https://github.com/${repo}/releases/download/${tag}/${encodeURIComponent(asset.fileName)}`
        }
      ];
    })
  );

  return {
    version,
    notes: 'New version available',
    pub_date: pubDate.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    platforms
  };
}

function readArg(name, fallback = undefined) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

function hasArg(name) {
  return process.argv.includes(name);
}

function runCli() {
  const assetsDir = readArg('--assets-dir', 'assets');
  const version = readArg('--version');
  const tag = readArg('--tag', version);
  const repo = readArg('--repo', 'DasCanard/radioss');

  if (hasArg('--print-assets')) {
    for (const asset of findLegacyTauriAssets(assetsDir)) {
      console.log(asset.path);
    }
    return;
  }

  if (!version || !tag) {
    throw new Error('Usage: node scripts/generate-legacy-tauri-latest.mjs --version <version> [--tag <tag>] [--assets-dir assets] [--output latest.json]');
  }

  const manifest = createLegacyTauriManifest({ assetsDir, version, tag, repo });
  const output = readArg('--output');
  const json = `${JSON.stringify(manifest, null, 2)}\n`;

  if (output) {
    writeFileSync(output, json);
  } else {
    process.stdout.write(json);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}

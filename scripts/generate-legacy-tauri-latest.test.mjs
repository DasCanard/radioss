import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createLegacyTauriManifest, findLegacyTauriAssets } from './generate-legacy-tauri-latest.mjs';

const tempDirs = [];

async function createAssetDir() {
  const path = join(tmpdir(), `radioss-legacy-tauri-${crypto.randomUUID()}`);
  await mkdir(path);
  tempDirs.push(path);
  return path;
}

async function writeSignedAsset(assetsDir, fileName, signature) {
  await writeFile(join(assetsDir, fileName), 'asset');
  await writeFile(join(assetsDir, `${fileName}.sig`), signature);
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe('legacy Tauri latest.json generation', () => {
  it('selects Electron release assets that old Tauri clients can consume', async () => {
    const assetsDir = await createAssetDir();
    await writeSignedAsset(assetsDir, 'Radioss-Setup-0.9.1.exe', 'windows-signature');
    await writeSignedAsset(assetsDir, 'Radioss-0.9.1-arm64.dmg', 'mac-signature');
    await writeSignedAsset(assetsDir, 'Radioss-0.9.1-x86_64.AppImage', 'appimage-signature');
    await writeSignedAsset(assetsDir, 'radioss-0.9.1-1.x86_64.rpm', 'rpm-signature');
    await writeFile(join(assetsDir, 'Radioss-Setup-0.9.1.exe.blockmap'), 'ignored');
    await writeFile(join(assetsDir, 'latest.yml'), 'ignored');

    const assets = findLegacyTauriAssets(assetsDir);

    expect(assets.map((asset) => asset.platform)).toEqual([
      'darwin-aarch64',
      'linux-x86_64',
      'linux-rpm',
      'windows-x86_64'
    ]);
  });

  it('creates a Tauri static update manifest with signatures and GitHub download URLs', async () => {
    const assetsDir = await createAssetDir();
    await writeSignedAsset(assetsDir, 'Radioss-Setup-0.9.1.exe', 'windows-signature\n');
    await writeSignedAsset(assetsDir, 'Radioss-0.9.1-arm64.dmg', 'mac-signature');
    await writeSignedAsset(assetsDir, 'Radioss-0.9.1-x86_64.AppImage', 'appimage-signature');

    const manifest = createLegacyTauriManifest({
      assetsDir,
      version: '0.9.1',
      tag: '0.9.1',
      repo: 'DasCanard/radioss',
      pubDate: new Date('2026-05-09T20:00:00Z')
    });

    expect(manifest).toEqual({
      version: '0.9.1',
      notes: 'New version available',
      pub_date: '2026-05-09T20:00:00Z',
      platforms: {
        'darwin-aarch64': {
          signature: 'mac-signature',
          url: 'https://github.com/DasCanard/radioss/releases/download/0.9.1/Radioss-0.9.1-arm64.dmg'
        },
        'linux-x86_64': {
          signature: 'appimage-signature',
          url: 'https://github.com/DasCanard/radioss/releases/download/0.9.1/Radioss-0.9.1-x86_64.AppImage'
        },
        'windows-x86_64': {
          signature: 'windows-signature',
          url: 'https://github.com/DasCanard/radioss/releases/download/0.9.1/Radioss-Setup-0.9.1.exe'
        }
      }
    });
  });
});

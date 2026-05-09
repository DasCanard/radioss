import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createJsonStorage } from './storage';

const tempDirs: string[] = [];

async function createTempUserDataPath(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), 'radioss-storage-'));
  tempDirs.push(path);
  return path;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe('createJsonStorage', () => {
  it('creates default data when a known key has not been saved yet', async () => {
    const storage = createJsonStorage(await createTempUserDataPath());

    await expect(storage.loadData('customStations')).resolves.toEqual([]);
    await expect(storage.loadData('favorites')).resolves.toEqual([]);
    await expect(storage.loadData('favoritedStations')).resolves.toEqual([]);
    await expect(storage.loadData('volume')).resolves.toBe(50);
    await expect(storage.loadData('discordRPCEnabled')).resolves.toBe(true);
    await expect(storage.loadData('minimizeToTrayEnabled')).resolves.toBe(false);
  });

  it('persists and reloads arbitrary JSON values by data type', async () => {
    const storage = createJsonStorage(await createTempUserDataPath());
    const station = {
      id: 'custom-1',
      name: 'Local Test Radio',
      url: 'https://example.com/stream.mp3',
      tags: ['test', 'local']
    };

    await storage.saveData('customStations', [station]);

    await expect(storage.loadData('customStations')).resolves.toEqual([station]);
  });

  it('returns null for unknown unsaved keys', async () => {
    const storage = createJsonStorage(await createTempUserDataPath());

    await expect(storage.loadData('unknownKey')).resolves.toBeNull();
  });
});

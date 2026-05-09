import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const defaultDataByType: Record<string, unknown> = {
  customStations: [],
  favorites: [],
  favoritedStations: [],
  volume: 50,
  discordRPCEnabled: true,
  minimizeToTrayEnabled: false
};

export interface JsonStorage {
  loadData<T = unknown>(dataType: string): Promise<T | null>;
  saveData<T = unknown>(dataType: string, data: T): Promise<void>;
}

export function createJsonStorage(userDataPath: string): JsonStorage {
  const getFilePath = (dataType: string) => join(userDataPath, `${dataType}.json`);

  return {
    async loadData<T = unknown>(dataType: string): Promise<T | null> {
      await mkdir(userDataPath, { recursive: true });

      try {
        const content = await readFile(getFilePath(dataType), 'utf8');
        return JSON.parse(content) as T;
      } catch (error) {
        if (!isMissingFileError(error)) {
          throw error;
        }

        const defaultData = defaultDataByType[dataType] ?? null;
        await writeFile(getFilePath(dataType), JSON.stringify(defaultData, null, 2), 'utf8');
        return defaultData as T | null;
      }
    },

    async saveData<T = unknown>(dataType: string, data: T): Promise<void> {
      await mkdir(userDataPath, { recursive: true });
      await writeFile(getFilePath(dataType), JSON.stringify(data, null, 2), 'utf8');
    }
  };
}

function isMissingFileError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

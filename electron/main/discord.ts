import { createRequire } from 'node:module';
import type { Client as DiscordClient, Presence } from 'discord-rpc';

const discordRequire = createRequire(import.meta.url);
const { Client } = discordRequire('discord-rpc') as typeof import('discord-rpc');

const clientId = '1376904142412316812';

export class DiscordRPCManager {
  private client: DiscordClient | null = null;
  private connectPromise: Promise<void> | null = null;
  private startTimestamp: Date | null = null;

  async connect(): Promise<void> {
    if (this.client) {
      return;
    }

    if (this.connectPromise) {
      await this.connectPromise;
      return;
    }

    this.connectPromise = this.createClient();

    try {
      await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }

  private async createClient(): Promise<void> {
    const client = new Client({ transport: 'ipc' });
    await client.login({ clientId });

    this.client = client;
    this.startTimestamp = new Date();
  }

  async updateActivity(stationName: string, tags?: string): Promise<void> {
    if (!this.client) {
      await this.connect();
    }

    if (!this.client) {
      return;
    }

    const presence: Presence = {
      details: `📻 ${stationName}`,
      state: tags ? `🎵 ${tags}` : undefined,
      startTimestamp: this.startTimestamp ?? new Date(),
      largeImageKey: 'radio_icon',
      largeImageText: 'Radioss - Internet Radio Player',
      buttons: [
        {
          label: '🔗 Get Radioss',
          url: 'https://github.com/DasCanard/radioss/releases'
        }
      ]
    };

    await this.client.setActivity(presence);
  }

  async clearActivity(): Promise<void> {
    if (this.client) {
      await this.client.clearActivity();
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.destroy();
    }

    this.client = null;
    this.connectPromise = null;
    this.startTimestamp = null;
  }
}

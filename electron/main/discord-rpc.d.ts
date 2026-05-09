declare module 'discord-rpc' {
  export interface PresenceButton {
    label: string;
    url: string;
  }

  export interface Presence {
    details?: string;
    state?: string;
    startTimestamp?: Date | number;
    largeImageKey?: string;
    largeImageText?: string;
    buttons?: PresenceButton[];
  }

  export class Client {
    constructor(options: { transport: 'ipc' });
    login(options: { clientId: string }): Promise<void>;
    setActivity(presence: Presence): Promise<void>;
    clearActivity(): Promise<void>;
    destroy(): void;
  }
}

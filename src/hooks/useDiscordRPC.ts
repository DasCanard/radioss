import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface DiscordRPCHook {
  connectDiscord: () => Promise<void>;
  updateActivity: (stationName: string, tags?: string[]) => Promise<void>;
  clearActivity: () => Promise<void>;
  disconnectDiscord: () => Promise<void>;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const useDiscordRPC = (
  enabled: boolean,
  setEnabled: (enabled: boolean) => void
): DiscordRPCHook => {
  const isConnectedRef = useRef(false);

  const connectDiscord = async (): Promise<void> => {
    if (!enabled) return;
    
    try {
      if (!isConnectedRef.current) {
        await invoke('discord_connect');
        isConnectedRef.current = true;
        console.log('Discord RPC connected successfully');
      }
    } catch (error) {
      console.error('Failed to connect Discord RPC:', error);
      // Fehler nicht weiterwerfen, da Discord RPC optional ist
    }
  };

  const updateActivity = async (stationName: string, tags?: string[]): Promise<void> => {
    if (!enabled) return;
    
    try {
      if (!isConnectedRef.current) {
        await connectDiscord();
      }
      
      const tagsString = tags?.length ? tags.slice(0, 3).join(' • ') : undefined;
      
      await invoke('discord_update_activity', {
        stationName,
        tags: tagsString
      });
      
      console.log('Discord activity updated:', stationName);
    } catch (error) {
      console.error('Failed to update Discord activity:', error);
    }
  };

  const clearActivity = async (): Promise<void> => {
    try {
      if (isConnectedRef.current) {
        await invoke('discord_clear_activity');
        console.log('Discord activity cleared');
      }
    } catch (error) {
      console.error('Failed to clear Discord activity:', error);
    }
  };

  const disconnectDiscord = async (): Promise<void> => {
    try {
      if (isConnectedRef.current) {
        await invoke('discord_disconnect');
        isConnectedRef.current = false;
        console.log('Discord RPC disconnected');
      }
    } catch (error) {
      console.error('Failed to disconnect Discord RPC:', error);
    }
  };

  // Cleanup beim Unmount oder wenn disabled
  useEffect(() => {
    if (!enabled && isConnectedRef.current) {
      disconnectDiscord();
    }
  }, [enabled]);

  useEffect(() => {
    return () => {
      if (isConnectedRef.current) {
        disconnectDiscord();
      }
    };
  }, []);

  return {
    connectDiscord,
    updateActivity,
    clearActivity,
    disconnectDiscord,
    isEnabled: enabled,
    setEnabled
  };
}; 
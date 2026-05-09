import { useCallback, useEffect, useRef } from 'react';

interface DiscordRPCHook {
  connectDiscord: () => Promise<void>;
  updateActivity: (stationName: string, tags?: string[]) => Promise<void>;
  clearActivity: () => Promise<void>;
  disconnectDiscord: () => Promise<void>;
  isEnabled: boolean;
}

export const useDiscordRPC = (
  enabled: boolean
): DiscordRPCHook => {
  const isConnectedRef = useRef(false);

  const connectDiscord = useCallback(async (): Promise<void> => {
    if (!enabled || !window.radioss) return;
    
    try {
      if (!isConnectedRef.current) {
        const connected = await window.radioss.discord.connect();
        isConnectedRef.current = connected;
        if (connected) {
          console.log('Discord RPC connected successfully');
        }
      }
    } catch (error) {
      console.error('Failed to connect Discord RPC:', error);
      // Fehler nicht weiterwerfen, da Discord RPC optional ist
    }
  }, [enabled]);

  const updateActivity = useCallback(async (stationName: string, tags?: string[]): Promise<void> => {
    if (!enabled || !window.radioss) return;
    
    try {
      if (!isConnectedRef.current) {
        await connectDiscord();
      }

      if (!isConnectedRef.current) {
        return;
      }
      
      const tagsString = tags?.length ? tags.slice(0, 3).join(' • ') : undefined;
      
      const updated = await window.radioss.discord.updateActivity(stationName, tagsString);
      isConnectedRef.current = updated;

      if (updated) {
        console.log('Discord activity updated:', stationName);
      }
    } catch (error) {
      console.error('Failed to update Discord activity:', error);
    }
  }, [connectDiscord, enabled]);

  const clearActivity = useCallback(async (): Promise<void> => {
    try {
      if (isConnectedRef.current) {
        await window.radioss?.discord.clearActivity();
        console.log('Discord activity cleared');
      }
    } catch (error) {
      console.error('Failed to clear Discord activity:', error);
    }
  }, []);

  const disconnectDiscord = useCallback(async (): Promise<void> => {
    try {
      if (isConnectedRef.current) {
        await window.radioss?.discord.disconnect();
        isConnectedRef.current = false;
        console.log('Discord RPC disconnected');
      }
    } catch (error) {
      console.error('Failed to disconnect Discord RPC:', error);
    }
  }, []);

  // Cleanup beim Unmount oder wenn disabled
  useEffect(() => {
    if (!enabled && isConnectedRef.current) {
      disconnectDiscord();
    }
  }, [disconnectDiscord, enabled]);

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
    isEnabled: enabled
  };
};

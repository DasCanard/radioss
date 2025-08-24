import { useState, useEffect, useCallback, SetStateAction, Dispatch } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function useFileStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from file on mount
  useEffect(() => {
    if (isLoaded) return; // Prevent multiple loads
    
    const loadData = async () => {
      console.log(`🔄 [useFileStorage] Loading ${key} from file...`);
      try {
        const data = await invoke('load_data', { dataType: key });
        if (data !== null) {
          console.log(`✅ [useFileStorage] Loaded ${key}:`, data);
          setStoredValue(data as T);
        } else {
          console.log(`⚠️  [useFileStorage] No data found for ${key}, using initial value:`, initialValue);
        }
      } catch (error) {
        console.error(`❌ [useFileStorage] Error loading ${key} from file:`, error);
        // Keep initial value if loading fails
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
  }, [key, isLoaded]); // Remove initialValue from dependencies

  // Save data to file
  const setValue: Dispatch<SetStateAction<T>> = useCallback((value) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    console.log(`💾 [useFileStorage] Saving ${key}:`, valueToStore);
    setStoredValue(valueToStore);
    
    // Save to file asynchronously
    invoke('save_data', { dataType: key, data: valueToStore })
      .then(() => {
        console.log(`✅ [useFileStorage] Successfully saved ${key}`);
      })
      .catch((error) => {
        console.error(`❌ [useFileStorage] Error saving ${key} to file:`, error);
      });
  }, [key, storedValue]);

  return [storedValue, setValue];
}

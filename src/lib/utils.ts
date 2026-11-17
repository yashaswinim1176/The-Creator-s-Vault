import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { get, set } from "idb-keyval";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const memoryStore: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    if (memoryStore[key] !== undefined) {
      return memoryStore[key];
    }
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) {
          memoryStore[key] = val; // Synchronize with memoryStore
          return val;
        }
      }
      return null;
    } catch (e) {
      console.warn("VAULT Storage: localStorage.getItem failed, using memory fallback.", e);
      return null;
    }
  },
  setItem(key: string, value: string): void {
    memoryStore[key] = value;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn("VAULT Storage: localStorage.setItem failed, using memory fallback.", e);
    }
  },
  removeItem(key: string): void {
    delete memoryStore[key];
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn("VAULT Storage: localStorage.removeItem failed, using memory fallback.", e);
    }
  }
};

export function safeJsonParse(value: string | null, fallback: any = []) {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (e) {
    console.error("VAULT Guard: Corrupted local storage value detected:", e);
    return fallback;
  }
}

// Async indexedDB wrapper for big PDF data
export const idbStorage = {
  async getVaultDomains(): Promise<any[]> {
    try {
      let data = await get('vault_domains') || [];
      const localData = safeJsonParse(safeStorage.getItem('vault_domains'), []);
      
      // Merge localStorage into IDB to prevent data loss if already partially migrated
      if (localData.length > 0) {
        let changed = false;
        const dataMap = new Map(data.map((d: any) => [d.id, d]));
        for (const ld of localData) {
          if (!dataMap.has(ld.id)) {
            dataMap.set(ld.id, ld);
            data.push(ld);
            changed = true;
          }
        }
        if (changed) {
          // Sort by date descending
          data.sort((a: any, b: any) => {
            const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dB - dA;
          });
          await idbStorage.saveVaultDomains(data);
        } else {
          // Ensure localStorage is up to date (stripping fileData)
          const metadataOnly = data.map((d: any) => { const copy = {...d}; delete copy.fileData; return copy; });
          safeStorage.setItem('vault_domains', JSON.stringify(metadataOnly));
        }
      }

      return data;
    } catch (e) {
      console.warn("Failed to get from idb", e);
      return safeJsonParse(safeStorage.getItem('vault_domains'), []);
    }
  },
  async saveVaultDomains(domains: any[]): Promise<void> {
    try {
      await set('vault_domains', domains);
      // Also set in safeStorage without fileData for synchronous readers like Analytics
      const metadataOnly = domains.map(d => {
        const copy = { ...d };
        delete copy.fileData;
        return copy;
      });
      safeStorage.setItem('vault_domains', JSON.stringify(metadataOnly));
    } catch (e) {
      console.warn("Failed to save to idb", e);
    }
  }
};



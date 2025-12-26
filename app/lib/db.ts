import { openDB, DBSchema } from 'idb';

interface SilentGuardianDB extends DBSchema {
  journals: {
    key: number;
    value: {
      id?: number;
      text: string;
      timestamp: number;
    };
    indexes: { 'by-date': number };
  };
  metrics: {
    key: number;
    value: {
      id?: number;
      pitchVariance: number;
      energyVariance: number;
      timestamp: number;
    };
    indexes: { 'by-date': number };
  };
  settings: {
    key: string;
    value: {
      key: string;
      value: any;
    };
  };
}

const DB_NAME = 'silent-guardian-db';
const DB_VERSION = 1;

async function getDB() {
  return openDB<SilentGuardianDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('journals')) {
        const store = db.createObjectStore('journals', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by-date', 'timestamp');
      }
      if (!db.objectStoreNames.contains('metrics')) {
        const store = db.createObjectStore('metrics', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by-date', 'timestamp');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });
}

export type JournalEntry = {
  id?: number;
  text: string;
  timestamp: number;
};

export type VoiceMetrics = {
  id?: number;
  pitchVariance: number;
  energyVariance: number;
  timestamp: number;
};

export type AppSettings = {
  mode: 'offline' | 'online';
};

/**
 * Save a new journal entry.
 */
export async function saveJournal(text: string): Promise<number> {
  const db = await getDB();
  return db.add('journals', {
    text,
    timestamp: Date.now(),
  });
}

/**
 * Get all journal entries sorted by date.
 */
export async function getJournals(): Promise<JournalEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('journals', 'by-date');
}

/**
 * Save voice stress metrics.
 */
export async function saveMetrics(pitchVariance: number, energyVariance: number): Promise<number> {
  const db = await getDB();
  return db.add('metrics', {
    pitchVariance,
    energyVariance,
    timestamp: Date.now(),
  });
}

/**
 * Get all voice metrics sorted by date.
 */
export async function getMetrics(): Promise<VoiceMetrics[]> {
  const db = await getDB();
  return db.getAllFromIndex('metrics', 'by-date');
}

/**
 * Save an app setting.
 * Example: saveSettings('mode', 'offline');
 */
export async function saveSettings(key: string, value: any): Promise<string> {
  const db = await getDB();
  await db.put('settings', { key, value });
  return key;
}

/**
 * Get an app setting by key.
 */
export async function getSettings(key: string): Promise<any> {
  const db = await getDB();
  const setting = await db.get('settings', key);
  return setting?.value;
}

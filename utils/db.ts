import { openDB, DBSchema } from 'idb';
import { Song } from '../types';

interface CyberTunesDB extends DBSchema {
  songs: {
    key: string;
    value: {
      id: string;
      title: string;
      file: Blob;
      size: number;
      addedAt: number;
    };
    indexes: { 'by-date': number };
  };
}

const DB_NAME = 'cyber_tunes_db';
const STORE_NAME = 'songs';

export const dbInit = async () => {
  return openDB<CyberTunesDB>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by-date', 'addedAt');
      }
    },
  });
};

export const getStorageUsage = async (): Promise<number> => {
  const db = await dbInit();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  let totalSize = 0;
  let cursor = await store.openCursor();

  while (cursor) {
    totalSize += cursor.value.size;
    cursor = await cursor.continue();
  }
  return totalSize;
};

export const saveSongToDB = async (file: File, maxBytes: number): Promise<Song | null> => {
  const currentUsage = await getStorageUsage();
  
  if (currentUsage + file.size > maxBytes) {
    throw new Error('STORAGE_LIMIT_EXCEEDED');
  }

  const db = await dbInit();
  const id = `local-${Date.now()}`;
  const songEntry = {
    id,
    title: file.name.replace(/\.[^/.]+$/, ""),
    file,
    size: file.size,
    addedAt: Date.now(),
  };

  await db.add(STORE_NAME, songEntry);

  // Generate a Blob URL for immediate playback
  const url = URL.createObjectURL(file);

  return {
    id,
    title: songEntry.title,
    artist: 'Local Track', // Default for uploaded files
    duration: 0, // Will be updated by audio element
    url,
    isLocal: true,
    size: file.size
  };
};

export const getAllSongsFromDB = async (): Promise<Song[]> => {
  const db = await dbInit();
  const allEntries = await db.getAllFromIndex(STORE_NAME, 'by-date');
  
  return allEntries.map(entry => ({
    id: entry.id,
    title: entry.title,
    artist: 'Local Track',
    duration: 0,
    url: URL.createObjectURL(entry.file), // Regenerate Blob URLs on load
    isLocal: true,
    size: entry.size
  }));
};

export const deleteSongFromDB = async (id: string) => {
  const db = await dbInit();
  await db.delete(STORE_NAME, id);
};

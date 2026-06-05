import type { AttendanceRecord, User } from '../../types';

export type StoredEmbedding = {
  userId: string;
  embedding: number[];
  encrypted: boolean;
  createdAt: string;
};

export type SyncQueueItem = {
  id: string;
  payload: object;
  status: 'pending' | 'done';
  createdAt: string;
};

type DatabaseState = {
  users: User[];
  embeddings: StoredEmbedding[];
  authEvents: AttendanceRecord[];
  syncQueue: SyncQueueItem[];
};

const db: DatabaseState = {
  users: [],
  embeddings: [],
  authEvents: [],
  syncQueue: [],
};

export const createLocalId = (prefix: string): string =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

export const initLocalDatabase = (): void => {
  // The in-memory backing store is ready on module load. Keep this as the
  // single bootstrap point so a native SQLite adapter can replace it later.
};

export const addUser = (user: User): void => {
  const existingIndex = db.users.findIndex((item) => item.id === user.id);
  if (existingIndex >= 0) {
    db.users[existingIndex] = user;
    return;
  }

  db.users.push(user);
};

export const getAllUsers = (): User[] => [...db.users];

export const storeEmbedding = (
  userId: string,
  embedding: number[],
  encrypted = true,
): void => {
  const existingIndex = db.embeddings.findIndex((item) => item.userId === userId);
  const row: StoredEmbedding = {
    userId,
    embedding,
    encrypted,
    createdAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    db.embeddings[existingIndex] = row;
    return;
  }

  db.embeddings.push(row);
};

export const getAllEmbeddings = (): StoredEmbedding[] =>
  db.embeddings.map((item) => ({ ...item, embedding: [...item.embedding] }));

export const logAuthEvent = (record: AttendanceRecord): void => {
  db.authEvents.unshift(record);
};

export const getAllAuthEvents = (): AttendanceRecord[] => [...db.authEvents];

export const enqueueSync = (payload: object): void => {
  db.syncQueue.push({
    id: createLocalId('sync'),
    payload,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
};

export const getPendingSyncs = (): SyncQueueItem[] =>
  db.syncQueue.filter((item) => item.status === 'pending');


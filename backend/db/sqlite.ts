export type UserRow = {
  id: string;
  name: string;
  created_at: string;
};

export type EmbeddingRow = {
  user_id: string;
  embedding: string;
  encrypted: number;
};

export type AuthEventRow = {
  id: string;
  user_id: string;
  confidence: number;
  liveness_passed: number;
  device_id: string;
  timestamp: string;
  synced: number;
};

export type SyncQueueRow = {
  id: string;
  payload: string;
  status: 'pending' | 'done';
  created_at: string;
};

export type LocalDB = {
  users: UserRow[];
  embeddings: EmbeddingRow[];
  auth_events: AuthEventRow[];
  sync_queue: SyncQueueRow[];
};

const dbInstance: LocalDB = {
  users: [],
  embeddings: [],
  auth_events: [],
  sync_queue: [],
};

export const getDB = (): LocalDB => dbInstance;

import { getDB } from '../sqlite';

const createId = (): string =>
  `sync_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

export const enqueueSync = (payload: object): void => {
  const db = getDB();
  db.sync_queue.push({
    id: createId(),
    payload: JSON.stringify(payload),
    status: 'pending',
    created_at: new Date().toISOString(),
  });
};

export const getPendingSyncs = (): any[] => {
  const db = getDB();
  return db.sync_queue.filter((item) => item.status === 'pending');
};

export const markQueueItemDone = (id: string): void => {
  const db = getDB();
  const queueItem = db.sync_queue.find((item) => item.id === id);
  if (queueItem) queueItem.status = 'done';
};

export const purgeDoneItems = (): void => {
  const db = getDB();
  db.sync_queue = db.sync_queue.filter((item) => item.status === 'pending');
};

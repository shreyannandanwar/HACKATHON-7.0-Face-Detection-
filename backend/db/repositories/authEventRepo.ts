import { getDB } from '../sqlite';

const createId = (): string =>
  `auth_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

export const logAuthEvent = (
  userId: string,
  confidence: number,
  livenessPassed: boolean,
  deviceId: string
): void => {
  const db = getDB();
  db.auth_events.unshift({
    id: createId(),
    user_id: userId,
    confidence,
    liveness_passed: livenessPassed ? 1 : 0,
    device_id: deviceId,
    timestamp: new Date().toISOString(),
    synced: 0,
  });
};

export const getUnsyncedEvents = (): any[] => {
  const db = getDB();
  return db.auth_events.filter((event) => event.synced === 0);
};

export const markEventSynced = (id: string): void => {
  const db = getDB();
  const event = db.auth_events.find((item) => item.id === id);
  if (event) event.synced = 1;
};

export const deleteSyncedEvents = (): void => {
  const db = getDB();
  db.auth_events = db.auth_events.filter((event) => event.synced === 0);
};

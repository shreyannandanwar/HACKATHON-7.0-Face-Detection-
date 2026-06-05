import { getDB } from './sqlite';

export const initDB = (): void => {
  getDB();
  console.log('[DB] Schema initialized');
};

import { getDB } from '../sqlite';

export const addUser = (id: string, name: string): void => {
  const db = getDB();
  if (db.users.some((user) => user.id === id)) return;

  db.users.push({
    id,
    name,
    created_at: new Date().toISOString(),
  });
  console.log(`[userRepo] Added user: ${name}`);
};

export const getAllUsers = (): any[] => {
  const db = getDB();
  return [...db.users];
};

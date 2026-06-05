import { getDB } from '../sqlite';

export const storeEmbedding = (
  userId: string,
  embeddingBase64: string,
  isEncrypted: boolean = true
): void => {
  const db = getDB();
  const row = {
    user_id: userId,
    embedding: embeddingBase64,
    encrypted: isEncrypted ? 1 : 0,
  };
  const existingIndex = db.embeddings.findIndex((item) => item.user_id === userId);

  if (existingIndex >= 0) {
    db.embeddings[existingIndex] = row;
    return;
  }

  db.embeddings.push(row);
};

export const getEmbeddingForUser = (userId: string): string | null => {
  const db = getDB();
  const row = db.embeddings.find((item) => item.user_id === userId);
  return row ? row.embedding : null;
};

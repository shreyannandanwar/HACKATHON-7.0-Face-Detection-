import { ENV } from '../../config/env';
import type { AttendanceRecord, User } from '../../types';
import {
  addUser,
  createLocalId,
  enqueueSync,
  getAllAuthEvents,
  getAllEmbeddings,
  getAllUsers,
  initLocalDatabase,
  logAuthEvent,
  storeEmbedding,
} from './localDatabase';

export type EnrollmentRequest = {
  name: string;
  embedding: number[];
};

export type EnrollmentResponse = {
  user: User;
  saved: true;
};

export type VerificationRequest = {
  embedding: number[];
  livenessPassed: boolean;
  deviceId: string;
};

export type VerificationResponse = {
  status: AttendanceRecord['status'];
  confidence: number;
  livenessPassed: boolean;
  user: User | null;
  record: AttendanceRecord;
  message: string;
};

const postJson = async <ResponseBody,>(
  path: '/enroll' | '/verify',
  payload: object,
): Promise<ResponseBody | null> => {
  if (!ENV.BACKEND_URL) return null;

  try {
    const response = await fetch(`${ENV.BACKEND_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return null;
    return await response.json() as ResponseBody;
  } catch (error) {
    if (__DEV__) {
      console.warn('[FaceAuthBackend] API fallback:', error);
    }
    return null;
  }
};

const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;

  let dot = 0;
  let aMagnitude = 0;
  let bMagnitude = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    aMagnitude += a[index] * a[index];
    bMagnitude += b[index] * b[index];
  }

  if (aMagnitude === 0 || bMagnitude === 0) return 0;
  return dot / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude));
};

const findBestMatch = (embedding: number[]): { user: User; confidence: number } | null => {
  const embeddings = getAllEmbeddings();
  const users = getAllUsers();
  let bestMatch: { user: User; confidence: number } | null = null;

  embeddings.forEach((storedEmbedding) => {
    const user = users.find((item) => item.id === storedEmbedding.userId);
    if (!user) return;

    const confidence = cosineSimilarity(embedding, storedEmbedding.embedding);
    if (!bestMatch || confidence > bestMatch.confidence) {
      bestMatch = { user, confidence };
    }
  });

  return bestMatch;
};

export const enrollFace = async ({
  name,
  embedding,
}: EnrollmentRequest): Promise<EnrollmentResponse> => {
  const apiResponse = await postJson<EnrollmentResponse>('/enroll', { name, embedding });
  if (apiResponse) return apiResponse;

  initLocalDatabase();

  const now = new Date().toISOString();
  const user: User = {
    id: createLocalId('user'),
    name,
    enrolledAt: now,
  };

  addUser(user);
  storeEmbedding(user.id, embedding, true);

  return { user, saved: true };
};

export const verifyFace = async ({
  embedding,
  livenessPassed,
  deviceId,
}: VerificationRequest): Promise<VerificationResponse> => {
  const apiResponse = await postJson<VerificationResponse>('/verify', {
    embedding,
    livenessPassed,
    deviceId,
  });
  if (apiResponse) return apiResponse;

  initLocalDatabase();

  const bestMatch = livenessPassed ? findBestMatch(embedding) : null;
  const threshold = ENV.FACE_MATCH_THRESHOLD;
  const isRecognized = Boolean(bestMatch && bestMatch.confidence >= threshold);
  const user = isRecognized && bestMatch ? bestMatch.user : null;
  const confidence = bestMatch?.confidence ?? 0;
  const timestamp = new Date().toISOString();
  const status: AttendanceRecord['status'] =
    livenessPassed && isRecognized ? 'SUCCESS' : 'FAILED';

  const record: AttendanceRecord = {
    id: createLocalId('auth'),
    userId: user?.id ?? 'UNKNOWN',
    userName: user?.name ?? 'Unknown User',
    timestamp,
    status,
    confidence,
    livenessPassed,
    deviceId,
  };

  logAuthEvent(record);
  enqueueSync({
    userId: record.userId,
    confidence,
    livenessPassed,
    deviceId,
    timestamp,
    status,
  });

  return {
    status,
    confidence,
    livenessPassed,
    user,
    record,
    message: status === 'SUCCESS'
      ? `Verified ${user?.name ?? 'user'}`
      : livenessPassed
        ? 'No matching enrolled face found'
        : 'Liveness verification failed',
  };
};

export const getFaceAuthSnapshot = (): {
  users: User[];
  attendanceRecords: AttendanceRecord[];
} => ({
  users: getAllUsers(),
  attendanceRecords: getAllAuthEvents(),
});

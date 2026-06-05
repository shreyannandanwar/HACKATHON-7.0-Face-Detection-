import type { DetectedFaceResult, LivenessFrame } from '../../types';

const EMBEDDING_SIZE = 128;

const normalizeVector = (values: number[]): number[] => {
  const magnitude = Math.sqrt(values.reduce((total, value) => total + value * value, 0));
  if (magnitude === 0) return values;
  return values.map((value) => value / magnitude);
};

export const createEmbeddingFromModelOutput = (embedding: number[]): number[] => {
  if (embedding.length !== EMBEDDING_SIZE) {
    throw new Error(`Expected ${EMBEDDING_SIZE}-dimension face embedding`);
  }

  return normalizeVector(embedding);
};

export const createEmbeddingFromDetectionSignal = (
  face: DetectedFaceResult,
  livenessFrame?: LivenessFrame,
): number[] => {
  const seed = [
    face.imageBounds.x,
    face.imageBounds.y,
    face.imageBounds.width,
    face.imageBounds.height,
    face.rotationX,
    face.rotationY,
    face.rotationZ,
    livenessFrame?.leftEyeOpenProb ?? 1,
    livenessFrame?.rightEyeOpenProb ?? 1,
    livenessFrame?.smilingProb ?? 0,
  ];

  const values = Array.from({ length: EMBEDDING_SIZE }, (_, index) => {
    const value = seed[index % seed.length];
    const wave = Math.sin((value + index + 1) * 0.017) + Math.cos((value + index + 3) * 0.013);
    return wave;
  });

  return normalizeVector(values);
};


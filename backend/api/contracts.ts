// What ML team (Team C) sends after recognition
export interface RecognitionOutput {
  userId: string;
  confidence: number;
  livenessPassed: boolean;
}

export interface EnrollmentInput {
  name: string;
  embedding: number[];
}

export interface EnrollmentOutput {
  userId: string;
  name: string;
  saved: boolean;
  timestamp: string;
}

export interface VerificationInput {
  embedding: number[];
  livenessPassed: boolean;
  deviceId: string;
}

export interface VerificationOutput {
  userId: string | null;
  name: string | null;
  confidence: number;
  livenessPassed: boolean;
  status: 'SUCCESS' | 'FAILED';
  timestamp: string;
}

// What gets queued and sent to AWS
export interface SyncPayload {
  userId: string;
  confidence: number;
  livenessPassed: boolean;
  deviceId: string;
  timestamp: string;
}

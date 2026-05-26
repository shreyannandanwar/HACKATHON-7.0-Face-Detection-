export interface User {
  id: string;
  name: string;
  enrolledAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
}

export type RootStackParamList = {
  Home: undefined;
  Camera: { mode: 'ENROLL' | 'VERIFY' };
  Enrollment: undefined;
  Verification: undefined;
  AttendanceHistory: undefined;
  Settings: undefined;
};

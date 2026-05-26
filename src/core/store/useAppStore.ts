import { create } from 'zustand';
import { User, AttendanceRecord } from '../../types';

interface AppState {
  users: User[];
  attendanceRecords: AttendanceRecord[];
  isCameraReady: boolean;
  enrollUser: (user: User) => void;
  recordAttendance: (record: AttendanceRecord) => void;
  setCameraReady: (ready: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  users: [],
  attendanceRecords: [],
  isCameraReady: false,
  enrollUser: (user) => set((state) => ({ users: [...state.users, user] })),
  recordAttendance: (record) =>
    set((state) => ({ attendanceRecords: [...state.attendanceRecords, record] })),
  setCameraReady: (ready) => set({ isCameraReady: ready }),
}));

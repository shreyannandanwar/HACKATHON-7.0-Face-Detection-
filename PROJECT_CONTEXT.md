# Project Context

## Project Goal
Build an offline-first facial recognition and liveness detection mobile application for Android/iOS using React Native.

## Core Constraints
- React Native CLI ONLY (NOT Expo)
- Android-first development
- Offline-first architecture
- Future support for:
  - VisionCamera
  - MediaPipe
  - TensorFlow Lite
  - SQLite
- Must remain lightweight and hackathon-friendly
- Production-style but minimal architecture
- TypeScript everywhere

## Setup Instructions
1. Clone the repository
2. Run `npm install` to install dependencies
3. (Optional, Mac only) For iOS, run `cd ios && pod install && cd ..`
4. Run `npm run start` to start Metro
5. Run `npx react-native run-android` to launch the Android emulator

## Recent Changes
- Initialized React Native CLI TypeScript project (v0.85).
- Setup React Navigation with Native Stack.
- Configured Zustand for state management (`useAppStore`).
- Configured reusable UI component library (`Button`, `Card`, `Typography`).
- Created initial screen templates (`Home`, `Camera`, `Enrollment`, `Verification`, `AttendanceHistory`, `Settings`).
- Configured Android permissions in `AndroidManifest.xml` for Camera and Storage.
- Integrated `react-native-vision-camera` for stable realtime camera preview.
- Bumped `minSdkVersion` to 26 for VisionCamera compatibility.
- Implemented `useCameraSetup` hook for permission and device management.
- Implemented `CameraOverlay` for UI guides during camera operations.
- Established `src/core/ml/frameProcessor.ts` architecture placeholder.

## Dependencies Added
- `react-native-vision-camera`: Native camera infrastructure.

## Known Issues
- VisionCamera frame processors are not yet implemented (waiting for TFLite/MediaPipe integration).
- `react-native-worklets-core` must be installed before implementing frame processors.
- No local persistent DB implemented yet (Zustand state is transient for now).

## Architecture Decisions
- Used `zustand` over `redux` for minimalistic global state.
- Structured code by domain features inside `src/`.
- Decoupled configuration to `src/config/env.ts` for future env setups.
- Abstracted camera permission and device querying logic into `src/hooks/useCameraSetup.ts` to keep `CameraScreen` purely presentation-focused.

## Pending Tasks
- Implement real SQLite adapter for persistence.
- Integrate MediaPipe/TFLite for facial recognition and liveness via frame processors.
- Update `CameraOverlay` to map bounding boxes and facial landmarks to screen coordinates.

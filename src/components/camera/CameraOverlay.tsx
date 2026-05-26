import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';

type Props = {
  mode: 'ENROLL' | 'VERIFY';
  // Future props for bounding boxes, landmarks, etc.
  // faceBounds?: { x: number, y: number, width: number, height: number }
};

export const CameraOverlay: React.FC<Props> = ({ mode }) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.header}>
        <Typography variant="h3" style={styles.headerText}>
          {mode === 'ENROLL' ? 'Position face in frame' : 'Verifying Identity...'}
        </Typography>
      </View>

      {/* Guide frame to help user position their face */}
      <View style={styles.guideContainer}>
        <View style={styles.guideFrame} />
      </View>

      <View style={styles.footer}>
        <Typography variant="body" style={styles.footerText}>
          Please hold still
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    zIndex: 10,
  },
  headerText: {
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  guideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideFrame: {
    width: 250,
    height: 350,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 150, // Oval shape for face
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

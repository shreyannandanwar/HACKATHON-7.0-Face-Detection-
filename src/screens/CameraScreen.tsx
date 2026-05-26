import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useIsFocused } from '@react-navigation/native';
import { Camera } from 'react-native-vision-camera';

import { RootStackParamList } from '../types';
import { Button } from '../components/ui/Button';
import { Typography } from '../components/ui/Typography';
import { useCameraSetup } from '../hooks/useCameraSetup';
import { CameraOverlay } from '../components/camera/CameraOverlay';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Camera'>;
  route: RouteProp<RootStackParamList, 'Camera'>;
};

export const CameraScreen: React.FC<Props> = ({ navigation, route }) => {
  const { mode } = route.params;
  const isFocused = useIsFocused();
  const { hasPermission, requestPermission, device } = useCameraSetup();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Initial permission check logic
    if (!hasPermission) {
      requestPermission().finally(() => setIsInitializing(false));
    } else {
      setIsInitializing(false);
    }
  }, [hasPermission, requestPermission]);

  if (isInitializing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#fff" />
        <Typography style={{ color: '#fff', marginTop: 16 }}>
          Initializing Camera...
        </Typography>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Typography variant="h3" style={{ color: '#fff', marginBottom: 16 }}>
          Camera Permission Required
        </Typography>
        <Typography style={{ color: '#999', marginBottom: 32, textAlign: 'center' }}>
          This app requires camera access to perform facial recognition and liveness detection.
        </Typography>
        <Button title="Grant Permission" onPress={requestPermission} />
        <Button 
          title="Go Back" 
          variant="secondary" 
          onPress={() => navigation.goBack()} 
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Typography variant="h3" style={{ color: '#fff', marginBottom: 16 }}>
          No Camera Device Found
        </Typography>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused}
        pixelFormat="yuv" // Standard format for ML processing
      />
      
      <CameraOverlay mode={mode} />

      <View style={styles.bottomControls}>
        <Button
          title="Simulate Capture"
          onPress={() => navigation.goBack()}
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    zIndex: 20, // Ensure it sits above the overlay
  },
  button: {
    width: '100%',
  },
});

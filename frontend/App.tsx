import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { getFaceAuthSnapshot } from './src/core/backend/faceAuthBackend';
import { useAppStore } from './src/core/store/useAppStore';

function App(): React.JSX.Element {
  React.useEffect(() => {
    const { users, attendanceRecords } = getFaceAuthSnapshot();
    useAppStore.getState().hydrateRecords(users, attendanceRecords);
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;

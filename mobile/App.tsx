// import { StatusBar } from 'expo-status-bar';
// import { StyleSheet, Text, View } from 'react-native';

// export default function App() {
//   return (
//     <View style={styles.container}>
//       <Text>Open up App.tsx to start working on your app!</Text>
//       <StatusBar style="auto" />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });


import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { initDB } from './backend/db/schema';
import { addUser, getAllUsers } from './backend/db/repositories/userRepo';
import { logAuthEvent, getUnsyncedEvents } from './backend/db/repositories/authEventRepo';
import { enqueueSync, getPendingSyncs } from './backend/db/repositories/syncQueueRepo';

export default function App() {
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  useEffect(() => {
    try {
      initDB();
      addLog('✅ DB initialized');

      addUser('user-001', 'Rahul');
      const users = getAllUsers();
      addLog(`✅ Users: ${JSON.stringify(users)}`);

      logAuthEvent('user-001', 0.97, true, 'device-abc');
      const events = getUnsyncedEvents();
      addLog(`✅ Auth events: ${events.length}`);

      enqueueSync({ userId: 'user-001', confidence: 0.97 });
      const queue = getPendingSyncs();
      addLog(`✅ Queue: ${queue.length} pending`);

      addLog('🎉 BE-1 PASSED on device!');
    } catch (e: any) {
      addLog(`❌ ERROR: ${e.message}`);
    }
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>BE-1 Test</Text>
      {log.map((line, i) => (
        <Text key={i} style={styles.line}>{line}</Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#000' },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  line: { color: '#0f0', fontFamily: 'monospace', marginBottom: 8 },
});
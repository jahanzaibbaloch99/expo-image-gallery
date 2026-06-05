import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import Gallery from 'expo-image-gallery';

const IMAGES = [
  'https://picsum.photos/id/10/1200/900',
  'https://picsum.photos/id/20/900/1200',
];

export default function ScaleEventsScreen() {
  const [scale, setScale] = useState(1);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) =>
    setLog((prev) => [msg, ...prev].slice(0, 6));

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Scale Events', headerShown: false }} />

      <Gallery
        data={IMAGES}
        onScaleChange={setScale}
        onScaleChangeRange={{ start: 1, end: 6 }}
        onScaleStart={(s) => addLog(`scaleStart: ${s.toFixed(2)}`)}
        onScaleEnd={(s) => addLog(`scaleEnd: ${s.toFixed(2)}`)}
        onDoubleTap={(toScale) => addLog(`doubleTap → ${toScale.toFixed(2)}`)}
        onTap={() => addLog('tap')}
        onLongPress={() => addLog('longPress')}
        onPanStart={() => addLog('panStart')}
      />

      <View style={styles.overlay}>
        <Text style={styles.scaleText}>Scale: {scale.toFixed(2)}×</Text>
        {log.map((entry, i) => (
          <Text key={i} style={[styles.logEntry, { opacity: 1 - i * 0.15 }]}>
            {entry}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 12,
    minWidth: 180,
  },
  scaleText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  logEntry: { color: '#aaa', fontSize: 12, marginTop: 3 },
});

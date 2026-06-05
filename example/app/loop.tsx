// ─── Loop Mode ───────────────────────────────────────────────────────────────

import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import Gallery from 'expo-image-gallery';

const IMAGES = [
  'https://picsum.photos/id/10/1200/900',
  'https://picsum.photos/id/20/900/1200',
  'https://picsum.photos/id/30/1200/800',
];

export default function LoopScreen() {
  const [index, setIndex] = useState(0);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Loop Mode', headerShown: false }} />
      <Gallery
        data={IMAGES}
        loop
        onIndexChange={setIndex}
      />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>∞ Loop</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  badge: {
    position: 'absolute',
    top: 20,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: '#fff', fontSize: 13 },
});

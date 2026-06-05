import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Gallery from 'expo-image-gallery';

const IMAGES = [
  'https://picsum.photos/id/10/1200/900',
  'https://picsum.photos/id/20/900/1200',
  'https://picsum.photos/id/30/1200/800',
];

export default function SwipeCloseScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Swipe to Close', headerShown: false }} />
      <Gallery
        data={IMAGES}
        onSwipeToClose={() => {
          router.back();
        }}
      />
      <View style={styles.hint}>
        <Text style={styles.hintText}>Swipe up or down to go back</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  hint: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  hintText: { color: '#aaa', fontSize: 13 },
});

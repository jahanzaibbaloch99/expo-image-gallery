import { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import Gallery from 'expo-image-gallery';
import type { GalleryRef } from 'expo-image-gallery';

const IMAGES = [
  'https://picsum.photos/id/10/1200/900',
  'https://picsum.photos/id/20/900/1200',
  'https://picsum.photos/id/30/1200/800',
  'https://picsum.photos/id/40/800/1200',
];

export default function RefApiScreen() {
  const galleryRef = useRef<GalleryRef>(null);
  const [index, setIndex] = useState(0);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Ref API', headerShown: false }} />

      <Gallery
        ref={galleryRef}
        data={IMAGES}
        onIndexChange={setIndex}
      />

      <View style={styles.toolbar}>
        <Pressable
          style={styles.btn}
          onPress={() => galleryRef.current?.setIndex(0)}
        >
          <Text style={styles.btnText}>⏮ First</Text>
        </Pressable>

        <Pressable
          style={styles.btn}
          onPress={() =>
            galleryRef.current?.setIndex(Math.max(0, index - 1))
          }
        >
          <Text style={styles.btnText}>◀ Prev</Text>
        </Pressable>

        <Pressable
          style={styles.btn}
          onPress={() => galleryRef.current?.reset()}
        >
          <Text style={styles.btnText}>↺ Reset</Text>
        </Pressable>

        <Pressable
          style={styles.btn}
          onPress={() =>
            galleryRef.current?.setIndex(Math.min(IMAGES.length - 1, index + 1))
          }
        >
          <Text style={styles.btnText}>Next ▶</Text>
        </Pressable>

        <Pressable
          style={styles.btn}
          onPress={() => galleryRef.current?.setIndex(IMAGES.length - 1)}
        >
          <Text style={styles.btnText}>Last ⏭</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  toolbar: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  btn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});

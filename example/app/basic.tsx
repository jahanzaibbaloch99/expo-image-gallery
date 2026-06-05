import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import Gallery from 'expo-image-gallery';

const IMAGES = [
  'https://picsum.photos/id/10/1200/900',
  'https://picsum.photos/id/20/900/1200',
  'https://picsum.photos/id/30/1200/800',
  'https://picsum.photos/id/40/800/1200',
  'https://picsum.photos/id/50/1000/800',
];

export default function BasicGallery() {
  const [index, setIndex] = useState(0);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Basic Gallery', headerShown: false }} />
      <Gallery
        data={IMAGES}
        onIndexChange={setIndex}
        onTap={() => console.log('tapped')}
      />
      <View style={styles.overlay}>
        <Text style={styles.counter}>
          {index + 1} / {IMAGES.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  counter: { color: '#fff', fontSize: 15, fontWeight: '500' },
});

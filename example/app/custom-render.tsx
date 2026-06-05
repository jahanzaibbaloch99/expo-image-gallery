import { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { Image } from 'expo-image';
import Gallery from 'expo-image-gallery';
import type { RenderItemInfo } from 'expo-image-gallery';

type Item = {
  uri: string;
  blurhash: string;
  caption: string;
};

const ITEMS: Item[] = [
  {
    uri: 'https://picsum.photos/id/10/1200/900',
    blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
    caption: 'Forest trail',
  },
  {
    uri: 'https://picsum.photos/id/20/900/1200',
    blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.',
    caption: 'Mountain lake',
  },
  {
    uri: 'https://picsum.photos/id/30/1200/800',
    blurhash: 'LKO2:N%2Tw=w]~RBVZRi};RPxuwH',
    caption: 'Sunset coast',
  },
];

function renderItem({ item, setImageDimensions }: RenderItemInfo<Item>) {
  return (
    <Image
      source={{ uri: item.uri }}
      placeholder={{ blurhash: item.blurhash }}
      style={StyleSheet.absoluteFillObject}
      contentFit="contain"
      transition={400}
      onLoad={(e) => {
        const { width, height } = e.source;
        setImageDimensions({ width, height });
      }}
    />
  );
}

export default function CustomRenderScreen() {
  const [index, setIndex] = useState(0);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'expo-image', headerShown: false }} />
      <Gallery
        data={ITEMS}
        renderItem={renderItem}
        onIndexChange={setIndex}
      />
      <View style={styles.caption}>
        <Text style={styles.captionText}>{ITEMS[index]?.caption}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  caption: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  captionText: { color: '#fff', fontSize: 15 },
});

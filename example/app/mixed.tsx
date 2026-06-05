import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Image } from 'expo-image';
import Gallery from 'expo-image-gallery';
import type { RenderItemInfo } from 'expo-image-gallery';

type MediaItem = {
  id: string;
  uri: string;
  title: string;
  photographer: string;
};

const MEDIA: MediaItem[] = [
  {
    id: '1',
    uri: 'https://picsum.photos/id/10/1200/900',
    title: 'Forest Path',
    photographer: 'John Doe',
  },
  {
    id: '2',
    uri: 'https://picsum.photos/id/20/900/1200',
    title: 'Mountain Lake',
    photographer: 'Jane Smith',
  },
  {
    id: '3',
    uri: 'https://picsum.photos/id/30/1200/800',
    title: 'Coastal Sunset',
    photographer: 'Alex Ray',
  },
  {
    id: '4',
    uri: 'https://picsum.photos/id/40/800/1200',
    title: 'Desert Dunes',
    photographer: 'Sara Lee',
  },
];

function renderItem({ item, setImageDimensions }: RenderItemInfo<MediaItem>) {
  return (
    <Image
      source={{ uri: item.uri }}
      style={StyleSheet.absoluteFillObject}
      contentFit="contain"
      onLoad={(e) =>
        setImageDimensions({
          width: e.source.width,
          height: e.source.height,
        })
      }
    />
  );
}

export default function MixedScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Mixed Media', headerShown: false }} />
      <Gallery
        data={MEDIA}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});

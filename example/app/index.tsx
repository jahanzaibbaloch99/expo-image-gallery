import { Link } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

type Demo = {
  title: string;
  description: string;
  route: string;
};

const DEMOS: Demo[] = [
  {
    title: 'Basic Gallery',
    description: 'Simple URL string array. Default config.',
    route: '/basic',
  },
  {
    title: 'Custom renderItem (expo-image)',
    description: 'Custom renderer using expo-image for caching & blurhash.',
    route: '/custom-render',
  },
  {
    title: 'Loop Mode',
    description: 'Infinite looping gallery.',
    route: '/loop',
  },
  {
    title: 'Swipe to Close',
    description: 'Vertical swipe triggers onSwipeToClose.',
    route: '/swipe-close',
  },
  {
    title: 'Ref API',
    description: 'setIndex() and reset() via GalleryRef.',
    route: '/ref-api',
  },
  {
    title: 'Scale Events',
    description: 'onScaleStart, onScaleEnd, onScaleChange callbacks.',
    route: '/scale-events',
  },
  {
    title: 'Mixed Media',
    description: 'Object array with custom renderItem.',
    route: '/mixed',
  },
];

export default function Home() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.header}>expo-image-gallery</Text>
      <Text style={styles.sub}>
        Performant image gallery for Expo
      </Text>
      <Text style={styles.version}>
        Expo SDK 56 · Reanimated v4 · Gesture Handler v3
      </Text>
      <ScrollView contentContainerStyle={styles.list}>
        {DEMOS.map((demo) => (
          <Link key={demo.route} href={demo.route as any} asChild>
            <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <Text style={styles.cardTitle}>{demo.title}</Text>
              <Text style={styles.cardDesc}>{demo.description}</Text>
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 16,
  },
  header: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 20,
  },
  sub: {
    color: '#aaa',
    fontSize: 14,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  version: {
    color: '#555',
    fontSize: 12,
    paddingHorizontal: 20,
    marginTop: 2,
    marginBottom: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  pressed: {
    opacity: 0.6,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cardDesc: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
  },
});

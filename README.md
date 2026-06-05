# expo-image-gallery

[![npm version](https://img.shields.io/npm/v/expo-image-gallery.svg)](https://www.npmjs.com/package/expo-image-gallery)
[![CI](https://github.com/jahanzaibbaloch99/expo-image-gallery/actions/workflows/ci.yml/badge.svg)](https://github.com/jahanzaibbaloch99/expo-image-gallery/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**Performant, native-feeling image gallery for Expo and React Native.**

A performant, fully-customizable image gallery built for the modern Expo stack:

| Feature | This library |
|---|---|
| Expo SDK | **50+** |
| React Native | **0.73+** |
| React | **18.2+** |
| Reanimated | **v4** |
| Gesture Handler | **2.14+** |
| TypeScript | Full types, no `any` |

---

## Features

- 🔍 Pinch-to-zoom with rubber-band effect
- 👆 Double-tap to zoom (tap-point-aware)
- 📱 Native iOS rubber-band & decay pan physics
- ↔️ Swipe left/right to navigate
- ↕️ Swipe up/down to close
- 🔁 Infinite loop mode
- 🎨 Fully customizable via `renderItem`
- 📐 Portrait & landscape support
- 🔗 Imperative `ref` API (`setIndex`, `reset`)
- 📊 Rich gesture callbacks
- ✅ RTL support

---

## Installation

```bash
npx expo install expo-image-gallery react-native-reanimated react-native-gesture-handler react-native-worklets
```

> **Note:** `react-native-worklets` is a required peer dependency of Reanimated v4.

### babel.config.js

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for Reanimated v4 worklets
      'react-native-worklets/plugin',
    ],
  };
};
```

### Wrap your root with GestureHandlerRootView

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* your app */}
    </GestureHandlerRootView>
  );
}
```

> With Expo Router, put `GestureHandlerRootView` in your root `_layout.tsx`.

---

## Quick start

```tsx
import Gallery from 'expo-image-gallery';

const images = [
  'https://example.com/photo1.jpg',
  'https://example.com/photo2.jpg',
];

export default function App() {
  return (
    <Gallery
      data={images}
      onIndexChange={(index) => console.log('active:', index)}
    />
  );
}
```

---

---

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `T[]` | — | Items to render |
| `renderItem` | `(info: RenderItemInfo<T>) => ReactElement` | Built-in `<Image>` | Custom render. **Must call** `setImageDimensions({ width, height })` after load |
| `keyExtractor` | `(item: T, index: number) => string \| number` | Uses `id`, `key`, or `_id` | Unique key per item |
| `initialIndex` | `number` | `0` | Starting item |
| `onIndexChange` | `(index: number) => void` | — | Called on active item change |
| `numToRender` | `number` | `5` | Simultaneous rendered items |
| `emptySpaceWidth` | `number` | `30` | Horizontal gap between items (pts) |
| `doubleTapScale` | `number` | `3` | Scale on double-tap |
| `doubleTapInterval` | `number` | `500` | ms window to detect double-tap |
| `maxScale` | `number` | `6` | Maximum pinch scale |
| `pinchEnabled` | `boolean` | `true` | Enable pinch-to-zoom |
| `swipeEnabled` | `boolean` | `true` | Enable pan gesture |
| `doubleTapEnabled` | `boolean` | `true` | Enable double-tap |
| `disableTransitionOnScaledImage` | `boolean` | `false` | Block item navigation when scale > 1 |
| `hideAdjacentImagesOnScaledImage` | `boolean` | `false` | Hide neighbours when scale > 1 |
| `disableVerticalSwipe` | `boolean` | `false` | Disable vertical swipe-to-close |
| `disableSwipeUp` | `boolean` | `false` | Disable swipe-up-to-close only |
| `loop` | `boolean` | `false` | Infinite loop (needs `data.length > 1`) |
| `onScaleChange` | `(scale: number) => void` | — | Fired on scale change |
| `onScaleChangeRange` | `{ start: number; end: number }` | — | Range filter for `onScaleChange` |
| `containerDimensions` | `{ width: number; height: number }` | `useWindowDimensions()` | Override container size |
| `style` | `ViewStyle` | — | Root container style |

---

## Events

| Event | Signature | Description |
|---|---|---|
| `onSwipeToClose` | `() => void` | User swiped far enough to close |
| `onTranslationYChange` | `(y: number, shouldClose: boolean) => void` | Worklet: called during vertical drag |
| `onTap` | `() => void` | Single tap |
| `onDoubleTap` | `(toScale: number) => void` | Double-tap |
| `onLongPress` | `() => void` | Long press |
| `onScaleStart` | `(scale: number) => void` | Pinch begins |
| `onScaleEnd` | `(scale: number) => void` | Pinch ends |
| `onPanStart` | `() => void` | Pan begins |

---

## Ref API

```tsx
import Gallery, { GalleryRef } from 'expo-image-gallery';

const ref = useRef<GalleryRef>(null);

// Navigate
ref.current?.setIndex(2, true /* animated */);

// Reset scale & pan
ref.current?.reset(true /* animated */);
```

| Method | Signature | Description |
|---|---|---|
| `setIndex` | `(index: number, animated?: boolean) => void` | Jump to index |
| `reset` | `(animated?: boolean) => void` | Reset scale & translation |

---

## Custom renderItem

You **must** call `setImageDimensions` once the image dimensions are known so the gallery can compute pan bounds correctly.

```tsx
import { Image } from 'expo-image';
import Gallery, { RenderItemInfo } from 'expo-image-gallery';

type Item = { uri: string; blurhash?: string };

function renderItem({ item, setImageDimensions }: RenderItemInfo<Item>) {
  return (
    <Image
      source={{ uri: item.uri }}
      placeholder={{ blurhash: item.blurhash }}
      style={StyleSheet.absoluteFill}
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

export default function App() {
  return <Gallery data={items} renderItem={renderItem} />;
}
```

---

## Peer dependencies

| Package | Version |
|---|---|
| `expo` | `>=50.0.0` |
| `react` | `>=18.2.0` |
| `react-native` | `>=0.73.0` |
| `react-native-gesture-handler` | `>=2.14.0` |
| `react-native-reanimated` | `>=4.0.0` |
| `react-native-worklets` | `>=0.7.0` |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## License

MIT © 2026 Jahanzaib Ali

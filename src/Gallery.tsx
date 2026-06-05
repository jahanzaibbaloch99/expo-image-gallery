import React, {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  forwardRef,
} from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ListRenderItemInfo,
  Image,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDecay,
  withSpring,
  runOnJS,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RenderItemInfo<T> = {
  item: T;
  index: number;
  setImageDimensions: (dims: { width: number; height: number }) => void;
};

export type GalleryProps<T = string> = {
  /** Array of items to render */
  data: T[];
  /** Custom render function. You MUST call setImageDimensions after load. */
  renderItem?: (info: RenderItemInfo<T>) => React.ReactElement;
  /** Extract a unique key from each item */
  keyExtractor?: (item: T, index: number) => string | number;
  /** Starting index */
  initialIndex?: number;
  /** Called when the active index changes */
  onIndexChange?: (index: number) => void;
  /** Number of items rendered simultaneously */
  numToRender?: number;
  /** Horizontal gap between items (points) */
  emptySpaceWidth?: number;
  /** Scale value applied on double-tap */
  doubleTapScale?: number;
  /** Max ms between two taps to count as double-tap */
  doubleTapInterval?: number;
  /** Maximum pinch scale the user can reach */
  maxScale?: number;
  /** Enable pinch-to-zoom */
  pinchEnabled?: boolean;
  /** Enable horizontal swipe between items */
  swipeEnabled?: boolean;
  /** Enable double-tap to zoom */
  doubleTapEnabled?: boolean;
  /** Disable swipe to next/prev when scale > 1 */
  disableTransitionOnScaledImage?: boolean;
  /** Hide adjacent items when scale > 1 */
  hideAdjacentImagesOnScaledImage?: boolean;
  /** Disable vertical swipe-to-close when scale === 1 */
  disableVerticalSwipe?: boolean;
  /** Disable swipe-up-to-close when scale === 1 */
  disableSwipeUp?: boolean;
  /** Loop infinitely (requires data.length > 1) */
  loop?: boolean;
  /** Called when scale changes */
  onScaleChange?: (scale: number) => void;
  /** Range filter for onScaleChange */
  onScaleChangeRange?: { start: number; end: number };
  /** Override container dimensions */
  containerDimensions?: { width: number; height: number };
  /** Container style */
  style?: ViewStyle;

  // ── Events ──────────────────────────────────────────────────────────────────
  /** Fired when user swipes to top/bottom enough to "close" the gallery */
  onSwipeToClose?: () => void;
  /** Worklet: fired during vertical swipe-to-close drag */
  onTranslationYChange?: (translationY: number, shouldClose: boolean) => void;
  /** Fired on single tap */
  onTap?: () => void;
  /** Fired on double-tap */
  onDoubleTap?: (toScale: number) => void;
  /** Fired on long press */
  onLongPress?: () => void;
  /** Fired when pinch starts */
  onScaleStart?: (scale: number) => void;
  /** Fired when pinch ends */
  onScaleEnd?: (scale: number) => void;
  /** Fired when pan starts */
  onPanStart?: () => void;
};

export type GalleryRef = {
  /** Navigate to a given index */
  setIndex: (index: number, animated?: boolean) => void;
  /** Reset scale & translation of the current item */
  reset: (animated?: boolean) => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CLOSE_THRESHOLD = 120;
const SWIPE_THRESHOLD = 70;
const MIN_SCALE = 1;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

function defaultKeyExtractor<T>(item: T, index: number): string {
  if (item && typeof item === 'object') {
    const obj = item as Record<string, unknown>;
    if (obj.id != null) return String(obj.id);
    if (obj.key != null) return String(obj.key);
    if (obj._id != null) return String(obj._id);
  }
  return String(index);
}

// ─── GalleryItem ─────────────────────────────────────────────────────────────

type GalleryItemProps<T> = {
  item: T;
  index: number;
  width: number;
  height: number;
  isActive: boolean;
  renderItem?: GalleryProps<T>['renderItem'];
  maxScale: number;
  doubleTapScale: number;
  doubleTapInterval: number;
  pinchEnabled: boolean;
  swipeEnabled: boolean;
  doubleTapEnabled: boolean;
  disableTransitionOnScaledImage: boolean;
  disableVerticalSwipe: boolean;
  disableSwipeUp: boolean;
  onSwipeToClose?: () => void;
  onTranslationYChange?: (y: number, shouldClose: boolean) => void;
  onTap?: () => void;
  onDoubleTap?: (toScale: number) => void;
  onLongPress?: () => void;
  onScaleStart?: (scale: number) => void;
  onScaleEnd?: (scale: number) => void;
  onPanStart?: () => void;
  onScaleChange?: (scale: number) => void;
  onScaleChangeRange?: { start: number; end: number };
  onHorizontalSwipe?: (direction: 'left' | 'right') => void;
  resetRef?: React.MutableRefObject<((animated?: boolean) => void) | null>;
};

function GalleryItemInner<T>(
  props: GalleryItemProps<T>,
  _ref: React.Ref<unknown>
) {
  const {
    item,
    index,
    width,
    height,
    renderItem,
    maxScale,
    doubleTapScale,
    doubleTapInterval,
    pinchEnabled,
    swipeEnabled,
    doubleTapEnabled,
    disableTransitionOnScaledImage,
    disableVerticalSwipe,
    disableSwipeUp,
    onSwipeToClose,
    onTranslationYChange,
    onTap,
    onDoubleTap,
    onLongPress,
    onScaleStart,
    onScaleEnd,
    onPanStart,
    onScaleChange,
    onScaleChangeRange,
    onHorizontalSwipe,
    resetRef,
  } = props;

  // ── Shared values ──
  const scale = useSharedValue(MIN_SCALE);
  const savedScale = useSharedValue(MIN_SCALE);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const imageDimensions = useSharedValue({ width: 0, height: 0 });
  const lastTapTime = useSharedValue(0);

  // ── Reset helper ──
  const reset = useCallback(
    (animated = true) => {
      if (animated) {
        scale.value = withTiming(MIN_SCALE);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      } else {
        scale.value = MIN_SCALE;
        translateX.value = 0;
        translateY.value = 0;
      }
      savedScale.value = MIN_SCALE;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    },
    [scale, translateX, translateY, savedScale, savedTranslateX, savedTranslateY]
  );

  if (resetRef) {
    resetRef.current = reset;
  }

  // ── Pan bounds ──
  const getMaxTranslation = () => {
    'worklet';
    const scaledW = width * scale.value;
    const scaledH = height * scale.value;
    const maxX = Math.max((scaledW - width) / 2, 0);
    const maxY = Math.max((scaledH - height) / 2, 0);
    return { maxX, maxY };
  };

  // ── Pinch gesture ──
  const pinchGesture = Gesture.Pinch()
    .enabled(pinchEnabled)
    .onBegin(() => {
      'worklet';
      savedScale.value = scale.value;
      if (onScaleStart) {
        scheduleOnRN(onScaleStart, scale.value);
      }
    })
    .onUpdate((e) => {
      'worklet';
      const newScale = clamp(savedScale.value * e.scale, MIN_SCALE, maxScale);
      scale.value = newScale;
      if (onScaleChange) {
        const { start, end } = onScaleChangeRange ?? { start: 0, end: Infinity };
        if (newScale >= start && newScale <= end) {
          scheduleOnRN(onScaleChange, newScale);
        }
      }
    })
    .onEnd(() => {
      'worklet';
      savedScale.value = scale.value;
      // Bounce back if under minimum scale
      if (scale.value < MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.value = MIN_SCALE;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
      if (onScaleEnd) {
        scheduleOnRN(onScaleEnd, scale.value);
      }
    });

  // ── Pan gesture ──
  const panGesture = Gesture.Pan()
    .enabled(swipeEnabled)
    .onBegin(() => {
      'worklet';
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      if (onPanStart) {
        scheduleOnRN(onPanStart);
      }
    })
    .onUpdate((e) => {
      'worklet';
      const { maxX, maxY } = getMaxTranslation();
      const isScaled = scale.value > MIN_SCALE;

      if (isScaled) {
        // Free pan within scaled bounds — apply rubber-band beyond edges
        const rawX = savedTranslateX.value + e.translationX;
        const rawY = savedTranslateY.value + e.translationY;
        translateX.value = clamp(rawX, -maxX, maxX);
        translateY.value = clamp(rawY, -maxY, maxY);
      } else {
        // Not scaled — handle swipe-to-close vertically, swipe-to-navigate horizontally
        if (!disableVerticalSwipe) {
          if (!disableSwipeUp || e.translationY > 0) {
            translateY.value = e.translationY;
            if (onTranslationYChange) {
              const shouldClose = Math.abs(e.translationY) > CLOSE_THRESHOLD;
              onTranslationYChange(e.translationY, shouldClose);
            }
          }
        }
      }
    })
    .onEnd((e) => {
      'worklet';
      const { maxX, maxY } = getMaxTranslation();
      const isScaled = scale.value > MIN_SCALE;

      if (isScaled) {
        // Clamp final position — with decay for a native feel
        const targetX = clamp(
          savedTranslateX.value + e.translationX,
          -maxX,
          maxX
        );
        const targetY = clamp(
          savedTranslateY.value + e.translationY,
          -maxY,
          maxY
        );

        if (!disableTransitionOnScaledImage) {
          // Horizontal swipe detection while zoomed
          const absX = Math.abs(e.translationX);
          const absY = Math.abs(e.translationY);
          if (absX > SWIPE_THRESHOLD && absX > absY && Math.abs(targetX) >= maxX) {
            if (onHorizontalSwipe) {
              scheduleOnRN(
                onHorizontalSwipe,
                e.translationX < 0 ? 'left' : 'right'
              );
            }
          }
        }

        translateX.value = withDecay({
          velocity: e.velocityX,
          clamp: [-maxX, maxX],
        });
        translateY.value = withDecay({
          velocity: e.velocityY,
          clamp: [-maxY, maxY],
        });
        savedTranslateX.value = targetX;
        savedTranslateY.value = targetY;
      } else {
        // Check swipe-to-close
        const absY = Math.abs(e.translationY);
        if (!disableVerticalSwipe && absY > CLOSE_THRESHOLD) {
          if (!disableSwipeUp || e.translationY > 0) {
            if (onSwipeToClose) {
              scheduleOnRN(onSwipeToClose);
            }
            return;
          }
        }
        // Check horizontal swipe for navigation
        const absX = Math.abs(e.translationX);
        if (absX > SWIPE_THRESHOLD && absX > absY) {
          if (onHorizontalSwipe) {
            scheduleOnRN(
              onHorizontalSwipe,
              e.translationX < 0 ? 'left' : 'right'
            );
          }
        }
        // Spring back
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  // ── Tap gesture (single + double) ──
  const tapGesture = Gesture.Tap()
    .maxDuration(doubleTapInterval)
    .onEnd((e) => {
      'worklet';
      const now = Date.now();
      const delta = now - lastTapTime.value;

      if (doubleTapEnabled && delta < doubleTapInterval) {
        // Double tap
        lastTapTime.value = 0;
        const isCurrentlyScaled = scale.value > MIN_SCALE;
        const targetScale = isCurrentlyScaled ? MIN_SCALE : doubleTapScale;

        if (!isCurrentlyScaled) {
          // Zoom into the tap point
          const tapX = e.x - width / 2;
          const tapY = e.y - height / 2;
          const offsetX = clamp(-tapX * (doubleTapScale - 1), -(width / 2), width / 2);
          const offsetY = clamp(-tapY * (doubleTapScale - 1), -(height / 2), height / 2);
          scale.value = withTiming(targetScale);
          translateX.value = withTiming(offsetX);
          translateY.value = withTiming(offsetY);
          savedScale.value = targetScale;
          savedTranslateX.value = offsetX;
          savedTranslateY.value = offsetY;
        } else {
          scale.value = withTiming(MIN_SCALE);
          translateX.value = withTiming(0);
          translateY.value = withTiming(0);
          savedScale.value = MIN_SCALE;
          savedTranslateX.value = 0;
          savedTranslateY.value = 0;
        }

        if (onDoubleTap) {
          scheduleOnRN(onDoubleTap, targetScale);
        }
      } else {
        lastTapTime.value = now;
        // Schedule single-tap callback after double-tap interval passes
        if (onTap) {
          scheduleOnRN(onTap);
        }
      }
    });

  // ── Long press gesture ──
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      'worklet';
      if (onLongPress) {
        scheduleOnRN(onLongPress);
      }
    });

  // ── Compose all gestures ──
  const composed = Gesture.Simultaneous(
    pinchGesture,
    Gesture.Simultaneous(panGesture, Gesture.Race(tapGesture, longPressGesture))
  );

  // ── Animated style ──
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // ── Render item ──
  const setImageDimensions = useCallback(
    (dims: { width: number; height: number }) => {
      imageDimensions.value = dims;
    },
    [imageDimensions]
  );

  const content = useMemo(() => {
    if (renderItem) {
      return renderItem({ item, index, setImageDimensions });
    }
    if (typeof item === 'string') {
      return (
        <Image
          source={{ uri: item }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          onLoad={(e) => {
            setImageDimensions({
              width: e.nativeEvent.source.width,
              height: e.nativeEvent.source.height,
            });
          }}
        />
      );
    }
    return null;
  }, [item, index, renderItem, setImageDimensions]);

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[{ width, height }, animatedStyle]}>
        {content}
      </Animated.View>
    </GestureDetector>
  );
}

const GalleryItem = forwardRef(GalleryItemInner) as <T>(
  props: GalleryItemProps<T> & { ref?: React.Ref<unknown> }
) => React.ReactElement;

// ─── Gallery ─────────────────────────────────────────────────────────────────

function GalleryInner<T = string>(
  props: GalleryProps<T>,
  ref: React.Ref<GalleryRef>
) {
  const {
    data,
    renderItem,
    keyExtractor,
    initialIndex = 0,
    onIndexChange,
    numToRender = 5,
    emptySpaceWidth = 30,
    doubleTapScale = 3,
    doubleTapInterval = 500,
    maxScale = 6,
    pinchEnabled = true,
    swipeEnabled = true,
    doubleTapEnabled = true,
    disableTransitionOnScaledImage = false,
    hideAdjacentImagesOnScaledImage = false,
    disableVerticalSwipe = false,
    disableSwipeUp = false,
    loop = false,
    onScaleChange,
    onScaleChangeRange,
    containerDimensions,
    style,
    onSwipeToClose,
    onTranslationYChange,
    onTap,
    onDoubleTap,
    onLongPress,
    onScaleStart,
    onScaleEnd,
    onPanStart,
  } = props;

  const dimensions = useWindowDimensions();
  const { width, height } = containerDimensions ?? dimensions;

  const currentIndex = useSharedValue(initialIndex);
  const flatListRef = useRef<FlatList>(null);
  const resetRefs = useRef<
    Map<number, React.MutableRefObject<((animated?: boolean) => void) | null>>
  >(new Map());

  const itemWidth = width + emptySpaceWidth;

  // ── Public API ──
  useImperativeHandle(ref, () => ({
    setIndex(index: number, animated = true) {
      const target = loop
        ? ((index % data.length) + data.length) % data.length
        : clamp(index, 0, data.length - 1);
      currentIndex.value = target;
      flatListRef.current?.scrollToIndex({ index: target, animated });
      onIndexChange && onIndexChange(target);
    },
    reset(animated = true) {
      const resetRef = resetRefs.current.get(currentIndex.value);
      resetRef?.current?.(animated);
    },
  }));

  // ── Navigation helper ──
  const navigate = useCallback(
    (direction: 'left' | 'right') => {
      const current = currentIndex.value;
      let next: number;

      if (direction === 'left') {
        next = loop ? (current + 1) % data.length : current + 1;
      } else {
        next = loop
          ? (current - 1 + data.length) % data.length
          : current - 1;
      }

      if (next < 0 || next >= data.length) return;

      currentIndex.value = next;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      onIndexChange && onIndexChange(next);
    },
    [loop, data.length, currentIndex, onIndexChange]
  );

  // ── Render each list item ──
  const renderListItem = useCallback(
    ({ item, index }: ListRenderItemInfo<T>) => {
      let resetRef = resetRefs.current.get(index);
      if (!resetRef) {
        resetRef = { current: null };
        resetRefs.current.set(index, resetRef);
      }

      return (
        <View style={{ width: itemWidth, height }}>
          <GalleryItem
            item={item}
            index={index}
            width={width}
            height={height}
            isActive={index === initialIndex}
            renderItem={renderItem}
            maxScale={maxScale}
            doubleTapScale={doubleTapScale}
            doubleTapInterval={doubleTapInterval}
            pinchEnabled={pinchEnabled}
            swipeEnabled={swipeEnabled}
            doubleTapEnabled={doubleTapEnabled}
            disableTransitionOnScaledImage={disableTransitionOnScaledImage}
            disableVerticalSwipe={disableVerticalSwipe}
            disableSwipeUp={disableSwipeUp}
            onSwipeToClose={onSwipeToClose}
            onTranslationYChange={onTranslationYChange}
            onTap={onTap}
            onDoubleTap={onDoubleTap}
            onLongPress={onLongPress}
            onScaleStart={onScaleStart}
            onScaleEnd={onScaleEnd}
            onPanStart={onPanStart}
            onScaleChange={onScaleChange}
            onScaleChangeRange={onScaleChangeRange}
            onHorizontalSwipe={navigate}
            resetRef={resetRef}
          />
        </View>
      );
    },
    [
      itemWidth,
      height,
      width,
      initialIndex,
      renderItem,
      maxScale,
      doubleTapScale,
      doubleTapInterval,
      pinchEnabled,
      swipeEnabled,
      doubleTapEnabled,
      disableTransitionOnScaledImage,
      disableVerticalSwipe,
      disableSwipeUp,
      onSwipeToClose,
      onTranslationYChange,
      onTap,
      onDoubleTap,
      onLongPress,
      onScaleStart,
      onScaleEnd,
      onPanStart,
      onScaleChange,
      onScaleChangeRange,
      navigate,
    ]
  );

  const extractKey = useCallback(
    (item: T, index: number) =>
      String(keyExtractor ? keyExtractor(item, index) : defaultKeyExtractor(item, index)),
    [keyExtractor]
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: itemWidth,
      offset: itemWidth * index,
      index,
    }),
    [itemWidth]
  );

  return (
    <GestureHandlerRootView style={[styles.root, style]}>
      <FlatList
        ref={flatListRef}
        data={data}
        horizontal
        pagingEnabled
        scrollEnabled={false} // We handle scrolling via gestures
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        maxToRenderPerBatch={numToRender}
        windowSize={numToRender}
        keyExtractor={extractKey}
        getItemLayout={getItemLayout}
        renderItem={renderListItem}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(
            e.nativeEvent.contentOffset.x / itemWidth
          );
          currentIndex.value = newIndex;
          onIndexChange && onIndexChange(newIndex);
        }}
      />
    </GestureHandlerRootView>
  );
}

// TypeScript trick — preserve generic T with forwardRef
const Gallery = forwardRef(GalleryInner) as <T = string>(
  props: GalleryProps<T> & { ref?: React.Ref<GalleryRef> }
) => React.ReactElement;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'black',
  },
});

export default Gallery;

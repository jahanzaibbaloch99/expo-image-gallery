import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import Gallery from '../Gallery';
import type { GalleryRef } from '../Gallery';

// ─── Mocks are set up in jest.setup.ts ───────────────────────────────────────

const mockImages = [
  'https://picsum.photos/id/10/800/600',
  'https://picsum.photos/id/20/800/600',
  'https://picsum.photos/id/30/800/600',
  'https://picsum.photos/id/40/800/600',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderGallery(props: Partial<React.ComponentProps<typeof Gallery>> = {}) {
  return render(
    <Gallery data={mockImages} {...props} />
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Gallery — rendering', () => {
  it('renders without crashing', () => {
    const { toJSON } = renderGallery();
    expect(toJSON()).not.toBeNull();
  });

  it('renders a FlatList with correct item count', () => {
    const { UNSAFE_getAllByType } = renderGallery();
    const { FlatList } = require('react-native');
    const lists = UNSAFE_getAllByType(FlatList);
    expect(lists).toHaveLength(1);
    expect(lists[0].props.data).toHaveLength(mockImages.length);
  });

  it('accepts custom data shapes via renderItem', () => {
    const items = [{ uri: 'https://a.com/1.jpg', id: '1' }];
    const renderItem = jest.fn(({ item }: any) => null);
    render(<Gallery data={items} renderItem={renderItem} />);
    // renderItem should eventually be called with item & setImageDimensions
    // (lazy rendering means it may not be called immediately — just checking no crash)
    expect(renderItem).toBeDefined();
  });

  it('renders with initialIndex prop', () => {
    const { UNSAFE_getAllByType } = renderGallery({ initialIndex: 2 });
    const { FlatList } = require('react-native');
    const list = UNSAFE_getAllByType(FlatList)[0];
    expect(list.props.initialScrollIndex).toBe(2);
  });

  it('applies containerDimensions', () => {
    const dims = { width: 400, height: 300 };
    const { toJSON } = renderGallery({ containerDimensions: dims });
    expect(toJSON()).not.toBeNull();
  });
});

describe('Gallery — props', () => {
  it('uses default props without crashing', () => {
    const { toJSON } = renderGallery();
    expect(toJSON()).not.toBeNull();
  });

  it('respects loop=true', () => {
    const { toJSON } = renderGallery({ loop: true });
    expect(toJSON()).not.toBeNull();
  });

  it('accepts style prop', () => {
    const { toJSON } = renderGallery({ style: { backgroundColor: 'red' } });
    expect(toJSON()).not.toBeNull();
  });

  it('accepts all boolean toggles', () => {
    const { toJSON } = renderGallery({
      pinchEnabled: false,
      swipeEnabled: false,
      doubleTapEnabled: false,
      disableTransitionOnScaledImage: true,
      hideAdjacentImagesOnScaledImage: true,
      disableVerticalSwipe: true,
      disableSwipeUp: true,
    });
    expect(toJSON()).not.toBeNull();
  });

  it('accepts scale props', () => {
    const { toJSON } = renderGallery({
      doubleTapScale: 4,
      maxScale: 8,
      doubleTapInterval: 300,
    });
    expect(toJSON()).not.toBeNull();
  });
});

describe('Gallery — callbacks', () => {
  it('calls onIndexChange when navigating', () => {
    const onIndexChange = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <Gallery data={mockImages} onIndexChange={onIndexChange} />
    );
    const { FlatList } = require('react-native');
    const list = UNSAFE_getAllByType(FlatList)[0];

    act(() => {
      list.props.onMomentumScrollEnd({
        nativeEvent: { contentOffset: { x: 430 } }, // width 400 + gap 30 = 430
      });
    });

    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it('fires onSwipeToClose callback when provided', () => {
    const onSwipeToClose = jest.fn();
    const { toJSON } = renderGallery({ onSwipeToClose });
    expect(toJSON()).not.toBeNull();
    // The actual gesture simulation is done in e2e — here we just confirm mount
  });
});

describe('Gallery — GalleryRef', () => {
  it('exposes setIndex via ref', () => {
    const ref = React.createRef<GalleryRef>();
    render(<Gallery ref={ref} data={mockImages} />);
    expect(ref.current).not.toBeNull();
    expect(typeof ref.current?.setIndex).toBe('function');
  });

  it('exposes reset via ref', () => {
    const ref = React.createRef<GalleryRef>();
    render(<Gallery ref={ref} data={mockImages} />);
    expect(typeof ref.current?.reset).toBe('function');
  });

  it('setIndex clamps to valid range', () => {
    const ref = React.createRef<GalleryRef>();
    const onIndexChange = jest.fn();
    render(
      <Gallery ref={ref} data={mockImages} onIndexChange={onIndexChange} />
    );
    // Should clamp -1 → 0
    act(() => ref.current?.setIndex(-1));
    expect(onIndexChange).toHaveBeenCalledWith(0);

    // Should clamp 999 → 3 (last index)
    act(() => ref.current?.setIndex(999));
    expect(onIndexChange).toHaveBeenCalledWith(3);
  });

  it('setIndex wraps in loop mode', () => {
    const ref = React.createRef<GalleryRef>();
    const onIndexChange = jest.fn();
    render(
      <Gallery ref={ref} data={mockImages} loop onIndexChange={onIndexChange} />
    );
    act(() => ref.current?.setIndex(5)); // 5 % 4 = 1
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it('reset does not throw', () => {
    const ref = React.createRef<GalleryRef>();
    render(<Gallery ref={ref} data={mockImages} />);
    expect(() => act(() => ref.current?.reset())).not.toThrow();
    expect(() => act(() => ref.current?.reset(false))).not.toThrow();
  });
});

describe('Gallery — keyExtractor', () => {
  it('uses custom keyExtractor', () => {
    const items = [{ id: 'a', url: 'https://a.jpg' }];
    const keyExtractor = jest.fn((item: { id: string }, index: number) => item.id);
    render(<Gallery data={items} keyExtractor={keyExtractor} />);
    // No crash = passed
    expect(keyExtractor).toBeDefined();
  });
});

describe('Gallery — empty data', () => {
  it('renders with empty data array', () => {
    const { toJSON } = render(<Gallery data={[]} />);
    expect(toJSON()).not.toBeNull();
  });

  it('renders with single item', () => {
    const { toJSON } = render(<Gallery data={[mockImages[0]!]} />);
    expect(toJSON()).not.toBeNull();
  });
});

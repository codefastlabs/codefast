import { useRef } from "react";
import type { RefObject } from "react";

import {
  areScrollStatesEqual,
  createMessageScrollerStore,
  createMessageScrollerVisibilityStore,
} from "#/lib/message-scroller/stores";
import { EMPTY_MESSAGE_SCROLLER_SCROLLABLE } from "#/lib/message-scroller/types";
import type {
  MessageScrollerMode,
  MessageScrollerScrollable,
  MessageScrollerScrollOptions,
  MessageScrollerStore,
  MessageScrollerVisibilityStore,
} from "#/lib/message-scroller/types";

// Shared mutable ref bag for one MessageScroller, closed over by both the
// controller and the commands so writes are visible across them without prop
// threading. stateStore and visibilityStore fan out via useSyncExternalStore.
/**
 * @since 0.5.0-canary.3
 */
type MessageScrollerRefs = {
  autoScrollRef: RefObject<boolean>;
  autoscrollingRef: RefObject<boolean>;
  autoscrollingTimeoutRef: RefObject<number | null>;
  streamingTurnRef: RefObject<HTMLElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  defaultScrollPositionAppliedRef: RefObject<boolean>;
  firstItemRef: RefObject<HTMLElement | null>;
  itemCountRef: RefObject<number>;
  messageElementsRef: RefObject<Map<string, HTMLElement>>;
  modeRef: RefObject<MessageScrollerMode>;
  pendingScrollFrameRef: RefObject<number | null>;
  pendingScrollToMessageRef: RefObject<{
    messageId: string;
    options?: MessageScrollerScrollOptions;
  } | null>;
  prependRestoreRef: RefObject<{
    element: HTMLElement;
    viewportTop: number;
  } | null>;
  preserveScrollOnPrependRef: RefObject<boolean>;
  rootRef: RefObject<HTMLDivElement | null>;
  scrollEdgeThresholdRef: RefObject<number>;
  scrollMarginRef: RefObject<number>;
  scrollPreviousItemPeekRef: RefObject<number>;
  spacerGapRef: RefObject<number>;
  spacerHeightRef: RefObject<number>;
  spacerRef: RefObject<HTMLDivElement | null>;
  stateFrameRef: RefObject<number | null>;
  stateStore: MessageScrollerStore<MessageScrollerScrollable>;
  viewportRef: RefObject<HTMLDivElement | null>;
  visibilityFrameRef: RefObject<number | null>;
  visibilityObserverRef: RefObject<IntersectionObserver | null>;
  visibilityStore: MessageScrollerVisibilityStore;
  visibleMessageIdsRef: RefObject<Set<string>>;
  handledScrollAnchorsRef: RefObject<WeakSet<HTMLElement>>;
};

// Builds the per-instance ref bag: the two external stores constructed once, and
// the latest prop values mirrored onto refs each render so callbacks stay stable.
/**
 * @since 0.5.0-canary.3
 */
function useMessageScrollerRefs({
  autoScroll,
  scrollEdgeThreshold,
  scrollMargin,
  scrollPreviousItemPeek,
}: {
  autoScroll: boolean;
  scrollEdgeThreshold: number;
  scrollMargin: number;
  scrollPreviousItemPeek: number;
}): MessageScrollerRefs {
  const autoScrollRef = useRef(autoScroll);
  const autoscrollingRef = useRef(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const defaultScrollPositionAppliedRef = useRef(false);
  const scrollEdgeThresholdRef = useRef(scrollEdgeThreshold);
  const itemCountRef = useRef(0);
  const firstItemRef = useRef<HTMLElement | null>(null);
  const modeRef = useRef<MessageScrollerMode>(autoScroll ? "following-bottom" : "free-scrolling");
  const messageElementsRef = useRef(new Map<string, HTMLElement>());
  const pendingScrollToMessageRef = useRef<{
    messageId: string;
    options?: MessageScrollerScrollOptions;
  } | null>(null);
  // The row to hold steady on the next prepend: the first visible row, or a jump
  // target seeded by scrollToElement. restorePrependedAnchor reads only this.
  const prependRestoreRef = useRef<{
    element: HTMLElement;
    viewportTop: number;
  } | null>(null);
  // The turn held at the reading line so a reply streaming in below it can re-pin
  // it instead of letting scrollTop clamp it loose.
  const streamingTurnRef = useRef<HTMLElement | null>(null);
  const scrollPreviousItemPeekRef = useRef(scrollPreviousItemPeek);
  const preserveScrollOnPrependRef = useRef(true);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const scrollMarginRef = useRef(scrollMargin);
  const pendingScrollFrameRef = useRef<number | null>(null);
  const spacerGapRef = useRef(0);
  const spacerHeightRef = useRef(0);
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const stateFrameRef = useRef<number | null>(null);
  const stateStoreRef = useRef<MessageScrollerStore<MessageScrollerScrollable> | null>(null);
  const autoscrollingTimeoutRef = useRef<number | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const visibilityFrameRef = useRef<number | null>(null);
  const visibilityObserverRef = useRef<IntersectionObserver | null>(null);
  const visibilityStoreRef = useRef<MessageScrollerVisibilityStore | null>(null);
  const visibleMessageIdsRef = useRef(new Set<string>());
  const handledScrollAnchorsRef = useRef(new WeakSet<HTMLElement>());

  if (stateStoreRef.current === null) {
    stateStoreRef.current = createMessageScrollerStore(EMPTY_MESSAGE_SCROLLER_SCROLLABLE, areScrollStatesEqual);
  }

  if (visibilityStoreRef.current === null) {
    visibilityStoreRef.current = createMessageScrollerVisibilityStore();
  }

  // Track the latest prop values on every render so callbacks read fresh values
  // without being recreated (the useLatest pattern).
  autoScrollRef.current = autoScroll;
  scrollEdgeThresholdRef.current = scrollEdgeThreshold;
  scrollMarginRef.current = scrollMargin;
  scrollPreviousItemPeekRef.current = scrollPreviousItemPeek;

  return {
    autoScrollRef,
    autoscrollingRef,
    autoscrollingTimeoutRef,
    streamingTurnRef,
    contentRef,
    defaultScrollPositionAppliedRef,
    firstItemRef,
    itemCountRef,
    messageElementsRef,
    modeRef,
    pendingScrollFrameRef,
    pendingScrollToMessageRef,
    prependRestoreRef,
    preserveScrollOnPrependRef,
    rootRef,
    scrollEdgeThresholdRef,
    scrollMarginRef,
    scrollPreviousItemPeekRef,
    spacerGapRef,
    spacerHeightRef,
    spacerRef,
    stateFrameRef,
    stateStore: stateStoreRef.current,
    viewportRef,
    visibilityFrameRef,
    visibilityObserverRef,
    visibilityStore: visibilityStoreRef.current,
    visibleMessageIdsRef,
    handledScrollAnchorsRef,
  };
}

export { useMessageScrollerRefs };
export type { MessageScrollerRefs };

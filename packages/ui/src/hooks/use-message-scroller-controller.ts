// Vendored from shadcn-ui/ui packages/react/src/message-scroller/use-message-scroller-controller.ts
// Callbacks read from stable refs; omitting them from deps is intentional and keeps identities stable.
/* oxlint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";

import { useMessageScrollerCommands } from "#/hooks/use-message-scroller-commands";
import { useMessageScrollerRefs } from "#/hooks/use-message-scroller-refs";
import type { MessageScrollerRefs } from "#/hooks/use-message-scroller-refs";
import {
  getContentBottom,
  getElementTop,
  getElementViewportTop,
  getFirstVisibleMessageItem,
  getFlexGap,
  getLastScrollAnchor,
  getMessageScrollerItems,
  getMessageScrollerScrollable,
  getMessageScrollerVisibilityState,
  getNewScrollAnchor,
  getUnanchoredScrollAnchor,
  hasMultipleNewScrollAnchors,
} from "#/lib/message-scroller/geometry";
import {
  DEFAULT_SCROLL_EDGE_THRESHOLD,
  DEFAULT_SCROLL_MARGIN,
  DEFAULT_SCROLL_PREVIOUS_ITEM_PEEK,
  EMPTY_MESSAGE_SCROLLER_VISIBILITY_STATE,
  SCROLL_POSITION_EPSILON,
} from "#/lib/message-scroller/types";
import type {
  MessageScrollerContextValue,
  MessageScrollerProviderProps,
  MessageScrollerRegisterMessage,
  MessageScrollerScrollable,
} from "#/lib/message-scroller/types";

// Builds a ref callback that stores the node and runs onMount once it attaches.
function useElementRef(elementRef: RefObject<HTMLDivElement | null>, onMount: () => void) {
  return useCallback(
    (element: HTMLDivElement | null) => {
      elementRef.current = element;

      if (element) {
        onMount();
      }
    },
    [elementRef, onMount],
  );
}

// Orchestrator hook. Decides when to scroll and delegates the moves to
// useMessageScrollerCommands; state and visibility commits are coalesced on a
// requestAnimationFrame and torn down on cleanup for StrictMode safety.
/**
 * @since 0.5.0-canary.3
 */
function useMessageScrollerController({
  autoScroll = false,
  defaultScrollPosition = "end",
  scrollEdgeThreshold = DEFAULT_SCROLL_EDGE_THRESHOLD,
  scrollPreviousItemPeek = DEFAULT_SCROLL_PREVIOUS_ITEM_PEEK,
  scrollMargin = DEFAULT_SCROLL_MARGIN,
}: MessageScrollerProviderProps) {
  const refs = useMessageScrollerRefs({
    autoScroll,
    scrollEdgeThreshold,
    scrollMargin,
    scrollPreviousItemPeek,
  });

  const {
    streamingTurnRef,
    autoScrollRef,
    autoscrollingRef,
    autoscrollingTimeoutRef,
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
    spacerRef,
    stateFrameRef,
    stateStore,
    viewportRef,
    visibilityFrameRef,
    visibilityObserverRef,
    visibilityStore,
    visibleMessageIdsRef,
    handledScrollAnchorsRef,
  } = refs;

  const previousDefaultScrollPositionRef = useRef(defaultScrollPosition);

  if (previousDefaultScrollPositionRef.current !== defaultScrollPosition) {
    previousDefaultScrollPositionRef.current = defaultScrollPosition;
    defaultScrollPositionAppliedRef.current = false;
  }

  const writeStateAttributes = useCallback((state: MessageScrollerScrollable) => {
    const root = rootRef.current;
    const viewport = viewportRef.current;
    const scrollable = [state.start && "start", state.end && "end"].filter(Boolean).join(" ");
    const autoScrolling = autoscrollingRef.current;

    for (const element of [root, viewport]) {
      if (!element) {
        continue;
      }

      if (scrollable) {
        element.setAttribute("data-scrollable", scrollable);
      } else {
        element.removeAttribute("data-scrollable");
      }

      element.toggleAttribute("data-autoscrolling", autoScrolling);
    }
  }, []);

  // Owns the one follow-bottom transition: arm at the bottom, release on any
  // scroll away (including a scrollbar drag), suppressed during a programmatic
  // scroll so the auto-scroll animation cannot release itself.
  const reconcileFollowMode = useCallback((scrollable: MessageScrollerScrollable) => {
    if (autoScrollRef.current && !scrollable.end && modeRef.current !== "settling-jump") {
      modeRef.current = "following-bottom";
    } else if (modeRef.current === "following-bottom" && scrollable.end && !autoscrollingRef.current) {
      modeRef.current = "free-scrolling";
    }
  }, []);

  const commitScrollState = useCallback(() => {
    const nextState = getMessageScrollerScrollable({
      content: contentRef.current,
      scrollEdgeThreshold: scrollEdgeThresholdRef.current,
      spacer: spacerRef.current,
      viewport: viewportRef.current,
    });

    reconcileFollowMode(nextState);
    writeStateAttributes(nextState);
    stateStore.setSnapshot(nextState);
  }, [reconcileFollowMode, stateStore, writeStateAttributes]);

  const scheduleStateCommit = useCallback(() => {
    if (stateFrameRef.current !== null) {
      return;
    }

    stateFrameRef.current = window.requestAnimationFrame(() => {
      stateFrameRef.current = null;
      commitScrollState();
    });
  }, [commitScrollState]);

  const scheduleVisibilitySync = useCallback(() => {
    if (!visibilityStore.hasListeners()) {
      return;
    }

    if (visibilityFrameRef.current !== null) {
      return;
    }

    visibilityFrameRef.current = window.requestAnimationFrame(() => {
      visibilityFrameRef.current = null;

      // A frame can outlive the last unsubscribe. Recomputing here would
      // overwrite the EMPTY snapshot that teardown just wrote, leaving a stale
      // value for the next subscriber to read.
      if (!visibilityStore.hasListeners()) {
        return;
      }

      visibilityStore.setSnapshot(
        getMessageScrollerVisibilityState({
          content: contentRef.current,
          scrollMargin: scrollMarginRef.current,
          scrollPreviousItemPeek: scrollPreviousItemPeekRef.current,
          spacer: spacerRef.current,
          viewport: viewportRef.current,
          visibleMessageIds: visibleMessageIdsRef.current,
        }),
      );
    });
  }, [visibilityStore]);

  const {
    flushPendingScrollToMessage,
    reanchorToAnchoredMessage,
    scrollToElement,
    scrollToEnd,
    scrollToMessage,
    scrollToStart,
  } = useMessageScrollerCommands({
    refs,
    commitScrollState,
    scheduleStateCommit,
    scheduleVisibilitySync,
  });

  const restorePrependedAnchor = useCallback(() => {
    const anchor = prependRestoreRef.current;
    const viewport = viewportRef.current;

    if (!anchor || !viewport || !anchor.element.isConnected) {
      return false;
    }

    // Compare the anchor relative to the viewport, not to the content. Native
    // scroll anchoring leaves the viewport-relative position unchanged, so this
    // is a no-op where the browser already handled the prepend and only corrects
    // the scroll where it did not (e.g. Safari) — without trusting a capability
    // flag, which some engines report incorrectly.
    const nextViewportTop = getElementViewportTop(anchor.element, viewport);
    const delta = nextViewportTop - anchor.viewportTop;

    if (Math.abs(delta) <= SCROLL_POSITION_EPSILON) {
      return false;
    }

    viewport.scrollTop += delta;
    anchor.viewportTop = getElementViewportTop(anchor.element, viewport);
    scheduleStateCommit();
    scheduleVisibilitySync();

    return true;
  }, [scheduleStateCommit, scheduleVisibilitySync]);

  const capturePrependAnchor = useCallback(() => {
    const content = contentRef.current;
    const viewport = viewportRef.current;

    if (!content || !viewport) {
      prependRestoreRef.current = null;
      return;
    }

    const anchor = getFirstVisibleMessageItem({
      content,
      spacer: spacerRef.current,
      viewport,
    });

    prependRestoreRef.current = anchor
      ? {
          element: anchor,
          viewportTop: getElementViewportTop(anchor, viewport),
        }
      : null;
  }, []);

  const schedulePendingScrollToMessageFlush = useCallback(() => {
    if (pendingScrollFrameRef.current !== null) {
      return;
    }

    pendingScrollFrameRef.current = window.requestAnimationFrame(() => {
      pendingScrollFrameRef.current = null;

      if (flushPendingScrollToMessage()) {
        capturePrependAnchor();
      }
    });
  }, [capturePrependAnchor, flushPendingScrollToMessage]);

  const applyDefaultScrollPosition = useCallback(() => {
    if (!defaultScrollPosition || defaultScrollPositionAppliedRef.current || itemCountRef.current === 0) {
      return false;
    }

    let handled = false;

    if (defaultScrollPosition === "last-anchor") {
      const content = contentRef.current;
      const viewport = viewportRef.current;
      const anchor =
        content && viewport ? getLastScrollAnchor(getMessageScrollerItems(content, spacerRef.current)) : null;

      if (!content || !viewport || !anchor) {
        handled = scrollToEnd({ behavior: "auto" });
      } else {
        const anchorTop = getElementTop(anchor, viewport);
        const contentBottom = getContentBottom({
          content,
          spacer: spacerRef.current,
          viewport,
        });
        // A short last turn already fits below the anchor, so opening at the end
        // shows the whole turn without leaving a blank gap beneath it.
        const lastTurnFits = contentBottom - anchorTop <= viewport.clientHeight;

        handled = lastTurnFits
          ? scrollToEnd({ behavior: "auto" })
          : scrollToElement(anchor, { align: "start" }, { keepPreviousPeek: true });
      }
    } else {
      handled =
        defaultScrollPosition === "end" ? scrollToEnd({ behavior: "auto" }) : scrollToStart({ behavior: "auto" });
    }

    if (!handled) {
      return false;
    }

    defaultScrollPositionAppliedRef.current = true;

    return true;
  }, [defaultScrollPosition, scrollToElement, scrollToEnd, scrollToStart]);

  const handleContentChange = useCallback(() => {
    const content = contentRef.current;

    if (!content) {
      return;
    }

    const items = getMessageScrollerItems(content, spacerRef.current);
    const previousItemCount = itemCountRef.current;
    const previousFirstItem = firstItemRef.current;

    itemCountRef.current = items.length;
    firstItemRef.current = items[0] ?? null;

    // Reconcile the scroll position with the new content. Every path re-captures
    // the prepend anchor afterward, so each branch just returns.
    //
    // Branch order is load-bearing: first-content, prepended, appended, updated.
    const reconcileScrollPosition = () => {
      if (flushPendingScrollToMessage()) {
        return;
      }

      if (previousItemCount === 0) {
        if (applyDefaultScrollPosition()) {
          return;
        }

        if (items.length > 0 && autoScrollRef.current && scrollToEnd({ behavior: "auto" })) {
          return;
        }

        commitScrollState();
        scheduleVisibilitySync();
        return;
      }

      const previousFirstItemIndex = previousFirstItem ? items.indexOf(previousFirstItem) : -1;
      const didPrepend = preserveScrollOnPrependRef.current && previousFirstItemIndex > 0;

      if (didPrepend) {
        // Prepended rows are not new appends. Restore the prior scroll position.
        // The restore is a no-op where native scroll anchoring already did it.
        restorePrependedAnchor();
        return;
      }

      if (items.length > previousItemCount) {
        const anchor = getNewScrollAnchor(items, previousItemCount);

        if (anchor) {
          // While the reader is following the live end, a batch of several
          // anchored turns arriving at once should keep following the end — not
          // yank back to anchor the first turn of the batch. A single new anchor
          // still moves to the top as usual.
          if (
            autoScrollRef.current &&
            modeRef.current === "following-bottom" &&
            hasMultipleNewScrollAnchors(items, previousItemCount)
          ) {
            scrollToEnd({ behavior: "auto" });
            return;
          }

          scrollToElement(anchor, { align: "start" }, { keepPreviousPeek: true });
          handledScrollAnchorsRef.current.add(anchor);
          return;
        }
      }

      if (items.length === previousItemCount) {
        const anchor = getUnanchoredScrollAnchor(items, handledScrollAnchorsRef.current);

        if (anchor) {
          scrollToElement(anchor, { align: "start" }, { keepPreviousPeek: true });
          handledScrollAnchorsRef.current.add(anchor);
          return;
        }
      }

      // Appends with no new anchor (and content-only updates) fall through here:
      // keep following the end if we still are, otherwise just recommit state.
      if (modeRef.current === "following-bottom" && autoScrollRef.current) {
        scrollToEnd({ behavior: "auto" });
      } else {
        commitScrollState();
        scheduleVisibilitySync();
      }
    };

    reconcileScrollPosition();
    capturePrependAnchor();
  }, [
    applyDefaultScrollPosition,
    capturePrependAnchor,
    commitScrollState,
    flushPendingScrollToMessage,
    restorePrependedAnchor,
    scheduleVisibilitySync,
    scrollToElement,
    scrollToEnd,
  ]);

  const handleResize = useCallback(() => {
    if (modeRef.current === "following-bottom" && autoScrollRef.current) {
      scrollToEnd({ behavior: "auto" });
      return;
    }

    // Hold the anchored turn in place as content below it resizes (a reply
    // streaming in, or a transient marker collapsing) — otherwise the shrinking
    // content lets the browser clamp scrollTop and the turn drops.
    if (reanchorToAnchoredMessage()) {
      return;
    }

    scheduleStateCommit();
    scheduleVisibilitySync();
  }, [reanchorToAnchoredMessage, scheduleStateCommit, scheduleVisibilitySync, scrollToEnd]);

  const observeVisibility = useCallback(() => {
    const viewport = viewportRef.current;

    if (!viewport || !visibilityStore.hasListeners()) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      scheduleVisibilitySync();
      return;
    }

    if (!visibilityObserverRef.current) {
      visibilityObserverRef.current = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const messageId = (entry.target as HTMLElement).dataset.messageId;

            if (!messageId) {
              continue;
            }

            if (entry.isIntersecting) {
              visibleMessageIdsRef.current.add(messageId);
            } else {
              visibleMessageIdsRef.current.delete(messageId);
            }
          }

          scheduleVisibilitySync();
        },
        {
          root: viewport,
          // Shrink the root's top edge to the anchoring line so a previous turn
          // peeking in the scrollMargin + peek band is not reported as visible,
          // keeping visibleMessageIds consistent with currentAnchorId. Captured
          // at observe time; a prop change rebuilds the observer on resubscribe.
          rootMargin: `${-(scrollMarginRef.current + scrollPreviousItemPeekRef.current)}px 0px 0px 0px`,
          threshold: [0, 0.01, 0.5, 1],
        },
      );
    }

    messageElementsRef.current.forEach((element) => {
      visibilityObserverRef.current?.observe(element);
    });
    scheduleVisibilitySync();
  }, [scheduleVisibilitySync, visibilityStore]);

  const unobserveVisibility = useCallback(() => {
    if (visibilityFrameRef.current !== null) {
      window.cancelAnimationFrame(visibilityFrameRef.current);
      visibilityFrameRef.current = null;
    }

    visibilityObserverRef.current?.disconnect();
    visibilityObserverRef.current = null;
    visibleMessageIdsRef.current.clear();
    visibilityStore.setSnapshot(EMPTY_MESSAGE_SCROLLER_VISIBILITY_STATE);
  }, [visibilityStore]);

  const registerMessage = useCallback<MessageScrollerRegisterMessage>(
    (messageId, element, removedElement) => {
      if (element) {
        messageElementsRef.current.set(messageId, element);
        visibilityObserverRef.current?.observe(element);
        scheduleVisibilitySync();

        if (pendingScrollToMessageRef.current?.messageId === messageId) {
          schedulePendingScrollToMessageFlush();
        }

        return;
      }

      if (removedElement && messageElementsRef.current.get(messageId) === removedElement) {
        messageElementsRef.current.delete(messageId);
        visibleMessageIdsRef.current.delete(messageId);
        visibilityObserverRef.current?.unobserve(removedElement);
        scheduleVisibilitySync();
      }
    },
    [schedulePendingScrollToMessageFlush, scheduleVisibilitySync],
  );

  const userScrollIntent = useCallback(() => {
    if (
      modeRef.current === "following-bottom" ||
      modeRef.current === "anchored-to-message" ||
      modeRef.current === "settling-jump"
    ) {
      // A deliberate gesture releases auto-follow, turn-anchoring, and an in-flight
      // programmatic jump so re-pinning (and re-arming) never fights the reader.
      streamingTurnRef.current = null;
      modeRef.current = "free-scrolling";
    }
  }, []);

  const mirrorStateAttributes = useCallback(
    () => writeStateAttributes(stateStore.getSnapshot()),
    [stateStore, writeStateAttributes],
  );

  const setRootElement = useElementRef(rootRef, mirrorStateAttributes);
  const setViewportElement = useElementRef(viewportRef, mirrorStateAttributes);

  const setContentElement = useCallback((element: HTMLDivElement | null) => {
    contentRef.current = element;
  }, []);

  const setSpacerElement = useCallback((element: HTMLDivElement | null) => {
    spacerRef.current = element;
    spacerGapRef.current = getFlexGap(element?.parentElement ?? null);
  }, []);

  const syncAfterScroll = useCallback(() => {
    commitScrollState();
    scheduleVisibilitySync();
    capturePrependAnchor();
  }, [capturePrependAnchor, commitScrollState, scheduleVisibilitySync]);

  const context = useMemo<MessageScrollerContextValue>(
    () => ({
      handleContentChange,
      handleResize,
      observeVisibility,
      preserveScrollOnPrependRef,
      scrollToEnd,
      scrollToMessage,
      scrollToStart,
      setContentElement,
      setRootElement,
      setSpacerElement,
      setViewportElement,
      stateStore,
      syncAfterScroll,
      unobserveVisibility,
      userScrollIntent,
      viewportRef,
      visibilityStore,
    }),
    [
      handleContentChange,
      handleResize,
      observeVisibility,
      scrollToEnd,
      scrollToMessage,
      scrollToStart,
      setContentElement,
      setRootElement,
      setSpacerElement,
      setViewportElement,
      stateStore,
      syncAfterScroll,
      unobserveVisibility,
      userScrollIntent,
      visibilityStore,
    ],
  );

  useLayoutEffect(() => {
    applyDefaultScrollPosition();
  }, [applyDefaultScrollPosition]);

  useEffect(() => {
    return () => {
      // Reset every ref after cancelling. StrictMode replays effects on the same
      // refs (unmount then remount), so a frame id left non-null here makes the
      // scheduler on remount think a frame is still pending and never reschedule.
      if (stateFrameRef.current !== null) {
        window.cancelAnimationFrame(stateFrameRef.current);
        stateFrameRef.current = null;
      }

      if (visibilityFrameRef.current !== null) {
        window.cancelAnimationFrame(visibilityFrameRef.current);
        visibilityFrameRef.current = null;
      }

      if (autoscrollingTimeoutRef.current !== null) {
        window.clearTimeout(autoscrollingTimeoutRef.current);
        autoscrollingTimeoutRef.current = null;
      }

      if (pendingScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(pendingScrollFrameRef.current);
        pendingScrollFrameRef.current = null;
      }

      visibilityObserverRef.current?.disconnect();
      visibilityObserverRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    if (autoScroll && modeRef.current === "following-bottom" && itemCountRef.current > 0) {
      scrollToEnd({ behavior: "auto" });
      return;
    }

    commitScrollState();
  }, [autoScroll, commitScrollState, scrollToEnd]);

  return {
    context,
    registerMessage,
  };
}

export { useMessageScrollerController };
export type { MessageScrollerRefs };

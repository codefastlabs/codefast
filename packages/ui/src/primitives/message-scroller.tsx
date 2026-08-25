import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import type { KeyboardEvent, MouseEvent, TouchEvent, UIEvent, WheelEvent } from "react";

import { useMessageScrollerController } from "#/hooks/use-message-scroller-controller";
import { USER_SCROLL_KEYS } from "#/lib/message-scroller/types";
import type {
  MessageScrollerButtonProps,
  MessageScrollerContentProps,
  MessageScrollerContextValue,
  MessageScrollerItemProps,
  MessageScrollerProps,
  MessageScrollerProviderProps,
  MessageScrollerRegisterMessage,
  MessageScrollerViewportProps,
} from "#/lib/message-scroller/types";
import { composeRefs, mergeProps, useRender } from "#/lib/use-render";

const MessageScrollerContext = createContext<MessageScrollerContextValue | null>(null);
const MessageScrollerItemContext = createContext<MessageScrollerRegisterMessage | null>(null);

function useMessageScrollerContext() {
  const context = useContext(MessageScrollerContext);

  if (!context) {
    throw new Error("useMessageScroller must be used within a MessageScroller.");
  }

  return context;
}

function useMessageScrollerItemContext() {
  const context = useContext(MessageScrollerItemContext);

  if (!context) {
    throw new Error("MessageScrollerItem must be used within a MessageScroller.");
  }

  return context;
}

/**
 * @since 0.5.0-canary.3
 */
function useMessageScroller() {
  const { scrollToEnd, scrollToMessage, scrollToStart } = useMessageScrollerContext();

  return useMemo(
    () => ({
      scrollToEnd,
      scrollToMessage,
      scrollToStart,
    }),
    [scrollToEnd, scrollToMessage, scrollToStart],
  );
}

/**
 * @since 0.5.0-canary.3
 */
function useMessageScrollerScrollable() {
  const { stateStore } = useMessageScrollerContext();

  return useSyncExternalStore(stateStore.subscribe, stateStore.getSnapshot, stateStore.getSnapshot);
}

/**
 * @since 0.5.0-canary.3
 */
function useMessageScrollerVisibility() {
  const { observeVisibility, unobserveVisibility, visibilityStore } = useMessageScrollerContext();
  const subscribe = useCallback(
    (listener: () => void) => visibilityStore.subscribe(listener, observeVisibility, unobserveVisibility),
    [observeVisibility, unobserveVisibility, visibilityStore],
  );

  return useSyncExternalStore(subscribe, visibilityStore.getSnapshot, visibilityStore.getSnapshot);
}

/**
 * @since 0.5.0-canary.3
 */
function MessageScrollerProvider({
  autoScroll = false,
  children,
  defaultScrollPosition = "end",
  scrollEdgeThreshold,
  scrollPreviousItemPeek,
  scrollMargin,
}: MessageScrollerProviderProps) {
  const { context, registerMessage } = useMessageScrollerController({
    autoScroll,
    defaultScrollPosition,
    scrollEdgeThreshold,
    scrollPreviousItemPeek,
    scrollMargin,
  });

  return (
    <MessageScrollerContext.Provider value={context}>
      <MessageScrollerItemContext.Provider value={registerMessage}>{children}</MessageScrollerItemContext.Provider>
    </MessageScrollerContext.Provider>
  );
}

/**
 * @since 0.5.0-canary.3
 */
function MessageScroller({ children, ...props }: MessageScrollerProps) {
  const { setRootElement } = useMessageScrollerContext();

  return (
    <div ref={setRootElement} {...props}>
      {children}
    </div>
  );
}

/**
 * @since 0.5.0-canary.3
 */
function MessageScrollerViewport({
  "aria-label": ariaLabel,
  children,
  onKeyDown,
  onScroll,
  onTouchMove,
  onWheel,
  preserveScrollOnPrepend = true,
  ref,
  role,
  tabIndex,
  ...props
}: MessageScrollerViewportProps) {
  const {
    preserveScrollOnPrependRef,
    scheduleResize,
    setViewportElement,
    syncAfterScroll,
    userScrollIntent,
    viewportRef,
  } = useMessageScrollerContext();

  // Layout effect, not passive: the MutationObserver reads this ref in the same commit's microtask.
  useLayoutEffect(() => {
    preserveScrollOnPrependRef.current = preserveScrollOnPrepend;
  }, [preserveScrollOnPrependRef, preserveScrollOnPrepend]);

  const setViewportRef = useCallback(
    (element: HTMLDivElement | null) => {
      setViewportElement(element);
      composeRefs(ref)?.(element);
    },
    [ref, setViewportElement],
  );

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    syncAfterScroll();
    onScroll?.(event);
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    userScrollIntent();
    onWheel?.(event);
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    userScrollIntent();
    onTouchMove?.(event);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (USER_SCROLL_KEYS.has(event.key)) {
      userScrollIntent();
    }

    onKeyDown?.(event);
  }

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport || typeof ResizeObserver === "undefined") {
      return;
    }

    // scheduleResize self-coalesces, deferring any pass that would resize the
    // observed spacer out of ResizeObserver delivery.
    const observer = new ResizeObserver(scheduleResize);

    observer.observe(viewport);

    return () => observer.disconnect();
  }, [scheduleResize, viewportRef]);

  return (
    // The viewport defaults to role="region"; the scroll/key handlers back that landmark.
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- role default is dynamic
    <div
      ref={setViewportRef}
      role={role ?? "region"}
      aria-label={ariaLabel ?? "Messages"}
      tabIndex={tabIndex ?? 0}
      onKeyDown={handleKeyDown}
      onScroll={handleScroll}
      onTouchMove={handleTouchMove}
      onWheel={handleWheel}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * @since 0.5.0-canary.3
 */
function MessageScrollerContent({
  "aria-relevant": ariaRelevant,
  children,
  ref,
  role,
  spacerClassName,
  ...props
}: MessageScrollerContentProps) {
  const { handleContentChange, scheduleResize, setContentElement, setSpacerElement } = useMessageScrollerContext();
  const contentRef = useRef<HTMLDivElement | null>(null);

  const setContentRef = useCallback(
    (element: HTMLDivElement | null) => {
      contentRef.current = element;
      setContentElement(element);
      composeRefs(ref)?.(element);
    },
    [ref, setContentElement],
  );

  useLayoutEffect(() => {
    const content = contentRef.current;

    if (!content) {
      return;
    }

    handleContentChange();

    if (typeof MutationObserver === "undefined") {
      return;
    }

    const observer = new MutationObserver(() => {
      handleContentChange();
    });

    observer.observe(content, { childList: true });

    return () => observer.disconnect();
  }, [handleContentChange]);

  useEffect(() => {
    const content = contentRef.current;

    if (!content || typeof ResizeObserver === "undefined") {
      return;
    }

    // scheduleResize self-coalesces, deferring any pass that would resize the
    // spacer inside this observed element out of ResizeObserver delivery.
    const observer = new ResizeObserver(scheduleResize);

    observer.observe(content);

    return () => observer.disconnect();
  }, [scheduleResize]);

  return (
    <div ref={setContentRef} role={role ?? "log"} aria-relevant={ariaRelevant ?? "additions"} {...props}>
      {children}
      <div
        ref={setSpacerElement}
        aria-hidden="true"
        data-message-scroller-spacer=""
        hidden
        className={spacerClassName}
      />
    </div>
  );
}

/**
 * @since 0.5.0-canary.3
 */
function MessageScrollerItem({ messageId, ref, isScrollAnchor = false, ...props }: MessageScrollerItemProps) {
  const registerMessage = useMessageScrollerItemContext();
  const elementRef = useRef<HTMLDivElement | null>(null);

  const setItemRef = useCallback(
    (element: HTMLDivElement | null) => {
      const previousElement = elementRef.current;

      elementRef.current = element;

      if (messageId) {
        registerMessage(messageId, element, previousElement);
      }

      composeRefs(ref)?.(element);
    },
    [messageId, ref, registerMessage],
  );

  return (
    <div
      ref={setItemRef}
      data-message-id={messageId}
      data-scroll-anchor={isScrollAnchor ? "true" : "false"}
      {...props}
    />
  );
}

/**
 * @since 0.5.0-canary.3
 */
function MessageScrollerButton({
  behavior = "smooth",
  children,
  direction = "end",
  onClick,
  render,
  tabIndex,
  type = "button",
  ...props
}: MessageScrollerButtonProps) {
  const { scrollToEnd, scrollToStart, stateStore } = useMessageScrollerContext();
  const subscribe = useCallback((listener: () => void) => stateStore.subscribe(listener), [stateStore]);
  const getSnapshot = useCallback(() => {
    const state = stateStore.getSnapshot();

    if (direction === "start") {
      return state.start;
    }

    // Follow-output is already closing any end gap; advertising it would
    // strobe the button once per streamed chunk.
    return state.end && !state.following;
  }, [direction, stateStore]);
  const isActive = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (!isActive) {
        return;
      }

      onClick?.(event);

      if (!event.defaultPrevented) {
        event.currentTarget.blur();

        if (direction === "start") {
          scrollToStart({ behavior });
        } else {
          scrollToEnd({ behavior });
        }
      }
    },
    [behavior, direction, isActive, onClick, scrollToEnd, scrollToStart],
  );

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        type,
        inert: !isActive,
        tabIndex: isActive ? tabIndex : -1,
        children: children ?? <span>Scroll to {direction}</span>,
        onClick: handleClick,
      },
      props,
    ),
    render,
    state: {
      active: isActive,
      direction,
    },
    stateAttributesMapping: {
      active: (value) => ({
        "data-active": value ? "true" : "false",
      }),
    },
  });
}

export {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
};

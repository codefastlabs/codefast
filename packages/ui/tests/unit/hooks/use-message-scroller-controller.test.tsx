import { cleanup, render } from "@testing-library/react";
import { act, createRef, useEffect } from "react";
import type { RefObject } from "react";

import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScrollerScrollable,
} from "#/components/message-scroller";
import type { MessageScrollerDefaultScrollPosition, MessageScrollerScrollable } from "#/components/message-scroller";
import { createDomRect } from "#/tests/unit/support/dom-rect";

// jsdom has no layout, so this harness fakes it: element heights come from
// data-test-height, rects and scroll math are derived from them, and rAF runs
// on fake timers so the frame-coalesced resize/commit paths are exercised.

const VIEWPORT_HEIGHT = 100;

interface TestMessage {
  height?: number | undefined;
  id: string;
  isScrollAnchor?: boolean | undefined;
}

interface TestScrollerOptions {
  autoScroll?: boolean | undefined;
  defaultScrollPosition?: MessageScrollerDefaultScrollPosition | undefined;
  messages: Array<TestMessage>;
}

let resizeObservers: Array<TestResizeObserver> = [];
let originalRequestAnimationFrame: typeof window.requestAnimationFrame;
let originalCancelAnimationFrame: typeof window.cancelAnimationFrame;
let originalResizeObserver: typeof window.ResizeObserver | undefined;
let originalGetBoundingClientRect: typeof HTMLElement.prototype.getBoundingClientRect;
let originalScrollTo: typeof HTMLElement.prototype.scrollTo;

class TestResizeObserver {
  private readonly callback: ResizeObserverCallback;
  private readonly elements = new Set<Element>();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    resizeObservers.push(this);
  }

  disconnect(): void {
    this.elements.clear();
    resizeObservers = resizeObservers.filter((observer) => observer !== this);
  }

  has(element: Element): boolean {
    return this.elements.has(element);
  }

  observe(element: Element): void {
    this.elements.add(element);
    window.requestAnimationFrame(() => {
      this.trigger();
    });
  }

  trigger(): void {
    this.callback([], this as unknown as ResizeObserver);
  }

  unobserve(element: Element): void {
    this.elements.delete(element);
  }
}

function getMessageElements(content: HTMLElement): Array<HTMLElement> {
  return [...content.children].filter(
    (child): child is HTMLElement => child instanceof HTMLElement && child.dataset.testid === "message",
  );
}

function getElementHeight(element: HTMLElement): number {
  return Number(element.dataset.testHeight ?? 0);
}

function getContentHeight(element: HTMLElement): number {
  const content =
    element.dataset.testid === "content" ? element : element.querySelector<HTMLElement>("[data-testid=content]");

  if (!content) {
    return 0;
  }

  const messagesHeight = getMessageElements(content).reduce((height, message) => height + getElementHeight(message), 0);
  const spacer = content.querySelector<HTMLElement>("[data-message-scroller-spacer]");
  const spacerHeight = spacer && !spacer.hidden ? Number.parseFloat(spacer.style.height) || 0 : 0;

  return messagesHeight + spacerHeight;
}

function getElementOffset(content: HTMLElement, element: HTMLElement): number {
  let offset = 0;

  for (const message of getMessageElements(content)) {
    if (message === element) {
      return offset;
    }

    offset += getElementHeight(message);
  }

  return offset;
}

function getTestRect(element: HTMLElement): DOMRect {
  const viewport =
    element.dataset.testid === "viewport"
      ? element
      : (element.closest("[data-testid=scroller]")?.querySelector<HTMLElement>("[data-testid=viewport]") ?? null);

  if (element.dataset.testid === "viewport") {
    return createDomRect(0, element.clientHeight);
  }

  if (!viewport) {
    return createDomRect(0, 0);
  }

  if (element.dataset.testid === "content") {
    return createDomRect(-viewport.scrollTop, getContentHeight(element));
  }

  if (element.dataset.testid === "message") {
    const content = element.parentElement as HTMLElement;

    return createDomRect(getElementOffset(content, element) - viewport.scrollTop, getElementHeight(element));
  }

  return createDomRect(0, 0);
}

beforeEach(() => {
  resizeObservers = [];

  // Captured before the fake timers install, so the restore in afterEach puts
  // back the real environment rather than sinon's fakes.
  originalRequestAnimationFrame = window.requestAnimationFrame;
  originalCancelAnimationFrame = window.cancelAnimationFrame;
  originalResizeObserver = window.ResizeObserver;
  // oxlint-disable-next-line unbound-method -- saving the original for restore, never calling it unbound
  originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
  // oxlint-disable-next-line unbound-method -- saving the original for restore, never calling it unbound
  originalScrollTo = HTMLElement.prototype.scrollTo;

  vi.useFakeTimers();

  window.requestAnimationFrame = (callback) =>
    window.setTimeout(() => {
      callback(performance.now());
    }, 16);
  window.cancelAnimationFrame = (handle) => {
    window.clearTimeout(handle);
  };
  window.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;

  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get(this: HTMLElement) {
      if (this.dataset.testHeight) {
        return Number(this.dataset.testHeight);
      }

      if (this.dataset.testid === "viewport") {
        return VIEWPORT_HEIGHT;
      }

      return 0;
    },
  });

  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable: true,
    get(this: HTMLElement) {
      if (this.dataset.testid === "viewport" || this.dataset.testid === "content") {
        return getContentHeight(this);
      }

      return this.clientHeight;
    },
  });

  HTMLElement.prototype.scrollTo = function scrollTo(
    this: HTMLElement,
    optionsOrX?: ScrollToOptions | number,
    y?: number,
  ) {
    const top = typeof optionsOrX === "number" ? y : optionsOrX?.top;

    if (typeof top === "number") {
      this.scrollTop = Math.max(0, top);
    }
  } as typeof HTMLElement.prototype.scrollTo;

  HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return getTestRect(this);
  };
});

afterEach(() => {
  // Unmount here, before the restores, so component teardown still runs under
  // the mocked timers and geometry (RTL's own auto-cleanup would run after).
  cleanup();

  window.requestAnimationFrame = originalRequestAnimationFrame;
  window.cancelAnimationFrame = originalCancelAnimationFrame;
  window.ResizeObserver = originalResizeObserver as typeof ResizeObserver;
  HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
  HTMLElement.prototype.scrollTo = originalScrollTo;
  // Remove the own descriptors so the prototype chain's originals apply again.
  delete (HTMLElement.prototype as { clientHeight?: number }).clientHeight;
  delete (HTMLElement.prototype as { scrollHeight?: number }).scrollHeight;

  vi.useRealTimers();
});

async function flushAnimationFrames(count = 4): Promise<void> {
  for (let index = 0; index < count; index++) {
    await vi.advanceTimersByTimeAsync(20);
  }
}

async function triggerResize(element: Element): Promise<void> {
  await act(async () => {
    for (const observer of resizeObservers) {
      if (observer.has(element)) {
        observer.trigger();
      }
    }

    await flushAnimationFrames();
  });
}

function ScrollableProbe({ stateRef }: { stateRef: RefObject<MessageScrollerScrollable | null> }) {
  const scrollable = useMessageScrollerScrollable();

  useEffect(() => {
    stateRef.current = scrollable;
  });

  return null;
}

function TestScroller({
  autoScroll = false,
  defaultScrollPosition = "end",
  messages,
  stateRef,
}: TestScrollerOptions & { stateRef: RefObject<MessageScrollerScrollable | null> }) {
  return (
    <MessageScrollerProvider autoScroll={autoScroll} defaultScrollPosition={defaultScrollPosition}>
      <MessageScroller data-testid="scroller">
        <MessageScrollerViewport data-testid="viewport">
          <MessageScrollerContent data-testid="content">
            {messages.map((message) => (
              <MessageScrollerItem
                key={message.id}
                data-testid="message"
                data-test-height={message.height ?? 40}
                isScrollAnchor={message.isScrollAnchor ?? false}
                messageId={message.id}
              >
                {message.id}
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton data-testid="button" />
        <ScrollableProbe stateRef={stateRef} />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

function queryElement<Result extends HTMLElement>(container: HTMLElement, selector: string): Result {
  const element = container.querySelector<Result>(selector);

  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }

  return element;
}

async function renderScroller(options: TestScrollerOptions) {
  const stateRef = createRef<MessageScrollerScrollable | null>();
  let currentOptions = options;
  const view = render(<TestScroller {...currentOptions} stateRef={stateRef} />);

  await act(async () => {
    await flushAnimationFrames();
  });

  return {
    button: () => queryElement<HTMLButtonElement>(view.container, "[data-testid=button]"),
    content: () => queryElement<HTMLDivElement>(view.container, "[data-testid=content]"),
    message: (messageId: string) => queryElement<HTMLDivElement>(view.container, `[data-message-id="${messageId}"]`),
    rerender: async (messages: Array<TestMessage>, nextOptions: Omit<TestScrollerOptions, "messages"> = {}) => {
      currentOptions = { ...currentOptions, ...nextOptions, messages };
      view.rerender(<TestScroller {...currentOptions} stateRef={stateRef} />);

      await act(async () => {
        await flushAnimationFrames();
      });
    },
    state: () => {
      if (!stateRef.current) {
        throw new Error("MessageScroller state was not captured.");
      }

      return stateRef.current;
    },
    viewport: () => queryElement<HTMLDivElement>(view.container, "[data-testid=viewport]"),
  };
}

describe("useMessageScrollerController follow mode", () => {
  test("opens at the end and follows appends with autoScroll", async () => {
    const rendered = await renderScroller({
      autoScroll: true,
      messages: [
        { id: "message-1", height: 80 },
        { id: "message-2", height: 80 },
        { id: "message-3", height: 80 },
      ],
    });

    expect(rendered.viewport().scrollTop).toBe(140);

    await rendered.rerender([
      { id: "message-1", height: 80 },
      { id: "message-2", height: 80 },
      { id: "message-3", height: 80 },
      { id: "message-4", height: 80 },
    ]);

    expect(rendered.viewport().scrollTop).toBe(220);
  });

  test("holds a newly appended anchor at the reading line while the reply streams with autoScroll", async () => {
    const rendered = await renderScroller({
      autoScroll: true,
      messages: [
        { id: "message-1", height: 80 },
        { id: "message-2", height: 80 },
        { id: "message-3", height: 80 },
      ],
    });

    expect(rendered.viewport().scrollTop).toBe(140);

    await rendered.rerender([
      { id: "message-1", height: 80 },
      { id: "message-2", height: 80 },
      { id: "message-3", height: 80 },
      { id: "message-4", height: 40, isScrollAnchor: true },
    ]);

    expect(rendered.viewport().scrollTop).toBe(176);
    expect(rendered.message("message-4").getBoundingClientRect().top).toBe(64);

    // The anchored turn was placed with no tail spacer (the content already
    // fills the viewport), so growth must keep holding it at the reading line
    // instead of yanking the reader to the live edge.
    rendered.message("message-4").dataset.testHeight = "160";
    await triggerResize(rendered.content());

    expect(rendered.message("message-4").getBoundingClientRect().top).toBe(64);
  });

  test("hands off from the anchor hold to following once the streamed reply fills the viewport", async () => {
    const rendered = await renderScroller({
      autoScroll: true,
      messages: [
        { id: "message-1", height: 80 },
        { id: "message-2", height: 80 },
        { id: "message-3", height: 80 },
      ],
    });

    expect(rendered.viewport().scrollTop).toBe(140);

    // The submitted turn anchors at the reading line with tail spacer room
    // below for the reply to stream into.
    await rendered.rerender([
      { id: "message-1", height: 80 },
      { id: "message-2", height: 80 },
      { id: "message-3", height: 80 },
      { id: "message-4", height: 20, isScrollAnchor: true },
    ]);

    expect(rendered.viewport().scrollTop).toBe(176);
    expect(rendered.message("message-4").getBoundingClientRect().top).toBe(64);

    // The reply streams in below the anchor. While it still fits in the
    // spacer room the anchor holds and following stays off.
    await rendered.rerender([
      { id: "message-1", height: 80 },
      { id: "message-2", height: 80 },
      { id: "message-3", height: 80 },
      { id: "message-4", height: 20, isScrollAnchor: true },
      { id: "message-5", height: 8 },
    ]);
    await triggerResize(rendered.content());

    expect(rendered.viewport().scrollTop).toBe(176);
    expect(rendered.message("message-4").getBoundingClientRect().top).toBe(64);

    // Growth past the spacer means the reply has filled the viewport and the
    // reader is at the live edge, so autoScroll takes over from the anchor.
    rendered.message("message-5").dataset.testHeight = "60";
    await triggerResize(rendered.content());

    expect(rendered.viewport().scrollTop).toBe(220);
    expect(rendered.state().following).toBe(true);

    // Follow-output stays engaged for the rest of the stream.
    rendered.message("message-5").dataset.testHeight = "100";
    await triggerResize(rendered.content());

    expect(rendered.viewport().scrollTop).toBe(260);
    expect(rendered.state().following).toBe(true);
  });

  test("keeps the anchor hold when the viewport shrinks and consumes the spacer", async () => {
    const rendered = await renderScroller({
      autoScroll: true,
      messages: [
        { id: "message-1", height: 80 },
        { id: "message-2", height: 80 },
        { id: "message-3", height: 80 },
      ],
    });

    await rendered.rerender([
      { id: "message-1", height: 80 },
      { id: "message-2", height: 80 },
      { id: "message-3", height: 80 },
      { id: "message-4", height: 20, isScrollAnchor: true },
    ]);

    expect(rendered.viewport().scrollTop).toBe(176);
    expect(rendered.message("message-4").getBoundingClientRect().top).toBe(64);

    // A viewport shrink (keyboard, resize) consumes the spacer without any
    // reply growth; the reader is still mid-read, so the hold must survive.
    rendered.viewport().dataset.testHeight = "80";
    await triggerResize(rendered.viewport());

    expect(rendered.viewport().scrollTop).toBe(176);
    expect(rendered.message("message-4").getBoundingClientRect().top).toBe(64);
    expect(rendered.state().following).toBe(false);
  });

  test("keeps following when a state commit sees growth before the coalesced resize handler", async () => {
    const rendered = await renderScroller({
      autoScroll: true,
      messages: [
        { id: "message-1", height: 80 },
        { id: "message-2", height: 80 },
        { id: "message-3", height: 80 },
      ],
    });

    expect(rendered.viewport().scrollTop).toBe(140);

    // Let the opening scroll-to-end settle so the autoscrolling flag clears.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    // A scroll event commits while a streamed chunk has grown content past the
    // live edge but before the resize pass catches follow up: the reader did
    // not move, so follow must hold and the end button must stay quiet.
    rendered.message("message-3").dataset.testHeight = "160";
    await act(async () => {
      rendered.viewport().dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    expect(rendered.state().following).toBe(true);
    expect(rendered.state().end).toBe(true);
    expect(rendered.button().dataset.active).toBe("false");

    await triggerResize(rendered.content());

    expect(rendered.viewport().scrollTop).toBe(220);
    expect(rendered.state().following).toBe(true);
  });

  test("releases follow and activates the button when the reader scrolls up", async () => {
    const rendered = await renderScroller({
      autoScroll: true,
      messages: [
        { id: "message-1", height: 80 },
        { id: "message-2", height: 80 },
        { id: "message-3", height: 80 },
      ],
    });

    expect(rendered.viewport().scrollTop).toBe(140);

    // Let the opening scroll-to-end settle so the autoscrolling flag clears.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    rendered.viewport().scrollTop = 60;
    await act(async () => {
      rendered.viewport().dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    expect(rendered.state().following).toBe(false);
    expect(rendered.state().end).toBe(true);
    expect(rendered.button().dataset.active).toBe("true");

    // Later appends must leave the released reader where they are.
    await rendered.rerender([
      { id: "message-1", height: 80 },
      { id: "message-2", height: 80 },
      { id: "message-3", height: 80 },
      { id: "message-4", height: 80 },
    ]);

    expect(rendered.viewport().scrollTop).toBe(60);
  });

  test("releases follow when the scroll up lands inside the autoscrolling window", async () => {
    const rendered = await renderScroller({
      autoScroll: true,
      messages: [
        { id: "message-1", height: 80 },
        { id: "message-2", height: 80 },
        { id: "message-3", height: 80 },
      ],
    });

    expect(rendered.viewport().scrollTop).toBe(140);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    // A streamed chunk re-engages the autoscrolling suppression window.
    rendered.message("message-3").dataset.testHeight = "160";
    await triggerResize(rendered.content());

    expect(rendered.viewport().scrollTop).toBe(220);

    // The reader scrolls up before the window clears: those commits are
    // suppressed but must not consume the release evidence, so the clearing
    // commit still releases follow.
    rendered.viewport().scrollTop = 100;
    await act(async () => {
      rendered.viewport().dispatchEvent(new Event("scroll", { bubbles: true }));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(rendered.state().following).toBe(false);
    expect(rendered.state().end).toBe(true);
    expect(rendered.button().dataset.active).toBe("true");
  });
});

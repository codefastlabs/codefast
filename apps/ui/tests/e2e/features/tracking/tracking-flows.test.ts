import { expect, test } from "vitest";

import {
  closeTrackingSession,
  gotoWithConsent,
  openTrackingSession,
  spaNavigate,
  type TrackingBrowserSession,
} from "#/tests/e2e/support/browser";
import { clearCapturedEvents, expectTrackedEvent, readCapturedEvents } from "#/tests/e2e/support/tracking-probe";

/**
 * Production search debounce is 500ms. `expect.poll` returns as soon as the event
 * appears — this is only the ceiling (buffer for timer + probe latency).
 */
const SEARCH_DEBOUNCE_POLL_MS = 1_000;

async function openCommandPalette(session: TrackingBrowserSession) {
  const { page } = session;
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /search components/i }).click();
  const input = page.getByPlaceholder(/search components and pages/i);
  await input.waitFor({ state: "visible", timeout: 5_000 });
  return input;
}

test.describe("apps/ui tracking flows", () => {
  let session: TrackingBrowserSession;

  test.beforeAll(async () => {
    session = await openTrackingSession();
    await gotoWithConsent(session, "/");
  });

  test.afterAll(async () => {
    await closeTrackingSession(session);
  });

  test("search_query from command palette debounce", async () => {
    const input = await openCommandPalette(session);
    await input.fill("button");

    await expect
      .poll(
        async () => {
          const events = await readCapturedEvents(session.page);
          return events.some((event) => event.name === "search_query" && event.properties.queryLength === 6);
        },
        { timeout: SEARCH_DEBOUNCE_POLL_MS },
      )
      .toBe(true);

    expectTrackedEvent(await readCapturedEvents(session.page), "search_query", { queryLength: 6 });
  });

  test("select_search_result for a page via palette", async () => {
    await clearCapturedEvents(session.page);
    const input = await openCommandPalette(session);
    await input.fill("");
    await session.page.getByRole("option", { name: /^Getting Started$/i }).click();
    await session.page.waitForURL(/\/about/);

    expect(
      expectTrackedEvent(await readCapturedEvents(session.page), "select_search_result", {
        resultType: "page",
        destination: "/about",
        hadQuery: false,
      }).properties,
    ).toMatchObject({ resultType: "page", destination: "/about" });
  });

  test("select_search_result for a component via palette", async () => {
    await clearCapturedEvents(session.page);
    const componentInput = await openCommandPalette(session);
    await componentInput.fill("dialog");
    const dialogResult = session.page.getByRole("option", { name: /^Dialog\b/i });
    await dialogResult.waitFor({ state: "visible", timeout: 5_000 });
    await dialogResult.click();
    await session.page.waitForURL(/\/components\/dialog/);

    expect(
      expectTrackedEvent(await readCapturedEvents(session.page), "select_search_result", {
        resultType: "component",
        slug: "dialog",
        hadQuery: true,
      }).properties,
    ).toMatchObject({ resultType: "component", slug: "dialog" });
  });

  test("select_component from gallery card", async () => {
    await spaNavigate(session, "/components");
    // Letter-band sections (not the Components sidebar nav) — same link text on both.
    await session.page
      .locator("section[aria-labelledby]")
      .getByRole("link", { name: /^Button$/ })
      .click();
    await session.page.waitForURL(/\/components\/button/);

    expect(
      expectTrackedEvent(await readCapturedEvents(session.page), "select_component", {
        slug: "button",
        surface: "gallery-card",
      }).properties,
    ).toMatchObject({ slug: "button", surface: "gallery-card" });
  });

  test("detail copy_page, open_external, and copy_code", async () => {
    await clearCapturedEvents(session.page);
    const copyPage = session.page.getByRole("button", { name: /^Copy page$/i });
    await copyPage.waitFor({ state: "visible", timeout: 5_000 });
    await copyPage.click();
    await expect
      .poll(async () => {
        const events = await readCapturedEvents(session.page);
        return events.some((event) => event.name === "copy_page");
      })
      .toBe(true);

    expectTrackedEvent(await readCapturedEvents(session.page), "copy_page", {
      slug: "button",
      variant: "markdown",
    });

    await clearCapturedEvents(session.page);
    await session.page.getByRole("button", { name: /more copy options/i }).click();
    session.page.once("popup", (popup) => {
      void popup.close();
    });
    await session.page.getByRole("menuitem", { name: /open in chatgpt/i }).click();
    await expect
      .poll(async () => {
        const events = await readCapturedEvents(session.page);
        return events.some((event) => event.name === "open_external" && event.properties.destination === "chatgpt");
      })
      .toBe(true);

    expectTrackedEvent(await readCapturedEvents(session.page), "open_external", {
      destination: "chatgpt",
      surface: "copy-page-menu",
      slug: "button",
    });

    await clearCapturedEvents(session.page);
    await session.page.keyboard.press("Escape");
    await session.page
      .getByRole("button", { name: /^Copy$/i })
      .first()
      .click();
    await expect
      .poll(async () => {
        const events = await readCapturedEvents(session.page);
        return events.some((event) => event.name === "copy_code");
      })
      .toBe(true);

    const copyCode = expectTrackedEvent(await readCapturedEvents(session.page), "copy_code", {});
    expect(copyCode.properties).toMatchObject({
      kind: expect.stringMatching(/^(install-command|setup-snippet|usage-example)$/),
      name: expect.any(String),
    });
  });

  test("select_component from gallery sidebar", async () => {
    await spaNavigate(session, "/components");
    await session.page
      .getByRole("navigation", { name: "Components" })
      .getByRole("link", { name: /^Accordion$/ })
      .click();
    await session.page.waitForURL(/\/components\/accordion/);

    expect(
      expectTrackedEvent(await readCapturedEvents(session.page), "select_component", {
        slug: "accordion",
        surface: "gallery-sidebar",
      }).properties,
    ).toMatchObject({ slug: "accordion", surface: "gallery-sidebar" });
  });

  test("open_external from header GitHub link", async () => {
    await clearCapturedEvents(session.page);
    session.page.once("popup", (popup) => {
      void popup.close();
    });
    await session.page.getByRole("link", { name: /github repository/i }).click();
    await expect
      .poll(async () => {
        const events = await readCapturedEvents(session.page);
        return events.some((event) => event.name === "open_external" && event.properties.destination === "github");
      })
      .toBe(true);

    expect(
      expectTrackedEvent(await readCapturedEvents(session.page), "open_external", {
        destination: "github",
        surface: "header",
      }).properties,
    ).toMatchObject({ destination: "github", surface: "header" });
  });
});

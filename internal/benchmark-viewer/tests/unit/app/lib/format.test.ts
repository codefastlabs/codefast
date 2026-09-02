import { describe, expect, it } from "vitest";

import { fmtRunTick, formatLocal, resolveTimeConventions } from "#/app/lib/format";

// Mid-month noon UTC: whatever the test machine's timezone, the month stays August.
const MID_MONTH_ISO = "2026-08-17T12:00:00.000Z";

const VI = resolveTimeConventions(undefined, "Asia/Ho_Chi_Minh");
const EN_US = resolveTimeConventions("en-US", "America/New_York");

describe("resolveTimeConventions", () => {
  it("lets the timezone outrank an English browser language", () => {
    expect(resolveTimeConventions("en-US", "Asia/Ho_Chi_Minh")).toBe(VI);
    expect(resolveTimeConventions("en-US", "Asia/Saigon")).toBe(VI);
  });

  it("falls back to the browser language when the timezone is unmapped", () => {
    expect(resolveTimeConventions("vi-VN", "Europe/Berlin")).toBe(VI);
    expect(resolveTimeConventions("vi", undefined)).toBe(VI);
  });

  it("defaults to US conventions with no matching signal", () => {
    expect(resolveTimeConventions("de-DE", "Europe/Berlin")).toBe(EN_US);
    expect(resolveTimeConventions(undefined, undefined)).toBe(EN_US);
  });
});

describe("formatLocal", () => {
  it("formats day-first with a 24-hour clock under Vietnamese conventions", () => {
    expect(formatLocal(MID_MONTH_ISO, "fallback", VI)).toMatch(/^\d{1,2}\/8\/26, \d{2}:\d{2}$/);
  });

  it("formats month-first with a 12-hour clock under US conventions", () => {
    expect(formatLocal(MID_MONTH_ISO, "fallback", EN_US)).toMatch(/^8\/\d{1,2}\/26, \d{1,2}:\d{2} (AM|PM)$/);
  });

  it("falls back to the folder name for missing or invalid timestamps", () => {
    expect(formatLocal(undefined, "folder-a", VI)).toBe("folder-a");
    expect(formatLocal("not-a-date", "folder-b", VI)).toBe("folder-b");
  });
});

describe("fmtRunTick", () => {
  it("formats a day-first year-less tick on a multi-day axis", () => {
    expect(fmtRunTick(MID_MONTH_ISO, "fallback", false, VI)).toMatch(/^\d{1,2}\/8 \d{2}:\d{2}$/);
  });

  it("formats time only on a single-day axis", () => {
    expect(fmtRunTick(MID_MONTH_ISO, "fallback", true, VI)).toMatch(/^\d{2}:\d{2}$/);
  });

  it("falls back to the folder name for missing or invalid timestamps", () => {
    expect(fmtRunTick(undefined, "folder-a", false, VI)).toBe("folder-a");
    expect(fmtRunTick("not-a-date", "folder-b", true, VI)).toBe("folder-b");
  });
});

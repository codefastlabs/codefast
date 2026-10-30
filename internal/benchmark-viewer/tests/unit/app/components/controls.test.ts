import { createElement } from "react";
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { ChartControlPanel } from "#app/components/controls";
import type { EmbeddedScenarioSeries } from "#types";

const scenario = (id: string, group: string): EmbeddedScenarioSeries => ({
  facets: [],
  group,
  id,
  libraries: {},
  what: id,
});

const noop = (): void => undefined;

const baseProps: ComponentProps<typeof ChartControlPanel> = {
  configKey: "",
  configLabelMap: {},
  envKey: "",
  envLabelMap: { "m3|26": "Apple M3 Max · Node 26" },
  facetLabels: [],
  group: "",
  hasMore: false,
  isReloading: false,
  onConfigChange: noop,
  onEnvChange: noop,
  onGroupChange: noop,
  onLoadOlderRuns: noop,
  onReload: noop,
  onRunWindowChange: noop,
  onScenarioChange: noop,
  onScenarioNext: noop,
  onScenarioPrev: noop,
  onSearchChange: noop,
  onToggleFacet: noop,
  reportRunFolder: undefined,
  runWindow: "all",
  scenarioId: "complex-with-merge",
  scenarioIndex: 1,
  search: "",
  selectedFacets: [],
  uniqueConfigKeys: ["iso|default|t3"],
  uniqueEnvKeys: ["m3|26"],
  uniqueGroups: ["simple", "complex"],
  visibleScenarios: [
    scenario("simple-with-merge", "simple"),
    scenario("complex-with-merge", "complex"),
    scenario("cn", "cn"),
  ],
};

const render = (props: Partial<ComponentProps<typeof ChartControlPanel>> = {}): string =>
  renderToString(createElement(ChartControlPanel, { ...baseProps, ...props }));

describe("ChartControlPanel", () => {
  test("shows the selected scenario with its group and its place in the list", () => {
    const html = render();

    expect(html).toContain(">complex<");
    expect(html).toContain(">complex-with-merge<");
    expect(html).toContain("2 / 3");
    expect(html).toContain('id="ctrl-scenario"');
  });

  test("disables the step that has nowhere to go", () => {
    expect(render({ scenarioIndex: 0 })).toMatch(/<button[^>]*aria-label="Previous scenario"[^>]*disabled=""/);
    expect(render({ scenarioIndex: 2 })).toMatch(/<button[^>]*aria-label="Next scenario"[^>]*disabled=""/);
  });

  test("names each filter chip with its current value", () => {
    const html = render({ envKey: "m3|26", group: "complex", runWindow: "20" });

    expect(html).toContain("Apple M3 Max · Node 26");
    expect(html).toContain(">Last 20<");
    expect(html).toMatch(/>Group<\/span><span[^>]*>complex</);
  });

  test("keeps the search field the command palette focuses", () => {
    expect(render()).toContain('id="scenario-search"');
  });

  test("offers the configuration chip only when runs differ in configuration", () => {
    expect(render()).not.toContain('id="ctrl-config"');
    expect(render({ uniqueConfigKeys: ["a", "b"] })).toContain('id="ctrl-config"');
  });

  test("offers the report download only when a run has one", () => {
    expect(render()).not.toContain("/api/report.md");

    const html = render({ reportRunFolder: "2026-10-30T06-11-54-426Z" });

    expect(html).toContain("/api/report.md?run=2026-10-30T06-11-54-426Z");
    expect(html).toContain("/api/report.json?run=2026-10-30T06-11-54-426Z");
  });
});

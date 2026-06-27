import { useState } from "react";
import { expect, fn } from "storybook/test";

import { InputSearch } from "#/components/input-search";

import preview from "../.storybook/preview";

/**
 * InputSearch — a prop-driven search field built on InputGroup: a leading search icon, a
 * `type="search"` input, and a clear (✕) button that appears once the field has a value. The
 * root owns the interesting props (`placeholder`, `disabled`, `readOnly`, `defaultValue`/`value`),
 * and `{...args}` drives them. Content is authored for Storybook, NOT synced with the apps/web
 * registry.
 *
 * **Anatomy:** `InputSearch` wraps `InputGroup > (InputGroupAddon[search icon] + InputGroupInput + InputGroupButton[clear])`.
 */
const meta = preview.meta({
  args: { defaultValue: "", disabled: false, placeholder: "Search components…", readOnly: false },
  argTypes: {
    defaultValue: { control: "text" },
    disabled: { control: "boolean" },
    onChange: { table: { disable: true } },
    placeholder: { control: "text" },
    readOnly: { control: "boolean" },
    value: { table: { disable: true } },
  },
  component: InputSearch,
  parameters: {
    controls: { include: ["placeholder", "disabled", "readOnly", "defaultValue"] },
    docs: {
      description: {
        component:
          "Search input with a leading magnifier and a clear button that surfaces once a value is present. Calls `onChange(value)` with the raw string (or `undefined`) on every keystroke and on clear.",
      },
    },
  },
  title: "Form/InputSearch",
});

export const Default = meta.story({
  render: (args) => (
    <div className="w-full max-w-xs">
      <InputSearch aria-label="Search" {...args} />
    </div>
  ),
});

export const WithValue = meta.story({
  args: { defaultValue: "button" },
  render: Default.input.render,
});

export const Disabled = meta.story({
  args: { defaultValue: "Indexing…", disabled: true },
  render: Default.input.render,
});

export const ReadOnly = meta.story({
  args: { defaultValue: "Locked query", readOnly: true },
  render: Default.input.render,
});

/** A genuinely different composition: the search value drives a live-filtered result list. */
export const WithResults = meta.story({
  render: function WithResultsRender() {
    const fruits = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry", "Grape", "Mango", "Orange"];
    const [query, setQuery] = useState("");

    const matches = fruits.filter((fruit) => fruit.toLowerCase().includes(query.toLowerCase()));

    return (
      <div className="w-full max-w-xs space-y-2">
        <InputSearch
          aria-label="Filter fruit"
          placeholder="Filter fruit…"
          value={query}
          onChange={(value) => {
            setQuery(value ?? "");
          }}
        />
        <ul className="rounded-lg border border-border">
          {matches.length > 0 ? (
            matches.map((fruit) => (
              <li key={fruit} className="border-b border-border/60 px-3 py-1.5 text-sm last:border-0">
                {fruit}
              </li>
            ))
          ) : (
            <li className="px-3 py-1.5 text-sm text-muted-foreground">No matches</li>
          )}
        </ul>
      </div>
    );
  },
});

export const Typing = meta.story({
  args: { onChange: fn() },
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
Typing.test("types a query and clears it", async ({ args, canvas, userEvent }) => {
  const input = canvas.getByRole("searchbox", { name: "Search" });

  await userEvent.type(input, "button");
  await expect(input).toHaveValue("button");
  await expect(args.onChange).toHaveBeenCalled();

  // Clear button only appears once the field has a value.
  await userEvent.click(canvas.getByRole("button", { name: "Clear search" }));
  await expect(input).toHaveValue("");
});

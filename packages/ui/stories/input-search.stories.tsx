import { useState } from "react";
import { expect } from "storybook/test";

import { InputSearch } from "#/components/input-search";

import preview from "../.storybook/preview";

const meta = preview.meta({
  component: InputSearch,
  title: "Form/InputSearch",
});

export const Default = meta.story({
  render: () => (
    <div className="w-full max-w-xs">
      <InputSearch placeholder="Search components…" />
    </div>
  ),
});

export const Disabled = meta.story({
  render: () => (
    <div className="w-full max-w-xs">
      <InputSearch disabled defaultValue="Indexing…" placeholder="Search" />
    </div>
  ),
});

export const WithResults = meta.story({
  render: function WithResultsRender() {
    const fruits = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry", "Grape", "Mango", "Orange"];
    const [query, setQuery] = useState("");

    const matches = fruits.filter((fruit) => fruit.toLowerCase().includes(query.toLowerCase()));

    return (
      <div className="w-full max-w-xs space-y-2">
        <InputSearch
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
  render: () => (
    <div className="w-full max-w-xs">
      <InputSearch aria-label="Search" placeholder="Search components…" />
    </div>
  ),
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
Typing.test("types a query", async ({ canvas, userEvent }) => {
  const input = canvas.getByRole("searchbox", { name: "Search" });

  await userEvent.type(input, "button");
  await expect(input).toHaveValue("button");
});

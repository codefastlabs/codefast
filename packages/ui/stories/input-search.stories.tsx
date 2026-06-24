import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { InputSearch } from "#/components/input-search";

const meta = {
  component: InputSearch,
  title: "Form/InputSearch",
} satisfies Meta<typeof InputSearch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-full max-w-xs">
      <InputSearch placeholder="Search components…" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-full max-w-xs">
      <InputSearch disabled defaultValue="Indexing…" placeholder="Search" />
    </div>
  ),
};

export const WithResults: Story = {
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
};

/** Interaction test — runs in a real browser via `vitest run --project=storybook`. */
export const Typing: Story = {
  render: () => (
    <div className="w-full max-w-xs">
      <InputSearch aria-label="Search" placeholder="Search components…" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("searchbox", { name: "Search" });

    await userEvent.type(input, "button");
    await expect(input).toHaveValue("button");
  },
};

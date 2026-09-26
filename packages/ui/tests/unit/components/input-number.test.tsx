import { render, screen } from "@testing-library/react";

import { InputNumber, InputNumberField, InputNumberStepper } from "#components/input-number";

describe("input-number", () => {
  test("names the stepper buttons in English by default", () => {
    render(
      <InputNumber defaultValue={1}>
        <InputNumberField aria-label="Quantity" />
        <InputNumberStepper />
      </InputNumber>,
    );

    expect(screen.getByRole("button", { name: "Increment" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decrement" })).toBeInTheDocument();
  });

  test("takes the stepper buttons' names from incrementLabel and decrementLabel", () => {
    render(
      <InputNumber decrementLabel="Giảm" defaultValue={1} incrementLabel="Tăng">
        <InputNumberField aria-label="Số lượng" />
        <InputNumberStepper />
      </InputNumber>,
    );

    expect(screen.getByRole("button", { name: "Tăng" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Giảm" })).toBeInTheDocument();
  });
});

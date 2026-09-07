/** The testing sample's four tests in file order: the tab label the card shows and the `it` title the sample states. */
export const SHOP_TESTS = [
  { label: "Auto-mock", title: "reserves the stock before charging" },
  { label: "Stub a price", title: "charges the catalog's price and returns the receipt" },
  { label: "Pin the context", title: "logs the order under its request id" },
  { label: "Refuse a typo", title: "refuses a token the unit never declared" },
] as const;

/** Builds the DOMRect literal jsdom layout fakes share: top/height drive the rest. */
function createDomRect(top: number, height: number): DOMRect {
  return {
    bottom: top + height,
    height,
    left: 0,
    right: 0,
    top,
    width: 0,
    x: 0,
    y: top,
    toJSON() {
      return {};
    },
  } as DOMRect;
}

export { createDomRect };

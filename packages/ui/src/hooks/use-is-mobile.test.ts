import { renderHook } from "@testing-library/react";
import type { Mock } from "vitest";

import { useIsMobile } from "#/hooks/use-is-mobile";
import { useMediaQuery } from "#/hooks/use-media-query";

// Mock hook useMediaQuery
vi.mock("#hooks/use-media-query", () => ({
  useMediaQuery: vi.fn<(...args: unknown[]) => unknown>(),
}));

describe("useIsMobile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("nên trả về true khi chiều rộng màn hình nhỏ hơn 767px", () => {
    // Thiết lập mock để useMediaQuery trả về true (màn hình mobile)
    (useMediaQuery as Mock).mockReturnValue(true);

    const { result } = renderHook(() => useIsMobile());

    // Kiểm tra kết quả
    expect(result.current).toBe(true);
    expect(useMediaQuery).toHaveBeenCalledWith("(max-width: 767px)");
  });

  test("nên trả về false khi chiều rộng màn hình lớn hơn hoặc bằng 768px", () => {
    // Thiết lập mock để useMediaQuery trả về false (không phải màn hình mobile)
    (useMediaQuery as Mock).mockReturnValue(false);

    const { result } = renderHook(() => useIsMobile());

    // Kiểm tra kết quả
    expect(result.current).toBe(false);
    expect(useMediaQuery).toHaveBeenCalledWith("(max-width: 767px)");
  });
});

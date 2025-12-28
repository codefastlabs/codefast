import { renderHook } from '@testing-library/react';

import { useIsMobile } from '@/hooks/use-is-mobile';
import { useMediaQuery } from '@/hooks/use-media-query';

// Mock hook useMediaQuery
jest.mock('@/hooks/use-media-query', () => ({
  useMediaQuery: jest.fn(),
}));

describe('useIsMobile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('nên trả về true khi chiều rộng màn hình nhỏ hơn 767px', () => {
    // Thiết lập mock để useMediaQuery trả về true (màn hình mobile)
    (useMediaQuery as jest.Mock).mockReturnValue(true);

    const { result } = renderHook(() => useIsMobile());

    // Kiểm tra kết quả
    expect(result.current).toBe(true);
    expect(useMediaQuery).toHaveBeenCalledWith('(max-width: 767px)');
  });

  test('nên trả về false khi chiều rộng màn hình lớn hơn hoặc bằng 768px', () => {
    // Thiết lập mock để useMediaQuery trả về false (không phải màn hình mobile)
    (useMediaQuery as jest.Mock).mockReturnValue(false);

    const { result } = renderHook(() => useIsMobile());

    // Kiểm tra kết quả
    expect(result.current).toBe(false);
    expect(useMediaQuery).toHaveBeenCalledWith('(max-width: 767px)');
  });
});

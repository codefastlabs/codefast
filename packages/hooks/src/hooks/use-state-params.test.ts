import { renderHook } from '@testing-library/react';

import {
  HistoryMethod,
  setUrlParams,
  updateBrowserHistory,
  updateUrlParams,
  useStateParams,
} from '@/hooks/use-state-params';

// Mock window.history methods
const mockPushState = jest.fn();
const mockReplaceState = jest.fn();

Object.defineProperty(window, 'history', {
  value: {
    pushState: mockPushState,
    replaceState: mockReplaceState,
  },
  writable: true,
});

describe('useStateParams Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true,
    });
  });

  describe('basic functionality', () => {
    test('should return push and replace methods', () => {
      const { result } = renderHook(() => useStateParams());
      const { push, replace } = result.current;

      expect(typeof push).toBe('function');
      expect(typeof replace).toBe('function');
    });

    test('should update URL parameters using push and replace', () => {
      const { result } = renderHook(() => useStateParams());
      const { push, replace } = result.current;

      push({ foo: 'bar' });
      expect(mockPushState).toHaveBeenCalledWith(null, '', '?foo=bar');

      replace({ foo: 'baz' });
      expect(mockReplaceState).toHaveBeenCalledWith(null, '', '?foo=baz');

      push('foo', 'bar');
      expect(mockPushState).toHaveBeenCalledWith(null, '', '?foo=bar');

      replace('foo', 'baz');
      expect(mockReplaceState).toHaveBeenCalledWith(null, '', '?foo=baz');
    });
  });

  describe('updateBrowserHistory', () => {
    test('should push state to browser history', () => {
      const urlParams = new URLSearchParams({ foo: 'bar' });

      updateBrowserHistory(urlParams, HistoryMethod.Push);
      expect(mockPushState).toHaveBeenCalledWith(null, '', '?foo=bar');
    });

    test('should replace state in browser history', () => {
      const urlParams = new URLSearchParams({ foo: 'bar' });

      updateBrowserHistory(urlParams, HistoryMethod.Replace);
      expect(mockReplaceState).toHaveBeenCalledWith(null, '', '?foo=bar');
    });
  });

  describe('setUrlParams', () => {
    test('should set and delete URL parameters correctly', () => {
      const params = new URLSearchParams();
      const newParams = { baz: null, foo: 'bar' };

      setUrlParams(params, newParams);
      expect(params.toString()).toBe('foo=bar');
    });

    test('should handle empty or invalid parameters', () => {
      const params = new URLSearchParams();
      const newParams = { bar: '', baz: 'value', foo: undefined };

      setUrlParams(params, newParams);
      expect(params.toString()).toBe('baz=value');
    });
  });

  describe('updateUrlParams', () => {
    test('should update URL parameters and push state', () => {
      const newParams = { foo: 'bar' };

      updateUrlParams(newParams, HistoryMethod.Push);
      expect(mockPushState).toHaveBeenCalledWith(null, '', '?foo=bar');
    });

    test('should update URL parameters and replace state', () => {
      const newParams = { foo: 'bar' };

      updateUrlParams(newParams, HistoryMethod.Replace);
      expect(mockReplaceState).toHaveBeenCalledWith(null, '', '?foo=bar');
    });

    test('should handle existing URL parameters', () => {
      Object.defineProperty(window, 'location', {
        value: { search: '?existing=param' },
        writable: true,
      });

      updateUrlParams({ foo: 'bar' }, HistoryMethod.Push);
      expect(mockPushState).toHaveBeenCalledWith(null, '', '?existing=param&foo=bar');
    });

    test('should remove null or undefined parameters from URL', () => {
      Object.defineProperty(window, 'location', {
        value: { search: '?existing=param&foo=bar' },
        writable: true,
      });

      updateUrlParams({ foo: null }, HistoryMethod.Replace);
      expect(mockReplaceState).toHaveBeenCalledWith(null, '', '?existing=param');
    });
  });

  describe('security tests', () => {
    test('should sanitize input to prevent injection attacks', () => {
      const { result } = renderHook(() => useStateParams());
      const { push } = result.current;

      push({ foo: "' OR '1'='1" });
      expect(mockPushState).toHaveBeenCalledWith(null, '', '?foo=%27+OR+%271%27%3D%271');

      push({ bar: '<script>alert(1)</script>' });
      expect(mockPushState).toHaveBeenCalledWith(
        null,
        '',
        '?bar=%3Cscript%3Ealert%281%29%3C%2Fscript%3E',
      );
    });

    test('should encode XSS payloads to prevent XSS attacks', () => {
      const { result } = renderHook(() => useStateParams());
      const { replace } = result.current;

      replace({ foo: '<img alt="alt" src="x" onerror=alert(1)>' });
      expect(mockReplaceState).toHaveBeenCalledWith(
        null,
        '',
        '?foo=%3Cimg+alt%3D%22alt%22+src%3D%22x%22+onerror%3Dalert%281%29%3E',
      );
    });

    test('should not allow path traversal in parameter values', () => {
      const { result } = renderHook(() => useStateParams());
      const { push } = result.current;

      push({ path: '../../etc/passwd' });
      expect(mockPushState).toHaveBeenCalledWith(null, '', '?path=..%2F..%2Fetc%2Fpasswd');
    });
  });

  describe('edge cases', () => {
    test('should preserve original URL when no parameters are passed', () => {
      const { result } = renderHook(() => useStateParams());
      const { replace } = result.current;

      replace({});
      expect(mockReplaceState).toHaveBeenCalledWith(null, '', '');
    });

    test('should work with special characters in parameters', () => {
      const { result } = renderHook(() => useStateParams());
      const { push } = result.current;

      push({ foo: 'bar@', 'key&': 'value?' });
      expect(mockPushState).toHaveBeenCalledWith(null, '', '?foo=bar%40&key%26=value%3F');
    });
  });
});

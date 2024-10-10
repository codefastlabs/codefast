// Enum for History Method
import { useCallback } from 'react';

enum HistoryMethod {
  Push = 'push',
  Replace = 'replace',
}

// Type for Parameter Input
type Value = string | number | boolean | null | undefined;
type ParamInput = string | Record<string, Value>;

/**
 * Sets the URL params of a given URLSearchParams object to the provided new
 * params.
 *
 * @param params - The URLSearchParams object whose params will be modified.
 * @param newParams - An object representing the new params to be set. Each
 *   key-value pair in the object represents a param key-value in the
 *   URLSearchParams object. If the value is falsy, the corresponding param
 *   will be deleted; otherwise, the param will be set or updated with the new
 *   value.
 * @returns void
 */
function setUrlParams(
  params: URLSearchParams,
  newParams: Record<string, Value>,
): void {
  for (const [key, value] of Object.entries(newParams)) {
    value ? params.set(key, value.toString()) : params.delete(key);
  }
}

/**
 * Updates the query parameters in the URL and updates the browser history.
 *
 * @param newParams - A dictionary object containing the new query parameters
 *   to be added or updated.
 * @param method - A value indicating whether to use `PUSH_STATE` or
 *   `REPLACE_STATE` when updating the browser history.
 * @returns void
 */
function updateUrlParams(
  newParams: Record<string, Value>,
  method: HistoryMethod,
): void {
  const params = new URLSearchParams(window.location.search);

  setUrlParams(params, newParams);

  const url = `?${params.toString()}`;

  if (method === HistoryMethod.Push) {
    window.history.pushState(null, '', url);
  } else {
    window.history.replaceState(null, '', url);
  }
}

/**
 * useStateParams is a custom hook that returns an object with two methods:
 * push and replace. The push method is used to update the URL parameters by
 * pushing a new state to the browser history. The replace method is used to
 * update the URL parameters by replacing the current state in the browser
 * history.
 *
 * @returns An object with two methods: push and replace.
 *          - push: A function that takes a ParamInput and an optional value as
 *   parameters and updates the URL parameters by pushing a new state to the
 *   browser history.
 *          - replace: A function that takes a ParamInput and an optional value
 *   as parameters and updates the URL parameters by replacing the current
 *   state in the browser history.
 */
export function useStateParams(): {
  push: (paramInput: ParamInput, value?: Value) => void;
  replace: (paramInput: ParamInput, value?: Value) => void;
} {
  const push = useCallback((paramInput: ParamInput, value?: Value) => {
    if (typeof paramInput === 'object') {
      updateUrlParams(paramInput, HistoryMethod.Push);
    } else {
      updateUrlParams({ [paramInput]: value }, HistoryMethod.Push);
    }
  }, []);

  const replace = useCallback((paramInput: ParamInput, value?: Value) => {
    if (typeof paramInput === 'object') {
      updateUrlParams(paramInput, HistoryMethod.Replace);
    } else {
      updateUrlParams({ [paramInput]: value }, HistoryMethod.Replace);
    }
  }, []);

  return {
    push,
    replace,
  };
}

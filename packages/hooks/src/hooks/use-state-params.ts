import { useCallback } from 'react';

export enum HistoryMethod {
  Push = 'push',
  Replace = 'replace',
}

export type UrlParamValue = boolean | null | number | string | undefined;
export type ParamInput = Record<string, UrlParamValue> | string;

/**
 * Updates the browser's history state using the specified method and URL parameters.
 *
 * @param urlParams - An instance of URLSearchParams containing the parameters to be used in the URL.
 * @param method - The method to use for updating the history. It can be either HistoryMethod.Push or
 *   HistoryMethod.Replace.
 * @returns void
 */
export function updateBrowserHistory(urlParams: URLSearchParams, method: HistoryMethod): void {
  const queryString = urlParams.toString();
  const url = queryString ? `?${queryString}` : '';

  if (method === HistoryMethod.Push) {
    window.history.pushState(null, '', url);
  } else {
    window.history.replaceState(null, '', url);
  }
}

/**
 * Updates the given URLSearchParams object with key-value pairs from the newParams object.
 * If a value is null or undefined, the corresponding key is removed from the URLSearchParams object.
 *
 * @param params - The URLSearchParams object to be updated.
 * @param newParams - An object containing key-value pairs to set in the URLSearchParams object.
 *
 * @returns void
 */
export function setUrlParams(
  params: URLSearchParams,
  newParams: Record<string, UrlParamValue>,
): void {
  for (const [key, value] of Object.entries(newParams)) {
    if (value) {
      params.set(key, value.toString());
    } else {
      params.delete(key);
    }
  }
}

/**
 * Updates the current URL parameters with the provided new parameters and modifies the browser history.
 *
 * @param newParams - An object where keys are parameter names and values are the corresponding new values to set in
 *   the URL.
 * @param method - The method to use to update the browser history. This can be either 'pushState' to create a new
 *   entry, or 'replaceState' to modify the current history entry.
 *
 * @returns void
 */
export function updateUrlParams(
  newParams: Record<string, UrlParamValue>,
  method: HistoryMethod,
): void {
  const params = new URLSearchParams(window.location.search);

  setUrlParams(params, newParams);
  updateBrowserHistory(params, method);
}

/**
 * Custom hook to manage URL parameters with push and replace methods.
 *
 * @returns An object containing push and replace methods to update URL parameters.
 */
export function useStateParams(): {
  push: (paramInput: ParamInput, value?: UrlParamValue) => void;
  replace: (paramInput: ParamInput, value?: UrlParamValue) => void;
} {
  const updateParams = useCallback(
    (paramInput: ParamInput, value: UrlParamValue, method: HistoryMethod) => {
      const newParams = typeof paramInput === 'object' ? paramInput : { [paramInput]: value };

      updateUrlParams(newParams, method);
    },
    [],
  );

  return {
    push: (paramInput, value) => {
      updateParams(paramInput, value, HistoryMethod.Push);
    },
    replace: (paramInput, value) => {
      updateParams(paramInput, value, HistoryMethod.Replace);
    },
  };
}

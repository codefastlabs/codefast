import { useCallback } from "react";

/**
 * Enum representing the methods used to update browser history.
 */
export enum HistoryMethod {
  /**
   * Creates a new entry in the browser history.
   */
  Push = "push",
  /**
   * Replaces the current entry in the browser history.
   */
  Replace = "replace",
}

/**
 * Represents possible values for URL parameters.
 * Can be a boolean, null, number, string, or undefined.
 */
export type UrlParameterValue = boolean | null | number | string | undefined;

/**
 * Input format for URL parameters can be either an object of key-value pairs
 * or a single parameter name as a string.
 */
export type ParameterInput = Record<string, UrlParameterValue> | string;

/**
 * Interface representing the return value of the useStateParams hook.
 */
export interface StateParamsHookResult {
  /**
   * Adds a new entry to the browser history with updated URL parameters.
   *
   * @param paramInput - Either an object of key-value pairs or a single parameter name
   * @param value - The value to set when paramInput is a string (parameter name)
   */
  push: (parameterInput: ParameterInput, value?: UrlParameterValue) => void;

  /**
   * Replaces the current history entry with updated URL parameters.
   *
   * @param paramInput - Either an object of key-value pairs or a single parameter name
   * @param value - The value to set when paramInput is a string (parameter name)
   */
  replace: (parameterInput: ParameterInput, value?: UrlParameterValue) => void;
}

/**
 * Updates the browser's history state using the specified method and URL parameters.
 *
 * @param urlParams - An instance of URLSearchParams containing the parameters to be used in the URL
 * @param method - The method to use for updating the history
 */
export function updateBrowserHistory(urlParams: URLSearchParams, method: HistoryMethod): void {
  const queryString = urlParams.toString();
  const url = queryString ? `?${queryString}` : "";

  if (method === HistoryMethod.Push) {
    globalThis.history.pushState(null, "", url);
  } else {
    globalThis.history.replaceState(null, "", url);
  }
}

/**
 * Updates the given URLSearchParams object with key-value pairs from the newParams object.
 * If a value is null or undefined, the corresponding key is removed from the URLSearchParams object.
 *
 * @param params - The URLSearchParams object to be updated
 * @param newParams - An object containing key-value pairs to set in the URLSearchParams object
 */
export function setUrlParams(params: URLSearchParams, newParams: Record<string, UrlParameterValue>): void {
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
 * @param newParams - An object where keys are parameter names and values are the corresponding new values to set
 * @param method - The method to use to update the browser history
 */
export function updateUrlParams(newParams: Record<string, UrlParameterValue>, method: HistoryMethod): void {
  const params = new URLSearchParams(globalThis.location.search);

  setUrlParams(params, newParams);
  updateBrowserHistory(params, method);
}

/**
 * Custom hook to manage URL parameters with push and replace methods.
 *
 * @returns An object containing push and replace methods to update URL parameters
 */
export function useStateParams(): StateParamsHookResult {
  /**
   * Updates URL parameters using the specified method.
   *
   * @param paramInput - Either an object with parameter values or a parameter name string
   * @param value - The value to use when paramInput is a string
   * @param method - The history method to use (push or replace)
   */
  const updateParams = useCallback(
    (parameterInput: ParameterInput, value: UrlParameterValue, method: HistoryMethod) => {
      const newParams = typeof parameterInput === "object" ? parameterInput : { [parameterInput]: value };

      updateUrlParams(newParams, method);
    },
    [],
  );

  return {
    push: (parameterInput, value) => {
      updateParams(parameterInput, value, HistoryMethod.Push);
    },
    replace: (parameterInput, value) => {
      updateParams(parameterInput, value, HistoryMethod.Replace);
    },
  };
}

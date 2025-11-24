import { createServerFn } from '@tanstack/react-start';
import { getCookie, setCookie } from '@tanstack/react-start/server';
import { z } from 'zod';

const themeValidator = z.union([z.literal('light'), z.literal('dark')]);
export type Theme = z.infer<typeof themeValidator>;

const storageKey = '_preferred-theme';

export const DEFAULT_THEME: Theme = 'dark';

export const getThemeServerFn = createServerFn().handler(() => {
  const cookieTheme = getCookie(storageKey);
  return (cookieTheme || DEFAULT_THEME) as Theme;
});

export const setThemeServerFn = createServerFn({ method: 'POST' })
  .inputValidator(themeValidator)
  .handler(({ data }) => {
    setCookie(storageKey, data);
  });

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const config = {
  presets: (() => {
    try {
      require.resolve('next/babel');
      return ['next/babel'];
    } catch {
      return [];
    }
  })(),
};

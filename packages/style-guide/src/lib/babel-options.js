import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export default {
  presets: (() => {
    try {
      require.resolve('next/babel');
      return ['next/babel'];
    } catch {
      return [];
    }
  })(),
};

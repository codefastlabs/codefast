import { reactPreset } from '@codefast/eslint-config/presets/react';
import { defineConfig } from 'eslint/config';

export default defineConfig([{ extends: [reactPreset] }]);

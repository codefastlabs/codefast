import { libraryPreset } from '@codefast/eslint-config/presets/library';
import { defineConfig } from 'eslint/config';

export default defineConfig([{ extends: [libraryPreset] }]);

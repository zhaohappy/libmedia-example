
import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import typescript from '@libmedia/rollup-plugin-typescript';

export default defineConfig({
  plugins: [
    typescript({
      tsconfig: './tsconfig.cheap.json',
      include: JSON.parse(fs.readFileSync(path.resolve(__dirname, './tsconfig.cheap.json'), 'utf8')).include,
    }),
    react()
  ]
});

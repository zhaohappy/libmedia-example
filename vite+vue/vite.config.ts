import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

import fs from 'fs'
import path from 'path'
import cheap from '@libmedia/rollup-plugin-typescript';

export default defineConfig({
  plugins: [
    cheap({
      tsconfig: './tsconfig.cheap.json',
      include: JSON.parse(fs.readFileSync(path.resolve(__dirname, './tsconfig.cheap.json'), 'utf8')).include
    }),
    vue(),
    vueJsx(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})

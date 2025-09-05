
import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import typescript from '@rollup/plugin-typescript';
import transformer from '@libmedia/cheap/build/transformer';

export default defineConfig({
  plugins: [
    typescript({
      tsconfig: './tsconfig.cheap.json',
      include: JSON.parse(fs.readFileSync(path.resolve(__dirname, './tsconfig.cheap.json'), 'utf8')).include,
      transformers: {
        before: [
          {
            type: 'program',
            factory: (program) => {
              return transformer.before(program);
            }
          }
        ]
      }
    }),
    react()
  ]
});

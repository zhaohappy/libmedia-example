import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import esbuild from 'rollup-plugin-esbuild'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import transformer from '@libmedia/cheap/build/transformer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default {
  input: 'src/App.ts',
  output: {
    file: 'dist/app.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    resolve(),
    // 此 loader 处理需要使用 cheap 编译的 ts
    // 如果下面对 ts 的处理使用的也是 @rollup/plugin-typescript，两个直接合并为一个
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
    // 此 loader 处理通用的 ts，可以是 tsc，babel，esbuild 等
    // 你项目里面之前使用什么就用什么
    esbuild({
      include: /\.ts$/,
      minify: false,
      sourceMap: true,
      target: 'es2017'
    })
  ]
}
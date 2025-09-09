import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as esbuild from 'esbuild'
import typescript from '@libmedia/esbuild-plugin-typescript'
import transformer from '@libmedia/cheap/build/transformer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const options = {
  entryPoints: ['src/App.tsx'],
  bundle: true,
  outfile: "dist/app.js",
  sourcemap: true,
  platform: "browser",
  target: ["esnext"],
  tsconfig: './tsconfig.json',
  plugins: [
    typescript({
      tsconfig: './tsconfig.cheap.json',
      include: JSON.parse(fs.readFileSync(path.resolve(__dirname, './tsconfig.cheap.json'), 'utf8')).include,
      transformers: {
        before: [
          {
            type: 'program',
            factory: (program, getProgram) => {
              return transformer.before(program, getProgram);
            }
          }
        ]
      }
    })
  ]
}

async function serve() {
  const ctx = await esbuild.context(options)
  ctx.watch()
}

function build() {
  esbuild.build(options)
}

if (process.argv.includes("--serve")) {
  serve()
}
else {
  build()
}
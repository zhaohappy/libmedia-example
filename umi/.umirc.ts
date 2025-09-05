import path from 'path'
import ts from 'typescript'
import { defineConfig } from 'umi'
import * as transformer from '@libmedia/cheap/build/transformer'

const configPath = ts.findConfigFile('./', ts.sys.fileExists, 'tsconfig.cheap.json')
const configFile = ts.readConfigFile(configPath!, ts.sys.readFile)
const parsed = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  path.dirname(configPath!)
)
const includedFiles = parsed.fileNames.map(p => path.join(__dirname, p))

export default defineConfig({
  routes: [
    { path: "/", component: "index" },
    { path: "/docs", component: "docs" },
  ],
  npmClient: 'pnpm',
  chainWebpack(memo) {
    const rule = memo.module
      .rule('typescript')
      .test((fileName: string) => {
        return includedFiles.includes(fileName)
      })
    rule.resolve
      .fullySpecified(false)
    rule.use('ts-loader')
      .loader('ts-loader')
      .options({
        configFile: path.resolve(__dirname, './tsconfig.cheap.json'),
        getCustomTransformers: function(program: ts.Program, getProgram: () => ts.Program) {
          const before = transformer.before(program, getProgram); 
          return {
            before: [
              before
            ]
          }
        }
      })
  },
  mfsu: {
    exclude: [
      /@libmedia/
    ]
  }
});

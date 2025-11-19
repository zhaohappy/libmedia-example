import { defineConfig } from '@rsbuild/core';
import path from 'path'
import ts from 'typescript'
import * as transformer from '@libmedia/cheap/build/transformer';

const configPath = ts.findConfigFile('./', ts.sys.fileExists, 'tsconfig.cheap.json')
const configFile = ts.readConfigFile(configPath!, ts.sys.readFile)
const parsed = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  path.dirname(configPath!)
)
const includedFiles = parsed.fileNames.map(p => path.join(__dirname, p))

export default defineConfig({
  tools: {
    rspack(config, { appendPlugins }) {
      config.module?.rules?.push({
        test: function (filename) {
          return includedFiles.includes(filename)
        },
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, './tsconfig.cheap.json'),
              getCustomTransformers: function(program: any, getProgram: any) {
                return {
                  before: [transformer.before(program, getProgram)]
                }
              }
            }
          }
        ],
      });
    },
  },
});

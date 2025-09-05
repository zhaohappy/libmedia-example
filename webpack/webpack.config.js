const path = require('path');
const ts = require('typescript')
const transformer = require('@libmedia/cheap/build/transformer');

const configPath = ts.findConfigFile('./', ts.sys.fileExists, 'tsconfig.cheap.json')
const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
const parsed = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  path.dirname(configPath)
)
const includedFiles = parsed.fileNames.map(p => path.join(__dirname, p))

module.exports = (env) => {
  const config = {
    devtool: 'source-map',
    mode: 'development',
    entry: './src/App.ts',
    output: {
      filename: 'app.js',
      path: path.resolve(__dirname, './dist')
    },
    resolve: {
      extensions: ['.js', '.ts', '.json'],
      modules: [
        'node_modules'
      ]
    },
    module: {
      rules: [
        {
          // 此 loader 处理通用的 ts，可以是 tsc，babel，esbuild 等
          // 你项目里面之前使用什么就用什么
          test: /\.ts?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/preset-typescript'
              ]
            }
          }
        },
        {
          // 此 loader 处理需要使用 cheap 编译的 ts
          // 如果上面对 ts 的处理使用的也是 ts-loader，两个直接合并为一个
          test: function (filename) {
            return includedFiles.includes(filename)
          },
          use: [
            {
              loader: 'ts-loader',
              options: {
                configFile: path.resolve(__dirname, './tsconfig.cheap.json'),
                getCustomTransformers: function(program, getProgram) {
                  return {
                    before: [transformer.before(program, getProgram)]
                  }
                }
              }
            }
          ]
        }
      ],
    }
  };
  return config;
};

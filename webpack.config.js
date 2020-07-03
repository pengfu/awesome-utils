//创建webpack.config.js
const webpack = require('webpack')
const path = require('path')
module.exports = {
  mode: 'production',
  entry: './entry.js', //入口文件
  output: {
    //node.js中__dirname变量获取当前模块文件所在目录的完整绝对路径
    path: path.resolve(__dirname, 'dist'), //输出位置
    filename: 'build.js', //输入文件
    library: 'awesome-utils',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  externals: {},
  module: {
    rules: [
      {
        test: /\.(ts(x?)|js(x?))$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
            },
          },
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
    ],
  },
  //其他解决方案配置
  resolve: {
    modules: [path.resolve('./node_modules'), path.resolve('./src')],
    extensions: ['.ts', '.js'], //添加在此的后缀所对应的文件可以省略后缀
  },
}

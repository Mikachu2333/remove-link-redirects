const format = require("date-fns/format");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const pkg = require("./package.json");
const webpack = require("webpack");
const path = require("path");

// webpack.config.js
const webpackConfig = {
  entry: {
    去除链接重定向: path.join(__dirname, "index.ts"),
  },
  output: {
    path: path.join(__dirname, "/dist"),
    filename: "[name].user.js",
  },
  resolve: {
    modules: ["node_modules"],
    extensions: [".js", ".ts"],
    plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })],
  },
  module: {
    rules: [{ test: /\.tsx?$/, loader: "ts-loader" }],
  },
  mode: "none",
  plugins: [
    new webpack.BannerPlugin({
      banner: `// ==UserScript==
// @name              ${pkg.pluginname}
// @author            ${pkg.author}
// @description       ${pkg.description}
// @version           ${pkg.version}
// @namespace         ${pkg.namespace}
// @grant             GM.xmlHttpRequest
// @match             *://www.baidu.com/*
// @match             *://tieba.baidu.com/*
// @match             *://v.baidu.com/*
// @match             *://xueshu.baidu.com/*
// @include           *://www.google*
// @match             *://www.google.com/*
// @match             *://docs.google.com/*
// @match             *://play.google.com/*
// @match             *://www.youtube.com/*
// @match             *://encrypted.google.com/*
// @match             *://www.so.com/*
// @match             *://www.zhihu.com/*
// @match             *://daily.zhihu.com/*
// @match             *://zhuanlan.zhihu.com/*
// @match             *://weibo.com/*
// @match             *://twitter.com/*
// @match             *://www.sogou.com/*
// @match             *://juejin.im/*
// @match             *://juejin.cn/*
// @match             *://mail.qq.com/*
// @match             *://addons.mozilla.org/*
// @match             *://www.jianshu.com/*
// @match             *://www.douban.com/*
// @match             *://getpocket.com/*
// @match             *://51.ruyo.net/*
// @match             *://steamcommunity.com/*
// @match             *://blog.csdn.net/*
// @match             *://*.blog.csdn.net/*
// @match             *://*.oschina.net/*
// @match             *://app.yinxiang.com/*
// @match             *://www.logonews.cn/*
// @match             *://afdian.net/*
// @match             *://blog.51cto.com/*
// @match             *://xie.infoq.cn/*
// @match             *://gitee.com/*
// @match             *://sspai.com/*
// @match             *://*.bing.com/*
// @connect           *
// @supportURL        ${pkg.supportURL}
// @homepage          ${pkg.homepage}
// @run-at            document-start
// @namespace         https://greasyfork.org/zh-CN/users/876245-meriel-varen
// @license           MIT
// ==/UserScript==
`,
      entryOnly: true,
      raw: true,
    }),
    new webpack.DefinePlugin(
      (() => {
        const result = { "process.env.NODE_ENV": '"development"' };
        for (const key in process.env) {
          // rome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
          if (process.env.hasOwnProperty(key)) {
            result[`process.env.${key}`] = JSON.stringify(process.env[key]);
          }
        }
        return result;
      })(),
    ),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false,
    }),
  ],
};

module.exports = webpackConfig;

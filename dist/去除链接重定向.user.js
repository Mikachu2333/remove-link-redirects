// ==UserScript==
// @name              去除链接重定向
// @author            Meriel
// @description       去除网页内链接的重定向，具有高准确性和高稳定性，以及相比同类插件更低的时间占用，平均时间在0.02ms~0.05ms之间
// @version           1.9.4
// @namespace         Violentmonkey Scripts
// @update            2024-07-04 08:24:16
// @grant             GM_xmlhttpRequest
// @match             *://www.baidu.com/*
// @match             *://tieba.baidu.com/*
// @match             *://v.baidu.com/*
// @match             *://xueshu.baidu.com/*
// @include           *://www.google*
// @match             *://www.google.com/*
// @match             *://docs.google.com/*
// @match             *://mail.google.com/*
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
// @match             *://www.dogedoge.com/*
// @match             *://51.ruyo.net/*
// @match             *://steamcommunity.com/*
// @match             *://mijisou.com/*
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
// @connect           www.baidu.com
// @connect           *
// @supportURL        https://github.com/MerielVaren/remove-link-redirects/issues/new/choose
// @homepage          https://github.com/MerielVaren/remove-link-redirects
// @run-at            document-start
// @namespace         https://greasyfork.org/zh-CN/users/876245-meriel-varen
// @license           MIT
// ==/UserScript==

/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.App = void 0;
const utils_1 = __webpack_require__(2);
class App {
    constructor() {
        this.provides = [];
        this.mutationObserver = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === "childList") {
                    for (const node of mutation.addedNodes) {
                        if (node instanceof HTMLAnchorElement) {
                            for (const provider of this.provides) {
                                if (this.isMatchProvider(node, provider)) {
                                    provider.resolve(node);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        });
        this.config = {
            isDebug: false,
        };
        this.mutationObserver.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
    }
    /**
     * A 标签是否匹配服务提供者
     * @param aElement
     * @param provider
     */
    isMatchProvider(aElement, provider) {
        if (aElement.getAttribute(utils_1.Marker.RedirectStatusDone)) {
            return false;
        }
        if (provider.test instanceof RegExp && !provider.test.test(aElement.href)) {
            return false;
        }
        if (typeof provider.test === "function" && !provider.test(aElement)) {
            return false;
        }
        if (provider.test instanceof Boolean) {
            return provider.test;
        }
        return true;
    }
    /**
     * 当页面准备就绪时，进行初始化动作
     */
    async pageOnReady() {
        for (const provider of this.provides) {
            if (provider.onInit) {
                await provider.onInit();
            }
        }
    }
    /**
     * 设置配置
     * @param config
     */
    setConfig(config) {
        this.config = config;
        return this;
    }
    /**
     * 注册服务提供者
     * @param providers
     */
    registerProvider(providers) {
        for (const provideConfig of providers) {
            // test 如果是 boolean
            if (provideConfig.test === false) {
                continue;
            }
            // test 如果是正则表达式
            if (provideConfig.test instanceof RegExp && !provideConfig.test.test(document.domain)) {
                continue;
            }
            // test 如果是一个function
            if (typeof provideConfig.test === "function" && provideConfig.test() === false) {
                continue;
            }
            const provider = new provideConfig.provider();
            provider.isDebug = this.config.isDebug;
            this.provides.push(provider);
        }
        return this;
    }
    /**
     * 启动应用
     */
    bootstrap() {
        addEventListener("DOMContentLoaded", this.pageOnReady.bind(this));
    }
}
exports.App = App;


/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Marker = void 0;
exports.matchLinkFromUrl = matchLinkFromUrl;
exports.retryAsyncOperation = retryAsyncOperation;
exports.queryParser = queryParser;
exports.getText = getText;
exports.isInView = isInView;
exports.getRedirect = getRedirect;
exports.increaseRedirect = increaseRedirect;
exports.decreaseRedirect = decreaseRedirect;
exports.antiRedirect = antiRedirect;
var Marker;
(function (Marker) {
    Marker["RedirectCount"] = "redirect-count";
    Marker["RedirectStatusDone"] = "anti-redirect-origin-href";
})(Marker || (exports.Marker = Marker = {}));
/**
 * 根据url上的路径匹配，去除重定向
 * @param {HTMLAnchorElement} aElement
 * @param {RegExp} tester
 * @returns {boolean}
 */
function matchLinkFromUrl(aElement, tester) {
    const matcher = tester.exec(aElement.href);
    if (!((matcher === null || matcher === void 0 ? void 0 : matcher.length) && matcher[1])) {
        return "";
    }
    let url = "";
    try {
        url = decodeURIComponent(matcher[1]);
    }
    catch (e) {
        url = /https?:\/\//.test(matcher[1]) ? matcher[1] : "";
    }
    return url;
}
/**
 * 重试异步操作
 * @param {() => Promise<any>} operation
 * @param {number} maxRetries
 * @param {number} currentRetry
 */
async function retryAsyncOperation(operation, maxRetries, currentRetry = 0) {
    try {
        // 尝试执行操作
        const result = await operation();
        return result;
    }
    catch (err) {
        if (currentRetry < maxRetries) {
            // 如果当前重试次数小于最大重试次数，等待一段时间后重试
            await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
            return retryAsyncOperation(operation, maxRetries, currentRetry + 1);
        }
        else {
            // 如果重试次数用尽，抛出错误
            throw err;
        }
    }
}
class Query {
    constructor(queryStr) {
        this.queryStr = queryStr;
        this.object = {};
        this.object = this.toObject(queryStr.replace(/^\?+/, ""));
    }
    toObject(queryStr) {
        const obj = {};
        queryStr.split("&").forEach((item) => {
            const arr = item.split("=") || [];
            let key = arr[0] || "";
            let value = arr[1] || "";
            try {
                key = decodeURIComponent(arr[0] || "");
                value = decodeURIComponent(arr[1] || "");
            }
            catch (err) {
                //
            }
            if (key) {
                obj[key] = value;
            }
        });
        return obj;
    }
    toString() {
        const arr = [];
        for (const key in this.object) {
            if (Object.prototype.hasOwnProperty.call(this.object, key)) {
                const value = this.object[key];
                arr.push(`${key}=${value}`);
            }
        }
        return arr.length ? `?${arr.join("&")}` : "";
    }
}
function queryParser(queryString) {
    return new Query(queryString);
}
function getText(htmlElement) {
    return (htmlElement.innerText || htmlElement.textContent).trim();
}
function isInView(element) {
    const rect = element.getBoundingClientRect();
    const vWidth = window.innerWidth || document.documentElement.clientWidth;
    const vHeight = window.innerHeight || document.documentElement.clientHeight;
    const efp = (x, y) => {
        return document.elementFromPoint(x, y);
    };
    // Return false if it's not in the viewport
    if (rect.right < 0 || rect.bottom < 0 || rect.left > vWidth || rect.top > vHeight) {
        return false;
    }
    // Return true if any of its four corners are visible
    return (element.contains(efp(rect.left, rect.top)) ||
        element.contains(efp(rect.right, rect.top)) ||
        element.contains(efp(rect.right, rect.bottom)) ||
        element.contains(efp(rect.left, rect.bottom)));
}
function getRedirect(aElement) {
    return +(aElement.getAttribute(Marker.RedirectCount) || 0);
}
function increaseRedirect(aElement) {
    const num = getRedirect(aElement);
    aElement.setAttribute(Marker.RedirectCount, `${num}${1}`);
}
function decreaseRedirect(aElement) {
    const num = getRedirect(aElement);
    if (num > 0) {
        aElement.setAttribute(Marker.RedirectCount, `${num - 1}`);
    }
}
/**
 * 去除重定向
 * @param aElement A标签元素
 * @param realUrl 真实的地址
 * @param options
 */
function antiRedirect(aElement, realUrl, options = {}) {
    options.debug = typeof options.debug === "undefined" ? "production" !== "production" : options.debug;
    options.force = options.force;
    if (!options.force && (!realUrl || aElement.href === realUrl)) {
        return;
    }
    if (options.debug) {
        aElement.style.backgroundColor = "green";
    }
    aElement.setAttribute(Marker.RedirectStatusDone, aElement.href);
    aElement.href = realUrl;
}


/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RuyoProvider = void 0;
const utils_1 = __webpack_require__(2);
class RuyoProvider {
    constructor() {
        this.test = /\/[^\?]*\?u=(.*)/;
    }
    resolve(aElement) {
        (0, utils_1.antiRedirect)(aElement, new URL(aElement.href).searchParams.get("u"));
    }
}
exports.RuyoProvider = RuyoProvider;


/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MozillaProvider = void 0;
const utils_1 = __webpack_require__(2);
class MozillaProvider {
    constructor() {
        this.test = /outgoing\.prod\.mozaws\.net\/v\d\/\w+\/(.*)/;
    }
    resolve(aElement) {
        (0, utils_1.antiRedirect)(aElement, (0, utils_1.matchLinkFromUrl)(aElement, this.test));
    }
}
exports.MozillaProvider = MozillaProvider;


/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.YinXiangProvider = void 0;
const utils_1 = __webpack_require__(2);
class YinXiangProvider {
    constructor() {
        this.test = /^http:\/\//;
    }
    resolve(aElement) {
        // 编辑器
        if (aElement.hasAttribute("data-mce-href")) {
            if (!aElement.onclick) {
                (0, utils_1.antiRedirect)(aElement, aElement.href, { force: true });
                aElement.onclick = (e) => {
                    // 阻止事件冒泡, 因为上层元素绑定的click事件会重定向
                    if (e.stopPropagation) {
                        e.stopPropagation();
                    }
                    aElement.setAttribute("target", "_blank");
                    window.top ? window.top.open(aElement.href) : window.open(aElement.href);
                };
            }
        }
        // 分享页面
        else if (/^https:\/\/app\.yinxiang\.com\/OutboundRedirect\.action\?dest=/.test(aElement.href)) {
            (0, utils_1.antiRedirect)(aElement, new URL(aElement.href).searchParams.get("dest"));
        }
    }
    async onInit() {
        const handler = (e) => {
            const dom = e.target;
            const tagName = dom.tagName.toUpperCase();
            switch (tagName) {
                case "A": {
                    this.resolve(dom);
                    break;
                }
                case "IFRAME": {
                    if (dom.hasAttribute("anti-redirect-handled")) {
                        return;
                    }
                    dom.setAttribute("anti-redirect-handled", "1");
                    dom.contentWindow.document.addEventListener("mouseover", handler);
                    break;
                }
            }
        };
        document.addEventListener("mouseover", handler);
        return this;
    }
}
exports.YinXiangProvider = YinXiangProvider;


/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CSDNProvider = void 0;
const utils_1 = __webpack_require__(2);
class CSDNProvider {
    constructor() {
        this.test = /^https?:\/\//;
    }
    resolve(aElement) {
        var _a;
        this.container = document.querySelector("#content_views");
        if ((_a = this.container) === null || _a === void 0 ? void 0 : _a.contains(aElement)) {
            if (!aElement.onclick && aElement.origin !== window.location.origin) {
                (0, utils_1.antiRedirect)(aElement, aElement.href, { force: true });
                aElement.onclick = (e) => {
                    // 阻止事件冒泡, 因为上层元素绑定的click事件会重定向
                    if (e.stopPropagation) {
                        e.stopPropagation();
                    }
                    aElement.setAttribute("target", "_blank");
                };
            }
        }
    }
}
exports.CSDNProvider = CSDNProvider;


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OSChinaProvider = void 0;
const utils_1 = __webpack_require__(2);
class OSChinaProvider {
    constructor() {
        this.test = /oschina\.net\/action\/GoToLink\?url=(.*)/;
    }
    resolve(aElement) {
        (0, utils_1.antiRedirect)(aElement, new URL(aElement.href).searchParams.get("url"));
    }
}
exports.OSChinaProvider = OSChinaProvider;


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ZhihuDailyProvider = void 0;
const utils_1 = __webpack_require__(2);
class ZhihuDailyProvider {
    constructor() {
        this.test = /zhihu\.com\/\?target=(.*)/;
    }
    resolve(aElement) {
        (0, utils_1.antiRedirect)(aElement, new URL(aElement.href).searchParams.get("target"));
    }
}
exports.ZhihuDailyProvider = ZhihuDailyProvider;


/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GoogleDocsProvider = void 0;
const utils_1 = __webpack_require__(2);
class GoogleDocsProvider {
    constructor() {
        this.test = /www\.google\.com\/url\?q=(.*)/;
    }
    resolve(aElement) {
        (0, utils_1.antiRedirect)(aElement, new URL(aElement.href).searchParams.get("q"));
    }
}
exports.GoogleDocsProvider = GoogleDocsProvider;


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PocketProvider = void 0;
const utils_1 = __webpack_require__(2);
class PocketProvider {
    constructor() {
        this.test = /getpocket\.com\/redirect\?url=(.*)/;
    }
    resolve(aElement) {
        (0, utils_1.antiRedirect)(aElement, new URL(aElement.href).searchParams.get("url"));
    }
}
exports.PocketProvider = PocketProvider;


/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GmailProvider = void 0;
const utils_1 = __webpack_require__(2);
class GmailProvider {
    constructor() {
        this.test = true;
        this.REDIRECT_PROPERTY = "data-saferedirecturl";
    }
    resolve(aElement) {
        // 移除这个属性，那么 a 链接就不会跳转
        // FIXME: gmail 是多层 iframe 嵌套
        if (aElement.getAttribute(this.REDIRECT_PROPERTY)) {
            aElement.removeAttribute(this.REDIRECT_PROPERTY);
            (0, utils_1.antiRedirect)(aElement, aElement.href);
        }
    }
}
exports.GmailProvider = GmailProvider;


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JuejinProvider = void 0;
const utils_1 = __webpack_require__(2);
class JuejinProvider {
    constructor() {
        this.test = /link\.juejin\.(im|cn)\/\?target=(.*)/;
    }
    resolve(aElement) {
        const finalURL = new URL(aElement.href).searchParams.get("target");
        (0, utils_1.antiRedirect)(aElement, finalURL);
        if (this.test.test(aElement.title)) {
            aElement.title = finalURL;
        }
    }
}
exports.JuejinProvider = JuejinProvider;


/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QQMailProvider = void 0;
class QQMailProvider {
    constructor() {
        this.test = true;
    }
    resolve(aElement) {
        var _a;
        this.container = document.querySelector("#contentDiv");
        if ((_a = this.container) === null || _a === void 0 ? void 0 : _a.contains(aElement)) {
            if (aElement.onclick) {
                aElement.onclick = (e) => {
                    // 阻止事件冒泡, 因为上层元素绑定的click事件会重定向
                    if (e.stopPropagation) {
                        e.stopPropagation();
                    }
                };
            }
        }
    }
}
exports.QQMailProvider = QQMailProvider;


/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MiJiProvider = void 0;
const utils_1 = __webpack_require__(2);
class MiJiProvider {
    constructor() {
        this.test = /mijisou\.com\/url_proxy\?proxyurl=(.*)/;
    }
    resolve(aElement) {
        (0, utils_1.antiRedirect)(aElement, new URL(aElement.href).searchParams.get("proxyurl"));
    }
}
exports.MiJiProvider = MiJiProvider;


/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GooglePlayProvider = void 0;
const utils_1 = __webpack_require__(2);
class GooglePlayProvider {
    test(aElement) {
        if (/google\.com\/url\?q=(.*)/.test(aElement.href)) {
            return true;
        }
        else if (/^\/store\/apps\/details/.test(location.pathname)) {
            return true;
        }
        return false;
    }
    resolve(aElement) {
        (0, utils_1.antiRedirect)(aElement, new URL(aElement.href).searchParams.get("q"));
        // 移除开发者栏目下的重定向
        const eles = [].slice.call(document.querySelectorAll("a.hrTbp"));
        for (const ele of eles) {
            if (!ele.href) {
                continue;
            }
            if (ele.getAttribute(utils_1.Marker.RedirectStatusDone)) {
                continue;
            }
            ele.setAttribute(utils_1.Marker.RedirectStatusDone, ele.href);
            ele.setAttribute("target", "_blank");
            ele.addEventListener("click", (event) => {
                event.stopPropagation();
            }, true);
        }
    }
}
exports.GooglePlayProvider = GooglePlayProvider;


/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SteamProvider = void 0;
const utils_1 = __webpack_require__(2);
class SteamProvider {
    constructor() {
        this.test = /steamcommunity\.com\/linkfilter\/\?url=(.*)/;
    }
    resolve(aElement) {
        (0, utils_1.antiRedirect)(aElement, new URL(aElement.href).searchParams.get("url"));
    }
}
exports.SteamProvider = SteamProvider;


/***/ }),
/* 17 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TiebaProvider = void 0;
const utils_1 = __webpack_require__(2);
class TiebaProvider {
    constructor() {
        this.test = /jump\d*\.bdimg\.com/;
    }
    resolve(aElement) {
        if (!this.test.test(aElement.href)) {
            return;
        }
        let url = "";
        const text = aElement.innerText || aElement.textContent || "";
        try {
            if (/https?:\/\//.test(text)) {
                url = decodeURIComponent(text);
            }
        }
        catch (e) {
            url = /https?:\/\//.test(text) ? text : "";
        }
        if (url) {
            (0, utils_1.antiRedirect)(aElement, url);
        }
    }
}
exports.TiebaProvider = TiebaProvider;


/***/ }),
/* 18 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TwitterProvider = void 0;
const utils_1 = __webpack_require__(2);
class TwitterProvider {
    constructor() {
        this.test = /t\.co\/\w+/;
    }
    resolve(aElement) {
        if (!this.test.test(aElement.href)) {
            return;
        }
        if (/https?:\/\//.test(aElement.title)) {
            const url = decodeURIComponent(aElement.title);
            (0, utils_1.antiRedirect)(aElement, url);
            return;
        }
        const innerText = aElement.innerText.replace(/…$/, "");
        if (/https?:\/\//.test(innerText)) {
            (0, utils_1.antiRedirect)(aElement, innerText);
            return;
        }
    }
}
exports.TwitterProvider = TwitterProvider;


/***/ }),
/* 19 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BaiduVideoProvider = void 0;
const utils_1 = __webpack_require__(2);
const gm_http_1 = __webpack_require__(20);
class BaiduVideoProvider {
    constructor() {
        this.test = /v\.baidu\.com\/link\?url=/;
    }
    resolve(aElement) {
        gm_http_1.default
            .request({
            url: aElement.href,
            method: "GET",
            anonymous: true,
        })
            .then((res) => {
            if (res.finalUrl) {
                (0, utils_1.antiRedirect)(aElement, res.finalUrl);
            }
        })
            .catch((err) => {
            console.error(err);
        });
    }
}
exports.BaiduVideoProvider = BaiduVideoProvider;


/***/ }),
/* 20 */
/***/ (function(module) {

(function webpackUniversalModuleDefinition(root, factory) {
	if(true)
		module.exports = factory();
	else {}
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __nested_webpack_require_535__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __nested_webpack_require_535__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__nested_webpack_require_535__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__nested_webpack_require_535__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__nested_webpack_require_535__.d = function(exports, name, getter) {
/******/ 		if(!__nested_webpack_require_535__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__nested_webpack_require_535__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__nested_webpack_require_535__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__nested_webpack_require_535__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__nested_webpack_require_535__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __nested_webpack_require_535__(__nested_webpack_require_535__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Created by axetroy on 17-6-23.
 */
/// <reference path="./index.d.ts" />
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
function isFunction(func) {
    return typeof func === "function";
}
var Http = (function () {
    function Http(config) {
        if (config === void 0) { config = {}; }
        this.config = config;
    }
    Http.prototype.setConfig = function (config) {
        if (config === void 0) { config = {}; }
        this.config = __assign({}, this.config, config);
    };
    Http.prototype.create = function (config) {
        return new Http(config);
    };
    Http.prototype.request = function (config) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var commonRequestConfig = {
                method: config.method,
                url: config.url,
                data: config.body,
                header: config.headers
            };
            var GM_xmlhttpRequestConfig = __assign({}, commonRequestConfig, config, _this.config);
            var onreadystatechange = GM_xmlhttpRequestConfig.onreadystatechange, onerror = GM_xmlhttpRequestConfig.onerror, onabort = GM_xmlhttpRequestConfig.onabort, ontimeout = GM_xmlhttpRequestConfig.ontimeout;
            GM_xmlhttpRequestConfig.synchronous = true; // async
            GM_xmlhttpRequestConfig.onreadystatechange = function (response) {
                try {
                    isFunction(onreadystatechange) &&
                        onreadystatechange.call(this, response);
                }
                catch (err) {
                    reject(err);
                }
                if (response.readyState !== 4)
                    return;
                response.status >= 200 && response.status < 400
                    ? resolve(response)
                    : reject(response);
            };
            GM_xmlhttpRequestConfig.onerror = function (response) {
                try {
                    isFunction(onerror) && onerror.call(this, response);
                    reject(response);
                }
                catch (err) {
                    reject(err);
                }
            };
            GM_xmlhttpRequestConfig.onabort = function (response) {
                try {
                    isFunction(onabort) && onabort.call(this, response);
                    reject(response);
                }
                catch (err) {
                    reject(err);
                }
            };
            GM_xmlhttpRequestConfig.ontimeout = function (response) {
                try {
                    isFunction(ontimeout) && ontimeout.call(this, response);
                    reject(response);
                }
                catch (err) {
                    reject(err);
                }
            };
            if (_this.config.debug) {
                console.log("%c[" + commonRequestConfig.method.toUpperCase() + "]%c: " + commonRequestConfig.url, "color: green", "color: #000;text-style: under-line");
            }
            GM_xmlhttpRequest(__assign({}, GM_xmlhttpRequestConfig));
        });
    };
    Http.prototype.get = function (url, data, headers, config) {
        if (headers === void 0) { headers = {}; }
        if (config === void 0) { config = {}; }
        return this.request(__assign({ url: url, method: "GET", body: data, headers: headers }, config));
    };
    Http.prototype.post = function (url, data, headers, config) {
        if (headers === void 0) { headers = {}; }
        if (config === void 0) { config = {}; }
        return this.request(__assign({ url: url, method: "POST", body: data, headers: headers }, config));
    };
    Http.prototype.put = function (url, data, headers, config) {
        if (headers === void 0) { headers = {}; }
        if (config === void 0) { config = {}; }
        return this.request(__assign({ url: url, method: "POST", body: data, headers: headers }, config));
    };
    Http.prototype["delete"] = function (url, data, headers, config) {
        if (headers === void 0) { headers = {}; }
        if (config === void 0) { config = {}; }
        return this.request(__assign({ url: url, method: "DELETE", body: data, headers: headers }, config));
    };
    Http.prototype.head = function (url, data, headers, config) {
        if (headers === void 0) { headers = {}; }
        if (config === void 0) { config = {}; }
        return this.request(__assign({ url: url, method: "HEAD", body: data, headers: headers }, config));
    };
    return Http;
}());
exports.Http = Http;
var timeout = 5000;
exports.timeout = timeout;
var http = new Http({ timeout: timeout });
exports.http = http;
exports.default = http;


/***/ })
/******/ ]);
});

/***/ }),
/* 21 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WeboProvider = void 0;
const utils_1 = __webpack_require__(2);
class WeboProvider {
    constructor() {
        this.test = /t\.cn\/\w+/;
    }
    resolve(aElement) {
        if (!(this.test.test(aElement.href) && /^https?:\/\//.test(aElement.title))) {
            return;
        }
        const url = decodeURIComponent(aElement.title);
        if (url) {
            aElement.href = url;
            (0, utils_1.antiRedirect)(aElement, url);
        }
    }
}
exports.WeboProvider = WeboProvider;


/***/ }),
/* 22 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BaiduProvider = void 0;
const utils_1 = __webpack_require__(2);
const gm_http_1 = __webpack_require__(20);
class BaiduProvider {
    constructor() {
        this.test = /www\.baidu\.com\/link\?url=/;
    }
    resolve(aElement) {
        if ((0, utils_1.getRedirect)(aElement) <= 2 && this.test.test(aElement.href)) {
            (0, utils_1.increaseRedirect)(aElement);
            (0, utils_1.retryAsyncOperation)(() => this.handlerOneElement(aElement), 3)
                .then((res) => {
                (0, utils_1.decreaseRedirect)(aElement);
            })
                .catch((err) => {
                (0, utils_1.decreaseRedirect)(aElement);
            });
        }
    }
    async handlerOneElement(aElement) {
        try {
            const res = await gm_http_1.default.request({
                url: aElement.href,
                method: "GET",
                anonymous: true,
            });
            if (res.finalUrl) {
                (0, utils_1.antiRedirect)(aElement, res.finalUrl);
            }
            return res;
        }
        catch (err) {
            console.error(err);
            return Promise.reject(new Error(`[http]: ${aElement.href} fail`));
        }
    }
}
exports.BaiduProvider = BaiduProvider;


/***/ }),
/* 23 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DogeDogeProvider = void 0;
const utils_1 = __webpack_require__(2);
const gm_http_1 = __webpack_require__(20);
class DogeDogeProvider {
    constructor() {
        this.test = /www\.dogedoge\.com\/rd\/.{1,}/;
    }
    resolve(aElement) {
        if ((0, utils_1.getRedirect)(aElement) <= 2 && this.test.test(aElement.href)) {
            (0, utils_1.increaseRedirect)(aElement);
            this.handlerOneElement(aElement)
                .then((res) => {
                (0, utils_1.decreaseRedirect)(aElement);
            })
                .catch((err) => {
                (0, utils_1.decreaseRedirect)(aElement);
            });
        }
    }
    async handlerOneElement(aElement) {
        try {
            const res = await gm_http_1.default.request({
                url: aElement.href,
                method: "GET",
                anonymous: true,
            });
            if (res.finalUrl) {
                (0, utils_1.antiRedirect)(aElement, res.finalUrl);
            }
            return res;
        }
        catch (err) {
            console.error(err);
        }
    }
}
exports.DogeDogeProvider = DogeDogeProvider;


/***/ }),
/* 24 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DouBanProvider = void 0;
const utils_1 = __webpack_require__(2);
class DouBanProvider {
    constructor() {
        this.test = /douban\.com\/link2\/?\?url=(.*)/;
    }
    resolve(aElement) {
        (0, utils_1.antiRedirect)(aElement, new URL(aElement.href).searchParams.get("url"));
    }
}
exports.DouBanProvider = DouBanProvider;


/***/ }),
/* 25 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GoogleProvider = void 0;
const utils_1 = __webpack_require__(2);
class GoogleProvider {
    constructor() {
        this.test = true;
    }
    resolve(aElement) {
        const traceProperties = ["ping", "data-jsarwt", "data-usg", "data-ved"];
        // 移除追踪
        for (const property of traceProperties) {
            if (aElement.getAttribute(property)) {
                aElement.removeAttribute(property);
            }
        }
        // 移除多余的事件
        if (aElement.getAttribute("onmousedown")) {
            aElement.removeAttribute("onmousedown");
        }
        // 尝试去除重定向
        if (aElement.getAttribute("data-href")) {
            const realUrl = aElement.getAttribute("data-href");
            (0, utils_1.antiRedirect)(aElement, realUrl);
        }
        const url = new URL(aElement.href);
        if (url.searchParams.get("url")) {
            (0, utils_1.antiRedirect)(aElement, url.searchParams.get("url"));
        }
    }
}
exports.GoogleProvider = GoogleProvider;


/***/ }),
/* 26 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JianShuProvider = void 0;
const utils_1 = __webpack_require__(2);
class JianShuProvider {
    constructor() {
        this.test = (aElement) => {
            const isLink1 = /links\.jianshu\.com\/go/.test(aElement.href);
            const isLink2 = /link\.jianshu\.com(\/)?\?t=/.test(aElement.href);
            const isLink3 = /jianshu\.com\/go-wild\/?\?(.*)url=/.test(aElement.href);
            if (isLink1 || isLink2 || isLink3) {
                return true;
            }
            return false;
        };
    }
    resolve(aElement) {
        const search = new URL(aElement.href).searchParams;
        (0, utils_1.antiRedirect)(aElement, search.get("to") || search.get("t") || search.get("url"));
    }
}
exports.JianShuProvider = JianShuProvider;


/***/ }),
/* 27 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SoProvider = void 0;
const utils_1 = __webpack_require__(2);
class SoProvider {
    constructor() {
        this.test = /so\.com\/link\?(.*)/;
    }
    resolve(aElement) {
        const url = aElement.getAttribute("data-mdurl") || aElement.getAttribute("e-landurl");
        if (url) {
            (0, utils_1.antiRedirect)(aElement, url);
        }
        // remove track
        aElement.removeAttribute("e_href");
        aElement.removeAttribute("data-res");
    }
}
exports.SoProvider = SoProvider;


/***/ }),
/* 28 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SoGouProvider = void 0;
const utils_1 = __webpack_require__(2);
const gm_http_1 = __webpack_require__(20);
class SoGouProvider {
    constructor() {
        this.test = /www\.sogou\.com\/link\?url=/;
    }
    async resolve(aElement) {
        try {
            if ((0, utils_1.getRedirect)(aElement) <= 2 && this.test.test(aElement.href)) {
                (0, utils_1.increaseRedirect)(aElement);
                const res = await gm_http_1.default.request({
                    url: aElement.href,
                    method: "GET",
                    anonymous: true,
                });
                (0, utils_1.decreaseRedirect)(aElement);
                const finalUrl = res.finalUrl;
                if (finalUrl && !this.test.test(finalUrl)) {
                    (0, utils_1.antiRedirect)(aElement, res.finalUrl);
                }
                else {
                    const matcher = res.responseText.match(/URL=['"]([^'"]+)['"]/);
                    if (matcher === null || matcher === void 0 ? void 0 : matcher[1]) {
                        (0, utils_1.antiRedirect)(aElement, res.finalUrl);
                    }
                }
            }
        }
        catch (err) {
            (0, utils_1.decreaseRedirect)(aElement);
            console.error(err);
        }
    }
    parsePage(res) {
        const responseText = res.responseText.replace(/(src=[^>]*|link=[^>])/g, "");
        const html = document.createElement("html");
        html.innerHTML = responseText;
        // let selector = '#main .results div.vrwrap>h3';
        // let selector = '#main .results h3>a';
        const selector = '#main .results a[href*="www.sogou.com/link?url="]';
        const remotes = [].slice.call(html.querySelectorAll("#main .results a[href]"));
        const locals = [].slice.call(document.querySelectorAll(selector));
        for (const localEle of locals) {
            for (const remoteEle of remotes) {
                let localText = (0, utils_1.getText)(localEle);
                let remoteText = (0, utils_1.getText)(remoteEle);
                // 通用按钮，例如【点击下载】
                if (localEle.classList.contains("str-public-btn")) {
                    localText = (0, utils_1.getText)(localEle.parentNode);
                    remoteText = (0, utils_1.getText)(remoteEle.parentNode);
                }
                else if (localEle.classList.contains("str_img")) {
                    // 图片
                    localText = (0, utils_1.getText)(localEle.parentNode.parentNode);
                    remoteText = (0, utils_1.getText)(remoteEle.parentNode.parentNode);
                }
                if (!localText || localText !== remoteText) {
                    return;
                }
                (0, utils_1.antiRedirect)(localEle, remoteEle.href);
            }
        }
    }
    async onInit() {
        if (!/www\.sogou\.com\/web/.test(window.top.location.href)) {
            return;
        }
        const query = (0, utils_1.queryParser)(window.top.location.search);
        // 搜索使用http搜索，得到的是直接链接
        const url = `${location.protocol.replace(/:$/, "").replace("s", "")}://${location.host + location.pathname + query}`;
        gm_http_1.default
            .get(url)
            .then((res) => {
            this.parsePage(res);
        })
            .catch((err) => {
            console.error(err);
        });
        return this;
    }
}
exports.SoGouProvider = SoGouProvider;


/***/ }),
/* 29 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.YoutubeProvider = void 0;
const utils_1 = __webpack_require__(2);
class YoutubeProvider {
    constructor() {
        this.test = /www\.youtube\.com\/redirect\?.{1,}/;
    }
    resolve(aElement) {
        (0, utils_1.antiRedirect)(aElement, new URL(aElement.href).searchParams.get("q"));
    }
}
exports.YoutubeProvider = YoutubeProvider;


/***/ }),
/* 30 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ZhihuProvider = void 0;
const utils_1 = __webpack_require__(2);
class ZhihuProvider {
    constructor() {
        this.test = /zhihu\.com\/\?target=(.*)/;
    }
    resolve(aElement) {
        (0, utils_1.antiRedirect)(aElement, new URL(aElement.href).searchParams.get("target"));
    }
}
exports.ZhihuProvider = ZhihuProvider;


/***/ }),
/* 31 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BaiduXueshuProvider = void 0;
const utils_1 = __webpack_require__(2);
class BaiduXueshuProvider {
    constructor() {
        this.test = /xueshu\.baidu\.com\/s?\?(.*)/; // 此处无用
    }
    resolve(aElement) {
        const realHref = aElement.getAttribute("data-link") || aElement.getAttribute("data-url");
        if (realHref) {
            (0, utils_1.antiRedirect)(aElement, decodeURIComponent(realHref));
        }
    }
}
exports.BaiduXueshuProvider = BaiduXueshuProvider;


/***/ }),
/* 32 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ZhihuZhuanlanProvider = void 0;
const utils_1 = __webpack_require__(2);
class ZhihuZhuanlanProvider {
    constructor() {
        this.test = /link\.zhihu\.com\/\?target=(.*)/;
    }
    resolve(aElement) {
        (0, utils_1.antiRedirect)(aElement, new URL(aElement.href).searchParams.get("target"));
    }
}
exports.ZhihuZhuanlanProvider = ZhihuZhuanlanProvider;


/***/ }),
/* 33 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LogonewsProvider = void 0;
const utils_1 = __webpack_require__(2);
class LogonewsProvider {
    constructor() {
        this.test = /link\.logonews\.cn\/\?url=(.*)/;
    }
    resolve(aElement) {
        (0, utils_1.antiRedirect)(aElement, new URL(aElement.href).searchParams.get("url"));
    }
}
exports.LogonewsProvider = LogonewsProvider;


/***/ }),
/* 34 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AfDianNetProvider = void 0;
const utils_1 = __webpack_require__(2);
class AfDianNetProvider {
    constructor() {
        this.test = /afdian\.net\/link\?target=(.*)/;
    }
    resolve(aElement) {
        (0, utils_1.antiRedirect)(aElement, new URL(aElement.href).searchParams.get("target"));
    }
}
exports.AfDianNetProvider = AfDianNetProvider;


/***/ }),
/* 35 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Blog51CTO = void 0;
class Blog51CTO {
    constructor() {
        this.test = true;
    }
    resolve(aElement) {
        var _a;
        this.container = document.querySelector(".article-detail");
        if ((_a = this.container) === null || _a === void 0 ? void 0 : _a.contains(aElement)) {
            if (!aElement.onclick && aElement.href) {
                aElement.onclick = function antiRedirectOnClickFn(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    const $a = document.createElement("a");
                    $a.href = aElement.href;
                    $a.target = aElement.target;
                    $a.click();
                };
            }
        }
    }
}
exports.Blog51CTO = Blog51CTO;


/***/ }),
/* 36 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.InfoQProvider = void 0;
const utils_1 = __webpack_require__(2);
class InfoQProvider {
    constructor() {
        this.test = /infoq\.cn\/link\?target=(.*)/;
    }
    resolve(aElement) {
        (0, utils_1.antiRedirect)(aElement, new URL(aElement.href).searchParams.get("target"));
    }
}
exports.InfoQProvider = InfoQProvider;


/***/ }),
/* 37 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GiteeProvider = void 0;
const utils_1 = __webpack_require__(2);
class GiteeProvider {
    constructor() {
        this.test = /gitee\.com\/link\?target=(.*)/;
    }
    resolve(aElement) {
        (0, utils_1.antiRedirect)(aElement, new URL(aElement.href).searchParams.get("target"));
    }
}
exports.GiteeProvider = GiteeProvider;


/***/ }),
/* 38 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SSPaiProvider = void 0;
const utils_1 = __webpack_require__(2);
class SSPaiProvider {
    constructor() {
        this.test = /sspai\.com\/link\?target=(.*)/;
    }
    resolve(aElement) {
        (0, utils_1.antiRedirect)(aElement, new URL(aElement.href).searchParams.get("target"));
    }
}
exports.SSPaiProvider = SSPaiProvider;


/***/ }),
/* 39 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BingProvider = void 0;
const utils_1 = __webpack_require__(2);
class BingProvider {
    constructor() {
        this.test = /.+\.bing\.com\/ck\/a\?.*&u=a1(.*)&ntb=1/;
    }
    resolve(aElement) {
        (0, utils_1.antiRedirect)(aElement, BingProvider.textDecoder.decode(Uint8Array.from(atob(aElement.href
            .split("&u=a1")[1]
            .split("&ntb=1")[0]
            .replace(/[-_]/g, (e) => ("-" === e ? "+" : "/"))
            .replace(/[^A-Za-z0-9\\+\\/]/g, ""))
            .split("")
            .map((e) => e.charCodeAt(0)))));
    }
}
exports.BingProvider = BingProvider;
BingProvider.textDecoder = new TextDecoder();


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
const app_1 = __webpack_require__(1);
const _51_ruyo_net_1 = __webpack_require__(3);
const addons_mozilla_org_1 = __webpack_require__(4);
const app_yinxiang_com_1 = __webpack_require__(5);
const blog_csdn_net_1 = __webpack_require__(6);
const oschina_com_1 = __webpack_require__(7);
const daily_zhihu_com_1 = __webpack_require__(8);
const docs_google_com_1 = __webpack_require__(9);
const getpocket_com_1 = __webpack_require__(10);
const gmail_google_com_1 = __webpack_require__(11);
const juejin_com_1 = __webpack_require__(12);
const mail_qq_com_1 = __webpack_require__(13);
const mijisou_com_1 = __webpack_require__(14);
const play_google_com_1 = __webpack_require__(15);
const steamcommunity_com_1 = __webpack_require__(16);
const tieba_baidu_com_1 = __webpack_require__(17);
const twitter_com_1 = __webpack_require__(18);
const video_baidu_com_1 = __webpack_require__(19);
const weibo_com_1 = __webpack_require__(21);
const www_baidu_com_1 = __webpack_require__(22);
const www_dogedoge_com_1 = __webpack_require__(23);
const www_douban_com_1 = __webpack_require__(24);
const www_google_com_1 = __webpack_require__(25);
const www_jianshu_com_1 = __webpack_require__(26);
const www_so_com_1 = __webpack_require__(27);
const www_sogou_com_1 = __webpack_require__(28);
const www_youtube_com_1 = __webpack_require__(29);
const www_zhihu_com_1 = __webpack_require__(30);
const xueshu_baidu_com_1 = __webpack_require__(31);
const zhuanlan_zhihu_com_1 = __webpack_require__(32);
const www_logonews_cn_1 = __webpack_require__(33);
const afadian_net_1 = __webpack_require__(34);
const blog_51cto_com_1 = __webpack_require__(35);
const infoq_cn_1 = __webpack_require__(36);
const gitee_com_1 = __webpack_require__(37);
const sspai_com_1 = __webpack_require__(38);
const bing_com_1 = __webpack_require__(39);
const gm_http_1 = __webpack_require__(20);
const app = new app_1.App();
const isDebug = "production" !== "production";
gm_http_1.default.setConfig({ debug: isDebug });
app
    .setConfig({ isDebug })
    .registerProvider([
    {
        // 测试地址: https://www.zhihu.com/question/25258775
        name: "知乎",
        test: /www\.zhihu\.com/,
        provider: www_zhihu_com_1.ZhihuProvider,
    },
    {
        // 测试地址: https://zhuanlan.zhihu.com/p/20549978
        name: "知乎专栏",
        test: /zhuanlan\.zhihu\.com/,
        provider: zhuanlan_zhihu_com_1.ZhihuZhuanlanProvider,
    },
    {
        // 测试地址:
        name: "知乎日报",
        test: /daily\.zhihu\.com/,
        provider: daily_zhihu_com_1.ZhihuDailyProvider,
    },
    {
        name: "Google搜索",
        test: /\w+\.google\./,
        provider: www_google_com_1.GoogleProvider,
    },
    {
        // 测试地址: https://docs.google.com/spreadsheets/d/1TFcEXMcKrwoIAECIVyBU0GPoSmRqZ7A0VBvqeKYVSww/htmlview
        name: "Google Docs",
        test: /docs\.google\.com/,
        provider: docs_google_com_1.GoogleDocsProvider,
    },
    {
        name: "Gmail",
        test: /mail\.google\.com/,
        provider: gmail_google_com_1.GmailProvider,
    },
    {
        // 测试地址: https://play.google.com/store/movies/details/%E7%A7%BB%E5%8B%95%E8%BF%B7%E5%AE%AE_%E6%AD%BB%E4%BA%A1%E8%A7%A3%E8%97%A5?id=YNy7gRqwtMk
        name: "Google Play",
        test: /play\.google\.com/,
        provider: play_google_com_1.GooglePlayProvider,
    },
    {
        // 测试地址: https://www.youtube.com/watch?v=XTXSRRSv1bY
        name: "Google Youtube",
        test: /www\.youtube\.com/,
        provider: www_youtube_com_1.YoutubeProvider,
    },
    {
        // 测试地址: https://www.so.com/s?ie=utf-8&fr=none&src=360sou_newhome&q=chrome
        name: "360搜索",
        test: /www\.so\.com/,
        provider: www_so_com_1.SoProvider,
    },
    {
        name: "新浪微博",
        test: /\.weibo\.com/,
        provider: weibo_com_1.WeboProvider,
    },
    // 测试: https://twitter.com/ftium4/status/1512815116810522631
    {
        name: "Twitter",
        test: /twitter\.com/,
        provider: twitter_com_1.TwitterProvider,
    },
    {
        // 测试: http://www.sogou.com/web?query=chrome&_asf=www.sogou.com&_ast=&w=01019900&p=40040100&ie=utf8&from=index-nologin&s_from=index&sut=1527&sst0=1504347367611&lkt=0%2C0%2C0&sugsuv=00091651B48CA45F593B61A29B131405&sugtime=1504347367611
        name: "搜狗搜索",
        test: /www\.sogou\.com/,
        provider: www_sogou_com_1.SoGouProvider,
    },
    {
        // 测试: https://www.baidu.com/s?wd=chrome&rsv_spt=1&rsv_iqid=0xcb136237000ed40e&issp=1&f=8&rsv_bp=0&rsv_idx=2&ie=utf-8&tn=baidulocal&rsv_enter=1&rsv_sug3=7&rsv_sug1=7&rsv_sug7=101&rsv_sug2=0&inputT=813&rsv_sug4=989&timestamp=1504349229266&rn=50&vf_bl=1
        name: "百度搜索",
        test: /www\.baidu\.com/,
        provider: www_baidu_com_1.BaiduProvider,
    },
    {
        // 测试: https://www.baidu.com/s?wd=chrome&pn=20&oq=chrome&tn=baiduhome_pg&ie=utf-8&usm=3&rsv_idx=2&rsv_pq=e043900d0000752d&rsv_t=6bb0UqEwp2Tle6TAMBDlU3Wg%2BSxoqvvOhZKyQgM%2BVQP8Gc54QZLhcDcj62eGfNG75aq5&rsv_page=1
        name: "百度视频",
        test: /v\.baidu\.com/,
        provider: video_baidu_com_1.BaiduVideoProvider,
    },
    {
        // 测试: http://xueshu.baidu.com/s?wd=paperuri%3A%28ae4d6b5da05eca552dab05aeefb966e6%29&ie=utf-8&filter=sc_long_sign&sc_ks_para=q%3D%E2%80%9C%E4%BA%92%E8%81%94%E7%BD%91%2B%E5%81%A5%E5%BA%B7%E7%AE%A1%E7%90%86%E2%80%9D%E6%A8%A1%E5%BC%8F%E6%8E%A2%E8%AE%A8%E5%8F%8A%E5%85%B6%E5%BA%94%E7%94%A8&tn=SE_baiduxueshu_c1gjeupa
        name: "百度学术",
        test: /xueshu\.baidu\.com/,
        provider: xueshu_baidu_com_1.BaiduXueshuProvider,
    },
    {
        // 测试地址: http://tieba.baidu.com/p/5300844180
        name: "百度贴吧",
        test: /tieba\.baidu\.com/,
        provider: tieba_baidu_com_1.TiebaProvider,
    },
    {
        // 测试地址: https://juejin.im/entry/59ac8fa551882524241a8802?utm_source=gold_browser_extension
        name: "掘金",
        test: /juejin\.(im|cn)/,
        provider: juejin_com_1.JuejinProvider,
    },
    {
        name: "QQ邮箱",
        test: /mail\.qq\.com/,
        provider: mail_qq_com_1.QQMailProvider,
    },
    {
        // 测试地址: https://addons.mozilla.org/zh-CN/firefox/addon/evernote-web-clipper/
        name: "Mozilla",
        test: /addons\.mozilla\.org/,
        provider: addons_mozilla_org_1.MozillaProvider,
    },
    {
        // 测试地址: https://www.jianshu.com/p/979776ca44b8
        // https://www.jianshu.com/p/fc8abc65bbb2
        name: "简书",
        test: /www\.jianshu\.com/,
        provider: www_jianshu_com_1.JianShuProvider,
    },
    {
        // 测试地址: https://www.douban.com/doulist/240962/
        // 测试地址: https://www.douban.com/search?cat=1002&q=%E9%BB%91%E9%95%9C
        name: "豆瓣",
        test: /douban\.com/,
        provider: www_douban_com_1.DouBanProvider,
    },
    {
        // 测试地址: https://getpocket.com/a/recommended/
        // 需要登陆
        name: "Pocket",
        test: /getpocket\.com/,
        provider: getpocket_com_1.PocketProvider,
    },
    {
        // 测试地址: https://www.dogedoge.com/results?q=chrome
        name: "DogeDoge",
        test: /www\.dogedoge\.com/,
        provider: www_dogedoge_com_1.DogeDogeProvider,
    },
    {
        // 测试地址: https://51.ruyo.net/15053.html
        name: "Ruyo",
        test: /51\.ruyo\.net/,
        provider: _51_ruyo_net_1.RuyoProvider,
    },
    {
        // 测试地址: https://steamcommunity.com/sharedfiles/filedetails/?id=1311535531
        name: "Steam",
        test: /steamcommunity\.com/,
        provider: steamcommunity_com_1.SteamProvider,
    },
    {
        // 测试地址: https://mijisou.com/?q=chrome&category_general=on&time_range=&language=zh-CN&pageno=1
        name: "秘迹",
        test: /mijisou\.com/,
        provider: mijisou_com_1.MiJiProvider,
    },
    {
        // 测试地址: https://github.com/axetroy/anti-redirect/issues/350
        name: "CSDN",
        test: /blog\.csdn\.net/,
        provider: blog_csdn_net_1.CSDNProvider,
    },
    {
        // 测试地址：https://my.oschina.net/chipo/blog/3067672
        name: "OS China",
        test: /oschina\.net/,
        provider: oschina_com_1.OSChinaProvider,
    },
    {
        // 测试地址: https://github.com/axetroy/anti-redirect/issues/350
        name: "印象笔记",
        test: /app\.yinxiang\.com/,
        provider: app_yinxiang_com_1.YinXiangProvider,
    },
    {
        // 测试地址: https://www.logonews.cn/2021073002420141.html
        name: "标志情报局",
        test: /www\.logonews\.cn/,
        provider: www_logonews_cn_1.LogonewsProvider,
    },
    {
        // 测试地址: https://afdian.net/a/xiaofanEric
        name: "爱发电",
        test: /afdian\.net/,
        provider: afadian_net_1.AfDianNetProvider,
    },
    {
        // 测试地址: https://blog.51cto.com/u_11512826/2068421
        name: "51CTO博客",
        test: /blog\.51cto\.com/,
        provider: blog_51cto_com_1.Blog51CTO,
    },
    {
        // 测试地址: https://xie.infoq.cn/link?target=https%3A%2F%2Fwww.finclip.com%2F%3Fchannel%3Dinfoqseo
        name: "InfoQ",
        test: /infoq\.cn/,
        provider: infoq_cn_1.InfoQProvider,
    },
    {
        // 测试地址: https://gitee.com/Tencent/ncnn
        name: "Gitee",
        test: /gitee.com/,
        provider: gitee_com_1.GiteeProvider,
    },
    {
        // 测试地址: https://sspai.com/post/77499
        name: "少数派",
        test: /sspai\.com/,
        provider: sspai_com_1.SSPaiProvider,
    },
    {
        // 测试地址: https://www.bing.com/ck/a?&u=a1
        name: "Bing",
        test: /bing\.com/,
        provider: bing_com_1.BingProvider,
    },
])
    .bootstrap();

})();

/******/ })()
;
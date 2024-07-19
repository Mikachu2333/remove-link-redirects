// ==UserScript==
// @name              去除链接重定向
// @author            Meriel
// @description       能原地解析的链接绝不在后台访问，去除重定向的过程快速且高效，平均时间在0.02ms~0.05ms之间。几乎没有任何在后台访问网页获取去重链接的操作，一切都在原地进行，对速度精益求精。去除网页内链接的重定向，具有高准确性和高稳定性，以及相比同类插件更低的时间占用。
// @version           2.4.3
// @namespace         Violentmonkey Scripts
// @grant             GM.xmlHttpRequest
// @match             *://*/*
// @connect           *
// @icon              https://cdn-icons-png.flaticon.com/512/208/208895.png
// @supportURL        https://github.com/MerielVaren/remove-link-redirects
// @homepage          https://greasyfork.org/zh-CN/scripts/483475-%E5%8E%BB%E9%99%A4%E9%93%BE%E6%8E%A5%E9%87%8D%E5%AE%9A%E5%90%91
// @run-at            document-start
// @namespace         https://greasyfork.org/zh-CN/users/876245-meriel-varen
// @license           MIT
// ==/UserScript==

(() => {
  /********** 以下为自动跳转部分 **********/
  class AutoJumpApp {
    constructor() {
      this.registeredProvider = void 0;
    }

    /**
     * 注册服务提供者
     * @param providers
     */
    registerProvider(providers) {
      for (const provider of providers) {
        if (
          provider.urlTest instanceof RegExp &&
          !provider.urlTest.test(location.href)
        ) {
          continue;
        }
        if (provider.urlTest === false) {
          continue;
        }
        if (typeof provider.urlTest === "function" && !provider.urlTest()) {
          continue;
        }
        this.registeredProvider = provider;
        break;
      }
      return this;
    }

    /**
     * 启动应用
     * @returns
     * */
    bootstrap() {
      location.href = decodeURIComponent(
        this.registeredProvider.urlTest.exec(location.href)[1]
      );
    }

    static providers = [
      {
        name: "CSDN",
        urlTest: /link\.csdn\.net\/\?target=(.*)/,
      },
      {
        name: "腾讯兔小巢",
        urlTest: /support\.qq\.com\/.*link-jump\?jump=(.*)/,
      },
      {
        name: "QQ邮箱",
        urlTest: /mail\.qq\.com\/.*gourl=(.*)/,
      },
      {
        name: "印象笔记",
        urlTest: /app\.yinxiang\.com\/OutboundRedirect\.action\?dest=(.*)/,
      },
      {
        name: "Youtube",
        urlTest: /www\.youtube\.com\/redirect\?q=(.*)/,
      },
      {
        name: "微信开放社区",
        urlTest: /developers\.weixin\.qq\.com\/.*href=(.*)/,
      },
      {
        name: "pc6下载站",
        urlTest: /www\.pc6\.com\/.*gourl=(.*)/,
      },
      {
        name: "51CTO博客",
        urlTest: /blog\.51cto\.com\/transfer\?(.*)/,
      },
      {
        name: "QQ",
        urlTest: /c\.pc\.qq\.com.*\?pfurl=(.*)/,
      },
      {
        name: "UrlShare",
        urlTest: /.+\.urlshare\..+\/.*url=(.*)/,
      },
    ];
  }

  const autoJumpApp = new AutoJumpApp();
  autoJumpApp.registerProvider(AutoJumpApp.providers).bootstrap();

  /********** 以下为重定向解析部分 **********/
  class RedirectApp {
    /**
     * 调节providers的顺序
     * 将匹配到的provider放到最前
     * @param provider
     */
    adjustProviderOrderOnce = (function () {
      let executed = false; // 标志变量，用于跟踪函数是否已执行
      return function (provider) {
        if (!executed) {
          const index = this.registeredProviders.indexOf(provider);
          if (index !== -1) {
            this.registeredProviders.splice(index, 1);
            this.registeredProviders.unshift(provider);
          }
          executed = true;
        }
      };
    })();

    /**
     * A 标签是否匹配服务提供者
     * @param element
     * @param provider
     */
    static isMatchProvider(element, provider) {
      if (element.getAttribute(RedirectApp.Marker.RedirectStatusDone)) {
        return false;
      }
      if (
        provider.linkTest instanceof RegExp &&
        !provider.linkTest.test(element.href)
      ) {
        return false;
      }
      if (provider.linkTest instanceof Boolean) {
        return provider.linkTest;
      }
      if (
        typeof provider.linkTest === "function" &&
        !provider.linkTest(element)
      ) {
        return false;
      }
      return true;
    }

    /**
     * 解析完成的标志
     */
    static Marker = {
      RedirectStatusDone: "redirect-status-done",
    };

    /**
     * 兜底解析器
     * 用于解析无法解析的链接
     * 通过GM.xmlHttpRequest获取最终链接
     */
    static FallbackResolver = class {
      constructor() {
        this.processedUrls = new Map();
      }

      async resolveRedirect(element) {
        if (!this.processedUrls.has(element.href)) {
          this.processedUrls.set(element.href, void 0);
          const res = await GM.xmlHttpRequest({
            method: "GET",
            url: element.href,
            anonymous: true,
          });
          if (res.finalUrl) {
            this.processedUrls.set(element.href, res.finalUrl);
            element.href = res.finalUrl;
          }
        } else {
          element.href = this.processedUrls.get(element.href);
        }
      }
    };

    /**
     * 移除链接重定向
     * 首先判断是否可以直接解析链接，如果可以则直接解析
     * 如果不行，则调用fallbackResolver解析
     * @param element
     * @param realUrl
     * @param caller
     * @param options
     * @returns
     * */
    static removeLinkRedirect(element, realUrl, caller, options) {
      element.setAttribute(RedirectApp.Marker.RedirectStatusDone, "true");
      if ((realUrl && element.href !== realUrl) || options?.force) {
        element.href = realUrl;
      } else if (caller) {
        if (!caller.fallbackResolver) {
          caller.fallbackResolver = new RedirectApp.FallbackResolver();
        }
        caller.fallbackResolver.resolveRedirect(element);
      }
    }

    /**
     * 监听URL变化
     * @param operation
     * @returns
     * */
    static monitorUrlChange(operation) {
      function urlChange(event) {
        const destinationUrl = event?.destination?.url || "";
        if (destinationUrl.startsWith("about:blank")) return;
        const href = destinationUrl || location.href;
        if (href !== location.href) {
          operation(href);
        }
      }
      unsafeWindow?.navigation?.addEventListener("navigate", urlChange);
      unsafeWindow.addEventListener("replaceState", urlChange);
      unsafeWindow.addEventListener("pushState", urlChange);
      unsafeWindow.addEventListener("popState", urlChange);
      unsafeWindow.addEventListener("hashchange", urlChange);
    }

    constructor() {
      this.registeredProviders = [];
      this.mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach(this.handleMutation.bind(this));
      });
    }

    /**
     * 处理变动
     * @param mutation
     * @returns
     * */
    handleMutation(mutation) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLAnchorElement) {
            this.handleNode(node);
          } else {
            const aNodes = node.querySelectorAll?.(
              `a:not([${RedirectApp.Marker.RedirectStatusDone}])`
            );
            aNodes?.forEach((aNode) => this.handleNode(aNode));
          }
        });
      }
    }

    /**
     * 处理节点
     * @param node
     * @returns
     */
    handleNode(node) {
      for (const provider of this.registeredProviders) {
        if (RedirectApp.isMatchProvider(node, provider)) {
          provider.resolveRedirect(node);
          this.adjustProviderOrderOnce(provider);
          break;
        }
      }
    }

    /**
     * 当页面准备就绪时，进行初始化动作
     */
    async pageOnReady() {
      for (const provider of this.registeredProviders) {
        if (provider.onInit) {
          await provider.onInit();
        }
      }
    }

    /**
     * 注册服务提供者
     * @param providers
     */
    registerProviders(providers) {
      for (const provider of providers) {
        if (provider.urlTest === false) {
          continue;
        }
        if (
          provider.urlTest instanceof RegExp &&
          !provider.urlTest.test(location.href)
        ) {
          continue;
        }
        if (typeof provider.urlTest === "function" && !provider.urlTest()) {
          continue;
        }
        this.registeredProviders.push(provider);
      }
      return this;
    }

    /**
     * 启动应用
     */
    bootstrap() {
      addEventListener("DOMContentLoaded", this.pageOnReady.bind(this));
      this.mutationObserver.observe(document, {
        childList: true,
        subtree: true,
      });
    }

    static providers = [
      {
        name: "如有乐享",
        urlTest: /51\.ruyo\.net/,
        linkTest: /\/[^\?]*\?u=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("u"),
            this
          );
        },
      },
      {
        name: "Mozilla",
        urlTest: /addons\.mozilla\.org/,
        linkTest: /outgoing\.prod\.mozaws\.net\/v\d\/\w+\/(.*)/,
        resolveRedirect: function (element) {
          let url = void 0;
          const match = this.linkTest.exec(element.href);
          if (match && match[1]) {
            try {
              url = decodeURIComponent(match[1]);
            } catch (_) {
              url = /(http|https)?:\/\//.test(match[1]) ? match[1] : void 0;
            }
          }
          RedirectApp.removeLinkRedirect(element, url, this);
        },
      },
      {
        name: "爱发电",
        urlTest: /afdian\.net/,
        linkTest: /afdian\.net\/link\?target=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("target"),
            this
          );
        },
      },
      {
        name: "印象笔记",
        urlTest: /(www|app)\.yinxiang\.com/,
        linkTest: true,
        resolveRedirect: function (element) {
          if (element.hasAttribute("data-mce-href")) {
            if (!element.onclick) {
              RedirectApp.removeLinkRedirect(element, element.href, this, {
                force: true,
              });
              element.onclick = function (e) {
                // 阻止事件冒泡, 因为上层元素绑定的click事件会重定向
                e.stopPropagation?.();
                element.setAttribute("target", "_blank");
                window.top
                  ? window.top.open(element.href)
                  : window.open(element.href);
              };
            }
          }
        },
        onInit: async function () {
          const handler = function (e) {
            const dom = e.target;
            const tagName = dom.tagName.toUpperCase();
            switch (tagName) {
              case "A": {
                this.resolveRedirect(dom);
                break;
              }
              case "IFRAME": {
                if (dom.hasAttribute("redirect-link-removed")) {
                  return;
                }
                dom.setAttribute("redirect-link-removed", "true");
                dom.contentWindow.document.addEventListener(
                  "mouseover",
                  handler
                );
                break;
              }
            }
          };
          document.addEventListener("mouseover", handler);
        },
      },
      {
        name: "印象笔记",
        urlTest: /app\.yinxiang\.com/,
        linkTest:
          /(www|app)\.yinxiang\.com\/OutboundRedirect\.action\?dest=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("dest"),
            this
          );
        },
      },
      {
        name: "Bing",
        urlTest: /bing\.com/,
        linkTest: /.+\.bing\.com\/ck\/a\?.*&u=a1(.*)&ntb=1/,
        textDecoder: new TextDecoder("utf-8"),
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            this.textDecoder.decode(
              Uint8Array.from(
                Array.from(
                  atob(
                    element.href
                      .split("&u=a1")[1]
                      .split("&ntb=1")[0]
                      .replace(/[-_]/g, (e) => ("-" === e ? "+" : "/"))
                      .replace(/[^A-Za-z0-9\\+\\/]/g, "")
                  )
                ).map((e) => e.charCodeAt(0))
              )
            ),
            this
          );
        },
      },
      {
        name: "51CTO博客",
        urlTest: /blog\.51cto\.com/,
        linkTest: true,
        resolveRedirect: function (element) {
          const container = document.querySelector(".article-detail");
          if (container?.contains(element)) {
            if (!element.onclick && element.href) {
              element.onclick = function (e) {
                e.stopPropagation?.();
                e.stopImmediatePropagation?.();
                e.preventDefault?.();
                const $a = document.createElement("a");
                $a.href = element.href;
                $a.target = element.target;
                $a.click();
              };
            }
          }
        },
      },
      {
        name: "51CTO博客",
        urlTest: /blog\.51cto\.com/,
        linkTest: /blog\.51cto\.com\/.*transfer\?(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("url"),
            this
          );
        },
      },
      {
        name: "CSDN",
        urlTest: /blog\.csdn\.net/,
        linkTest: true,
        resolveRedirect: function (element) {
          const container = document.querySelector("#content_views");
          if (container?.contains(element)) {
            if (!element.onclick && element.origin !== window.location.origin) {
              RedirectApp.removeLinkRedirect(element, element.href, this, {
                force: true,
              });
              element.onclick = function (e) {
                // 阻止事件冒泡, 因为上层元素绑定的click事件会重定向
                e.stopPropagation?.();
                e.stopImmediatePropagation?.();
                e.preventDefault?.();
                element.setAttribute("target", "_blank");
              };
            }
          }
        },
      },
      {
        name: "知乎日报",
        urlTest: /daily\.zhihu\.com/,
        linkTest: /zhihu\.com\/\?target=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("target"),
            this
          );
        },
      },
      {
        name: "Google Docs",
        urlTest: /docs\.google\.com/,
        linkTest: /www\.google\.com\/url\?q=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("q"),
            this
          );
        },
      },
      {
        name: "Pocket",
        urlTest: /getpocket\.com/,
        linkTest: /getpocket\.com\/redirect\?url=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("url"),
            this
          );
        },
      },
      {
        name: "Gitee",
        urlTest: /gitee\.com/,
        linkTest: /gitee\.com\/link\?target=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("target"),
            this
          );
        },
      },
      {
        name: "InfoQ",
        urlTest: /infoq\.cn/,
        linkTest: /infoq\.cn\/link\?target=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("target"),
            this
          );
        },
      },
      {
        name: "掘金",
        urlTest: /juejin\.(im|cn)/,
        linkTest: /link\.juejin\.(im|cn)\/\?target=(.*)/,
        resolveRedirect: function (element) {
          const finalURL = new URL(element.href).searchParams.get("target");
          RedirectApp.removeLinkRedirect(element, finalURL, this);
          if (this.linkTest.test(element.title)) {
            element.title = finalURL;
          }
        },
      },
      {
        name: "QQ邮箱",
        urlTest: /mail\.qq\.com/,
        linkTest: true,
        resolveRedirect: function (element) {
          const container = document.querySelector("#contentDiv");
          if (container?.contains(element)) {
            if (!element.onclick) {
              element.onclick = function (e) {
                // 阻止事件冒泡, 因为上层元素绑定的click事件会重定向
                e.stopPropagation?.();
                e.stopImmediatePropagation?.();
                e.preventDefault?.();
              };
            }
          }
        },
      },
      {
        name: "QQ邮箱",
        urlTest: /mail\.qq\.com/,
        linkTest: /mail\.qq\.com.+gourl=(.+).*/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("gourl"),
            this
          );
        },
      },
      {
        name: "OS China",
        urlTest: /oschina\.net/,
        linkTest: /oschina\.net\/action\/GoToLink\?url=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("url"),
            this
          );
        },
      },
      {
        name: "Google Play",
        urlTest: /play\.google\.com/,
        linkTest: function (element) {
          if (/google\.com\/url\?q=(.*)/.test(element.href)) {
            return true;
          } else if (/^\/store\/apps\/details/.test(location.pathname)) {
            return true;
          }
          return false;
        },
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("q"),
            this
          );
          const eles = [].slice.call(document.querySelectorAll("a.hrTbp"));
          for (const ele of eles) {
            if (
              !ele.href ||
              ele.getAttribute(RedirectApp.Marker.RedirectStatusDone)
            ) {
              continue;
            }
            ele.setAttribute(RedirectApp.Marker.RedirectStatusDone, "true");
            ele.setAttribute("target", "_blank");
            ele.addEventListener(
              "click",
              (event) => {
                event.stopPropagation();
              },
              true
            );
          }
        },
      },
      {
        name: "少数派",
        urlTest: /sspai\.com/,
        linkTest: /sspai\.com\/link\?target=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("target"),
            this
          );
        },
      },
      {
        name: "Steam Community",
        urlTest: /steamcommunity\.com/,
        linkTest: /steamcommunity\.com\/linkfilter\/\?url=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("url"),
            this
          );
        },
      },
      {
        name: "百度贴吧",
        urlTest: /tieba\.baidu\.com/,
        linkTest: /jump\d*\.bdimg\.com/,
        resolveRedirect: function (element) {
          let url = void 0;
          const text = element.innerText || element.textContent || void 0;
          const isUrl = /(http|https)?:\/\//.test(text);
          try {
            if (isUrl) url = decodeURIComponent(text);
          } catch (_) {
            if (isUrl) url = text;
          }
          removeLinkRedirect(element, url, this);
        },
      },
      {
        name: "Twitter",
        urlTest: /twitter\.com/,
        linkTest: /t\.co\/\w+/,
        resolveRedirect: function (element) {
          if (/(http|https)?:\/\//.test(element.title)) {
            const url = decodeURIComponent(element.title);
            RedirectApp.removeLinkRedirect(element, url, this);
            return;
          }
          const innerText = element.innerText.replace(/…$/, "");
          if (/(http|https)?:\/\//.test(innerText)) {
            RedirectApp.removeLinkRedirect(element, innerText, this);
            return;
          }
        },
      },
      {
        name: "微博",
        urlTest: /\.weibo\.(com|cn)/,
        linkTest: /t\.cn\/\w+/,
        resolveRedirect: function (element) {
          if (!/^(http|https)?:\/\//.test(element.title)) {
            return;
          }
          let url = void 0;
          try {
            url = decodeURIComponent(element.title);
          } catch (_) {}
          RedirectApp.removeLinkRedirect(element, url, this);
        },
      },
      {
        name: "微博",
        urlTest: /weibo\.(com|cn)/,
        linkTest: /weibo\.(com|cn)\/sinaurl\?u=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            decodeURIComponent(new URL(element.href).searchParams.get("u")),
            this
          );
        },
      },
      {
        name: "百度搜索",
        urlTest: /www\.baidu\.com/,
        linkTest: /www\.baidu\.com\/link\?url=/,
        unresolvableWebsites: ["nourl.ubs.baidu.com", "lightapp.baidu.com"],
        specialElements: [
          ".cos-row",
          "[class*=catalog-list]",
          "[class*=group-content]",
        ],
        // fallbackResolver: RedirectApp.createFallbackResolver(),
        fallbackResolver: new RedirectApp.FallbackResolver(),
        resolveRedirect: async function (element) {
          const url = this.specialElements.some((selector) =>
            element.closest(selector)
          )
            ? void 0
            : element.closest(".c-container[mu]")?.getAttribute("mu");
          if (
            url &&
            url !== "null" &&
            url !== "undefined" &&
            !this.unresolvableWebsites.some((u) => url.includes(u))
          ) {
            RedirectApp.removeLinkRedirect(element, url, this);
          } else {
            this.fallbackResolver.resolveRedirect(element);
          }
        },
        onInit: async function () {
          RedirectApp.monitorUrlChange((href) => {
            const url = new URL(location.href);
            if (url.searchParams.has("wd")) {
              location.href = href;
            }
          });
        },
      },
      {
        name: "豆瓣",
        urlTest: /douban\.com/,
        linkTest: /douban\.com\/link2\/?\?url=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("url"),
            this
          );
        },
      },
      {
        name: "Google搜索",
        urlTest: /\w+\.google\./,
        linkTest: true,
        resolveRedirect: function (element) {
          const traceProperties = [
            "ping",
            "data-jsarwt",
            "data-usg",
            "data-ved",
          ];
          // 移除追踪
          for (const property of traceProperties) {
            if (element.getAttribute(property)) {
              element.removeAttribute(property);
            }
          }
          // 移除多余的事件
          if (element.getAttribute("onmousedown")) {
            element.removeAttribute("onmousedown");
          }
          // 尝试去除重定向
          if (element.getAttribute("data-href")) {
            const realUrl = element.getAttribute("data-href");
            RedirectApp.removeLinkRedirect(element, realUrl, this);
          }
          const url = new URL(element.href);
          if (url.searchParams.get("url")) {
            RedirectApp.removeLinkRedirect(
              element,
              url.searchParams.get("url"),
              this
            );
          }
        },
      },
      {
        name: "简书",
        urlTest: /www\.jianshu\.com/,
        linkTest: function (element) {
          const isLink1 = /links\.jianshu\.com\/go/.test(element.href);
          const isLink2 = /link\.jianshu\.com(\/)?\?t=/.test(element.href);
          const isLink3 = /jianshu\.com\/go-wild\/?\?(.*)url=/.test(
            element.href
          );
          if (isLink1 || isLink2 || isLink3) {
            return true;
          }
          return false;
        },
        resolveRedirect: function (element) {
          const search = new URL(element.href).searchParams;
          RedirectApp.removeLinkRedirect(
            element,
            search.get("to") || search.get("t") || search.get("url"),
            this
          );
        },
      },
      {
        name: "标志情报局",
        urlTest: /www\.logonews\.cn/,
        linkTest: /link\.logonews\.cn\/\?url=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("url"),
            this
          );
        },
      },
      {
        name: "360搜索",
        urlTest: /www\.so\.com/,
        linkTest: /so\.com\/link\?(.*)/,
        resolveRedirect: function (element) {
          const url =
            element.getAttribute("data-mdurl") ||
            element.getAttribute("e-landurl");
          if (url) {
            RedirectApp.removeLinkRedirect(element, url, this);
          }
          // remove track
          element.removeAttribute("e_href");
          element.removeAttribute("data-res");
        },
      },
      {
        name: "搜狗搜索",
        urlTest: /www\.sogou\.com/,
        linkTest: /www\.sogou\.com\/link\?url=/,
        resolveRedirect: function (element) {
          const vrwrap = element.closest(".vrwrap");
          const rSech = vrwrap.querySelector(".r-sech[data-url]");
          const url = rSech.getAttribute("data-url");
          RedirectApp.removeLinkRedirect(element, url, this);
        },
      },
      {
        name: "Youtube",
        urlTest: /www\.youtube\.com/,
        linkTest: /www\.youtube\.com\/redirect\?.{1,}/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("q"),
            this
          );
        },
      },
      {
        name: "知乎",
        urlTest: /www\.zhihu\.com/,
        linkTest: /zhihu\.com\/\?target=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("target"),
            this
          );
        },
      },
      {
        name: "百度学术",
        urlTest: /xueshu\.baidu\.com/,
        linkTest: /xueshu\.baidu\.com\/s?\?(.*)/,
        resolveRedirect: function (element) {
          const url =
            element.getAttribute("data-link") ||
            element.getAttribute("data-url") ||
            void 0;
          RedirectApp.removeLinkRedirect(
            element,
            decodeURIComponent(url),
            this
          );
        },
      },
      {
        name: "知乎专栏",
        urlTest: /zhuanlan\.zhihu\.com/,
        linkTest: /link\.zhihu\.com\/\?target=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("target"),
            this
          );
        },
      },
      {
        name: "力扣",
        urlTest: /leetcode\.(cn|com)/,
        linkTest: /leetcode\.(cn|com)\/link\?target=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("target"),
            this
          );
        },
      },
      {
        name: "腾讯开发者社区",
        urlTest: /cloud\.tencent\.com/,
        linkTest:
          /cloud\.tencent\.com\/developer\/tools\/blog-entry\?target=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("target"),
            this
          );
        },
      },
      {
        name: "酷安",
        urlTest: true,
        linkTest: /www\.coolapk\.com\/link\?url=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("url"),
            this
          );
        },
      },
      {
        name: "腾讯兔小巢",
        urlTest: /support\.qq\.com/,
        linkTest: /support\.qq\.com\/.*link-jump\?jump=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("jump"),
            this
          );
        },
      },
      {
        name: "微信开放社区",
        urlTest: /developers\.weixin\.qq\.com/,
        linkTest: /developers\.weixin\.qq\.com\/.*href=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("href"),
            this
          );
        },
      },
      {
        name: "pc6下载站",
        urlTest: /www\.pc6\.com/,
        linkTest: /www\.pc6\.com\/.*\?gourl=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("gourl"),
            this
          );
        },
      },
      {
        name: "QQ",
        urlTest: true,
        linkTest: /c\.pc\.qq\.com.*\?pfurl=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("pfurl"),
            this
          );
        },
      },
      {
        name: "UrlShare",
        urlTest: true,
        linkTest: /.+\.urlshare\..+\/.*url=(.*)/,
        resolveRedirect: function (element) {
          RedirectApp.removeLinkRedirect(
            element,
            decodeURIComponent(new URL(element.href).searchParams.get("url")),
            this
          );
        },
      },
    ];
  }

  const redirectApp = new RedirectApp();
  redirectApp.registerProviders(RedirectApp.providers).bootstrap();
})();

// ==UserScript==
// @name              去除链接重定向
// @author            Meriel
// @description       能原地解析的链接绝不在后台访问，去除重定向的过程快速且高效，平均时间在0.02ms~0.05ms之间。几乎没有任何在后台访问网页获取去重链接的操作，一切都在原地进行，对速度精益求精。去除网页内链接的重定向，具有高准确性和高稳定性，以及相比同类插件更低的时间占用。
// @version           2.2.3
// @namespace         Violentmonkey Scripts
// @grant             GM.xmlHttpRequest
// @match             *://www.baidu.com/*
// @match             *://tieba.baidu.com/*
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
// @icon              https://cdn-icons-png.flaticon.com/512/208/208895.png
// @supportURL        https://github.com/MerielVaren/remove-link-redirects
// @homepage          https://greasyfork.org/zh-CN/scripts/483475-%E5%8E%BB%E9%99%A4%E9%93%BE%E6%8E%A5%E9%87%8D%E5%AE%9A%E5%90%91
// @run-at            document-start
// @namespace         https://greasyfork.org/zh-CN/users/876245-meriel-varen
// @license           MIT
// ==/UserScript==

(() => {
  class App {
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
              `a:not([${Marker.RedirectStatusDone}])`
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
        if (this.isMatchProvider(node, provider)) {
          provider.resolve(node);
          break;
        }
      }
    }

    /**
     * A 标签是否匹配服务提供者
     * @param element
     * @param provider
     */
    isMatchProvider(element, provider) {
      if (element.getAttribute(Marker.RedirectStatusDone)) {
        return false;
      }
      if (
        provider.linkTest instanceof RegExp &&
        !provider.linkTest.test(element.href)
      ) {
        return false;
      }
      if (
        typeof provider.linkTest === "function" &&
        !provider.linkTest(element)
      ) {
        return false;
      }
      if (provider.linkTest instanceof Boolean) {
        return provider.linkTest;
      }
      return true;
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
          !provider.urlTest.test(location.hostname)
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
  }

  const Marker = {
    RedirectStatusDone: "redirect-status-done",
  };

  /**
   * 根据url上的路径匹配，去除重定向
   * @param {HTMLAnchorElement} element
   * @param {RegExp} tester
   * @returns {boolean}
   */
  function matchLinkFromUrl(element, tester) {
    const match = tester.exec(element.href);
    if (!match || !match[1]) return "";
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return /https?:\/\//.test(match[1]) ? match[1] : "";
    }
  }

  /**
   * 去除重定向
   * @param element A标签元素
   * @param realUrl 真实的地址
   * @param options
   */
  function removeLinkRedirect(element, realUrl, options = {}) {
    if (options.force || (realUrl && element.href !== realUrl)) {
      element.setAttribute(Marker.RedirectStatusDone, "true");
      element.href = realUrl;
    }
  }

  /**
   * 监听URL变化
   */
  function monitorUrlChange(operation) {
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

  const providers = [
    {
      name: "如有乐享",
      urlTest: /51\.ruyo\.net/,
      linkTest: /\/[^\?]*\?u=(.*)/,
      resolve: function (element) {
        removeLinkRedirect(
          element,
          new URL(element.href).searchParams.get("u")
        );
      },
    },
    {
      name: "Mozilla",
      urlTest: /addons\.mozilla\.org/,
      linkTest: /outgoing\.prod\.mozaws\.net\/v\d\/\w+\/(.*)/,
      resolve: function (element) {
        removeLinkRedirect(element, matchLinkFromUrl(element, this.linkTest));
      },
    },
    {
      name: "爱发电",
      urlTest: /afdian\.net/,
      linkTest: /afdian\.net\/link\?target=(.*)/,
      resolve: function (element) {
        removeLinkRedirect(
          element,
          new URL(element.href).searchParams.get("target")
        );
      },
    },
    {
      name: "印象笔记",
      urlTest: /app\.yinxiang\.com/,
      linkTest: /^http:\/\//,
      resolve: function (element) {
        if (element.hasAttribute("data-mce-href")) {
          if (!element.onclick) {
            removeLinkRedirect(element, element.href, { force: true });
            element.onclick = (e) => {
              // 阻止事件冒泡, 因为上层元素绑定的click事件会重定向
              if (e.stopPropagation) {
                e.stopPropagation();
              }
              element.setAttribute("target", "_blank");
              window.top
                ? window.top.open(element.href)
                : window.open(element.href);
            };
          }
        }
        // 分享页面
        else if (
          /^https:\/\/app\.yinxiang\.com\/OutboundRedirect\.action\?dest=/.test(
            element.href
          )
        ) {
          removeLinkRedirect(
            element,
            new URL(element.href).searchParams.get("dest")
          );
        }
      },
      onInit: async function () {
        const handler = (e) => {
          const dom = e.target;
          const tagName = dom.tagName.toUpperCase();
          switch (tagName) {
            case "A": {
              this.resolve(dom);
              break;
            }
            case "IFRAME": {
              if (dom.hasAttribute("redirect-link-removed")) {
                return;
              }
              dom.setAttribute("redirect-link-removed", "true");
              dom.contentWindow.document.addEventListener("mouseover", handler);
              break;
            }
          }
        };
        document.addEventListener("mouseover", handler);
      },
    },
    {
      name: "Bing",
      urlTest: /bing\.com/,
      linkTest: /.+\.bing\.com\/ck\/a\?.*&u=a1(.*)&ntb=1/,
      textDecoder: new TextDecoder("utf-8"),
      resolve: function (element) {
        removeLinkRedirect(
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
          )
        );
      },
    },
    {
      name: "51CTO博客",
      urlTest: /blog\.51cto\.com/,
      linkTest: true,
      resolve: function (element) {
        this.container = document.querySelector(".article-detail");
        if (this.container?.contains(element)) {
          if (!element.onclick && element.href) {
            element.onclick = function removeLinkRedirectOnClickFn(e) {
              e.stopPropagation();
              e.preventDefault();
              e.stopImmediatePropagation();
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
      name: "CSDN",
      urlTest: /blog\.csdn\.net/,
      linkTest: /^https?:\/\//,
      resolve: function (element) {
        this.container = document.querySelector("#content_views");
        if (this.container?.contains(element)) {
          if (!element.onclick && element.origin !== window.location.origin) {
            removeLinkRedirect(element, element.href, { force: true });
            element.onclick = (e) => {
              // 阻止事件冒泡, 因为上层元素绑定的click事件会重定向
              if (e.stopPropagation) {
                e.stopPropagation();
              }
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
      resolve: function (element) {
        removeLinkRedirect(
          element,
          new URL(element.href).searchParams.get("target")
        );
      },
    },
    {
      name: "Google Docs",
      urlTest: /docs\.google\.com/,
      linkTest: /www\.google\.com\/url\?q=(.*)/,
      resolve: function (element) {
        removeLinkRedirect(
          element,
          new URL(element.href).searchParams.get("q")
        );
      },
    },
    {
      name: "Pocket",
      urlTest: /getpocket\.com/,
      linkTest: /getpocket\.com\/redirect\?url=(.*)/,
      resolve: function (element) {
        removeLinkRedirect(
          element,
          new URL(element.href).searchParams.get("url")
        );
      },
    },
    {
      name: "Gitee",
      urlTest: /gitee\.com/,
      linkTest: /gitee\.com\/link\?target=(.*)/,
      resolve: function (element) {
        removeLinkRedirect(
          element,
          new URL(element.href).searchParams.get("target")
        );
      },
    },
    {
      name: "InfoQ",
      urlTest: /infoq\.cn/,
      linkTest: /infoq\.cn\/link\?target=(.*)/,
      resolve: function (element) {
        removeLinkRedirect(
          element,
          new URL(element.href).searchParams.get("target")
        );
      },
    },
    {
      name: "掘金",
      urlTest: /juejin\.(im|cn)/,
      linkTest: /link\.juejin\.(im|cn)\/\?target=(.*)/,
      resolve: function (element) {
        const finalURL = new URL(element.href).searchParams.get("target");
        removeLinkRedirect(element, finalURL);
        if (this.linkTest.test(element.title)) {
          element.title = finalURL;
        }
      },
    },
    {
      name: "QQ邮箱",
      urlTest: /mail\.qq\.com/,
      linkTest: true,
      resolve: function (element) {
        this.container = document.querySelector("#contentDiv");
        if (this.container?.contains(element)) {
          if (element.onclick) {
            element.onclick = (e) => {
              // 阻止事件冒泡, 因为上层元素绑定的click事件会重定向
              if (e.stopPropagation) {
                e.stopPropagation();
              }
            };
          }
        }
      },
    },
    {
      name: "OS China",
      urlTest: /oschina\.net/,
      linkTest: /oschina\.net\/action\/GoToLink\?url=(.*)/,
      resolve: function (element) {
        removeLinkRedirect(
          element,
          new URL(element.href).searchParams.get("url")
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
      resolve: function (element) {
        removeLinkRedirect(
          element,
          new URL(element.href).searchParams.get("q")
        );
        // 移除开发者栏目下的重定向
        const eles = [].slice.call(document.querySelectorAll("a.hrTbp"));
        for (const ele of eles) {
          if (!ele.href || ele.getAttribute(Marker.RedirectStatusDone)) {
            continue;
          }
          ele.setAttribute(Marker.RedirectStatusDone, "true");
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
      resolve: function (element) {
        removeLinkRedirect(
          element,
          new URL(element.href).searchParams.get("target")
        );
      },
    },
    {
      name: "Steam Community",
      urlTest: /steamcommunity\.com/,
      linkTest: /steamcommunity\.com\/linkfilter\/\?url=(.*)/,
      resolve: function (element) {
        removeLinkRedirect(
          element,
          new URL(element.href).searchParams.get("url")
        );
      },
    },
    {
      name: "百度贴吧",
      urlTest: /tieba\.baidu\.com/,
      linkTest: /jump\d*\.bdimg\.com/,
      resolve: function (element) {
        if (!this.test.test(element.href)) {
          return;
        }
        let url = element.href;
        const text = element.innerText || element.textContent || "";
        const isUrl = /https?:\/\//.test(text);
        try {
          url = isUrl ? decodeURIComponent(text) : element.href;
        } catch (e) {
          url = isUrl ? text : element.href;
        }
        if (url) {
          removeLinkRedirect(element, url);
        }
      },
    },
    {
      name: "Twitter",
      urlTest: /twitter\.com/,
      linkTest: /t\.co\/\w+/,
      resolve: function (element) {
        if (!this.linkTest.test(element.href)) {
          return;
        }
        if (/https?:\/\//.test(element.title)) {
          const url = decodeURIComponent(element.title);
          removeLinkRedirect(element, url);
          return;
        }
        const innerText = element.innerText.replace(/…$/, "");
        if (/https?:\/\//.test(innerText)) {
          removeLinkRedirect(element, innerText);
          return;
        }
      },
    },
    {
      name: "微博",
      urlTest: /\.weibo\.com/,
      linkTest: /t\.cn\/\w+/,
      resolve: function (element) {
        if (
          !(
            this.linkTest.test(element.href) &&
            /^https?:\/\//.test(element.title)
          )
        ) {
          return;
        }
        const url = decodeURIComponent(element.title);
        if (url) {
          element.href = url;
          removeLinkRedirect(element, url);
        }
      },
    },
    {
      name: "百度搜索",
      urlTest: /www\.baidu\.com/,
      linkTest: /www\.baidu\.com\/link\?url=/,
      unresolvable: ["nourl.ubs.baidu.com", "lightapp.baidu.com"],
      processedUrls: new Map(),
      handleOneElement: async function (element) {
        if (!this.processedUrls.has(element.href)) {
          this.processedUrls.set(element.href, null);
          const res = await GM.xmlHttpRequest({
            method: "GET",
            url: element.href,
            anonymous: true,
          });
          if (res.finalUrl) {
            this.processedUrls.set(element.href, res.finalUrl);
            removeLinkRedirect(element, res.finalUrl);
          }
        } else {
          removeLinkRedirect(element, this.processedUrls.get(element.href));
        }
      },
      resolve: async function (element) {
        const url = element.closest(".cos-row")
          ? null
          : element.closest(".c-container[mu]")?.getAttribute("mu");
        if (
          url &&
          url !== "null" &&
          url !== "undefined" &&
          !this.unresolvable.some((u) => url.includes(u))
        ) {
          removeLinkRedirect(element, url);
        } else {
          this.handleOneElement(element);
        }
      },
      onInit: async function () {
        monitorUrlChange((href) => {
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
      resolve: function (element) {
        removeLinkRedirect(
          element,
          new URL(element.href).searchParams.get("url")
        );
      },
    },
    {
      name: "Google搜索",
      urlTest: /\w+\.google\./,
      linkTest: true,
      resolve: function (element) {
        const traceProperties = ["ping", "data-jsarwt", "data-usg", "data-ved"];
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
          removeLinkRedirect(element, realUrl);
        }
        const url = new URL(element.href);
        if (url.searchParams.get("url")) {
          removeLinkRedirect(element, url.searchParams.get("url"));
        }
      },
    },
    {
      name: "简书",
      urlTest: /www\.jianshu\.com/,
      linkTest: function (element) {
        const isLink1 = /links\.jianshu\.com\/go/.test(element.href);
        const isLink2 = /link\.jianshu\.com(\/)?\?t=/.test(element.href);
        const isLink3 = /jianshu\.com\/go-wild\/?\?(.*)url=/.test(element.href);
        if (isLink1 || isLink2 || isLink3) {
          return true;
        }
        return false;
      },
      resolve: function (element) {
        const search = new URL(element.href).searchParams;
        removeLinkRedirect(
          element,
          search.get("to") || search.get("t") || search.get("url")
        );
      },
    },
    {
      name: "标志情报局",
      urlTest: /www\.logonews\.cn/,
      linkTest: /link\.logonews\.cn\/\?url=(.*)/,
      resolve: function (element) {
        removeLinkRedirect(
          element,
          new URL(element.href).searchParams.get("url")
        );
      },
    },
    {
      name: "360搜索",
      urlTest: /www\.so\.com/,
      linkTest: /so\.com\/link\?(.*)/,
      resolve: function (element) {
        const url =
          element.getAttribute("data-mdurl") ||
          element.getAttribute("e-landurl");
        if (url) {
          removeLinkRedirect(element, url);
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
      resolve: function (element) {
        const vrwrap = element.closest(".vrwrap");
        const rSech = vrwrap.querySelector(".r-sech");
        const url = rSech.getAttribute("data-url");
        removeLinkRedirect(element, url);
      },
    },
    {
      name: "Youtube",
      urlTest: /www\.youtube\.com/,
      linkTest: /www\.youtube\.com\/redirect\?.{1,}/,
      resolve: function (element) {
        removeLinkRedirect(
          element,
          new URL(element.href).searchParams.get("q")
        );
      },
    },
    {
      name: "知乎",
      urlTest: /www\.zhihu\.com/,
      linkTest: /zhihu\.com\/\?target=(.*)/,
      resolve: function (element) {
        removeLinkRedirect(
          element,
          new URL(element.href).searchParams.get("target")
        );
      },
    },
    {
      name: "百度学术",
      urlTest: /xueshu\.baidu\.com/,
      linkTest: /xueshu\.baidu\.com\/s?\?(.*)/,
      resolve: function (element) {
        const realHref =
          element.getAttribute("data-link") || element.getAttribute("data-url");
        if (realHref) {
          removeLinkRedirect(element, decodeURIComponent(realHref));
        }
      },
    },
    {
      name: "知乎专栏",
      urlTest: /zhuanlan\.zhihu\.com/,
      linkTest: /link\.zhihu\.com\/\?target=(.*)/,
      resolve: function (element) {
        removeLinkRedirect(
          element,
          new URL(element.href).searchParams.get("target")
        );
      },
    },
  ];

  const app = new App();
  app.registerProviders(providers).bootstrap();
})();

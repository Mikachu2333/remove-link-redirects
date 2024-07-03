import { IProvider, IProviderConstructor } from "./provider";
import { Marker, debounceDecorator, getRedirect, isInView, throttleDecorator } from "./utils";

type tester = () => boolean;

interface IProviderConfig {
  name: string;
  test: RegExp | boolean | tester;
  provider: IProviderConstructor;
}

export interface IAppConfig {
  isDebug: boolean;
}

export class App {
  private config: IAppConfig;
  private provides: IProvider[] = [];
  private mutationObserver: MutationObserver = new MutationObserver((mutationsList) => {
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

  constructor() {
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
  private isMatchProvider(aElement: HTMLAnchorElement, provider: IProvider): boolean {
    if (aElement.getAttribute(Marker.RedirectStatusDone)) {
      return false;
    }
    if (provider.test instanceof RegExp && !provider.test.test(aElement.href)) {
      return false;
    }
    if (typeof provider.test === "function" && !provider.test(aElement)) {
      return false;
    }
    if (provider.test instanceof Boolean) {
      return provider.test as boolean;
    }
    return true;
  }
  /**
   * 当页面准备就绪时，进行初始化动作
   */
  private async pageOnReady() {
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
  public setConfig(config: IAppConfig): this {
    this.config = config;
    return this;
  }
  /**
   * 注册服务提供者
   * @param providers
   */
  public registerProvider(providers: IProviderConfig[]): this {
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
  public bootstrap() {
    addEventListener("DOMContentLoaded", this.pageOnReady.bind(this));
  }
}

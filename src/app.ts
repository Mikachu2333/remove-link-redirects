import { IProvider, IProviderConstructor } from "./provider";
import { Marker } from "./utils";

type tester = () => boolean;

interface IProviderConfig {
  name: string;
  test: RegExp | boolean | tester;
  provider: IProviderConstructor;
}

export class App {
  private providers: IProvider[] = [];
  private mutationObserver: MutationObserver = new MutationObserver((mutations) => {
    mutations.forEach(this.handleMutation.bind(this));
  });

  /**
   * 处理变动
   * @param mutation
   * @returns
   * */
  private handleMutation(mutation: MutationRecord): void {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLAnchorElement) {
          this.handleNode(node);
        }
      });
    }
  }

  /**
   * 处理节点
   * @param node
   * @returns
   */
  private handleNode(node: HTMLAnchorElement): void {
    for (const provider of this.providers) {
      if (this.isMatchProvider(node, provider)) {
        provider.resolve(node);
        break;
      }
    }
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
    for (const provider of this.providers) {
      if (provider.onInit) {
        await provider.onInit();
      }
    }
  }

  /**
   * 注册服务提供者
   * @param providerConfigs
   */
  public registerProvider(providerConfigs: IProviderConfig[]): this {
    for (const providerConfig of providerConfigs) {
      if (providerConfig.test === false) {
        continue;
      }
      if (providerConfig.test instanceof RegExp && !providerConfig.test.test(location.hostname)) {
        continue;
      }
      if (typeof providerConfig.test === "function" && providerConfig.test() === false) {
        continue;
      }
      const provider = new providerConfig.provider();
      this.providers.push(provider);
    }
    return this;
  }

  /**
   * 启动应用
   */
  public bootstrap() {
    addEventListener("DOMContentLoaded", this.pageOnReady.bind(this));
    this.mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }
}

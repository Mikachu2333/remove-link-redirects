import { IProvider } from "@/provider";
import { removeLinkRedirect, decreaseRedirect, getRedirect, increaseRedirect, retryAsyncOperation } from "@/utils";

export class BaiduProvider implements IProvider {
  public test = /www\.baidu\.com\/link\?url=/;
  public resolve(aElement: HTMLAnchorElement) {
    if (getRedirect(aElement) <= 2 && this.test.test(aElement.href)) {
      increaseRedirect(aElement);
      retryAsyncOperation(() => this.handlerOneElement(aElement), 3)
        .then((res) => {
          decreaseRedirect(aElement);
        })
        .catch((err) => {
          decreaseRedirect(aElement);
        });
    }
  }

  private async handlerOneElement(aElement: HTMLAnchorElement): Promise<unknown> {
    try {
      const res = await GM.xmlHttpRequest({
        method: "GET",
        url: aElement.href,
        anonymous: true,
      });
      if (res.finalUrl) {
        removeLinkRedirect(aElement, res.finalUrl);
      }
    } catch (err) {
      console.error(err);
      return Promise.reject(new Error(`[http]: ${aElement.href} fail`));
    }
  }
}

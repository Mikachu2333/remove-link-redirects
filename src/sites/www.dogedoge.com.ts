import { IProvider } from "@/provider";
import { antiRedirect, decreaseRedirect, getRedirect, increaseRedirect } from "@/utils";

export class DogeDogeProvider implements IProvider {
  public test = /www\.dogedoge\.com\/rd\/.{1,}/;
  public resolve(aElement: HTMLAnchorElement) {
    if (getRedirect(aElement) <= 2 && this.test.test(aElement.href)) {
      increaseRedirect(aElement);
      this.handlerOneElement(aElement)
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
        antiRedirect(aElement, res.finalUrl);
      }
    } catch (err) {
      console.error(err);
      return Promise.reject(new Error(`[http]: ${aElement.href} fail`));
    }
  }
}

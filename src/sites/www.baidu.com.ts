import { IProvider } from "@/provider";
import { removeLinkRedirect, decreaseRedirect, getRedirect, increaseRedirect, retryAsyncOperation } from "@/utils";

export class BaiduProvider implements IProvider {
  public test = /www\.baidu\.com\/link\?url=/;

  private async handleOneElement(aElement: HTMLAnchorElement): Promise<void> {
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

  public async resolve(aElement: HTMLAnchorElement): Promise<void> {
    if (aElement.closest(".cos-row") !== null) {
      this.handleOneElement(aElement);
      return;
    }
    const cContainer = aElement.closest(".c-container");
    const outerHTML = cContainer.outerHTML;
    const urlDisplay = outerHTML.match(/"urlDisplay":"(.*?)"/);
    const mu = outerHTML.match(/mu="(.*?)"/);
    let url: string;
    if (urlDisplay?.[1] && urlDisplay[1] !== "null" && urlDisplay[1] !== "undefined") {
      url = urlDisplay[1];
    } else if (mu?.[1] && mu[1] !== "null" && mu[1] !== "undefined") {
      url = mu[1];
    } else {
      this.handleOneElement(aElement);
      return;
    }
    removeLinkRedirect(aElement, url);
  }
}

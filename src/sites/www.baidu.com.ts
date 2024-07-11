import { IProvider } from "@/provider";
import {
  removeLinkRedirect,
  retryAsyncOperation,
  monitorUrlChange,
} from "@/utils";

export class BaiduProvider implements IProvider {
  public test = /www\.baidu\.com\/link\?url=/;

  private unresolvable = ["nourl.ubs.baidu.com", "lightapp.baidu.com"];

  private handleOneElement(aElement: HTMLAnchorElement): void {
    retryAsyncOperation(async () => {
      const res = await GM.xmlHttpRequest({
        method: "GET",
        url: aElement.href,
        anonymous: true,
      });
      if (res.finalUrl) {
        removeLinkRedirect(aElement, res.finalUrl);
      }
    }, 3);
  }

  public async resolve(aElement: HTMLAnchorElement): Promise<void> {
    const url = aElement.closest(".cos-row")
      ? null
      : aElement.closest(".c-container")?.getAttribute("mu");

    if (
      url &&
      url !== "null" &&
      url !== "undefined" &&
      !this.unresolvable.some((u) => url.includes(u))
    ) {
      removeLinkRedirect(aElement, url);
    } else {
      this.handleOneElement(aElement);
    }
  }

  public async onInit(): Promise<this> {
    monitorUrlChange((href: string) => {
      const url = new URL(href);
      if (url.searchParams.has("wd")) {
        location.href = href;
      }
    });
    return;
  }
}

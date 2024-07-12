import { IProvider } from "@/provider";
import { removeLinkRedirect, monitorUrlChange } from "@/utils";

export class BaiduProvider implements IProvider {
  public test = /www\.baidu\.com\/link\?url=/;

  private unresolvable = ["nourl.ubs.baidu.com", "lightapp.baidu.com"];

  private processedUrls = new Map<string, string | null>();

  private async handleOneElement(aElement: HTMLAnchorElement): Promise<void> {
    if (!this.processedUrls.has(aElement.href)) {
      this.processedUrls.set(aElement.href, null);
      const res = await GM.xmlHttpRequest({
        method: "GET",
        url: aElement.href,
        anonymous: true,
      });
      if (res.finalUrl) {
        this.processedUrls.set(aElement.href, res.finalUrl);
        removeLinkRedirect(aElement, res.finalUrl);
      }
    } else {
      removeLinkRedirect(aElement, this.processedUrls.get(aElement.href));
    }
  }

  public async resolve(aElement: HTMLAnchorElement): Promise<void> {
    const url = aElement.closest(".cos-row")
      ? null
      : aElement.closest(".c-container[mu]")?.getAttribute("mu");
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
    monitorUrlChange((href) => {
      const url = new URL(location.href);
      if (url.searchParams.has("wd")) {
        location.href = href;
      }
    });
    return this;
  }
}

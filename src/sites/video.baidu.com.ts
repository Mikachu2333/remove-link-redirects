import { IProvider } from "@/provider";
import { removeLinkRedirect } from "@/utils";

export class BaiduVideoProvider implements IProvider {
  public test = /v\.baidu\.com\/link\?url=/;
  public resolve(aElement: HTMLAnchorElement) {
    GM.xmlHttpRequest({
      method: "GET",
      url: aElement.href,
      anonymous: true,
      onload: (res) => {
        if (res.finalUrl) {
          removeLinkRedirect(aElement, res.finalUrl);
        }
      },
      onerror: (err) => {
        console.error(err);
      },
    });
  }
}

import { IProvider } from "@/provider";
import { removeLinkRedirect } from "@/utils";

export class BaiduXueshuProvider implements IProvider {
  public test = /xueshu\.baidu\.com\/s?\?(.*)/; // 此处无用
  public resolve(aElement: HTMLAnchorElement) {
    const realHref: string = aElement.getAttribute("data-link") || aElement.getAttribute("data-url");
    if (realHref) {
      removeLinkRedirect(aElement, decodeURIComponent(realHref));
    }
  }
}

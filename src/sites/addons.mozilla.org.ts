import { IProvider } from "@/provider";
import { removeLinkRedirect, matchLinkFromUrl } from "@/utils";

export class MozillaProvider implements IProvider {
  public test = /outgoing\.prod\.mozaws\.net\/v\d\/\w+\/(.*)/;
  public resolve(aElement: HTMLAnchorElement) {
    let url = aElement.href;
    const match = this.test.exec(aElement.href);
    if (match && match[1]) {
      try {
        url = decodeURIComponent(match[1]);
      } catch {
        url = /https?:\/\//.test(match[1]) ? match[1] : aElement.href;
      }
    }
    removeLinkRedirect(aElement, url);
  }
}

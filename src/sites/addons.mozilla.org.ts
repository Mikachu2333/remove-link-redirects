import { IProvider } from "@/provider";
import { removeLinkRedirect, matchLinkFromUrl } from "@/utils";

export class MozillaProvider implements IProvider {
  public test = /outgoing\.prod\.mozaws\.net\/v\d\/\w+\/(.*)/;
  public resolve(aElement: HTMLAnchorElement) {
    removeLinkRedirect(aElement, matchLinkFromUrl(aElement, this.test));
  }
}

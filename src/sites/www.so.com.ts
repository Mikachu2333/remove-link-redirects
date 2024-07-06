import { IProvider } from "@/provider";
import { removeLinkRedirect } from "@/utils";

export class SoProvider implements IProvider {
  public test = /so\.com\/link\?(.*)/;
  public resolve(aElement: HTMLAnchorElement) {
    const url = aElement.getAttribute("data-mdurl") || aElement.getAttribute("e-landurl");

    if (url) {
      removeLinkRedirect(aElement, url);
    }

    // remove track
    aElement.removeAttribute("e_href");
    aElement.removeAttribute("data-res");
  }
}

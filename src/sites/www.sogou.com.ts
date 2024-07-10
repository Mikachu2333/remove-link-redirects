import { IProvider } from "@/provider";
import { removeLinkRedirect } from "@/utils";

export class SoGouProvider implements IProvider {
  public test = /www\.sogou\.com\/link\?url=/;
  public resolve(aElement: HTMLAnchorElement) {
    const vrwrap = aElement.closest(".vrwrap");
    const rSech = vrwrap.querySelector(".r-sech");
    const url = rSech.getAttribute("data-url");
    removeLinkRedirect(aElement, url);
  }
}

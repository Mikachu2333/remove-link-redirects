import { IProvider } from "@/provider";
import { removeLinkRedirect } from "@/utils";

export class SoGouProvider implements IProvider {
  public test = /www\.sogou\.com\/link\?url=/;
  public resolve(aElement: HTMLAnchorElement) {
    // 从这个a往上找到的第一个class=vrwrap的元素
    const vrwrap = aElement.closest(".vrwrap");
    // 往子孙找到的第一个class包含r-sech的元素
    const rSech = vrwrap.querySelector(".r-sech");
    const url = rSech.getAttribute("data-url");
    removeLinkRedirect(aElement, url);
  }
}

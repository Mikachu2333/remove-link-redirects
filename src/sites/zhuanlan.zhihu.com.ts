import { IProvider } from "@/provider";
import { removeLinkRedirect } from "@/utils";

export class ZhihuZhuanlanProvider implements IProvider {
  public test = /link\.zhihu\.com\/\?target=(.*)/;
  public resolve(aElement: HTMLAnchorElement) {
    removeLinkRedirect(aElement, new URL(aElement.href).searchParams.get("target"));
  }
}

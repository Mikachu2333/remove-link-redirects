import { IProvider } from "@/provider";
import { removeLinkRedirect } from "@/utils";

export class ZhihuDailyProvider implements IProvider {
  public test = /zhihu\.com\/\?target=(.*)/;
  public resolve(aElement: HTMLAnchorElement) {
    removeLinkRedirect(
      aElement,
      new URL(aElement.href).searchParams.get("target")
    );
  }
}

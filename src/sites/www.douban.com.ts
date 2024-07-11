import { IProvider } from "@/provider";
import { removeLinkRedirect } from "@/utils";

export class DouBanProvider implements IProvider {
  public test = /douban\.com\/link2\/?\?url=(.*)/;
  public resolve(aElement: HTMLAnchorElement) {
    removeLinkRedirect(
      aElement,
      new URL(aElement.href).searchParams.get("url")
    );
  }
}

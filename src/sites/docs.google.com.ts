import { IProvider } from "@/provider";
import { removeLinkRedirect } from "@/utils";

export class GoogleDocsProvider implements IProvider {
  public test = /www\.google\.com\/url\?q=(.*)/;
  public resolve(aElement: HTMLAnchorElement) {
    removeLinkRedirect(aElement, new URL(aElement.href).searchParams.get("q"));
  }
}

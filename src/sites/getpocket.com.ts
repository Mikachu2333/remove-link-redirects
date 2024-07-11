import { IProvider } from "@/provider";
import { removeLinkRedirect } from "@/utils";

export class PocketProvider implements IProvider {
  public test = /getpocket\.com\/redirect\?url=(.*)/;
  public resolve(aElement: HTMLAnchorElement) {
    removeLinkRedirect(
      aElement,
      new URL(aElement.href).searchParams.get("url")
    );
  }
}

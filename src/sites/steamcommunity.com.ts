import { IProvider } from "@/provider";
import { removeLinkRedirect } from "@/utils";

export class SteamProvider implements IProvider {
  public test = /steamcommunity\.com\/linkfilter\/\?url=(.*)/;
  public resolve(aElement: HTMLAnchorElement) {
    removeLinkRedirect(aElement, new URL(aElement.href).searchParams.get("url"));
  }
}

import { IProvider } from "@/provider";
import { removeLinkRedirect } from "@/utils";

export class OSChinaProvider implements IProvider {
  public test = /oschina\.net\/action\/GoToLink\?url=(.*)/;
  public resolve(aElement: HTMLAnchorElement) {
    removeLinkRedirect(aElement, new URL(aElement.href).searchParams.get("url"));
  }
}

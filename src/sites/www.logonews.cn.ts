import { IProvider } from "@/provider";
import { removeLinkRedirect } from "@/utils";

export class LogonewsProvider implements IProvider {
  public test = /link\.logonews\.cn\/\?url=(.*)/;
  public resolve(aElement: HTMLAnchorElement) {
    removeLinkRedirect(
      aElement,
      new URL(aElement.href).searchParams.get("url")
    );
  }
}

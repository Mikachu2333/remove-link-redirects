import { IProvider } from "@/provider";
import { removeLinkRedirect } from "@/utils";

export class RuyoProvider implements IProvider {
  public test = /\/[^\?]*\?u=(.*)/;
  public resolve(aElement: HTMLAnchorElement) {
    removeLinkRedirect(aElement, new URL(aElement.href).searchParams.get("u"));
  }
}

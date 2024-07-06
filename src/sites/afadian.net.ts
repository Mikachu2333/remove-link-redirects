import { IProvider } from "@/provider";
import { removeLinkRedirect } from "@/utils";

export class AfDianNetProvider implements IProvider {
  public test = /afdian\.net\/link\?target=(.*)/;
  public resolve(aElement: HTMLAnchorElement) {
    removeLinkRedirect(aElement, new URL(aElement.href).searchParams.get("target"));
  }
}

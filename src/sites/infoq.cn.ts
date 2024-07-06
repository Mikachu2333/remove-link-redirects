import { IProvider } from "@/provider";
import { removeLinkRedirect } from "@/utils";

export class InfoQProvider implements IProvider {
  public test = /infoq\.cn\/link\?target=(.*)/;
  public resolve(aElement: HTMLAnchorElement) {
    removeLinkRedirect(aElement, new URL(aElement.href).searchParams.get("target"));
  }
}

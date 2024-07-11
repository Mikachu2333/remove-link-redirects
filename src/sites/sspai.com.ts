import { IProvider } from "@/provider";
import { removeLinkRedirect } from "@/utils";

export class SSPaiProvider implements IProvider {
  public test = /sspai\.com\/link\?target=(.*)/;
  public resolve(aElement: HTMLAnchorElement) {
    removeLinkRedirect(
      aElement,
      new URL(aElement.href).searchParams.get("target")
    );
  }
}

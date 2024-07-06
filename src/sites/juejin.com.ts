import { IProvider } from "@/provider";
import { removeLinkRedirect } from "@/utils";

export class JuejinProvider implements IProvider {
  public test = /link\.juejin\.(im|cn)\/\?target=(.*)/;
  public resolve(aElement: HTMLAnchorElement) {
    const finalURL = new URL(aElement.href).searchParams.get("target");
    removeLinkRedirect(aElement, finalURL);

    if (this.test.test(aElement.title)) {
      aElement.title = finalURL;
    }
  }
}

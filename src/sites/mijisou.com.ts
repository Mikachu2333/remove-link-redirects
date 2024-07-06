import { IProvider } from "@/provider";
import { removeLinkRedirect } from "@/utils";

export class MiJiProvider implements IProvider {
  public test = /mijisou\.com\/url_proxy\?proxyurl=(.*)/;
  public resolve(aElement: HTMLAnchorElement) {
    removeLinkRedirect(aElement, new URL(aElement.href).searchParams.get("proxyurl"));
  }
}

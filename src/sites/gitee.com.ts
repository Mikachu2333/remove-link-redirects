import { IProvider } from "@/provider";
import { removeLinkRedirect } from "@/utils";

export class GiteeProvider implements IProvider {
  public test = /gitee\.com\/link\?target=(.*)/;
  public resolve(aElement: HTMLAnchorElement) {
    removeLinkRedirect(aElement, new URL(aElement.href).searchParams.get("target"));
  }
}

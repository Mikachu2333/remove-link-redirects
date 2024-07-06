import { IProvider } from "@/provider";
import { removeLinkRedirect } from "@/utils";

export class YoutubeProvider implements IProvider {
  public test = /www\.youtube\.com\/redirect\?.{1,}/;
  public resolve(aElement: HTMLAnchorElement) {
    removeLinkRedirect(aElement, new URL(aElement.href).searchParams.get("q"));
  }
}

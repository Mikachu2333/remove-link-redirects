import { IProvider } from "@/provider";
import { antiRedirect } from "@/utils";

export class BingProvider implements IProvider {
  public test = /.+\.bing\.com\/ck\/a\?.*&u=a1(.*)&ntb=1/;
  public textDecoder = new TextDecoder();
  public resolve(aElement: HTMLAnchorElement) {
    antiRedirect(
      aElement,
      this.textDecoder.decode(
        Uint8Array.from(
          atob(
            aElement.href
              .split("&u=a1")[1]
              .split("&ntb=1")[0]
              .replace(/[-_]/g, (e) => ("-" === e ? "+" : "/"))
              .replace(/[^A-Za-z0-9\\+\\/]/g, "")
          )
            .split("")
            .map((e) => e.charCodeAt(0))
        )
      )
    );
  }
}
import { IProvider } from "@/provider";
import { removeLinkRedirect } from "@/utils";

export class TwitterProvider implements IProvider {
  public test = /t\.co\/\w+/;
  public resolve(aElement: HTMLAnchorElement) {
    if (!this.test.test(aElement.href)) {
      return;
    }

    if (/https?:\/\//.test(aElement.title)) {
      const url: string = decodeURIComponent(aElement.title);

      removeLinkRedirect(aElement, url);
      return;
    }

    const innerText = aElement.innerText.replace(/…$/, "");

    if (/https?:\/\//.test(innerText)) {
      removeLinkRedirect(aElement, innerText);
      return;
    }
  }
}

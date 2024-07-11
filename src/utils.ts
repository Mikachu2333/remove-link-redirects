export enum Marker {
  RedirectStatusDone = "redirect-status-done",
}

/**
 * 根据url上的路径匹配，去除重定向
 * @param {HTMLAnchorElement} aElement
 * @param {RegExp} tester
 * @returns {boolean}
 */
export function matchLinkFromUrl(
  aElement: HTMLAnchorElement,
  tester: RegExp
): string {
  const match = tester.exec(aElement.href);
  if (!match || !match[1]) return "";

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return /https?:\/\//.test(match[1]) ? match[1] : "";
  }
}

/**
 * 重试异步操作
 * @param {() => Promise<any>} operation
 * @param {number} maxRetries
 * @param {number} currentRetry
 */
export async function retryAsyncOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  currentRetry = 0
): Promise<T> {
  try {
    // 尝试执行操作
    return await operation();
  } catch (err) {
    if (currentRetry < maxRetries) {
      // 如果当前重试次数小于最大重试次数，等待一段时间后重试
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 等待1秒
      return retryAsyncOperation(operation, maxRetries, currentRetry + 1);
    }
    // 如果重试次数用尽，抛出错误
    throw err;
  }
}

interface IRemoveLinkRedirectOption {
  force?: boolean;
}

/**
 * 去除重定向
 * @param aElement A标签元素
 * @param realUrl 真实的地址
 * @param options
 */
export function removeLinkRedirect(
  aElement: HTMLAnchorElement,
  realUrl: string,
  options: IRemoveLinkRedirectOption = {}
) {
  if (options.force || (realUrl && aElement.href !== realUrl)) {
    aElement.setAttribute(Marker.RedirectStatusDone, "true");
    aElement.href = realUrl;
  }
}

/**
 * 监听URL变化
 */
export function monitorUrlChange(operation) {
  function urlChange(event) {
    const destinationUrl = event?.destination?.url || "";
    if (destinationUrl.startsWith("about:blank")) return;
    const href = destinationUrl || location.href;
    if (href !== location.href) {
      operation(href);
    }
  }
  // @ts-ignore
  unsafeWindow?.navigation?.addEventListener("navigate", urlChange);
  unsafeWindow.addEventListener("replaceState", urlChange);
  unsafeWindow.addEventListener("pushState", urlChange);
  unsafeWindow.addEventListener("popState", urlChange);
  unsafeWindow.addEventListener("hashchange", urlChange);
}

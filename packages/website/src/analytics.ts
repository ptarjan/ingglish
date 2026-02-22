declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function track(eventName: string, params?: Record<string, string | number>): void {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

export function trackPageView(path: string): void {
  track('page_view', { page_path: path });
}

function bucketLength(length: number): string {
  if (length <= 100) {
    return '1-100';
  }
  if (length <= 500) {
    return '101-500';
  }
  if (length <= 2000) {
    return '501-2000';
  }
  return '2001+';
}

export function trackTextTranslate(textLength: number, format: string): void {
  track('text_translate', { text_length: bucketLength(textLength), format });
}

export function trackUrlTranslate(url: string): void {
  try {
    const hostname = new URL(url).hostname;
    track('url_translate', { hostname });
  } catch {
    track('url_translate', { hostname: 'invalid' });
  }
}

export function trackShare(
  content: 'text' | 'url' | 'experiment',
  method: 'webshare' | 'clipboard'
): void {
  track('share', { content, method });
}

export function trackSpeak(): void {
  track('speak');
}

export function trackBookmarkletCopy(): void {
  track('bookmarklet_copy');
}

export function trackExperimentCustomize(): void {
  track('experiment_customize');
}

export function trackExperimentReset(): void {
  track('experiment_reset');
}

export function trackFormatSwitch(format: string): void {
  track('format_switch', { format });
}

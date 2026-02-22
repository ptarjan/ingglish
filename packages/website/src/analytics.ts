declare global {
  var gtag: ((...args: unknown[]) => void) | undefined;
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

export function trackPageView(path: string): void {
  track('page_view', { page_path: path });
}

export function trackShare(
  content: 'experiment' | 'text' | 'url',
  method: 'clipboard' | 'webshare'
): void {
  track('share', { content, method });
}

export function trackSpeak(): void {
  track('speak');
}

export function trackTextTranslate(textLength: number, format: string): void {
  track('text_translate', { format, text_length: bucketLength(textLength) });
}

export function trackUrlTranslate(url: string): void {
  try {
    const hostname = new URL(url).hostname;
    track('url_translate', { hostname });
  } catch {
    track('url_translate', { hostname: 'invalid' });
  }
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

function track(eventName: string, params?: Record<string, number | string>): void {
  if (typeof globalThis.gtag === 'function') {
    globalThis.gtag('event', eventName, params);
  }
}

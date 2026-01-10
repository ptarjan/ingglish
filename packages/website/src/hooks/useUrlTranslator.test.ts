/**
 * @vitest-environment jsdom
 *
 * Tests for URL translator link navigation handling.
 */
import { describe, it, expect } from 'vitest';
import { shouldSkipUrl } from '../utils/url';

describe('shouldSkipUrl for link navigation', () => {
  it('should skip hash-only links', () => {
    expect(shouldSkipUrl('#')).toBe(true);
    expect(shouldSkipUrl('#section')).toBe(true);
  });

  it('should skip javascript: links', () => {
    expect(shouldSkipUrl('javascript:void(0)')).toBe(true);
    expect(shouldSkipUrl('javascript:alert(1)')).toBe(true);
  });

  it('should skip mailto: links', () => {
    expect(shouldSkipUrl('mailto:test@example.com')).toBe(true);
  });

  it('should NOT skip regular http/https links', () => {
    expect(shouldSkipUrl('https://example.com')).toBe(false);
    expect(shouldSkipUrl('http://example.com')).toBe(false);
  });

  it('should NOT skip relative links', () => {
    expect(shouldSkipUrl('/page')).toBe(false);
    expect(shouldSkipUrl('page.html')).toBe(false);
    expect(shouldSkipUrl('../other')).toBe(false);
  });

  it('should NOT skip tel: links (allows phone dialing)', () => {
    expect(shouldSkipUrl('tel:+1234567890')).toBe(false);
  });
});

describe('link click handling basics', () => {
  it('closest("a") finds parent anchor from nested element', () => {
    const container = document.createElement('div');
    container.innerHTML = '<a href="/test"><span><strong>Nested</strong></span></a>';
    document.body.appendChild(container);

    const strong = container.querySelector('strong');
    const anchor = strong?.closest('a');

    expect(anchor).not.toBeNull();
    expect(anchor?.getAttribute('href')).toBe('/test');

    document.body.removeChild(container);
  });

  it('click event can be prevented', () => {
    const link = document.createElement('a');
    link.href = 'https://example.com';
    document.body.appendChild(link);

    let defaultPrevented = false;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      defaultPrevented = e.defaultPrevented;
    });

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(clickEvent);

    expect(defaultPrevented).toBe(true);

    document.body.removeChild(link);
  });

  it('document-level click handler can intercept link clicks', () => {
    const container = document.createElement('div');
    container.innerHTML = '<a href="/test">Link</a>';
    document.body.appendChild(container);

    let interceptedHref = '';
    document.addEventListener('click', (e) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (anchor) {
        e.preventDefault();
        interceptedHref = anchor.getAttribute('href') ?? '';
      }
    });

    const link = container.querySelector('a');
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    link?.dispatchEvent(clickEvent);

    expect(interceptedHref).toBe('/test');

    document.body.removeChild(container);
  });
});

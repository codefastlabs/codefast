import { urlCache } from './url-cache';

export function isDomainMatch(url: string, domain: string): boolean {
  const urlObject = urlCache.get(url);

  if (!urlObject) {
    return false;
  }

  return urlObject.hostname === domain || urlObject.hostname.endsWith(`.${domain}`);
}

export function isPathMatch(url: string, substring: string): boolean {
  const urlObject = urlCache.get(url);

  if (!urlObject) {
    return false;
  }

  return urlObject.pathname.includes(substring);
}

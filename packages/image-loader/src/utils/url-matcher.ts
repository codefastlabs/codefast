export function isDomainMatch(url: string, domain: string): boolean {
  try {
    const urlObject = new URL(url);

    return urlObject.hostname === domain || urlObject.hostname.endsWith(`.${domain}`);
  } catch {
    return false;
  }
}

export function isPathMatch(url: string, substring: string): boolean {
  try {
    const urlObject = new URL(url);

    return urlObject.pathname.includes(substring);
  } catch {
    return false;
  }
}


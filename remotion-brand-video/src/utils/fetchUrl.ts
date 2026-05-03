// Tries two public CORS proxies in order so one failing doesn't block the user.
const PROXIES: Array<(url: string) => string> = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return 'https://' + trimmed;
}

function injectBase(html: string, url: string): string {
  // Resolve all relative paths against the original origin
  const baseTag = `<base href="${url}">`;
  const match = html.match(/<head[^>]*>/i);
  if (match) return html.replace(match[0], `${match[0]}${baseTag}`);
  if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, (m) => m + baseTag);
  return baseTag + html;
}

function timedFetch(url: string, ms = 20_000): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(id));
}

export async function fetchUrlAsHtml(rawUrl: string): Promise<string> {
  const url = normalizeUrl(rawUrl);
  let lastMessage = '';

  for (const buildProxy of PROXIES) {
    try {
      const res = await timedFetch(buildProxy(url));
      if (!res.ok) { lastMessage = `HTTP ${res.status} from proxy`; continue; }

      const text = await res.text();
      if (!text.includes('<')) { lastMessage = 'Response does not look like HTML'; continue; }

      return injectBase(text, url);
    } catch (e) {
      lastMessage = (e as Error).message ?? String(e);
    }
  }

  // Surface a helpful error
  const blocked =
    lastMessage.toLowerCase().includes('failed to fetch') ||
    lastMessage.toLowerCase().includes('networkerror') ||
    lastMessage.toLowerCase().includes('abort');

  throw new Error(
    blocked
      ? 'Could not reach that URL — the site may block external requests. Try saving the page as HTML and uploading the file instead.'
      : `Could not load URL: ${lastMessage}`,
  );
}

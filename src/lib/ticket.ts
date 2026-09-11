import config from '../config/config';

export const TICKET_TTL_MS = 60_000;
export const REFRESH_MARGIN_MS = 15_000;

export type TicketResult = { ticket: string; wsUrl: string };

type CacheEntry = TicketResult & { fetchedAt: number };

let cache: CacheEntry | null = null;

export type TicketDeps = {
  fetch?: typeof fetch;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
};

export function clearTicketCache() {
  cache = null;
}

async function requestTicket(
  mode: 'text' | 'video' | 'any',
  doFetch: typeof fetch,
): Promise<TicketResult> {
  const res = await doFetch(`${config.serverHttp}/api/ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ mode }),
  });
  if (!res.ok) throw new Error('Failed to get ticket');
  const data = (await res.json()) as { ticket: string; wsUrl?: string };
  return {
    ticket: data.ticket,
    wsUrl: `${config.serverWs}/ws`,
  };
}

export async function fetchTicket(
  mode: 'text' | 'video' | 'any' = 'any',
  deps: TicketDeps = {},
): Promise<TicketResult> {
  const now = deps.now ?? Date.now;
  const doFetch = deps.fetch ?? fetch;
  const sleep = deps.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const t = now();
  if (cache && t - cache.fetchedAt < TICKET_TTL_MS - REFRESH_MARGIN_MS) {
    return { ticket: cache.ticket, wsUrl: cache.wsUrl };
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await requestTicket(mode, doFetch);
      cache = { ...result, fetchedAt: now() };
      return result;
    } catch (err) {
      lastError = err;
      if (attempt < 2) await sleep(200 * 2 ** attempt);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Failed to get ticket');
}

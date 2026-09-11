import { clearTicketCache, fetchTicket, TICKET_TTL_MS, REFRESH_MARGIN_MS } from '../src/lib/ticket';

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: async () => body,
  } as Response;
}

describe('fetchTicket', () => {
  afterEach(() => {
    clearTicketCache();
  });

  it('caches a fresh ticket', async () => {
    const doFetch = jest.fn().mockResolvedValue(jsonResponse({ ticket: 't1', wsUrl: 'ws://x/ws' }));
    const now = jest.fn().mockReturnValue(1_000_000);
    const first = await fetchTicket('text', { fetch: doFetch, now });
    const second = await fetchTicket('text', { fetch: doFetch, now });
    expect(first.ticket).toBe('t1');
    expect(second.ticket).toBe('t1');
    expect(doFetch).toHaveBeenCalledTimes(1);
  });

  it('refreshes near expiry', async () => {
    const doFetch = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ticket: 't1', wsUrl: 'ws://x/ws' }))
      .mockResolvedValueOnce(jsonResponse({ ticket: 't2', wsUrl: 'ws://x/ws' }));
    let t = 1_000_000;
    const now = () => t;
    await fetchTicket('text', { fetch: doFetch, now });
    t += TICKET_TTL_MS - REFRESH_MARGIN_MS + 1;
    const next = await fetchTicket('text', { fetch: doFetch, now });
    expect(next.ticket).toBe('t2');
    expect(doFetch).toHaveBeenCalledTimes(2);
  });

  it('retries with backoff', async () => {
    const doFetch = jest
      .fn()
      .mockRejectedValueOnce(new Error('net'))
      .mockRejectedValueOnce(new Error('net'))
      .mockResolvedValueOnce(jsonResponse({ ticket: 'ok', wsUrl: 'ws://x/ws' }));
    const sleep = jest.fn().mockResolvedValue(undefined);
    const result = await fetchTicket('any', { fetch: doFetch, sleep, now: () => 1 });
    expect(result.ticket).toBe('ok');
    expect(sleep).toHaveBeenNthCalledWith(1, 200);
    expect(sleep).toHaveBeenNthCalledWith(2, 400);
  });
});

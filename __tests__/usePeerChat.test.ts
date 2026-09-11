import { createCandidateBuffer } from '../src/lib/iceBuffer';
import { createConnectionGuard } from '../src/lib/connectionGuard';
import { effectsForError, P2P_FALLBACK_MS } from '../src/lib/protocol';
import { armP2pFallback } from '../src/lib/fallback';

describe('effectsForError', () => {
  it('clears searching on COOLDOWN', () => {
    expect(effectsForError('COOLDOWN')).toEqual({ searching: false });
  });
  it('clears matched on NOT_MATCHED', () => {
    expect(effectsForError('NOT_MATCHED')).toEqual({
      searching: false,
      matched: false,
      transport: 'none',
    });
  });
});

describe('createCandidateBuffer', () => {
  it('holds ICE until remote description is set, then flushes in order', async () => {
    const buf = createCandidateBuffer<string>();
    const flushed: string[] = [];
    const flush = async (c: string) => {
      flushed.push(c);
    };
    await buf.add('c1', flush);
    await buf.add('c2', flush);
    expect(buf.size).toBe(2);
    expect(flushed).toEqual([]);
    await buf.markRemoteReady(flush);
    expect(flushed).toEqual(['c1', 'c2']);
    await buf.add('c3', flush);
    expect(flushed).toEqual(['c1', 'c2', 'c3']);
  });
});

describe('createConnectionGuard', () => {
  it('connect twice yields one live socket', () => {
    const guard = createConnectionGuard();
    const closed: string[] = [];
    const first = { close: () => closed.push('first') };
    const second = { close: () => closed.push('second') };
    const g1 = guard.begin();
    expect(guard.attach(g1, first)).toBe(true);
    const g2 = guard.begin();
    expect(closed).toContain('first');
    expect(guard.attach(g1, first)).toBe(false);
    expect(guard.attach(g2, second)).toBe(true);
    expect(guard.socket).toBe(second);
  });
});

describe('usePeerChat fallback state machine', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('emits exactly one p2p-failed when the channel never opens', () => {
    jest.useFakeTimers();
    const send = jest.fn();
    let opened = false;
    const timer = armP2pFallback(() => send('p2p-failed'), () => opened);
    jest.advanceTimersByTime(P2P_FALLBACK_MS - 100);
    expect(send).not.toHaveBeenCalled();
    jest.advanceTimersByTime(200);
    expect(send).toHaveBeenCalledTimes(1);
    clearTimeout(timer);
  });

  it('does not fallback if the channel opens at 7.9s', () => {
    jest.useFakeTimers();
    const send = jest.fn();
    let opened = false;
    const timer = armP2pFallback(() => send('p2p-failed'), () => opened);
    jest.advanceTimersByTime(7900);
    opened = true;
    jest.advanceTimersByTime(200);
    expect(send).not.toHaveBeenCalled();
    clearTimeout(timer);
  });
});

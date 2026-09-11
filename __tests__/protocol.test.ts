import { isServerFrame, P2P_FALLBACK_MS } from '../src/lib/protocol';

describe('protocol guards', () => {
  it('accepts valid frames', () => {
    expect(isServerFrame({ t: 'ready', d: { socketId: 'x', online: 1 } })).toBe(true);
  });

  it('rejects unknown shapes', () => {
    expect(isServerFrame(null)).toBe(false);
    expect(isServerFrame({ d: {} })).toBe(false);
  });
});

describe('fallback constants', () => {
  it('uses an 8s P2P fallback', () => {
    expect(P2P_FALLBACK_MS).toBe(8000);
  });
});

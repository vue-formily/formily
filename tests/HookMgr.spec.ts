import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HookMgr } from '@/core/HookMgr';

describe('HookMgr', () => {
  let mgr: HookMgr;

  beforeEach(() => {
    mgr = new HookMgr();
  });

  it('should attach a single hook and trigger handler', () => {
    const handler = vi.fn();

    mgr.attach({
      name: 'user',
      scope: 'login',
      handlers: { done: handler }
    });

    mgr.emit('user.done:login', { value: 'ok' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should attach multiple hooks in an array', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();

    mgr.attach([
      { name: 'task', handlers: { start: h1 } },
      { name: 'task', handlers: { end: h2 } }
    ]);

    mgr.emit('task.start', {});
    mgr.emit('task.end', {});

    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it('should call roll and return payload.value', () => {
    const handler = (payload: any) => {
      payload.value = 'pong';
    };

    mgr.attach({
      name: 'ping',
      handlers: {
        default: handler
      }
    });

    const result = mgr.roll('ping.default');

    expect(result).toBe('pong');
  });

  it('should merge payload fields inside roll', () => {
    const handler = vi.fn((payload: any) => {
      payload.value = payload.params.id;
    });

    mgr.attach({
      name: 'find',
      handlers: {
        default: handler
      }
    });

    const result = mgr.roll('find.default', { params: { id: 123 } });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(result).toBe(123);
  });

  it('should detach a specific event name', () => {
    const handler1 = vi.fn();

    mgr.attach({
      name: 'delete',
      handlers: {
        default: handler1
      }
    });

    mgr.detach('delete.default');
    mgr.roll('delete.default', {});

    expect(handler1).not.toHaveBeenCalled();
  });

  it('should detach all handlers for an event if no handler provided', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const handler3 = vi.fn();

    mgr.attach([
      {
        name: 'save',
        handlers: {
          first: handler1,
          second: handler2
        }
      },
      {
        name: 'save',
        handlers: {
          first: handler3
        }
      }
    ]);

    mgr.detach('save.first');

    mgr.roll('save.first', {});
    mgr.roll('save.second', {});

    expect(handler1).not.toHaveBeenCalled();
    expect(handler3).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should detach only the provided handler', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const handler3 = vi.fn();

    mgr.attach([
      {
        name: 'update',
        handlers: {
          first: handler1,
          second: handler2
        }
      },
      {
        name: 'update',
        handlers: {
          first: handler3
        }
      }
    ]);

    mgr.detach('update.first', handler1);

    mgr.emit('update.first', {});
    mgr.emit('update.second', {});

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledTimes(1);
    expect(handler3).toHaveBeenCalledTimes(1);
  });

  it('should ignore detach for non-existing event', () => {
    expect(() => mgr.detach('nonexistent')).not.toThrow();
  });
});

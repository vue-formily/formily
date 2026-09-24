import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Echo } from '@/core/Echo';

describe('Echo', () => {
  let echo: Echo;

  beforeEach(() => {
    echo = new Echo();
  });

  it('should register and emit events', () => {
    const handler = vi.fn();
    echo.on('test', handler);

    echo.emit('test', 123);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(123);
  });

  it('should support multiple handlers for the same event', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    echo.on('updated', handler1);
    echo.on('updated', handler2);

    echo.emit('updated', 'abc');

    expect(handler1).toHaveBeenCalledWith('abc');
    expect(handler2).toHaveBeenCalledWith('abc');
  });

  it('should remove all handlers when calling off without handler', () => {
    const handler = vi.fn();

    echo.on('remove', handler);
    echo.off('remove');

    echo.emit('remove');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should remove only the specified handler', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    echo.on('delete', [handler1, handler2]);

    echo.off('delete', handler1);
    echo.emit('delete', 99);

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should trigger handler only once when using once()', () => {
    const handler = vi.fn();
    echo.once('ping', handler);

    echo.emit('ping');
    echo.emit('ping');

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should support event namespaces', () => {
    const handler = vi.fn();
    echo.on('save:form', handler);

    echo.emit('save:form', { id: 1 });
    expect(handler).toHaveBeenCalledWith({ id: 1 });

    // remove only this namespace
    echo.off('save:form');
    echo.emit('save:form', { id: 2 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should support removing handler with namespace', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    echo.on('load:first', handler1);
    echo.on('load:second', handler2);

    // detach only one namespace
    echo.off('load:first');

    echo.emit('load:first');
    echo.emit('load:second');

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should handle events with shared root name', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    echo.on('save:1', handler1);
    echo.on('save:2', handler2);

    // emit "save" should call both
    echo.emit('save', 'ok');

    expect(handler1).toHaveBeenCalledWith('ok');
    expect(handler2).toHaveBeenCalledWith('ok');
  });

  it('should generate unique uid', () => {
    const echo2 = new Echo();
    expect(echo.uid).not.toBe(echo2.uid);
  });
});

export function on<T = void>(emitter: any, event: string) {
  return new Promise<T>(resolve => emitter.on(event, resolve));
}

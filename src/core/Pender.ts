export default class Pender {
  penders = new Map();

  add(key: any) {
    this.penders.set(key, true);
  }

  kill(key: any) {
    this.penders.delete(key);
  }

  isPending(key?: any) {
    if (key) {
      return !!this.penders.get(key);
    }

    return !!this.penders.size;
  }
}

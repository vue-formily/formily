import { findIndex } from '@vue-formily/util';

import { Group } from './Group';
import { Collection } from './Collection';

export class CollectionElement extends Group {
  get index() {
    const { groups } = this.parent as any;

    return findIndex(groups, (group: any) => group.uid === this.uid);
  }

  get formId() {
    return `${(this.parent as unknown as Collection).formId}${this.index}`;
  }
}

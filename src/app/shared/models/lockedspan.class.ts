import Inline from 'quill/blots/inline';


export class LockedSpanBlot extends Inline {
  static override blotName = 'lockedSpan';
  static override tagName = 'span';

  static override create(value: any) {
    const node = super.create();
    if (value) {
      if (value.class) {
        node.setAttribute('class', value.class || 'highlight-user');
      }
      if (value.id) {
        node.setAttribute('id', value.id);
      }
    }
    node.setAttribute('contenteditable', 'false');
    return node;
  }

  static override formats(node: any) {
    return {
      class: node.getAttribute('class'),
      id: node.getAttribute('id'),
    };
  }

  override format(name: string, value: any) {
    if (name === 'lockedSpan') {
      if (this.domNode) {
        if (value && value.class) {
          this.domNode.setAttribute('class', value.class);
        } else {
          this.domNode.removeAttribute('class');
        }

        if (value.id) {
          this.domNode.setAttribute('id', value.id);
        } else {
          this.domNode.removeAttribute('id');
        }
      }
    } else {
      super.format(name, value);
    }
  }
}

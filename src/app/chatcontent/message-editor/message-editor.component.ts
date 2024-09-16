import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { QuillEditorComponent, QuillModule } from 'ngx-quill';
import Quill from 'quill';
import Inline from 'quill/blots/inline';
import { Channel } from '../../shared/models/channel.class';
import { User } from '../../shared/models/user.class';
import { UsersService } from '../../utils/services/user.service';
import { ChannelService } from '../../utils/services/channel.service';

class LockedSpanBlot extends Inline {
  static override blotName = 'lockedSpan';
  static override tagName = 'span';

  static override create(value: any) {
    const node = super.create();
    node.setAttribute('class', value.class || 'highlight-user');  // Klasse setzen
    node.setAttribute('contenteditable', 'false');  // Macht das Span nicht bearbeitbar
    return node;
  }

  static override formats(node: any) {
    return node.getAttribute('class');
  }

  override format(name: string, value: any) {
    if (name === 'lockedSpan') {
      if (value) {
        this.domNode.setAttribute('class', value); // Klasse setzen
      } else {
        this.domNode.removeAttribute('class'); // Klasse entfernen, wenn Wert leer ist
      }
    } else {
      super.format(name, value);
    }
  }
}

Quill.register(LockedSpanBlot);

@Component({
  selector: 'app-message-editor',
  standalone: true,
  imports: [QuillModule, CommonModule],
  templateUrl: './message-editor.component.html',
  styleUrl: './message-editor.component.scss'
})
export class MessageEditorComponent implements AfterViewInit {

  @ViewChild('editor', { static: true }) editor!: QuillEditorComponent;
  @ViewChild('toolbar', { static: true }) toolbar!: ElementRef;

  @Input() message = '';
  @Input() placeholder = '';

  @Output() enterPressed = new EventEmitter<string>();

  private userservice = inject(UsersService);
  private channelservice = inject(ChannelService);

  quill!: Quill
  showToolbar = false;

  showPicker = false;
  pickersign = '';
  pickerItems: User[] | Channel[] = [];
  searchString = '';
  currentPickerIndex = 0;
  pickerCount = 0;

  quillstyle = {
    minHeight: '3rem',
    maxHeight: '16rem',
    width: '100%',
    backgroundColor: 'white',
    color: 'black',
    fontFamily: 'Nunito',
    border: 'none',
  };

  isUser(item: User | Channel): item is User {
    return (item as User).name !== undefined;
  }

  ngAfterViewInit(): void {
    if (this.editor) {
      this.editor.onEditorCreated.subscribe((quill: any) => {
        console.log('Quill wurde erstellt.', quill);
        this.quill = this.editor!.quillEditor;
        if (this.quill) {
          const editorElement = this.quill.root;
          editorElement.addEventListener('focus', () => {
            this.showToolbar = true;
          });
          editorElement.addEventListener('blur', (event: FocusEvent) => {
            const target = event.relatedTarget as HTMLElement;
            if (!target || !this.toolbar.nativeElement.contains(target)) {
              this.showToolbar = false;
            }
          });
          this.quill.on('text-change', () => {
            if (this.pickersign) {
              this.searchString = this.getTextBeforePreviousSign(this.pickersign) || '';
              this.updatePickerItems();
            }
            console.log('suchtext:', this.searchString);
          });
          this.quill.keyboard.addBinding({ key: '@' }, () => {
            this.openUserPicker();
            return true;
          });
          this.quill.keyboard.addBinding({ key: '#' }, () => {
            this.openChannelPicker();
            return true;
          });
        }
        this.toolbar?.nativeElement.addEventListener('mouseenter', (event: MouseEvent) => {
          const clickedElement = event.target as HTMLElement;
          if (this.showToolbar && !this.editor.quillEditor.root.contains(clickedElement) && !this.toolbar.nativeElement.contains(clickedElement)) this.showToolbar = false;
        });
      });
    }
  }

  getTextBeforePreviousSign(char: string): string | null {
    // Hole die aktuelle Auswahl (Cursor-Position)
    const range = this.quill.getSelection();

    if (!range) {
      console.error('Keine Auswahl gefunden.');
      return null;
    }

    const cursorPosition = range.index;

    // Hole den gesamten Text im Editor
    const text = this.quill.getText();

    // Extrahiere den Text bis zur Cursorposition
    const textUpToCursor = text.substring(0, cursorPosition);

    // Suche nach dem letzten #
    const hashIndex = textUpToCursor.lastIndexOf(char);

    if (hashIndex === -1) {
      console.log('Kein vorheriges # gefunden.');
      return null;
    }

    // Extrahiere den Text vom letzten # bis zur Cursorposition
    const textBeforeHash = textUpToCursor.substring(hashIndex + 1);

    return textBeforeHash;
  }


  removeWordAndAtSymbol(): void {
    const range = this.quill.getSelection();
    if (!range) return;
    const text = this.quill.getText();
    let startIndex = range.index;
    let searchRange = text.substring(0, startIndex);
    const atIndex = searchRange.lastIndexOf('@');
    if (atIndex === -1) return;
    searchRange = searchRange.substring(atIndex + 1);
    const wordMatch = searchRange.match(/^\S+/);
    let wordStartIndex = atIndex;
    let wordEndIndex = wordStartIndex + 1;
    if (wordMatch) wordEndIndex += wordMatch[0].length;
    this.quill.deleteText(wordStartIndex, wordEndIndex - wordStartIndex);
    this.quill.setSelection(wordStartIndex, Quill.sources.SILENT);
    console.log(`word and @ removed. Cursor to ${wordStartIndex}.`);
  }

  debugInsertSpan() {
    const range = this.quill.getSelection();
    if (range) {
      this.quill.clipboard.dangerouslyPasteHTML(range.index, '<span class="highlight-user">@Béla</span>');
      // set the cursor to the end of the inserted span
      this.quill.setSelection(range.index + 1, Quill.sources.SILENT);
    }
  }

  highLightText(text: string) {
  }

  updatePickerItems() {
    if (this.pickersign === '@') {
      this.pickerItems = this.userservice.users.filter(user => !user.guest && (this.searchString === '' || user.name.toLowerCase().includes(this.searchString.toLowerCase())));
    } else if (this.pickersign === '#') {
      this.pickerItems = this.channelservice.channels.filter(channel => channel.name.toLowerCase().includes(this.searchString.toLowerCase()));
    }
  }

  openEmojiPicker() {
    console.log('Emoji Picker öffnen');
  }

  openChannelPicker() {
    this.showPicker = true;
    this.pickersign = '#';
  }

  openUserPicker() {
    this.showPicker = true;
    this.pickersign = '@';
  }

  closePicker() {
    this.showPicker = false;
    this.pickersign = '';
    this.pickerItems = [];
    this.searchString = '';
    this.currentPickerIndex = 0;
    this.pickerCount = 0;
  }

}

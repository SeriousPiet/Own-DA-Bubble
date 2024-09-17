import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { QuillEditorComponent, QuillModule } from 'ngx-quill';
import Quill from 'quill';
import Inline from 'quill/blots/inline';
import { Channel } from '../../shared/models/channel.class';
import { User } from '../../shared/models/user.class';
import { UsersService } from '../../utils/services/user.service';
import { ChannelService } from '../../utils/services/channel.service';
import { AvatarDirective } from '../../utils/directives/avatar.directive';

class LockedSpanBlot extends Inline {
  static override blotName = 'lockedSpan';
  static override tagName = 'span';

  static override create(value: any) {
    const node = super.create();
    if (value.class) node.setAttribute('class', value.class || 'highlight-user');  // Klasse setzen
    if (value.id) node.setAttribute('id', value.id);
    node.setAttribute('contenteditable', 'false');  // Macht das Span nicht bearbeitbar
    return node;
  }

  static override formats(node: any) {
    return {
      class: node.getAttribute('class'),
      id: node.getAttribute('id')
    };
  }

  override format(name: string, value: any) {
    if (name === 'lockedSpan') {
      if (value.class) this.domNode.setAttribute('class', value.class);
      if (value.id) this.domNode.setAttribute('id', value.id);
    } else {
      super.format(name, value);
    }
  }
}

// Quill.register(LockedSpanBlot);

@Component({
  selector: 'app-message-editor',
  standalone: true,
  imports: [QuillModule, CommonModule, AvatarDirective],
  templateUrl: './message-editor.component.html',
  styleUrl: './message-editor.component.scss'
})
export class MessageEditorComponent implements AfterViewInit {

  @ViewChild('editor', { static: true }) editor!: QuillEditorComponent;
  @ViewChild('toolbar', { static: true }) toolbar!: ElementRef;

  @Input() message = '';
  @Input() placeholder = '';

  @Output() enterPressed = new EventEmitter<string>();

  public userservice = inject(UsersService);
  private channelservice = inject(ChannelService);

  quill!: Quill;
  savedRange: any = null;
  showToolbar = false;

  showPicker = false;
  pickersign = '';
  pickerItems: User[] | Channel[] = [];
  lastItem: User | Channel | null = null;
  searchString = '';
  oldSearchString = '';
  currentPickerIndex = -1;

  quillstyle = {
    minHeight: '3rem',
    maxHeight: '16rem',
    width: '100%',
    backgroundColor: 'white',
    color: 'black',
    fontFamily: 'Nunito',
    border: 'none',
  };

  constructor(private _cdr: ChangeDetectorRef) { }

  isUser(item: User | Channel): item is User {
    return item instanceof User;
  }

  ngAfterViewInit(): void {
    if (this.editor) {
      this.editor.onEditorCreated.subscribe((quill: any) => {
        this.registerLockedSpanBlot();
        this.quill = this.editor!.quillEditor;
        if (this.quill) {
          const editorElement = this.quill.root;
          editorElement.addEventListener('focus', () => this.onFocused(editorElement));
          editorElement.addEventListener('blur', (event: FocusEvent) => this.onBlur(event));
          this.quill.on('text-change', (event) => this.onTextChange(event));
          this.quill.keyboard.addBinding({ key: '@' }, () => { this.openPicker('@'); return true; });
          this.quill.keyboard.addBinding({ key: '#' }, () => { this.openPicker('#'); return true; });
          this.quill.keyboard.addBinding({ key: 'ArrowDown' }, () => { return this.handlePickerSelection('ArrowDown'); });
          this.quill.keyboard.addBinding({ key: 'ArrowUp' }, () => { return this.handlePickerSelection('ArrowUp'); });
          this.quill.keyboard.addBinding({ key: 'Escape' }, () => { return this.handlePickerSelection('Escape'); });
          this.quill.root.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Enter' && this.showPicker) {
              this.handlePickerSelection('Enter');
              event.preventDefault();
              event.stopPropagation();
              console.log('xEnter gedrückt......');
              return false;
            }
            return true;
          });
        }
        this.toolbar?.nativeElement.addEventListener('mouseenter', (event: MouseEvent) => this.onToolbarClick(event));
      });
    }
  }


  registerLockedSpanBlot() {
    const existingBlot = Quill.imports['formats/lockedSpan'];
    if (!existingBlot) Quill.register(LockedSpanBlot);
  }


  handlePickerSelection(key: string): boolean {
    if (!this.showPicker) return true;
    if (key === 'ArrowUp') {
      this.setCurrentPicker((this.currentPickerIndex - 1 + this.pickerItems.length) % this.pickerItems.length);
      return false;
    } else if (key === 'ArrowDown') {
      this.setCurrentPicker((this.currentPickerIndex + 1) % this.pickerItems.length);
      return false;
    } else if (key === 'Enter') {
      if (this.lastItem) this.clickPickerItem(this.lastItem);
      this.enterPressed.emit(this.quill.getText());
      return false;
    } else if (key === 'Escape') {
      this.closePicker();
      return false;
    }
    this._cdr.detectChanges();
    return true;
  }


  onToolbarClick(event: MouseEvent) {
    const clickedElement = event.target as HTMLElement;
    if (this.showToolbar && !this.editor.quillEditor.root.contains(clickedElement) && !this.toolbar.nativeElement.contains(clickedElement)) this.showToolbar = false;
  }


  onFocused(event: any) {
    this.showToolbar = true;
    this.savedRange = null;
  }


  onBlur(event: FocusEvent) {
    this.savedRange = this.quill.getSelection();
    const target = event.relatedTarget as HTMLElement;
    if (!target || !this.toolbar.nativeElement.contains(target)) {
      this.showToolbar = false;
    }
  }


  onTextChange(event: any) {
    if (this.pickersign) {
      const newSearchString = this.getTextBeforePreviousSign(this.pickersign);
      this.searchString = newSearchString ? newSearchString : '';
      if (this.searchString.endsWith(' ')) this.closePicker();
      else if (this.searchString === '' || this.oldSearchString !== this.searchString) {
        this.oldSearchString = this.searchString;
        this.updatePickerItems();
      }
    }
  }

  getTextBeforePreviousSign(char: string): string | null {
    const range = this.getLastOrCurrentSelection();
    if (!range) return null;
    const cursorPosition = range.index;
    const textBeforeCursor = this.quill.getText(0, cursorPosition + 1);
    const lastCharIndex = Math.max(
      textBeforeCursor.lastIndexOf(char),
      textBeforeCursor.lastIndexOf('\n'),
      textBeforeCursor.lastIndexOf('\r'),
      textBeforeCursor.lastIndexOf('\t'),
      textBeforeCursor.lastIndexOf(' ')
    );
    if (lastCharIndex === -1) return null;
    return textBeforeCursor.slice(lastCharIndex + 1, cursorPosition);
  }


  removeWordAndSymbol(searchSign: string): number {
    const range = this.getLastOrCurrentSelection();
    if (!range) return -1;
    const text = this.quill.getText();
    let startIndex = range.index;
    let searchRange = text.substring(0, startIndex);
    const atIndex = searchRange.lastIndexOf(searchSign);
    if (atIndex === -1) return -1;
    searchRange = searchRange.substring(atIndex + 1);
    if (searchRange.includes(' ')) return -1;
    const wordMatch = searchRange.match(/^\S+/);
    let wordStartIndex = atIndex;
    let wordEndIndex = wordStartIndex + 1;
    if (wordMatch) wordEndIndex += wordMatch[0].length;
    this.quill.deleteText(wordStartIndex, wordEndIndex - wordStartIndex);
    this.quill.setSelection(wordStartIndex, Quill.sources.SILENT);
    return wordStartIndex;
  }


  clickPickerItem(item: User | Channel) {
    if (this.isUser(item)) {
      this.insertUserAsSpan(item);
    } else {
      this.insertChannelAsSpan(item);
    }
    this.closePicker();
  }


  getLastOrCurrentSelection() {
    if (this.quill.hasFocus()) return this.quill.getSelection();
    if (this.savedRange) return this.savedRange;
    return null;
  }


  insertUserAsSpan(user: User) {
    const cursorPosition = this.removeWordAndSymbol('@');
    if (cursorPosition === -1) return;
    this.quill.disable();
    this.quill.insertText(cursorPosition, '||');
    const insertString = `<span class="highlight-user" id="${user.id}" contenteditable="false">@${user.name}</span>`;
    this.quill.clipboard.dangerouslyPasteHTML(cursorPosition + 1, insertString);
    this.quill.enable();
    this.quill.setSelection(cursorPosition + user.name.length + 1, Quill.sources.SILENT);
    this.quill.focus();
    this._cdr.detectChanges();
  }


  insertChannelAsSpan(channel: Channel) {
    const cursorPosition = this.removeWordAndSymbol('#');
    if (cursorPosition === -1) return;
    this.quill.insertText(cursorPosition, '#' + channel.name + ' ');
    this.quill.formatText(cursorPosition, cursorPosition + channel.name.length + 1, 'lockedSpan', {
      class: 'highlight-channel',
      id: channel.id
    });
    this.quill.setSelection(cursorPosition + channel.name.length + 2, Quill.sources.SILENT);
    this._cdr.detectChanges();
  }


  highLightText(text: string) {
  }


  setCurrentPicker(index: number) {
    if (this.currentPickerIndex === -1) this.lastItem = null;
    else this.lastItem = this.pickerItems[this.currentPickerIndex];
    this.currentPickerIndex = index;
  }


  updatePickerItems() {
    if (this.pickersign === '@') {
      this.pickerItems = this.userservice.users.filter(user => !user.guest && (this.searchString === '' || user.name.toLowerCase().includes(this.searchString.toLowerCase())));
      this._cdr.detectChanges();
      this.setCurrentPicker(-1);
    } else if (this.pickersign === '#') {
      this.pickerItems = this.channelservice.channels.filter(channel => !channel.defaultChannel && channel.name.toLowerCase().includes(this.searchString.toLowerCase()));
      this._cdr.detectChanges();
      this.setCurrentPicker(-1);
    }
  }


  openEmojiPicker() {
    console.log('Emoji Picker öffnen');
  }


  openPicker(pickerSign: string) {
    if (this.showPicker) this.closePicker();
    this.showPicker = true;
    this.pickersign = pickerSign;
    this._cdr.detectChanges();
  }


  closePicker() {
    this.showPicker = false;
    this.pickersign = '';
    this.pickerItems = [];
    this.setCurrentPicker(-1);
    this.searchString = '';
    this.oldSearchString = '';
    this._cdr.detectChanges();
  }

}

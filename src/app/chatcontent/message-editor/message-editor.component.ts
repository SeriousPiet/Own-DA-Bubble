import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { QuillEditorComponent, QuillModule } from 'ngx-quill';
import Quill from 'quill';
import Inline from 'quill/blots/inline';
import { Range as QuillRange } from 'quill/core/selection';
import { Channel } from '../../shared/models/channel.class';
import { User } from '../../shared/models/user.class';
import { UsersService } from '../../utils/services/user.service';
import { ChannelService } from '../../utils/services/channel.service';
import { AvatarDirective } from '../../utils/directives/avatar.directive';
import { FormsModule } from '@angular/forms';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';

class LockedSpanBlot extends Inline {
  static override blotName = 'lockedSpan';
  static override tagName = 'span';

  static override create(value: any) {
    const node = super.create();
    if (value.class) node.setAttribute('class', value.class || 'highlight-user');
    if (value.id) node.setAttribute('id', value.id);
    node.setAttribute('contenteditable', 'false');
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


@Component({
  selector: 'app-message-editor',
  standalone: true,
  imports: [QuillModule, CommonModule, AvatarDirective, FormsModule, PickerComponent],
  templateUrl: './message-editor.component.html',
  styleUrl: './message-editor.component.scss'
})
export class MessageEditorComponent implements AfterViewInit {

  @ViewChild('editor', { static: true }) editor!: QuillEditorComponent;
  @ViewChild('toolbar', { static: true }) toolbar!: ElementRef;

  @Input() messageAsHTML = '';
  @Input() placeholder = 'Nachricht schreiben...';
  @Input() minHeight_rem = 4;
  @Input() maxHeight_rem = 16;

  @Output() enterPressed = new EventEmitter<string>(); // ToDO: Implement this event

  public userservice = inject(UsersService);
  private channelservice = inject(ChannelService);

  // Quill Editor variables and configuration
  public quill!: Quill;
  private savedRange: QuillRange | null = null;
  public showToolbar = false;
  private boundingKey = ' '; // sign bevor and after the span
  public quillstyle = {
    minHeight: this.minHeight_rem + 'rem',
    maxHeight: this.maxHeight_rem + 'rem',
    width: '100%',
    backgroundColor: 'white',
    color: 'black',
    fontFamily: 'Nunito',
    border: 'none',
  };

  // ListPicker for users and channels
  public showPicker = false;
  private pickersign = '';
  public pickerItems: User[] | Channel[] = [];
  private lastItem: User | Channel | null = null;
  public currentPickerIndex = -1;

  // Emoji Picker
  public showEmojiPicker = false;

  toogleEmojiePicker() {
    if (this.showEmojiPicker) this.closeEmojiPicker();
    else this.openEmojiPicker();
  }

  openEmojiPicker() {
    if (this.showPicker) this.closeListPicker();
    this.showEmojiPicker = true;
    this._cdr.detectChanges();
  }

  clickEmoji(event: any) {
    this.closeEmojiPicker();
    const position = this.getLastOrCurrentSelection();
    const emoji = `${event.emoji.native}`;
    const emojiLength = emoji.length;
    console.log('emoji clicked ' + emoji);
    this.quill.insertText(position ? position.index : 0, emoji);
    this.quill.setSelection(position ? position.index + emojiLength : emojiLength, Quill.sources.SILENT);
    this.quill.focus();
  }

  closeEmojiPicker() {
    this.showEmojiPicker = false;
    this._cdr.detectChanges();
  }

  constructor(private _cdr: ChangeDetectorRef) { }

  isUser(item: User | Channel): item is User {
    return item instanceof User;
  }

  openUserPicker() {
    this.openListPicker('@');
    this.updatePickerItems('');
  }

  getMessageAsHTML() {
    return this.quill.getSemanticHTML();
  }

  clearEditor() {
    this.quill.setText('');
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
          this.quill.keyboard.addBinding({ key: '@' }, () => { this.openListPicker('@'); return true; });
          this.quill.keyboard.addBinding({ key: '#' }, () => { this.openListPicker('#'); return true; });
          this.quill.keyboard.addBinding({ key: 'ArrowDown' }, () => { return this.handlePickerSelectionKeys('ArrowDown'); });
          this.quill.keyboard.addBinding({ key: 'ArrowUp' }, () => { return this.handlePickerSelectionKeys('ArrowUp'); });
          this.quill.keyboard.addBinding({ key: 'Escape' }, () => { return this.handlePickerSelectionKeys('Escape'); });
          this.quill.keyboard.addBinding({ key: 'ArrowRight' }, () => { return this.handlePickerSelectionKeys('Select'); });

        }
        this.toolbar?.nativeElement.addEventListener('mouseenter', (event: MouseEvent) => this.onToolbarClick(event));
      });
    }
  }


  registerLockedSpanBlot() {
    const existingBlot = Quill.imports['formats/lockedSpan'];
    if (!existingBlot) Quill.register(LockedSpanBlot);
  }


  handlePickerSelectionKeys(key: string): boolean {
    if (!this.showPicker) return true;
    if (key === 'ArrowUp') {
      this.setCurrentPickerIndex((this.currentPickerIndex - 1 + this.pickerItems.length) % this.pickerItems.length);
      return false;
    } else if (key === 'ArrowDown') {
      this.setCurrentPickerIndex((this.currentPickerIndex + 1) % this.pickerItems.length);
      return false;
    } else if (key === 'Select') {
      const currentItem = this.currentPickerIndex === -1 ? this.lastItem : this.pickerItems[this.currentPickerIndex];
      if (currentItem) this.clickPickerItem(currentItem);
      return true;
    } else if (key === 'Escape') {
      this.closeListPicker();
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
    if (this.showPicker) {
      const newSearchString = this.getTextBeforePreviousSign(this.pickersign);
      if (newSearchString === null) this.closeListPicker();
      else this.updatePickerItems(newSearchString);
    }
  }

  getTextBeforePreviousSign(char: string): string | null {
    const range = this.getLastOrCurrentSelection();
    if (!range) return null;
    const cursorPosition = range.index;
    const textBeforeCursor = this.quill.getText(0, cursorPosition + 1);
    const lastCharIndex = textBeforeCursor.lastIndexOf(char);
    if (lastCharIndex === -1) return null;
    const result = textBeforeCursor.slice(lastCharIndex + 1, cursorPosition);
    const regex = /^[a-zA-Z]*$/;
    if (!regex.test(result)) return null;
    return result;
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
    this.insertItemAsSpan(item);
    this.closeListPicker();
  }


  getLastOrCurrentSelection(): QuillRange | null {
    if (this.quill.hasFocus()) return this.quill.getSelection();
    if (this.savedRange) return this.savedRange;
    return null;
  }


  insertItemAsSpan(item: User | Channel) {
    const tagSign = item instanceof User ? '@' : '#';
    const tagClass = item instanceof User ? 'highlight-user' : 'highlight-channel';
    let cursorPosition = this.removeWordAndSymbol(tagSign);
    if (cursorPosition === -1) cursorPosition = this.quill.getLength();
    const spanText = tagSign + item.name;
    const spanTextLength = spanText.length;
    this.quill.insertText(cursorPosition, this.boundingKey + spanText + this.boundingKey);
    this.quill.formatText(cursorPosition + this.boundingKey.length, spanTextLength, 'lockedSpan', {
      class: tagClass,
      id: item.id
    });
    this.quill.setSelection(this.boundingKey.length * 2 + cursorPosition + spanTextLength, Quill.sources.SILENT);
    this.quill.focus();
    this._cdr.detectChanges();
  }


  setCurrentPickerIndex(index: number) {
    if (this.currentPickerIndex === -1) this.lastItem = null;
    else this.lastItem = this.pickerItems[this.currentPickerIndex];
    this.currentPickerIndex = index;
    this._cdr.detectChanges();
  }


  updatePickerItems(searchTerm: string) {
    if (this.pickersign === '@') {
      this.pickerItems = this.userservice.users.filter(user => !user.guest && (searchTerm === '' || user.name.toLowerCase().includes(searchTerm.toLowerCase())));
      this.setCurrentPickerIndex(-1);
    } else if (this.pickersign === '#') {
      this.pickerItems = this.channelservice.channels.filter(channel => !channel.defaultChannel && channel.name.toLowerCase().includes(searchTerm.toLowerCase()));
      this.setCurrentPickerIndex(-1);
    }
  }

  toggleListPicker() {
    if (this.showPicker) this.closeListPicker();
    else this.openUserPicker();
  }


  openListPicker(pickerSign: string) {
    if (this.showEmojiPicker) this.closeEmojiPicker();
    if (this.showPicker) this.closeListPicker();
    else this.showPicker = true;
    this.pickersign = pickerSign;
    this._cdr.detectChanges();
  }


  closeListPicker() {
    this.showPicker = false;
    this.pickersign = '';
    this.pickerItems = [];
    this.setCurrentPickerIndex(-1);
    this._cdr.detectChanges();
  }

}

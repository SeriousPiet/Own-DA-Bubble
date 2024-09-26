import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, Input, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { QuillEditorComponent, QuillModule } from 'ngx-quill';
import Quill from 'quill';
import { Range as QuillRange } from 'quill/core/selection';
import { Channel } from '../../shared/models/channel.class';
import { User } from '../../shared/models/user.class';
import { UsersService } from '../../utils/services/user.service';
import { ChannelService } from '../../utils/services/channel.service';
import { AvatarDirective } from '../../utils/directives/avatar.directive';
import { FormsModule } from '@angular/forms';
import { EmojipickerService } from '../../utils/services/emojipicker.service';
import { LockedSpanBlot } from '../../shared/models/lockedspan.class';


@Component({
  selector: 'app-message-editor',
  standalone: true,
  imports: [QuillModule, CommonModule, AvatarDirective, FormsModule],
  templateUrl: './message-editor.component.html',
  styleUrl: './message-editor.component.scss',
})
export class MessageEditorComponent implements AfterViewInit {
  @ViewChild('editor', { static: true }) editor!: QuillEditorComponent;
  @ViewChild('toolbar', { static: true }) toolbar!: ElementRef;
  @ViewChildren('pickeritem') pickerList!: QueryList<ElementRef>;

  @Input() messageAsHTML = '';
  @Input() placeholder = 'Nachricht schreiben...';
  @Input() minHeight_rem = 2;
  @Input() maxHeight_rem = 16;

  @Output() enterPressed = new EventEmitter<string>();
  @Output() escapePressed = new EventEmitter<string>();

  public userservice = inject(UsersService);
  private channelservice = inject(ChannelService);
  private emojiService = inject(EmojipickerService);

  // Quill Editor variables and configuration
  public quill!: Quill;
  public toolbarID ='editor-toolbar-' + Math.random().toString(36).substring(2, 9);
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
  public quillconfig = {
    toolbar: '#' + this.toolbarID,
    keyboard: {
      bindings: {
        shift_enter: {
          key: 13, shiftKey: true,
          handler: (range: { index: number }, ctx: any) => {
            this.quill.insertText(range.index, '\n');
          },
        },
        enter: {
          key: 13,
          handler: () => {
            if (this.showPicker) this.handlePickerSelectionKeys('Select');
            else this.enterPressed.emit(this.getMessageAsHTML());
          },
        },
      },
    },
  };

  // ListPicker for users and channels
  public showPicker = false;
  private pickersign = '';
  public pickerItems: User[] | Channel[] = [];
  private lastItem: User | Channel | null = null;
  public currentPickerIndex = -1;

  openEmojiPicker() {
    this.emojiService.showPicker(this.choosenEmoji.bind(this));
  }

  choosenEmoji(emoji: string) {
    const position = this.getLastOrCurrentSelection();
    const emojiLength = emoji.length;
    this.emojiService.addEmojiToUserEmojis(emoji);
    this.quill.insertText(position ? position.index : 0, emoji);
    this.quill.setSelection(
      position ? position.index + emojiLength : emojiLength,
      Quill.sources.SILENT
    );
    this.quill.focus();
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
    this.quill.history.clear();
  }

  ngAfterViewInit(): void {
    if (this.editor) {
      this.editor.onEditorCreated.subscribe((quill: any) => {
        this.registerLockedSpanBlot();
        this.quill = this.editor!.quillEditor;
        this.quill.on('editor-change', (eventName: string, ...args: any[]) => {
          if (eventName === 'text-change') {
            const [delta, oldDelta, source] = args;
            const hasImage = delta.ops.some(
              (op: any) => op.insert && op.insert.image
            );
            if (source === 'user' && hasImage) this.quill.history.undo();
          }
        });
        if (this.quill) {
          const editorElement = this.quill.root;
          editorElement.addEventListener('focus', () => this.onFocused(editorElement));
          editorElement.addEventListener('blur', (event: FocusEvent) => this.onBlur(event));
          this.quill.on('text-change', (event) => this.onTextChange(event));
          this.quill.keyboard.addBinding({ key: '@' }, () => { this.openListPicker('@'); return true; });
          this.quill.keyboard.addBinding({ key: '#' }, () => { this.openListPicker('#'); return true; });
          this.quill.keyboard.addBinding({ key: 'ArrowDown' }, () => { return this.handlePickerSelectionKeys('ArrowDown'); });
          this.quill.keyboard.addBinding({ key: 'ArrowUp' }, () => { return this.handlePickerSelectionKeys('ArrowUp'); });
          this.quill.keyboard.addBinding({ key: 'Escape' }, () => {
            if (!this.showPicker) {
              this.quill.blur();
              this.escapePressed.emit();
            }
            return this.handlePickerSelectionKeys('Escape');
          });
          this.quill.keyboard.bindings['Enter'] = [];
          this.quill.clipboard.dangerouslyPasteHTML(this.messageAsHTML);
          this.quill.focus();
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
    if (!target || !this.toolbar.nativeElement.contains(target)) this.showToolbar = false;
    this.closeListPicker();
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
    this.quill.formatText(cursorPosition + this.boundingKey.length, spanTextLength, 'lockedSpan', { class: tagClass, id: item.id, });
    this.quill.setSelection(this.boundingKey.length * 2 + cursorPosition + spanTextLength, Quill.sources.SILENT);
    this.quill.focus();
    this._cdr.detectChanges();
  }

  setCurrentPickerIndex(index: number) {
    if (this.currentPickerIndex === -1) this.lastItem = null;
    else this.lastItem = this.pickerItems[this.currentPickerIndex];
    this.currentPickerIndex = index;
    this.scrollToSelectedItem(index);
    this._cdr.detectChanges();
  }


  scrollToSelectedItem(index: number) {
    const selectedItem = this.pickerList.toArray()[index];
    if (selectedItem) selectedItem.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  updatePickerItems(searchTerm: string) {
    if (this.pickersign === '@') {
      this.pickerItems = this.userservice.users.filter((user) => !user.guest && (searchTerm === '' || user.name.toLowerCase().includes(searchTerm.toLowerCase())));
      this.setCurrentPickerIndex(-1);
    } else if (this.pickersign === '#') {
      this.pickerItems = this.channelservice.channels.filter((channel) => !channel.defaultChannel && channel.name.toLowerCase().includes(searchTerm.toLowerCase()));
      this.setCurrentPickerIndex(-1);
    }
  }

  openListPicker(pickerSign: string) {
    if (this.showPicker) this.closeListPicker();
    else this.showPicker = true;
    this.pickersign = pickerSign;
    this.updatePickerItems('');
    // this._cdr.detectChanges();
  }

  closeListPicker() {
    if (this.showPicker) {
      this.showPicker = false;
      this.pickersign = '';
      this.pickerItems = [];
      this.setCurrentPickerIndex(-1);
      this._cdr.detectChanges();
    }
  }
}

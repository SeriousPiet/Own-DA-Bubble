import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, Input, OnDestroy, Output, QueryList, ViewChild, ViewChildren, } from '@angular/core';
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
import { EditedTextLength, getTextBeforePreviousSign, insertItemAsSpan, isEmptyMessage, registerLockedSpanBlot } from '../../utils/quil/utility';
import { isRealUser } from '../../utils/firebase/utils';


@Component({
  selector: 'app-message-editor',
  standalone: true,
  imports: [QuillModule, CommonModule, AvatarDirective, FormsModule],
  templateUrl: './message-editor.component.html',
  styleUrl: './message-editor.component.scss',
})
export class MessageEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editor', { static: true }) editor!: QuillEditorComponent;
  @ViewChild('toolbar', { static: true }) toolbar!: ElementRef;
  @ViewChildren('pickeritem') pickerList!: QueryList<ElementRef>;

  @Input() messageAsHTML = '';
  @Input() placeholder = 'Schreib etwas...';
  @Input() minHeight_rem = 3.325;
  @Input() maxHeight_rem = 10;

  @Output() enterPressed = new EventEmitter<string>();
  @Output() escapePressed = new EventEmitter<string>();
  @Output() textLengthChanged = new EventEmitter<EditedTextLength>();

  public userservice = inject(UsersService);
  private channelservice = inject(ChannelService);
  private emojiService = inject(EmojipickerService);
  private resizeobserver!: ResizeObserver;

  // Quill Editor variables and configuration
  readonly maxMessageLength = 1000;
  public quill!: Quill;
  public toolbarID = 'editor-toolbar-' + Math.random().toString(36).substring(2, 9);
  public showToolBarElements: number[] = [];
  private savedRange: QuillRange | null = null;
  public showToolbar = false;
  public quillstyle = {
    minHeight: this.minHeight_rem + 'rem',
    maxHeight: this.maxHeight_rem + 'rem',
    width: '100%',
    color: 'black',
    fontFamily: 'Nunito',
    border: 'none',
  };
  public quillconfig = {
    toolbar: '#' + this.toolbarID,
    keyboard: {
      bindings: {
        shift_enter: {
          key: 13,
          shiftKey: true,
          handler: (range: { index: number }, ctx: any) => {
            this.quill.insertText(range.index, '\n');
            this.quill.scrollSelectionIntoView();
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

  constructor(private _cdr: ChangeDetectorRef) { }

  /**
   * Lifecycle hook that is called when the component is destroyed.
   * 
   * This method disconnects the resize observer if it exists to prevent memory leaks.
   */
  ngOnDestroy(): void {
    if (this.resizeobserver) this.resizeobserver.disconnect();
  }


  /**
   * Lifecycle hook that is called after a component's view has been fully initialized.
   *
   * This method subscribes to the `onEditorCreated` event of the editor, which is triggered
   * when the Quill editor instance is created. Once the editor is created, it performs the following actions:
   * - Registers a custom blot for locked spans.
   * - Assigns the Quill editor instance to a component property.
   * - Adds controllers for text changes, focus, and key events.
   * - Sets the initial HTML content of the editor.
   * - Focuses the editor.
   *
   * @memberof MessageEditorComponent
   */
  ngAfterViewInit(): void {
    if (this.editor) {
      this.editor.onEditorCreated.subscribe((quill: any) => {
        registerLockedSpanBlot();
        this.quill = this.editor!.quillEditor;
        this.addTextChangeController();
        this.addFocusController();
        this.addKeyController();
        this.quill.root.innerHTML = this.messageAsHTML;
        this.quill.focus();
      });
    }
    this.resizeobserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        this.handleToolBarResize(entry.contentRect.width);
      });
    });
    this.resizeobserver.observe(this.toolbar.nativeElement);
  }


  /**
   * Opens the emoji picker and inserts the selected emoji into the editor at the current cursor position.
   *
   * This method uses the `emojiService` to display the emoji picker. When an emoji is selected, it:
   * 1. Retrieves the current cursor position.
   * 2. Adds the selected emoji to the user's frequently used emojis.
   * 3. Inserts the emoji at the cursor position in the Quill editor.
   * 4. Updates the cursor position to be after the inserted emoji.
   * 5. Focuses the Quill editor.
   *
   * @remarks
   * The method ensures that the emoji is inserted silently without triggering any Quill events.
   */
  openEmojiPicker() {
    this.emojiService.showPicker((emoji: string) => {
      const position = this.getLastOrCurrentSelection();
      const emojiLength = emoji.length;
      this.emojiService.addEmojiToUserEmojis(emoji);
      this.quill.insertText(position ? position.index : 0, emoji);
      this.quill.setSelection(
        position ? position.index + emojiLength : emojiLength,
        Quill.sources.SILENT
      );
      this.quill.focus();
    });
  }


  /**
   * Determines if the given item is an instance of the User class.
   *
   * @param item - The item to check, which can be either a User or a Channel.
   * @returns A boolean indicating whether the item is a User.
   */
  isUser(item: User | Channel): item is User {
    return item instanceof User;
  }


  /**
   * Retrieves the current message content from the Quill editor as semantic HTML.
   *
   * @returns {string} The message content formatted as semantic HTML.
   */
  getMessageAsHTML() {
    return this.quill.root.innerHTML;
  }


  /**
   * Clears the text editor by setting its content to an empty string
   * and clearing the editor's history.
   */
  clearEditor() {
    this.quill.setText('');
    this.quill.history.clear();
  }


  private handleToolBarResize(width: number) {
    if (width < 300) this.showToolBarElements = [1, 3, 5];
    else if (width < 400) this.showToolBarElements = [1, 3, 4, 5];
    else this.showToolBarElements = [1, 2, 3, 4, 5];
  }


  /**
   * Adds event listeners to the Quill editor instance to handle text changes.
   *
   * - Listens for 'editor-change' events and checks if the change includes an image insertion.
   *   If an image is inserted by the user, it undoes the change.
   * - Listens for 'text-change' events to manage the state of a picker component.
   *   If the picker is shown, it updates the picker items based on the text before a specified sign.
   *
   * @remarks
   * This method assumes that `this.quill` is an instance of a Quill editor and that
   * `this.showPicker`, `this.pickersign`, `this.getTextBeforePreviousSign`, `this.closeListPicker`,
   * and `this.updatePickerItems` are defined in the component.
   */
  addTextChangeController() {
    this.quill.on('editor-change', (eventName: string, ...args: any[]) => {
      const [delta, oldDelta, source] = args;
      if (source === 'user' && eventName === 'text-change') {
        if (this.showPicker) {
          const newSearchString = getTextBeforePreviousSign(this.quill, this.getLastOrCurrentSelection(), this.pickersign);
          if (newSearchString === null) this.closeListPicker();
          else this.updatePickerItems(newSearchString);
        }
        const hasImage = delta.ops.some((op: any) => op.insert && op.insert.image);
        const messageLength = this.quill.getLength();
        if (source === 'user' && hasImage) this.quill.history.undo();
        else if (messageLength > this.maxMessageLength) this.quill.deleteText(this.maxMessageLength, messageLength - this.maxMessageLength);
        this.textLengthChanged.emit({ messageEmpty: isEmptyMessage(this.quill.root.innerHTML), maxLength: this.maxMessageLength, textLength: this.quill.getLength() });
        this._cdr.detectChanges();
      }
    });
  }


  /**
   * Adds focus and blur event listeners to the Quill editor element.
   *
   * When the editor gains focus, the toolbar is shown and the saved range is reset.
   * When the editor loses focus, the current selection range is saved, and the toolbar is hidden
   * if the blur event's related target is not within the toolbar. Additionally, the list picker is closed.
   *
   */
  addFocusController() {
    const editorElement = this.quill.root;
    editorElement.addEventListener('focus', () => {
      this.showToolbar = true;
      this.savedRange = null;
    });
    editorElement.addEventListener('blur', (event: FocusEvent) => {
      this.savedRange = this.quill.getSelection();
      const target = event.relatedTarget as HTMLElement;
      if (!target || !this.toolbar.nativeElement.contains(target))
        this.showToolbar = false;
      this.closeListPicker();
    });
  }


  /**
   * Adds custom key bindings to the Quill editor instance.
   *
   * This method binds specific keys to custom handlers:
   * - `@`: Opens the list picker with '@' as the trigger.
   * - `#`: Opens the list picker with '#' as the trigger.
   * - `ArrowDown`: Handles the 'ArrowDown' key for picker selection.
   * - `ArrowUp`: Handles the 'ArrowUp' key for picker selection.
   * - `Escape`: Handles the 'Escape' key to blur the editor and emit an escape event if the picker is not shown.
   *
   * Additionally, it clears any existing bindings for the 'Enter' key.
   */
  addKeyController() {
    this.quill.keyboard.addBinding({ key: '@' }, () => {
      this.openListPicker('@');
      return true;
    });
    this.quill.keyboard.addBinding({ key: '#' }, () => {
      this.openListPicker('#');
      return true;
    });
    this.quill.keyboard.addBinding({ key: 'ArrowDown' }, () => {
      return this.handlePickerSelectionKeys('ArrowDown');
    });
    this.quill.keyboard.addBinding({ key: 'ArrowUp' }, () => {
      return this.handlePickerSelectionKeys('ArrowUp');
    });
    this.quill.keyboard.addBinding({ key: 'Escape' }, () => {
      if (!this.showPicker) {
        this.quill.blur();
        this.escapePressed.emit();
      }
      return this.handlePickerSelectionKeys('Escape');
    });
    this.quill.keyboard.bindings['Enter'] = [];
  }


  /**
   * Handles key events for the picker selection.
   *
   * @param key - The key that was pressed.
   * @returns A boolean indicating whether the event should propagate.
   *
   * - If the picker is not shown, returns `true`.
   * - If the `ArrowUp` key is pressed, moves the selection up and returns `false`.
   * - If the `ArrowDown` key is pressed, moves the selection down and returns `false`.
   * - If the `Select` key is pressed, chooses the current picker item and returns `true`.
   * - If the `Escape` key is pressed, closes the picker and returns `false`.
   * - For other keys, triggers change detection and returns `true`.
   */
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
      if (currentItem) this.choosePickerItem(currentItem);
      return true;
    } else if (key === 'Escape') {
      this.closeListPicker();
      return false;
    }
    return true;
  }


  /**
   * Handles the selection of an item from the picker.
   * Depending on the type of the item (User or Channel), it inserts the item as a span
   * and then closes the list picker.
   *
   * @param item - The selected item from the picker, which can be either a User or a Channel.
   */
  choosePickerItem(item: User | Channel) {
    insertItemAsSpan(this.quill, this.getLastOrCurrentSelection(), item);
    this.closeListPicker();
  }


  /**
   * Retrieves the last or current selection range in the Quill editor.
   *
   * @returns {QuillRange | null} The current selection range if the editor has focus,
   *                              the saved selection range if available, or null if neither is present.
   */
  getLastOrCurrentSelection(): QuillRange | null {
    if (this.quill.hasFocus()) return this.quill.getSelection();
    return this.savedRange;
  }


  listKeysValid() {
    return this.quill && this.quill.hasFocus();
  }


  /**
   * Sets the current picker index and updates the UI accordingly.
   *
   * @param index - The new index to set as the current picker index.
   *
   * If the current picker index is -1, it resets the last item to null.
   * Otherwise, it updates the last item to the item at the current picker index.
   *
   * After setting the new index, it scrolls to the selected item and triggers change detection.
   */
  setCurrentPickerIndex(index: number) {
    if (index === -1) {
      this.lastItem = null;
      this.currentPickerIndex = -1;
    } else {
      this.lastItem = this.pickerItems[this.currentPickerIndex];
      this.currentPickerIndex = index;
      this.scrollToSelectedItem(index);
      this._cdr.detectChanges();
    }
  }


  /**
   * Scrolls the view to the selected item in the picker list.
   *
   * @param index - The index of the item to scroll to.
   */
  scrollToSelectedItem(index: number) {
    const selectedItem = this.pickerList.toArray()[index];
    if (selectedItem)
      selectedItem.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
  }


  /**
   * Updates the picker items based on the search term and the current picker sign.
   *
   * If the picker sign is '@', it filters the users from the user service to exclude guests
   * and includes users whose names match the search term (case insensitive).
   *
   * If the picker sign is '#', it filters the channels from the channel service to exclude
   * default channels and includes channels whose names match the search term (case insensitive).
   *
   * After filtering, it resets the current picker index to -1.
   *
   * @param searchTerm - The term to filter users or channels by.
   */
  updatePickerItems(searchTerm: string) {
    if (this.pickersign === '@') {
      this.pickerItems = this.userservice.users.filter((user) => isRealUser(user) && (searchTerm === '' || user.name.toLowerCase().includes(searchTerm.toLowerCase())));
      this.setCurrentPickerIndex(-1);
    } else if (this.pickersign === '#') {
      this.pickerItems = this.channelservice.channels.filter((channel) => !channel.defaultChannel && channel.name.toLowerCase().includes(searchTerm.toLowerCase()));
      this.setCurrentPickerIndex(-1);
    }
  }


  /**
   * Toggles the visibility of the list picker and updates the picker items.
   *
   * @param pickerSign - A string that indicates the type of picker to be displayed.
   */
  openListPicker(pickerSign: string) {
    if (this.showPicker) this.closeListPicker();
    else this.showPicker = true;
    this.pickersign = pickerSign;
    this.updatePickerItems('');
  }


  /**
   * Closes the list picker if it is currently shown.
   *
   * This method performs the following actions:
   * - Sets `showPicker` to `false` to hide the picker.
   * - Resets `pickersign` to an empty string.
   * - Clears the `pickerItems` array.
   * - Sets the current picker index to `-1`.
   */
  closeListPicker() {
    if (this.showPicker) {
      this.showPicker = false;
      this.pickersign = '';
      this.pickerItems = [];
      this.setCurrentPickerIndex(-1);
      this._cdr.detectChanges();
      this.quill.focus();
    }
  }
}

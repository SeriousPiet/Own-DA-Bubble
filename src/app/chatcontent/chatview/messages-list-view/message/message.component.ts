import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { serverTimestamp } from '@angular/fire/firestore';
import { NavigationService } from '../../../../utils/services/navigation.service';
import {
  IReactions,
  Message,
  StoredAttachment,
} from '../../../../shared/models/message.class';
import { MessageService } from '../../../../utils/services/message.service';
import { UsersService } from '../../../../utils/services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvatarDirective } from '../../../../utils/directives/avatar.directive';
import { User } from '../../../../shared/models/user.class';
import { MessageEditorComponent } from '../../../message-editor/message-editor.component';
import { ChannelService } from '../../../../utils/services/channel.service';
import { Channel } from '../../../../shared/models/channel.class';
import { EmojipickerService } from '../../../../utils/services/emojipicker.service';
import { EmojiModule } from '@ctrl/ngx-emoji-mart/ngx-emoji';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarDirective, MessageEditorComponent, EmojiModule],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss',
})
export class MessageComponent
  implements OnInit, AfterViewInit, AfterViewChecked {
  @ViewChild('messagediv', { static: false }) messageDiv!: ElementRef;
  @ViewChild('messageeditor', { static: false })
  messageEditor!: MessageEditorComponent;

  public userService = inject(UsersService);
  public navigationService = inject(NavigationService);
  public messageService = inject(MessageService);
  public channelService = inject(ChannelService);
  public emojiService = inject(EmojipickerService);

  public _messageData!: Message;

  @Input() set messageData(newMessage: Message) {
    this._messageData = newMessage;
    this.fillMessageContentHTML();
  }
  @Input() set messageWriter(messageWriterID: string) {
    this.checkMessageWriterID(messageWriterID);
  }
  @Input() id: string = '';
  @Input() messages: Message[] = [];

  @Input() messageEditorOpen = false;

  @Output() messageEditorOpenChange = new EventEmitter<boolean>();

  messagefromUser = false;
  messageCreator: User | undefined;
  isHovered = false;
  showEditMessagePopup = false;
  messageEditorModus = false;
  private needContentUpdate = false;

  ngOnInit(): void {
    this.sortMessages();
    this.getMessageCreatorObject();
  }

  constructor(private _cdr: ChangeDetectorRef) { }

  ngAfterViewChecked(): void {
    if (this.messageDiv && this.needContentUpdate) {
      this.needContentUpdate = false;
      this.fillMessageContentHTML();
    }
  }

  ngAfterViewInit(): void {
    this._messageData.changeMessage$.subscribe(() => {
      this.fillMessageContentHTML();
      this._cdr.detectChanges();
    });
  }


  isEmptyMessage(message: string) {
    return message === '<p><br></p>' || message === '<p></p>';
  }


  hasMessagetextContent() {
    return !this.isEmptyMessage(this._messageData.content);
  }


  isReactionSelf(reaction: IReactions) {
    return reaction.userIDs.includes(this.userService.currentUserID);
  }


  fillMessageContentHTML() {
    if (this.messageDiv) {
      this.messageDiv.nativeElement.innerHTML = this._messageData.content;
      this.calculateMessageSpans();
    }
  }

  downloadPDF(attachment: StoredAttachment) {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.target = '_blank'; // Open in a new tab
    link.click();
  }

  deleteAttachment(attachment: StoredAttachment) {
    this.messageService.deleteStoredAttachment(this._messageData, attachment);
  }

  calculateMessageSpans() {
    const spans = this.messageDiv.nativeElement.querySelectorAll('span');
    spans.forEach((span: HTMLSpanElement) => {
      if (span.classList.length > 0) {
        if (span.classList[0].endsWith('channel')) {
          // channel
          this.prepareChannelSpan(span);
        } else if (span.classList[0].endsWith('user')) {
          // user
          this.prepareUserSpan(span);
        }
      }
    });
  }

  prepareChannelSpan(span: HTMLSpanElement) {
    const spanChannel = this.getChannelOnlyWhenNotCurrent(span.id);
    if (spanChannel) {
      span.classList.add('highlight-item');
      span.classList.add('highlight-can-clicked');
      span.addEventListener('click', (event) => {
        event.stopPropagation();
        this.navigationService.setChatViewObject(spanChannel);
      });
    }
  }

  getChannelOnlyWhenNotCurrent(channelID: string): Channel | undefined {
    const channel = this.channelService.channels.find(
      (channel) => channel.id === channelID
    );
    if (channel && this.navigationService.chatViewObject !== channel)
      return channel;
    return undefined;
  }

  prepareUserSpan(span: HTMLSpanElement) {
    span.classList.add('highlight-item');
    span.classList.add('highlight-can-clicked');
    span.addEventListener('click', (event) => {
      event.stopPropagation();
      this.setSelectedUserObject(span.id);
      const popoverElement = document.getElementById(
        this.returnPopoverTarget(span.id)
      );
      if (popoverElement) (popoverElement as any).showPopover();
    });
  }

  updateMessage() {
    const editorContent = this.messageEditor.getMessageAsHTML();
    if (!this.isEmptyMessage(editorContent) && editorContent !== this._messageData.content) {
      this.messageService.updateMessage(this._messageData, {
        content: editorContent,
        edited: true,
        editedAt: serverTimestamp(),
      });
    }
    this.closeMessageEditor();
  }


  addReaction() {
    this.emojiService.showPicker((emoji: string) => {
      this.messageService.toggleReactionToMessage(this._messageData, emoji);
    });
  }


  closeMessageEditor() {
    this.toggleMessageEditor();
    this.needContentUpdate = true;
    this._cdr.detectChanges();
  }

  getMessageCreatorObject() {
    return this.userService.getUserByID(this._messageData.creatorID);
  }

  sortMessages() {
    if (this.messages.length > 0) {
      const previousMessageDetails = {
        creatorId: this.messages[0].creatorID,
        messageDate: new Date(this.messages[0].createdAt).toDateString(),
      };
      this.messages.forEach((message, index) => {
        this.identifyConsecutiveMessages(
          previousMessageDetails,
          message,
          index
        );
      });
    }
  }

  identifyConsecutiveMessages(
    previousMessageDetails: { creatorId: string; messageDate: string },
    message: Message,
    index: number
  ) {
    if (this.isFirstMessage(index)) {
      message.previousMessageFromSameUser = false;
    } else {
      const currentCreatorId = message.creatorID;
      const currentMessageDate = new Date(message.createdAt).toDateString();
      if (
        this.isSameCreatorAndDate(
          currentCreatorId,
          previousMessageDetails.creatorId,
          currentMessageDate,
          previousMessageDetails.messageDate
        )
      ) {
        message.previousMessageFromSameUser = true;
      } else {
        message.previousMessageFromSameUser = false;
      }
      previousMessageDetails.creatorId = currentCreatorId;
      previousMessageDetails.messageDate = currentMessageDate;
    }
  }

  isFirstMessage(index: number) {
    return index === 0;
  }

  isSameCreatorAndDate(
    currentCreatorId: string,
    previousCreatorId: string,
    currentMessageDate: string,
    previousMessageDate: string
  ) {
    return (
      currentCreatorId === previousCreatorId &&
      currentMessageDate === previousMessageDate
    );
  }

  getFormatedMessageTime(messageTime: Date | undefined) {
    let formatedMessageTime = messageTime?.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${formatedMessageTime} Uhr`;
  }

  checkMessageWriterID(messageWriterID: string) {
    if (messageWriterID == this.userService.currentUser?.id) {
      this.messagefromUser = true;
    }
  }

  toggleEditMessagePopup() {
    this.showEditMessagePopup = !this.showEditMessagePopup;
  }

  toggleMessageEditor() {
    this.toggleEditMessagePopup();
    this.messageEditorModus = !this.messageEditorModus;
    this.messageEditorOpenChange.emit(this.messageEditorModus);
  }

  returnPopoverTarget(messageCreator: string) {
    if (messageCreator === this.userService.currentUser?.id) {
      return 'profile-popover';
    } else {
      return 'popover-member-profile';
    }
  }

  showUserPopover(messageCreatorID: string) {
    this.setSelectedUserObject(messageCreatorID);
    const popoverElement = document.getElementById(
      this.returnPopoverTarget(messageCreatorID)
    );
    if (popoverElement) (popoverElement as any).showPopover();
  }

  setSelectedUserObject(messageCreatorID: string) {
    this.userService.updateSelectedUser(
      this.userService.getUserByID(messageCreatorID)
    );
  }

  @Output() openThreadView = new EventEmitter<void>();

  setThread(thread: Message) {
    if (thread.answerable) {
      this.navigationService.setThreadViewObject(thread);
      console.log('MessageComponent: --> openThreadView called');
      this.openThreadView.emit();
    }
  }
}

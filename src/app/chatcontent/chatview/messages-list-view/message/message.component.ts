import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, Input, OnInit, Output, ViewChild, } from '@angular/core';
import { serverTimestamp } from '@angular/fire/firestore';
import { NavigationService } from '../../../../utils/services/navigation.service';
import { IReactions, Message, StoredAttachment } from '../../../../shared/models/message.class';
import { MessageService } from '../../../../utils/services/message.service';
import { UsersService } from '../../../../utils/services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvatarDirective } from '../../../../utils/directives/avatar.directive';
import { User } from '../../../../shared/models/user.class';
import { EditedTextLength, MessageEditorComponent } from '../../../message-editor/message-editor.component';
import { ChannelService } from '../../../../utils/services/channel.service';
import { Channel } from '../../../../shared/models/channel.class';
import { EmojipickerService } from '../../../../utils/services/emojipicker.service';
import { EmojiModule } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import { isEmptyMessage } from '../../../../utils/quil/utility';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AvatarDirective,
    MessageEditorComponent,
    EmojiModule,
  ],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss',
})
export class MessageComponent implements OnInit, AfterViewInit, AfterViewChecked {

  @ViewChild('messagemaindiv', { static: false }) messageMainDiv!: ElementRef;
  @ViewChild('messagediv', { static: false }) messageDiv!: ElementRef;
  @ViewChild('messageeditor', { static: false }) messageEditor!: MessageEditorComponent;

  public userService = inject(UsersService);
  public navigationService = inject(NavigationService);
  public messageService = inject(MessageService);
  public channelService = inject(ChannelService);
  public emojiService = inject(EmojipickerService);
  private resizeobserver!: ResizeObserver;
  public showSmallButtons = false;
  public showBigButtons = false;

  public textLengthInfo: string = '0/0';
  public showTextLength: boolean = false;

  public _messageData!: Message;
  @Input() set messageData(newMessage: Message) {
    this._messageData = newMessage;
    this.messagefromUser = newMessage.creatorID === this.userService.currentUserID;
    this.fillMessageContentHTML();
  }

  @Input() isThreadView = false;
  @Input() messageEditorOpen = false;
  @Input() previousMessageFromSameUser = false;

  @Output() messageEditorOpenChange = new EventEmitter<boolean>();

  public messagefromUser = false;
  public messageCreator: User | undefined;
  public isHovered = false;
  public showEditMessagePopup = false;
  public messageEditorModus = false;
  private needContentUpdate = false;

  constructor(private _cdr: ChangeDetectorRef, private el: ElementRef) { }


  ngOnInit(): void {
    this.getMessageCreatorObject();
  }


  resizeToolBar(event: Event) {
    console.log('resizeToolBar', event);
  }


  handleEditorTextLengthChanged(event: EditedTextLength) {
    this.textLengthInfo = `${event.textLength}/${event.maxLength}`;
    this.showTextLength = event.textLength > event.maxLength * 0.8;
    this._cdr.detectChanges();
  }


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
    this.resizeobserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        this.showBigButtons = entry.contentRect.width > 700;
        this.showSmallButtons = !this.showBigButtons;
      });
    });
  }


  hasMessagetextContent() {
    return !isEmptyMessage(this._messageData.content);
  }


  isReactionSelf(reaction: IReactions) {
    return reaction.userIDs.includes(this.userService.currentUserID);
  }


  getReactionUsers(reaction: IReactions): string {
    const currentUserReacted = reaction.userIDs.includes(this.userService.currentUserID);
    const otherUsers = reaction.userIDs.filter((id) => id !== this.userService.currentUserID)
      .map((id) => this.userService.getUserByID(id)?.name || 'Unbekannter Nutzer');
    if (currentUserReacted) {
      if (otherUsers.length === 1) {
        return `Du und ${otherUsers[0]}`;
      } else if (otherUsers.length > 1) {
        const lastUser = otherUsers.pop();
        return `Du, ${otherUsers.join(', ')} und ${lastUser}`;
      }
      return 'Du';
    } else {
      if (otherUsers.length > 1) {
        const lastUser = otherUsers.pop();
        return `${otherUsers.join(', ')} und ${lastUser}`;
      }
      return otherUsers[0];
    }
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
        if (span.classList[0].endsWith('channel'))
          this.prepareChannelSpan(span);
        else if (span.classList[0].endsWith('user')) this.prepareUserSpan(span);
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
    if (
      !isEmptyMessage(editorContent) &&
      editorContent !== this._messageData.content
    ) {
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



  isFirstMessage(index: number) {
    return index === 0;
  }


  isSameCreatorAndDate(currentCreatorId: string, previousCreatorId: string, currentMessageDate: string, previousMessageDate: string) {
    return currentCreatorId === previousCreatorId && currentMessageDate === previousMessageDate;
  }


  getFormatedMessageTime(messageTime: Date | undefined) {
    let formatedMessageTime = messageTime?.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${formatedMessageTime} Uhr`;
  }


  getLastAnsweredMessagedDateOrTime(answerAt: Date) {
    const now = new Date(); const isToday = answerAt.toDateString() === now.toDateString();
    if (isToday) {
      return answerAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
    } else {
      return answerAt.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  }


  toggleEditMessagePopup() {
    this.showEditMessagePopup = !this.showEditMessagePopup;
  }


  toggleMessageEditor() {
    this.toggleEditMessagePopup();
    this.messageEditorModus = !this.messageEditorModus;
    this.messageEditorOpenChange.emit(this.messageEditorModus);
    if (this.messageEditorModus) {
      this.resizeobserver.observe(this.el.nativeElement);
      setTimeout(() => {
        if (this.messageMainDiv) {
          this.messageMainDiv.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    } else {
      this.resizeobserver.unobserve(this.el.nativeElement);
    }
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
    this.navigationService.setProfileTarget(true);
    if (popoverElement) (popoverElement as any).showPopover();
  }


  setSelectedUserObject(messageCreatorID: string) {
    this.userService.updateSelectedUser(
      this.userService.getUserByID(messageCreatorID)
    );
  }


  setThread(thread: Message) {
    if (thread.answerable) {
      this.navigationService.setThreadViewObject(thread);
    }
  }
}

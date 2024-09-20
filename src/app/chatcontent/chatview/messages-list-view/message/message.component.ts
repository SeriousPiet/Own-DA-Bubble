import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, inject, Input, OnInit, ViewChild } from '@angular/core';
import { serverTimestamp } from '@angular/fire/firestore';
import { NavigationService } from '../../../../utils/services/navigation.service';
import { Message, StoredAttachment } from '../../../../shared/models/message.class';
import { MessageService } from '../../../../utils/services/message.service';
import { UsersService } from '../../../../utils/services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvatarDirective } from '../../../../utils/directives/avatar.directive';
import { User } from '../../../../shared/models/user.class';
import { MessageEditorComponent } from '../../../message-editor/message-editor.component';
import { ChannelService } from '../../../../utils/services/channel.service';
import { Channel } from '../../../../shared/models/channel.class';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarDirective, MessageEditorComponent],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})
export class MessageComponent implements OnInit, AfterViewInit {

  @ViewChild('messagediv') messageDiv!: ElementRef;
  @ViewChild('messageeditor') messageEditor!: MessageEditorComponent;

  public userService = inject(UsersService);
  public navigationService = inject(NavigationService);
  public messageService = inject(MessageService);
  public channelService = inject(ChannelService);

  @Input() messageData: any;
  @Input() set messageWriter(messageWriterID: string) {
    this.checkMessageWriterID(messageWriterID);
  }
  @Input() messages: Message[] = [];

  messagefromUser = false;
  messageCreator: User | undefined;
  isHovered = false;
  hasReaction = false;
  showEditMessagePopup = false;

  messageEditorModus = false;
  messagePath = '';
  message = '';

  ngOnInit(): void {
    this.checkForMessageReactions();
    this.sortMessages();
    this.getMessageCreatorObject();
  }

  constructor(private cdr: ChangeDetectorRef) { }

  ngAfterViewInit(): void {
    this.messageData.changeMessage$.subscribe((message: Message) => {
      this.fillMessageContentHTML();
      this.cdr.detectChanges();
    });
  }


  fillMessageContentHTML() {
    this.messageDiv.nativeElement.innerHTML = this.messageData.content;
    this.calculateMessageSpans();
  }


  downloadPDF(attachment: StoredAttachment) {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = 'filename.pdf';
    link.target = '_blank'; // Open in a new tab
    link.click();
  }


  deleteAttachment(attachment: StoredAttachment) {
    this.messageService.deleteStoredAttachment(this.messageData, attachment);
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
    const channel = this.channelService.channels.find(channel => channel.id === channelID);
    if (channel && this.navigationService.chatViewObject !== channel) return channel;
    return undefined;
  }

  prepareUserSpan(span: HTMLSpanElement) {
    span.classList.add('highlight-item');
    span.classList.add('highlight-can-clicked');
    span.addEventListener('click', (event) => {
      event.stopPropagation();
      this.setSelectedUserObject(span.id);
      const popoverElement = document.getElementById(this.returnPopoverTarget(span.id));
      if (popoverElement) (popoverElement as any).showPopover();
    });
  }


  updateMessage() {
    const editorContent = this.messageEditor.getMessageAsHTML();
    if (editorContent !== '<br></br>' && editorContent !== this.messageData.content) {
      this.messageService.updateMessage(this.messageData, { content: editorContent, edited: true, editedAt: serverTimestamp() });
      this.toggleMessageEditor();
    }
  }


  cancelUpdateMessage() {
    this.toggleMessageEditor();
  }


  getMessageCreatorObject() {
    return this.userService.getUserByID(this.messageData.creatorID);
  }

  sortMessages() {
    if (this.messages.length > 0) {
      const previousMessageDetails = {
        creatorId: this.messages[0].creatorID,
        messageDate: new Date(this.messages[0].createdAt).toDateString()
      };
      this.messages.forEach((message, index) => {
        this.identifyConsecutiveMessages(previousMessageDetails, message, index);
      });
    }
  }

  identifyConsecutiveMessages(previousMessageDetails: { creatorId: string, messageDate: string }, message: Message, index: number) {
    if (this.isFirstMessage(index)) {
      message.previousMessageFromSameUser = false;
    } else {
      const currentCreatorId = message.creatorID;
      const currentMessageDate = new Date(message.createdAt).toDateString();
      if (this.isSameCreatorAndDate(currentCreatorId, previousMessageDetails.creatorId, currentMessageDate, previousMessageDetails.messageDate)) {
        message.previousMessageFromSameUser = true;
      } else {
        message.previousMessageFromSameUser = false;
      }
      previousMessageDetails.creatorId = currentCreatorId;
      previousMessageDetails.messageDate = currentMessageDate;
    }
  }

  isFirstMessage(index: number) {
    return index === 0
  }

  isSameCreatorAndDate(currentCreatorId: string, previousCreatorId: string, currentMessageDate: string, previousMessageDate: string) {
    return currentCreatorId === previousCreatorId && currentMessageDate === previousMessageDate
  }


  checkForMessageReactions() {
    if (this.messageData.emojies.length > 0) this.hasReaction = true;
    else this.hasReaction = false;
  }


  getFormatedMessageTime(messageTime: Date | undefined) {
    let formatedMessageTime = messageTime?.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
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
  }

  returnPopoverTarget(messageCreator: string) {
    if (messageCreator === this.userService.currentUser?.id) {
      return 'profile-popover'
    } else {
      return 'popover-member-profile'
    }
  }

  setSelectedUserObject(messageCreatorID: string) {
    this.userService.updateSelectedUser(this.userService.getUserByID(messageCreatorID));
  }


  setThread(thread: Message) {
    // console.log('current selected thread is:', thread);
    this.navigationService.setThreadViewObject(thread);
  }










}

import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { collection, Firestore, onSnapshot, serverTimestamp } from '@angular/fire/firestore';
import { NavigationService } from '../../../../utils/services/navigation.service';
import { Message } from '../../../../shared/models/message.class';
import { MessageService } from '../../../../utils/services/message.service';
import { UsersService } from '../../../../utils/services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvatarDirective } from '../../../../utils/directives/avatar.directive';
import { User } from '../../../../shared/models/user.class';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarDirective],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})
export class MessageComponent implements OnInit {

  public userService = inject(UsersService);
  public navigationService = inject(NavigationService);
  public messageService = inject(MessageService);

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
  updatedMessage: { content?: string, edited?: boolean, editedAt?: any } = {};

  messageEditorModus = false;
  messagePath = '';
  message = '';

  ngOnInit(): void {
    this.updatedMessage = {
      content: this.messageData.content,
      edited: this.messageData.edited,
      editedAt: this.messageData.editedAt
    };
    this.sortMessageReaction();
    this.sortMessagesByUser();
    this.getMessageCreatorObject();
  }

  constructor(private cdr: ChangeDetectorRef) {
  }

  getMessageCreatorObject() {
    return this.userService.getUserByID(this.messageData.creatorID);
  }

  // this function still need to be refactored

  sortMessagesByUser() {
    if (this.messages.length > 0) {
      let previousCreatorId = this.messages[0].creatorID;
      let previousMessageDate = new Date(this.messages[0].createdAt).toDateString();

      this.messages.forEach((message, index) => {
        if (index === 0) {
          // Die erste Nachricht hat immer `previousMessageFromSameUser` auf `false`
          message.previousMessageFromSameUser = false;
        } else {
          const currentCreatorId = message.creatorID;
          const currentMessageDate = new Date(message.createdAt).toDateString();

          // Überprüfen, ob der Ersteller und das Datum gleich sind
          if (currentCreatorId === previousCreatorId && currentMessageDate === previousMessageDate) {
            message.previousMessageFromSameUser = true;
          } else {
            message.previousMessageFromSameUser = false;
          }

          // Update previous message details
          previousCreatorId = currentCreatorId;
          previousMessageDate = currentMessageDate;
        }
      });

    }
  }

  sortMessageReaction() {
    if (this.messageData.emojies.length > 0) this.hasReaction = true;
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

  editMessage(message: Message, updatedData: { content?: string, edited?: boolean, editedAt?: any }) {
    if (updatedData.content) {
      this.messageService.updateMessage(message, updatedData);
      updatedData.edited ? this.updatedMessage.edited = true : this.updatedMessage.edited = false;
      updatedData.editedAt ? this.updatedMessage.editedAt = updatedData.editedAt : this.updatedMessage.editedAt = serverTimestamp();
      this.toggleMessageEditor();
    }
  }

  discardChanges(message: Message, updatedData: { content?: string, edited?: boolean, editedAt?: any }) {
    updatedData.edited ? this.updatedMessage.edited = true : this.updatedMessage.edited = false;
    updatedData.content = message.content;

    this.toggleMessageEditor();
  }


  returnPopoverTarget(messageCreator: string) {
    if (messageCreator === this.userService.currentUser?.id) {
      return 'profile-popover'
    } else {
      return 'popover-member-profile'
    }
  }

  setSelectedUserObject(messageCreatorID:string) {
    console.log(messageCreatorID)
    this.userService.updateSelectedUser(this.userService.getUserByID(messageCreatorID));
  }


  setThread(thread: Message) {
    console.log('current selected thread is:', thread)
    this.navigationService.setThreadViewObject(thread);
  }










}

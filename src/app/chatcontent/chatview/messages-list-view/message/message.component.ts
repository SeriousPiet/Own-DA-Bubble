import { ChangeDetectorRef, Component, inject, Input, OnInit } from '@angular/core';
import { collection, Firestore, onSnapshot, serverTimestamp } from '@angular/fire/firestore';
import { NavigationService } from '../../../../utils/services/navigation.service';
import { Message } from '../../../../shared/models/message.class';
import { MessageService } from '../../../../utils/services/message.service';
import { UsersService } from '../../../../utils/services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  isHovered = false;
  hasReaction = false;
  showEditMessagePopup = false;
  updatedMessage: { content?: string, edited?: boolean, editedAt?: any } = {};

  messageEditorModus = false;
  messagePath = '';
  message = '';

  ngOnInit(): void {
    console.log(this)
    this.updatedMessage = {
      content: this.messageData.content,
      edited: this.messageData.edited,
      editedAt: this.messageData.editedAt
    };
    this.sortMessageReaction();
    this.sortMessagesByUser();
  }

  constructor(private cdr: ChangeDetectorRef) {
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

        console.log(`Message index ${index}, previousMessageFromSameUser: ${message.previousMessageFromSameUser}`)

      });

      console.log(this.messages);
    }
  }



  // sortMessagesByUser() {
  //   if (this.messages.length > 0) {
  //     let previousCreatorId = this.messages[0].creatorID;
  //     let previousMessageDate = new Date(this.messages[0].createdAt).toDateString(); // Get the date string for comparison

  //     this.messages.forEach((message, index) => {
  //       if (index === 0) {
  //         // The first message should have previousMessageFromSameUser as false
  //         this.previousMessageFromSameUser = false;
  //       } else {
  //         const currentCreatorId = message.creatorID;
  //         const currentMessageDate = new Date(message.createdAt).toDateString(); // Convert current message date to date string

  //         if (currentCreatorId === previousCreatorId && currentMessageDate === previousMessageDate) {
  //           // Same user and same day
  //           this.previousMessageFromSameUser = true;
  //         } else {
  //           // Different user or different day
  //           this.previousMessageFromSameUser = false;
  //         }

  //         // Update previous variables for the next iteration
  //         previousCreatorId = currentCreatorId;
  //         previousMessageDate = currentMessageDate;
  //       }

  //       console.log(`Message index ${index}, previousMessageFromSameUser: ${this.previousMessageFromSameUser}`);
  //     });
  //   }
  // }


  // sortMessagesByUser() {

  //   let previousCreatorId = this.messages[0].creatorID;
  //   this.messages.forEach((message, index) => {
  //     if (index === 0) this.previousMessageFromSameUser = false;
  //     if (index > 0) {
  //       if (previousCreatorId === message.creatorID) {
  //         this.previousMessageFromSameUser = true;
  //       } else {
  //         this.previousMessageFromSameUser = false
  //       }
  //     }
  //     previousCreatorId = message.creatorID;
  //     console.log(this, index)
  //   })
  // }


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
    this.messageService.updateMessage(message, updatedData);
    updatedData.edited ? this.updatedMessage.edited = true : this.updatedMessage.edited = false;
    updatedData.editedAt ? this.updatedMessage.editedAt = updatedData.editedAt : this.updatedMessage.editedAt = serverTimestamp();
    this.toggleMessageEditor();
  }















}

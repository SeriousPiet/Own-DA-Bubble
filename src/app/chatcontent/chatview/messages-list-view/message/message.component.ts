import { ChangeDetectorRef, Component, inject, Input, OnInit } from '@angular/core';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
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

  messagefromUser = false;
  isHovered = false;
  hasRection = false;
  showEditMessagePopup = false;
  updatedMessage: { content?: string, emojies?: string[] } = {};

  messageEditorModus = false;
  messagePath = '';
  message = '';

  ngOnInit(): void {
    console.log(this.messageData)
    this.updatedMessage = {
      content: this.messageData.content,
      emojies: this.messageData.emojies || [],
    };
    this.sortMessageReaction();
  }

  constructor(private cdr: ChangeDetectorRef) {
  }


  sortMessageReaction() {
    if (this.messageData.emojies.length > 0) this.hasRection = true;
   
      

  }

  getFormatedMessageTime(messageTime: Date) {
    let formatedMessageTime = messageTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
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

  editMessage(message: Message, updatedData: { content?: string, emojies?: string[] }) {
    this.messageService.updateMessage(message, updatedData);
    this.toggleMessageEditor();
  }















}

import { ChangeDetectorRef, Component, inject, Input, OnInit } from '@angular/core';
import { MessageDateComponent } from './message-date/message-date.component';
import { MessageTextareaComponent } from '../message-textarea/message-textarea.component';
import { CommonModule } from '@angular/common';
import { MessageComponent } from './message/message.component';
import { PopoverChannelEditorComponent } from './popover-chatview/popover-channel-editor/popover-channel-editor.component';
import { PopoverChannelMemberOverviewComponent } from './popover-chatview/popover-channel-member-overview/popover-channel-member-overview.component';
import { UsersService } from '../../utils/services/user.service';
import { ChannelService } from '../../utils/services/channel.service';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { Message } from '../../shared/models/message.class';
import { MessageService } from '../../utils/services/message.service';


@Component({
  selector: 'app-chatview',
  standalone: true,
  imports: [CommonModule, MessageDateComponent, MessageComponent, MessageTextareaComponent, PopoverChannelEditorComponent, PopoverChannelMemberOverviewComponent],
  templateUrl: './chatview.component.html',
  styleUrl: './chatview.component.scss'
})
export class ChatviewComponent {

  messagefromUser = true;

  private unsubMessages: any = null;
  private firestore = inject(Firestore);
  private userservice = inject(UsersService);
  private channelService = inject(ChannelService);
  private messageService = inject(MessageService)


  public messages: Message[] = [];

  public allMessagesDate :Date[] = [];

  constructor(private _cdr: ChangeDetectorRef) { 
  }

  @Input()
  set messagesPath(value: string | undefined) {
    this.messages = [];
    // this.subscribeMessages(value);
    this.subscribeMessages('Entwicklung');
  }

  getAllMessagesDate() {
    this.messages.forEach(message => {
      this.allMessagesDate.push(message.createdAt)
  });
  }

  private subscribeMessages(newPath: string | undefined) {
    if (this.unsubMessages) this.unsubMessages();
    if (newPath) {
      this.unsubMessages = onSnapshot(collection(this.firestore, newPath), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            let newMessage = new Message(change.doc.data(), newPath);
            this.messages.push(newMessage);
          }
          if (change.type === 'modified') {
            const message = this.messages.find((message) => message.id === change.doc.data()['id']);
            if (message) message.update(change.doc.data());
          }
          if (change.type === 'removed') {
            this.messages = this.messages.filter((message) => message.id !== change.doc.data()['id']);
          }
        });
        this.messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        this._cdr.detectChanges();
      })
    }
  }



}

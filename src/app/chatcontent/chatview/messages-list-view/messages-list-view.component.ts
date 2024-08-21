import { ChangeDetectorRef, Component, inject, Input, OnInit } from '@angular/core';
import { MessageComponent } from './message/message.component';
import { MessageDateComponent } from './message-date/message-date.component';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { Message } from '../../../shared/models/message.class';
import { MessageGreetingComponent } from './message-greeting/message-greeting.component';
import { Time } from '@angular/common';

@Component({
  selector: 'app-messages-list-view',
  standalone: true,
  imports: [MessageComponent, MessageDateComponent, MessageGreetingComponent],
  templateUrl: './messages-list-view.component.html',
  styleUrl: './messages-list-view.component.scss'
})
export class MessagesListViewComponent implements OnInit {

  // messagefromUser = true;
  // messageWroteFromUser = false;

  private firestore = inject(Firestore);
  private unsubMessages: any = null;
  public messages: Message[] = [];
  public messagesDates: Date[] = [];
  public messagesTime: Date[] = [];

  @Input() isDefaultChannel: boolean = false;


  @Input()
  set messagesPath(value: string | undefined) {
    this.messages = [];
    this.messagesDates = [];
    this.messagesTime = [];
    this.subscribeMessages(value);
  }



  constructor(private _cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {

  }


  sortMessagesDate(messageCreationDate: Date) {
    this.messagesDates.push(messageCreationDate);
    this.messagesDates = this.messagesDates.filter((date, index, array) => {
      return index === 0 || date.getDate() !== array[index - 1].getDate();
    });
    this.messagesDates.sort((a, b) => a.getDate() - b.getDate());

    this.messages.sort((a, b)=>{
      return a.createdAt.getTime() - b.createdAt.getTime();
    })


    // this.messagesTime.push(messageCreationDate);
    // this.messagesTime.sort((a, b) => a.getTime() - b.getTime());
  }


  private subscribeMessages(messagesPath: string | undefined) {
    if (this.unsubMessages) this.unsubMessages();
    if (messagesPath) {
      this.unsubMessages = onSnapshot(collection(this.firestore, messagesPath), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            let newMessage = new Message(change.doc.data(), messagesPath);
            this.messages.push(newMessage);
            this.sortMessagesDate(newMessage.createdAt)
          }
          if (change.type === 'modified') {
            const message = this.messages.find((message) => message.id === change.doc.data()['id']);
            if (message) message.update(change.doc.data());
          }
          if (change.type === 'removed') {
            this.messages = this.messages.filter((message) => message.id !== change.doc.data()['id']);
          }
        });
        this._cdr.detectChanges();
      })
    }
  }

  ngOnDestroy(): void {
    if (this.unsubMessages) {
      this.unsubMessages();
    }
  }


}

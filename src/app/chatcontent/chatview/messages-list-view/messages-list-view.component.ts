import { ChangeDetectorRef, Component, inject, Input, OnInit } from '@angular/core';
import { MessageComponent } from './message/message.component';
import { MessageDateComponent } from './message-date/message-date.component';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { Message } from '../../../shared/models/message.class';

@Component({
  selector: 'app-messages-list-view',
  standalone: true,
  imports: [MessageComponent, MessageDateComponent],
  templateUrl: './messages-list-view.component.html',
  styleUrl: './messages-list-view.component.scss'
})
export class MessagesListViewComponent implements OnInit {
  messagefromUser = true;

  private firestore = inject(Firestore);
  private unsubMessages: any = null;
  public messages: Message[] = [];
  public dates: Date[] = [];


  @Input()
  set messagesPath(value: string | undefined) {
    this.messages = [];
    this.subscribeMessages(value);

  }


  constructor(private _cdr: ChangeDetectorRef) { 
  }

  ngOnInit(): void {
    
  }

  // getAllMessagesDates() {
  //   this.dates = [];
  //   this.messages.forEach((message) => {
  //     if (!this.dates.includes(message.createdAt)) {
  //       this.dates.push(message.createdAt);
  //     }
  //   });
  // }




  private subscribeMessages(messagesPath: string | undefined) {
    if (this.unsubMessages) this.unsubMessages();
    if (messagesPath) {
      this.unsubMessages = onSnapshot(collection(this.firestore, messagesPath), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            let newMessage = new Message(change.doc.data(), messagesPath);
            this.messages.push(newMessage);
            this.dates.push(newMessage.createdAt)
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

  ngOnDestroy(): void {
    if (this.unsubMessages) {
      this.unsubMessages();
    }
  }


}

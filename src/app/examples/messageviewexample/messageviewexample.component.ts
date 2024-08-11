import { ChangeDetectorRef, Component, inject, Input, OnDestroy } from '@angular/core';
import { Message } from '../../shared/models/message.class';
import { onSnapshot } from '@firebase/firestore';
import { collection, Firestore } from '@angular/fire/firestore';
import { UsersService } from '../../utils/services/user.service';
import { FormsModule } from '@angular/forms';
import { MessageService } from '../../utils/services/message.service';

@Component({
  selector: 'app-messageviewexample',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './messageviewexample.component.html',
  styleUrl: './messageviewexample.component.scss'
})
export class MessageviewexampleComponent implements OnDestroy {

  private unsubMessages: any = null;
  private firestore = inject(Firestore);
  private messageservice = inject(MessageService);
  public userservice = inject(UsersService);

  public messages: Message[] = [];

  // ==================================================================== debug

  public answerContent: string = '';
  addAnswerToMessage(message: Message) {
    this.messageservice.addNewAnswerToMessage(message, this.answerContent);
  }
  changeMessageContent(message: Message) {
    this.messageservice.updateMessage(message, { content: this.answerContent });
  }

  // ==================================================================== debug

  @Input()
  set messagesPath(value: string | undefined) {
    this.messages = [];
    this.subscribeMessages(value);
  }


  constructor(private _changeDetectorRef: ChangeDetectorRef) { }


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
          this._changeDetectorRef.detectChanges();
        });
      })
    }
  }


  ngOnDestroy(): void {
    if (this.unsubMessages) {
      this.unsubMessages();
    }
  }

}

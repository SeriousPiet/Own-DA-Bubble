import { inject, Injectable } from '@angular/core';
import { addDoc, collection, doc, Firestore, serverTimestamp, updateDoc } from '@angular/fire/firestore';
import { UsersService } from './user.service';
import { Message } from '../../shared/models/message.class';
import { Channel } from '../../shared/models/channel.class';

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  private firestore = inject(Firestore);
  private userservice = inject(UsersService);

  constructor() { }


  addNewMessageToChannel(channel: Channel, message: string) {
    const channelMessagesRef = collection(this.firestore, 'channels/' + channel.id + '/messages/');
    if (!channelMessagesRef) throw new Error('MessageService: addNewMessageToChannel: path "channels/' + channel.id + '/messages/" is undefined');
    addDoc(channelMessagesRef, this.createNewMessageObject(message, true))
      .then(
        () => { console.warn('MessageService: addNewMessageToChannel: message added'); }
      )
  }


  addNewAnswerToMessage(message: Message, answerContent: string) {
    let messageUpdateData = {
      answerCount: message.answerCount + 1,
      lastAnswered: serverTimestamp()
    };
    const answerCollectionRef = collection(this.firestore, message.messagePath + '/messages/');
    if (!answerCollectionRef) throw new Error('MessageService: addNewAnswerToMessage: path "' + message.messagePath + '/messages/" is undefined');
    addDoc(answerCollectionRef, this.createNewMessageObject(answerContent, false))
      .then(
        () => {
          updateDoc(doc(this.firestore, message.messagePath), messageUpdateData)
            .then(
              () => { console.warn('MessageService: addNewAnswerToMessage: answer added'); },
            )
        }
      );
  }


  private createNewMessageObject(messageText: string, answerable: boolean) {
    return {
      creatorID: this.userservice.currentUser ? this.userservice.currentUser.id : '??? unknow userID ???',
      createdAt: serverTimestamp(),
      content: messageText,
      emojies: [],
      answerable: answerable,
    };
  }


}

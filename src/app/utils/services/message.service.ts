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


  private addNewMessageToChannel(channel: Channel, messageContent: string) {
    const channelMessagesRef = collection(this.firestore, channel.channelMessagesPath);
    if (!channelMessagesRef) throw new Error('MessageService: addNewMessageToChannel: path "channels/' + channel.id + '/messages/" is undefined');
    addDoc(channelMessagesRef, this.createNewMessageObject(messageContent, true))
      .then(
        (response) => {
          const newMessageRef = doc(channelMessagesRef, response.id);
          updateDoc(newMessageRef, { id: response.id });
          console.warn('MessageService: addNewMessageToChannel: message added');
        }
      )
  }


  addNewMessageToPath(messagePath: string, messageContent: string) {
    const messageCollectionRef = collection(this.firestore, messagePath);
    if (!messageCollectionRef) throw new Error('MessageService: addNewMessageToPath: path "' + messagePath + '" is undefined');
    addDoc(messageCollectionRef, this.createNewMessageObject(messageContent, true))
      .then(
        (response) => {
          const newMessageRef = doc(messageCollectionRef, response.id);
          updateDoc(newMessageRef, { id: response.id });
          console.warn('MessageService: addNewMessageToPath: message added');
        }
      )
  }


  updateMessage(message: Message, updateData: { content?: string, emojies?: string[] }) {
    updateDoc(doc(this.firestore, message.messagePath), updateData)
      .then(
        () => {
          console.warn('MessageService: updateMessage: message updated - id: ' + message.id);
        }
      );
  }


  ifMessageFromCurrentUser(message: Message): boolean {
    return message.creatorID === this.userservice.currentUser?.id;
  }


  addNewAnswerToMessage(message: Message, answerContent: string) {
    const answerCollectionRef = collection(this.firestore, message.answerPath);
    if (!answerCollectionRef) throw new Error('MessageService: addNewAnswerToMessage: path "' + message.answerPath + '" is undefined');
    addDoc(answerCollectionRef, this.createNewMessageObject(answerContent, false))
      .then(
        (response) => {
          const newMessageRef = doc(answerCollectionRef, response.id);
          updateDoc(newMessageRef, { id: response.id })
            .then(
              () => {
                updateDoc(doc(this.firestore, message.messagePath), { answerCount: message.answerCount + 1, lastAnswered: serverTimestamp() })
                  .then(
                    () => {
                      console.warn('MessageService: addNewAnswerToMessage: answer added');
                    },
                  )
              }
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

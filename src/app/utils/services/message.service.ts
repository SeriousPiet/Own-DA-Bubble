import { inject, Injectable } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDoc, getDocs, serverTimestamp, updateDoc } from '@angular/fire/firestore';
import { UsersService } from './user.service';
import { Message } from '../../shared/models/message.class';

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  private firestore = inject(Firestore);
  private userservice = inject(UsersService);

  constructor() { }


  async addNewMessageToPath(messagePath: string, messageContent: string) {
    const messageCollectionRef = collection(this.firestore, messagePath);
    if (!messageCollectionRef) throw new Error('MessageService: addNewMessageToPath: path "' + messagePath + '" is undefined');
    try {
      const response = await addDoc(messageCollectionRef, this.createNewMessageObject(messageContent, true));
      const newMessageRef = doc(messageCollectionRef, response.id);
      await updateDoc(newMessageRef, { id: response.id });
      console.warn('MessageService: addNewMessageToPath: message added');
    } catch (error) {
      console.error('MessageService: addNewMessageToPath: error adding message', error);
    }
  }


  async updateMessage(message: Message, updateData: { content?: string, emojies?: string[] }) {
    try {
      await updateDoc(doc(this.firestore, message.messagePath), updateData);
      console.warn('MessageService: updateMessage: message updated - id: ' + message.id);
    } catch (error) {
      console.error('MessageService: updateMessage: error updating message', error);
    }
  }


  ifMessageFromCurrentUser(message: Message): boolean {
    return message.creatorID === this.userservice.currentUser?.id;
  }


  async addNewAnswerToMessage(message: Message, answerContent: string) {
    try {
      const answerCollectionRef = collection(this.firestore, message.answerPath);
      if (!answerCollectionRef) throw new Error('MessageService: addNewAnswerToMessage: path "' + message.answerPath + '" is undefined');
      const response = await addDoc(answerCollectionRef, this.createNewMessageObject(answerContent, false));
      await updateDoc(doc(answerCollectionRef, response.id), { id: response.id });
      const answerQuerySnapshot = await getDocs(answerCollectionRef);
      await updateDoc(doc(this.firestore, message.messagePath), { answerCount: answerQuerySnapshot.size, lastAnswered: serverTimestamp() });
      console.warn('MessageService: addNewAnswerToMessage: answer added');
    } catch (error) {
      console.error('MessageService: addNewAnswerToMessage: error adding answer', error);
    }
  }


  async toggleReactionToMessage(message: Message, reaction: string) {
    try {
      const currentUserID = this.userservice.currentUser?.id ? this.userservice.currentUser.id : '';
      let currentMesReactionArray = message.emojies;
      let currentReaction = currentMesReactionArray.find(emoji => emoji.type === reaction);
      if (currentReaction) {
        if (currentReaction.userIDs.includes(currentUserID)) {
          currentReaction.userIDs = currentReaction.userIDs.filter(userID => userID !== currentUserID);
        }
        else {
          currentReaction.userIDs.push(currentUserID);
        }
      }
      else {
        currentMesReactionArray.push({ type: reaction, userIDs: [currentUserID] });
      }
      const newReactionArray = currentMesReactionArray.map(reaction => JSON.stringify(reaction));

      await updateDoc(doc(this.firestore, message.messagePath), { emojies: newReactionArray });
      console.warn('MessageService: toggleReactionToMessage: reaction toggled');
    } catch (error) {
      console.error('MessageService: toggleReactionToMessage: error toggling reaction', error);
    }
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

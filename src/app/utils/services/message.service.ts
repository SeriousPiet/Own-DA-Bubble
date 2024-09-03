import { inject, Injectable } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDoc, getDocs, serverTimestamp, updateDoc } from '@angular/fire/firestore';
import { UsersService } from './user.service';
import { IReactions, Message } from '../../shared/models/message.class';
import { Channel } from '../../shared/models/channel.class';
import { Chat } from '../../shared/models/chat.class';

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
      // id is not saved in the document, so we become it when the messages subscribet over onSnapshot
      // await updateDoc(newMessageRef, { id: response.id });
      console.warn('MessageService: addNewMessageToPath: message added');
    } catch (error) {
      console.error('MessageService: addNewMessageToPath: error adding message', error);
    }
  }


  async updateMessage(message: Message, updateData: { content?: string, edited?: boolean, editedAt?: any }) {
    try {
      if (updateData.content && updateData.content != message.content) {
        updateData.edited = true;
        updateData.editedAt = serverTimestamp();
      }
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
      // id is not saved in the document, so we become it when the messages subscribet over onSnapshot
      // await updateDoc(doc(answerCollectionRef, response.id), { id: response.id });
      const answerQuerySnapshot = await getDocs(answerCollectionRef);
      await updateDoc(doc(this.firestore, message.messagePath), { answerCount: answerQuerySnapshot.size, lastAnswered: serverTimestamp() });
      console.warn('MessageService: addNewAnswerToMessage: answer added');
    } catch (error) {
      console.error('MessageService: addNewAnswerToMessage: error adding answer', error);
    }
  }


  async toggleReactionToMessage(message: Message, reaction: string) {
    try {
      const newReactionArray = this.getModifiedReactionArray(message.emojies, reaction);
      await updateDoc(doc(this.firestore, message.messagePath), { emojies: newReactionArray });
      console.warn('MessageService: toggleReactionToMessage: reaction toggled');
    } catch (error) {
      console.error('MessageService: toggleReactionToMessage: error toggling reaction', error);
    }
  }


  private getModifiedReactionArray(reactionsArray: IReactions[], reaction: string) {
    const currentUserID = this.userservice.currentUser?.id ? this.userservice.currentUser.id : '';
    let currentReaction = reactionsArray.find(emoji => emoji.type === reaction);
    if (currentReaction) {
      if (currentReaction.userIDs.includes(currentUserID)) {
        currentReaction.userIDs = currentReaction.userIDs.filter(userID => userID !== currentUserID);
        if (currentReaction.userIDs.length == 0) {
          const reactionIndex = reactionsArray.findIndex(currentReaction => currentReaction.type === reaction);
          reactionsArray.splice(reactionIndex, 1);
        }
      }
      else currentReaction.userIDs.push(currentUserID);
    }
    else {
      reactionsArray.push({ type: reaction, userIDs: [currentUserID] });
    };
    return reactionsArray.map(reaction => JSON.stringify(reaction));
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




  async addNewMessageToChannel(channel: Channel | Chat, messageContent: string) {
    let messagePath = '';
    if(channel instanceof Channel) {
      messagePath = channel.channelMessagesPath;
    } else {
      messagePath = 'chat/' + channel.id;
    }
    const messageCollectionRef = collection(this.firestore, messagePath);
    if (!messageCollectionRef) throw new Error('MessageService: addNewMessageToPath: path "' + messagePath + '" is undefined');
    try {
      const response = await addDoc(messageCollectionRef, this.createNewMessageObject(messageContent, true));
      const messagesQuerySnapshot = await getDocs(messageCollectionRef);
      await updateDoc(doc(this.firestore, 'channels/' + channel.id), { messageCount: messagesQuerySnapshot.size });
      console.warn('MessageService: addNewMessageToPath: message added');
    } catch (error) {
      console.error('MessageService: addNewMessageToPath: error adding message', error);
    }
  }

}

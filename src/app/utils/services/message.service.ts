import { inject, Injectable } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDocs, serverTimestamp, updateDoc } from '@angular/fire/firestore';
import { UsersService } from './user.service';
import { IReactions, Message } from '../../shared/models/message.class';
import { Channel } from '../../shared/models/channel.class';
import { Chat } from '../../shared/models/chat.class';

export type MessageAttachment = {
  name: string;
  src: any;
  size: number;
  lastModified: number;
  file: any;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  private firestore = inject(Firestore);
  private userservice = inject(UsersService);

  constructor() { }

  async addNewMessageToCollection(channel: Channel | Chat, messageContent: string): Promise<boolean> {
    const messagePath = (channel instanceof Channel) ? channel.channelMessagesPath : channel.chatMessagesPath;
    const messageCollectionRef = collection(this.firestore, messagePath);
    if (!messageCollectionRef) throw new Error('MessageService: path "' + messagePath + '" is undefined');
    try {
      const response = await addDoc(messageCollectionRef, this.createNewMessageObject(messageContent, true));
      const messagesQuerySnapshot = await getDocs(messageCollectionRef);
      await updateDoc(doc(this.firestore, 'channels/' + channel.id), { messagesCount: messagesQuerySnapshot.size });
      console.warn('MessageService: message added to ' + messagePath);
      return true;
    } catch (error) {
      console.error('MessageService: error adding message', error);
      return false;
    }
  }


  async updateMessage(message: Message, updateData: { content?: string, edited?: boolean, editedAt?: any }) {
    try {
      if (updateData.content && updateData.content != message.content) {
        updateData.edited = true;
        updateData.editedAt = serverTimestamp();
      }
      await updateDoc(doc(this.firestore, message.messagePath), updateData);
      console.warn('MessageService: message updated - id: ' + message.id);
    } catch (error) {
      console.error('MessageService: error updating message', error);
    }
  }


  ifMessageFromCurrentUser(message: Message): boolean {
    return message.creatorID === this.userservice.currentUser?.id;
  }


  async addNewAnswerToMessage(message: Message, answerContent: string): Promise<boolean> {
    try {
      const answerCollectionRef = collection(this.firestore, message.answerPath);
      if (!answerCollectionRef) throw new Error('MessageService: addNewAnswerToMessage: path "' + message.answerPath + '" is undefined');
      await addDoc(answerCollectionRef, this.createNewMessageObject(answerContent, false));
      const answerQuerySnapshot = await getDocs(answerCollectionRef);
      await updateDoc(doc(this.firestore, message.messagePath), { answerCount: answerQuerySnapshot.size, lastAnswered: serverTimestamp() });
      console.warn('MessageService: answer added to ' + message.answerPath);
      return true;
    } catch (error) {
      console.error('MessageService: error adding answer', error);
      return false;
    }
  }


  async toggleReactionToMessage(message: Message, reaction: string): Promise<boolean> {
    try {
      const newReactionArray = this.getModifiedReactionArray(message.emojies, reaction);
      await updateDoc(doc(this.firestore, message.messagePath), { emojies: newReactionArray });
      console.warn('MessageService: reaction toggled - id:' + message.id);
      return true;
    } catch (error) {
      console.error('MessageService: error toggling reaction', error);
      return false;
    }
  }


  private getModifiedReactionArray(reactionsArray: IReactions[], reaction: string) {
    const currentUserID = this.userservice.currentUserID;
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
      creatorID: this.userservice.currentUserID,
      createdAt: serverTimestamp(),
      content: messageText,
      emojies: [],
      answerable: answerable,
    };
  }
}

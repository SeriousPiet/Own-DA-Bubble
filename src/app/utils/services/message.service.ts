import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionGroup, query, orderBy, limit, doc, getDocs, addDoc, updateDoc, serverTimestamp } from '@angular/fire/firestore';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';
import { UsersService } from './user.service';
import { IReactions, Message, StoredAttachment } from '../../shared/models/message.class';
import { Channel } from '../../shared/models/channel.class';
import { Chat } from '../../shared/models/chat.class';
import { EmojipickerService } from './emojipicker.service';

export type MessageAttachment = {
  name: string;
  src: any;
  size: number;
  lastModified: number;
  file: any;
};

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private firestore = inject(Firestore);
  private userservice = inject(UsersService);
  private emojiService = inject(EmojipickerService);
  private storage = getStorage();

  private getMessagePath(collectionObject: Channel | Chat | Message): string {
    return collectionObject instanceof Channel
      ? collectionObject.channelMessagesPath
      : collectionObject instanceof Chat
      ? collectionObject.chatMessagesPath
      : collectionObject.answerPath;
  }


  private getObjectsPath(collectionObject: Channel | Chat | Message): string {
    return collectionObject instanceof Channel
      ? 'channels/' + collectionObject.id
      : collectionObject instanceof Chat
      ? 'chats/' + collectionObject.id
      : collectionObject.messagePath;
  }


  async addNewMessageToCollection(collectionObject: Channel | Chat | Message, messageContent: string, attachments: MessageAttachment[] = []): Promise<string> {
    const messagePath = this.getMessagePath(collectionObject);
    const objectPath = this.getObjectsPath(collectionObject);
    try {
      const messageCollectionRef = collection(this.firestore, messagePath);
      if (!messageCollectionRef) throw new Error('Nachrichtenpfad "' + messagePath + '" ist nicht gefunden.');
      const response = await addDoc(messageCollectionRef, this.createNewMessageObject(messageContent, !(collectionObject instanceof Message)));
      if (attachments.length > 0) {
        const uploadedAttachments = await this.uploadAttachmentsToStorage(response.id, attachments);
        if (uploadedAttachments.length > 0) await updateDoc(doc(this.firestore, response.path), { attachments: JSON.stringify(uploadedAttachments) });
      }
      const messagesQuerySnapshot = await getDocs(messageCollectionRef);
      const updateData = collectionObject instanceof Message ? { answerCount: messagesQuerySnapshot.size, lastAnswerAt: serverTimestamp() } : { messagesCount: messagesQuerySnapshot.size };
      await updateDoc(doc(this.firestore, objectPath), updateData);
      console.warn('MessageService: message added to ' + messagePath);
      return '';
    } catch (error) {
      console.error('MessageService: error adding message', error);
      return (error as Error).message;
    }
  }


  public async deleteStoredAttachment(message: Message, storedAttachment: StoredAttachment): Promise<string> {
    try {
      const storageRef = ref(this.storage, storedAttachment.path)
      await deleteObject(storageRef)
      const updatedAttachments = message.attachments.filter(attachment => attachment.name !== storedAttachment.name)
      await updateDoc(doc(this.firestore, message.messagePath), { attachments: JSON.stringify(updatedAttachments) })
      console.warn('MessageService: attachment deleted - id: ' + message.id + ' / name: ' + storedAttachment.name)
      return ''
    } catch (error) {
      console.error('MessageService: error deleting attachment', error)
      return (error as Error).message
    }
  }


  private async uploadAttachmentsToStorage(messageID: string, attachments: MessageAttachment[]): Promise<StoredAttachment[]> {
    let uploadedAttachments: StoredAttachment[] = []
    for (const attachment of attachments) {
      const storagePath = 'message-attachments/' + messageID + '/' + attachment.name
      const storageRef = ref(this.storage, storagePath)
      try {
        const result = await uploadBytes(storageRef, attachment.file)
        const url = await getDownloadURL(storageRef)
        const nameWithoutExtension = attachment.name.replace(/\.[^/.]+$/, '')
        uploadedAttachments.push({
          name: nameWithoutExtension,
          url: url,
          path: storagePath,
          type: attachment.file.type.startsWith('image') ? 'image' : 'pdf'
        })
      } catch (error) {
        console.error('MessageService: error uploading attachment ', attachment.name, ' / ', error)
      }
    }
    return uploadedAttachments
  }


  async updateMessage(message: Message, updateData: { content?: string; edited?: boolean; editedAt?: any }) {
    try {
      if (updateData.content && updateData.content != message.content) {
        updateData.edited = true
        updateData.editedAt = serverTimestamp()
      }
      await updateDoc(doc(this.firestore, message.messagePath), updateData)
      console.warn('MessageService: message updated - id: ' + message.id)
    } catch (error) {
      console.error('MessageService: error updating message', error)
    }
  }


  async toggleReactionToMessage(message: Message, emoji: string): Promise<boolean> {
    try {
      const newReactionArray = this.getModifiedReactionArray(message.emojies, emoji)
      await updateDoc(doc(this.firestore, message.messagePath), { emojies: newReactionArray })
      console.warn('MessageService: reaction toggled - id:' + message.id)
      return true
    } catch (error) {
      console.error('MessageService: error toggling reaction', error)
      return false
    }
  }


  private getModifiedReactionArray(reactionsArray: IReactions[], reaction: string) {
    const currentUserID = this.userservice.currentUserID
    let currentReaction = reactionsArray.find(emoji => emoji.type === reaction)
    if (currentReaction) {
      if (currentReaction.userIDs.includes(currentUserID)) {
        currentReaction.userIDs = currentReaction.userIDs.filter(userID => userID !== currentUserID)
        if (currentReaction.userIDs.length == 0) {
          const reactionIndex = reactionsArray.findIndex(currentReaction => currentReaction.type === reaction)
          reactionsArray.splice(reactionIndex, 1)
        }
      } else {
        this.emojiService.addEmojiToUserEmojis(reaction)
        currentReaction.userIDs.push(currentUserID)
      }
    } else {
      this.emojiService.addEmojiToUserEmojis(reaction)
      reactionsArray.push({ type: reaction, userIDs: [currentUserID] })
    }
    return reactionsArray.map(reaction => JSON.stringify(reaction))
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


  // ################# MESSAGES SEARCH #################

  /**
   * Searches for messages in the Firestore database that match the provided search query.
   *
   * @param searchQuery - The search query to use for finding matching messages.
   * @returns A Promise that resolves to an array of `Message` objects that match the search query.
   */
  async searchMessages(searchQuery: string): Promise<Message[]> {
    console.log(
      'MessageService: searchMessages called with query:',
      searchQuery
    );

    const messagesRef = collectionGroup(this.firestore, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(100));

    const querySnapshot = await getDocs(q);
    const results: Message[] = [];

    querySnapshot.forEach((doc) => {
      const messageData = doc.data();
      const content = messageData['content'].toLowerCase();
      const searchLower = searchQuery.toLowerCase();

      if (content.includes(searchLower)) {
        const message = new Message(messageData, doc.ref.parent.path, doc.id);
        results.push(message);
      }
    });

    return results;
  }
}

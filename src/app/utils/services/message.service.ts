import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  CollectionReference,
  collectionGroup,
  query,
  where,
  orderBy,
  limit,
  startAt,
  endAt,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { UsersService } from './user.service';
import { IReactions, Message, StoredAttachment } from '../../shared/models/message.class';
import { Channel } from '../../shared/models/channel.class';
import { Chat } from '../../shared/models/chat.class';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';

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
  private storage = getStorage();

  constructor() {}

  async addNewMessageToCollection(
    collectionObject: Channel | Chat | Message,
    messageContent: string,
    attachments: MessageAttachment[] = []
  ): Promise<string> {
    const messagePath =
      collectionObject instanceof Channel
        ? collectionObject.channelMessagesPath
        : collectionObject instanceof Chat
        ? collectionObject.chatMessagesPath
        : collectionObject.answerPath;
    const objectPath =
      collectionObject instanceof Channel
        ? 'channels/' + collectionObject.id
        : collectionObject instanceof Chat
        ? 'chats/' + collectionObject.id
        : collectionObject.messagePath;
    try {
      const messageCollectionRef = collection(this.firestore, messagePath);
      if (!messageCollectionRef)
        throw new Error(
          'Nachrichtenpfad "' + messagePath + '" ist nicht gefunden.'
        );
      // add message to objectpath
      const response = await addDoc(
        messageCollectionRef,
        this.createNewMessageObject(messageContent, true)
      );
      // add attachments to storage and update message with attachments
      if (attachments.length > 0) {
        const uploadedAttachments = await this.uploadAttachmentsToStorage(
          response.id,
          attachments
        );
        if (uploadedAttachments.length > 0)
          await updateDoc(doc(this.firestore, response.path), {
            attachments: JSON.stringify(uploadedAttachments),
          });
      }
      // calculate messagesCount or answerCount and update objectpath
      const messagesQuerySnapshot = await getDocs(messageCollectionRef);
      await updateDoc(
        doc(this.firestore, objectPath),
        collectionObject instanceof Message
          ? { answerCount: messagesQuerySnapshot.size }
          : { messagesCount: messagesQuerySnapshot.size }
      );
      // -----------------------------------------------------
      console.warn('MessageService: message added to ' + messagePath);
      return '';
    } catch (error) {
      console.error('MessageService: error adding message', error);
      return (error as Error).message;
    }
  }


  public async deleteStoredAttachment(message: Message, storedAttachment: StoredAttachment): Promise<string> {
    try {
      const storageRef = ref(this.storage, 'message-attachments/' + message.id + '/' + storedAttachment.name);
      await deleteObject(storageRef);
      const updatedAttachments = message.attachments.filter(attachment => attachment.name !== storedAttachment.name);
      await updateDoc(doc(this.firestore, message.messagePath), { attachments: JSON.stringify(updatedAttachments) });
      console.warn('MessageService: attachment deleted - id: ' + message.id + ' / name: ' + storedAttachment.name);
      return '';
    } catch (error) {
      console.error('MessageService: error deleting attachment', error);
      return (error as Error).message;
    }
  }


  private async uploadAttachmentsToStorage(messageID: string, attachments: MessageAttachment[]): Promise<StoredAttachment[]> {
    let uploadedAttachments: StoredAttachment[] = [];
    for (const attachment of attachments) {
      const storageRef = ref(
        this.storage,
        'message-attachments/' + messageID + '/' + attachment.name
      );
      try {
        const result = await uploadBytes(storageRef, attachment.file);
        const url = await getDownloadURL(storageRef);
        uploadedAttachments.push({ name: attachment.name, url: url });
      } catch (error) {
        console.error(
          'MessageService: error uploading attachment ',
          attachment.name,
          ' / ',
          error
        );
      }
    }
    return uploadedAttachments;
  }

  async updateMessage(
    message: Message,
    updateData: { content?: string; edited?: boolean; editedAt?: any }
  ) {
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

  async toggleReactionToMessage(
    message: Message,
    reaction: string
  ): Promise<boolean> {
    try {
      const newReactionArray = this.getModifiedReactionArray(
        message.emojies,
        reaction
      );
      await updateDoc(doc(this.firestore, message.messagePath), {
        emojies: newReactionArray,
      });
      console.warn('MessageService: reaction toggled - id:' + message.id);
      return true;
    } catch (error) {
      console.error('MessageService: error toggling reaction', error);
      return false;
    }
  }

  private getModifiedReactionArray(
    reactionsArray: IReactions[],
    reaction: string
  ) {
    const currentUserID = this.userservice.currentUserID;
    let currentReaction = reactionsArray.find(
      (emoji) => emoji.type === reaction
    );
    if (currentReaction) {
      if (currentReaction.userIDs.includes(currentUserID)) {
        currentReaction.userIDs = currentReaction.userIDs.filter(
          (userID) => userID !== currentUserID
        );
        if (currentReaction.userIDs.length == 0) {
          const reactionIndex = reactionsArray.findIndex(
            (currentReaction) => currentReaction.type === reaction
          );
          reactionsArray.splice(reactionIndex, 1);
        }
      } else currentReaction.userIDs.push(currentUserID);
    } else {
      reactionsArray.push({ type: reaction, userIDs: [currentUserID] });
    }
    return reactionsArray.map((reaction) => JSON.stringify(reaction));
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

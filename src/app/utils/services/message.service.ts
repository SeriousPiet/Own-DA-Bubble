import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionGroup, query, orderBy, limit, doc, getDocs, addDoc, updateDoc, serverTimestamp, deleteDoc } from '@angular/fire/firestore';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';
import { UsersService } from './user.service';
import { IReactions, Message, StoredAttachment } from '../../shared/models/message.class';
import { Channel } from '../../shared/models/channel.class';
import { Chat } from '../../shared/models/chat.class';
import { EmojipickerService } from './emojipicker.service';
import { getMessagePath, getObjectsPath, removeAllHTMLTagsFromString } from '../firebase/utils';

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


  /**
   * Adds a new message to the specified collection (Channel, Chat, or Message).
   * 
   * @param collectionObject - The collection object to which the message will be added. This can be a Channel, Chat, or Message.
   * @param messageContent - The content of the message to be added.
   * @param attachments - An optional array of message attachments.
   * @returns A promise that resolves to an empty string if the message is added successfully, or an error message if the operation fails.
   * 
   * @throws Will throw an error if the message path is not found.
   */
  async addNewMessageToCollection(
    collectionObject: Channel | Chat | Message,
    messageContent: string,
    attachments: MessageAttachment[] = [],
    creatorID: string = this.userservice.currentUserID,
    createdAt: Date | undefined = undefined
  ): Promise<string> {
    const messagePath = getMessagePath(collectionObject);
    const objectPath = getObjectsPath(collectionObject);
    try {
      const messageCollectionRef = collection(this.firestore, messagePath);
      if (!messageCollectionRef) throw new Error('Nachrichtenpfad "' + messagePath + '" nicht gefunden.');
      const response = await addDoc(messageCollectionRef, this.createNewMessageObject(messageContent, !(collectionObject instanceof Message), creatorID, createdAt));
      if (attachments.length > 0) this.uploadAndAddAttachmentsToMessage(response.id, response.path, attachments);
      const messagesQuerySnapshot = await getDocs(messageCollectionRef);
      const updateData = collectionObject instanceof Message ? { answerCount: messagesQuerySnapshot.size, lastAnswerAt: serverTimestamp() } : { messagesCount: messagesQuerySnapshot.size };
      await updateDoc(doc(this.firestore, objectPath), updateData);
      return '';
    } catch (error) {
      console.error('MessageService: error adding message', error);
      return (error as Error).message;
    }
  }


  /**
   * Uploads the provided attachments to storage and updates the message document with the uploaded attachments.
   *
   * @param messageID - The unique identifier of the message.
   * @param messagePath - The Firestore path to the message document.
   * @param attachments - An array of attachments to be uploaded.
   * @returns A promise that resolves when the attachments have been uploaded and the message document has been updated.
   */
  private async uploadAndAddAttachmentsToMessage(messageID: string, messagePath: string, attachments: MessageAttachment[]): Promise<void> {
    const uploadedAttachments = await this.uploadAttachmentsToStorage(messageID, attachments);
    if (uploadedAttachments.length > 0) await updateDoc(doc(this.firestore, messagePath), { attachments: JSON.stringify(uploadedAttachments) });
  }


  /**
   * Deletes a message from the Firestore database and updates the related collection object.
   * 
   * @param {Message} message - The message to be deleted.
   * @param {Channel | Chat | Message} collectionObject - The collection object (Channel, Chat, or Message) that contains the message.
   * @returns {Promise<string>} - A promise that resolves to an empty string if the deletion is successful, or an error message if it fails.
   * 
   * @throws {Error} - Throws an error if the deletion process fails.
   * 
   * @remarks
   * - If the message is answerable and has answers, all answers are deleted first.
   * - The message is then deleted from Firestore.
   * - The related collection object is updated with the new count of messages or answers.
   * 
   */
  private async deleteMessage(message: Message, collectionObject: Channel | Chat | Message): Promise<string> {
    try {
      if (message.answerable && message.answerCount > 0) this.deleteAllAnswersFromMessage(message);
      await deleteDoc(doc(this.firestore, message.messagePath));
      const messageCollectionRef = collection(this.firestore, getMessagePath(collectionObject))
      const messagesQuerySnapshot = await getDocs(messageCollectionRef)
      const updateData = collectionObject instanceof Message ? { answerCount: messagesQuerySnapshot.size } : { messagesCount: messagesQuerySnapshot.size }
      await updateDoc(doc(this.firestore, getObjectsPath(collectionObject)), updateData)
      return ''
    } catch (error) {
      console.error('MessageService: error deleting message', error)
      return (error as Error).message
    }
  }


  /**
   * Deletes all answers associated with a given message from the Firestore database.
   *
   * @param {Message} message - The message object containing the path to the answers.
   * @returns {Promise<string>} A promise that resolves to an empty string if successful, or an error message if an error occurs.
   *
   * @throws Will log an error message to the console if the deletion process fails.
   */
  private async deleteAllAnswersFromMessage(message: Message): Promise<string> {
    try {
      const answerCollectionRef = collection(this.firestore, message.answerPath);
      const answersQuerySnapshot = await getDocs(answerCollectionRef);
      const deletePromises = answersQuerySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      return '';
    } catch (error) {
      console.error('MessageService: error deleting answers', error);
      return (error as Error).message;
    }
  }


  /**
   * Deletes a stored attachment from a message.
   *
   * @param {Message} message - The message object containing the attachment.
   * @param {StoredAttachment} storedAttachment - The attachment to be deleted.
   * @returns {Promise<string>} - A promise that resolves to an empty string if successful, or an error message if an error occurs.
   *
   * @throws {Error} - Throws an error if the deletion process fails.
   */
  public async deleteStoredAttachment(message: Message, storedAttachment: StoredAttachment): Promise<string> {
    try {
      const storageRef = ref(this.storage, storedAttachment.path)
      await deleteObject(storageRef)
      const updatedAttachments = message.attachments.filter(attachment => attachment.name !== storedAttachment.name)
      await updateDoc(doc(this.firestore, message.messagePath), { attachments: JSON.stringify(updatedAttachments) })
      return ''
    } catch (error) {
      console.error('MessageService: error deleting attachment', error)
      return (error as Error).message
    }
  }


  /**
   * Uploads a list of message attachments to storage and returns their stored details.
   *
   * @param {string} messageID - The unique identifier for the message to which the attachments belong.
   * @param {MessageAttachment[]} attachments - An array of attachments to be uploaded.
   * @returns {Promise<StoredAttachment[]>} A promise that resolves to an array of stored attachment details.
   *
   * @throws Will log an error message if an attachment fails to upload.
   */
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


  /**
   * Updates a message with the provided update data.
   * 
   * @param message - The message object to be updated.
   * @param updateData - An object containing the fields to update. 
   *                     - `content` (optional): The new content of the message.
   *                     - `edited` (optional): A boolean indicating if the message has been edited.
   *                     - `editedAt` (optional): The timestamp when the message was edited.
   * 
   * @returns A promise that resolves when the message has been successfully updated.
   * 
   * @throws Will throw an error if the update operation fails.
   */
  async updateMessage(message: Message, updateData: { content: string; plainContent?: string, edited?: boolean; editedAt?: any }) {
    try {
      if (updateData.content && updateData.content != message.content) {
        updateData.edited = true;
        updateData.editedAt = serverTimestamp();
        updateData.plainContent = removeAllHTMLTagsFromString(updateData.content);
        await updateDoc(doc(this.firestore, message.messagePath), updateData)
      }
    } catch (error) {
      console.error('MessageService: error updating message', error)
    }
  }


  /**
   * Toggles a reaction (emoji) on a given message.
   *
   * @param {Message} message - The message object to which the reaction is to be toggled.
   * @param {string} emoji - The emoji to be toggled on the message.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the reaction was successfully toggled, or `false` if an error occurred.
   *
   * @throws Will log an error message if the reaction toggle fails.
   */
  async toggleReactionToMessage(message: Message, emoji: string): Promise<boolean> {
    try {
      const newReactionArray = this.getModifiedReactionArray(message.emojies, emoji)
      await updateDoc(doc(this.firestore, message.messagePath), { emojies: newReactionArray })
      return true
    } catch (error) {
      console.error('MessageService: error toggling reaction', error)
      return false
    }
  }


  /**
   * Modifies the array of reactions based on the current user's reaction.
   * 
   * @param reactionsArray - The array of reactions to be modified.
   * @param reaction - The type of reaction to be added or removed.
   * @returns The modified array of reactions as strings.
   * 
   * This method performs the following operations:
   * - If the reaction already exists and the current user has reacted, it removes the user's reaction.
   * - If the reaction exists but the current user has not reacted, it adds the user's reaction.
   * - If the reaction does not exist, it creates a new reaction with the current user's reaction.
   * - It ensures that if a reaction has no users left, it is removed from the array.
   * - It updates the user's emoji list using the emojiService.
   */
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


  /**
   * Creates a new message object with the provided text and answerable status.
   *
   * @param messageText - The text content of the message.
   * @param answerable - A boolean indicating if the message is answerable.
   * @returns An object representing the new message.
   */
  private createNewMessageObject(messageText: string, answerable: boolean, createdBy: string, createdAt: Date | undefined): any {
    return {
      creatorID: createdBy,
      createdAt: createdAt ? createdAt : serverTimestamp(),
      content: messageText,
      plainContent: removeAllHTMLTagsFromString(messageText),
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
  async searchMessages(searchQuery: string, messagesPath: string): Promise<Message[]> {
    const searchLower = searchQuery.toLowerCase();
    if (messagesPath === '') {
      const messagesRef = collectionGroup(this.firestore, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(100));
      const querySnapshot = await getDocs(q);
      return await this.getMessagesFromQuerySnapshot(querySnapshot, searchLower);
    } else {
      const colRef = collection(this.firestore, messagesPath);
      const allDocs = await getDocs(colRef);
      return await this.getMessagesFromQuerySnapshot(allDocs, searchLower);
    }
  }


  /**
   * Retrieves messages from a Firestore query snapshot that match a search term.
   *
   * @param querySnapshot - The Firestore query snapshot containing message documents.
   * @param searchLower - The search term in lowercase to match against message content.
   * @returns A promise that resolves to an array of messages that contain the search term.
   */
  private async getMessagesFromQuerySnapshot(querySnapshot: any, searchLower: string): Promise<Message[]> {
    const results: Message[] = [];
    querySnapshot.forEach((doc: any) => {
      const messageData = doc.data();
      const content = removeAllHTMLTagsFromString(messageData['content']).toLowerCase();
      if (content.includes(searchLower)) {
        const message = new Message(messageData, doc.ref.parent.path, doc.id);
        results.push(message);
      }
    });
    return results;
  }
}

import { inject, Injectable } from '@angular/core';
import { UsersService } from './user.service';
import { collection, deleteDoc, doc, DocumentData, Firestore, getDoc, getDocs, QueryDocumentSnapshot, updateDoc } from '@angular/fire/firestore';
import { ChannelService } from './channel.service';
import { Channel } from '../../shared/models/channel.class';
import { Auth, signOut } from '@angular/fire/auth';
import { NavigationService } from './navigation.service';
import { isRealUser } from '../firebase/utils';

@Injectable({
  providedIn: 'root'
})
export class CleanupService {
  private navigationservice = inject(NavigationService);
  private userservice = inject(UsersService);
  private channelservice = inject(ChannelService);
  private firestore = inject(Firestore);
  private firebaseauth = inject(Auth);

  private docsToDelete: string[] = [];

  constructor() {
    setTimeout(() => { this.markAllGuestsToDelete(); }, 5000);
    setTimeout(() => { this.deleteAllGuestData(); }, 10000);
  }


  /**
   * Logs out the current user by performing necessary cleanup operations.
   * 
   * If the current user is a guest, it clears the current user and deletes all content associated with the guest user ID.
   * Otherwise, it signs out the user from Firebase authentication.
   * 
   * @returns {Promise<void>} A promise that resolves when the logout process is complete.
   */
  async logoutUser(): Promise<void> {
    await this.navigationservice.setChatViewObject(this.channelservice.defaultChannel);
    if (this.userservice.currentGuestUserID == '') {
      await signOut(this.firebaseauth);
    } else {
      const guestID = this.userservice.currentGuestUserID;
      this.userservice.clearCurrentUser();
      await this.deleteAllUserContentByID(guestID);
    }
  }


  /**
   * Deletes all guest user data that meets specific criteria.
   * 
   * This method iterates through all users and checks if they are guests and offline.
   * If a guest user is offline, it retrieves the user's document from Firestore.
   * If the document exists and the user was marked for deletion more than 4500 milliseconds ago,
   * it deletes all content associated with the user.
   * 
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  async deleteAllGuestData() {
    const users = this.userservice.users;
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      if (user.guest) {
        if (!user.online) {
          console.warn('cleanupservice: Deleting guest user data (' + user.id + ')');
          const userDoc = await getDoc(doc(this.firestore, '/users/' + user.id));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData['markedToDeleteAT'] < Date.now() - 4500) {
              await this.deleteAllUserContentByID(user.id);
            }
          }
        }
      }
    }
  }


  /**
   * Marks all guest users for deletion by setting their `online` status to `false` 
   * and updating the `markedToDeleteAT` timestamp to the current time.
   * 
   * This method iterates through all users and checks if they are guests. 
   * If a guest user is found and they are currently online, a warning is logged 
   * and the user's document in Firestore is updated.
   * 
   * @returns {Promise<void>} A promise that resolves when all applicable users have been processed.
   */
  async markAllGuestsToDelete() {
    const users = this.userservice.users;
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      if (user.guest) {
        console.warn('cleanupservice: Marking guest for deletion (' + user.id + ')');
        await updateDoc(doc(this.firestore, '/users/' + user.id), { online: false, markedToDeleteAT: Date.now() });
      }
    }
  }


  /**
   * Deletes all content associated with a user by their ID.
   * 
   * This method performs the following actions:
   * 1. Iterates through all channels and:
   *    - Skips the default channel.
   *    - Clears and deletes channels created by the user.
   *    - Deletes all messages from channels not created by the user.
   * 2. Deletes all chats involving the user as a guest.
   * 3. Logs a warning indicating that all user content has been deleted.
   * 4. Deletes the user's document from Firestore.
   * 5. Deletes all documents associated with the user.
   * 
   * @param userID - The ID of the user whose content is to be deleted.
   * @returns A promise that resolves when all user content has been deleted.
   */
  public async deleteAllUserContentByID(userID: string) {
    for (let i = 0; i < this.channelservice.channels.length; i++) {
      const channel = this.channelservice.channels[i];
      if (channel.defaultChannel) continue;
      if (channel.creatorID === userID) {
        this.clearAndDeleteChannel(channel);
      } else {
        await this.deleteAllMessagesFromChannel(channel, userID);
      }
    }
    await this.deleteAllChatsWithGuest(userID);
    console.warn('cleanupservice: All user content deleted (' + userID + ')');
    await deleteDoc(doc(this.firestore, '/users/' + userID));
    await this.deleteAllDocs();
  }


  /**
   * Deletes all answers from a given message in Firestore. If a userID is provided,
   * only answers created by that user will be marked for deletion. If no userID is provided,
   * the message itself will also be marked for deletion.
   *
   * @param message - The message object containing the reference path to the answers.
   * @param userID - (Optional) The ID of the user whose answers should be deleted. If not provided, all answers will be deleted.
   * @returns A promise that resolves when the operation is complete.
   */
  private async deleteAllAnswersFromMessage(message: any, userID: string | undefined = undefined) {
    const answerRef = collection(this.firestore, message.ref.path + '/answers');
    if (answerRef) {
      const answers = await getDocs(answerRef);
      for (let k = 0; k < answers.docs.length; k++) {
        const answer = answers.docs[k];
        if (!userID || answer.data()['creatorID'] === userID) {
          this.docsToDelete.push(message.ref.path + '/answers/' + answer.id);
        }
      }
    }
    if (!userID) this.docsToDelete.push(message.ref.path);
  }


  /**
   * Deletes all messages from a specified channel for a given user.
   * 
   * @param channel - The channel from which to delete messages.
   * @param userID - The ID of the user whose messages are to be deleted.
   * @returns A promise that resolves when all messages have been processed.
   */
  private async deleteAllMessagesFromChannel(channel: Channel, userID: string) {
    const messages = await getDocs(collection(this.firestore, channel.channelMessagesPath));
    for (let j = 0; j < messages.docs.length; j++) {
      const message = messages.docs[j];
      if (message.data()['creatorID'] === userID) {
        this.deleteAllAnswersFromMessage(message);
      } else {
        this.deleteAllAnswersFromMessage(message, userID);
      }
    }
  }


  /**
   * Clears and deletes a specified channel.
   * 
   * This method retrieves all messages from the specified channel and deletes all answers associated with each message.
   * Finally, it adds the channel's path to the list of documents to be deleted.
   * 
   * @param {Channel} channel - The channel to be cleared and deleted.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  private async clearAndDeleteChannel(channel: Channel) {
    const messages = await getDocs(collection(this.firestore, channel.channelMessagesPath));
    for (let j = 0; j < messages.docs.length; j++) {
      const message = messages.docs[j];
      this.deleteAllAnswersFromMessage(message);
    }
    this.docsToDelete.push('/channels/' + channel.id);
  }


  /**
   * Deletes all chat references associated with a guest user.
   *
   * This method performs the following steps:
   * 1. Retrieves the chat IDs associated with the given user ID.
   * 2. Adds the paths of the chats to be deleted to the `docsToDelete` array.
   * 3. Iterates through all users and removes the chat IDs associated with the given user ID from each user's chat list.
   * 4. Updates the Firestore document for each user with the cleaned-up chat IDs.
   *
   * @param userID - The ID of the user whose chats are to be deleted.
   * @returns A promise that resolves when all chat references have been deleted and user documents have been updated.
   */
  private async deleteAllChatsWithGuest(userID: string) {
    const chatIDs = this.userservice.getUserByID(userID)?.chatIDs;
    if (chatIDs) {
      for (let i = 0; i < chatIDs.length; i++) {
        const chatID = chatIDs[i];
        this.docsToDelete.push('/chats/' + chatID);
      }
    }
    for (let i = 0; i < this.userservice.users.length; i++) {
      const user = this.userservice.users[i];
      const cleanedupChatIDs = user.chatIDs.filter((chatID) => !chatIDs?.includes(chatID));
      await updateDoc(doc(this.firestore, '/users/' + user.id), { chatIDs: cleanedupChatIDs });
    }
  }


  /**
   * Deletes all documents listed in the `docsToDelete` array from Firestore.
   * 
   * @private
   * @async
   * @returns {Promise<void>} A promise that resolves when all documents have been deleted.
   */
  private async deleteAllDocs() {
    for (let i = 0; i < this.docsToDelete.length; i++) {
      await deleteDoc(doc(this.firestore, this.docsToDelete[i]));
    }
    this.docsToDelete = [];
    setTimeout(() => { this.recalculateFireStoreData(); }, 3000);
  }


  /**
   * Recalculates Firestore data for all channels managed by the channel service.
   * 
   * This method iterates over all channels and performs the following operations:
   * 1. Skips the channel if it is marked as a default channel.
   * 2. Recalculates all messages for the current channel.
   * 3. Clears unknown users from the current channel.
   * 
   * @returns {Promise<void>} A promise that resolves when the recalculations and cleanups are complete.
   */
  async recalculateFireStoreData() {
    for (let i = 0; i < this.channelservice.channels.length; i++) {
      const channel = this.channelservice.channels[i];
      if (channel.defaultChannel) continue;
      await this.recalculateAllMessagesFormChannel(channel);
      await this.clearUnknowUsersFromChannel(channel);
    }
  }


  /**
   * Clears unknown users from a given channel.
   * 
   * This method filters out users from the channel's member list who are not recognized
   * or are not considered real users. If any unknown users are found, the channel's 
   * member list is updated in the Firestore database.
   * 
   * @param {Channel} channel - The channel from which to clear unknown users.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  async clearUnknowUsersFromChannel(channel: Channel) {
    const currentMembers = channel.memberIDs;
    let membersArrayNeedUpdate = false;
    let membersToRemove: string[] = [];
    const realMembers = currentMembers.filter((memberID) => {
      const user = this.userservice.getUserByID(memberID)
      if (!user || !isRealUser(user)) {
        membersArrayNeedUpdate = true;
        membersToRemove.push(memberID);
        return false;
      }
      return true;
    });
    if (membersArrayNeedUpdate) {
      console.warn('cleanupservice: Clearing unknown users from channel (' + channel.name + ')');
      await updateDoc(doc(this.firestore, 'channels/' + channel.id), { memberIDs: realMembers });
    }
  }


  /**
   * Recalculates all messages from a given channel.
   * 
   * This method retrieves all messages from the specified channel and recalculates
   * the answers for each message.
   * 
   * @param channel - The channel from which to recalculate messages.
   * @returns A promise that resolves when all messages have been recalculated.
   */
  async recalculateAllMessagesFormChannel(channel: Channel) {
    const messages = await getDocs(collection(this.firestore, channel.channelMessagesPath));
    for (let i = 0; i < messages.docs.length; i++) {
      const message = messages.docs[i];
      await this.recalculateAnswersFromMessage(message);
    }
  }


  /**
   * Recalculates the number of answers for a given message and updates the message document if the count has changed.
   *
   * @param message - The message document snapshot from which to recalculate the answers.
   * @returns A promise that resolves when the recalculation and potential update are complete.
   */
  async recalculateAnswersFromMessage(message: QueryDocumentSnapshot<DocumentData, DocumentData>) {
    const answersRef = collection(this.firestore, message.ref.path + '/answers');
    const answers = await getDocs(answersRef);
    const realAnswerCount = answers ? answers.size : 0;
    const currentAnswerCount = message.data()['answerCount'] ? message.data()['answerCount'] : 0;
    if (realAnswerCount !== currentAnswerCount) {
      console.warn('cleanupservice: Recalculating answers for message (' + message.ref.path + ')');
      updateDoc(doc(this.firestore, message.ref.path), { answerCount: realAnswerCount });
    }
  }
}
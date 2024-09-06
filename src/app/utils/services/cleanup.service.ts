import { inject, Injectable } from '@angular/core';
import { UsersService } from './user.service';
import { collection, deleteDoc, doc, Firestore, getDoc, getDocs, updateDoc } from '@angular/fire/firestore';
import { ChannelService } from './channel.service';
import { Channel } from '../../shared/models/channel.class';
import { Auth, signOut } from '@angular/fire/auth';
import { NavigationService } from './navigation.service';

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

  constructor() { }


  async logoutUser(): Promise<void> {
    await this.navigationservice.setChatViewObject(this.channelservice.defaultChannel);
    if (this.userservice.currentGuestUserID == '') {
      await signOut(this.firebaseauth);
    } else {
      const guestID = this.userservice.currentGuestUserID;
      this.userservice.clearCurrentUser();
      await this.deleteAllGuestContent(guestID);
    }
  }


  async deleteAllOfflineGuestContent() {
    for (let i = 0; i < this.userservice.users.length; i++) {
      const user = this.userservice.users[i];
      if (user.guest && !user.online) {
        await this.deleteAllGuestContent(user.id);
      }
    }
  }


  async deleteAllGuestContent(guestID: string) {
    for (let i = 0; i < this.channelservice.channels.length; i++) {
      const channel = this.channelservice.channels[i];
      if (channel.defaultChannel) continue;
      if (channel.creatorID === guestID) {
        this.clearAndDeleteChannel(channel);
      } else {
        await this.deleteAllMessagesFromChannel(channel, guestID);
      }
    }
    await this.deleteAllChatsWithGuest(guestID);
    console.warn('cleanupservice: All guest content deleted (' + guestID + ')');
    await deleteDoc(doc(this.firestore, '/users/' + guestID));
    await this.deleteAllDocs();
  }


  private async deleteAllAnswersFromMessage(message: any, guestID: string | undefined = undefined) {
    const answerRef = collection(this.firestore, message.ref.path + '/answers');
    if (answerRef) {
      const answers = await getDocs(answerRef);
      for (let k = 0; k < answers.docs.length; k++) {
        const answer = answers.docs[k];
        if (!guestID || answer.data()['creatorID'] === guestID) {
          this.docsToDelete.push(message.ref.path + '/answers/' + answer.id);
        }
      }
    }
    if (!guestID) this.docsToDelete.push(message.ref.path);
  }


  private async deleteAllMessagesFromChannel(channel: Channel, guestID: string) {
    const messages = await getDocs(collection(this.firestore, channel.channelMessagesPath));
    for (let j = 0; j < messages.docs.length; j++) {
      const message = messages.docs[j];
      if (message.data()['creatorID'] === guestID) {
        this.deleteAllAnswersFromMessage(message);
      } else {
        this.deleteAllAnswersFromMessage(message, guestID);
      }
    }
  }


  private async clearAndDeleteChannel(channel: Channel) {
    const messages = await getDocs(collection(this.firestore, channel.channelMessagesPath));
    for (let j = 0; j < messages.docs.length; j++) {
      const message = messages.docs[j];
      this.deleteAllAnswersFromMessage(message);
    }
    this.docsToDelete.push('/channels/' + channel.id);
  }


  private async deleteAllChatsWithGuest(guestID: string) {
    const chatIDs = this.userservice.getUserByID(guestID)?.chatIDs;
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


  private async deleteAllDocs() {
    for (let i = 0; i < this.docsToDelete.length; i++) {
      await deleteDoc(doc(this.firestore, this.docsToDelete[i]));
    }
    this.docsToDelete = [];
  }

}
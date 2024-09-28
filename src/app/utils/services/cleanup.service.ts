import { inject, Injectable, OnDestroy } from '@angular/core';
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

  constructor() {
    setTimeout(() => {
      this.markAllGuestsToDelete();
    }, 5000);
    setTimeout(() => {
      this.deleteAllGuestData();
    }, 10000);
  }


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


  async deleteAllGuestData() {
    const users = this.userservice.users;
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      if (user.guest) {
        if (!user.online) {
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


  async markAllGuestsToDelete() {
    const users = this.userservice.users;
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      if (user.guest) {
        if (user.online) {
          console.warn('cleanupservice: Marking guest for deletion (' + user.id + ')');
          await updateDoc(doc(this.firestore, '/users/' + user.id), { online: false, markedToDeleteAT: Date.now() });
        }
      }
    }
  }


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


  private async clearAndDeleteChannel(channel: Channel) {
    const messages = await getDocs(collection(this.firestore, channel.channelMessagesPath));
    for (let j = 0; j < messages.docs.length; j++) {
      const message = messages.docs[j];
      this.deleteAllAnswersFromMessage(message);
    }
    this.docsToDelete.push('/channels/' + channel.id);
  }


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


  private async deleteAllDocs() {
    for (let i = 0; i < this.docsToDelete.length; i++) {
      await deleteDoc(doc(this.firestore, this.docsToDelete[i]));
    }
    this.docsToDelete = [];
  }

}
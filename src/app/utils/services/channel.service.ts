/**
 * @file Channel Service
 * @description This service handles the addition of new channels to the database.
 * @author Bela Schramm
 */

import { inject, Injectable, OnDestroy } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  Firestore,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from '@angular/fire/firestore';
import { UsersService } from './user.service';
import { Channel } from '../../shared/models/channel.class';
import { Chat } from '../../shared/models/chat.class';
import { User } from '../../shared/models/user.class';
import { BehaviorSubject } from 'rxjs';

/**
 * @class ChannelService
 * @description Service that handles the retrieval and addition of channels to the database.
 * @author Bela Schramm
 */
@Injectable({
  providedIn: 'root',
})
export class ChannelService implements OnDestroy {
  public defaultChannel: Channel = new Channel({
    name: 'Willkommen',
    description: 'Defaultchannel',
    defaultChannel: true,
  });

  private subscribeUserListChange: any;

  private chatListChange = new BehaviorSubject<Chat[]>([]);
  public chatListChange$ = this.chatListChange.asObservable();

  public chats: Chat[] = [];
  private unsubChats: any = null;

  /**
   * @description Firestore instance.
   * @type {Firestore}
   */
  private firestore: Firestore = inject(Firestore);

  /**
   * @description Users service instance.
   * @type {UsersService}
   */
  private userservice: UsersService = inject(UsersService);

  /**
   * @description Unsubscribe function for the channels subscription.
   * @type {any}
   */
  private unsubChannels: any;

  /**
   * @description List of channels.
   * @type {Channel[]}
   */
  public channels: Channel[] = [this.defaultChannel];

  /**
   * @constructor
   * @description Constructor that subscribes to the channels collection.
   */
  constructor() {
    this.initChannelCollection();
    this.initChatCollection();
    this.subscribeUserListChange = this.userservice.changeUserList$.subscribe(
      () => {
        this.defaultChannel.update({
          members: this.userservice.getAllUserIDs(),
        });
      }
    );
  }

  private initChannelCollection(): void {
    this.unsubChannels = onSnapshot(
      collection(this.firestore, '/channels'),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            this.channels.push(new Channel(change.doc.data(), change.doc.id));
          }
          if (change.type === 'modified') {
            const channel = this.channels.find(
              (channel) => channel.id === change.doc.id
            );
            if (channel) channel.update(change.doc.data());
          }
          if (change.type === 'removed') {
            this.channels = this.channels.filter(
              (channel) => channel.id !== change.doc.id
            );
          }
        });
      }
    );
  }

  private initChatCollection(): void {
    this.unsubChats = onSnapshot(
      collection(this.firestore, '/chats'),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added')
            this.chats.push(
              new Chat(change.doc.data(), change.doc.id)
            );
          if (change.type === 'modified') {
            const chat = this.chats.find(
              (chat) => chat.id === change.doc.id
            );
            if (chat) chat.update(change.doc.data());
          }

          if (change.type === 'removed')
            this.chats = this.chats.filter(
              (chat) => chat.id !== change.doc.data()['id']
            );
        });
        this.chatListChange.next(this.chats);
      }
    );
  }

  getChatByID(chatID: string): Chat | undefined {
    return this.chats.find((chat) => chat.id === chatID);
  }

  getChatPartner(chat: Chat): User | undefined {
    if (this.userservice.currentUser) {
      if (chat.memberIDs[0] === this.userservice.currentUserID)
        return this.userservice.getUserByID(chat.memberIDs[1]);
      else return this.userservice.getUserByID(chat.memberIDs[0]);
    }
    return undefined;
  }

  async getChatWithUserByID(selectedUserID: string, createChat: boolean = true): Promise<Chat | undefined> {
    if (this.userservice.currentUser) {
      let selectedChat: Chat | undefined = undefined;
      if (this.userservice.currentUserID === selectedUserID)
        selectedChat = this.chats.find(
          (selectedChat) => selectedChat.memberIDs[0] === selectedUserID && selectedChat.memberIDs[1] === selectedUserID
        );
      else selectedChat = this.chats.find((selectedChat) => selectedChat.memberIDs.includes(selectedUserID) && selectedChat.memberIDs.includes(this.userservice.currentUserID));
      console.log(selectedChat)
      if (selectedChat) return selectedChat;
    }
    return;
  }

  async addChatWithUserOnFirestore(userID: string): Promise<string | undefined> {
    try {
      const chatRef = collection(this.firestore, '/chats');
      const chatObj = {
        memberIDs: [this.userservice.currentUserID, userID],
        createdAt: serverTimestamp(),
      };
      const chat = await addDoc(chatRef, chatObj);
      this.userservice.updateCurrentUserDataOnFirestore({
        chatIDs: [...(this.userservice.currentUser?.chatIDs || []), chat.id],
      });
      if (this.userservice.currentUserID !== userID) {
        const user = this.userservice.getUserByID(userID);
        let userChatIDs = user?.chatIDs;
        userChatIDs?.push(chat.id);
        console.log('other user chatid update ' + user + ' chatIDs:' + userChatIDs);
        this.userservice.updateUserDataOnFirestore(userID,{
          chatIDs: userChatIDs,
        });
      }
      return chat.id;
    } catch (error) {
      console.error(
        'userservice/chat: Error adding chat(' + (error as Error).message + ')'
      );
      return undefined;
    }
  }

  /**
   * @method addNewChannelToFirestore
   * @description Adds a new channel to the database.
   * @param {string} name - The name of the channel.
   * @param {string} description - The description of the channel.
   * @param {string[]} membersIDs - The ids of the members of the channel.
   */
  async addNewChannelToFirestore(name: string, description: string, membersIDs: string[]): Promise<boolean> {
    const newchannel = {
      name: name,
      description: description,
      memberIDs: membersIDs,
      createdAt: serverTimestamp(),
      creatorID: this.userservice.currentUserID,
    };
    const channelCollectionref = collection(this.firestore, '/channels');
    try {
      await addDoc(channelCollectionref, newchannel);
      return true;
    } catch (error) {
      console.error('ChannelService: addNewChannelToFirestore: error adding channel' + newchannel.name + ' # ', error);
      return false;
    }
  }

  /**
   * @method updateChannelOnFirestore
   * @description Updates a channel in the database.
   * @param {Channel} channel - The channel to update.
   * @param {Object} updateData - The data to update in the channel.
   * @param {string} updateData.name - The new name of the channel.
   * @param {string} updateData.description - The new description of the channel.
   * @param {string[]} updateData.memberIDs - The new member IDs of the channel.
   */
  async updateChannelOnFirestore(
    channel: Channel,
    updateData: { name?: string; description?: string; memberIDs?: string[] }
  ) {
    const channelDocRef = doc(this.firestore, '/channels', channel.id);
    try {
      await updateDoc(channelDocRef, updateData);
    } catch (error) {
      console.error('ChannelService: updateChannelOnFirestore: error updating channel ->', error);
    }
  }

   
  /**
   * Checks if a channel name is a duplicate of an existing channel name, optionally excluding the original channel name.
   * @param channelName - The name of the channel to check for duplicates.
   * @param originalChannelName - The original name of the channel, used to determine if the new name is a change.
   * @param originalChannelNameRequired - to difference when methode called by channel creation or edition.
   * @returns True if the channel name is a duplicate, false otherwise.
   */
  checkForDuplicateChannelName(channelName: string, originalChannelName: string, originalChannelNameRequired = true): boolean {
    const isDuplicate = this.channels.some((channel) => channel.name.toLowerCase() === channelName.toLowerCase());
    if(originalChannelNameRequired){
    const isChanged = channelName.toLowerCase() !== originalChannelName.toLowerCase();
    return isDuplicate && isChanged;  
    }else return isDuplicate;
  }

  /**
   * Lifecycle hook that is called when the component is about to be destroyed.
   * Unsubscribes from channels and unsubscribes from user list change subscription.
   */
  ngOnDestroy(): void {
    if (this.unsubChannels) this.unsubChannels();
    if (this.subscribeUserListChange)
      this.subscribeUserListChange.unsubscribe();
    if (this.unsubChats) this.unsubChats();
  }
}

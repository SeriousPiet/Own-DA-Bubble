/**
 * @file Channel Service
 * @description This service handles the addition of new channels to the database.
 * @author Bela Schramm
 */

import { inject, Injectable, OnDestroy } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDocs, onSnapshot, query, serverTimestamp, Timestamp, updateDoc, where, } from '@angular/fire/firestore';
import { UsersService } from './user.service';
import { Channel } from '../../shared/models/channel.class';
import { Chat } from '../../shared/models/chat.class';
import { User } from '../../shared/models/user.class';
import { BehaviorSubject } from 'rxjs';
import { Message } from '../../shared/models/message.class';
import { dabubbleBotId, getCollectionPath, isRealUser } from '../firebase/utils';

export type ActivChat = {
  chat: Chat;
  partner: User;
  unreadMessagesCount: number;
}

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

  public activeChats$ = new BehaviorSubject<ActivChat[]>([]);

  public chats: Chat[] = [];
  private unsubChats: any = null;
  private activeUserSubscription: any;

  private updateAllowed = false;

  private firestore: Firestore = inject(Firestore);
  private userservice: UsersService = inject(UsersService);
  private currentUserSubscription: any;
  private unsubChannels: any;
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
    this.currentUserSubscription = this.userservice.changeCurrentUser$.subscribe((type) => {
      if (type === 'login') {
        this.updateAllowed = true;
        setTimeout(() => {
          this.channels.forEach((channel) => { if (!channel.defaultChannel) this.calculateUnreadMessagesCount(channel); });
          this.chats.forEach((chat) => { if (this.userservice.currentUser?.chatIDs.includes(chat.id)) this.calculateUnreadMessagesCount(chat); });
          this.initActiveChatsStream();
        }, 1000);
      } else if (type === 'logout') {
        this.updateAllowed = false;
      }
    });
  }


  initActiveChatsStream(): void {
    if (this.activeUserSubscription) this.activeUserSubscription.unsubscribe();
    this.activeUserSubscription = this.userservice.currentUser?.changeUser$.subscribe((user) => {
      if (user) {
        this.updateActiveChatsStream();
      }
    });
  }


  updateActiveChatsStream(): void {
    this.activeChats$.next(this.chats
      .filter((chat) => this.userservice.currentUser?.chatIDs.includes(chat.id))
      .filter((chat) => this.chats.find((c) => c.id === chat.id))
      .map((chat) => ({
        chat,
        partner: this.getChatPartner(chat) as User,
        unreadMessagesCount: chat.unreadMessagesCount,
      }))
      .filter((chat) => chat.partner !== undefined && chat.partner.guest === false)
      .sort((a, b) => b.chat.createdAt.getTime() - a.chat.createdAt.getTime())
    );
  }


  /**
   * Calculates the number of unread messages in a given channel, chat, or message.
   * 
   * @param channel - The channel, chat, or message object for which to calculate unread messages.
   * @returns A promise that resolves when the unread messages count has been calculated and updated in the channel object.
   * 
   * @remarks
   * This method retrieves the last read message object for the given channel and calculates the number of messages
   * created after the last view time. It then updates the `unreadMessagesCount` property of the channel object.
   * 
   * @throws Will throw an error if the Firestore query fails.
   */
  public async calculateUnreadMessagesCount(channel: Channel | Chat | Message) {
    const lrm = this.userservice.getLastReadMessageObject(channel);
    const lastViewTime: Date = new Date();
    lastViewTime.setTime(lrm ? lrm.messageCreateAt : this.userservice.currentUser?.signupAt.getTime() || 0);
    const firestoreTimestamp = Timestamp.fromDate(lastViewTime);
    const collectionRef = collection(this.firestore, getCollectionPath(channel));
    const querySnapshot = await getDocs(
      query(collectionRef, where('createdAt', '>', lastViewTime))
    );
    let unreadMessagesCount = 0;
    const test = querySnapshot.forEach((doc) => {
      if (doc.data()['creatorID'] !== this.userservice.currentUserID) unreadMessagesCount++;
    });
    if (channel.unreadMessagesCount !== unreadMessagesCount) {
      channel.unreadMessagesCount = unreadMessagesCount;
      if (channel instanceof Chat) this.updateActiveChatsStream();
    }
  }


  /**
   * Initializes the channel collection by setting up a Firestore snapshot listener.
   * 
   * This method subscribes to changes in the '/channels' collection in Firestore.
   * It handles three types of changes:
   * - 'added': Adds a new channel to the local `channels` array.
   * - 'modified': Updates an existing channel in the local `channels` array and recalculates the unread messages count.
   * - 'removed': Removes a channel from the local `channels` array.
   * 
   * @private
   * @returns {void}
   */
  private initChannelCollection(): void {
    this.unsubChannels = onSnapshot(collection(this.firestore, '/channels'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const channel = new Channel(change.doc.data(), change.doc.id);
          this.channels.push(channel);
        }
        if (change.type === 'modified') {
          const channel = this.channels.find((channel) => channel.id === change.doc.id);
          if (channel) {
            channel.update(change.doc.data());
            if (this.updateAllowed) this.calculateUnreadMessagesCount(channel);
          }
        }
        if (change.type === 'removed') {
          this.channels = this.channels.filter((channel) => channel.id !== change.doc.id);
        }
      });
    });
  }


  /**
   * Initializes the chat collection by setting up a Firestore snapshot listener.
   * 
   * This method listens for changes in the '/chats' collection in Firestore and updates the local
   * `chats` array accordingly. It handles three types of changes:
   * 
   * - 'added': Adds a new chat to the `chats` array.
   * - 'modified': Updates an existing chat in the `chats` array and recalculates unread messages count if allowed.
   * - 'removed': Removes a chat from the `chats` array.
   * 
   * After processing the changes, it emits the updated `chats` array via the `chatListChange` subject.
   * 
   * @private
   * @returns {void}
   */
  private initChatCollection(): void {
    this.unsubChats = onSnapshot(collection(this.firestore, '/chats'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') this.chats.push(new Chat(change.doc.data(), change.doc.id));
        if (change.type === 'modified') {
          const chat = this.chats.find((chat) => chat.id === change.doc.id);
          if (chat) {
            chat.update(change.doc.data());
            if (this.updateAllowed) {
              this.calculateUnreadMessagesCount(chat);
            }
          }
        }
        if (change.type === 'removed') this.chats = this.chats.filter((chat) => chat.id !== change.doc.data()['id']);
      });
      this.chatListChange.next(this.chats);
    });
  }


  /**
   * Retrieves a chat by its unique identifier.
   *
   * @param chatID - The unique identifier of the chat to retrieve.
   * @returns The chat object if found, otherwise `undefined`.
   */
  getChatByID(chatID: string): Chat | undefined {
    return this.chats.find((chat) => chat.id === chatID);
  }


  /**
   * Retrieves the chat partner for a given chat.
   *
   * @param chat - The chat object containing member IDs.
   * @returns The User object of the chat partner if found, otherwise undefined.
   */
  getChatPartner(chat: Chat): User | undefined {
    if (this.userservice.currentUser) {
      if (chat.memberIDs[0] === this.userservice.currentUserID)
        return this.userservice.getUserByID(chat.memberIDs[1]);
      else return this.userservice.getUserByID(chat.memberIDs[0]);
    }
    return undefined;
  }


  /**
   * Retrieves a chat between the current user and a specified user by their ID.
   *
   * @param selectedUserID - The ID of the user to find the chat with.
   * @returns The chat object if found, otherwise `undefined`.
   */
  getChatWithUserByID(selectedUserID: string): Chat | undefined {
    if (this.userservice.currentUser) {
      let selectedChat: Chat | undefined = undefined;
      if (this.userservice.currentUserID === selectedUserID)
        selectedChat = this.chats.find(
          (selectedChat) => selectedChat.memberIDs[0] === selectedUserID && selectedChat.memberIDs[1] === selectedUserID
        );
      else selectedChat = this.chats.find((selectedChat) => selectedChat.memberIDs.includes(selectedUserID) && selectedChat.memberIDs.includes(this.userservice.currentUserID));
      if (selectedChat) return selectedChat;
    }
    return;
  }


  /**
   * Retrieves a chat with a user by their username.
   *
   * @param selectedUserName - The username of the user to get the chat with.
   * @returns The chat with the specified user, or `undefined` if the user is not found.
   */
  getChatWithUserByName(selectedUserName: string): Chat | undefined {
    const selectedUser = this.userservice.getUserByName(selectedUserName);
    if (selectedUser) return this.getChatWithUserByID(selectedUser.id);
    return;
  }


  /**
   * Retrieves a channel by its name.
   *
   * @param channelName - The name of the channel to retrieve.
   * @returns The channel object if found, otherwise `undefined`.
   */
  getChannelByName(channelName: string): Channel | undefined {
    return this.channels.find((channel) => channel.name === channelName) || undefined;
  }


  /**
   * Checks if the current user is a member of the specified channel by its name.
   *
   * @param {string} channel - The name of the channel to check.
   * @returns {boolean} - Returns `true` if the current user is a member of the channel, otherwise `false`.
   */
  ifCurrentUserMemberOfChannelByName(channel: string): boolean {
    const channelObj = this.getChannelByName(channel);
    if (channelObj) return channelObj.memberIDs.includes(this.userservice.currentUserID);
    return false;
  }


  /**
   * Adds a new chat with a specified user to Firestore.
   * 
   * This method creates a new chat document in the Firestore 'chats' collection,
   * including the current user's ID and the specified user's ID. It also updates
   * the current user's and the specified user's chat IDs in Firestore.
   * 
   * @param userID - The ID of the user to chat with.
   * @returns A promise that resolves to the chat ID if the chat is successfully created, or undefined if an error occurs.
   * 
   * @throws Will log an error message if there is an issue adding the chat to Firestore.
   */
  async addChatWithUserOnFirestore(userID: string): Promise<string | undefined> {
    try {
      const chatRef = collection(this.firestore, '/chats');
      const chatObj = { memberIDs: [this.userservice.currentUserID, userID], createdAt: serverTimestamp() };
      const chat = await addDoc(chatRef, chatObj);
      this.userservice.updateCurrentUserDataOnFirestore({ chatIDs: [...(this.userservice.currentUser?.chatIDs || []), chat.id] });
      if (this.userservice.currentUserID !== userID) {
        const user = this.userservice.getUserByID(userID);
        let userChatIDs = user?.chatIDs;
        userChatIDs?.push(chat.id);
        this.userservice.updateUserDataOnFirestore(userID, { chatIDs: userChatIDs });
      }
      return chat.id;
    } catch (error) {
      console.error('userservice/chat: Error adding chat(' + (error as Error).message + ')');
      return undefined;
    }
  }


  async addSelfChat(userID: string): Promise<string | undefined> {
    try {
      const chatRef = collection(this.firestore, '/chats');
      const chatObj = { memberIDs: [userID, userID], createdAt: serverTimestamp() };
      const chat = await addDoc(chatRef, chatObj);
      this.userservice.updateUserDataOnFirestore(userID, { chatIDs: [chat.id] });
      return chat.id;
    } catch (error) {
      console.error('userservice/chat: Error adding selfchat(' + (error as Error).message + ')');
      return undefined;
    }
  }


  /**
   * Adds a new channel to Firestore with the specified name, description, and member IDs.
   *
   * @param {string} name - The name of the new channel.
   * @param {string} description - A brief description of the new channel.
   * @param {string[]} membersIDs - An array of user IDs who will be members of the new channel.
   * @returns {Promise<boolean>} - A promise that resolves to `true` if the channel was added successfully, or `false` if there was an error.
   */
  async addNewChannelToFirestore(name: string, description: string, membersIDs: string[]): Promise<boolean> {
    const newchannel = {
      name: name,
      description: description,
      memberIDs: membersIDs,
      createdAt: serverTimestamp(),
      creatorID: this.userservice.currentUserID,
    };
    try {
      await addDoc(collection(this.firestore, '/channels'), newchannel);
      return true;
    } catch (error) {
      console.error('ChannelService: addNewChannelToFirestore: error adding channel' + newchannel.name + ' # ', error);
      return false;
    }
  }


  /**
   * Updates a channel document in Firestore with the provided update data.
   *
   * @param channel - The channel object containing the ID of the channel to update.
   * @param updateData - An object containing the fields to update. Possible fields are:
   *  - `name` (optional): The new name of the channel.
   *  - `description` (optional): The new description of the channel.
   *  - `memberIDs` (optional): An array of member IDs to update the channel with.
   * @returns A promise that resolves when the update operation is complete.
   * @throws Will log an error message if the update operation fails.
   */
  async updateChannelOnFirestore(channel: Channel, updateData: { name?: string; description?: string; memberIDs?: string[] }) {
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
    if (originalChannelNameRequired) {
      const isChanged = channelName.toLowerCase() !== originalChannelName.toLowerCase();
      return isDuplicate && isChanged;
    } else return isDuplicate;
  }


  /**
   * Lifecycle hook that is called when the component is about to be destroyed.
   * Unsubscribes from channels and unsubscribes from user list change subscription.
   */
  ngOnDestroy(): void {
    if (this.unsubChannels) this.unsubChannels();
    if (this.subscribeUserListChange) this.subscribeUserListChange.unsubscribe();
    if (this.unsubChats) this.unsubChats();
    if (this.currentUserSubscription) this.currentUserSubscription.unsubscribe();
    if (this.activeUserSubscription) this.activeUserSubscription.unsubscribe();
  }
}

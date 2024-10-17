import { inject, Injectable, OnDestroy, EventEmitter } from '@angular/core';
import { Channel } from '../../shared/models/channel.class';
import { Chat } from '../../shared/models/chat.class';
import { Message } from '../../shared/models/message.class';
import { BehaviorSubject } from 'rxjs';
import { UsersService } from './user.service';
import { User } from '../../shared/models/user.class';
import { ChannelService } from './channel.service';
import { ifChatWhitSelf } from '../firebase/utils';

type ChangeNavigation = 'unknow' | 'chatViewObjectSetAsChannel' | 'chatViewObjectSetAsChat' | 'threadViewObjectSet' | 'threadViewObjectCleared';
@Injectable({
  providedIn: 'root',
})
/**
 * NavigationService class provides methods and properties for managing navigation within the application.
 */
export class NavigationService {
  /**
   * Emits an event when navigation is complete.
   */
  public navigationComplete = new EventEmitter<void>();

  private navigationCompleteSubject = new BehaviorSubject<void>(undefined);
  public navigationComplete$ = this.navigationCompleteSubject.asObservable();

  private showProfileDetails = new BehaviorSubject<boolean>(false);
  public showProfileDetails$ = this.showProfileDetails.asObservable();

  private userService: UsersService = inject(UsersService);
  private channelService: ChannelService = inject(ChannelService);

  private previousUrl: string = '/';


  setPreviousUrl(url: string) {
    this.previousUrl = url;
  }

  getPreviousUrl(): string {
    return this.previousUrl;
  }


  /**
   * Sets the profile target by toggling the visibility of profile details.
   *
   * @param toggle - A boolean value indicating whether to show or hide the profile details.
   */
  setProfileTarget(toggle: boolean) {
    this.showProfileDetails.next(toggle);
  }


  /**
   * Observable that emits whenever a change occurs.
   */
  private changeSubject = new BehaviorSubject<ChangeNavigation>('unknow');
  public change$ = this.changeSubject.asObservable();


  /**
   * For chatview.
   * The main message list object and the path to its messages.
   */
  private _chatViewObject: Channel | Chat | undefined;
  get chatViewObject(): Channel | Chat {
    if (this._chatViewObject === undefined)
      return this.channelService.defaultChannel;
    else return this._chatViewObject;
  }
  private _chatViewPath: string | undefined;
  get chatViewPath(): string | undefined {
    return this._chatViewPath;
  }


  /**
   * For the threadview.
   * The path for message answers and the message object.
   */
  private _threadViewObject: Message | undefined;
  get threadViewObject(): Message | undefined {
    return this._threadViewObject;
  }

  private _threadViewPath: string | undefined;
  get threadViewPath(): string | undefined {
    return this._threadViewPath;
  }


  /**
   * Sets the main object (channel or chat) and updates the main message list path.
   *
   * @param object - The object to set as the main message object.
   * @returns void
   */
  async setChatViewObject(object: Channel | User | Chat): Promise<void> {

    if (object instanceof Channel) this.setChatViewObjectAsChannel(object);
    else if (object instanceof User) this.setChatViewObjectAsChat(object);
    else {
      this._chatViewObject = object;
      this._chatViewPath = object.chatMessagesPath;
      this.changeSubject.next('chatViewObjectSetAsChat');
      this.userService.isUserMemberOfCurrentChannel = true;
    }

    this.clearThreadViewObject();

    await new Promise((resolve) => setTimeout(resolve, 100));
    this.navigationCompleteSubject.next();
    if (this._chatViewObject === object || (this._chatViewObject instanceof Chat && object instanceof User)) {
      this.navigationComplete.emit();
    }
  }


  /**
   * Sets the chat view object as a channel and updates the chat view path.
   * 
   * @param {Channel} channel - The channel object to set as the chat view object.
   * @private
   */
  private setChatViewObjectAsChannel(channel: Channel): void {
    this._chatViewObject = channel;
    this._chatViewPath = channel.channelMessagesPath === '' ? undefined : channel.channelMessagesPath;
    this.userService.isUserMemberOfCurrentChannel = channel.memberIDs.includes(this.userService.currentUserID);
    this.changeSubject.next('chatViewObjectSetAsChannel');
  }


  /**
   * Sets the chat view object as a chat with the specified user.
   * 
   * This method attempts to retrieve an existing chat with the user by their ID.
   * If a chat exists, it sets the chat view object and path accordingly.
   * If no chat exists, it creates a new chat with the user on Firestore and subscribes
   * to chat list changes to update the chat view object and path once the new chat is available.
   * 
   * @param user - The user object for whom the chat view object is to be set.
   * @returns A promise that resolves when the chat view object is set.
   */
  private async setChatViewObjectAsChat(user: User): Promise<void> {
    const chat = await this.channelService.getChatWithUserByID(user.id);
    if (chat) {
      this._chatViewObject = chat;
      this._chatViewPath = chat.chatMessagesPath;
      this.userService.isUserMemberOfCurrentChannel = true;
    } else {
      const chatID = await this.channelService.addChatWithUserOnFirestore(user.id);
      if (chatID) {
        const chatListChangeSubscription = this.channelService.chatListChange$.subscribe(() => {
          const chat = this.channelService.chats.find((chat) => chat.id === chatID);
          if (chat) {
            this._chatViewObject = chat;
            this._chatViewPath = chat.chatMessagesPath;
            this.userService.isUserMemberOfCurrentChannel = true;
            setTimeout(() => chatListChangeSubscription.unsubscribe(), 100);
          }
        });
      }
    }
    this.changeSubject.next('chatViewObjectSetAsChat');
  }


  /**
   * Retrieves the chat partner as a User object.
   * 
   * @returns {User | undefined} The chat partner as a User object if found, otherwise undefined.
   * 
   * This method checks if the current chat view object is an instance of `Chat`. If the chat involves only the current user,
   * it returns the current user. Otherwise, it finds the chat partner's ID and retrieves the corresponding User object.
   */
  public getChatPartnerAsUser(): User | undefined {
    if (this.chatViewObject instanceof Chat) {
      if (this.chatViewObject.memberIDs[0] === this.chatViewObject.memberIDs[1]) return this.userService.currentUser;
      const chatPartnerID = this.chatViewObject.memberIDs.find((id) => id !== this.userService.currentUser?.id);
      return chatPartnerID ? this.userService.getUserByID(chatPartnerID) : undefined;
    }
    return undefined;
  }


  /**
   * Sets the thread message path and updates the current message.
   *
   * @param message - The message object containing the answer path.
   * @returns void
   */
  setThreadViewObject(message: Message): void {
    if (message.answerable) {
      this._threadViewPath = message.answerPath;
      this._threadViewObject = message;
      this.changeSubject.next('threadViewObjectSet');
    }
  }


  /**
   * Clears the thread by resetting the messageAnswersPath and message properties.
   */
  clearThreadViewObject(): void {
    this._threadViewPath = undefined;
    this._threadViewObject = undefined;
    this.changeSubject.next('threadViewObjectCleared');
  }


  // ############################################################################################################
  // methodes for search-functionality
  // ############################################################################################################


  /**
   * Gets the search context based on the current chat view object.
   *
   * If the chat view object is an instance of `Chat`:
   * - If there is a chat partner, returns `in:@{chatPartner}`.
   * - If it's a self-chat, returns `in:@{currentUser.name}`.
   *
   * If the chat view object is an instance of `Channel`, returns `in:#${channel.name}`.
   *
   * @returns The search context string, or an empty string if the chat view object is not a `Chat` or `Channel`.
   */
  getSearchContext(): string {
    if (this.chatViewObject instanceof Chat) {
      const chatPartner = this.getChatPartnerName();
      if (chatPartner) {
        return `in:@${chatPartner}`;
      } else if (ifChatWhitSelf(this.chatViewObject)) {
        return `in:@${this.userService.currentUser?.name}`;
      }
    } else if (this.chatViewObject instanceof Channel) {
      return `in:#${this.chatViewObject.name}`;
    }
    return '';
  }


  /**
   * Gets the name of the chat partner for the current chat view object.
   *
   * @returns The name of the chat partner, or `undefined` if the current chat view object is not a `Chat` instance or if the current user is the only member of the chat.
   */
  private getChatPartnerName(): string | undefined {
    if (this.chatViewObject instanceof Chat) {
      const chatPartnerID = this.chatViewObject.memberIDs.find(
        (id) => id !== this.userService.currentUser?.id
      );
      return chatPartnerID
        ? this.userService.getUserByID(chatPartnerID)?.name
        : undefined;
    }
    return undefined;
  }

/**
   * Returns the appropriate popover target based on whether the selected user is the current user.
   * @param selectedUser - The ID of the user whose popover target should be determined.
   * @returns 'profile-popover' if the selected user is the current user, 'popover-member-profile' otherwise.
   */
returnPopoverTarget(selectedUser: string) {
  if (selectedUser === this.userService.currentUser?.id) {
    return 'profile-popover';
  } else {
    return 'popover-member-profile';
  }
}


}

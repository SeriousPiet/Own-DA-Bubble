import { inject, Injectable } from '@angular/core';
import { Channel } from '../../shared/models/channel.class';
import { Chat } from '../../shared/models/chat.class';
import { Message } from '../../shared/models/message.class';
import { BehaviorSubject } from 'rxjs';
import { UsersService } from './user.service';
import { User } from '../../shared/models/user.class';

@Injectable({
  providedIn: 'root',
})
/**
 * NavigationService class provides methods and properties for managing navigation within the application.
 */
export class NavigationService {
  public defaultChannel: Channel = new Channel({
    name: 'Willkommen',
    description: 'Defaultchannel',
    defaultChannel: true,
  });


  constructor() {
    this.userService.changeUserList$.subscribe(() => {
      this.defaultChannel.update({ members: this.userService.getAllUserIDs() });
    });
  }


  /**
   * The user service for handling user-related operations.
   */
  private userService = inject(UsersService);


  /**
   * Observable that emits whenever a change occurs.
   */
  private changeSubject = new BehaviorSubject<string>('');
  public change$ = this.changeSubject.asObservable();


  /**
   * For chatview.
   * The main message list object and the path to its messages.
   */
  private _chatViewObject: Channel | Chat | undefined;
  get chatViewObject(): Channel | Chat {
    if (this._chatViewObject) return this._chatViewObject;
    else return this.defaultChannel;
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
   * Sets the main message object and updates the main message list path.
   * To executed from WorkspacemenuComponent.
   *
   * @param object - The object to set as the main message object.
   * @returns void
   */
  async setChatViewObject(object: Channel | User): Promise<void> {
    if (object instanceof Channel) {
      this._chatViewObject = object;
      this._chatViewPath = object.channelMessagesPath;
      console.warn('Navigationservice: setChatViewObject: Channel ' + object.name + ' ' + this._chatViewPath);
    } else {
      const chat = await this.userService.getChatWithUserByID(object.id);
      if (chat) {
        this._chatViewObject = chat;
        this._chatViewPath = chat.chatMessagesPath;
        console.warn('Navigationservice: setChatViewObject: Chat with ' + object.name + ' ' + this._chatViewPath);
      }
    }
    this.clearThread();
    this.changeSubject.next('chatViewObjectSet');
  }


  /**
   * Checks if the main message object is an instance of the Channel class.
   * @returns {boolean} True if the main message object is a Channel, false otherwise.
   */
  ifMainMessageObjectIsChannel(): boolean {
    return this._chatViewObject instanceof Channel;
  }


  /**
   * Checks if the main message object is of type Chat.
   *
   * @returns {boolean} True if the main message object is of type Chat, false otherwise.
   */
  ifMainMessageObjectIsChat(): boolean {
    return this._chatViewObject instanceof Chat;
  }


  /**
   * Sets the thread message path and updates the current message.
   *
   * @param message - The message object containing the answer path.
   * @returns void
   */
  setThreadViewObject(message: Message): void {
    this._threadViewPath = message.answerPath;
    this._threadViewObject = message;
    this.changeSubject.next('message');
    console.warn(
      'Navigationservice: setThreadViewObject to ' + message.answerPath
    );
  }


  /**
   * Clears the thread by resetting the messageAnswersPath and message properties.
   */
  private clearThread(): void {
    this._threadViewPath = undefined;
    this._threadViewObject = undefined;
    console.warn('Navigationservice: clearThread');
  }


  // ############################################################################################################
  // methodes for search-functionality
  // ############################################################################################################


  getSearchContext(): string {
    if (this.chatViewObject instanceof Chat) {
      const chatPartner = this.getChatPartnerName();
      return chatPartner ? `in:@${chatPartner}` : '';
    } else if (this.chatViewObject instanceof Channel) {
      return `in:#${this.chatViewObject.name}`;
    }
    return '';
  }


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
}

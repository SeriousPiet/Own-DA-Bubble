import { Injectable } from '@angular/core';
import { Channel } from '../../shared/models/channel.class';
import { Chat } from '../../shared/models/chat.class';
import { Message } from '../../shared/models/message.class';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
/**
 * NavigationService class provides methods and properties for managing navigation within the application.
 */
export class NavigationService {


  /**
   * Observable that emits whenever a change occurs.
  */
  private changeSubject = new BehaviorSubject<string>('');
  public change$ = this.changeSubject.asObservable();


  /**
   * The main message list object and the path to its messages.
   */
  public mainMessageListObject: Channel | Chat | undefined;

  public mainMessageListPath: string | undefined;


  /**
   * The path for message answers and the message object.
   */
  public message: Message | undefined;

  public messageAnswersPath: string | undefined;


  /**
   * Sets the main message object and updates the main message list path.
   * To executed from WorkspacemenuComponent.
   * 
   * @param object - The object to set as the main message object.
   * @returns void
   */
  setMainMessageObject(object: Channel | Chat): void {
    this.mainMessageListObject = object;
    if (object instanceof Channel) {
      this.mainMessageListPath = object.channelMessagesPath;
      console.warn('Navigationservice: setMainMessageObject: Channel ' + object.name);
    } else {
      this.mainMessageListPath = object.chatMessagesPath;
      console.warn('Navigationservice: setMainMessageObject: Chat ' + object.memberIDs);
    }
    this.clearThread();
    this.changeSubject.next('mainMessageList');
  }


  /**
   * Checks if the main message object is an instance of the Channel class.
   * @returns {boolean} True if the main message object is a Channel, false otherwise.
   */
  ifMainMessageObjectIsChannel(): boolean {
    return this.mainMessageListObject instanceof Channel;
  }


  /**
   * Checks if the main message object is of type Chat.
   * 
   * @returns {boolean} True if the main message object is of type Chat, false otherwise.
   */
  ifMainMessageObjectIsChat(): boolean {
    return this.mainMessageListObject instanceof Chat;
  }


  /**
   * Sets the thread message path and updates the current message.
   * 
   * @param message - The message object containing the answer path.
   * @returns void
   */
  setThreadMessagePath(message: Message): void {
    this.messageAnswersPath = message.answerPath;
    this.message = message;
    this.changeSubject.next('message');
    console.warn('Navigationservice: setThreadMessagePath to ' + message.answerPath);
  }


  /**
   * Clears the thread by resetting the messageAnswersPath and message properties.
   */
  private clearThread(): void {
    this.messageAnswersPath = undefined;
    this.message = undefined;
    console.warn('Navigationservice: clearThread');
  }

}

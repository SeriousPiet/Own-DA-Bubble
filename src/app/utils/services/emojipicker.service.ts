import { Injectable } from '@angular/core';

type EmojiUse = {
  emoji: string;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class EmojipickerService {

  private emojipickerElement: any = null;
  private emojiMart: any = null;
  private currentCallBackFunction: any = null;
  private userEmojis: EmojiUse[] = [];
  private userID: string = '';
  private standartEmojis: EmojiUse[] = [
    { emoji: '😊', count: 0 },
    { emoji: '😂', count: 0 },
    { emoji: '😍', count: 0 },
    { emoji: '😭', count: 0 },
    { emoji: '😒', count: 0 },
    { emoji: '😔', count: 0 },
    { emoji: '😘', count: 0 },
    { emoji: '😩', count: 0 },
    { emoji: '😏', count: 0 },
    { emoji: '😉', count: 0 },
    { emoji: '👍', count: 0 }
  ];


  /**
   * Loads the user's emojis from local storage.
   * 
   * @param userID - The unique identifier of the user.
   * @returns A promise that resolves when the user's emojis have been loaded.
   */
  async loadUserEmojis(userID: string): Promise<void> {
    this.userID = userID;
    let savedUserEmojis = await localStorage.getItem(userID + '-emojis');
    if (savedUserEmojis) {
      this.userEmojis = JSON.parse(savedUserEmojis);
      this.userEmojis.sort((a, b) => b.count - a.count);
    }
  }


  /**
   * Saves the user's emojis to the local storage.
   * The emojis are stored as a JSON string with a key that combines the user ID and '-emojis'.
   *
   * @returns {void}
   */
  saveUserEmojis(): void {
    localStorage.setItem(this.userID + '-emojis', JSON.stringify(this.userEmojis));
  }


  /**
   * Adds an emoji to the user's list of emojis. If the emoji already exists in the list,
   * increments its count. Otherwise, adds the emoji to the list with a count of 1.
   *
   * @param emoji - The emoji to be added to the user's list of emojis.
   * @returns void
   */
  addEmojiToUserEmojis(emoji: string): void {
    let emojiIndex = this.userEmojis.findIndex(e => e.emoji === emoji);
    if (emojiIndex === -1) {
      this.userEmojis.push({ emoji: emoji, count: 1 });
    } else {
      this.userEmojis[emojiIndex].count++;
    }
    this.userEmojis.sort((a, b) => b.count - a.count);
    this.saveUserEmojis();
  }


  /**
   * Retrieves an array of the most used emojis by the user.
   *
   * @param arrayLength - The number of top used emojis to return.
   * @returns An array of the most used emojis as strings.
   */
  getMostUsedEmojis(arrayLength: number): string[] {
    let emojis = [...this.userEmojis, ...this.standartEmojis];
    return emojis.slice(0, arrayLength).map(emoji => emoji.emoji);
  }


  /**
   * Retrieves the popover element for the emoji picker and sets up the necessary event listeners.
   * If the `emojipickerElement` is not already defined, it will be assigned by querying the DOM
   * for an element with the ID 'popover-emoji-picker'. The first child of this element is assumed
   * to be the emoji picker component (`emojiMart`), and an event listener for the 'clickEmoji' event
   * is added to handle emoji clicks.
   *
   * @returns {void}
   */
  getPopoverElement(): void {
    if (!this.emojipickerElement) {
      this.emojipickerElement = document.getElementById('popover-emoji-picker');
      this.emojiMart = this.emojipickerElement.firstElementChild;
      this.emojiMart.addEventListener('clickEmoji', (event: any) => {
        this.handleEmojiClick(event);
      });
    }
  }


  /**
   * Handles the emoji click event.
   * 
   * @param event - The event object containing the emoji data.
   * 
   * This method extracts the native emoji from the event object and invokes the 
   * current callback function with the emoji as an argument. After invoking the 
   * callback, it resets the callback function to null and hides the emoji picker.
   */
  handleEmojiClick(event: any) {
    const emoji = `${event.emoji.native}`;
    if (this.currentCallBackFunction) {
      this.currentCallBackFunction(emoji);
      this.currentCallBackFunction = null;
    }
    this.hidePicker();
  }


  /**
   * Displays the emoji picker popover and sets the callback function to handle the selected emoji.
   *
   * @param callbackFunction - The function to be called when an emoji is selected.
   */
  showPicker(callbackFunction: any) {
    this.getPopoverElement();
    this.currentCallBackFunction = callbackFunction;
    this.emojipickerElement.showPopover();
  }


  /**
   * Hides the emoji picker popover.
   *
   * This method hides the popover element associated with the emoji picker.
   */
  hidePicker() {
    this.emojipickerElement.hidePopover();
  }
}

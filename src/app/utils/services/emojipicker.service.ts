import { Injectable, OnInit } from '@angular/core';

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
  private lastUsedEmoji: string = '';


  constructor() {   }


  async loadUserEmojis(userID: string): Promise<void> {
    this.userID = userID;
    let savedUserEmojis = await localStorage.getItem(userID + '-emojis');
    if (savedUserEmojis) {
      this.userEmojis = JSON.parse(savedUserEmojis);
    }
  }


  saveUserEmojis(): void {
    localStorage.setItem(this.userID + '-emojis', JSON.stringify(this.userEmojis));
  }


  addEmojiToUserEmojis(emoji: string): void {
    console.log('addEmojiToUserEmojis', emoji);
    this.lastUsedEmoji = emoji;
    let emojiIndex = this.userEmojis.findIndex(e => e.emoji === emoji);
    if (emojiIndex === -1) {
      this.userEmojis.push({emoji: emoji, count: 1});
    } else {
      this.userEmojis[emojiIndex].count++;
    }
    this.saveUserEmojis();
  }


  getMostUsedEmojis(arrayLength: number): string[] {
    let emojis = this.userEmojis.sort((a, b) => b.count - a.count);
    return emojis.slice(0, arrayLength).map(emoji => emoji.emoji);
  }


  getPopoverElement(): void {
    if (!this.emojipickerElement) {
      this.emojipickerElement = document.getElementById('popover-emoji-picker');
      this.emojiMart = this.emojipickerElement.firstElementChild;
      this.emojiMart.addEventListener('clickEmoji', (event: any) => {
        this.handleEmojiClick(event);
      });
    }
  }


  handleEmojiClick(event: any) {
    const emoji = `${event.emoji.native}`;
    if (this.currentCallBackFunction) {
      this.currentCallBackFunction(emoji);
      this.currentCallBackFunction = null;
    }
    this.hidePicker();
  }


  showPicker(callbackFunction: any) {
    this.getPopoverElement();
    this.currentCallBackFunction = callbackFunction;
    this.emojipickerElement.showPopover();
  }


  hidePicker() {
    this.emojipickerElement.hidePopover();
  }
}

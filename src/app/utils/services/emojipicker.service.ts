import { Injectable, OnInit } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmojipickerService {

  private emojipickerElement: any = null;
  private emojiMart: any = null;
  private currentCallBackFunction: any = null;


  constructor() { }


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

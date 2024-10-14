import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-message-date',
  standalone: true,
  imports: [],
  templateUrl: './message-date.component.html',
  styleUrl: './message-date.component.scss'
})
export class MessageDateComponent {

  messageDate: Date | string = ''

  @Input() set date(date: Date) {
    this.formatDate(date);
  };

  /**
   * Formats the provided date and returns the formatted date string.
   * If the formatted date matches the current date, returns the string "Heute" (German for "Today").
   * Otherwise, returns the formatted date string.
   *
   * @param date - The date to be formatted.
   * @returns The formatted date string.
   */
  formatDate(date: Date) {
    let formatedMessageDate = date.toLocaleString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    if (formatedMessageDate == this.isToday()) return this.messageDate = "Heute";
    else {
      return this.messageDate = formatedMessageDate;
    }
  }


  /**
   * Returns the formatted date string for the current date.
   * The date is formatted as a long weekday, day, and month in German locale.
   * Used in methode formatDate to check if the formatted date matches the current date.
   * @returns The formatted date string for the current date.
   */
  isToday() {
    const today = new Date();
    let formatedTodaysDate = today.toLocaleString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    return formatedTodaysDate;
  }

}



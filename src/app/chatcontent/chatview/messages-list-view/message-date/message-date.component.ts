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

  formatDate(date: Date) {
    let formatedMessageDate = date.toLocaleString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    if (formatedMessageDate == this.isToday()) return this.messageDate = "Heute";
    else {
      return this.messageDate = formatedMessageDate;
    }
  }

  isToday() {
    const today = new Date();
    let formatedTodaysDate = today.toLocaleString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    return formatedTodaysDate;
  }

}



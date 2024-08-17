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

  @Input() set date(date: Date | string) {
    this.formatDate(date);
    console.log(date)
  };

  formatDate(date: Date | string) {
    if (date == this.isToday()) return this.messageDate = "Heute";
    else {
      return this.messageDate = date.toLocaleString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    }
  }



  isToday() {
    const today = new Date();
    return today
  }




}



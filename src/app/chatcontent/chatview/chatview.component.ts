import { Component, OnInit } from '@angular/core';
import { MessageDateComponent } from './message-date/message-date.component';
import { MessageTextareaComponent } from '../message-textarea/message-textarea.component';
import { CommonModule } from '@angular/common';
import { MessageComponent } from './message/message.component';

@Component({
  selector: 'app-chatview',
  standalone: true,
  imports: [MessageDateComponent, MessageComponent, MessageTextareaComponent, CommonModule],
  templateUrl: './chatview.component.html',
  styleUrl: './chatview.component.scss'
})
export class ChatviewComponent implements OnInit {

  messagefromUser = true;

  ngOnInit(): void {
    
  }
}

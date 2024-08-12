import { Component, OnInit } from '@angular/core';
import { MessageDateComponent } from './message-date/message-date.component';
import { MessageTextareaComponent } from '../message-textarea/message-textarea.component';
import { CommonModule } from '@angular/common';
import { MessageComponent } from './message/message.component';
import { PopoverChannelEditorComponent } from './popover-chatview/popover-channel-editor/popover-channel-editor.component';
import { PopoverChannelMemberOverviewComponent } from './popover-chatview/popover-channel-member-overview/popover-channel-member-overview.component';

@Component({
  selector: 'app-chatview',
  standalone: true,
  imports: [CommonModule, MessageDateComponent, MessageComponent, MessageTextareaComponent, PopoverChannelEditorComponent, PopoverChannelMemberOverviewComponent  ],
  templateUrl: './chatview.component.html',
  styleUrl: './chatview.component.scss'
})
export class ChatviewComponent implements OnInit {

  messagefromUser = true;

  ngOnInit(): void {
    
  }
}

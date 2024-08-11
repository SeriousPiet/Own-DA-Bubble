import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { WorkspacemenuComponent } from './workspacemenu/workspacemenu.component';
import { ChatviewComponent } from './chatview/chatview.component';
import { ThreadviewComponent } from './threadview/threadview.component';
import { AddchannelComponent } from './addchannel/addchannel.component';

@Component({
  selector: 'app-chatcontent',
  standalone: true,
  imports: [
    HeaderComponent,
    WorkspacemenuComponent,
    ChatviewComponent,
    ThreadviewComponent,
    WorkspacemenuComponent,
    AddchannelComponent,
  ],
  templateUrl: './chatcontent.component.html',
  styleUrl: './chatcontent.component.scss',
})
export class ChatcontentComponent {
  ngOnInit() {
    document
      .getElementsByClassName('hide_show_wsm')[0]
      .addEventListener('click', () => this.wsmVisibility());
  }

  wsmVisibility() {
    const wsm = document.getElementsByClassName('workspace-menu');
    wsm[0].classList.toggle('hidden');
  }
}

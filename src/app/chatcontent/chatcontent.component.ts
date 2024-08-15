import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { WorkspacemenuComponent } from './workspacemenu/workspacemenu.component';
import { ChatviewComponent } from './chatview/chatview.component';
import { ThreadviewComponent } from './threadview/threadview.component';
import { AddchannelComponent } from './workspacemenu/addchannel/addchannel.component';
import { AddUserToChannelComponent } from './workspacemenu/addchannel/add-user-to-channel/add-user-to-channel.component';

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
    AddUserToChannelComponent,
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

  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  get buttonText(): string {
    return this.isMenuOpen
      ? 'Workspace-Menü öffnen'
      : 'Workspace-Menü schließen';
  }

  wsmVisibility() {
    const wsm = document.getElementsByClassName('workspace-menu');
    wsm[0].classList.toggle('hidden');
  }
}

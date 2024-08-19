import { Component, inject } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { WorkspacemenuComponent } from './workspacemenu/workspacemenu.component';
import { ChatviewComponent } from './chatview/chatview.component';
import { ThreadviewComponent } from './threadview/threadview.component';
import { AddchannelComponent } from './workspacemenu/addchannel/addchannel.component';
import { AddUserToChannelComponent } from './workspacemenu/addchannel/add-user-to-channel/add-user-to-channel.component';
import { NavigationService } from '../utils/services/navigation.service';

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
  isWorkspaceMenuVisible = true;

  navigationService = inject(NavigationService);

  toggleWorkspaceMenu() {
    this.isWorkspaceMenuVisible = !this.isWorkspaceMenuVisible;
    const chatContent = document.querySelector('.chatcontent') as HTMLElement;
    const workspaceMenu = document.querySelector(
      '.workspace-menu'
    ) as HTMLElement;

    if (this.isWorkspaceMenuVisible) {
      chatContent.classList.remove('menu-hidden');
      workspaceMenu.style.display = 'block';
      workspaceMenu.classList.remove('hidden');
      workspaceMenu.classList.add('visible');
    } else {
      chatContent.classList.add('menu-hidden');
      workspaceMenu.classList.remove('visible');
      workspaceMenu.classList.add('hidden');
      setTimeout(() => {
        workspaceMenu.style.display = 'none';
      }, 125);
    }
  }
}

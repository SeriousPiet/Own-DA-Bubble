import { Routes } from '@angular/router';
import { ChatcontentComponent } from './chatcontent/chatcontent.component';
import { LoginComponent } from './start/login/login.component';
import { SignupComponent } from './start/signup/signup.component';
import { ChooesavatarComponent } from './start/chooesavatar/chooesavatar.component';
import { WorkspacemenuComponent } from './chatcontent/workspacemenu/workspacemenu.component';
import { ChatthreadviewComponent } from './examples/chatthreadview/chatthreadview.component';
import { ShowcaseComponent } from './examples/showcase/showcase.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'chatcontent', component: ChatcontentComponent },
  { path: 'workspaceMenu', component: WorkspacemenuComponent },
  { path: 'chatthreadtest', component: ChatthreadviewComponent },
  { path: 'chooseavatar', component: ChooesavatarComponent },
  { path: 'showcase', component: ShowcaseComponent },
];

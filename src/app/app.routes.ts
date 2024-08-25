import { Routes } from '@angular/router';
import { ChatcontentComponent } from './chatcontent/chatcontent.component';
import { LoginComponent } from './start/login/login.component';
import { SignupComponent } from './start/signup/signup.component';
import { ChooesavatarComponent } from './start/chooesavatar/chooesavatar.component';
import { WorkspacemenuComponent } from './chatcontent/workspacemenu/workspacemenu.component';
import { ChatthreadviewComponent } from './examples/chatthreadview/chatthreadview.component';
import { ShowcaseComponent } from './examples/showcase/showcase.component';
import { currentUserExistsGuard } from './utils/guards/current-user-exists.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'chatcontent', component: ChatcontentComponent, canActivate: [currentUserExistsGuard] },
  { path: 'workspaceMenu', component: WorkspacemenuComponent },
  { path: 'chooseavatar', component: ChooesavatarComponent },
  // for debug only ----------------------------------------------
  { path: 'chatthreadtest', component: ChatthreadviewComponent },
  { path: 'showcase', component: ShowcaseComponent },
  // -----------------------------------------------------------
];

import { Routes } from '@angular/router';
import { ChatcontentComponent } from './chatcontent/chatcontent.component';
import { LoginComponent } from './start/login/login.component';
import { SignupComponent } from './start/signup/signup.component';
import { currentUserExistsGuard } from './utils/guards/current-user-exists.guard';
import { ImprintComponent } from './start/imprint/imprint.component';
import { PolicyComponent } from './start/policy/policy.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'imprint', component: ImprintComponent },
  { path: 'policy', component: PolicyComponent },
  {
    path: 'chatcontent',
    component: ChatcontentComponent,
    canActivate: [currentUserExistsGuard],
  },
];

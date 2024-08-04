import { Routes } from '@angular/router';
import { StartComponent } from './start/start.component';
import { ChatcontentComponent } from './chatcontent/chatcontent.component';

export const routes: Routes = [
    { path: '', component: StartComponent },
    { path: 'chatcontent' , component: ChatcontentComponent }
];

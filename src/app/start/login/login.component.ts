import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { UsersService } from '../../utils/services/user.service';
import { ChannelService } from '../../utils/services/channel.service';
import { MessageService } from '../../utils/services/message.service';
import { Channel } from '../../shared/models/channel.class';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  // für service debug ====================================================

  public channelservice = inject(ChannelService);
  public messageservice = inject(MessageService);

  public name: string = '';
  public description: string = '';

  addNewChannel() {
    this.channelservice.addNewChannelToFirestore(this.name, this.description, this.userservice.getAllUserIDs());
  }

  public messagecontent = '';

  addMessageToChannel(channelNumber: number) {
    this.messageservice.addNewMessageToChannel(this.channelservice.channels[channelNumber], this.messagecontent);
  }

  public currentChannel: Channel | undefined = undefined;

  // ======================================================================

  public userservice = inject(UsersService);
  private router: Router = inject(Router);

  loginForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.email,
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });


  submitLoginForm(event: Event) {
    event.preventDefault();
    const email = this.loginForm.value.email || '';
    const password = this.loginForm.value.password || '';
    this.userservice.loginUser(email, password)
      .then(() => {
        this.router.navigate(['/chatcontent']);
      })
      .catch((error) => {
        console.error('Error logging in:', error);
      });
  }

}

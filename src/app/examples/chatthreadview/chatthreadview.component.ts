import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Channel } from '../../shared/models/channel.class';
import { Chat } from '../../shared/models/chat.class';
import { Message } from '../../shared/models/message.class';
import { NavigationService } from '../../utils/services/navigation.service';
import { MessageService } from '../../utils/services/message.service';
import { ChannelService } from '../../utils/services/channel.service';
import { UsersService } from '../../utils/services/user.service';
import { MessageviewexampleComponent } from '../messageviewexample/messageviewexample.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';
import { User } from '../../shared/models/user.class';

@Component({
  selector: 'app-chatthreadview',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    MessageviewexampleComponent,
  ],
  templateUrl: './chatthreadview.component.html',
  styleUrl: './chatthreadview.component.scss'
})
export class ChatthreadviewComponent {

  public channelservice = inject(ChannelService);
  public messageservice = inject(MessageService);
  public userservice = inject(UsersService);
  public navigationService = inject(NavigationService);
  private storage = getStorage();

  ngOnInit(): void {
    this.navigationService.change$.subscribe((change) => {
      this.cdr.detectChanges();
    });
  }

  constructor(private cdr: ChangeDetectorRef) { }

  public name: string = '';
  public description: string = '';
  public newemail: string = '';
  public username: string = '';

  getTitle(object: Channel | Chat | Message | undefined): string {
    if (object instanceof Channel) return object.name;
    if (object instanceof Message) return 'Thread from ' + this.userservice.getUserByID(object.creatorID)?.name;
    if (object instanceof Chat) return 'Chat with ' + this.getChatPartner(object);
    return '';
  }

  getChatPartner(object: Chat): string | undefined {
    const chatPartnerID = object.memberIDs.find(id => id !== this.userservice.currentUser?.id);
    if (chatPartnerID) return this.userservice.getUserByID(chatPartnerID)?.name;
    return 'Unknown Partner';
  }

  addNewChannel() {
    this.channelservice.addNewChannelToFirestore(this.name, this.description, this.userservice.getAllUserIDs());
  }

  public messagecontent = '';

  addMessageToChannel(channelNumber: number) {
    this.messageservice.addNewMessageToCollection(this.channelservice.channels[channelNumber], this.messagecontent);
  }

  addMessageTopath() {
    if (this.navigationService.chatViewPath) {
      this.messageservice.addNewMessageToCollection(this.navigationService.chatViewObject, this.messagecontent);
    }
  }

  updateChannel(channelNumber: number) {
    this.channelservice.updateChannelOnFirestore(this.channelservice.channels[channelNumber], { memberIDs: [this.userservice.getAllUserIDs()[0]], description: this.description, name: this.name });
  }

  setCurrentChannel(newChannel: Channel) {
    this.navigationService.setChatViewObject(newChannel);
  }

  public imgFile: File | null = null;


}

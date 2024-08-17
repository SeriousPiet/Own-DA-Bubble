import { ChangeDetectorRef, Component, inject, Input } from '@angular/core';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { NavigationService } from '../../../../utils/services/navigation.service';
import { Message } from '../../../../shared/models/message.class';
import { MessageService } from '../../../../utils/services/message.service';
import { UsersService } from '../../../../utils/services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})
export class MessageComponent {
  public userService = inject(UsersService);
  public navigationService = inject(NavigationService);
  public messageService = inject(MessageService);

  @Input() messageData: any;
  @Input() set messageWriter(messageWriterID:string){
    this.checkMessageWriterID(messageWriterID);
  }

  messagefromUser = false;

  hasRection = true;

  checkMessageWriterID(messageWriterID: string){
    if(messageWriterID == this.userService.currentUser?.id){
      this.messagefromUser = true;
    }
  }


  constructor(private cdr: ChangeDetectorRef) {
  }












}

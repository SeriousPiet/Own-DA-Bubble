import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, inject, Input, OnDestroy, OnInit, ViewChild, } from '@angular/core';
import { MessageComponent } from './message/message.component';
import { MessageDateComponent } from './message-date/message-date.component';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { Message } from '../../../shared/models/message.class';
import { MessageGreetingComponent } from './message-greeting/message-greeting.component';
import { CommonModule, Time } from '@angular/common';
import { Subscription } from 'rxjs';
import { SearchService } from '../../../utils/services/search.service';
import { Channel } from '../../../shared/models/channel.class';
import { Chat } from '../../../shared/models/chat.class';
import { NavigationService } from '../../../utils/services/navigation.service';
import { UsersService } from '../../../utils/services/user.service';
import { LastReadMessage, User } from '../../../shared/models/user.class';
import { ChannelService } from '../../../utils/services/channel.service';

@Component({
  selector: 'app-messages-list-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MessageComponent,
    MessageDateComponent,
    MessageGreetingComponent,
    CommonModule,
  ],
  templateUrl: './messages-list-view.component.html',
  styleUrl: './messages-list-view.component.scss',
})
export class MessagesListViewComponent implements OnInit, OnDestroy {
  private firestore = inject(Firestore);
  public navigationService = inject(NavigationService);
  public userService = inject(UsersService);
  public channelService = inject(ChannelService);
  private currentUserSubscription: any;
  private unsubMessages: any = null;
  public messages: Message[] = [];
  public messagesDates: Date[] = [];
  public noMessagesAvailable = true;
  public messageEditorOpen = false;
  public newMessagesSeparatorIndex = -1;
  private newCollectionIsSet = false;
  private currentCollection!: Channel | Chat | Message;
  private collectionLRM: LastReadMessage | undefined;

  @ViewChild('newmessageseparator', { static: false }) newMessageSeparator!: ElementRef;

  @Input() set currentObject(currentObject: Channel | Chat | Message) {
    this.currentCollection = currentObject;
    this.updateLastReadMessage();
  }

  @Input()
  set messagesPath(value: string | undefined) {
    this.messages = [];
    this.messagesDates = [];
    this.subscribeMessages(value);
    this.messageEditorOpen = false;
    this.newMessagesSeparatorIndex = -1;
    this.newCollectionIsSet = true;
    this._cdr.detectChanges();
  }

  private messageScrollSubscription: Subscription | undefined;

  constructor(
    private _cdr: ChangeDetectorRef,
    private searchService: SearchService,
  ) { }


  ngOnInit(): void {
    this.messageScrollSubscription =
      this.searchService.messageScrollRequested.subscribe(
        (message: Message) => {
          this.scrollToMessageInView(message);
        }
      );
    this.initCurrentUserWatchDog();
  }


  messageViewed(message: Message): void {
    this.userService.setLastReadMessage(message, this.currentCollection);
  }


  updateLastReadMessage(): void {
    this.collectionLRM = this.userService.getLastReadMessageObject(this.currentCollection);
  }


  initCurrentUserWatchDog() {
    this.currentUserSubscription = this.userService.currentUser?.changeUser$.subscribe(() => {
      this.updateLastReadMessage();
    });
  }


  getIfMessageIsUnread(message: Message): boolean {
    if (this.userService.currentUserID === message.creatorID) return false;
    if (this.collectionLRM) return message.createdAt.getTime() > this.collectionLRM.messageCreateAt;
    return message.createdAt > (this.userService.currentUser?.signupAt ?? 0);
  }

  private scrollToMessageInView(message: Message) {
    const maxAttempts = 5;
    let attempts = 0;

    const scrollToElement = () => {
      const targetSelector = `${message.id}`;
      const targetElement = document.getElementById(targetSelector);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetElement.classList.add('color-change');
        setTimeout(() => {
          targetElement.classList.remove('color-change');
        }, 1750);
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(scrollToElement, 500);
      }
    };
    setTimeout(scrollToElement, 100);
  }


  trackByFn(index: number, message: Message): string {
    return message.id;
  }


  ifNewMessagesSeparatorIsNeeded(index: number): boolean {
    if (this.collectionLRM) {
      if (this.newMessagesSeparatorIndex === index) return true;
      const result = this.messages[index].createdAt.getTime() > this.collectionLRM.messageCreateAt;
      if (result && this.messages[index].creatorID !== this.userService.currentUserID && this.newMessagesSeparatorIndex === -1) {
        this.newMessagesSeparatorIndex = index;
        return result;
      }
    }
    return false;
  }


  ifDaySeparatorIsNeeded(index: number): boolean {
    if (index === 0) return true;
    return (
      this.messages[index].createdAt.getDate() !==
      this.messages[index - 1].createdAt.getDate()
    );
  }


  ifMessageFromSameUserAsPrevious(index: number): boolean {
    if (index === 0) return false;
    return this.messages[index].creatorID === this.messages[index - 1].creatorID;
  }


  private subscribeMessages(messagesPath: string | undefined) {
    if (this.unsubMessages) this.unsubMessages();
    if (messagesPath) {
      this.unsubMessages = onSnapshot(collection(this.firestore, messagesPath), (snapshot) => {
        let newMessagesAdded = false;
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            newMessagesAdded = true;
            this.messages.push(new Message(change.doc.data(), messagesPath, change.doc.id));
          }
          if (change.type === 'modified') {
            const message = this.messages.find((message) => message.id === change.doc.id);
            if (message) message.update(change.doc.data());
          }
          if (change.type === 'removed') {
            this.messages = this.messages.filter((message) => message.id !== change.doc.id);
          }
        });
        if (newMessagesAdded) {
          this.messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          this._cdr.detectChanges();
        }
        if (this.newCollectionIsSet) {
          this.newCollectionIsSet = false;
          setTimeout(() => {
            if (this.newMessageSeparator) this.newMessageSeparator.nativeElement.scrollIntoView({ behavior: 'auto', block: 'start' });
          }, 500);
        }
      });
    }
  }


  ngOnDestroy(): void {
    if (this.unsubMessages) {
      this.unsubMessages();
    }
    if (this.messageScrollSubscription) {
      this.messageScrollSubscription.unsubscribe();
    }
    if (this.currentUserSubscription) {
      this.currentUserSubscription.unsubscribe();
    }
  }
}

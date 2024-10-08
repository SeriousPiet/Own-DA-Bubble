import { ChangeDetectorRef, Component, inject, Input, OnDestroy, OnInit, } from '@angular/core';
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

@Component({
  selector: 'app-messages-list-view',
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
  private currentUserSubscription: any;
  private unsubMessages: any = null;
  public messages: Message[] = [];
  public messagesDates: Date[] = [];
  public noMessagesAvailable = true;
  public messageEditorOpen = false;
  public newMessagesSeparatorIndex = -1;
  private currentCollection!: Channel | Chat | Message;
  private currentCollectionType: 'channel' | 'chat' | 'message' | undefined;
  private collectionLRM: LastReadMessage | undefined;

  @Input() set currentObject(currentObject: Channel | Chat | Message) {
    this.currentCollection = currentObject;
    this.currentCollectionType = currentObject ? currentObject.constructor.name.toLowerCase() as 'channel' | 'chat' | 'message' : undefined;
    this.updateLastReadMessage(this.userService.currentUser);
  }

  @Input()
  set messagesPath(value: string | undefined) {
    this.messages = [];
    this.messagesDates = [];
    this.subscribeMessages(value);
    this.messageEditorOpen = false;
    this.newMessagesSeparatorIndex = -1;
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
    console.log('messageViewed called with:', message);
    this.userService.setLastReadMessage(message, this.currentCollection);
  }


  updateLastReadMessage(user: User | null | undefined): void {
    if (user) {
      this.collectionLRM = user.lastReadMessages.find(
        (lrm) => lrm.collectionID === this.currentCollection?.id && lrm.collectionType === this.currentCollectionType
      );
    } else {
      this.collectionLRM = undefined;
    }
  }


  initCurrentUserWatchDog() {
    this.currentUserSubscription = this.userService.currentUser?.changeUser$.subscribe((user) => {
      this.updateLastReadMessage(user);
    });
  }


  getIfMessageIsUnread(message: Message): boolean {
    console.log('getIfMessageIsUnread called with:', message.createdAt.getTime(), ' / ', this.collectionLRM);
    if (this.collectionLRM) {
      return message.createdAt.getTime() > this.collectionLRM.messageCreateAt;
    }
    return false;
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
        let sortNeeded = false;
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            sortNeeded = true;
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
        if (sortNeeded) {
          this.messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }
        this._cdr.detectChanges();
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

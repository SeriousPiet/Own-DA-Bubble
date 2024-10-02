import { Directive, ElementRef, Input, OnChanges, OnDestroy, OnInit, Renderer2, SimpleChanges } from '@angular/core';
import { User } from '../../shared/models/user.class';

type AvatarContext =
  | 'choose-avatar-big'
  | 'choose-avatar-small'
  | 'wsm-list'
  | 'wsm-add-channel'
  | 'search'
  | 'outer-profile'
  | 'inner-profile'
  | 'profile-card'
  | 'chat-dm-header'
  | 'chat-channel-members-small'
  | 'chat-channel-members-big'
  | 'chat-message'
  | 'thread-message';

@Directive({
  selector: '[appAvatar]',
  standalone: true,
})
export class AvatarDirective implements OnInit, OnChanges, OnDestroy {
  @Input() user: User | undefined;
  @Input() context: AvatarContext = 'chat-message';

  private _img: HTMLImageElement | undefined;
  private _statusIndicator: HTMLDivElement | undefined;
  private userSubscription: any;

  private readonly online = '#92c83e';
  private readonly offline = '#686868';

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && !changes['user'].firstChange) {
      this.subscribeUser();
      this.updateAvatar();
    }
  }

  private updateAvatar() {
    if (this._img) {
      this.renderer.setAttribute(this._img, 'src', this.getAvatarUrl());
    }
    if (this._statusIndicator) {
      this.setOnlineStatusIndicator(this.user?.online || false);
    }
  }

  ngOnDestroy(): void {
    if (this.userSubscription) this.userSubscription.unsubscribe();
  }

  async ngOnInit() {
    this.applyAvatarStyles();
  }


  private subscribeUser() {
    if(this.userSubscription) this.userSubscription.unsubscribe();
    this.userSubscription = this.user?.changeUser$.subscribe(
      (user: User | null) => {
        if (user) {
          this.user = user;
          this.renderer.setAttribute(this._img, 'src', this.getAvatarUrl());
          this.setOnlineStatusIndicator(this.user.online);
        }
      }
    );
  }

  private applyAvatarStyles() {
    const styles = this.getStylesByContext();

    this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
    this.renderer.setStyle(this.el.nativeElement, 'width', styles.imgSize);
    this.renderer.setStyle(this.el.nativeElement, 'height', styles.imgSize);

    const imgUrl = this.getAvatarUrl();

    const img = this.renderer.createElement('img');
    this._img = img;
    this.renderer.setAttribute(img, 'src', imgUrl);
    this.renderer.setStyle(img, 'width', '100%');
    this.renderer.setStyle(img, 'height', '100%');
    this.renderer.setStyle(img, 'object-fit', 'cover');
    this.renderer.setStyle(img, 'border-radius', '50%');
    this.renderer.appendChild(this.el.nativeElement, img);

    if (styles.showStatusIndicator) {
      const statusIndicator = this.addStatusIndicator(styles);
      this.setupHoverEffect(statusIndicator, styles);
    }
  }

  private getAvatarUrl(): string {
    if (this.user) {
      if (this.user.pictureURL && this.user.pictureURL != '') {
        return this.user.pictureURL;
      }
      else {
        if(this.user.avatar === 0) return './assets/icons/start/profile-big.svg';
        return `./assets/img/avatar-big/avatar-${this.user?.avatar}.png`;
      }
    }
    return './assets/icons/start/profile-big.svg';
  }

  private setOnlineStatusIndicator(online: boolean) {
    if (!this._statusIndicator) return;
    this.renderer.setStyle(
      this._statusIndicator,
      'background-color',
      online ? this.online : this.offline
    );
  }

  private addStatusIndicator(styles: any): HTMLElement {
    const statusIndicator = this.renderer.createElement('div');
    this._statusIndicator = statusIndicator;
    this.renderer.setStyle(statusIndicator, 'content', '""');
    this.renderer.setStyle(statusIndicator, 'position', 'absolute');
    this.renderer.setStyle(statusIndicator, 'bottom', '0');
    this.renderer.setStyle(statusIndicator, 'right', '0');
    this.renderer.setStyle(statusIndicator, 'width', styles.statusSize);
    this.renderer.setStyle(statusIndicator, 'height', styles.statusSize);
    this.renderer.setStyle(statusIndicator, 'border-radius', '50%');
    this.renderer.setStyle(
      statusIndicator,
      'background-color',
      this.user?.online ? this.online : this.offline
    );
    this.renderer.setStyle(
      statusIndicator,
      'border',
      `2px solid ${styles.pseudoBorderColor}`
    );
    this.renderer.appendChild(this.el.nativeElement, statusIndicator);
    return statusIndicator;
  }

  private setupHoverEffect(statusIndicator: HTMLElement, styles: any) {
    const hoverElement = this.findHoverElement(this.el.nativeElement);
    if (hoverElement) {
      this.renderer.listen(hoverElement, 'mouseenter', () => {
        this.renderer.setStyle(
          statusIndicator,
          'border-color',
          styles.hoverPseudoBorderColor
        );
      });
      this.renderer.listen(hoverElement, 'mouseleave', () => {
        this.renderer.setStyle(
          statusIndicator,
          'border-color',
          styles.pseudoBorderColor
        );
      });
    }
  }

  private findHoverElement(element: HTMLElement): HTMLElement | null {
    let currentElement = element.parentElement;
    while (currentElement) {
      if (currentElement.hasAttribute('hoverElement')) {
        return currentElement;
      }
      currentElement = currentElement.parentElement;
    }
    return null;
  }

  private getStylesByContext(): {
    imgSize: string;
    statusSize: string;
    imgBorderColor: string;
    pseudoBackgroundColor: string;
    pseudoBorderColor: string;
    hoverPseudoBorderColor: string;
    showStatusIndicator: boolean;
  } {
    switch (this.context) {
      case 'choose-avatar-big':
        return {
          imgSize: '10rem',
          statusSize: '0',
          imgBorderColor: 'transparent',
          pseudoBorderColor: '#fff',
          pseudoBackgroundColor: 'offline',
          hoverPseudoBorderColor: '#eceefe',
          showStatusIndicator: false,
        };
      case 'choose-avatar-small':
        return {
          imgSize: '4rem',
          statusSize: '0',
          imgBorderColor: 'transparent',
          pseudoBorderColor: '#fff',
          pseudoBackgroundColor: 'offline',
          hoverPseudoBorderColor: '#eceefe',
          showStatusIndicator: false,
        };
      case 'wsm-list':
        return {
          imgSize: '2.5rem',
          statusSize: '0.675rem',
          imgBorderColor: 'transparent',
          pseudoBorderColor: '#fff',
          pseudoBackgroundColor: 'offline',
          hoverPseudoBorderColor: '#eceefe',
          showStatusIndicator: true,
        };
      case 'wsm-add-channel':
        return {
          imgSize: '2.5rem',
          statusSize: '0',
          imgBorderColor: 'transparent',
          pseudoBorderColor: '#fff',
          pseudoBackgroundColor: 'offline',
          hoverPseudoBorderColor: '#eceefe',
          showStatusIndicator: false,
        };
      case 'search':
        return {
          imgSize: '1.5rem',
          statusSize: '0',
          imgBorderColor: 'transparent',
          pseudoBorderColor: '#fff',
          pseudoBackgroundColor: 'offline',
          hoverPseudoBorderColor: '#eceefe',
          showStatusIndicator: false,
        };
      case 'outer-profile':
        return {
          imgSize: '4.5rem',
          statusSize: '1rem',
          imgBorderColor: 'transparent',
          pseudoBorderColor: '#eceefe',
          pseudoBackgroundColor: 'offline',
          hoverPseudoBorderColor: '#eceefe',
          showStatusIndicator: true,
        };

      case 'inner-profile':
        return {
          imgSize: '7rem',
          statusSize: '0',
          imgBorderColor: 'transparent',
          pseudoBorderColor: '#fff',
          pseudoBackgroundColor: 'offline',
          hoverPseudoBorderColor: 'transparent',
          showStatusIndicator: false,
        };

      case 'profile-card':
        return {
          imgSize: '10rem',
          statusSize: '0',
          imgBorderColor: 'transparent',
          pseudoBorderColor: '#fff',
          pseudoBackgroundColor: 'offline',
          hoverPseudoBorderColor: 'transparent',
          showStatusIndicator: false,
        };

      case 'chat-dm-header':
        return {
          imgSize: '3.125rem',
          statusSize: '0.675rem',
          imgBorderColor: 'transparent',
          pseudoBorderColor: '#fff',
          pseudoBackgroundColor: 'offline',
          hoverPseudoBorderColor: '#fff',
          showStatusIndicator: true,
        };

      case 'chat-channel-members-small':
        return {
          imgSize: '2.5rem',
          statusSize: '0.675rem',
          imgBorderColor: 'transparent',
          pseudoBorderColor: '#fff',
          pseudoBackgroundColor: 'offline',
          hoverPseudoBorderColor: '#eceefe',
          showStatusIndicator: false,
        };

      case 'chat-channel-members-big':
        return {
          imgSize: '3.125rem',
          statusSize: '1rem',
          imgBorderColor: 'transparent',
          pseudoBorderColor: '#fff',
          pseudoBackgroundColor: 'offline',
          hoverPseudoBorderColor: '#eceefe',
          showStatusIndicator: true,
        };

      case 'chat-message':
        return {
          imgSize: '4.375rem',
          statusSize: '0.675rem',
          imgBorderColor: 'transparent',
          pseudoBorderColor: '#fff',
          pseudoBackgroundColor: 'offline',
          hoverPseudoBorderColor: '#eceefe',
          showStatusIndicator: false,
        };

      case 'thread-message':
        return {
          imgSize: '4.375rem',
          statusSize: '0.675rem',
          imgBorderColor: 'transparent',
          pseudoBorderColor: '#fff',
          pseudoBackgroundColor: 'offline',
          hoverPseudoBorderColor: '#eceefe',
          showStatusIndicator: false,
        };
      default:
        return {
          imgSize: '2.5rem',
          statusSize: '0.675rem',
          imgBorderColor: 'transparent',
          pseudoBorderColor: '#fff',
          pseudoBackgroundColor: 'offline',
          hoverPseudoBorderColor: '#eceefe',
          showStatusIndicator: true,
        };
    }
  }
}

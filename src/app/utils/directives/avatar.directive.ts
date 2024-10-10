import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Renderer2,
  SimpleChanges,
} from '@angular/core';
import { User } from '../../shared/models/user.class';

/**
 * Defines the different contexts in which an avatar can be displayed in the application.
 * The context determines the size, styling, and behavior of the avatar.
 */
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

  /**
   * Subscribes to the user observable and updates the avatar when the user changes.
   * This method is called when the `user` input property changes, except for the first change.
   * It ensures the avatar is updated to reflect the new user information.
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && !changes['user'].firstChange) {
      this.subscribeUser();
      this.updateAvatar();
    }
  }

  /**
   * Updates the avatar image and online status indicator based on the current user information.
   * This method is called when the user information changes to ensure the avatar is up-to-date.
   */
  private updateAvatar() {
    if (this._img) {
      this.renderer.setAttribute(this._img, 'src', this.getAvatarUrl());
    }
    if (this._statusIndicator) {
      this.setOnlineStatusIndicator(this.user?.online || false);
    }
  }

  /**
   * Unsubscribes from the user subscription when the directive is destroyed.
   * This ensures that the subscription is properly cleaned up and does not
   * continue to receive updates after the directive is no longer in use.
   */
  ngOnDestroy(): void {
    if (this.userSubscription) this.userSubscription.unsubscribe();
  }

  /**
   * Initializes the avatar directive by subscribing to the user observable and applying the avatar styles.
   * This method is called when the directive is first initialized.
   */
  async ngOnInit() {
    this.subscribeUser();
    this.applyAvatarStyles();
  }

  /**
   * Subscribes to the user observable and updates the avatar when the user changes.
   * This method is called when the `user` input property changes, except for the first change.
   * It ensures the avatar is updated to reflect the new user information.
   */
  private subscribeUser() {
    if (this.userSubscription) this.userSubscription.unsubscribe();
    this.userSubscription = this.user?.changeUser$.subscribe(
      (user: User | null) => {
        if (this.renderer && user) {
          this.user = user;
          this.updateAvatar();
        }
      }
    );
  }

  /**
   * Applies the avatar styles to the directive's element, including setting the avatar image and optional online status indicator.
   * This method is called during the directive's initialization to set up the avatar display.
   */
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

  /**
   * Gets the URL for the user's avatar image.
   * If the user has a picture URL set, it returns that. Otherwise, it returns a default avatar image based on the user's avatar property.
   * If the user has no avatar property set, it returns a default profile icon.
   * @returns {string} The URL for the user's avatar image.
   */
  private getAvatarUrl(): string {
    if (this.user) {
      if (this.user.pictureURL && this.user.pictureURL != '') {
        return this.user.pictureURL;
      } else {
        if (this.user.avatar === 0)
          return './assets/icons/start/profile-big.svg';
        return `./assets/img/avatar-big/avatar-${this.user?.avatar}.png`;
      }
    }
    return './assets/icons/start/profile-big.svg';
  }

  /**
   * Sets the online status indicator for the avatar.
   * If the status indicator element exists, this method updates its background color to reflect the user's online status.
   * @param online - A boolean indicating whether the user is online or not.
   */
  private setOnlineStatusIndicator(online: boolean) {
    if (!this._statusIndicator) return;
    this.renderer.setStyle(
      this._statusIndicator,
      'background-color',
      online ? this.online : this.offline
    );
  }

  /**
   * Adds a status indicator element to the avatar.
   * The status indicator is a small circle that is positioned at the bottom right of the avatar image.
   * The color of the status indicator reflects the user's online status.
   * @param styles - An object containing the styles to apply to the status indicator.
   * @returns {HTMLElement} The status indicator element.
   */
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

  /**
   * Sets up a hover effect for the status indicator element.
   * If a 'hoverElement' attribute is found on the parent element, this method will listen for 'mouseenter' and 'mouseleave' events on that element.
   * When the mouse enters the hover element, the status indicator's border color is updated to the 'hoverPseudoBorderColor' from the provided styles.
   * When the mouse leaves the hover element, the status indicator's border color is reset to the 'pseudoBorderColor' from the provided styles.
   * @param statusIndicator - The HTMLElement representing the status indicator.
   * @param styles - An object containing the styles to apply to the status indicator.
   */
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

  /**
   * Finds the nearest parent element of the given element that has the 'hoverElement' attribute.
   * @param element - The HTMLElement to start the search from.
   * @returns The HTMLElement with the 'hoverElement' attribute, or null if not found.
   */
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

  /**
   * Provides styles for the avatar component based on the current context.
   * The styles include the size of the avatar image, the size of the status indicator, the border colors, and whether the status indicator should be shown.
   * The styles are determined by the `context` property, which can have different values depending on where the avatar is used in the application.
   * @returns An object containing the styles for the avatar component.
   */
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

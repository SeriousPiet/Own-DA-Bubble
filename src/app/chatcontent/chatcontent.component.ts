import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';

import { HeaderComponent } from './header/header.component';
import { WorkspacemenuComponent } from './workspacemenu/workspacemenu.component';
import { ChatviewComponent } from './chatview/chatview.component';
import { ThreadviewComponent } from './threadview/threadview.component';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../utils/services/navigation.service';
import { EmojipickerComponent } from './emojipicker/emojipicker.component';

@Component({
  selector: 'app-chatcontent',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    WorkspacemenuComponent,
    ChatviewComponent,
    ThreadviewComponent,
    WorkspacemenuComponent,
    EmojipickerComponent,
  ],
  templateUrl: './chatcontent.component.html',
  styleUrl: './chatcontent.component.scss',
})
export class ChatcontentComponent implements OnInit, OnDestroy {
  private breakpointSubscription: Subscription | undefined;

  currentLayout:
    | 'three-columns'
    | 'two-broad-columns'
    | 'two-narrow-columns'
    | 'one-broad-column'
    | 'one-narrow-column'
    | 'one-slim-column' = 'three-columns';

  isWorkspaceMenuVisible = true;
  isThreadViewVisible = false;
  isChatViewVisible = true;
  isSingleColumn = false;
  isThreadViewFullWidth = false;
  navigationService = inject(NavigationService);

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit() {
    const layoutBreakpoints = {
      'three-columns': '(min-width: 1200px)',
      'two-broad-columns': '(min-width: 892px) and (max-width: 1199px)',
      'two-narrow-columns': '(min-width: 716px) and (max-width: 891px)',
      'one-broad-column': '(min-width: 480px) and (max-width: 715px)',
      'one-narrow-column': ' (min-width: 376px) and (max-width: 479px)',
      'one-slim-column': '(max-width: 375px)',
    };

    this.breakpointSubscription = this.breakpointObserver
      .observe(Object.values(layoutBreakpoints))
      .subscribe((state: BreakpointState) => {
        if (state.breakpoints[layoutBreakpoints['three-columns']]) {
          this.currentLayout = 'three-columns';
        } else if (state.breakpoints[layoutBreakpoints['two-broad-columns']]) {
          this.currentLayout = 'two-broad-columns';
        } else if (state.breakpoints[layoutBreakpoints['two-narrow-columns']]) {
          this.currentLayout = 'two-narrow-columns';
        } else {
          this.currentLayout = 'one-broad-column';
        }
        this.setLayout();
      });

    this.navigationService.change$.subscribe((change) => {
      if (change === 'threadViewObjectSet') {
        this.isThreadViewVisible = true;
        if (this.currentLayout === 'one-broad-column') {
          this.isWorkspaceMenuVisible = false;
          this.isChatViewVisible = false;
        }
      } else if (change === 'threadViewObjectCleared') {
        this.isThreadViewVisible = false;
        if (this.currentLayout === 'one-broad-column') {
          this.isChatViewVisible = true;
        }
      } else if (
        change === 'chatViewObjectSetAsChannel' ||
        change === 'chatViewObjectSetAsChat'
      ) {
        this.isChatViewVisible = true;
        if (this.currentLayout === 'one-broad-column') {
          this.isWorkspaceMenuVisible = false;
          this.isThreadViewVisible = false;
        }
      }
      this.setLayout();
    });
  }

  ngOnDestroy() {
    if (this.breakpointSubscription) {
      this.breakpointSubscription.unsubscribe();
    }
  }

  setLayout() {
    switch (this.currentLayout) {
      case 'three-columns':
        this.adjustThreeColumnLayout();
        break;
      case 'two-broad-columns':
        this.adjustTwoBroadColumnLayout();
        break;
      case 'two-narrow-columns':
        this.adjustTwoNarrowColumnLayout();
        break;
      case 'one-broad-column':
        this.adjustOneBroadColumnLayout();
        break;
      case 'one-narrow-column':
        // to be implemented

        break;
      case 'one-slim-column':
        // to be implemented
        break;
    }
  }
  adjustThreeColumnLayout() {
    this.isSingleColumn =
      !this.isWorkspaceMenuVisible && !this.isThreadViewVisible;
  }

  adjustTwoBroadColumnLayout() {
    if (this.isThreadViewVisible) {
      this.isWorkspaceMenuVisible = false;
      this.isChatViewVisible = true;
    } else {
      this.isChatViewVisible = true;
    }
  }

  adjustTwoNarrowColumnLayout() {
    if (!this.isWorkspaceMenuVisible) {
      // Wenn WSM ausgeblendet ist, entweder ChatView oder ThreadView zeigen
      this.isChatViewVisible = !this.isThreadViewVisible;
    } else {
      this.isChatViewVisible = !this.isThreadViewVisible;
    }
  }

  adjustOneBroadColumnLayout() {
    if (this.isThreadViewVisible) {
      this.isWorkspaceMenuVisible = false;
      this.isChatViewVisible = false;
    } else if (this.isWorkspaceMenuVisible) {
      this.isChatViewVisible = false;
    } else {
      this.isChatViewVisible = true;
    }
  }

  toggleThreadView() {
    this.isThreadViewVisible = !this.isThreadViewVisible;

    if (this.currentLayout === 'two-broad-columns') {
      if (this.isThreadViewVisible) {
        this.isWorkspaceMenuVisible = false;
      }
      // ChatView bleibt immer sichtbar in diesem Layout
      this.isChatViewVisible = true;
    } else if (this.currentLayout === 'two-narrow-columns') {
      this.isChatViewVisible = !this.isThreadViewVisible;
      // WSM-Status bleibt unverändert
    } else if (
      this.currentLayout !== 'three-columns' &&
      this.isThreadViewVisible
    ) {
      this.isWorkspaceMenuVisible = false;
    } else if (this.currentLayout === 'one-broad-column') {
      if (this.isThreadViewVisible) {
        this.isWorkspaceMenuVisible = false;
        this.isChatViewVisible = false;
      } else {
        this.isChatViewVisible = true;
      }
    }

    this.setLayout();
  }

  toggleWorkspaceMenu() {
    this.isWorkspaceMenuVisible = !this.isWorkspaceMenuVisible;

    if (this.currentLayout === 'two-broad-columns') {
      if (this.isWorkspaceMenuVisible) {
        this.isThreadViewVisible = false;
      }
      // ChatView bleibt immer sichtbar in diesem Layout
      this.isChatViewVisible = true;
    } else if (this.currentLayout === 'two-narrow-columns') {
      if (this.isWorkspaceMenuVisible) {
        this.isChatViewVisible = true;
        this.isThreadViewVisible = false;
      }
    } else if (
      this.currentLayout !== 'three-columns' &&
      this.isWorkspaceMenuVisible
    ) {
      this.isThreadViewVisible = false;
    } else if (this.currentLayout === 'one-broad-column') {
      if (this.isWorkspaceMenuVisible) {
        this.isChatViewVisible = false;
        this.isThreadViewVisible = false;
      } else {
        this.isChatViewVisible = true;
      }
    }

    this.setLayout();
  }
}

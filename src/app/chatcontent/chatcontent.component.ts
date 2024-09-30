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
    | 'three-column'
    | 'two-column'
    | 'two-column-interim'
    | 'one-column' = 'three-column';

  isWorkspaceMenuVisible = true;
  isThreadViewVisible = false;
  isChatViewVisible = true;
  isChatViewExpanded = false;
  isSingleColumn = false;

  navigationService = inject(NavigationService);

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit() {
    const layoutBreakpoints = {
      'three-column': '(min-width: 1200px)',
      'two-column': '(min-width: 892px) and (max-width: 1199px)',
      'two-column-interim': '(min-width: 716px) and (max-width: 891px)',
      'one-column': '(max-width: 715px)',
    };

    this.breakpointSubscription = this.breakpointObserver
      .observe(Object.values(layoutBreakpoints))
      .subscribe((state: BreakpointState) => {
        if (state.breakpoints[layoutBreakpoints['three-column']]) {
          this.currentLayout = 'three-column';
        } else if (state.breakpoints[layoutBreakpoints['two-column']]) {
          this.currentLayout = 'two-column';
        } else if (state.breakpoints[layoutBreakpoints['two-column-interim']]) {
          this.currentLayout = 'two-column-interim';
        } else {
          this.currentLayout = 'one-column';
        }
        this.adjustLayout();
      });
  }

  ngOnDestroy() {
    if (this.breakpointSubscription) {
      this.breakpointSubscription.unsubscribe();
    }
  }

  adjustLayout() {
    switch (this.currentLayout) {
      case 'three-column':
      case 'two-column':
        this.adjustThreeColumnLayout();
        break;
      case 'two-column-interim':
        this.adjustTwoColumnInterimLayout();
        break;
      case 'one-column':
        // Implementierung folgt
        break;
    }
  }

  adjustThreeColumnLayout() {
    this.isChatViewExpanded =
      !this.isWorkspaceMenuVisible || !this.isThreadViewVisible;
    this.isSingleColumn =
      !this.isWorkspaceMenuVisible && !this.isThreadViewVisible;
  }

  adjustTwoColumnInterimLayout() {
    if (!this.isWorkspaceMenuVisible) {
      // Wenn WSM ausgeblendet ist, zeige entweder ChatView oder ThreadView
      this.isChatViewVisible = !this.isThreadViewVisible;
    } else {
      this.isChatViewVisible = !this.isThreadViewVisible;
    }
    this.isChatViewExpanded =
      this.isChatViewVisible && !this.isWorkspaceMenuVisible;
  }

  toggleThreadView() {
    this.isThreadViewVisible = !this.isThreadViewVisible;
    if (this.currentLayout === 'two-column-interim') {
      this.isChatViewVisible = !this.isThreadViewVisible;
      // WSM-Status bleibt unverändert
    } else if (
      this.currentLayout !== 'three-column' &&
      this.isThreadViewVisible
    ) {
      this.isWorkspaceMenuVisible = false;
    }
    this.adjustLayout();
  }

  toggleWorkspaceMenu() {
    this.isWorkspaceMenuVisible = !this.isWorkspaceMenuVisible;
    if (this.currentLayout === 'two-column-interim') {
      if (this.isWorkspaceMenuVisible) {
        this.isChatViewVisible = true;
        this.isThreadViewVisible = false;
      }
    } else if (
      this.currentLayout !== 'three-column' &&
      this.isWorkspaceMenuVisible
    ) {
      this.isThreadViewVisible = false;
    }
    this.adjustLayout();
  }
}

import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';

import { HeaderComponent } from './header/header.component';
import { WorkspacemenuComponent } from './workspacemenu/workspacemenu.component';
import { ChatviewComponent } from './chatview/chatview.component';
import { ThreadviewComponent } from './threadview/threadview.component';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../utils/services/navigation.service';

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
  ],
  templateUrl: './chatcontent.component.html',
  styleUrl: './chatcontent.component.scss',
})
export class ChatcontentComponent implements OnInit, OnDestroy {
  private breakpointSubscription: Subscription | undefined;

  currentLayout: 'three-column' | 'two-column' | 'one-column' = 'three-column';
  isWorkspaceMenuVisible = true;
  isThreadViewVisible = false;

  navigationService = inject(NavigationService);

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit() {
    const layoutBreakpoints = {
      'three-column': '(min-width: 1200px)',
      'two-column': '(min-width: 720px) and (max-width: 1199px)',
      'one-column': '(max-width: 719px)',
    };

    this.breakpointSubscription = this.breakpointObserver
      .observe(Object.values(layoutBreakpoints))
      .subscribe((state: BreakpointState) => {
        if (state.breakpoints[layoutBreakpoints['three-column']]) {
          this.currentLayout = 'three-column';
        } else if (state.breakpoints[layoutBreakpoints['two-column']]) {
          this.currentLayout = 'two-column';
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
        // Alle Spalten können potentiell sichtbar sein
        break;
      case 'two-column':
        // Wenn ThreadView geöffnet wird, schließe WSM und umgekehrt
        if (this.isThreadViewVisible) {
          this.isWorkspaceMenuVisible = false;
        }
        break;
      case 'one-column':
        // Nur eine Spalte sichtbar
        if (this.isThreadViewVisible) {
          this.isWorkspaceMenuVisible = false;
        } else if (this.isWorkspaceMenuVisible) {
          this.isThreadViewVisible = false;
        }
        break;
    }
  }

  toggleWorkspaceMenu() {
    this.isWorkspaceMenuVisible = !this.isWorkspaceMenuVisible;
    if (this.currentLayout !== 'three-column' && this.isWorkspaceMenuVisible) {
      this.isThreadViewVisible = false;
    }
    this.adjustLayout();
  }

  toggleThreadView() {
    console.log('ChatContent: --> toggleThreadView called');
    this.isThreadViewVisible = !this.isThreadViewVisible;
    if (this.currentLayout !== 'three-column' && this.isThreadViewVisible) {
      this.isWorkspaceMenuVisible = false;
    }
    this.adjustLayout();
  }
}

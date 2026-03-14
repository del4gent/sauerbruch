import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, startWith } from 'rxjs';

import { RoomStore } from './store/room.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  public roomService = inject(RoomStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly welcomeStorageKey = 'welcome-popover-seen';
  readonly guestName = signal('');
  readonly isWelcomePopoverVisible = signal(false);

  ngOnInit() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        startWith(new NavigationEnd(0, this.router.url, this.router.url)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.roomService.updateBreadcrumb();
        this.updateGuestName();
      });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateGuestName());

    const hasSeenWelcome = typeof localStorage !== 'undefined'
      ? localStorage.getItem(this.welcomeStorageKey) === 'true'
      : false;
    this.isWelcomePopoverVisible.set(!hasSeenWelcome);
  }

  private updateGuestName() {
    const routeName = this.route.snapshot.queryParamMap.get('name')?.trim();
    const rootRouteName = this.router.routerState.snapshot.root.queryParamMap.get('name')?.trim();
    const browserName = this.getBrowserQueryParam('name');

    this.guestName.set(routeName || rootRouteName || browserName || '');
  }

  private getBrowserQueryParam(key: string): string {
    if (typeof window === 'undefined') {
      return '';
    }

    return new URLSearchParams(window.location.search).get(key)?.trim() ?? '';
  }

  checkPassword(eventOrValue: Event | string) {
    const value = typeof eventOrValue === 'string' 
      ? eventOrValue 
      : (eventOrValue.target as HTMLInputElement).value;
    
    this.roomService.checkPassword(value);
  }

  closeWelcomePopover() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.welcomeStorageKey, 'true');
    }
    this.isWelcomePopoverVisible.set(false);
  }
}

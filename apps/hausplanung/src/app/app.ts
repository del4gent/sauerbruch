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
  private lastScrollY = 0;
  readonly guestName = signal('');
  readonly isWelcomePopoverVisible = signal(false);
  readonly isBreadcrumbVisible = signal(true);

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
        this.isBreadcrumbVisible.set(true);
      });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateGuestName();
        this.handleRoomDeepLink();
      });

    const hasSeenWelcome = typeof localStorage !== 'undefined'
      ? localStorage.getItem(this.welcomeStorageKey) === 'true'
      : false;
    this.isWelcomePopoverVisible.set(!hasSeenWelcome);

    this.bindScrollBehavior();
  }

  private updateGuestName() {
    const routeName = this.route.snapshot.queryParamMap.get('name')?.trim();
    const rootRouteName = this.router.routerState.snapshot.root.queryParamMap.get('name')?.trim();
    const browserName = this.getBrowserQueryParam('name');

    this.guestName.set(routeName || rootRouteName || browserName || '');
  }

  private handleRoomDeepLink() {
    const requestedRoom =
      this.route.snapshot.queryParamMap.get('room')?.trim() ||
      this.router.routerState.snapshot.root.queryParamMap.get('room')?.trim() ||
      this.getBrowserQueryParam('room');

    if (!requestedRoom) {
      return;
    }

    const currentPath = this.router.url.split('?')[0];
    if (currentPath === `/room/${requestedRoom}`) {
      return;
    }

    const queryParams = { ...this.router.routerState.snapshot.root.queryParams };
    delete queryParams['room'];

    void this.router.navigate(['/room', requestedRoom], {
      replaceUrl: true,
      queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
    });
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

  private bindScrollBehavior() {
    if (typeof window === 'undefined') {
      return;
    }

    this.lastScrollY = window.scrollY;

    window.addEventListener('scroll', this.handleWindowScroll, { passive: true });
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', this.handleWindowScroll);
    });
  }

  private readonly handleWindowScroll = () => {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - this.lastScrollY;

    if (currentScrollY <= 24) {
      this.isBreadcrumbVisible.set(true);
      this.lastScrollY = currentScrollY;
      return;
    }

    if (Math.abs(delta) < 8) {
      return;
    }

    this.isBreadcrumbVisible.set(delta < 0);
    this.lastScrollY = currentScrollY;
  };
}

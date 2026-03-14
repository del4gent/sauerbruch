import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
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
  private readonly welcomeStorageKey = 'welcome-popover-seen';
  readonly guestName = signal('');
  readonly isWelcomePopoverVisible = signal(false);

  constructor() {}

  ngOnInit() {
    this.roomService.updateBreadcrumb();
    const name = this.route.snapshot.queryParamMap.get('name')?.trim() ?? '';
    this.guestName.set(name);
    const hasSeenWelcome = typeof localStorage !== 'undefined'
      ? localStorage.getItem(this.welcomeStorageKey) === 'true'
      : false;
    this.isWelcomePopoverVisible.set(!hasSeenWelcome);
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

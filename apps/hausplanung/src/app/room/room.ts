import { Component, OnInit, OnDestroy, signal, Inject, PLATFORM_ID, computed, inject } from '@angular/core';
import { StatusBadgeComponent } from '../ui/status-badge/status-badge.component';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RoomStore, Room } from '../store/room.store';

interface ImageGroup {
  id: string;
  label: string;
  icon: string;
  images: string[];
}

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  templateUrl: './room.html',
  styleUrl: './room.css',
})
export class RoomComponent implements OnInit, OnDestroy {
  roomName = signal('');
  roomDetails = signal<Room | null>(null);
  content = signal<SafeHtml>('');
  images = signal<string[]>([]);
  heroImage = signal<string | null>(null);
  error = signal(false);
  progress = signal<{ total: number; completed: number; percentage: number }>({ total: 0, completed: 0, percentage: 0 });
  upcomingTasks = signal<string[]>([]);

  groupedImages = computed(() => {
    const all = this.images();
    const groups: ImageGroup[] = [
      { 
        id: 'plan', 
        label: 'Pläne', 
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
        images: all.filter(img => img.includes('/plan/')) 
      },
      { 
        id: 'soll', 
        label: 'Inspiration', 
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        images: all.filter(img => img.includes('/inspiration/')) 
      },
      { 
        id: 'material', 
        label: 'Material', 
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
        images: all.filter(img => img.includes('/material/')) 
      },
      { 
        id: 'ist', 
        label: 'Bestand', 
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
        images: all.filter(img => img.includes('/ist/')) 
      }
    ];
    return groups;
  });

  public roomService = inject(RoomStore);

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    public sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.loadRoomData(params['room']);
    });
  }

  ngOnDestroy() {
  }

  loadRoomData(roomId: string) {
    this.roomName.set(roomId);
    this.error.set(false);
    
    const details = this.roomService.getRoomById(roomId);
    this.roomDetails.set(details || null);

    if (!details) {
      this.error.set(true);
      return;
    }

    const mdPath = `assets/${details.path}`;
    
    this.http.get(mdPath, { responseType: 'text' }).subscribe({
      next: async (md) => {
        // Calculate progress
        const tasks = md.match(/- \[[x ]\]/g) || [];
        const completed = tasks.filter(t => t.includes('[x]')).length;
        this.progress.set({
          total: tasks.length,
          completed,
          percentage: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
        });

        // Extract upcoming tasks (open items)
        const openTaskLines = md.split('\n')
          .filter(line => line.includes('- [ ]'))
          .map(line => line.replace('- [ ]', '').trim())
          .slice(0, 3); // Show max 3 next steps
        this.upcomingTasks.set(openTaskLines);

        if (isPlatformBrowser(this.platformId)) {
          const rendered = await marked.parse(md);
          this.content.set(this.sanitizer.bypassSecurityTrustHtml(rendered));
          
          const roomImgs = this.roomService.getRoomImages(roomId);
          this.images.set(roomImgs);
          this.heroImage.set(roomImgs.length > 0 ? roomImgs[0] : null);
        } else {
          this.content.set(md);
        }
      },
      error: (err) => {
        console.error('Error loading room data:', err);
        this.error.set(true);
      }
    });
  }

  openImage(url: string) {
    window.open(url, '_blank');
  }

  generatePdf() {
    window.open(`assets/renovierungsplan.pdf`, '_blank');
  }
}

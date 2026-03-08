import { Component, OnInit, signal, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import roomsData from '../../../public/assets/data/rooms.json';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  template: `
    <div class="room-page" *ngIf="!error(); else errorTpl">
      <nav class="back-nav">
        <a routerLink="/" class="btn-back">← Zurück zum Dashboard</a>
      </nav>

      <header class="room-header">
        <div class="room-title">
          <h1 class="room-name">{{ roomDetails()?.name || roomName() | titlecase }}</h1>
          <div class="room-badges">
            <span class="badge status">{{ roomDetails()?.status }}</span>
            <span class="badge area">{{ roomDetails()?.area }} m²</span>
          </div>
        </div>
        <p class="derivation" *ngIf="roomDetails()?.area_derivation">
          <strong>Fläche:</strong> {{ roomDetails()?.area_derivation }}
        </p>
      </header>

      <div class="content-grid">
        <div class="card md-content" [innerHTML]="content()"></div>
        
        <aside class="media-sidebar" *ngIf="images().length > 0">
          <h3>Pläne & Fotos</h3>
          <div class="image-gallery">
            <div *ngFor="let img of images()" class="image-card">
              <img [src]="img" [alt]="img" (click)="openImage(img)">
            </div>
          </div>
        </aside>
      </div>
    </div>

    <ng-template #errorTpl>
      <div class="error-container">
        <h2>Raum nicht gefunden</h2>
        <p>Die Planungsdaten für "{{ roomName() }}" konnten nicht geladen werden.</p>
        <a routerLink="/" class="btn-primary">Zurück zum Dashboard</a>
      </div>
    </ng-template>
  `,
  styles: [`
    .room-page { padding-bottom: 5rem; }
    .back-nav { margin-bottom: 2rem; }
    .btn-back { text-decoration: none; color: #3498db; font-weight: 600; }
    
    .room-header { margin-bottom: 3rem; }
    .room-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
    .room-name { font-size: 3rem; margin: 0; color: #2c3e50; }
    
    .room-badges { display: flex; gap: 1rem; }
    .badge { padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; }
    .badge.status { background: #e1f5fe; color: #0288d1; }
    .badge.area { background: #f1f8e9; color: #558b2f; }
    
    .derivation { color: #7f8c8d; font-style: italic; }

    .content-grid { 
      display: grid; 
      grid-template-columns: 1fr 350px; 
      gap: 2rem; 
      align-items: start;
    }

    .card { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .md-content { line-height: 1.8; font-size: 1.1rem; color: #444; }
    
    /* Simple Markdown Styles */
    :host ::ng-deep h1, :host ::ng-deep h2 { color: #2c3e50; margin-top: 2rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
    :host ::ng-deep ul { padding-left: 1.5rem; }
    :host ::ng-deep li { margin-bottom: 0.5rem; }
    :host ::ng-deep table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
    :host ::ng-deep th, :host ::ng-deep td { padding: 0.75rem; border: 1px solid #eee; text-align: left; }
    :host ::ng-deep th { background: #f8f9fa; }

    .media-sidebar h3 { font-size: 1.2rem; margin-bottom: 1.5rem; color: #2c3e50; opacity: 0.8; }
    .image-gallery { display: flex; flex-direction: column; gap: 1rem; }
    .image-card { background: white; padding: 0.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .image-card img { width: 100%; border-radius: 6px; cursor: pointer; transition: transform 0.2s; }
    .image-card img:hover { transform: scale(1.02); }

    .error-container { text-align: center; padding: 5rem; }
    .btn-primary { display: inline-block; background: #3498db; color: white; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; margin-top: 1rem; }

    @media (max-width: 1024px) {
      .content-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class RoomComponent implements OnInit {
  roomName = signal('');
  roomDetails = signal<any>(null);
  content = signal<SafeHtml>('');
  images = signal<string[]>([]);
  error = signal(false);

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.loadRoomData(params['room']);
    });
  }

  loadRoomData(roomId: string) {
    this.roomName.set(roomId);
    this.error.set(false);
    
    // Find details from JSON
    const details = (roomsData as any[]).find(r => r.id === roomId);
    this.roomDetails.set(details);

    if (!details) {
      this.error.set(true);
      return;
    }

    const mdPath = `assets/${details.path}`;
    
    this.http.get(mdPath, { responseType: 'text' }).subscribe({
      next: async (md) => {
        if (isPlatformBrowser(this.platformId)) {
          const rendered = await marked.parse(md);
          this.content.set(this.sanitizer.bypassSecurityTrustHtml(rendered));
        } else {
          // SSR Fallback (raw text or simple render)
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
}

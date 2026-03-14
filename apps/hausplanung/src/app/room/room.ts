import { Component, DestroyRef, OnDestroy, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { StatCardComponent } from '../ui/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../ui/status-badge/status-badge.component';
import { RoomStore } from '../store/room.store';
import { getMaterialStatusClass } from '../shared/hausplanung.constants';
import {
  ChecklistItem,
  ImageGroup,
  Material,
  Room,
  RoomData,
  RoomSection,
  TableData,
} from '../shared/hausplanung.models';
import {
  asChecklistItems,
  asTableData,
  calculateRoomProgress,
  findAblaufSection,
  getCompletedCount as getCompletedCountValue,
  getRowDescription as getRoomRowDescription,
  getRowEnd as getRoomRowEnd,
  getRowExecutionType as getRoomRowExecutionType,
  getRowStart as getRoomRowStart,
  getRowStatus as getRoomRowStatus,
  getRowTitle as getRoomRowTitle,
  getSectionProgress as getSectionProgressValue,
  getTotalCount as getTotalCountValue,
  isCurrentItem,
  isFutureItem,
  isPastItem,
  mapRoomSections,
  resolveRoomMarkdownAssetPaths,
} from '../shared/room-content.utils';
import { buildImageGroups, selectRoomMedia } from '../shared/room-media.utils';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, StatCardComponent],
  templateUrl: './room.html',
  styleUrl: './room.css',
})
export class RoomComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  readonly sanitizer = inject(DomSanitizer);
  private readonly platformId = inject(PLATFORM_ID);
  readonly roomService = inject(RoomStore);

  roomName = signal('');
  roomDetails = signal<Room | null>(null);
  roomSections = signal<RoomSection[]>([]);
  images = signal<string[]>([]);
  heroImage = signal<string | null>(null);
  beforeImage = signal<string | null>(null);
  afterImage = signal<string | null>(null);
  sliderPos = signal(0);
  error = signal(false);
  progress = signal<{ total: number; completed: number; percentage: number }>({ total: 0, completed: 0, percentage: 0 });
  upcomingTasks = signal<string[]>([]);
  selectedMaterial = signal<Material | null>(null);
  isAblaufExpanded = signal(false);

  groupedImages = computed<ImageGroup[]>(() =>
    buildImageGroups(this.images(), this.roomService.getRoomMaterials(this.roomName()))
  );
  ablaufSection = computed(() => findAblaufSection(this.roomSections()));

  private animationInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.loadRoomData(params['room']);
      });
  }

  ngOnDestroy() {
    this.stopAnimation();
  }

  loadRoomData(roomId: string) {
    this.roomName.set(roomId);
    this.error.set(false);
    this.isAblaufExpanded.set(false);
    this.stopAnimation();
    this.images.set([]);
    this.heroImage.set(null);
    this.beforeImage.set(null);
    this.afterImage.set(null);

    const details = this.roomService.getRoomById(roomId);
    this.roomDetails.set(details || null);

    if (!details) {
      this.error.set(true);
      return;
    }

    const jsonPath = `assets/${details.path}`;

    this.http.get<RoomData>(jsonPath).subscribe({
      next: (data) => {
        const sections = mapRoomSections(data.sections, (markdown) => this.renderMarkdown(markdown, roomId));
        const roomProgress = calculateRoomProgress(sections);

        this.progress.set({
          total: roomProgress.total,
          completed: roomProgress.completed,
          percentage: roomProgress.percentage,
        });
        this.upcomingTasks.set(roomProgress.upcomingTasks);
        this.roomSections.set(sections);

        if (isPlatformBrowser(this.platformId)) {
          const roomImgs = this.roomService.getRoomImages(roomId);
          this.images.set(roomImgs);
          const mediaState = selectRoomMedia(roomImgs);

          this.heroImage.set(mediaState.heroImage);
          this.beforeImage.set(mediaState.beforeImage);
          this.afterImage.set(mediaState.afterImage);

          if (mediaState.beforeImage && mediaState.afterImage) {
            this.startAnimation();
          }
        }
      },
      error: (err) => {
        console.error('Error loading room data:', err);
        this.error.set(true);
      }
    });
  }

  private startAnimation() {
    this.stopAnimation();
    if (!isPlatformBrowser(this.platformId)) return;

    const startTime = Date.now();
    const cycleDuration = 24000;

    this.animationInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pos = (Math.sin((elapsed / cycleDuration) * 2 * Math.PI - Math.PI / 2) + 1) / 2 * 100;
      this.sliderPos.set(pos);
    }, 20);
  }

  private stopAnimation() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  }

  openImage(url: string) {
    window.open(url, '_blank');
  }

  openMediaGroupItem(group: ImageGroup, index: number, imageUrl: string) {
    if (group.id === 'material' && group.materials) {
      const mat = group.materials[index];
      if (mat.link) {
        window.open(mat.link, '_blank');
      } else {
        this.openImage(imageUrl);
      }
    } else {
      this.openImage(imageUrl);
    }
  }

  openMaterialDetails(material: Material | undefined, event?: Event) {
    event?.stopPropagation();
    if (material) {
      this.selectedMaterial.set(material);
    }
  }

  closeMaterialDetails() {
    this.selectedMaterial.set(null);
  }

  closeMaterialDetailsFromOverlay(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeMaterialDetails();
    }
  }

  onImgError(event: Event) {
    const image = event.target as HTMLImageElement | null;
    if (!image) {
      return;
    }

    image.src = 'assets/plan/house_hero.jpg';
    image.classList.add('img-placeholder');
  }

  getStatusClass(status: string): string {
    return getMaterialStatusClass(status);
  }

  asTable(items: RoomSection['items']): TableData {
    return asTableData(items);
  }

  asChecklist(items: RoomSection['items']): ChecklistItem[] {
    return asChecklistItems(items);
  }

  isPast(section: RoomSection, index: number): boolean {
    return isPastItem(section, index);
  }

  isCurrent(section: RoomSection, index: number): boolean {
    return isCurrentItem(section, index);
  }

  isFuture(section: RoomSection, index: number): boolean {
    return isFutureItem(section, index);
  }

  getRowTitle(table: TableData, row: string[]): string {
    return getRoomRowTitle(table, row);
  }

  getRowStatus(table: TableData, row: string[]): string {
    return getRoomRowStatus(table, row);
  }

  getRowDescription(table: TableData, row: string[]): string {
    return getRoomRowDescription(table, row);
  }

  getRowExecutionType(table: TableData, row: string[]): string {
    return getRoomRowExecutionType(table, row);
  }

  getExecutionTypeClass(type: string): string {
    const normalized = type.trim().toLowerCase();
    if (normalized === 'eigenleistung') return 'eigenleistung';
    if (normalized === 'handwerker') return 'handwerker';
    return '';
  }

  getRowStart(table: TableData, row: string[]): string {
    return getRoomRowStart(table, row);
  }

  getRowEnd(table: TableData, row: string[]): string {
    return getRoomRowEnd(table, row);
  }

  getCompletedCount(section: RoomSection): number {
    return getCompletedCountValue(section);
  }

  getTotalCount(section: RoomSection): number {
    return getTotalCountValue(section);
  }

  getSectionProgress(section: RoomSection): number {
    return getSectionProgressValue(section);
  }

  private renderMarkdown(markdown: string, roomId: string): SafeHtml {
    try {
      const resolvedMarkdown = resolveRoomMarkdownAssetPaths(markdown, roomId);
      const parsed = marked.parse(resolvedMarkdown);
      return this.sanitizer.bypassSecurityTrustHtml(parsed as string);
    } catch (error) {
      console.error('Markdown parse error', error);
      return this.sanitizer.bypassSecurityTrustHtml(markdown);
    }
  }
}

import {
  ChecklistItem,
  RoomProgress,
  RoomSection,
  TableData,
} from './hausplanung.models';

const ABLAUF_SECTION_MARKERS = ['ABLAUFPLAN', 'RENOVIERUNGS-ABLAUF', 'RENOVIERUNGSABLAUF'];
const COMPLETED_TASK_STATUSES = new Set(['fertig', 'erledigt', '✅ fertig']);

export function isAblaufSectionTitle(title: string): boolean {
  const normalizedTitle = title.trim().toUpperCase();
  return ABLAUF_SECTION_MARKERS.some((marker) => normalizedTitle.includes(marker));
}

export function findAblaufSection(sections: RoomSection[]): RoomSection | null {
  return sections.find((section) => isAblaufSectionTitle(section.title)) ?? null;
}

export function resolveRoomMarkdownAssetPaths(markdown: string, roomId: string): string {
  return markdown.replace(/\]\((medien\/[^)]+)\)/g, `](assets/rooms/${roomId}/$1)`);
}

export function mapRoomSections(
  sections: RoomSection[],
  decorateMarkdown: (markdown: string) => RoomSection['html']
): RoomSection[] {
  return sections.map((section) => {
    if (section.type !== 'text' || typeof section.items !== 'string') {
      return section;
    }

    return {
      ...section,
      html: decorateMarkdown(section.items),
    };
  });
}

export function calculateRoomProgress(sections: RoomSection[]): RoomProgress {
  let total = 0;
  let completed = 0;
  const upcomingTasks: string[] = [];

  sections.forEach((section) => {
    if (isTableSection(section) && isAblaufSectionTitle(section.title)) {
      const table = section.items;
      const statusIndex = findHeaderIndex(table, (header) => header.includes('STATUS'));
      const titleIndex = Math.max(
        0,
        findHeaderIndex(
          table,
          (header) =>
            header.includes('TITEL') || header.includes('SCHRITT') || header.includes('GEWERK')
        )
      );

      table.rows.forEach((row) => {
        total += 1;
        const status = statusIndex === -1 ? '' : (row[statusIndex] ?? '').toLowerCase();
        if (isCompletedTaskStatus(status)) {
          completed += 1;
        } else if (upcomingTasks.length < 5) {
          upcomingTasks.push(row[titleIndex] ?? '');
        }
      });

      return;
    }

    if (isChecklistSection(section)) {
      section.items.forEach((item) => {
        total += 1;
        if (item.done) {
          completed += 1;
        } else if (upcomingTasks.length < 5 && !upcomingTasks.includes(item.label)) {
          upcomingTasks.push(item.label);
        }
      });
    }
  });

  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    upcomingTasks,
  };
}

export function isCompletedTaskStatus(status: string): boolean {
  return COMPLETED_TASK_STATUSES.has(status.toLowerCase());
}

export function isChecklistSection(section: RoomSection): section is RoomSection & { items: ChecklistItem[] } {
  return section.type === 'checklist' && Array.isArray(section.items);
}

export function isTableSection(section: RoomSection): section is RoomSection & { items: TableData } {
  return section.type === 'table' && typeof section.items !== 'string' && 'rows' in section.items;
}

export function asTableData(items: RoomSection['items']): TableData {
  return items as TableData;
}

export function asChecklistItems(items: RoomSection['items']): ChecklistItem[] {
  return items as ChecklistItem[];
}

export function getRowTitle(table: TableData, row: string[]): string {
  const index = findHeaderIndex(
    table,
    (header) => header.includes('TITEL') || header.includes('SCHRITT') || header.includes('GEWERK')
  );
  return index === -1 ? row[0] ?? '' : row[index] ?? '';
}

export function getRowStatus(table: TableData, row: string[]): string {
  return getRowValue(table, row, (header) => header.includes('STATUS'));
}

export function getRowDescription(table: TableData, row: string[]): string {
  return getRowValue(table, row, (header) => header.includes('BESCHREIBUNG'));
}

export function getRowExecutionType(table: TableData, row: string[]): string {
  return getRowValue(
    table,
    row,
    (header) =>
      header.includes('AUSFÜHRUNG') ||
      header.includes('AUSFUHRUNG') ||
      header.includes('VERANTWORTUNG') ||
      header.includes('TYP')
  );
}

export function getRowStart(table: TableData, row: string[]): string {
  return getRowValue(table, row, (header) => header.includes('ANFANG') || header.includes('START'));
}

export function getRowEnd(table: TableData, row: string[]): string {
  return getRowValue(table, row, (header) => header.includes('ENDE'));
}

export function isPastItem(section: RoomSection, index: number): boolean {
  if (isChecklistSection(section)) {
    return section.items[index]?.done ?? false;
  }

  if (isTableSection(section)) {
    const row = section.items.rows[index];
    return isCompletedTaskStatus(getRowStatus(section.items, row));
  }

  return false;
}

export function isCurrentItem(section: RoomSection, index: number): boolean {
  if (isPastItem(section, index)) {
    return false;
  }

  for (let currentIndex = 0; currentIndex < index; currentIndex += 1) {
    if (!isPastItem(section, currentIndex)) {
      return false;
    }
  }

  return true;
}

export function isFutureItem(section: RoomSection, index: number): boolean {
  return !isPastItem(section, index) && !isCurrentItem(section, index);
}

export function getCompletedCount(section: RoomSection): number {
  if (isChecklistSection(section)) {
    return section.items.filter((item) => item.done).length;
  }

  if (isTableSection(section)) {
    return section.items.rows.filter((_, index) => isPastItem(section, index)).length;
  }

  return 0;
}

export function getTotalCount(section: RoomSection): number {
  if (isChecklistSection(section)) {
    return section.items.length;
  }

  if (isTableSection(section)) {
    return section.items.rows.length;
  }

  return 0;
}

export function getSectionProgress(section: RoomSection): number {
  const total = getTotalCount(section);
  if (total === 0) {
    return 0;
  }

  return Math.round((getCompletedCount(section) / total) * 100);
}

function getRowValue(
  table: TableData,
  row: string[],
  matches: (normalizedHeader: string) => boolean
): string {
  const index = findHeaderIndex(table, matches);
  return index === -1 ? '' : row[index] ?? '';
}

function findHeaderIndex(table: TableData, matches: (normalizedHeader: string) => boolean): number {
  return table.headers.findIndex((header) => matches(header.toUpperCase()));
}

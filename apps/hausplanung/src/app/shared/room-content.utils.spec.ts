import { describe, expect, it } from 'vitest';

import {
  calculateRoomProgress,
  findAblaufSection,
  getRowStatus,
  isAblaufSectionTitle,
} from './room-content.utils';
import { RoomSection, TableData } from './hausplanung.models';

describe('room-content utils', () => {
  it('detects ablauf sections using supported title variants', () => {
    expect(isAblaufSectionTitle('Renovierungs-Ablauf Bad')).toBe(true);
    expect(isAblaufSectionTitle('Materialien')).toBe(false);
  });

  it('calculates progress from checklists and ablauf tables', () => {
    const sections: RoomSection[] = [
      {
        title: 'Checkliste',
        type: 'checklist',
        items: [
          { label: 'Abkleben', done: true },
          { label: 'Grundieren', done: false },
        ],
      },
      {
        title: 'Ablaufplan',
        type: 'table',
        items: {
          headers: ['Schritt', 'Status'],
          rows: [
            ['Elektro', 'Fertig'],
            ['Sanitär', 'Offen'],
          ],
        },
      },
    ];

    expect(calculateRoomProgress(sections)).toEqual({
      total: 4,
      completed: 2,
      percentage: 50,
      upcomingTasks: ['Grundieren', 'Sanitär'],
    });
  });

  it('finds the ablauf section and reads table statuses', () => {
    const table: TableData = {
      headers: ['Gewerk', 'Status'],
      rows: [['Fliesen', 'Erledigt']],
    };

    const sections: RoomSection[] = [
      { title: 'Übersicht', type: 'text', items: 'Text' },
      { title: 'RENOVIERUNGSABLAUF', type: 'table', items: table },
    ];

    expect(findAblaufSection(sections)?.title).toBe('RENOVIERUNGSABLAUF');
    expect(getRowStatus(table, table.rows[0])).toBe('Erledigt');
  });
});

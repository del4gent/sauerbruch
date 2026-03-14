import { describe, expect, it } from 'vitest';

import { buildImageGroups, selectRoomMedia } from './room-media.utils';
import { Material } from './hausplanung.models';

describe('room-media utils', () => {
  it('builds image groups and sorts materials by status priority', () => {
    const materials: Material[] = [
      {
        id: '1',
        name: 'Armatur',
        brand: 'A',
        specs: 'Spec',
        image: 'assets/rooms/bad/medien/material/armatur.png',
        status: 'In Auswahl',
        quantity: '1',
        price: '100 €',
        shop: 'Shop',
        link: null,
      },
      {
        id: '2',
        name: 'Waschtisch',
        brand: 'B',
        specs: 'Spec',
        image: 'assets/rooms/bad/medien/material/waschtisch.png',
        status: 'Gekauft',
        quantity: '1',
        price: '200 €',
        shop: 'Shop',
        link: null,
      },
    ];

    const groups = buildImageGroups(
      [
        'assets/rooms/bad/medien/plan/grundriss.png',
        'assets/rooms/bad/medien/inspiration/titel.png',
        'assets/rooms/bad/medien/ist/vorher.png',
      ],
      materials
    );

    expect(groups.find((group) => group.id === 'material')?.images).toEqual([
      'assets/rooms/bad/medien/material/waschtisch.png',
      'assets/rooms/bad/medien/material/armatur.png',
    ]);
  });

  it('prefers before/after media when plan and bestand images exist', () => {
    expect(
      selectRoomMedia([
        'assets/rooms/bad/medien/plan/grundriss.png',
        'assets/rooms/bad/medien/ist/vorher.png',
      ])
    ).toEqual({
      heroImage: null,
      beforeImage: 'assets/rooms/bad/medien/plan/grundriss.png',
      afterImage: 'assets/rooms/bad/medien/ist/vorher.png',
    });

    expect(selectRoomMedia(['assets/rooms/bad/medien/inspiration/titel.png']).heroImage).toBe(
      'assets/rooms/bad/medien/inspiration/titel.png'
    );
  });
});

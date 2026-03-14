import { MATERIAL_STATUS_ORDER } from './hausplanung.constants';
import { ImageGroup, Material, RoomMediaState } from './hausplanung.models';

const GROUP_ICONS: Record<ImageGroup['id'], string> = {
  plan: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
  soll: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  material: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
  ist: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
};

export function buildImageGroups(allImages: string[], materials: Material[]): ImageGroup[] {
  const sortedMaterials = [...materials].sort(
    (a, b) => (MATERIAL_STATUS_ORDER[a.status] ?? 99) - (MATERIAL_STATUS_ORDER[b.status] ?? 99)
  );

  return [
    {
      id: 'plan',
      label: 'Pläne',
      icon: GROUP_ICONS.plan,
      images: allImages.filter((image) => image.includes('/plan/')),
    },
    {
      id: 'soll',
      label: 'Inspiration',
      icon: GROUP_ICONS.soll,
      images: allImages.filter((image) => image.includes('/inspiration/')),
    },
    {
      id: 'material',
      label: 'Material',
      icon: GROUP_ICONS.material,
      images:
        sortedMaterials.length > 0
          ? sortedMaterials.map((material) => material.image)
          : allImages.filter((image) => image.includes('/material/')),
      materials: sortedMaterials,
    },
    {
      id: 'ist',
      label: 'Bestand',
      icon: GROUP_ICONS.ist,
      images: allImages.filter((image) => image.includes('/ist/')),
    },
  ];
}

export function selectRoomMedia(images: string[]): RoomMediaState {
  const beforeImage = images.find(
    (image) => image.includes('/plan/') || image.includes('/inspiration/')
  );
  const afterImage = images.find((image) => image.includes('/ist/'));

  if (beforeImage && afterImage) {
    return {
      heroImage: null,
      beforeImage,
      afterImage,
    };
  }

  return {
    heroImage: images[0] ?? null,
    beforeImage: null,
    afterImage: null,
  };
}

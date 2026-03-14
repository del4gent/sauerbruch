import imageMetadataData from '../../../public/assets/data/image_metadata.json';
import imagesData from '../../../public/assets/data/images.json';
import materialsData from '../../../public/assets/data/materials.json';
import roomsData from '../../../public/assets/data/rooms.json';

import { Material, Room } from './hausplanung.models';

export const INITIAL_ROOMS = roomsData as Room[];
export const INITIAL_ROOM_IMAGES_MAP = imagesData as Record<string, string[]>;
export const INITIAL_IMAGE_METADATA_MAP = imageMetadataData as Record<string, string>;
export const INITIAL_ROOM_MATERIALS_MAP = materialsData as Record<string, Material[]>;

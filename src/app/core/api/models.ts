export interface CategoryChildDto {
  id?: string;
  name: string;
  description?: string;
  parentId?: string;
}

export interface CategoryParentDto {
  id?: string;
  name: string;
  description?: string;
  children?: CategoryParentDto[];
}

export interface StorageChildDto {
  id?: string;
  name: string;
  description?: string;
  parentId?: string;
}

export interface StorageParentDto {
  id?: string;
  name: string;
  description?: string;
  children?: StorageParentDto[];
}

export interface MediaDto {
  id?: string;
  fileName?: string;
  contentType?: string;
  fileSize?: number;
  itemId?: string;
}

export interface ItemDto {
  id?: string;
  name: string;
  description?: string;
  serialNumber?: string;
  modelNumber?: string;
  manufacturer?: string;
  quantity?: number;
  sold?: boolean;
  categoryId?: string;
  storageId?: string;
  media?: MediaDto[];
  // TODO(Backend): `thumbnailMediaId?: string` (ID des ersten Bildes) und `thumbnailUrl?: string`
  //  (optional, signiert) ergänzen. Siehe Kommentar in `media-image.service.ts`.
}

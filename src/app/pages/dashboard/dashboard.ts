import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, forkJoin, Observable, of } from 'rxjs';
import { CategoryService } from '../../core/api/category.service';
import { ItemService } from '../../core/api/item.service';
import { MediaService } from '../../core/api/media.service';
import { ItemDto, MediaDto } from '../../core/api/models';
import { StorageService } from '../../core/api/storage.service';
import { flattenTree } from '../../core/api/tree-utils';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';

interface TreeStats {
  total: number;
  topLevel: number;
}

interface DashboardData {
  items: ItemDto[] | null;
  categories: TreeStats | null;
  storages: TreeStats | null;
  media: MediaDto[] | null;
}

/** Übersicht im privaten Bereich: je Entität eine Kennzahlen-Karte. */
@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly itemApi = inject(ItemService);
  private readonly categoryApi = inject(CategoryService);
  private readonly storageApi = inject(StorageService);
  private readonly mediaApi = inject(MediaService);
  protected readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);

  protected readonly loading = signal(true);
  private readonly data = signal<DashboardData>({
    items: null,
    categories: null,
    storages: null,
    media: null,
  });

  protected readonly stats = computed(() => {
    const { items, categories, storages, media } = this.data();
    const locale = this.i18n.current();
    const number = (value: number) => new Intl.NumberFormat(locale).format(value);

    const sold = items?.filter((item) => item.sold).length ?? 0;
    const quantity = items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ?? 0;
    const bytes = media?.reduce((sum, m) => sum + (m.fileSize ?? 0), 0) ?? 0;

    return {
      items: {
        value: items ? number(items.length) : null,
        available: number((items?.length ?? 0) - sold),
        sold: number(sold),
        quantity: number(quantity),
      },
      categories: {
        value: categories ? number(categories.total) : null,
        topLevel: number(categories?.topLevel ?? 0),
      },
      storages: {
        value: storages ? number(storages.total) : null,
        topLevel: number(storages?.topLevel ?? 0),
      },
      media: {
        value: media ? number(media.length) : null,
        size: this.formatBytes(bytes, locale),
        images: number(media?.filter((m) => m.contentType?.startsWith('image/')).length ?? 0),
        pdfs: number(media?.filter((m) => m.contentType === 'application/pdf').length ?? 0),
      },
    };
  });

  ngOnInit(): void {
    // Jede Quelle einzeln abfangen, damit ein Fehler nicht das ganze Dashboard blockiert.
    const safe = <T>(source: Observable<T>): Observable<T | null> =>
      source.pipe(catchError(() => of(null)));
    forkJoin({
      items: safe(this.itemApi.getAll()),
      categories: safe(this.categoryApi.getAll()),
      storages: safe(this.storageApi.getAll()),
      media: safe(this.mediaApi.getAll()),
    }).subscribe(({ items, categories, storages, media }) => {
      this.data.set({
        items,
        categories: categories && {
          total: flattenTree(categories).length,
          topLevel: categories.length,
        },
        storages: storages && {
          total: flattenTree(storages).length,
          topLevel: storages.length,
        },
        media,
      });
      this.loading.set(false);
    });
  }

  private formatBytes(bytes: number, locale: string): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit++;
    }
    const digits = unit === 0 ? 0 : 1;
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value)} ${units[unit]}`;
  }
}

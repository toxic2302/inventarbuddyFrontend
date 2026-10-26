import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ItemService } from '../../core/api/item.service';
import { MediaService } from '../../core/api/media.service';
import { ItemDto, MediaDto } from '../../core/api/models';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-media',
  imports: [
    TranslatePipe,
    FormsModule,
    ButtonModule,
    DialogModule,
    FileUploadModule,
    InputTextModule,
    SelectModule,
    TableModule,
  ],
  templateUrl: './media.html',
})
export class Media implements OnInit {
  private readonly mediaApi = inject(MediaService);
  private readonly itemApi = inject(ItemService);
  private readonly messages = inject(MessageService);
  private readonly i18n = inject(I18nService);
  private readonly confirm = inject(ConfirmationService);

  protected readonly media = signal<MediaDto[]>([]);
  protected readonly items = signal<ItemDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editing = signal<MediaDto | null>(null);
  protected fileName = '';
  protected itemId: string | null = null;

  private readonly itemNames = computed(
    () => new Map(this.items().map((i) => [i.id ?? '', i.name])),
  );

  ngOnInit(): void {
    this.load();
  }

  protected itemName(id?: string): string {
    return (id && this.itemNames().get(id)) || '';
  }

  protected size(bytes?: number): string {
    if (bytes === undefined) {
      return '';
    }
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  protected load(): void {
    this.loading.set(true);
    forkJoin({ media: this.mediaApi.getAll(), items: this.itemApi.getAll() }).subscribe({
      next: ({ media, items }) => {
        this.media.set(media);
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error(this.i18n.t('common.loadFailed'));
      },
    });
  }

  protected upload(event: { files: File[] }): void {
    const file = event.files[0];
    if (!file) {
      return;
    }
    this.mediaApi.upload(file).subscribe({
      next: () => {
        this.success(this.i18n.t('common.uploaded'));
        this.load();
      },
      error: () => this.error(this.i18n.t('common.uploadFailed')),
    });
  }

  protected open(media: MediaDto): void {
    this.mediaApi.open(media);
  }

  protected openEdit(media: MediaDto): void {
    this.editing.set(media);
    this.fileName = media.fileName ?? '';
    this.itemId = media.itemId ?? null;
    this.dialogVisible.set(true);
  }

  protected save(): void {
    const media = this.editing();
    if (!media || !this.fileName.trim()) {
      return;
    }
    this.mediaApi
      .update({ ...media, fileName: this.fileName.trim(), itemId: this.itemId ?? undefined })
      .subscribe({
        next: () => {
          this.dialogVisible.set(false);
          this.success(this.i18n.t('common.saved'));
          this.load();
        },
        error: () => this.error(this.i18n.t('common.saveFailed')),
      });
  }

  protected remove(media: MediaDto): void {
    this.confirm.confirm({
      header: this.i18n.t('common.delete'),
      message: this.i18n.t('common.confirmDelete', { name: media.fileName }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18n.t('common.delete'),
      rejectLabel: this.i18n.t('common.cancel'),
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () =>
        this.mediaApi.delete(media.id!).subscribe({
          next: () => {
            this.success(this.i18n.t('common.deleted'));
            this.load();
          },
          error: () => this.error(this.i18n.t('common.deleteFailed')),
        }),
    });
  }

  private success(detail: string): void {
    this.messages.add({ severity: 'success', summary: this.i18n.t('common.success'), detail });
  }

  private error(detail: string): void {
    this.messages.add({ severity: 'error', summary: this.i18n.t('common.error'), detail });
  }
}

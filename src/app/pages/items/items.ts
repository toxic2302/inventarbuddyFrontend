import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DataViewModule } from 'primeng/dataview';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { CategoryService } from '../../core/api/category.service';
import { ItemService } from '../../core/api/item.service';
import { MediaImageService } from '../../core/api/media-image.service';
import { MediaService } from '../../core/api/media.service';
import { ItemDto, MediaDto } from '../../core/api/models';
import { StorageService } from '../../core/api/storage.service';
import { FlatOption, flattenTree } from '../../core/api/tree-utils';
import { I18nService } from '../../core/i18n/i18n.service';
import { MediaThumbnail } from '../../shared/media-thumbnail/media-thumbnail';

@Component({
  selector: 'app-items',
  imports: [
    TranslatePipe,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CheckboxModule,
    DataViewModule,
    DialogModule,
    FileUploadModule,
    InputNumberModule,
    InputTextModule,
    MediaThumbnail,
    SelectModule,
    SelectButtonModule,
    TagModule,
    TextareaModule,
  ],
  templateUrl: './items.html',
})
export class Items implements OnInit {
  private readonly itemApi = inject(ItemService);
  private readonly categoryApi = inject(CategoryService);
  private readonly storageApi = inject(StorageService);
  private readonly mediaApi = inject(MediaService);
  private readonly mediaImages = inject(MediaImageService);
  private readonly fb = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly i18n = inject(I18nService);
  private readonly confirm = inject(ConfirmationService);

  protected readonly items = signal<ItemDto[]>([]);
  protected readonly categories = signal<FlatOption[]>([]);
  protected readonly storages = signal<FlatOption[]>([]);
  protected readonly loading = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editing = signal<ItemDto | null>(null);

  protected readonly layout = signal<'list' | 'grid'>('grid');
  protected readonly search = signal('');
  protected readonly sort = signal<keyof ItemDto>('name');

  protected readonly layoutOptions = [
    { icon: 'pi pi-bars', value: 'list' },
    { icon: 'pi pi-th-large', value: 'grid' },
  ];
  protected readonly sortOptions = computed<{ label: string; value: keyof ItemDto }[]>(() => {
    this.i18n.current();
    return [
      { label: this.i18n.t('items.sort.name'), value: 'name' },
      { label: this.i18n.t('items.sort.manufacturer'), value: 'manufacturer' },
      { label: this.i18n.t('items.sort.model'), value: 'modelNumber' },
      { label: this.i18n.t('items.sort.serial'), value: 'serialNumber' },
      { label: this.i18n.t('items.sort.quantity'), value: 'quantity' },
    ];
  });

  protected readonly visibleItems = computed(() => {
    const term = this.search().trim().toLowerCase();
    const field = this.sort();
    const filtered = term
      ? this.items().filter((i) =>
          [i.name, i.description, i.serialNumber, i.modelNumber, i.manufacturer].some((v) =>
            v?.toLowerCase().includes(term),
          ),
        )
      : this.items();
    return [...filtered].sort((a, b) => {
      const x = a[field] ?? '';
      const y = b[field] ?? '';
      return typeof x === 'number' && typeof y === 'number'
        ? x - y
        : String(x).localeCompare(String(y), this.i18n.current(), { sensitivity: 'base' });
    });
  });

  private readonly categoryLabels = computed(() => this.toMap(this.categories()));
  private readonly storageLabels = computed(() => this.toMap(this.storages()));

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', [Validators.maxLength(1000)]],
    serialNumber: ['', [Validators.maxLength(255)]],
    modelNumber: ['', [Validators.maxLength(255)]],
    manufacturer: ['', [Validators.maxLength(255)]],
    quantity: [1, [Validators.min(0)]],
    sold: [false],
    categoryId: [null as string | null],
    storageId: [null as string | null],
  });

  ngOnInit(): void {
    this.load();
  }

  protected itemSubtitle(item: ItemDto): string {
    return [item.manufacturer, item.modelNumber, item.serialNumber && this.i18n.t('items.serialShort', { value: item.serialNumber })]
      .filter(Boolean)
      .join(' · ');
  }

  protected categoryName(id?: string): string {
    return (id && this.categoryLabels().get(id)) || '';
  }

  protected storageName(id?: string): string {
    return (id && this.storageLabels().get(id)) || '';
  }

  protected load(): void {
    this.loading.set(true);
    forkJoin({
      items: this.itemApi.getAll(),
      categories: this.categoryApi.getAll(),
      storages: this.storageApi.getAll(),
    }).subscribe({
      next: ({ items, categories, storages }) => {
        this.items.set(items);
        this.categories.set(flattenTree(categories));
        this.storages.set(flattenTree(storages));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error(this.i18n.t('common.loadFailed'));
      },
    });
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.form.reset({
      name: '',
      description: '',
      serialNumber: '',
      modelNumber: '',
      manufacturer: '',
      quantity: 1,
      sold: false,
      categoryId: null,
      storageId: null,
    });
    this.dialogVisible.set(true);
  }

  protected openEdit(item: ItemDto): void {
    this.editing.set(item);
    this.form.reset({
      name: item.name,
      description: item.description ?? '',
      serialNumber: item.serialNumber ?? '',
      modelNumber: item.modelNumber ?? '',
      manufacturer: item.manufacturer ?? '',
      quantity: item.quantity ?? 0,
      sold: item.sold ?? false,
      categoryId: item.categoryId ?? null,
      storageId: item.storageId ?? null,
    });
    this.dialogVisible.set(true);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const dto: ItemDto = {
      id: this.editing()?.id,
      name: value.name,
      description: value.description || undefined,
      serialNumber: value.serialNumber || undefined,
      modelNumber: value.modelNumber || undefined,
      manufacturer: value.manufacturer || undefined,
      quantity: value.quantity ?? 0,
      sold: value.sold,
      categoryId: value.categoryId ?? undefined,
      storageId: value.storageId ?? undefined,
    };
    const request = dto.id ? this.itemApi.update(dto) : this.itemApi.create(dto);
    request.subscribe({
      next: () => {
        this.dialogVisible.set(false);
        this.success(this.i18n.t('common.saved'));
        this.load();
      },
      error: () => this.error(this.i18n.t('common.saveFailed')),
    });
  }

  protected remove(item: ItemDto): void {
    this.confirm.confirm({
      header: this.i18n.t('common.delete'),
      message: this.i18n.t('common.confirmDelete', { name: item.name }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18n.t('common.delete'),
      rejectLabel: this.i18n.t('common.cancel'),
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () =>
        this.itemApi.delete(item.id!).subscribe({
          next: () => {
            this.success(this.i18n.t('common.deleted'));
            this.load();
          },
          error: () => this.error(this.i18n.t('common.deleteFailed')),
        }),
    });
  }

  protected uploadMedia(event: { files: File[] }): void {
    const item = this.editing();
    const file = event.files[0];
    if (!item?.id || !file) {
      return;
    }
    this.mediaApi.upload(file, item.id).subscribe({
      next: () => {
        this.success(this.i18n.t('common.uploaded'));
        this.refreshEditingItem(item.id!);
      },
      error: () => this.error(this.i18n.t('common.uploadFailed')),
    });
  }

  protected openMedia(media: MediaDto): void {
    this.mediaApi.open(media);
  }

  protected removeMedia(media: MediaDto): void {
    const item = this.editing();
    if (!media.id || !item?.id) {
      return;
    }
    this.mediaApi.delete(media.id).subscribe({
      next: () => {
        this.mediaImages.evict(media.id!);
        this.refreshEditingItem(item.id!);
      },
      error: () => this.error(this.i18n.t('common.deleteFailed')),
    });
  }

  private refreshEditingItem(id: string): void {
    this.itemApi.getById(id).subscribe((item) => {
      this.editing.set(item);
      this.items.update((list) => list.map((i) => (i.id === id ? item : i)));
    });
  }

  private toMap(options: FlatOption[]): Map<string, string> {
    return new Map(options.map((o) => [o.id, o.label]));
  }

  private success(detail: string): void {
    this.messages.add({ severity: 'success', summary: this.i18n.t('common.success'), detail });
  }

  private error(detail: string): void {
    this.messages.add({ severity: 'error', summary: this.i18n.t('common.error'), detail });
  }
}

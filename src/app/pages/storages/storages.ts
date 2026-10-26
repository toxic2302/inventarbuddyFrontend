import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ConfirmationService, MessageService, TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TreeTableModule } from 'primeng/treetable';
import { StorageService } from '../../core/api/storage.service';
import { StorageChildDto, StorageParentDto } from '../../core/api/models';
import { I18nService } from '../../core/i18n/i18n.service';

interface RowData {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
}

interface ParentOption {
  id: string;
  label: string;
}

/** Verwaltung der Lagerorte (hierarchische Daten). */
@Component({
  selector: 'app-storages',
  imports: [
    TranslatePipe,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    TreeTableModule,
  ],
  templateUrl: './storages.html',
})
export class Storages implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly i18n = inject(I18nService);
  private readonly confirm = inject(ConfirmationService);
  private readonly api = inject(StorageService);

  protected readonly nodes = signal<TreeNode<RowData>[]>([]);
  protected readonly loading = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editing = signal<RowData | null>(null);

  protected readonly parentOptions = computed<ParentOption[]>(() => {
    const own = this.editing();
    const result: ParentOption[] = [];
    const walk = (list: TreeNode<RowData>[], prefix: string, blocked: boolean) => {
      for (const node of list) {
        const data = node.data as RowData;
        const isBlocked = blocked || (own !== null && data.id === own.id);
        const label = prefix + data.name;
        if (!isBlocked) {
          result.push({ id: data.id, label });
        }
        walk(node.children ?? [], label + ' / ', isBlocked);
      }
    };
    walk(this.nodes(), '', false);
    return result;
  });

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', [Validators.maxLength(1000)]],
    parentId: [null as string | null],
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.api.getAll().subscribe({
      next: (data) => {
        this.nodes.set(this.toNodes(data));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error(this.i18n.t('common.loadFailed'));
      },
    });
  }

  protected openCreate(parent?: RowData): void {
    this.editing.set(null);
    this.form.reset({ name: '', description: '', parentId: parent?.id ?? null });
    this.dialogVisible.set(true);
  }

  protected openEdit(row: RowData): void {
    this.editing.set(row);
    this.form.reset({
      name: row.name,
      description: row.description ?? '',
      parentId: row.parentId ?? null,
    });
    this.dialogVisible.set(true);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const dto: StorageChildDto = {
      id: this.editing()?.id,
      name: value.name,
      description: value.description || undefined,
      parentId: value.parentId ?? undefined,
    };
    const request = dto.id ? this.api.update(dto) : this.api.create(dto);
    request.subscribe({
      next: () => {
        this.dialogVisible.set(false);
        this.success(this.i18n.t('common.saved'));
        this.load();
      },
      error: () => this.error(this.i18n.t('common.saveFailed')),
    });
  }

  protected remove(row: RowData): void {
    this.confirm.confirm({
      header: this.i18n.t('common.delete'),
      message: this.i18n.t('common.confirmDelete', { name: row.name }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18n.t('common.delete'),
      rejectLabel: this.i18n.t('common.cancel'),
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () =>
        this.api.delete(row.id).subscribe({
          next: () => {
            this.success(this.i18n.t('common.deleted'));
            this.load();
          },
          error: () => this.error(this.i18n.t('common.deleteFailed')),
        }),
    });
  }

  private toNodes(list: StorageParentDto[], parentId?: string): TreeNode<RowData>[] {
    return list.map((dto) => ({
      key: dto.id,
      expanded: true,
      data: { id: dto.id ?? '', name: dto.name, description: dto.description, parentId },
      children: this.toNodes(dto.children ?? [], dto.id),
    }));
  }

  private success(detail: string): void {
    this.messages.add({ severity: 'success', summary: this.i18n.t('common.success'), detail });
  }

  private error(detail: string): void {
    this.messages.add({ severity: 'error', summary: this.i18n.t('common.error'), detail });
  }
}

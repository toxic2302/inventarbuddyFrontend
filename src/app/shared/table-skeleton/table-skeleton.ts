import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {SkeletonModule} from 'primeng/skeleton';
import {TableModule} from 'primeng/table';

/**
 * Platzhalter-Tabelle, die angezeigt wird, solange die Daten einer Tabellenseite geladen werden.
 * `headers` sind die (bereits übersetzten) Spaltenüberschriften, `actions` fügt eine Aktionsspalte hinzu.
 */
@Component({
  selector: 'app-table-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TableModule, SkeletonModule],
  host: {'aria-busy': 'true'},
  template: `
    <p-table [value]="placeholder()" [tableStyle]="{ 'min-width': '40rem' }">
      <ng-template #header>
        <tr>
          @for (header of headers(); track $index) {
            <th>{{ header }}</th>
          }
          @if (actions()) {
            <th style="width: 10rem"></th>
          }
        </tr>
      </ng-template>
      <ng-template #body>
        <tr>
          @for (header of headers(); track $index) {
            <td>
              <p-skeleton class="block" height="1.25rem" [width]="$first ? '70%' : '55%'"/>
            </td>
          }
          @if (actions()) {
            <td>
              <div class="flex justify-end gap-1">
                <p-skeleton shape="circle" size="2rem"/>
                <p-skeleton shape="circle" size="2rem"/>
              </div>
            </td>
          }
        </tr>
      </ng-template>
    </p-table>
  `,
})
export class TableSkeleton {
  readonly headers = input.required<string[]>();
  readonly rows = input(5);
  readonly actions = input(true);

  protected readonly placeholder = computed(() => Array.from({length: this.rows()}, (_, i) => i));
}

import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';
import {I18nService, LanguageCode} from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-language-switcher',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inline-flex gap-1" role="group" [attr.aria-label]="'nav.language' | translate">
      @for (lang of i18n.languages; track lang.code) {
        <button
          type="button"
          class="inline-flex cursor-pointer rounded-border border bg-transparent p-1 transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
          [class]="i18n.current() === lang.code ? 'border-primary opacity-100' : 'border-transparent opacity-55 hover:opacity-100'"
          [attr.aria-pressed]="i18n.current() === lang.code"
          [title]="'language.' + lang.code | translate"
          [attr.aria-label]="'language.' + lang.code | translate"
          (click)="select(lang.code)"
        >
          <img class="block h-4 w-6 rounded-xs object-cover ring-1 ring-black/15" [src]="lang.flag" alt="" width="24" height="16"/>
        </button>
      }
    </div>
  `,
})
export class LanguageSwitcher {
  protected readonly i18n = inject(I18nService);

  protected select(code: LanguageCode): void {
    void this.i18n.use(code);
  }
}

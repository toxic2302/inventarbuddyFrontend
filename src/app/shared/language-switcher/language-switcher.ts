import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { I18nService, LanguageCode } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-language-switcher',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="switcher" role="group" [attr.aria-label]="'nav.language' | translate">
      @for (lang of i18n.languages; track lang.code) {
        <button
          type="button"
          class="flag"
          [class.active]="i18n.current() === lang.code"
          [attr.aria-pressed]="i18n.current() === lang.code"
          [title]="'language.' + lang.code | translate"
          [attr.aria-label]="'language.' + lang.code | translate"
          (click)="select(lang.code)"
        >
          <img [src]="lang.flag" alt="" width="24" height="16" />
        </button>
      }
    </div>
  `,
  styles: `
    .switcher {
      display: inline-flex;
      gap: 0.25rem;
    }

    .flag {
      display: inline-flex;
      padding: 0.25rem;
      border: 1px solid transparent;
      border-radius: var(--p-content-border-radius);
      background: transparent;
      cursor: pointer;
      opacity: 0.55;
      transition:
        opacity 0.15s,
        border-color 0.15s;

      &:hover {
        opacity: 1;
      }

      &.active {
        opacity: 1;
        border-color: var(--p-primary-color);
      }

      &:focus-visible {
        outline: 2px solid var(--p-primary-color);
        outline-offset: 1px;
      }
    }

    img {
      display: block;
      width: 24px;
      height: 16px;
      object-fit: cover;
      border-radius: 2px;
      box-shadow: 0 0 0 1px rgb(0 0 0 / 0.15);
    }
  `,
})
export class LanguageSwitcher {
  protected readonly i18n = inject(I18nService);

  protected select(code: LanguageCode): void {
    void this.i18n.use(code);
  }
}

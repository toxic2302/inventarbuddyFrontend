import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AuthService } from '../core/auth/auth.service';
import { I18nService } from '../core/i18n/i18n.service';
import { LanguageSwitcher } from '../shared/language-switcher/language-switcher';

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MenuModule,
    ButtonModule,
    TranslatePipe,
    LanguageSwitcher,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  protected readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);

  protected readonly menuItems = computed<MenuItem[]>(() => {
    this.i18n.current();
    return [
      {
        items: [{ label: this.i18n.t('nav.dashboard'), icon: 'pi pi-home', routerLink: '/dashboard' }],
      },
      {
        label: this.i18n.t('nav.inventory'),
        items: [
          { label: this.i18n.t('nav.items'), icon: 'pi pi-box', routerLink: '/items' },
          { label: this.i18n.t('nav.categories'), icon: 'pi pi-tags', routerLink: '/categories' },
          { label: this.i18n.t('nav.storages'), icon: 'pi pi-warehouse', routerLink: '/storages' },
          { label: this.i18n.t('nav.media'), icon: 'pi pi-images', routerLink: '/media' },
        ],
      },
    ];
  });

  protected logout(): void {
    void this.auth.logout();
  }
}

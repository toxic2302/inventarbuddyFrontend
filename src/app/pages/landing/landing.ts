import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AuthService } from '../../core/auth/auth.service';
import { LanguageSwitcher } from '../../shared/language-switcher/language-switcher';

/** Öffentlich erreichbare Startseite. */
@Component({
  selector: 'app-landing',
  imports: [ButtonModule, CardModule, RouterLink, TranslatePipe, LanguageSwitcher],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {
  protected readonly auth = inject(AuthService);

  protected readonly features = [
    { icon: 'pi pi-box', key: 'items' },
    { icon: 'pi pi-tags', key: 'categories' },
    { icon: 'pi pi-warehouse', key: 'storages' },
    { icon: 'pi pi-images', key: 'media' },
  ];

  protected login(): void {
    void this.auth.login();
  }
}

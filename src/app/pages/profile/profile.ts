import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { ProfileService, UserProfile } from '../../core/auth/profile.service';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, ButtonModule, CardModule, InputTextModule, TranslatePipe],
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  private readonly api = inject(ProfileService);
  private readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);
  private readonly i18n = inject(I18nService);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected profile: UserProfile = {};

  ngOnInit(): void {
    this.loading.set(true);
    this.api.get().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.fail(this.i18n.t('profile.loadFailed'), error);
      },
    });
  }

  protected save(): void {
    this.saving.set(true);
    this.api.update(this.profile).subscribe({
      next: () => {
        this.saving.set(false);
        this.messages.add({ severity: 'success', summary: this.i18n.t('profile.saved') });
      },
      error: (error) => {
        this.saving.set(false);
        this.fail(this.i18n.t('profile.saveFailed'), error);
      },
    });
  }

  protected changePassword(): void {
    void this.auth.changePassword();
  }

  private fail(summary: string, error: unknown): void {
    const detail =
      error instanceof HttpErrorResponse
        ? (error.error?.errorMessage ?? error.error?.error ?? error.message)
        : undefined;
    this.messages.add({ severity: 'error', summary, detail });
  }
}

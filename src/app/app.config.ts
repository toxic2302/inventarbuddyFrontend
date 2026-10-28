import {ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners,} from '@angular/core';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {provideRouter, withComponentInputBinding} from '@angular/router';
import {provideTranslateLoader, provideTranslateService} from '@ngx-translate/core';
import {ConfirmationService, MessageService} from 'primeng/api';
import {providePrimeNG} from 'primeng/config';
import {environment} from '../environments/environment';
import {routes} from './app.routes';
import {AppTheme} from './theme';
import {authInterceptor} from './core/auth/auth.interceptor';
import {AuthService} from './core/auth/auth.service';
import {HttpTranslateLoader} from './core/i18n/http-translate-loader';
import {FALLBACK_LANGUAGE, I18nService} from './core/i18n/i18n.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTranslateService({
      fallbackLang: FALLBACK_LANGUAGE,
      loader: provideTranslateLoader(HttpTranslateLoader),
    }),
    provideAppInitializer(() => inject(I18nService).init()),
    provideAppInitializer(() => inject(AuthService).init()),
    providePrimeNG({
      license: environment.primeLicenseKey,
      theme: {
        preset: AppTheme,
        options: {
          // Tailwind-Utilities sollen PrimeNG-Styles überschreiben können (Reihenfolge siehe src/tailwind.css).
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng',
          },
        },
      },
    }),
    MessageService,
    ConfirmationService,
  ],
};

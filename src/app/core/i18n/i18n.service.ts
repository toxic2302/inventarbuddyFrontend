import {DOCUMENT} from '@angular/common';
import {inject, Injectable, signal} from '@angular/core';
import {TranslateService, TranslationObject} from '@ngx-translate/core';
import {PrimeNG} from 'primeng/config';
import {firstValueFrom} from 'rxjs';

export type LanguageCode = 'en' | 'de';

export interface LanguageOption {
  code: LanguageCode;
  flag: string;
}

export const FALLBACK_LANGUAGE: LanguageCode = 'en';

export const LANGUAGES: readonly LanguageOption[] = [
  {code: 'en', flag: 'flags/gb.svg'},
  {code: 'de', flag: 'flags/de.svg'},
];

const STORAGE_KEY = 'inventarbuddy.language';

@Injectable({providedIn: 'root'})
export class I18nService {
  private readonly translate = inject(TranslateService);
  private readonly primeng = inject(PrimeNG);
  private readonly document = inject(DOCUMENT);

  readonly languages = LANGUAGES;
  readonly current = signal<LanguageCode>(FALLBACK_LANGUAGE);

  async init(): Promise<void> {
    await firstValueFrom(this.translate.setFallbackLang(FALLBACK_LANGUAGE));
    await this.use(this.initialLanguage());
  }

  async use(code: LanguageCode): Promise<void> {
    await firstValueFrom(this.translate.use(code));
    this.current.set(code);
    this.document.documentElement.lang = code;
    this.primeng.setTranslation(this.translate.instant('primeng') as TranslationObject);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
    }
  }

  t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params) as string;
  }

  private initialLanguage(): LanguageCode {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    const candidates = [stored, ...(this.document.defaultView?.navigator.languages ?? [])];
    for (const candidate of candidates) {
      const code = candidate?.toLowerCase().split('-')[0];
      const match = LANGUAGES.find((l) => l.code === code);
      if (match) {
        return match.code;
      }
    }
    return FALLBACK_LANGUAGE;
  }
}

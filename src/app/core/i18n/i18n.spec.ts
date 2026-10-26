import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { PrimeNG } from 'primeng/config';
import { I18nService } from './i18n.service';
import de from '../../../../public/i18n/de.json';
import en from '../../../../public/i18n/en.json';

function keys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null
      ? keys(value as Record<string, unknown>, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe('i18n', () => {
  it('has the same keys in English and German', () => {
    expect(keys(de).sort()).toEqual(keys(en).sort());
  });

  it('switches language and falls back to English', async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideTranslateService({ fallbackLang: 'en' }), PrimeNG],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', { ...en, onlyEnglish: 'only' });
    translate.setTranslation('de', de);
    const i18n = TestBed.inject(I18nService);

    await i18n.use('de');
    expect(i18n.t('nav.items')).toBe('Gegenstände');
    expect(i18n.t('onlyEnglish')).toBe('only');
    expect(document.documentElement.lang).toBe('de');

    await i18n.use('en');
    expect(i18n.t('nav.items')).toBe('Items');
    expect(localStorage.getItem('inventarbuddy.language')).toBe('en');
  });
});

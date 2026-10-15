import { test, expect } from 'bun:test';
import { resolveLocale } from './i18n';

test('Saved supported locale wins; browser language order and invalid preferences resolve safely', () => {
  expect(resolveLocale('en', ['zh-TW'])).toBe('en');
  expect(resolveLocale('zh-Hant', ['en-US'])).toBe('zh-Hant');
  expect(resolveLocale(null, ['fr-FR', 'en-GB', 'zh-TW'])).toBe('en');
  expect(resolveLocale(null, ['zh-HK', 'en-US'])).toBe('zh-Hant');
  expect(resolveLocale('__proto__', ['en-US'])).toBe('en');
  expect(resolveLocale('unsupported', ['zh-CN'])).toBe('zh-Hant');
  expect(resolveLocale(null, ['english', 'fr-FR'])).toBe('zh-Hant');
  expect(resolveLocale(null, [])).toBe('zh-Hant');
});

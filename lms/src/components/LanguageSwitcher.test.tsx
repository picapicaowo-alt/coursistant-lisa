import '@testing-library/jest-dom';
import {render} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import i18n, {LANGUAGE_SWITCHER_ENABLED, SUPPORTED_LOCALES} from '../i18n';
import LanguageSwitcher from './LanguageSwitcher';

describe('temporary English-only language mode', () => {
  it('keeps the incomplete language picker hidden and starts in English', () => {
    const {container} = render(<LanguageSwitcher/>);

    expect(LANGUAGE_SWITCHER_ENABLED).toBe(false);
    expect(SUPPORTED_LOCALES).toEqual(['en']);
    expect(i18n.resolvedLanguage).toBe('en');
    expect(container).toBeEmptyDOMElement();
  });
});

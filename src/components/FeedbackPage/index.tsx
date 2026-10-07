import React, {useEffect, useState} from 'react';
import FeedbackForm from '@site/src/components/FeedbackForm';
import FeedbackLocaleBar from '@site/src/components/FeedbackForm/FeedbackLocaleBar';
import {
  FEEDBACK_PAGE_STRINGS,
  type FeedbackLocale,
} from '@site/src/components/FeedbackForm/localeStrings';
import {detectBrowserLocale} from '@site/src/utils/browserLocale';

const STORAGE_KEY = 'kigwiki-feedback-locale';
const GITHUB_ISSUES = 'https://github.com/kig-wiki/kigwiki/issues';

function readStoredLocale(): FeedbackLocale | null {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    if (value === 'en' || value === 'zh' || value === 'ja') {
      return value;
    }
  } catch {
    // private mode / blocked storage
  }
  return null;
}

function storeLocale(locale: FeedbackLocale): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // private mode / blocked storage
  }
}

export default function FeedbackPage(): React.JSX.Element {
  const [locale, setLocale] = useState<FeedbackLocale>('en');

  useEffect(() => {
    setLocale(readStoredLocale() ?? detectBrowserLocale());
  }, []);

  function handleLocaleChange(next: FeedbackLocale) {
    setLocale(next);
    storeLocale(next);
  }

  const page = FEEDBACK_PAGE_STRINGS[locale];
  const lang = locale === 'zh' ? 'zh-Hans' : locale;

  return (
    <div lang={lang}>
      <FeedbackLocaleBar
        locale={locale}
        onChange={handleLocaleChange}
        label={page.languageLabel}
      />

      <h1>{page.title}</h1>

      <p>
        {page.githubLead}{' '}
        <a href={GITHUB_ISSUES} target="_blank" rel="noopener noreferrer">
          {page.githubLink}
        </a>
        {locale === 'ja' ? 'してください。' : locale === 'zh' ? '。' : '.'}
      </p>

      <p>{page.formLead}</p>

      <FeedbackForm locale={locale} />
    </div>
  );
}

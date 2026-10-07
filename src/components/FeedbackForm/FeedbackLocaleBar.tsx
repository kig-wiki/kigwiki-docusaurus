import React from 'react';
import type {FeedbackLocale} from './localeStrings';
import {LOCALE_OPTION_LABELS} from './localeStrings';
import styles from './styles.module.css';

const LOCALES: FeedbackLocale[] = ['en', 'zh', 'ja'];

type Props = {
  locale: FeedbackLocale;
  onChange: (locale: FeedbackLocale) => void;
  label: string;
};

export default function FeedbackLocaleBar({
  locale,
  onChange,
  label,
}: Props): React.JSX.Element {
  return (
    <nav className={styles.localeBar} aria-label={label}>
      {LOCALES.map((id, index) => (
        <React.Fragment key={id}>
          {index > 0 ? (
            <span className={styles.localeSep} aria-hidden="true">
              /
            </span>
          ) : null}
          {id === locale ? (
            <span className={styles.localeCurrent} aria-current="true">
              {LOCALE_OPTION_LABELS[id]}
            </span>
          ) : (
            <button
              type="button"
              className={styles.localeButton}
              onClick={() => onChange(id)}
            >
              {LOCALE_OPTION_LABELS[id]}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

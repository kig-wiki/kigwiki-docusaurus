import React, {FormEvent, useCallback, useEffect, useId, useRef, useState} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  FEEDBACK_FORM_STRINGS,
  type FeedbackLocale,
} from './localeStrings';
import styles from './styles.module.css';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_NAME_LENGTH = 100;
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          language?: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

let turnstileScriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }
  if (window.turnstile) {
    return Promise.resolve();
  }
  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(), {once: true});
      existing.addEventListener('error', () => reject(new Error('Turnstile failed to load')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile failed to load'));
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

type Props = {
  locale?: FeedbackLocale;
};

export default function FeedbackForm({locale = 'en'}: Props): React.JSX.Element {
  const strings = FEEDBACK_FORM_STRINGS[locale];
  const {siteConfig} = useDocusaurusContext();
  const siteKey = String(siteConfig.customFields?.turnstileSiteKey ?? '');
  const nameId = useId();
  const messageId = useId();

  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const widgetHostRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const resetTurnstile = useCallback(() => {
    setToken(null);
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  useEffect(() => {
    if (!siteKey || !widgetHostRef.current) {
      return undefined;
    }

    let cancelled = false;
    setToken(null);

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !widgetHostRef.current || !window.turnstile) {
          return;
        }
        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
        widgetHostRef.current.innerHTML = '';
        widgetIdRef.current = window.turnstile.render(widgetHostRef.current, {
          sitekey: siteKey,
          language: strings.turnstileLanguage,
          callback: (nextToken) => setToken(nextToken),
          'expired-callback': () => setToken(null),
          'error-callback': () => setToken(null),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage(strings.errorTurnstileLoad);
          setSubmitState('error');
        }
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, strings.errorTurnstileLoad, strings.turnstileLanguage]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setErrorMessage(strings.errorEmpty);
      setSubmitState('error');
      return;
    }
    if (!token) {
      setErrorMessage(strings.errorCaptcha);
      setSubmitState('error');
      return;
    }

    setSubmitState('submitting');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: name.trim() || undefined,
          message: trimmedMessage,
          turnstileToken: token,
          locale,
        }),
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      setSubmitState('success');
      setName('');
      setMessage('');
      resetTurnstile();
    } catch {
      setSubmitState('error');
      setErrorMessage(strings.errorGeneric);
      resetTurnstile();
    }
  }

  if (!siteKey) {
    return (
      <div className={styles.unconfigured} role="status">
        {strings.unconfigured}
      </div>
    );
  }

  if (submitState === 'success') {
    return (
      <p className={`${styles.status} ${styles.statusSuccess}`} role="status">
        {strings.success}
      </p>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={nameId}>
          {strings.nameLabel} <span aria-hidden="true">{strings.nameOptional}</span>
        </label>
        <p className={styles.hint} id={`${nameId}-hint`}>
          {strings.nameHint}
        </p>
        <input
          id={nameId}
          className={styles.input}
          type="text"
          name="name"
          autoComplete="nickname"
          maxLength={MAX_NAME_LENGTH}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={strings.namePlaceholder}
          aria-describedby={`${nameId}-hint`}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={messageId}>
          {strings.messageLabel}
        </label>
        <textarea
          id={messageId}
          className={styles.textarea}
          name="message"
          required
          maxLength={MAX_MESSAGE_LENGTH}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={strings.messagePlaceholder}
        />
        <span className={styles.charCount}>
          {message.length}/{MAX_MESSAGE_LENGTH}
        </span>
      </div>

      <div className={styles.turnstile} ref={widgetHostRef} />

      <div className={styles.actions}>
        <button
          type="submit"
          className={`button button--primary ${styles.submit}`}
          disabled={submitState === 'submitting' || !token}
        >
          {submitState === 'submitting' ? strings.submitting : strings.submit}
        </button>
        {submitState === 'error' && errorMessage ? (
          <p className={`${styles.status} ${styles.statusError}`} role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </form>
  );
}

import React, {FormEvent, useCallback, useEffect, useId, useRef, useState} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
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

export default function FeedbackForm(): React.JSX.Element {
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

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !widgetHostRef.current || !window.turnstile || widgetIdRef.current) {
          return;
        }
        widgetIdRef.current = window.turnstile.render(widgetHostRef.current, {
          sitekey: siteKey,
          callback: (nextToken) => setToken(nextToken),
          'expired-callback': () => setToken(null),
          'error-callback': () => setToken(null),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage('Security check failed to load. Please refresh and try again.');
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
  }, [siteKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setErrorMessage('Please enter a message.');
      setSubmitState('error');
      return;
    }
    if (!token) {
      setErrorMessage('Please complete the security check.');
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
      setErrorMessage('Something went wrong. Please try again in a moment.');
      resetTurnstile();
    }
  }

  if (!siteKey) {
    return (
      <div className={styles.unconfigured} role="status">
        Feedback form unavailable on this build. Production sets{' '}
        <code>TURNSTILE_SITE_KEY</code> at build time.
      </div>
    );
  }

  if (submitState === 'success') {
    return (
      <p className={`${styles.status} ${styles.statusSuccess}`} role="status">
        Thanks - your message was received. We may not reply to every submission, but we do read
        them.
      </p>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={nameId}>
          Name <span aria-hidden="true">(optional)</span>
        </label>
        <p className={styles.hint} id={`${nameId}-hint`}>
          Leave blank to stay anonymous - a name is not required.
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
          placeholder="Anonymous"
          aria-describedby={`${nameId}-hint`}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={messageId}>
          Your question or feedback
        </label>
        <textarea
          id={messageId}
          className={styles.textarea}
          name="message"
          required
          maxLength={MAX_MESSAGE_LENGTH}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="What would you like to ask or share?"
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
          {submitState === 'submitting' ? 'Sending…' : 'Submit'}
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

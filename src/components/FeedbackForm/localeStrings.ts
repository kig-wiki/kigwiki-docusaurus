import type {SiteLocale} from '@site/src/utils/browserLocale';

export type FeedbackLocale = SiteLocale;

export type FeedbackFormStrings = {
  nameLabel: string;
  nameOptional: string;
  nameHint: string;
  namePlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  submit: string;
  submitting: string;
  success: string;
  errorEmpty: string;
  errorCaptcha: string;
  errorGeneric: string;
  errorTurnstileLoad: string;
  unconfigured: string;
  turnstileLanguage: string;
};

export type FeedbackPageStrings = {
  title: string;
  githubLead: string;
  githubLink: string;
  formLead: string;
  languageLabel: string;
};

export const FEEDBACK_FORM_STRINGS: Record<FeedbackLocale, FeedbackFormStrings> = {
  en: {
    nameLabel: 'Name',
    nameOptional: '(optional)',
    nameHint: 'Leave blank to stay anonymous - a name is not required.',
    namePlaceholder: 'Anonymous',
    messageLabel: 'Your question or feedback',
    messagePlaceholder: 'What would you like to ask or share?',
    submit: 'Submit',
    submitting: 'Sending…',
    success:
      'Thanks - your message was received. We may not reply to every submission, but we do read them.',
    errorEmpty: 'Please enter a message.',
    errorCaptcha: 'Please complete the security check.',
    errorGeneric: 'Something went wrong. Please try again in a moment.',
    errorTurnstileLoad: 'Security check failed to load. Please refresh and try again.',
    unconfigured:
      'Feedback form unavailable on this build. Production sets TURNSTILE_SITE_KEY at build time.',
    turnstileLanguage: 'en',
  },
  zh: {
    nameLabel: '名字',
    nameOptional: '（选填）',
    nameHint: '留空即可匿名提交。',
    namePlaceholder: '匿名',
    messageLabel: '你的问题或反馈',
    messagePlaceholder: '想说什么都可以',
    submit: '提交',
    submitting: '发送中…',
    success: '收到了，谢谢。不一定每条都会回复，但我们都会看。',
    errorEmpty: '请填写内容。',
    errorCaptcha: '请完成安全验证。',
    errorGeneric: '出了点问题，请稍后再试。',
    errorTurnstileLoad: '安全验证加载失败，请刷新页面再试。',
    unconfigured: '当前构建未配置反馈表单。生产环境需在构建时设置 TURNSTILE_SITE_KEY。',
    turnstileLanguage: 'zh-cn',
  },
  ja: {
    nameLabel: '名前',
    nameOptional: '（任意）',
    nameHint: '名前を入力せず、匿名で送信できます。',
    namePlaceholder: '匿名',
    messageLabel: '質問・フィードバック',
    messagePlaceholder: '聞きたいことや伝えたいことを書いてください',
    submit: '送信',
    submitting: '送信中…',
    success:
      '送信ありがとうございました。すべてのメッセージに返信できるとは限りませんが、必ず目を通しています。',
    errorEmpty: 'メッセージを入力してください。',
    errorCaptcha: 'セキュリティチェックを完了してください。',
    errorGeneric: 'エラーが発生しました。しばらくしてからもう一度お試しください。',
    errorTurnstileLoad:
      'セキュリティチェックの読み込みに失敗しました。ページを更新して再度お試しください。',
    unconfigured:
      'このビルドではフィードバックフォームを利用できません。本番ではビルド時に TURNSTILE_SITE_KEY を設定します。',
    turnstileLanguage: 'ja',
  },
};

export const FEEDBACK_PAGE_STRINGS: Record<FeedbackLocale, FeedbackPageStrings> = {
  en: {
    title: 'Ask a Question or Submit Feedback',
    githubLead: 'For a correction or feature request that can be discussed publicly, please',
    githubLink: 'open a GitHub issue',
    formLead: 'If you prefer not to use GitHub, send a message with the form below.',
    languageLabel: 'Language',
  },
  zh: {
    title: '提问或提交反馈',
    githubLead: '如果是可以公开讨论的勘误或功能建议，请到',
    githubLink: 'GitHub 开 issue',
    formLead: '不想用 GitHub 的话，用下面的表单发消息就行。名字可以不填。',
    languageLabel: '语言',
  },
  ja: {
    title: '質問・フィードバックを送る',
    githubLead: '公開の場で話し合える修正提案や機能要望は、',
    githubLink: 'GitHub で Issue を作成',
    formLead: 'GitHub を使わない場合は、下のフォームから送れます。名前は空欄でも大丈夫です。',
    languageLabel: '言語',
  },
};

export const LOCALE_OPTION_LABELS: Record<FeedbackLocale, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
};

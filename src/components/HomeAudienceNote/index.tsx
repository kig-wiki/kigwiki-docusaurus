import React, {useEffect, useState} from 'react';
import Link from '@docusaurus/Link';
import Admonition from '@theme/Admonition';
import {detectBrowserLocale, type SiteLocale} from '@site/src/utils/browserLocale';

export default function HomeAudienceNote(): React.JSX.Element | null {
  const [locale, setLocale] = useState<SiteLocale | null>(null);

  useEffect(() => {
    setLocale(detectBrowserLocale());
  }, []);

  if (locale === 'zh') {
    return (
      <div lang="zh-Hans">
        <Admonition type="note">
          <p>
            你好。这个站主要面向刚开始接触 Kigurumi 的英语圈读者，内容包括如何入门、寻找商家、尽量安全地下单，以及日常保养。
          </p>
          <p>
            中文圈子里的相关经验和资料比英文资料丰富、完整得多，所以我很想听听你对这个站的看法。如果你发现错误、觉得有可以改进的地方，或者发现我遗漏了英语圈新手应该了解的内容，欢迎告诉我。
          </p>
          <p>
            愿意的话，可以直接在
            <Link to="/feedback/">反馈页</Link>
            留个言。无需使用 GitHub，名字也可以不填。
          </p>
        </Admonition>
      </div>
    );
  }

  if (locale === 'ja') {
    return (
      <div lang="ja">
        <Admonition type="note">
          <p>
            こんにちは。このサイトは主に、これから着ぐるみを始める英語圏の読者に向けて、入門方法、メーカーの探し方、できるだけ安全に注文する方法、日々のお手入れなどを紹介しています。
          </p>
          <p>
            日本語圏や中国語圏のコミュニティには、英語圏よりも詳しい情報が多くあります。そのため、ぜひこのサイトへのご意見を伺いたいです。誤りや改善点、または英語圏の初心者が知っておくべきなのに抜けている情報があれば、教えてください。
          </p>
          <p>
            よければ、
            <Link to="/feedback/">フィードバックページ</Link>
            から気軽にメッセージをお送りください。GitHub アカウントは不要で、名前も空欄のままで大丈夫です。
          </p>
        </Admonition>
      </div>
    );
  }

  return null;
}

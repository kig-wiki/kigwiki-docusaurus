import React, { memo } from 'react';
import type { SocialLinks } from '../../plugins/docusaurus-plugin-maker-data';
import LinkIcon from './LinkIcon';
import { hasSocialEntriesWithUrls, hasValidWebsite } from '../../utils/makerSocialUtils';

interface LinksFieldGroupProps {
  fieldClassName: string;
  website?: string;
  taobaoStore?: string;
  socials?: SocialLinks;
}

const LinksFieldGroup: React.FC<LinksFieldGroupProps> = memo(
  ({ fieldClassName, website, taobaoStore, socials }) => {
    const showWebsite = hasValidWebsite(website);
    const showTaobaoStore = hasValidWebsite(taobaoStore);
    const showSocials = hasSocialEntriesWithUrls(socials);
    if (!showWebsite && !showTaobaoStore && !showSocials) {
      return null;
    }

    return (
      <div className={fieldClassName}>
        <span className="field-label">Links:</span>
        <div className="links-container">
          {showWebsite && (
            <LinkIcon platform="website" url={website!} isWebsite={true} />
          )}
          {showTaobaoStore && (
            <LinkIcon platform="Taobao Store" url={taobaoStore!} />
          )}
          {showSocials &&
            Object.entries(socials!).map(([platform, url]) => (
              <LinkIcon key={platform} platform={platform} url={String(url)} />
            ))}
        </div>
      </div>
    );
  }
);

LinksFieldGroup.displayName = 'LinksFieldGroup';

export default LinksFieldGroup;

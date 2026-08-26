import React, { memo } from 'react';
import type { SocialLinks } from '../../plugins/docusaurus-plugin-maker-data';
import LinkIcon from './LinkIcon';
import NsfwContentWarningDialog from './NsfwContentWarningDialog';
import { useNsfwContentWarning } from '../../hooks/useNsfwContentWarning';
import { hasSocialEntriesWithUrls, hasValidWebsite } from '../../utils/makerSocialUtils';
import { hasNsfwConsent } from '../../utils/nsfwConsent';

interface LinksFieldGroupProps {
  fieldClassName: string;
  makerName: string;
  contentWarning?: boolean;
  website?: string;
  taobaoStore?: string;
  socials?: SocialLinks;
}

const LinksFieldGroup: React.FC<LinksFieldGroupProps> = memo(
  ({ fieldClassName, makerName, contentWarning = false, website, taobaoStore, socials }) => {
    const { open, request, confirm, cancel } = useNsfwContentWarning(makerName, contentWarning);
    const showWebsite = hasValidWebsite(website);
    const showTaobaoStore = hasValidWebsite(taobaoStore);
    const showSocials = hasSocialEntriesWithUrls(socials);
    if (!showWebsite && !showTaobaoStore && !showSocials) {
      return null;
    }

    const handleSocialClick =
      (url: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (!contentWarning || hasNsfwConsent(makerName)) {
          return;
        }
        event.preventDefault();
        request(() => {
          window.open(url, '_blank', 'noopener,noreferrer');
        });
      };

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
              <LinkIcon
                key={platform}
                platform={platform}
                url={String(url)}
                onClick={handleSocialClick(String(url))}
              />
            ))}
        </div>
        <NsfwContentWarningDialog
          open={open}
          makerName={makerName}
          onConfirm={confirm}
          onCancel={cancel}
        />
      </div>
    );
  }
);

LinksFieldGroup.displayName = 'LinksFieldGroup';

export default LinksFieldGroup;

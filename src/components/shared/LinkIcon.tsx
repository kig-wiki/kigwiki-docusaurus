import React, { memo } from 'react';
import { getIconPath, isValidUrl } from '../../utils/makerSocialUtils';

interface LinkIconProps {
  platform: string;
  url: string;
  isWebsite?: boolean;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

const LinkIcon: React.FC<LinkIconProps> = memo(({ platform, url, isWebsite = false, onClick }) => {
  if (!isValidUrl(url) || url.trim() === '' || url === 'null' || url === 'undefined') {
    return null;
  }

  const iconPath = isWebsite ? null : getIconPath(platform);
  const displayName = isWebsite ? 'Website' : platform;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="link-item"
      title={`${displayName} - ${url}`}
      onClick={onClick}
    >
      {iconPath ? (
        <img 
          src={iconPath} 
          alt={displayName}
          className="link-icon"
        />
      ) : (
        <span className="link-text">{displayName}</span>
      )}
    </a>
  );
});

LinkIcon.displayName = 'LinkIcon';

export default LinkIcon;

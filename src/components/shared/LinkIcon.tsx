import React, { memo } from 'react';
import { getIconPath, isValidUrl } from '../../utils/makerSocialUtils';

interface LinkIconProps {
  platform: string;
  url: string;
  isWebsite?: boolean;
}

const LinkIcon: React.FC<LinkIconProps> = memo(({ platform, url, isWebsite = false }) => {
  // Enhanced validation - check for empty strings and invalid URLs
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

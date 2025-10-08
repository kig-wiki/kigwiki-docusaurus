import React, { memo } from 'react';
import { getStatusColor } from '../../utils/makerSocialUtils';

interface StatusBadgeProps {
  status?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = memo(({ status }) => {
  if (!status || typeof status !== 'string') return null;

  return (
    <span className={`status-badge ${getStatusColor(status)}`}>
      {status}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;

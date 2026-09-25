import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = (status || '').toLowerCase().replace(/_/g, ' ');

  let badgeClass = 'badge-default';

  if (['active', 'enrolled', 'excellent', 'passing', 'completed', 'good', 'very good'].includes(normalized)) {
    badgeClass = 'badge-success';
  } else if (['inactive', 'dropped', 'failed', 'terminated', 'suspended'].includes(normalized)) {
    badgeClass = 'badge-danger';
  } else if (['on leave', 'conditional', 'satisfactory', 'pending'].includes(normalized)) {
    badgeClass = 'badge-warning';
  } else if (['teaching', 'security shift', 'office', 'graduated'].includes(normalized)) {
    badgeClass = 'badge-info';
  }

  return <span className={`status-badge ${badgeClass}`}>{normalized}</span>;
};

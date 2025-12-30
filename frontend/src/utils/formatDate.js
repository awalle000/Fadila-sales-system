import { format, formatDistance, formatRelative } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'MMM dd, yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'MMM dd, yyyy hh:mm a');
};

export const formatTimeAgo = (date) => {
  if (!date) return 'N/A';
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
};

export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';
  return formatRelative(new Date(date), new Date());
};

export const formatTime = (date) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'hh:mm a');
};

export const getTodayDate = () => {
  return format(new Date(), 'yyyy-MM-dd');
};

export const getCurrentYear = () => {
  return new Date().getFullYear();
};

export const getCurrentMonth = () => {
  return new Date().getMonth() + 1;
};
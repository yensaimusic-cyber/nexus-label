export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getNavigationPath = (entityType: string, entityId: string): string | null => {
  switch (entityType) {
    case 'project':
      return `/projects/${entityId}`;
    case 'task':
      return `/tasks`;
    case 'meeting':
      return `/meetings`;
    case 'sortie':
      return `/sorties`;
    case 'artist':
      return `/artists/${entityId}`;
    default:
      return null;
  }
};

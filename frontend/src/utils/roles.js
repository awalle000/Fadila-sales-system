export const ROLES = {
  CEO: 'ceo',
  MANAGER: 'manager'
};

export const isCEO = (user) => {
  return user?.role === ROLES.CEO;
};

export const isManager = (user) => {
  return user?.role === ROLES.MANAGER;
};

export const canManageUsers = (user) => {
  return isCEO(user);
};

export const canDeleteProducts = (user) => {
  return isCEO(user);
};

export const canViewProfitLoss = (user) => {
  return isCEO(user);
};

export const canViewAllActivities = (user) => {
  return isCEO(user);
};

export const canRecordSales = (user) => {
  return user?.role === ROLES.CEO || user?.role === ROLES.MANAGER;
};

export const canManageProducts = (user) => {
  return user?.role === ROLES.CEO || user?.role === ROLES.MANAGER;
};

export const getRoleName = (role) => {
  switch (role) {
    case ROLES.CEO:
      return 'CEO';
    case ROLES.MANAGER:
      return 'Manager';
    default:
      return 'Unknown';
  }
};
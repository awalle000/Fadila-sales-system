export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. This action requires ${roles.join(' or ')} role.` 
      });
    }

    next();
  };
};

export const ceoOnly = authorize('ceo');
export const managerOrCeo = authorize('manager', 'ceo');
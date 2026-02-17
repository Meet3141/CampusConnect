const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // req.user.roles is an array — check if any role is allowed
    const userRoles = req.user.roles || [];
    const hasRole = userRoles.some((r) => allowedRoles.includes(r));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Insufficient permissions",
      });
    }

    next();
  };
};

export default authorize;

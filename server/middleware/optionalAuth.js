import jwt from "jsonwebtoken";

/**
 * optionalAuth — attaches req.user if a valid Bearer token is present.
 * Does NOT block unauthenticated requests; used for public routes that
 * need role-aware responses (e.g. showing unverified events to editors).
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, roles }
    }
  } catch {
    // Ignore invalid/expired tokens — treat as unauthenticated
  }
  next();
};

export default optionalAuth;

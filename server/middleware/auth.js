import jwt from "jsonwebtoken";

/**
 * auth middleware
 * Reads the JWT from:
 *  1. HttpOnly cookie "token"  ← primary (browser clients)
 *  2. Authorization: Bearer header ← fallback (Socket.IO initial handshake)
 *
 * Attaches { id, roles } to req.user on success.
 * Returns 401 for missing, invalid, or expired tokens.
 */
const auth = (req, res, next) => {
  try {
    // Priority 1: Cookie (HttpOnly — XSS safe)
    let token = req.cookies?.token;

    // Priority 2: Bearer header fallback (for Socket.IO / Postman)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, roles: decoded.roles || [] };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        error.name === "TokenExpiredError"
          ? "Token expired"
          : "Invalid token",
    });
  }
};

export default auth;

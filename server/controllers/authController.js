import jwt from "jsonwebtoken";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import asyncHandler from "../middleware/asyncHandler.js";


// REGISTER
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};

  // Validate required fields
  if (!name || !email || !password) {
    const error = new Error("Name, email, and password are required");
    error.statusCode = 400;
    throw error;
  }

  // Validate password strength before hashing
  const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  if (!pwdRegex.test(password)) {
    const error = new Error(
      "Password must be 8+ characters with uppercase, lowercase, and number"
    );
    error.statusCode = 400;
    throw error;
  }

  const exists = await User.findOne({ email });
  if (exists) {
    const error = new Error("User already exists");
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    name,
    email,
    password,
    roles: ["member"],
  });

  res.status(201).json({
    success: true,
    token: generateToken(user),
    user: user.toJSON(),
  });
});


// LOGIN
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  res.json({
    success: true,
    token: generateToken(user),
    user: user.toJSON(),
  });
});


// VERIFY TOKEN
export const verify = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    user: user.toJSON(),
  });
});


// REFRESH TOKEN
export const refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    const error = new Error("Token required");
    error.statusCode = 400;
    throw error;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET, {
    ignoreExpiration: true,
  });

  const newToken = generateToken({
    _id: decoded.id,
    roles: decoded.roles,
  });

  res.json({
    success: true,
    token: newToken,
  });
});

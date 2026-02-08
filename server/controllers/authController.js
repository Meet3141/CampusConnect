import jwt from "jsonwebtoken";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import asyncHandler from "../middleware/asyncHandler.js";


// REGISTER
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(409);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  res.status(201).json({
    success: true,
    token: generateToken(user),
    user: user.toJSON(),
  });
});


// LOGIN
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  res.json({
    success: true,
    token: generateToken(user),
    user: user.toJSON(),
  });
});


// VERIFY TOKEN
export const verify = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});


// REFRESH TOKEN
export const refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    res.status(400);
    throw new Error("Token required");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET, {
    ignoreExpiration: true,
  });

  const newToken = generateToken({
    _id: decoded.id,
    role: decoded.role,
  });

  res.json({
    success: true,
    token: newToken,
  });
});

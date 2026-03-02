import mongoose from "mongoose";
import { createHttpError } from "./httpError.js";

export const requireFields = (payload, requiredFields) => {
  const missing = requiredFields.filter((field) => {
    const value = payload?.[field];
    return value === undefined || value === null || value === "";
  });

  if (missing.length > 0) {
    throw createHttpError(400, `Missing required field(s): ${missing.join(", ")}`);
  }
};

export const ensureValidObjectId = (value, fieldName = "id") => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw createHttpError(400, `Invalid ${fieldName}`);
  }
};

export const ensureInEnum = (value, allowedValues, fieldName) => {
  if (!allowedValues.includes(value)) {
    throw createHttpError(
      400,
      `${fieldName} must be one of: ${allowedValues.join(", ")}`
    );
  }
};

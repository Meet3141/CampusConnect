import api from "../../services/api";

export const registerUser = async ({ name, email, password }) => {
  return api.post("/auth/register", { name, email, password });
};
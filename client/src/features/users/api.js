import api from "../../services/api";

export const fetchMyProfile = async () => {
  return api.get("/users/profile");
};

export const updateMyProfile = async (payload) => {
  return api.patch("/users/profile", payload);
};

export const fetchUserById = async (userId) => {
  return api.get(`/users/${userId}`);
};
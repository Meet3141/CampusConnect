import { useEffect, useState } from "react";
import { fetchUserById } from "./api";

export const useUserProfile = (userId) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError("");

    const load = async () => {
      try {
        const res = await fetchUserById(userId);
        if (!isMounted) return;
        setProfile(res.data.user);
      } catch (err) {
        if (!isMounted) return;
        setError(err.response?.data?.message || "User not found.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { profile, loading, error };
};
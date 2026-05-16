import { useCallback, useEffect, useState } from "react";
import { listClubs } from "./api";

export const useClubList = ({ q, category, limit = 20 } = {}) => {
  const [clubs, setClubs] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchClubs = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError("");
      try {
        const res = await listClubs({ page, limit, q, category });
        setClubs(res.data.data || []);
        setMeta(res.data.meta || { total: 0, page: 1, limit });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load clubs.");
      } finally {
        setLoading(false);
      }
    },
    [q, category, limit]
  );

  useEffect(() => {
    fetchClubs(1);
  }, [fetchClubs]);

  return { clubs, setClubs, meta, loading, error, fetchClubs };
};
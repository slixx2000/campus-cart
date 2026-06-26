"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UniversityRow } from "@/types/database";

type UseUniversitiesResult = {
  universities: UniversityRow[];
  isLoading: boolean;
  error: string | null;
};

export function useUniversities(): UseUniversitiesResult {
  const [universities, setUniversities] = useState<UniversityRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const supabase = createClient();

    async function loadUniversities() {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("universities")
        .select("id, code, name, short_name, city, province, created_at")
        .order("short_name", { ascending: true });

      if (!isActive) return;

      if (error) {
        setUniversities([]);
        setError("Unable to load universities right now.");
        setIsLoading(false);
        return;
      }

      setUniversities(data ?? []);
      setIsLoading(false);
    }

    void loadUniversities();

    return () => {
      isActive = false;
    };
  }, []);

  return { universities, isLoading, error };
}
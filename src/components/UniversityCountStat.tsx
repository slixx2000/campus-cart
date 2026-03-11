"use client";

import { useUniversities } from "@/hooks/useUniversities";

export default function UniversityCountStat() {
  const { universities, isLoading, error } = useUniversities();

  if (isLoading) {
    return <span>...</span>;
  }

  if (error) {
    return <span>0</span>;
  }

  return <span>{universities.length}</span>;
}
"use client";

import { useEffect, useState } from "react";
import { Agentation } from "agentation";

export default function AgentationWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || process.env.NODE_ENV !== "development") {
    return null;
  }

  return <Agentation />;
}


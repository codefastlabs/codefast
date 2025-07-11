"use client";

import { Progress } from "@codefast/ui";
import { useEffect, useState } from "react";

import type { JSX } from "react";

export function ProgressDemo(): JSX.Element {
  const [progress, setProgress] = useState(13);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(66);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return <Progress className="w-[60%]" value={progress} />;
}

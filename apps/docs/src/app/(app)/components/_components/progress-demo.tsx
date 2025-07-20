"use client";

import type { JSX } from "react";

import { useEffect, useState } from "react";

import { Progress } from "@codefast/ui";

export function ProgressDemo(): JSX.Element {
  const [progress, setProgress] = useState(13);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(66);
    }, 500);

    return (): void => {
      clearTimeout(timer);
    };
  }, []);

  return <Progress className="w-[60%]" value={progress} />;
}

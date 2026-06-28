import { Button } from "@codefast/ui/button";
import { ProgressCircle } from "@codefast/ui/progress-circle";
import { useEffect, useState } from "react";

export function ProgressCircleAnimated() {
  const [value, setValue] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) {
      return;
    }

    const id = setInterval(() => {
      setValue((previous) => Math.min(100, previous + 5));
    }, 150);

    return () => {
      clearInterval(id);
    };
  }, [running]);

  useEffect(() => {
    if (value >= 100) {
      setRunning(false);
    }
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-4">
      <ProgressCircle value={value} showValue />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setValue(0);
            setRunning(true);
          }}
        >
          Start
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setRunning(false);
            setValue(0);
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

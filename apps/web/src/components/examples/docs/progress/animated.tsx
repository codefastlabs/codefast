import { useEffect, useState } from "react";
import { Button } from "@codefast/ui/button";
import { Progress } from "@codefast/ui/progress";

export function ProgressAnimated() {
  const [value, setValue] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) {
      return;
    }

    const id = setInterval(() => {
      setValue((previous) => Math.min(100, previous + 4));
    }, 120);

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
    <div className="w-full max-w-xs space-y-3">
      <div className="flex justify-between text-xs text-ui-muted">
        <span>{value >= 100 ? "Complete" : running ? "Uploading…" : "Idle"}</span>
        <span className="tabular-nums">{value}%</span>
      </div>
      <Progress value={value} />
      <div className="flex justify-center gap-2">
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

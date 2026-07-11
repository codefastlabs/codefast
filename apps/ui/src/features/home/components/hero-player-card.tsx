import { Button } from "@codefast/ui/button";
import { cn } from "@codefast/ui/lib/utils";
import { Progress } from "@codefast/ui/progress";
import { Slider } from "@codefast/ui/slider";
import {
  AudioLinesIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  ShuffleIcon,
  SkipBackIcon,
  SkipForwardIcon,
  Volume2Icon,
} from "lucide-react";
import { useState } from "react";

/** Playable music-player card anchoring the hero showcase — every control is a real component. */
export function HeroPlayerCard() {
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-ui-border/60 bg-ui-card shadow-2xl shadow-black/10 dark:shadow-black/40">
      <div className="flex items-center justify-between border-b border-ui-border/60 px-5 py-3.5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-ui-muted uppercase">
          <AudioLinesIcon className="size-3.5" />
          Now playing
        </div>

        {/* Equalizer bars — bounce while playing, freeze mid-beat on pause. */}
        <div aria-hidden className={cn("flex h-4 items-end gap-0.5", !isPlaying && "[--equalizer-play:paused]")}>
          <span className="equalizer-bar h-full w-1 origin-bottom rounded-full bg-ui-brand" />
          <span className="equalizer-bar h-full w-1 origin-bottom rounded-full bg-ui-brand [--equalizer-delay:180ms]" />
          <span className="equalizer-bar h-full w-1 origin-bottom rounded-full bg-ui-brand [--equalizer-delay:320ms]" />
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--color-sky-400),var(--color-indigo-500))] text-lg font-bold text-white">
            CF
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ui-fg">Radix &amp; Chill</p>
            <p className="truncate text-xs text-ui-muted">The Primitives · Composable Hits</p>
          </div>
        </div>

        <div>
          <Progress value={42} aria-label="Track position" className="h-1" />
          <div className="mt-1.5 flex justify-between font-mono text-[10px] text-ui-muted tabular-nums">
            <span>1:24</span>
            <span>3:19</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Shuffle" className="text-ui-muted hover:text-ui-fg">
            <ShuffleIcon className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Previous track" className="text-ui-muted hover:text-ui-fg">
            <SkipBackIcon className="size-4" />
          </Button>
          <Button
            size="icon"
            aria-label={isPlaying ? "Pause" : "Play"}
            className="mx-1 size-11 rounded-full"
            onClick={() => {
              setIsPlaying((playing) => !playing);
            }}
          >
            {isPlaying ? <PauseIcon className="size-5" /> : <PlayIcon className="size-5" />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Next track" className="text-ui-muted hover:text-ui-fg">
            <SkipForwardIcon className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Repeat" className="text-ui-muted hover:text-ui-fg">
            <RepeatIcon className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Volume2Icon aria-hidden className="size-4 shrink-0 text-ui-muted" />
          <Slider defaultValue={[64]} max={100} step={1} aria-label="Volume" />
        </div>
      </div>
    </div>
  );
}

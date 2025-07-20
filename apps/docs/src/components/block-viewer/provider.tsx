import type { CSSProperties, JSX, ReactNode, RefObject } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";

import { useRef, useState } from "react";

import type { FileTree } from "@/lib/registry";
import type { RegistryItem } from "@/types/registry";

import { createContext } from "@radix-ui/react-context";

/**
 * Possible viewer display modes
 */
export type BlockViewMode = "code" | "preview";

/**
 * Context value for the Block Viewer component
 * Provides state and controls for viewing block components and their code
 */
export interface BlockViewerContextValue {
  /** Currently active/selected file path or null if none selected */
  activeFile: null | string;

  /** Registry item data without the component implementation */
  item: Omit<RegistryItem, "component">;

  /** Reference to the resizable panel for programmatic control */
  resizablePanelRef: RefObject<ImperativePanelHandle | null>;

  /** Set the active file by path */
  setActiveFile: (file: string) => void;

  /** Change the current display mode */
  setView: (view: BlockViewMode) => void;

  /** File structure tree for navigation */
  tree: FileTree[] | null;

  /** Current display mode - code or preview */
  view: BlockViewMode;
}

const BLOCK_VIEWER_NAME = "BlockViewerProvider";

const [BlockViewerContextProvider, useBlockViewer] =
  createContext<BlockViewerContextValue>(BLOCK_VIEWER_NAME);

interface BlockViewerProviderProps extends Pick<BlockViewerContextValue, "item" | "tree"> {
  children: ReactNode;
}

export function BlockViewerProvider({
  children,
  item,
  tree,
}: BlockViewerProviderProps): JSX.Element {
  const [view, setView] = useState<BlockViewerContextValue["view"]>("preview");
  const [activeFile, setActiveFile] = useState<BlockViewerContextValue["activeFile"]>(
    item.files?.[0].target ?? null,
  );
  const resizablePanelRef = useRef<ImperativePanelHandle>(null);

  return (
    <BlockViewerContextProvider
      activeFile={activeFile}
      item={item}
      resizablePanelRef={resizablePanelRef}
      setActiveFile={setActiveFile}
      setView={setView}
      tree={tree}
      view={view}
    >
      <div
        className="group/block-view-wrapper flex min-w-0 flex-col items-stretch gap-4"
        data-view={view}
        id={item.slug}
        style={{ "--height": "930px" } as CSSProperties}
      >
        {children}
      </div>
    </BlockViewerContextProvider>
  );
}

export { useBlockViewer };

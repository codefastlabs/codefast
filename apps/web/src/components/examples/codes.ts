// Barrel: re-exports every demo file as a raw source string via Vite ?raw.
//
// WHY: oxlint cannot resolve Vite's virtual ?raw suffix, so import/default is a
// false positive. The suppression is a config-level override in oxlint.config.ts
// targeting this file only — no inline disable comments needed elsewhere.
//
// HOW TO ADD A NEW DEMO
// 1. Create src/examples/<category>/<name>-demo.tsx
// 2. Add one export line below in the right category block.
// 3. Import the named export wherever the raw code string is needed.

// — Display —
export { default as alertDemoCode } from "./display/alert-demo?raw";
export { default as avatarDemoCode } from "./display/avatar-demo?raw";
export { default as badgeDemoCode } from "./display/badge-demo?raw";
export { default as kbdDemoCode } from "./display/kbd-demo?raw";
export { default as spinnerDemoCode } from "./display/spinner-demo?raw";

// — Form —
export { default as checkboxDemoCode } from "./form/checkbox-demo?raw";
export { default as inputDemoCode } from "./form/input-demo?raw";
export { default as radioGroupDemoCode } from "./form/radio-group-demo?raw";
export { default as selectDemoCode } from "./form/select-demo?raw";
export { default as sliderDemoCode } from "./form/slider-demo?raw";
export { default as switchDemoCode } from "./form/switch-demo?raw";
export { default as textareaDemoCode } from "./form/textarea-demo?raw";
export { default as toggleDemoCode } from "./form/toggle-demo?raw";

// — Navigation —
export { default as breadcrumbDemoCode } from "./navigation/breadcrumb-demo?raw";
export { default as paginationDemoCode } from "./navigation/pagination-demo?raw";
export { default as tabsDemoCode } from "./navigation/tabs-demo?raw";

// — Overlay —
export { default as dialogDemoCode } from "./overlay/dialog-demo?raw";
export { default as dropdownMenuDemoCode } from "./overlay/dropdown-menu-demo?raw";
export { default as popoverDemoCode } from "./overlay/popover-demo?raw";
export { default as tooltipDemoCode } from "./overlay/tooltip-demo?raw";

// — Feedback —
export { default as alertDialogDemoCode } from "./feedback/alert-dialog-demo?raw";
export { default as progressDemoCode } from "./feedback/progress-demo?raw";
export { default as skeletonDemoCode } from "./feedback/skeleton-demo?raw";

// — Layout —
export { default as accordionDemoCode } from "./layout/accordion-demo?raw";
export { default as cardDemoCode } from "./layout/card-demo?raw";
export { default as scrollAreaDemoCode } from "./layout/scroll-area-demo?raw";
export { default as separatorDemoCode } from "./layout/separator-demo?raw";

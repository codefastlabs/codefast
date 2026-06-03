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
export { default as alertDemoCode } from "#/components/examples/display/alert-demo?raw";
export { default as aspectRatioDemoCode } from "#/components/examples/display/aspect-ratio-demo?raw";
export { default as avatarDemoCode } from "#/components/examples/display/avatar-demo?raw";
export { default as badgeDemoCode } from "#/components/examples/display/badge-demo?raw";
export { default as carouselDemoCode } from "#/components/examples/display/carousel-demo?raw";
export { default as chartDemoCode } from "#/components/examples/display/chart-demo?raw";
export { default as emptyDemoCode } from "#/components/examples/display/empty-demo?raw";
export { default as itemDemoCode } from "#/components/examples/display/item-demo?raw";
export { default as kbdDemoCode } from "#/components/examples/display/kbd-demo?raw";
export { default as spinnerDemoCode } from "#/components/examples/display/spinner-demo?raw";
export { default as tableDemoCode } from "#/components/examples/display/table-demo?raw";

// — Form —
export { default as buttonDemoCode } from "#/components/examples/form/button-demo?raw";
export { default as buttonGroupDemoCode } from "#/components/examples/form/button-group-demo?raw";
export { default as calendarDemoCode } from "#/components/examples/form/calendar-demo?raw";
export { default as checkboxDemoCode } from "#/components/examples/form/checkbox-demo?raw";
export { default as checkboxCardsDemoCode } from "#/components/examples/form/checkbox-cards-demo?raw";
export { default as checkboxGroupDemoCode } from "#/components/examples/form/checkbox-group-demo?raw";
export { default as fieldDemoCode } from "#/components/examples/form/field-demo?raw";
export { default as formDemoCode } from "#/components/examples/form/form-demo?raw";
export { default as inputDemoCode } from "#/components/examples/form/input-demo?raw";
export { default as inputGroupDemoCode } from "#/components/examples/form/input-group-demo?raw";
export { default as inputNumberDemoCode } from "#/components/examples/form/input-number-demo?raw";
export { default as inputOtpDemoCode } from "#/components/examples/form/input-otp-demo?raw";
export { default as inputPasswordDemoCode } from "#/components/examples/form/input-password-demo?raw";
export { default as inputSearchDemoCode } from "#/components/examples/form/input-search-demo?raw";
export { default as labelDemoCode } from "#/components/examples/form/label-demo?raw";
export { default as nativeSelectDemoCode } from "#/components/examples/form/native-select-demo?raw";
export { default as radioDemoCode } from "#/components/examples/form/radio-demo?raw";
export { default as radioCardsDemoCode } from "#/components/examples/form/radio-cards-demo?raw";
export { default as radioGroupDemoCode } from "#/components/examples/form/radio-group-demo?raw";
export { default as selectDemoCode } from "#/components/examples/form/select-demo?raw";
export { default as sliderDemoCode } from "#/components/examples/form/slider-demo?raw";
export { default as switchDemoCode } from "#/components/examples/form/switch-demo?raw";
export { default as textareaDemoCode } from "#/components/examples/form/textarea-demo?raw";
export { default as toggleDemoCode } from "#/components/examples/form/toggle-demo?raw";
export { default as toggleGroupDemoCode } from "#/components/examples/form/toggle-group-demo?raw";

// — Navigation —
export { default as breadcrumbDemoCode } from "#/components/examples/navigation/breadcrumb-demo?raw";
export { default as menubarDemoCode } from "#/components/examples/navigation/menubar-demo?raw";
export { default as navigationMenuDemoCode } from "#/components/examples/navigation/navigation-menu-demo?raw";
export { default as paginationDemoCode } from "#/components/examples/navigation/pagination-demo?raw";
export { default as sidebarDemoCode } from "#/components/examples/navigation/sidebar-demo?raw";
export { default as tabsDemoCode } from "#/components/examples/navigation/tabs-demo?raw";

// — Overlay —
export { default as commandDemoCode } from "#/components/examples/overlay/command-demo?raw";
export { default as contextMenuDemoCode } from "#/components/examples/overlay/context-menu-demo?raw";
export { default as dialogDemoCode } from "#/components/examples/overlay/dialog-demo?raw";
export { default as drawerDemoCode } from "#/components/examples/overlay/drawer-demo?raw";
export { default as dropdownMenuDemoCode } from "#/components/examples/overlay/dropdown-menu-demo?raw";
export { default as hoverCardDemoCode } from "#/components/examples/overlay/hover-card-demo?raw";
export { default as popoverDemoCode } from "#/components/examples/overlay/popover-demo?raw";
export { default as sheetDemoCode } from "#/components/examples/overlay/sheet-demo?raw";
export { default as tooltipDemoCode } from "#/components/examples/overlay/tooltip-demo?raw";

// — Feedback —
export { default as alertDialogDemoCode } from "#/components/examples/feedback/alert-dialog-demo?raw";
export { default as progressDemoCode } from "#/components/examples/feedback/progress-demo?raw";
export { default as progressCircleDemoCode } from "#/components/examples/feedback/progress-circle-demo?raw";
export { default as skeletonDemoCode } from "#/components/examples/feedback/skeleton-demo?raw";
export { default as sonnerDemoCode } from "#/components/examples/feedback/sonner-demo?raw";

// — Layout —
export { default as accordionDemoCode } from "#/components/examples/layout/accordion-demo?raw";
export { default as cardDemoCode } from "#/components/examples/layout/card-demo?raw";
export { default as collapsibleDemoCode } from "#/components/examples/layout/collapsible-demo?raw";
export { default as resizableDemoCode } from "#/components/examples/layout/resizable-demo?raw";
export { default as scrollAreaDemoCode } from "#/components/examples/layout/scroll-area-demo?raw";
export { default as separatorDemoCode } from "#/components/examples/layout/separator-demo?raw";

/* -------------------------------------------------------------------------- */
/* Detail-page doc examples — multiple per component, grouped by slug.         */
/* These live under `docs/<slug>/` and back the rich `/components/$slug` pages. */
/* -------------------------------------------------------------------------- */

// — button —
export { default as buttonVariantsCode } from "#/components/examples/docs/button/variants?raw";
export { default as buttonSizesCode } from "#/components/examples/docs/button/sizes?raw";
export { default as buttonIconsCode } from "#/components/examples/docs/button/icons?raw";
export { default as buttonLoadingCode } from "#/components/examples/docs/button/loading?raw";
export { default as buttonAsChildCode } from "#/components/examples/docs/button/as-child?raw";

// — badge —
export { default as badgeVariantsCode } from "#/components/examples/docs/badge/variants?raw";
export { default as badgeWithIconCode } from "#/components/examples/docs/badge/with-icon?raw";
export { default as badgeAsLinkCode } from "#/components/examples/docs/badge/as-link?raw";

// — input —
export { default as inputDefaultCode } from "#/components/examples/docs/input/default?raw";
export { default as inputStatesCode } from "#/components/examples/docs/input/states?raw";
export { default as inputFileCode } from "#/components/examples/docs/input/file?raw";

// — tabs —
export { default as tabsDefaultCode } from "#/components/examples/docs/tabs/default?raw";
export { default as tabsLineCode } from "#/components/examples/docs/tabs/line?raw";

// — dialog —
export { default as dialogBasicCode } from "#/components/examples/docs/dialog/basic?raw";
export { default as dialogScrollCode } from "#/components/examples/docs/dialog/scroll?raw";

// — accordion —
export { default as accordionSingleCode } from "#/components/examples/docs/accordion/single?raw";
export { default as accordionMultipleCode } from "#/components/examples/docs/accordion/multiple?raw";

// — card —
export { default as cardOverviewCode } from "#/components/examples/docs/card/overview?raw";
export { default as cardSimpleCode } from "#/components/examples/docs/card/simple?raw";

// — switch —
export { default as switchWithLabelCode } from "#/components/examples/docs/switch/with-label?raw";
export { default as switchSizesCode } from "#/components/examples/docs/switch/sizes?raw";
export { default as switchDisabledCode } from "#/components/examples/docs/switch/disabled?raw";

// — tooltip —
export { default as tooltipSidesCode } from "#/components/examples/docs/tooltip/sides?raw";
export { default as tooltipWithShortcutCode } from "#/components/examples/docs/tooltip/with-shortcut?raw";

// — select —
export { default as selectStatusCode } from "#/components/examples/docs/select/status?raw";
export { default as selectGroupedCode } from "#/components/examples/docs/select/grouped?raw";

// — slider —
export { default as sliderVolumeCode } from "#/components/examples/docs/slider/volume?raw";
export { default as sliderRangeCode } from "#/components/examples/docs/slider/range?raw";

// — checkbox —
export { default as checkboxSelectAllCode } from "#/components/examples/docs/checkbox/select-all?raw";
export { default as checkboxWithDescriptionCode } from "#/components/examples/docs/checkbox/with-description?raw";

// — popover —
export { default as popoverShareCode } from "#/components/examples/docs/popover/share?raw";
export { default as popoverDimensionsCode } from "#/components/examples/docs/popover/dimensions?raw";

// — sonner —
export { default as sonnerTypesCode } from "#/components/examples/docs/sonner/types?raw";
export { default as sonnerActionCode } from "#/components/examples/docs/sonner/action?raw";

// — radio-cards —
export { default as radioCardsPlansCode } from "#/components/examples/docs/radio-cards/plans?raw";
export { default as radioCardsIntervalCode } from "#/components/examples/docs/radio-cards/interval?raw";

// — calendar —
export { default as calendarSingleCode } from "#/components/examples/docs/calendar/single?raw";
export { default as calendarRangeCode } from "#/components/examples/docs/calendar/range?raw";

// — command —
export { default as commandPaletteCode } from "#/components/examples/docs/command/palette?raw";
export { default as commandDialogCode } from "#/components/examples/docs/command/dialog?raw";

// — field —
export { default as fieldValidationCode } from "#/components/examples/docs/field/validation?raw";
export { default as fieldLayoutsCode } from "#/components/examples/docs/field/layouts?raw";

// — dropdown-menu —
export { default as dropdownCheckboxesCode } from "#/components/examples/docs/dropdown-menu/checkboxes?raw";
export { default as dropdownRadioCode } from "#/components/examples/docs/dropdown-menu/radio?raw";

// — progress —
export { default as progressAnimatedCode } from "#/components/examples/docs/progress/animated?raw";
export { default as progressColorsCode } from "#/components/examples/docs/progress/colors?raw";

// — sheet —
export { default as sheetSidesCode } from "#/components/examples/docs/sheet/sides?raw";
export { default as sheetProfileCode } from "#/components/examples/docs/sheet/profile?raw";

// — carousel —
export { default as carouselGalleryCode } from "#/components/examples/docs/carousel/gallery?raw";
export { default as carouselVerticalCode } from "#/components/examples/docs/carousel/vertical?raw";

// — toggle-group —
export { default as toggleGroupAlignmentCode } from "#/components/examples/docs/toggle-group/alignment?raw";
export { default as toggleGroupFormattingCode } from "#/components/examples/docs/toggle-group/formatting?raw";

// — input-otp —
export { default as inputOtpVerifyCode } from "#/components/examples/docs/input-otp/verify?raw";
export { default as inputOtpPatternCode } from "#/components/examples/docs/input-otp/pattern?raw";

// — context-menu —
export { default as contextMenuEditorCode } from "#/components/examples/docs/context-menu/editor?raw";
export { default as contextMenuActionsCode } from "#/components/examples/docs/context-menu/actions?raw";

/* -------------------------------------------------------------------------- */
/* Anatomy snippets — composition skeletons kept in .txt files, not literals.  */
/* -------------------------------------------------------------------------- */

export { default as accordionAnatomyCode } from "#/components/examples/docs/accordion/anatomy.txt?raw";
export { default as badgeAnatomyCode } from "#/components/examples/docs/badge/anatomy.txt?raw";
export { default as buttonAnatomyCode } from "#/components/examples/docs/button/anatomy.txt?raw";
export { default as calendarAnatomyCode } from "#/components/examples/docs/calendar/anatomy.txt?raw";
export { default as cardAnatomyCode } from "#/components/examples/docs/card/anatomy.txt?raw";
export { default as carouselAnatomyCode } from "#/components/examples/docs/carousel/anatomy.txt?raw";
export { default as checkboxAnatomyCode } from "#/components/examples/docs/checkbox/anatomy.txt?raw";
export { default as commandAnatomyCode } from "#/components/examples/docs/command/anatomy.txt?raw";
export { default as contextMenuAnatomyCode } from "#/components/examples/docs/context-menu/anatomy.txt?raw";
export { default as dialogAnatomyCode } from "#/components/examples/docs/dialog/anatomy.txt?raw";
export { default as dropdownMenuAnatomyCode } from "#/components/examples/docs/dropdown-menu/anatomy.txt?raw";
export { default as fieldAnatomyCode } from "#/components/examples/docs/field/anatomy.txt?raw";
export { default as inputAnatomyCode } from "#/components/examples/docs/input/anatomy.txt?raw";
export { default as inputOtpAnatomyCode } from "#/components/examples/docs/input-otp/anatomy.txt?raw";
export { default as popoverAnatomyCode } from "#/components/examples/docs/popover/anatomy.txt?raw";
export { default as progressAnatomyCode } from "#/components/examples/docs/progress/anatomy.txt?raw";
export { default as radioCardsAnatomyCode } from "#/components/examples/docs/radio-cards/anatomy.txt?raw";
export { default as selectAnatomyCode } from "#/components/examples/docs/select/anatomy.txt?raw";
export { default as sheetAnatomyCode } from "#/components/examples/docs/sheet/anatomy.txt?raw";
export { default as sliderAnatomyCode } from "#/components/examples/docs/slider/anatomy.txt?raw";
export { default as sonnerAnatomyCode } from "#/components/examples/docs/sonner/anatomy.txt?raw";
export { default as switchAnatomyCode } from "#/components/examples/docs/switch/anatomy.txt?raw";
export { default as tabsAnatomyCode } from "#/components/examples/docs/tabs/anatomy.txt?raw";
export { default as toggleGroupAnatomyCode } from "#/components/examples/docs/toggle-group/anatomy.txt?raw";
export { default as tooltipAnatomyCode } from "#/components/examples/docs/tooltip/anatomy.txt?raw";

// — avatar —
export { default as avatarFallbackCode } from "#/components/examples/docs/avatar/fallback?raw";
export { default as avatarGroupCode } from "#/components/examples/docs/avatar/group?raw";
export { default as avatarAnatomyCode } from "#/components/examples/docs/avatar/anatomy.txt?raw";

// — spinner —
export { default as spinnerSizesCode } from "#/components/examples/docs/spinner/sizes?raw";
export { default as spinnerInButtonCode } from "#/components/examples/docs/spinner/in-button?raw";
export { default as spinnerAnatomyCode } from "#/components/examples/docs/spinner/anatomy.txt?raw";

// — kbd —
export { default as kbdShortcutsCode } from "#/components/examples/docs/kbd/shortcuts?raw";
export { default as kbdInlineCode } from "#/components/examples/docs/kbd/inline?raw";
export { default as kbdAnatomyCode } from "#/components/examples/docs/kbd/anatomy.txt?raw";

// — separator —
export { default as separatorOrientationsCode } from "#/components/examples/docs/separator/orientations?raw";
export { default as separatorAnatomyCode } from "#/components/examples/docs/separator/anatomy.txt?raw";

// — skeleton —
export { default as skeletonCardCode } from "#/components/examples/docs/skeleton/card?raw";
export { default as skeletonListCode } from "#/components/examples/docs/skeleton/list?raw";
export { default as skeletonAnatomyCode } from "#/components/examples/docs/skeleton/anatomy.txt?raw";

// — empty —
export { default as emptyStateCode } from "#/components/examples/docs/empty/state?raw";
export { default as emptyAnatomyCode } from "#/components/examples/docs/empty/anatomy.txt?raw";

// — aspect-ratio —
export { default as aspectRatioRatiosCode } from "#/components/examples/docs/aspect-ratio/ratios?raw";
export { default as aspectRatioAnatomyCode } from "#/components/examples/docs/aspect-ratio/anatomy.txt?raw";

// — label —
export { default as labelWithControlsCode } from "#/components/examples/docs/label/with-controls?raw";
export { default as labelAnatomyCode } from "#/components/examples/docs/label/anatomy.txt?raw";

import type { Linter } from "eslint";

import pluginJsxA11y from "eslint-plugin-jsx-a11y";

/**
 * Rules that are disabled (set to "off") for jsx-a11y plugin
 * These rules are grouped together for better organization and maintainability
 */
const disabledJsxA11yRules: Linter.RulesRecord = {
  /**
   * Disable autocomplete validation
   * Often disabled when using custom form components or complex form libraries
   */
  "jsx-a11y/autocomplete-valid": "off",
};

/**
 * Rules that are set to "error" for jsx-a11y plugin
 * These rules are grouped together for better organization and maintainability
 * These rules catch critical accessibility issues that must be fixed
 */
const errorJsxA11yRules: Linter.RulesRecord = {
  /**
   * Ensures emojis are accessible to screen readers
   */
  "jsx-a11y/accessible-emoji": "error",

  /**
   * Ensures images have alternative text for accessibility
   * Configured for common components and image elements
   */
  "jsx-a11y/alt-text": [
    "error",
    {
      area: ["Area"],
      elements: ["img", "object", "area", 'input[type="image"]'],
      img: ["Image"],
      'input[type="image"]': ["InputImage"],
      object: ["Object"],
    },
  ],

  /**
   * Ensures anchor elements have content or are labeled
   * Configured to recognize Link components
   */
  "jsx-a11y/anchor-has-content": ["error", { components: ["Link"] }],

  /**
   * Validates anchor element validity and accessibility
   * Configured for Link components with 'to' prop
   */
  "jsx-a11y/anchor-is-valid": [
    "error",
    {
      aspects: ["noHref", "invalidHref", "preferButton"],
      components: ["Link"],
      specialLink: ["to"],
    },
  ],

  /**
   * Ensures aria-activedescendant has corresponding tabindex
   */
  "jsx-a11y/aria-activedescendant-has-tabindex": "error",

  /**
   * Validates ARIA properties
   */
  "jsx-a11y/aria-props": "error",

  /**
   * Validates ARIA property types
   */
  "jsx-a11y/aria-proptypes": "error",

  /**
   * Validates ARIA roles
   */
  "jsx-a11y/aria-role": ["error", { ignoreNonDOM: false }],

  /**
   * Prevents ARIA usage on unsupported elements
   */
  "jsx-a11y/aria-unsupported-elements": "error",

  /**
   * Ensures click events have corresponding keyboard events
   */
  "jsx-a11y/click-events-have-key-events": "error",

  /**
   * Ensures interactive controls have associated labels
   * Configured with extensive options for various control types
   */
  "jsx-a11y/control-has-associated-label": [
    "error",
    {
      controlComponents: [],
      depth: 5,
      ignoreElements: ["audio", "canvas", "embed", "input", "textarea", "tr", "video"],
      ignoreRoles: [
        "grid",
        "listbox",
        "menu",
        "menubar",
        "radiogroup",
        "row",
        "tablist",
        "toolbar",
        "tree",
        "treegrid",
      ],
      labelAttributes: ["label"],
    },
  ],

  /**
   * Ensures heading elements have content
   */
  "jsx-a11y/heading-has-content": ["error", { components: [""] }],

  /**
   * Ensures HTML has language attribute
   */
  "jsx-a11y/html-has-lang": "error",

  /**
   * Ensures iframe elements have title attribute
   */
  "jsx-a11y/iframe-has-title": "error",

  /**
   * Prevents redundant alt text in images
   */
  "jsx-a11y/img-redundant-alt": "error",

  /**
   * Ensures interactive elements can receive focus
   */
  "jsx-a11y/interactive-supports-focus": "error",

  /**
   * Ensures labels are associated with form controls
   * Configured with extensive control and label component support
   */
  "jsx-a11y/label-has-associated-control": [
    "error",
    {
      assert: "both",
      controlComponents: [],
      depth: 25,
      labelAttributes: [],
      labelComponents: [],
    },
  ],

  /**
   * Validates language codes
   */
  "jsx-a11y/lang": "error",

  /**
   * Ensures media elements have captions
   */
  "jsx-a11y/media-has-caption": [
    "error",
    {
      audio: [],
      track: [],
      video: [],
    },
  ],

  /**
   * Ensures mouse events have corresponding keyboard events
   */
  "jsx-a11y/mouse-events-have-key-events": "error",

  /**
   * Prevents usage of accesskey attribute
   */
  "jsx-a11y/no-access-key": "error",

  /**
   * Prevents autofocus attribute usage
   * Configured to ignore non-DOM elements
   */
  "jsx-a11y/no-autofocus": ["error", { ignoreNonDOM: true }],

  /**
   * Prevents distracting elements like marquee and blink
   */
  "jsx-a11y/no-distracting-elements": [
    "error",
    {
      elements: ["marquee", "blink"],
    },
  ],

  /**
   * Prevents converting interactive elements to non-interactive roles
   */
  "jsx-a11y/no-interactive-element-to-noninteractive-role": [
    "error",
    {
      tr: ["none", "presentation"],
    },
  ],

  /**
   * Prevents interactions on non-interactive elements
   * Configured for common event handlers
   */
  "jsx-a11y/no-noninteractive-element-interactions": [
    "error",
    {
      handlers: ["onClick", "onMouseDown", "onMouseUp", "onKeyPress", "onKeyDown", "onKeyUp"],
    },
  ],

  /**
   * Prevents converting non-interactive elements to interactive roles
   * Configured with specific element-role mappings
   */
  "jsx-a11y/no-noninteractive-element-to-interactive-role": [
    "error",
    {
      li: ["menuitem", "option", "row", "tab", "treeitem"],
      ol: ["listbox", "menu", "menubar", "radiogroup", "tablist", "tree", "treegrid"],
      table: ["grid"],
      td: ["gridcell"],
      ul: ["listbox", "menu", "menubar", "radiogroup", "tablist", "tree", "treegrid"],
    },
  ],

  /**
   * Prevents tabindex on non-interactive elements
   * Configured to allow specific roles and tags
   */
  "jsx-a11y/no-noninteractive-tabindex": [
    "error",
    {
      roles: ["tabpanel"],
      tags: [],
    },
  ],

  /**
   * Prevents redundant role attributes
   */
  "jsx-a11y/no-redundant-roles": "error",

  /**
   * Prevents interactions on static elements
   * Configured for common event handlers
   */
  "jsx-a11y/no-static-element-interactions": [
    "error",
    {
      handlers: ["onClick", "onMouseDown", "onMouseUp", "onKeyPress", "onKeyDown", "onKeyUp"],
    },
  ],

  /**
   * Ensures roles have required ARIA properties
   */
  "jsx-a11y/role-has-required-aria-props": "error",

  /**
   * Ensures roles support their ARIA properties
   */
  "jsx-a11y/role-supports-aria-props": "error",

  /**
   * Validates scope attribute usage
   */
  "jsx-a11y/scope": "error",

  /**
   * Prevents positive tabindex values
   */
  "jsx-a11y/tabindex-no-positive": "error",
};

export const jsxA11yRules: Linter.Config[] = [
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      "jsx-a11y": pluginJsxA11y,
    },
    rules: {
      ...pluginJsxA11y.configs.recommended.rules,

      // Apply all disabled rules
      ...disabledJsxA11yRules,

      // Apply all error rules
      ...errorJsxA11yRules,
    },
  },
];

/** One colour of the palette: the site token it comes from and that token resolved to sRGB. */
export interface BrandColor {
  readonly name: string;
  readonly role: string;
  readonly token: string;
  readonly oklch: string;
  readonly hex: string;
}

/** The one hue: Sky carries the brand, a step per colour scheme plus the theme colour. */
export const BRAND_COLORS: ReadonlyArray<BrandColor> = [
  {
    name: "Sky 600",
    role: "Brand on light",
    token: "--color-sky-600",
    oklch: "oklch(58.8% 0.158 241.966)",
    hex: "#0084d1",
  },
  {
    name: "Sky 400",
    role: "Brand on dark",
    token: "--color-sky-400",
    oklch: "oklch(74.6% 0.16 232.661)",
    hex: "#00bcff",
  },
  {
    name: "Sky 500",
    role: "Theme colour, accents on black",
    token: "--color-sky-500",
    oklch: "oklch(68.5% 0.169 237.323)",
    hex: "#00a6f4",
  },
];

/** The neutrals carry everything that is not the brand. */
export const NEUTRAL_COLORS: ReadonlyArray<BrandColor> = [
  {
    name: "Neutral 950",
    role: "Dark background",
    token: "--color-neutral-950",
    oklch: "oklch(14.5% 0 0)",
    hex: "#0a0a0a",
  },
  {
    name: "Neutral 900",
    role: "Foreground on light",
    token: "--color-neutral-900",
    oklch: "oklch(20.5% 0 0)",
    hex: "#171717",
  },
  {
    name: "Neutral 800",
    role: "Border on dark",
    token: "--color-neutral-800",
    oklch: "oklch(26.9% 0 0)",
    hex: "#262626",
  },
  {
    name: "Neutral 700",
    role: "Muted on light",
    token: "--color-neutral-700",
    oklch: "oklch(37.1% 0 0)",
    hex: "#404040",
  },
  {
    name: "Neutral 400",
    role: "Muted on dark",
    token: "--color-neutral-400",
    oklch: "oklch(70.8% 0 0)",
    hex: "#a1a1a1",
  },
  {
    name: "Neutral 200",
    role: "Border on light",
    token: "--color-neutral-200",
    oklch: "oklch(92.2% 0 0)",
    hex: "#e5e5e5",
  },
  {
    name: "Neutral 100",
    role: "Light background",
    token: "--color-neutral-100",
    oklch: "oklch(97% 0 0)",
    hex: "#f5f5f5",
  },
  {
    name: "Neutral 50",
    role: "Foreground on dark",
    token: "--color-neutral-50",
    oklch: "oklch(98.5% 0 0)",
    hex: "#fafafa",
  },
];

/** One downloadable asset under `public/`. */
export interface BrandDownload {
  readonly href: string;
  readonly label: string;
  readonly format: string;
  readonly note: string;
}

/** Every asset the brand page offers, in display order; each `href` is a file under `public/`. */
export const BRAND_DOWNLOADS: ReadonlyArray<BrandDownload> = [
  {
    href: "/brand/mark.svg",
    label: "Mark, light",
    format: "SVG",
    note: "Sky 600 lead, Neutral 900 trail. For light backgrounds.",
  },
  {
    href: "/brand/mark-dark.svg",
    label: "Mark, dark",
    format: "SVG",
    note: "Sky 400 lead, Neutral 50 trail. For dark backgrounds.",
  },
  {
    href: "/brand/mark-mono.svg",
    label: "Mark, mono",
    format: "SVG",
    note: "One colour through currentColor; recolour it freely.",
  },
  {
    href: "/brand/lockup-horizontal.png",
    label: "Lockup, horizontal",
    format: "PNG · 2×",
    note: "Mark beside the wordmark, transparent, for light backgrounds.",
  },
  {
    href: "/brand/lockup-horizontal-dark.png",
    label: "Lockup, horizontal, dark",
    format: "PNG · 2×",
    note: "The same lockup for dark backgrounds.",
  },
  {
    href: "/brand/lockup-stacked.png",
    label: "Lockup, stacked",
    format: "PNG · 2×",
    note: "Mark above the wordmark, transparent, for light backgrounds.",
  },
  {
    href: "/brand/lockup-stacked-dark.png",
    label: "Lockup, stacked, dark",
    format: "PNG · 2×",
    note: "The same lockup for dark backgrounds.",
  },
  {
    href: "/icon-512.png",
    label: "App icon",
    format: "PNG · 512",
    note: "Full-bleed on Neutral 950, so rounded and circular masks keep it whole.",
  },
  {
    href: "/og-image.png",
    label: "Social card",
    format: "PNG · 1200 × 630",
    note: "The link preview for codefastlabs.com.",
  },
  {
    href: "/brand/readme-banner.png",
    label: "README banner",
    format: "PNG · 2560 × 640",
    note: "The banner at the top of the repository README.",
  },
];

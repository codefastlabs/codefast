export interface SiteConfig {
  description: string;
  links: {
    github: string;
    twitter: string;
  };
  name: string;
  ogImage: string;
  url: string;
}

export const siteConfig: SiteConfig = {
  description: "A collection of React components",
  links: {
    github: "https://github.com/codefastlabs/codefast",
    twitter: "https://twitter.com/thevuong",
  },
  name: "CodeFast UI",
  ogImage: "https://codefast-ui.vercel.app/og.jpg",
  url: "https://codefast-ui.vercel.app",
};

export const META_THEME_COLORS: { dark: string; light: string } = {
  light: "#ffffff",
  dark: "#09090b",
};

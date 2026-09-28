---
"@codefast/ui": patch
---

`Avatar` draws its edge in a translucent `foreground/10` instead of blending `--border` over the image with
`mix-blend-mode`. In Chromium, a page with a few hundred blended avatars inside a sideways scroller left stretches of
the scroller unpainted, and they stayed blank after scrolling stopped. Dark mode looks the same, since `lighten` with a
translucent white composites like a plain overlay. In light mode the edge over white stays within a shade of `--border`,
and over a darker photo it now darkens the rim slightly where `darken` left it unchanged.

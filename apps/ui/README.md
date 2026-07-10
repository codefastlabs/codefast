Welcome to your new TanStack Start app!

# Getting Started

To run this application:

```bash
npm install
npm run dev
```

# Building For Production

To build this application for production:

```bash
npm run build
```

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
npm run test
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

### Removing Tailwind CSS

If you prefer not to use Tailwind CSS:

1. Remove the demo pages in `src/routes/demo/`
2. Replace the Tailwind import in `src/styles.css` with your own styles
3. Remove `tailwindcss()` from the plugins array in `vite.config.ts`
4. Uninstall the packages: `npm install @tailwindcss/vite tailwindcss -D`

## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from "@tanstack/react-router";
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you render `{children}` in the `shellComponent`.

Here is an example layout that includes a header:

```tsx
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "My App" },
    ],
  }),
  shellComponent: ({ children }) => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <header>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
          </nav>
        </header>
        {children}
        <Scripts />
      </body>
    </html>
  ),
});
```

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Server Functions

TanStack Start provides server functions that allow you to write server-side code that seamlessly integrates with your client components.

```tsx
import { createServerFn } from "@tanstack/react-start";

const getServerTime = createServerFn({
  method: "GET",
}).handler(async () => {
  return new Date().toISOString();
});

// Use in a component
function MyComponent() {
  const [time, setTime] = useState("");

  useEffect(() => {
    getServerTime().then(setTime);
  }, []);

  return <div>Server time: {time}</div>;
}
```

## API Routes

You can create API routes by using the `server` property in your route definitions:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";

export const Route = createFileRoute("/api/hello")({
  server: {
    handlers: {
      GET: () => json({ message: "Hello, World!" }),
    },
  },
});
```

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/people")({
  loader: async () => {
    const response = await fetch("https://swapi.dev/api/people");
    return response.json();
  },
  component: PeopleComponent,
});

function PeopleComponent() {
  const data = Route.useLoaderData();
  return (
    <ul>
      {data.results.map((person) => (
        <li key={person.name}>{person.name}</li>
      ))}
    </ul>
  );
}
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

# Analytics

GA4 (`src/features/tracking/lib/tracking.ts`,
`src/features/tracking/components/google-tag.tsx`) is gated behind an env var — set it in
`.env.local` (gitignored) to enable it; leave it unset and it stays fully inert (no
script loads, no gtag calls):

```
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

- `VITE_GA4_MEASUREMENT_ID` — GA4 property → Admin → Data Streams → Web stream → "Measurement ID".

Google Ads conversion tracking was built (`createGoogleAdsConversionDestination` in `@codefast/tracking`) and then deliberately not adopted for this app — removed rather than left wired but unused.

## Consent

Region (`x-vercel-ip-country`) and GPC (`Sec-GPC`) are resolved per-request in
`src/features/tracking/lib/consent.ts` (`resolveInitialConsent` →
`buildInitialConsent` from `@codefast/tracking/server`) and drive both:

- The SSR'd Consent Mode v2 default in `src/features/tracking/components/google-tag.tsx`
  (denied for EU/VN opt-in regions, analytics granted for US/other — GPC is ads-only).
- The consent UI in `src/features/tracking/components/consent-gate.tsx` — a blocking
  accept/reject banner for opt-in regions, an always-visible "Turn on/off analytics"
  toggle for opt-out regions (this site sells or shares no personal data, so the control
  is named by what it does). Both come from `@codefast/tracking/react`, styled here via
  `className`.

`resolveInitialConsent()` is called directly inside these components rather than via a
root-route `loader` — TanStack Start's `shellComponent` (where both are mounted) renders
before the root match's `loader`/`beforeLoad` resolve, so loader data never reaches them.
The server-resolved value is embedded into `window.__INITIAL_CONSENT__` via
`buildInitialConsentBootstrapScript` so the client reads the same value instead of a
second guess.

### This app's pages are CDN-cached (ISR) — that value alone is not enough

Every page is server-rendered on demand and cached by the CDN under each route's
`headers()` policy (`Cache-Control` + `CDN-Cache-Control`, see `src/lib/cache.ts` —
TanStack Start's ISR pattern). A cached render is shared across visitors, so
`resolveInitialConsent()`'s server branch deliberately bakes the strictest possible
default (`denied`, `opt-in`, region `other`) instead of reading per-request geo — a
request-derived value would leak the first visitor's region to everyone served from
that cache entry.

`middleware.ts` (Vercel Routing Middleware, root of this app) covers the actual
per-visitor correction: it runs on every real request _before_ the CDN cache — including
ones served from cache — reads the visitor's real geo, and sets a
`codefast-ui-initial-consent` cookie (name shared with
`#/features/tracking/lib/consent`). The bootstrap script in `google-tag.tsx` prefers that
cookie over the baked-in fallback whenever it's present, so the real visitor's
region-correct default applies without a second network round trip. `middleware.ts`
intentionally does not import `@codefast/tracking` — Vercel compiles it independently of
this app's Vite/Nitro build, and duplicating the EU / UK-EEA country sets was the safer
choice over an unverified cross-package resolution assumption.
`tests/unit/middleware.test.ts` guards that duplication against `buildInitialConsent`
for every 2-letter country code.

# Demo files

Files prefixed with `demo` can be safely deleted. They are there to provide a starting point for you to play around with the features you've installed.

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

For TanStack Start specific documentation, visit [TanStack Start](https://tanstack.com/start).

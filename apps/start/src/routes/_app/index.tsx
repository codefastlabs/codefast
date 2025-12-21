import { Button } from '@codefast/ui/button';

import { Card, CardContent, CardDescription, CardTitle } from '@codefast/ui/card';
import { createFileRoute } from '@tanstack/react-router';
import { Route as RouteIcon, ServerIcon, ShieldIcon, SparklesIcon, WavesIcon, ZapIcon } from 'lucide-react';
import { Image } from '@unpic/react';

export const Route = createFileRoute('/_app/')({
  component: App,
});

function App() {
  const features = [
    {
      icon: <ZapIcon className="h-12 w-12 text-cyan-400" />,
      title: 'Powerful Server Functions',
      description:
        'Write server-side code that seamlessly integrates with your client components. Type-safe, secure, and simple.',
    },
    {
      icon: <ServerIcon className="h-12 w-12 text-cyan-400" />,
      title: 'Flexible Server Side Rendering',
      description:
        'Full-document SSR, streaming, and progressive enhancement out of the box. Control exactly what renders where.',
    },
    {
      icon: <RouteIcon className="h-12 w-12 text-cyan-400" />,
      title: 'API Routes',
      description: 'Build type-safe API endpoints alongside your application. No separate backend needed.',
    },
    {
      icon: <ShieldIcon className="h-12 w-12 text-cyan-400" />,
      title: 'Strongly Typed Everything',
      description: 'End-to-end type safety from server to client. Catch errors before they reach production.',
    },
    {
      icon: <WavesIcon className="h-12 w-12 text-cyan-400" />,
      title: 'Full Streaming Support',
      description:
        'Stream data from server to client progressively. Perfect for AI applications and real-time updates.',
    },
    {
      icon: <SparklesIcon className="h-12 w-12 text-cyan-400" />,
      title: 'Next Generation Ready',
      description: 'Built from the ground up for modern web applications. Deploy anywhere JavaScript runs.',
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="relative overflow-hidden px-6 py-20 text-center">
        <div className="absolute inset-0 bg-linear-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-center gap-6">
            <Image src="/tanstack-circle-logo.png" alt="TanStack Logo" width={256} height={256} layout="constrained" className="h-24 w-24 md:h-32 md:w-32" />
            <h1 className="text-6xl font-black [letter-spacing:-0.08em] text-white md:text-7xl">
              <span className="text-gray-300">TANSTACK</span>{' '}
              <span className="bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">START</span>
            </h1>
          </div>
          <p className="mb-4 text-2xl font-light text-gray-300 md:text-3xl">
            The framework for next generation AI applications
          </p>
          <p className="mx-auto mb-8 max-w-3xl text-lg text-gray-400">
            Full-stack framework powered by TanStack Router for React and Solid. Build modern applications with server
            functions, streaming, and type safety.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Button asChild size="lg" className="bg-cyan-500 shadow-lg shadow-cyan-500/50 hover:bg-cyan-600">
              <a href="https://tanstack.com/start" target="_blank" rel="noopener noreferrer">
                Documentation
              </a>
            </Button>
            <p className="mt-2 text-sm text-gray-400">
              Begin your TanStack Start journey by editing{' '}
              <code className="rounded bg-slate-700 px-2 py-1 text-cyan-400">/src/routes/_app/index.tsx</code>
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-slate-700 bg-slate-800/50 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <CardContent>
                <div className="mb-4">{feature.icon}</div>
                <CardTitle className="mb-3 text-xl text-white">{feature.title}</CardTitle>
                <CardDescription className="leading-relaxed text-gray-400">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

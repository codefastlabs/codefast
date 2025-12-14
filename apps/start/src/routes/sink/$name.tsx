import { createFileRoute } from '@tanstack/react-router';
import { componentRegistry } from '@/components/sink/component-registry';

export const Route = createFileRoute('/sink/$name')({
  component: ComponentPage,
  head: ({ params }) => {
    const component = componentRegistry[params.name];

    if (!component) {
      return {
        meta: [{ title: 'Component Not Found' }],
      };
    }

    return {
      meta: [
        { title: `${component.name} - Kitchen Sink` },
        { name: 'description', content: `Demo page for ${component.name} component` },
      ],
    };
  },
});

function ComponentPage() {
  const { name } = Route.useParams();
  const component = componentRegistry[name];

  if (!component) {
    return <div className="p-6 text-center">Component not found</div>;
  }

  const Component = component.component;

  return (
    <div className="p-6">
      <Component />
    </div>
  );
}

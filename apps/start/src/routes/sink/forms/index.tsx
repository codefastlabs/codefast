import { createFileRoute } from '@tanstack/react-router';
import { AppearanceSettings } from '@/components/sink/forms/appearance-settings';
import { ChatSettings } from '@/components/sink/forms/chat-settings';
import { DisplaySettings } from '@/components/sink/forms/display-settings';
import { NotionPromptForm } from '@/components/sink/forms/notion-prompt-form';
import { ShipRegistrationForm } from '@/components/sink/forms/ship-registration-form';
import { ShippingForm } from '@/components/sink/forms/shipping-form';

export const Route = createFileRoute('/sink/forms/')({
  component: FormsPage,
  head: () => ({
    meta: [
      { title: 'Forms — Components — @codefast/ui' },
      {
        name: 'description',
        content:
          'Form component examples and patterns built with @codefast/ui. Includes shipping forms, chat settings, appearance settings, and more.',
      },
      { property: 'og:title', content: 'Forms — Components — @codefast/ui' },
      {
        property: 'og:description',
        content:
          'Form component examples and patterns built with @codefast/ui. Includes shipping forms, chat settings, appearance settings, and more.',
      },
      { name: 'twitter:title', content: 'Forms — Components — @codefast/ui' },
      {
        name: 'twitter:description',
        content:
          'Form component examples and patterns built with @codefast/ui. Includes shipping forms, chat settings, appearance settings, and more.',
      },
    ],
  }),
});

function FormsPage() {
  return (
    <div className="@container flex flex-1 flex-col gap-12 p-4">
      <div className="grid flex-1 gap-12 @[1920px]:grid-cols-4 @3xl:grid-cols-2 @5xl:grid-cols-3 [&>div]:max-w-lg">
        <div className="flex flex-col gap-12">
          <NotionPromptForm />
          <ChatSettings />
        </div>
        <div className="flex flex-col gap-12">
          <AppearanceSettings />
        </div>
        <div className="flex flex-col gap-12">
          <DisplaySettings />
        </div>
        <div className="flex flex-col gap-12">
          <ShippingForm />
        </div>
        <div className="col-span-2 flex flex-col gap-12">
          <ShipRegistrationForm />
        </div>
      </div>
    </div>
  );
}

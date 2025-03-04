import type { ComponentProps, JSX } from 'react';

import { Badge, cn, ScrollArea } from '@codefast/ui';
import { formatDistanceToNow } from 'date-fns';

import type { EmailMessage } from '@/app/examples/mail/_data/data';

import { useMail } from '@/app/examples/mail/_hooks/use-mail';

interface MailListProps {
  items: EmailMessage[];
}

export function MailList({ items }: MailListProps): JSX.Element {
  const [mail, setMail] = useMail();

  return (
    <ScrollArea className="h-screen">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {items.map((item) => (
          <button
            key={item.id}
            className={cn(
              'hover:bg-accent/60 flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all',
              mail.selected === item.id && 'bg-accent',
            )}
            type="button"
            onClick={() => {
              setMail({
                ...mail,
                selected: item.id,
              });
            }}
          >
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{item.name}</div>
                  {!item.read && <span className="flex size-2 rounded-full bg-blue-600" />}
                </div>

                <div
                  className={cn(
                    'ml-auto text-xs',
                    mail.selected === item.id ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {formatDistanceToNow(new Date(item.date), {
                    addSuffix: true,
                  })}
                </div>
              </div>

              <div className="text-xs font-medium">{item.subject}</div>
            </div>

            <div className="text-muted-foreground line-clamp-2 text-xs">{item.text.slice(0, 300)}</div>
            {item.labels.length > 0 ? (
              <div className="flex items-center gap-2">
                {item.labels.map((label) => (
                  <Badge key={label} variant={getBadgeVariantFromLabel(label)}>
                    {label}
                  </Badge>
                ))}
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}

function getBadgeVariantFromLabel(label: string): ComponentProps<typeof Badge>['variant'] {
  if (['work'].includes(label.toLowerCase())) {
    return 'default';
  }

  if (['personal'].includes(label.toLowerCase())) {
    return 'outline';
  }

  return 'secondary';
}

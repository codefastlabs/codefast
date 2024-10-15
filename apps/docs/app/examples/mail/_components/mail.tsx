'use client';

import { AccountSwitcher } from '@/app/examples/mail/_components/account-switcher';
import { MailDisplay } from '@/app/examples/mail/_components/mail-display';
import { MailList } from '@/app/examples/mail/_components/mail-list';
import { Nav } from '@/app/examples/mail/_components/nav';
import { type EmailMessage } from '@/app/examples/mail/_data/data';
import { useMail } from '@/app/examples/mail/_hooks/use-mail';
import {
  cn,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextInput,
} from '@codefast/ui';
import {
  AlertCircle,
  Archive,
  ArchiveX,
  File,
  Inbox,
  MessagesSquare,
  SearchIcon,
  Send,
  ShoppingCart,
  Trash2,
  Users2,
} from 'lucide-react';
import { type JSX, type ReactNode, useState } from 'react';

interface MailProps {
  accounts: {
    email: string;
    icon: ReactNode;
    label: string;
  }[];
  defaultLayout: number[] | undefined;
  mails: EmailMessage[];
  navCollapsedSize: number;
  defaultCollapsed?: boolean;
}

export function Mail({
  accounts,
  mails,
  defaultLayout = [265, 440, 655],
  defaultCollapsed = false,
  navCollapsedSize,
}: MailProps): JSX.Element {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [mail] = useMail();

  return (
    <ResizablePanelGroup
      className="h-full max-h-dvh items-stretch"
      direction="horizontal"
      onLayout={(sizes: number[]) => {
        document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}`;
      }}
    >
      <ResizablePanel
        collapsible
        className={cn(
          isCollapsed && 'min-w-[50px] transition-all duration-300 ease-in-out',
        )}
        collapsedSize={navCollapsedSize}
        defaultSize={defaultLayout[0]}
        maxSize={20}
        minSize={15}
        onCollapse={() => {
          setIsCollapsed(true);
          document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(true)}`;
        }}
        onExpand={() => {
          setIsCollapsed(false);
          document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(false)}`;
        }}
      >
        <div
          className={cn(
            'flex h-[56px] items-center justify-center',
            isCollapsed ? 'h-[52px]' : 'px-2',
          )}
        >
          <AccountSwitcher accounts={accounts} isCollapsed={isCollapsed} />
        </div>
        <Separator />
        <Nav
          isCollapsed={isCollapsed}
          links={[
            {
              title: 'Inbox',
              label: '128',
              icon: Inbox,
              variant: 'default',
            },
            {
              title: 'Drafts',
              label: '9',
              icon: File,
              variant: 'ghost',
            },
            {
              title: 'Sent',
              label: '',
              icon: Send,
              variant: 'ghost',
            },
            {
              title: 'Junk',
              label: '23',
              icon: ArchiveX,
              variant: 'ghost',
            },
            {
              title: 'Trash',
              label: '',
              icon: Trash2,
              variant: 'ghost',
            },
            {
              title: 'Archive',
              label: '',
              icon: Archive,
              variant: 'ghost',
            },
          ]}
        />
        <Separator />
        <Nav
          isCollapsed={isCollapsed}
          links={[
            {
              title: 'Social',
              label: '972',
              icon: Users2,
              variant: 'ghost',
            },
            {
              title: 'Updates',
              label: '342',
              icon: AlertCircle,
              variant: 'ghost',
            },
            {
              title: 'Forums',
              label: '128',
              icon: MessagesSquare,
              variant: 'ghost',
            },
            {
              title: 'Shopping',
              label: '8',
              icon: ShoppingCart,
              variant: 'ghost',
            },
            {
              title: 'Promotions',
              label: '21',
              icon: Archive,
              variant: 'ghost',
            },
          ]}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
        <Tabs defaultValue="all">
          <div className="flex items-center px-4 py-2">
            <h1 className="text-xl font-bold">Inbox</h1>
            <TabsList className="ml-auto">
              <TabsTrigger
                className="text-zinc-600 dark:text-zinc-200"
                value="all"
              >
                All mail
              </TabsTrigger>
              <TabsTrigger
                className="text-zinc-600 dark:text-zinc-200"
                value="unread"
              >
                Unread
              </TabsTrigger>
            </TabsList>
          </div>
          <Separator />
          <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 p-4 backdrop-blur">
            <form>
              <TextInput
                placeholder="Search"
                prefix={<SearchIcon className="text-muted-foreground" />}
              />
            </form>
          </div>
          <TabsContent className="m-0" value="all">
            <MailList items={mails} />
          </TabsContent>
          <TabsContent className="m-0" value="unread">
            <MailList items={mails.filter((item) => !item.read)} />
          </TabsContent>
        </Tabs>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[2]}>
        <MailDisplay mail={mails.find((item) => item.id === mail.selected)} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

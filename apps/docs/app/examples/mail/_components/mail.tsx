'use client';

import type { JSX, ReactNode } from 'react';

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
import Cookies from 'js-cookie';
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
import { useState } from 'react';

import type { EmailMessage } from '@/app/examples/mail/_data/data';

import { AccountSwitcher } from '@/app/examples/mail/_components/account-switcher';
import { MailDisplay } from '@/app/examples/mail/_components/mail-display';
import { MailList } from '@/app/examples/mail/_components/mail-list';
import { Nav } from '@/app/examples/mail/_components/nav';
import { useMail } from '@/app/examples/mail/_hooks/use-mail';

const RESIZABLE_PANELS_LAYOUT_COOKIE_NAME = 'react-resizable-panels:layout';
const RESIZABLE_PANELS_COLLAPSED_COOKIE_NAME = 'react-resizable-panels:collapsed';

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
  defaultCollapsed = false,
  defaultLayout = [265, 440, 655],
  mails,
  navCollapsedSize,
}: MailProps): JSX.Element {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [mail] = useMail();

  return (
    <ResizablePanelGroup
      className="h-full max-h-dvh items-stretch"
      direction="horizontal"
      onLayout={(sizes: number[]) => {
        Cookies.set(RESIZABLE_PANELS_LAYOUT_COOKIE_NAME, JSON.stringify(sizes));
      }}
    >
      <ResizablePanel
        collapsible
        className={cn(isCollapsed && 'min-w-[50px] transition-all duration-300 ease-in-out')}
        collapsedSize={navCollapsedSize}
        defaultSize={defaultLayout[0]}
        maxSize={20}
        minSize={15}
        onCollapse={() => {
          setIsCollapsed(true);
          Cookies.set(RESIZABLE_PANELS_COLLAPSED_COOKIE_NAME, JSON.stringify(true));
        }}
        onExpand={() => {
          setIsCollapsed(false);
          Cookies.set(RESIZABLE_PANELS_COLLAPSED_COOKIE_NAME, JSON.stringify(false));
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
              icon: Inbox,
              label: '128',
              title: 'Inbox',
              variant: 'default',
            },
            {
              icon: File,
              label: '9',
              title: 'Drafts',
              variant: 'ghost',
            },
            {
              icon: Send,
              label: '',
              title: 'Sent',
              variant: 'ghost',
            },
            {
              icon: ArchiveX,
              label: '23',
              title: 'Junk',
              variant: 'ghost',
            },
            {
              icon: Trash2,
              label: '',
              title: 'Trash',
              variant: 'ghost',
            },
            {
              icon: Archive,
              label: '',
              title: 'Archive',
              variant: 'ghost',
            },
          ]}
        />
        <Separator />
        <Nav
          isCollapsed={isCollapsed}
          links={[
            {
              icon: Users2,
              label: '972',
              title: 'Social',
              variant: 'ghost',
            },
            {
              icon: AlertCircle,
              label: '342',
              title: 'Updates',
              variant: 'ghost',
            },
            {
              icon: MessagesSquare,
              label: '128',
              title: 'Forums',
              variant: 'ghost',
            },
            {
              icon: ShoppingCart,
              label: '8',
              title: 'Shopping',
              variant: 'ghost',
            },
            {
              icon: Archive,
              label: '21',
              title: 'Promotions',
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
              <TabsTrigger className="text-zinc-600 dark:text-zinc-200" value="all">
                All mail
              </TabsTrigger>
              <TabsTrigger className="text-zinc-600 dark:text-zinc-200" value="unread">
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

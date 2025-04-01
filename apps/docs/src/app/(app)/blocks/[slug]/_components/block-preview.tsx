'use client';

import type { JSX } from 'react';

import { useThemeConfig } from '@/components/active-theme';
import { ComponentWrapper } from '@/components/component-wrapper';

interface BlockPreviewProps {
  slug: string;
  title: string;
}

export function BlockPreview({ title, slug }: BlockPreviewProps): JSX.Element {
  const { activeTheme } = useThemeConfig();

  return (
    <ComponentWrapper className="grow overflow-hidden" classNames={{ body: 'p-0' }} name={slug}>
      <iframe className="w-full grow" src={`/view/${slug}?theme=${activeTheme}`} title={title} />
    </ComponentWrapper>
  );
}

import {
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Label,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@codefast/ui';
import { CounterClockwiseClockIcon } from '@radix-ui/react-icons';
import { type Metadata } from 'next';
import Image from 'next/image';
import { type JSX } from 'react';

import { CodeViewer } from '@/app/examples/playground/_components/code-viewer';
import { MaxLengthSelector } from '@/app/examples/playground/_components/maxlength-selector';
import { ModelSelector } from '@/app/examples/playground/_components/model-selector';
import { PresetActions } from '@/app/examples/playground/_components/preset-actions';
import { PresetSave } from '@/app/examples/playground/_components/preset-save';
import { PresetSelector } from '@/app/examples/playground/_components/preset-selector';
import { PresetShare } from '@/app/examples/playground/_components/preset-share';
import { TemperatureSelector } from '@/app/examples/playground/_components/temperature-selector';
import { TopPSelector } from '@/app/examples/playground/_components/top-p-selector';
import { models, types } from '@/app/examples/playground/_data/models';
import { presets } from '@/app/examples/playground/_data/presets';

export const metadata: Metadata = {
  description: 'The OpenAI Playground built using the components.',
  title: 'Playground',
};

export default function PlaygroundPage(): JSX.Element {
  return (
    <>
      <div className="md:hidden">
        <Image
          alt="Playground"
          className="block dark:hidden"
          height={916}
          src="/examples/playground-light.png"
          width={1280}
        />
        <Image
          alt="Playground"
          className="hidden dark:block"
          height={916}
          src="/examples/playground-dark.png"
          width={1280}
        />
      </div>
      <div className="hidden h-full flex-col md:flex">
        <div className="container mx-auto flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
          <h2 className="text-lg font-semibold">Playground</h2>
          <div className="ml-auto flex w-full space-x-2 sm:justify-end">
            <PresetSelector presets={presets} />
            <PresetSave />
            <div className="hidden space-x-2 md:flex">
              <CodeViewer />
              <PresetShare />
            </div>
            <PresetActions />
          </div>
        </div>
        <Separator />
        <Tabs className="flex-1" defaultValue="complete">
          <div className="container mx-auto h-full py-6">
            <div className="grid h-full items-stretch gap-6 md:grid-cols-[1fr_200px]">
              <div className="hidden flex-col space-y-4 sm:flex md:order-2">
                <div className="grid gap-2">
                  <HoverCard openDelay={200}>
                    <HoverCardTrigger asChild>
                      <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Mode
                      </span>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-[320px] text-sm" side="left">
                      Choose the interface that best suits your task. You can provide: a simple prompt to complete,
                      starting and ending text to insert a completion within, or some text with instructions to edit it.
                    </HoverCardContent>
                  </HoverCard>
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="complete">
                      <span className="sr-only">Complete</span>
                      <svg className="size-5" fill="none" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <rect fill="currentColor" height="2" rx="1" width="12" x="4" y="3" />
                        <rect fill="currentColor" height="2" rx="1" width="12" x="4" y="7" />
                        <rect fill="currentColor" height="2" rx="1" width="3" x="4" y="11" />
                        <rect fill="currentColor" height="2" rx="1" width="3" x="4" y="15" />
                        <rect fill="currentColor" height="2" rx="1" width="3" x="8.5" y="11" />
                        <rect fill="currentColor" height="2" rx="1" width="3" x="8.5" y="15" />
                        <rect fill="currentColor" height="2" rx="1" width="3" x="13" y="11" />
                      </svg>
                    </TabsTrigger>
                    <TabsTrigger value="insert">
                      <span className="sr-only">Insert</span>
                      <svg className="size-5" fill="none" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path
                          clipRule="evenodd"
                          d="M14.491 7.769a.888.888 0 0 1 .287.648.888.888 0 0 1-.287.648l-3.916 3.667a1.013 1.013 0 0 1-.692.268c-.26 0-.509-.097-.692-.268L5.275 9.065A.886.886 0 0 1 5 8.42a.889.889 0 0 1 .287-.64c.181-.17.427-.267.683-.269.257-.002.504.09.69.258L8.903 9.87V3.917c0-.243.103-.477.287-.649.183-.171.432-.268.692-.268.26 0 .509.097.692.268a.888.888 0 0 1 .287.649V9.87l2.245-2.102c.183-.172.432-.269.692-.269.26 0 .508.097.692.269Z"
                          fill="currentColor"
                          fillRule="evenodd"
                        />
                        <rect fill="currentColor" height="2" rx="1" width="3" x="4" y="15" />
                        <rect fill="currentColor" height="2" rx="1" width="3" x="8.5" y="15" />
                        <rect fill="currentColor" height="2" rx="1" width="3" x="13" y="15" />
                      </svg>
                    </TabsTrigger>
                    <TabsTrigger value="edit">
                      <span className="sr-only">Edit</span>
                      <svg className="size-5" fill="none" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <rect fill="currentColor" height="2" rx="1" width="12" x="4" y="3" />
                        <rect fill="currentColor" height="2" rx="1" width="12" x="4" y="7" />
                        <rect fill="currentColor" height="2" rx="1" width="3" x="4" y="11" />
                        <rect fill="currentColor" height="2" rx="1" width="4" x="4" y="15" />
                        <rect fill="currentColor" height="2" rx="1" width="3" x="8.5" y="11" />
                        <path
                          d="M17.154 11.346a1.182 1.182 0 0 0-1.671 0L11 15.829V17.5h1.671l4.483-4.483a1.182 1.182 0 0 0 0-1.671Z"
                          fill="currentColor"
                        />
                      </svg>
                    </TabsTrigger>
                  </TabsList>
                </div>
                <ModelSelector models={models} types={types} />
                <TemperatureSelector defaultValue={[0.56]} />
                <MaxLengthSelector defaultValue={[256]} />
                <TopPSelector defaultValue={[0.9]} />
              </div>
              <div className="md:order-1">
                <TabsContent className="mt-0 border-0 p-0" value="complete">
                  <div className="flex h-full flex-col space-y-4">
                    <Textarea
                      className="min-h-[400px] flex-1 p-4 md:min-h-[700px] lg:min-h-[700px]"
                      placeholder="Write a tagline for an ice cream shop"
                    />
                    <div className="flex items-center space-x-2">
                      <Button>Submit</Button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            aria-label="Show history"
                            prefix={<CounterClockwiseClockIcon />}
                            variant="secondary"
                          />
                        </TooltipTrigger>
                        <TooltipContent>Show history</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent className="mt-0 border-0 p-0" value="insert">
                  <div className="flex flex-col space-y-4">
                    <div className="grid h-full grid-rows-2 gap-6 lg:grid-cols-2 lg:grid-rows-1">
                      <Textarea
                        className="h-full min-h-[300px] lg:min-h-[700px] xl:min-h-[700px]"
                        placeholder="We're writing to [inset]. Congrats from OpenAI!"
                      />
                      <div className="bg-muted rounded-md border" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button>Submit</Button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            aria-label="Show history"
                            prefix={<CounterClockwiseClockIcon />}
                            variant="secondary"
                          />
                        </TooltipTrigger>
                        <TooltipContent>Show history</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent className="mt-0 border-0 p-0" value="edit">
                  <div className="flex flex-col space-y-4">
                    <div className="grid h-full gap-6 lg:grid-cols-2">
                      <div className="flex flex-col space-y-4">
                        <div className="flex flex-1 flex-col space-y-2">
                          <Label htmlFor="input">Input</Label>
                          <Textarea
                            className="flex-1 lg:min-h-[580px]"
                            id="input"
                            placeholder="We is going to the market."
                          />
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Label htmlFor="instructions">Instructions</Label>
                          <Textarea id="instructions" placeholder="Fix the grammar." />
                        </div>
                      </div>
                      <div className="bg-muted mt-[21px] min-h-[400px] rounded-md border lg:min-h-[700px]" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button>Submit</Button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            aria-label="Show history"
                            prefix={<CounterClockwiseClockIcon />}
                            variant="secondary"
                          />
                        </TooltipTrigger>
                        <TooltipContent>Show history</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </div>
          </div>
        </Tabs>
      </div>
    </>
  );
}

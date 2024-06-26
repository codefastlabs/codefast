import { Button } from '@codefast/ui/button';
import { ScrollArea } from '@codefast/ui/scroll-area';
import { Separator } from '@codefast/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@codefast/ui/tabs';
import { PlusCircledIcon } from '@radix-ui/react-icons';
import Image from 'next/image';
import { type JSX } from 'react';
import { type Metadata } from 'next';
import { playlists } from '@/app/examples/music/_data/playlists';
import { listenNowAlbums, madeForYouAlbums } from '@/app/examples/music/_data/albums';
import { Sidebar } from '@/app/examples/music/_components/sidebar';
import { PodcastEmptyPlaceholder } from '@/app/examples/music/_components/podcast-empty-placeholder';
import { Menu } from '@/app/examples/music/_components/menu';
import { AlbumArtwork } from '@/app/examples/music/_components/album-artwork';

export const metadata: Metadata = {
  title: 'Music App',
  description: 'Example music app using the components.',
};

export default function MusicPage(): JSX.Element {
  return (
    <>
      <div className="md:hidden">
        <Image src="/examples/music-light.png" width={1280} height={1114} alt="Music" className="block dark:hidden" />
        <Image src="/examples/music-dark.png" width={1280} height={1114} alt="Music" className="hidden dark:block" />
      </div>
      <div className="hidden md:block">
        <Menu />
        <div className="border-t">
          <div className="bg-background">
            <div className="grid lg:grid-cols-5">
              <Sidebar playlists={playlists} className="hidden lg:block" />
              <div className="col-span-3 lg:col-span-4 lg:border-l">
                <div className="px-4 py-6 lg:px-8">
                  <Tabs defaultValue="music" className="h-full space-y-6">
                    <div className="space-between flex items-center">
                      <TabsList>
                        <TabsTrigger value="music" className="relative">
                          Music
                        </TabsTrigger>
                        <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
                        <TabsTrigger value="live" disabled>
                          Live
                        </TabsTrigger>
                      </TabsList>
                      <div className="ml-auto mr-4">
                        <Button>
                          <PlusCircledIcon className="mr-2 size-4" />
                          Add music
                        </Button>
                      </div>
                    </div>
                    <TabsContent value="music" className="border-none p-0 outline-none">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h2 className="text-2xl font-semibold tracking-tight">Listen Now</h2>
                          <p className="text-muted-foreground text-sm">Top picks for you. Updated daily.</p>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      <div className="relative">
                        <ScrollArea>
                          <div className="flex space-x-4 pb-4">
                            {listenNowAlbums.map((album) => (
                              <AlbumArtwork
                                key={album.name}
                                album={album}
                                className="w-[250px]"
                                aspectRatio="portrait"
                                width={250}
                                height={330}
                              />
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                      <div className="mt-6 space-y-1">
                        <h2 className="text-2xl font-semibold tracking-tight">Made for You</h2>
                        <p className="text-muted-foreground text-sm">Your personal playlists. Updated daily.</p>
                      </div>
                      <Separator className="my-4" />
                      <div className="relative">
                        <ScrollArea>
                          <div className="flex space-x-4 pb-4">
                            {madeForYouAlbums.map((album) => (
                              <AlbumArtwork
                                key={album.name}
                                album={album}
                                className="w-[150px]"
                                aspectRatio="square"
                                width={150}
                                height={150}
                              />
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </TabsContent>
                    <TabsContent value="podcasts" className="h-full flex-col border-none p-0 data-[state=active]:flex">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h2 className="text-2xl font-semibold tracking-tight">New Episodes</h2>
                          <p className="text-muted-foreground text-sm">Your favorite podcasts. Updated daily.</p>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      <PodcastEmptyPlaceholder />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

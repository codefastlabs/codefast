import { AspectRatio } from '@codefast/ui/aspect-ratio';
import { Image } from '@unpic/react';

export function AspectRatioDemo() {
  return (
    <div className="grid w-full max-w-sm items-start gap-4">
      <AspectRatio ratio={16 / 9} className="bg-muted rounded-xl">
        <Image
          src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
          alt="Photo by Drew Beamer"
          width={768}
          height={432}
          layout="constrained"
          className="absolute inset-0 h-full w-full rounded-xl object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </AspectRatio>
      <AspectRatio ratio={1} className="bg-muted rounded-xl">
        <Image
          src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
          alt="Photo by Drew Beamer"
          width={768}
          height={768}
          layout="constrained"
          className="absolute inset-0 h-full w-full rounded-xl object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </AspectRatio>
    </div>
  );
}

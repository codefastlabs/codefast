import type { JSX } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@codefast/ui';

export function AvatarDemo(): JSX.Element {
  return (
    <div className="flex flex-row flex-wrap items-center gap-4">
      <Avatar>
        <AvatarImage alt="@codefastlabs" src="/avatars/codefast-ui.webp" />

        <AvatarFallback>CF</AvatarFallback>
      </Avatar>

      <Avatar>
        <AvatarFallback>CF</AvatarFallback>
      </Avatar>

      <Avatar className="size-12">
        <AvatarImage alt="@codefastlabs" src="/avatars/codefast-ui.webp" />

        <AvatarFallback>CF</AvatarFallback>
      </Avatar>

      <Avatar className="rounded-lg">
        <AvatarImage alt="@evilrabbit" src="https://github.com/evilrabbit.png" />

        <AvatarFallback>ER</AvatarFallback>
      </Avatar>

      <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
        <Avatar>
          <AvatarImage alt="@codefastlabs" src="/avatars/codefast-ui.webp" />

          <AvatarFallback>CF</AvatarFallback>
        </Avatar>

        <Avatar>
          <AvatarImage alt="@leerob" src="https://github.com/leerob.png" />

          <AvatarFallback>LR</AvatarFallback>
        </Avatar>

        <Avatar>
          <AvatarImage alt="@evilrabbit" src="https://github.com/evilrabbit.png" />

          <AvatarFallback>ER</AvatarFallback>
        </Avatar>
      </div>

      <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:size-12 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
        <Avatar>
          <AvatarImage alt="@codefastlabs" src="/avatars/codefast-ui.webp" />

          <AvatarFallback>CF</AvatarFallback>
        </Avatar>

        <Avatar>
          <AvatarImage alt="@leerob" src="https://github.com/leerob.png" />

          <AvatarFallback>LR</AvatarFallback>
        </Avatar>

        <Avatar>
          <AvatarImage alt="@evilrabbit" src="https://github.com/evilrabbit.png" />

          <AvatarFallback>ER</AvatarFallback>
        </Avatar>
      </div>

      <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 hover:space-x-1 *:data-[slot=avatar]:size-12 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale *:data-[slot=avatar]:transition-all *:data-[slot=avatar]:duration-300 *:data-[slot=avatar]:ease-in-out">
        <Avatar>
          <AvatarImage alt="@codefastlabs" src="/avatars/codefast-ui.webp" />

          <AvatarFallback>CF</AvatarFallback>
        </Avatar>

        <Avatar>
          <AvatarImage alt="@leerob" src="https://github.com/leerob.png" />

          <AvatarFallback>LR</AvatarFallback>
        </Avatar>

        <Avatar>
          <AvatarImage alt="@evilrabbit" src="https://github.com/evilrabbit.png" />

          <AvatarFallback>ER</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}

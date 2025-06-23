import { Avatar, AvatarFallback, AvatarImage } from "@codefast/ui";
import type { JSX } from "react";

import { GridWrapper } from "@/components/grid-wrapper";

export function AvatarDemo(): JSX.Element {
  return (
    <GridWrapper className="*:grid *:place-items-center">
      <div className="">
        <Avatar>
          <AvatarImage alt="@codefastlabs" src="/avatars/codefast-ui.webp" />
          <AvatarFallback>CF</AvatarFallback>
        </Avatar>
      </div>
      <div className="">
        <Avatar>
          <AvatarFallback>CF</AvatarFallback>
        </Avatar>
      </div>
      <div className="">
        <Avatar className="size-12">
          <AvatarImage alt="@codefastlabs" src="/avatars/codefast-ui.webp" />
          <AvatarFallback>CF</AvatarFallback>
        </Avatar>
      </div>
      <div className="">
        <Avatar className="rounded-lg">
          <AvatarImage alt="@evilrabbit" src="/avatars/evilrabbit.png" />
          <AvatarFallback>ER</AvatarFallback>
        </Avatar>
      </div>
      <div className="">
        <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
          <Avatar>
            <AvatarImage alt="@codefastlabs" src="/avatars/codefast-ui.webp" />
            <AvatarFallback>CF</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage alt="@leerob" src="/avatars/leerob.png" />
            <AvatarFallback>LR</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage alt="@evilrabbit" src="/avatars/evilrabbit.png" />
            <AvatarFallback>ER</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <div className="">
        <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:size-12 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
          <Avatar>
            <AvatarImage alt="@codefastlabs" src="/avatars/codefast-ui.webp" />
            <AvatarFallback>CF</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage alt="@leerob" src="/avatars/leerob.png" />
            <AvatarFallback>LR</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage alt="@evilrabbit" src="/avatars/evilrabbit.png" />
            <AvatarFallback>ER</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <div className="">
        <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 hover:space-x-1 *:data-[slot=avatar]:size-12 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale *:data-[slot=avatar]:transition-all *:data-[slot=avatar]:duration-300 *:data-[slot=avatar]:ease-in-out">
          <Avatar>
            <AvatarImage alt="@codefastlabs" src="/avatars/codefast-ui.webp" />
            <AvatarFallback>CF</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage alt="@leerob" src="/avatars/leerob.png" />
            <AvatarFallback>LR</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage alt="@evilrabbit" src="/avatars/evilrabbit.png" />
            <AvatarFallback>ER</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </GridWrapper>
  );
}

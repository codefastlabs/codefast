"use client";

import { useState } from "react";
import type { JSX } from "react";

import { GridWrapper } from "@/components/grid-wrapper";
import { Button, toast } from "@codefast/ui";

const allTypes = [
  {
    action: (): number | string => toast("Event has been created"),
    name: "Default",
  },
  {
    action: (): number | string =>
      toast("Event has been created", {
        description: "Monday, January 3rd at 6:00pm",
      }),
    name: "Description",
  },
  {
    action: (): number | string => toast.success("Event has been created"),
    name: "Success",
  },
  {
    action: (): number | string => toast.info("Be at the area 10 minutes before the event time"),
    name: "Info",
  },
  {
    action: (): number | string => toast.warning("Event start time cannot be earlier than 8am"),
    name: "Warning",
  },
  {
    action: (): number | string => toast.error("Event has not been created"),
    name: "Error",
  },
  {
    action: (): number | string =>
      toast.message("Event has been created", {
        action: {
          label: "Undo",
          onClick: () => {
            console.log("Undo");
          },
        },
      }),
    name: "Action",
  },
  {
    action: (): number | string =>
      toast.message("Event has been created", {
        cancel: {
          label: "Cancel",
          onClick: () => {
            console.log("Cancel");
          },
        },
      }),
    name: "Cancel",
  },
  {
    action: ():
      | { unwrap: () => Promise<{ name: string }> }
      | (number & {
          unwrap: () => Promise<{ name: string }>;
        })
      | (string & { unwrap: () => Promise<{ name: string }> }) =>
      toast.promise<{ name: string }>(
        async () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ name: "Sonner" });
            }, 2000);
          }),
        {
          error: "Error",
          loading: "Loading...",
          success: (data) => {
            return `${data.name} toast has been added`;
          },
        },
      ),
    name: "Promise",
  },
];

export function SonnerDemo(): JSX.Element {
  const [activeType, setActiveType] = useState(allTypes[0]);

  return (
    <GridWrapper className="*:grid *:place-items-center">
      <div>
        <Button variant="outline" onClick={() => toast("My first toast")}>
          Give me a toast
        </Button>
      </div>
      <div>
        <Button
          variant="outline"
          onClick={() =>
            toast("Event has been created", {
              action: {
                label: "Undo",
                onClick: () => {
                  console.log("Undo");
                },
              },
              description: "Sunday, December 03, 2023 at 9:00 AM",
            })
          }
        >
          Show Toast
        </Button>
      </div>
      {allTypes.map((type) => (
        <div key={type.name}>
          <Button
            data-active={activeType.name === type.name}
            variant="ghost"
            onClick={() => {
              type.action();
              setActiveType(type);
            }}
          >
            {type.name}
          </Button>
        </div>
      ))}
    </GridWrapper>
  );
}

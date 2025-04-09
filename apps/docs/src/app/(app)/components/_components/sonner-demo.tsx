"use client";

import type { JSX } from "react";

import { Button, logger, toast } from "@codefast/ui";
import { useState } from "react";

import { GridWrapper } from "@/components/grid-wrapper";

const allTypes = [
  {
    name: "Default",
    action: () => toast("Event has been created"),
  },
  {
    name: "Description",
    action: () =>
      toast("Event has been created", {
        description: "Monday, January 3rd at 6:00pm",
      }),
  },
  {
    name: "Success",
    action: () => toast.success("Event has been created"),
  },
  {
    name: "Info",
    action: () => toast.info("Be at the area 10 minutes before the event time"),
  },
  {
    name: "Warning",
    action: () => toast.warning("Event start time cannot be earlier than 8am"),
  },
  {
    name: "Error",
    action: () => toast.error("Event has not been created"),
  },
  {
    name: "Action",
    action: () =>
      toast.message("Event has been created", {
        action: {
          label: "Undo",
          onClick: () => {
            logger.log("Undo");
          },
        },
      }),
  },
  {
    name: "Cancel",
    action: () =>
      toast.message("Event has been created", {
        cancel: {
          label: "Cancel",
          onClick: () => {
            logger.log("Cancel");
          },
        },
      }),
  },
  {
    name: "Promise",
    action: () =>
      toast.promise<{ name: string }>(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ name: "Sonner" });
            }, 2000);
          }),
        {
          loading: "Loading...",
          success: (data) => {
            return `${data.name} toast has been added`;
          },
          error: "Error",
        },
      ),
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
              description: "Sunday, December 03, 2023 at 9:00 AM",
              action: {
                label: "Undo",
                onClick: () => {
                  logger.log("Undo");
                },
              },
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

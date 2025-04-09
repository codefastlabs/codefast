import type { Metadata } from "next";
import type { JSX } from "react";

export const metadata: Metadata = {
  title: "Analytics",
};

export default function AnalyticsPage(): JSX.Element {
  return <div className="p-6">Analytics Page</div>;
}

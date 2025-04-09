import type { Metadata } from "next";
import type { JSX } from "react";

export const metadata: Metadata = {
  title: "Products",
};

export default function ProductsPage(): JSX.Element {
  return <div className="p-6">Products Page</div>;
}

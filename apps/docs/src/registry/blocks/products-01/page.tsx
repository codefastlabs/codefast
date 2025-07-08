import { ProductsTable } from "@/registry/blocks/products-01/_components/products-table";
import products from "@/registry/blocks/products-01/data.json";

import type { JSX } from "react";

export default function ProductsPage(): JSX.Element {
  return <ProductsTable products={products} />;
}

import type { JSX } from 'react';

import { ProductsTable } from '@/registry/blocks/products-01/components/products-table';
import products from '@/registry/blocks/products-01/data.json';

export default function ProductsPage(): JSX.Element {
  return <ProductsTable products={products} />;
}

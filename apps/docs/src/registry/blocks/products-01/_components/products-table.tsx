import { ArrowUpDownIcon, EllipsisVerticalIcon, ListFilterIcon, PlusIcon } from "lucide-react";
import type { JSX } from "react";

import {
  Badge,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@codefast/ui";

export function ProductsTable({
  products,
}: {
  products: {
    dateAdded: string;
    id: string;
    name: string;
    price: number;
    status: string;
    stock: number;
  }[];
}): JSX.Element {
  return (
    <div className="flex w-full flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Products</TabsTrigger>
            <TabsTrigger value="in-stock">In Stock</TabsTrigger>
            <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
            <TabsTrigger asChild value="add-product">
              <button type="button">
                <PlusIcon />
              </button>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-center gap-2">
          <Select defaultValue="all">
            <SelectTrigger size="sm">
              <span className="text-muted-foreground text-sm">Category:</span>
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="low-stock">Low Stock</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger size="sm">
              <span className="text-muted-foreground text-sm">Price:</span>
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">$100-$200</SelectItem>
              <SelectItem value="in-stock">$200-$300</SelectItem>
              <SelectItem value="low-stock">$300-$400</SelectItem>
              <SelectItem value="archived">$400-$500</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger size="sm">
              <span className="text-muted-foreground text-sm">Status:</span>
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">In Stock</SelectItem>
              <SelectItem value="in-stock">Low Stock</SelectItem>
              <SelectItem value="low-stock">Archived</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Button className="size-8" size="icon" variant="outline">
            <ListFilterIcon />
          </Button>
          <Button className="size-8" size="icon" variant="outline">
            <ArrowUpDownIcon />
          </Button>
        </div>
      </div>
      <div>
        <Table>
          <TableHeader className="bg-muted/50 [&>tr]:border-b-background">
            <TableRow className="*:first:rounded-l-lg *:last:rounded-r-lg">
              <TableHead className="w-12 px-4">
                <Checkbox />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody className="**:data-[slot=table-cell]:py-2.5">
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="px-4">
                  <Checkbox />
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                <TableCell className="text-right">{product.stock}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      product.status === "Low Stock"
                        ? "border-orange-500 bg-transparent text-orange-500 dark:border-orange-500 dark:bg-transparent dark:text-orange-500"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                    }
                    variant="secondary"
                  >
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(product.dateAdded).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="size-7" size="icon" variant="ghost">
                        <EllipsisVerticalIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="/" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="/">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink isActive href="/">
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="/">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="/" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

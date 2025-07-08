import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
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
import { ArrowUpDownIcon, EllipsisVerticalIcon, ListFilterIcon, PlusIcon } from "lucide-react";

import type { JSX } from "react";

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
    <Card className="flex w-full flex-col gap-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <Tabs defaultValue="all">
          <TabsList className="@3xl/page:w-fit w-full">
            <TabsTrigger value="all">All Products</TabsTrigger>
            <TabsTrigger value="in-stock">In Stock</TabsTrigger>
            <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
            <TabsTrigger asChild value="add-product">
              <button type="button">
                <PlusIcon />
              </button>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="**:data-[slot=button]:size-8 **:data-[slot=select-trigger]:h-8 @3xl/page:flex hidden items-center gap-2">
          <Select defaultValue="all">
            <SelectTrigger>
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
            <SelectTrigger>
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
            <SelectTrigger>
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
          <Button size="icon" variant="outline">
            <ListFilterIcon />
          </Button>
          <Button size="icon" variant="outline">
            <ArrowUpDownIcon />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 px-4">
                <Checkbox />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead />
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
                        ? "border-orange-700 bg-transparent text-orange-700 dark:border-orange-700 dark:bg-transparent dark:text-orange-700"
                        : "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-100"
                    }
                    variant="secondary"
                  >
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(product.dateAdded).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="size-6" size="icon" variant="ghost">
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
      </CardContent>
      <CardFooter className="@3xl/page:flex-row flex flex-col items-center justify-between border-t pt-6">
        <div className="text-muted-foreground @3xl/page:block hidden text-sm">Showing 1-10 of 100 products</div>
        <Pagination className="mx-0 w-fit">
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
      </CardFooter>
    </Card>
  );
}

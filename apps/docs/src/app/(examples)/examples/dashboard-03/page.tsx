import type { Metadata } from "next";
import type { JSX } from "react";

import { DownloadIcon, FilterIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";

import { AnalyticsDatePicker } from "@/app/(examples)/examples/dashboard-03/_components/analytics-date-picker";
import { ChartRevenue } from "@/app/(examples)/examples/dashboard-03/_components/chart-revenue";
import { ChartVisitors } from "@/app/(examples)/examples/dashboard-03/_components/chart-visitors";
import { ProductsTable } from "@/app/(examples)/examples/dashboard-03/_components/products-table";
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@codefast/ui";

export const metadata: Metadata = {
  description: "An example dashboard to test the new components.",
  title: "Dashboard",
};

// Load from database.
const products = [
  {
    dateAdded: "2023-06-15",
    id: "1",
    name: "BJÖRKSNÄS Dining Table",
    price: 599.99,
    status: "In Stock",
    stock: 12,
  },
  {
    dateAdded: "2023-07-22",
    id: "2",
    name: "POÄNG Armchair",
    price: 249.99,
    status: "In Stock",
    stock: 28,
  },
  {
    dateAdded: "2023-08-05",
    id: "3",
    name: "MALM Bed Frame",
    price: 399.99,
    status: "In Stock",
    stock: 15,
  },
  {
    dateAdded: "2023-09-12",
    id: "4",
    name: "KALLAX Shelf Unit",
    price: 179.99,
    status: "In Stock",
    stock: 32,
  },
  {
    dateAdded: "2023-10-18",
    id: "5",
    name: "STOCKHOLM Rug",
    price: 299.99,
    status: "Low Stock",
    stock: 8,
  },
  {
    dateAdded: "2023-11-02",
    id: "6",
    name: "KIVIK Sofa",
    price: 899.99,
    status: "Low Stock",
    stock: 6,
  },
  {
    dateAdded: "2023-11-29",
    id: "7",
    name: "LISABO Coffee Table",
    price: 149.99,
    status: "In Stock",
    stock: 22,
  },
  {
    dateAdded: "2023-12-10",
    id: "8",
    name: "HEMNES Bookcase",
    price: 249.99,
    status: "In Stock",
    stock: 17,
  },
  {
    dateAdded: "2024-01-05",
    id: "9",
    name: "EKEDALEN Dining Chairs (Set of 2)",
    price: 199.99,
    status: "In Stock",
    stock: 14,
  },
  {
    dateAdded: "2024-01-18",
    id: "10",
    name: "FRIHETEN Sleeper Sofa",
    price: 799.99,
    status: "Low Stock",
    stock: 9,
  },
];

export default function DashboardPage(): JSX.Element {
  return (
    <div className="@container/page flex flex-1 flex-col gap-8 p-6">
      <Tabs className="gap-6" defaultValue="overview">
        <div className="flex items-center justify-between" data-slot="dashboard-header">
          <TabsList className="@3xl/page:w-fit w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger disabled value="exports">
              Exports
            </TabsTrigger>
          </TabsList>
          <div className="@3xl/page:flex hidden items-center gap-2">
            <AnalyticsDatePicker />
            <Button variant="outline">
              <FilterIcon />
              Filter
            </Button>
            <Button variant="outline">
              <DownloadIcon />
              Export
            </Button>
          </div>
        </div>
        <TabsContent className="flex flex-col gap-4" value="overview">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
                <CardDescription>$1,250.00 in the last 30 days</CardDescription>
              </CardHeader>
              <CardFooter>
                <Badge variant="outline">
                  <TrendingUpIcon />
                  +12.5%
                </Badge>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>New Customers</CardTitle>
                <CardDescription>-12 customers from last month</CardDescription>
              </CardHeader>
              <CardFooter>
                <Badge variant="outline">
                  <TrendingDownIcon />
                  -20%
                </Badge>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Active Accounts</CardTitle>
                <CardDescription>+2,345 users from last month</CardDescription>
              </CardHeader>
              <CardFooter>
                <Badge variant="outline">
                  <TrendingUpIcon />
                  +12.5%
                </Badge>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Growth Rate</CardTitle>
                <CardDescription>+12.5% increase per month</CardDescription>
              </CardHeader>
              <CardFooter>
                <Badge variant="outline">
                  <TrendingUpIcon />
                  +4.5%
                </Badge>
              </CardFooter>
            </Card>
          </div>
          <div className="@4xl/page:grid-cols-[2fr_1fr] grid grid-cols-1 gap-4">
            <ChartRevenue />
            <ChartVisitors />
          </div>
          <ProductsTable products={products} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

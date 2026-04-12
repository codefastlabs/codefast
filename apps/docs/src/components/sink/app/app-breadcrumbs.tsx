import { cn } from "@codefast/tailwind-variants";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@codefast/ui/breadcrumb";
import { Link, useParams } from "@tanstack/react-router";

export function AppBreadcrumbs() {
  const params = useParams({ strict: false });
  const name = "name" in params ? params.name : undefined;

  if (!name) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Components</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/sink">Components</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className={cn("hidden", "sm:flex")} />
        <BreadcrumbItem className={cn("hidden", "sm:block")}>
          <BreadcrumbPage className="capitalize">{name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

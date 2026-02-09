import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@codefast/ui/breadcrumb';
import { Link, useParams } from '@tanstack/react-router';

export function AppBreadcrumbs() {
  const params = useParams({ strict: false });
  const name = 'name' in params ? params.name : undefined;

  if (!name) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Kitchen Sink</BreadcrumbPage>
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
            <Link to="/sink">Kitchen Sink</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden sm:flex" />
        <BreadcrumbItem className="hidden sm:block">
          <BreadcrumbPage className="capitalize">{name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

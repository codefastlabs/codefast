import { Outlet, createFileRoute } from '@tanstack/react-router';
import Header from '@/components/header';

export const Route = createFileRoute('/_app')({
  component: MainLayout,
});

function MainLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}

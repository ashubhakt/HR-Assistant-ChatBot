import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout")({
  component: AppLayout,
});

function AppLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  void path;
  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <Outlet />
    </div>
  );
}

export { Link };

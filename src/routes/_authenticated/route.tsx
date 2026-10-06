import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { api, getToken } from "@/lib/api";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (!getToken()) throw redirect({ to: "/auth" });
    try {
      const { user } = await api<{ user: { id: string; email: string; name: string } }>("/auth/me");
      return { user };
    } catch {
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});

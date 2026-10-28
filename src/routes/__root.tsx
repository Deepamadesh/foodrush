import { QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  type ReactNode,
} from "@tanstack/react-router";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/lib/cart";
import { SiteHeader } from "@/components/site-header";

export const Route = createRootRouteWithContext<{
  queryClient: import("@tanstack/react-query").QueryClient;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0f1f3d" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col bg-background">
            <SiteHeader />
            <main className="flex-1">
              {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
              <Outlet />
            </main>
            <footer className="border-t border-border bg-navy-deep py-8 text-center text-sm text-background/70">
              <p>FoodRush — From Craving to Delivered</p>
              <div className="mt-2 flex justify-center gap-4 text-xs text-background/50">
                <a href="/restaurant-panel" className="hover:text-background/80">Restaurant Panel</a>
                <a href="/admin" className="hover:text-background/80">Admin</a>
              </div>
            </footer>
          </div>
          <Toaster richColors position="top-center" />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

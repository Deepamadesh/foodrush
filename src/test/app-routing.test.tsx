import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

describe("App routing", () => {
  function makeRouter() {
    return createRouter({ routeTree, context: { queryClient: new QueryClient() } });
  }

  it("matches / to the index page", () => {
    const matches = makeRouter().matchRoutes("/");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("matches /auth to the auth page", () => {
    const matches = makeRouter().matchRoutes("/auth");
    expect(matches.at(-1)?.routeId).toBe("/auth");
  });

  it("matches /checkout to the checkout page", () => {
    const matches = makeRouter().matchRoutes("/checkout");
    expect(matches.at(-1)?.routeId).toBe("/checkout");
  });

  it("matches /restaurants/:id to the restaurant menu page", () => {
    const matches = makeRouter().matchRoutes("/restaurants/abc-123");
    expect(matches.at(-1)?.routeId).toBe("/restaurants/$id");
  });

  it("matches /orders to the orders history page", () => {
    const matches = makeRouter().matchRoutes("/orders/");
    expect(matches.at(-1)?.routeId).toBe("/orders/");
  });

  it("matches /orders/:id to the order tracking page", () => {
    const matches = makeRouter().matchRoutes("/orders/abc-123");
    expect(matches.at(-1)?.routeId).toBe("/orders/$id");
  });

  it("matches /restaurant-panel to the restaurant panel", () => {
    const matches = makeRouter().matchRoutes("/restaurant-panel");
    expect(matches.at(-1)?.routeId).toBe("/restaurant-panel");
  });

  it("matches /admin to the admin panel", () => {
    const matches = makeRouter().matchRoutes("/admin");
    expect(matches.at(-1)?.routeId).toBe("/admin");
  });
});

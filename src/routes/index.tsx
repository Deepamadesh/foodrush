import { useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Clock, Search, Star, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSuspenseQuery } from "@tanstack/react-query";
import { restaurantsQuery } from "@/lib/queries";
import { coverFor } from "@/lib/covers";
import heroBanner from "@/assets/hero-banner.jpg";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(restaurantsQuery),
  component: Index,
  head: () => ({
    meta: [
      { title: "FoodRush — Order Food Online, Delivered Fast" },
      {
        name: "description",
        content:
          "Discover restaurants, browse categorized menus, order and track your food live with FoodRush.",
      },
      { property: "og:title", content: "FoodRush — From Craving to Delivered" },
      {
        property: "og:description",
        content:
          "Discover restaurants, browse menus, order and track your food live.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const SORTS = [
  { id: "rating", label: "Top rated" },
  { id: "time", label: "Fastest delivery" },
  { id: "name", label: "A to Z" },
] as const;

function Index() {
  const { data: restaurants } = useSuspenseQuery(restaurantsQuery);
  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("rating");

  const cuisines = useMemo(
    () => Array.from(new Set(restaurants.map((r) => r.cuisine))),
    [restaurants],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = restaurants.filter((r) => {
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q);
      const matchesCuisine = !cuisine || r.cuisine === cuisine;
      return matchesSearch && matchesCuisine;
    });
    list = [...list].sort((a, b) => {
      if (sort === "rating") return Number(b.rating) - Number(a.rating);
      if (sort === "time") return a.delivery_minutes - b.delivery_minutes;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [restaurants, search, cuisine, sort]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      {/* Hero */}
      <section className="relative mt-6 overflow-hidden rounded-3xl bg-navy-deep">
        <img
          src={heroBanner}
          alt="A spread of dishes from FoodRush restaurants"
          width={1600}
          height={912}
          className="h-72 w-full object-cover opacity-90 sm:h-96"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
          <h1 className="font-display text-4xl text-background sm:text-6xl">
            From craving <span className="text-primary">to delivered</span>
          </h1>
          <p className="mt-1 max-w-md text-sm text-background/80 sm:text-base">
            Discover local kitchens, order in a tap and track every step live.
          </p>
          <div className="relative mt-4 max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search restaurants, cuisines, dishes…"
              className="border-none bg-card pl-9 text-foreground shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Cuisine chips + sort */}
      <section className="mt-6 flex items-center justify-between gap-3">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCuisine(null)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              cuisine === null
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            All
          </button>
          {cuisines.map((c) => (
            <button
              key={c}
              onClick={() => setCuisine(cuisine === c ? null : c)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                cuisine === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          aria-label="Sort restaurants"
          className="shrink-0 rounded-md border border-input bg-card px-3 py-1.5 text-sm"
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </section>

      {/* Restaurant cards */}
      <section className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((r) => (
          <Link
            key={r.id}
            to="/restaurants/$id"
            params={{ id: r.id }}
            className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative">
              <img
                src={coverFor(r.image_key)}
                alt={r.name}
                loading="lazy"
                width={1152}
                height={768}
                className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-rating px-2 py-0.5 text-xs font-bold text-navy-deep">
                <Star className="size-3 fill-navy-deep" />
                {Number(r.rating).toFixed(1)}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-display text-2xl tracking-wide">{r.name}</h3>
              <p className="text-sm text-muted-foreground">{r.cuisine}</p>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {r.description}
              </p>
              <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5 text-primary" />
                  {r.delivery_minutes} min
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="size-3.5 text-primary" />
                  ₹{Number(r.delivery_fee)} delivery
                </span>
                <span className="ml-auto font-medium text-foreground">
                  Min ₹{Number(r.min_order)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </section>

      {visible.length === 0 && (
        <p className="mt-16 text-center text-muted-foreground">
          No restaurants match your search — try a different cuisine.
        </p>
      )}
    </div>
  );
}

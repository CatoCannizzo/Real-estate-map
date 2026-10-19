"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Search,
  Bell,
  SlidersHorizontal,
  Heart,
  Share2,
  Bed,
  Bath,
  Square,
  MapPin,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  BookmarkPlus,
  Compass,
} from "lucide-react";

import { HouseLogo } from "@/components/logo";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Sample featured property data for carousel
const featuredProperties = [
  {
    id: "prop-1",
    title: "The Prism Pavilion",
    address: "742 Evergreen Ridge Rd, Westlake Hills",
    price: "$1,485,000",
    badge: "Exclusive",
    badgeVariant: "default" as const,
    beds: 4,
    baths: 3.5,
    sqft: "3,480",
    gradient: "from-sky-500/20 via-blue-600/10 to-indigo-600/20",
    accentColor: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "prop-2",
    title: "Geometric Terrace Villa",
    address: "189 Crestview Terrace, Boulder",
    price: "$895,000",
    badge: "Price Cut $35k",
    badgeVariant: "secondary" as const,
    beds: 3,
    baths: 2.5,
    sqft: "2,240",
    gradient: "from-emerald-500/20 via-teal-600/10 to-emerald-700/20",
    accentColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "prop-3",
    title: "Minimalist Waterfront Loft",
    address: "410 Marina Blvd #8A, South Lake",
    price: "$1,120,000",
    badge: "New Listing",
    badgeVariant: "default" as const,
    beds: 2,
    baths: 2.0,
    sqft: "1,890",
    gradient: "from-violet-500/20 via-purple-600/10 to-pink-500/20",
    accentColor: "text-violet-600 dark:text-violet-400",
  },
  {
    id: "prop-4",
    title: "Solar Modern Cantilever",
    address: "935 Horizon Ridge, Austin",
    price: "$1,725,000",
    badge: "Architectural",
    badgeVariant: "outline" as const,
    beds: 5,
    baths: 4.5,
    sqft: "4,200",
    gradient: "from-amber-500/20 via-orange-600/10 to-rose-500/20",
    accentColor: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "prop-5",
    title: "Highland Eco Townhome",
    address: "512 Arts District Walk, Portland",
    price: "$645,000",
    badge: "Under Contract",
    badgeVariant: "secondary" as const,
    beds: 3,
    baths: 2.5,
    sqft: "1,980",
    gradient: "from-teal-500/20 via-cyan-600/10 to-blue-500/20",
    accentColor: "text-teal-600 dark:text-teal-400",
  },
];

export default function Home() {
  const [savedIds, setSavedIds] = React.useState<Record<string, boolean>>({});

  const toggleSave = (id: string, title: string) => {
    setSavedIds((prev) => {
      const nextState = !prev[id];
      if (nextState) {
        toast.success(`Saved "${title}"`, {
          description: "Added to your Saved Homes dashboard list.",
        });
      } else {
        toast.info(`Removed "${title}" from saved homes.`);
      }
      return { ...prev, [id]: nextState };
    });
  };

  const handleAlertTrigger = () => {
    toast.success("Alert Preferences Activated", {
      description: "You'll receive real-time notifications for price drops and new nearby listings.",
      icon: <CheckCircle2 className="size-4 text-emerald-500" />,
    });
  };

  const handleSimulatePriceDrop = () => {
    toast("Market Price Update", {
      description: "Geometric Terrace Villa was just discounted by $35,000 (Now $895,000).",
      icon: <TrendingUp className="size-4 text-blue-500" />,
      action: {
        label: "View Listing",
        onClick: () => console.log("Viewing listing details"),
      },
    });
  };

  const handleSaveSearch = () => {
    toast.info("Geographic Search Boundary Saved", {
      description: "Westlake Hills & Central Core filters saved with radius 15 miles.",
      icon: <BookmarkPlus className="size-4 text-primary" />,
    });
  };

  return (
        <div className="min-h-screen flex flex-col bg-background">
        {/* --- MAIN DASHBOARD CONTENT AREA --- */}
        <main className="flex-1 space-y-8 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {/* Hero Banner with Geometric Accents */}
          <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-muted/40 p-6 md:p-10 shadow-xs">
            <div className="absolute right-0 top-0 -mt-6 -mr-6 hidden lg:block opacity-[0.06] pointer-events-none">
              <HouseLogo size={320} />
            </div>

            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="size-3.5" />
                <span>Next-Gen Geospatial Real Estate Platform</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                Map-First Property Intelligence
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                Seamlessly explore neighborhoods, track price trajectories, and inspect
                high-yield residential listings with recursive spatial intelligence.
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <Button onClick={handleAlertTrigger} className="gap-2">
                  <Bell className="size-4" />
                  Enable Listing Alerts
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSimulatePriceDrop}
                  className="gap-2"
                >
                  <TrendingUp className="size-4" />
                  Simulate Price Drop
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSaveSearch}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Compass className="size-4" />
                  Save Search Bounds
                </Button>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-8 pt-6 border-t border-border/60">
              <div>
                <p className="text-xs text-muted-foreground">Active Listings</p>
                <p className="text-2xl font-semibold tracking-tight">1,482</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Median Price</p>
                <p className="text-2xl font-semibold tracking-tight">$825,000</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg. Days on Market</p>
                <p className="text-2xl font-semibold tracking-tight">18 days</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">New Today</p>
                <p className="text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
                  +34
                </p>
              </div>
            </div>
          </section>

          {/* --- CAROUSEL: FEATURED PROPERTIES --- */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Featured Properties</h2>
                <p className="text-sm text-muted-foreground">
                  Hand-picked architectural listings with real-time valuation markers
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  5 Listings in View
                </Badge>
              </div>
            </div>

            {/* Embla Carousel with shadcn wrapper */}
            <div className="relative px-2 sm:px-12">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-3 md:-ml-4">
                  {featuredProperties.map((property) => (
                    <CarouselItem
                      key={property.id}
                      className="pl-3 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                    >
                      <Card className="h-full flex flex-col justify-between border-border transition-all duration-200 hover:shadow-md hover:border-primary/40 group">
                        {/* Property Visual Card Header */}
                        <div
                          className={`relative h-48 w-full rounded-t-xl bg-gradient-to-br ${property.gradient} flex items-center justify-center p-4 overflow-hidden border-b border-border/50`}
                        >
                          {/* Stylized Architectural Fractal Geometry Graphic */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:scale-105 transition-transform duration-300">
                            <HouseLogo
                              size={120}
                              className={property.accentColor}
                            />
                          </div>

                          {/* Badge tag top left */}
                          <div className="absolute top-3 left-3 z-10">
                            <Badge variant={property.badgeVariant} className="shadow-xs">
                              {property.badge}
                            </Badge>
                          </div>

                          {/* Quick Save top right */}
                          <button
                            onClick={() => toggleSave(property.id, property.title)}
                            aria-label="Save property"
                            className="absolute top-3 right-3 z-10 size-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors shadow-xs"
                          >
                            <Heart
                              className={`size-4 ${
                                savedIds[property.id]
                                  ? "fill-red-500 text-red-500"
                                  : ""
                              }`}
                            />
                          </button>

                          {/* Price Tag bottom-left overlay */}
                          <div className="absolute bottom-3 left-3 z-10 rounded-md bg-background/90 backdrop-blur-xs px-2.5 py-1 shadow-xs border border-border/50">
                            <span className="font-bold text-base tracking-tight text-foreground">
                              {property.price}
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                            {property.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                            <MapPin className="size-3 shrink-0 text-primary" />
                            <span className="truncate">{property.address}</span>
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="p-4 pt-1">
                          <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/60 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Bed className="size-3.5 text-foreground" />
                              <span>{property.beds} Beds</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Bath className="size-3.5 text-foreground" />
                              <span>{property.baths} Baths</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Square className="size-3.5 text-foreground" />
                              <span>{property.sqft} sqft</span>
                            </div>
                          </div>
                        </CardContent>

                        <CardFooter className="p-4 pt-0 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => {
                              toast.info(`Inspecting ${property.title}`, {
                                description: `Coordinates locked for ${property.address}. Interactive map view loading soon.`,
                              });
                            }}
                          >
                            View Details
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-foreground shrink-0"
                            onClick={() => {
                              navigator.clipboard?.writeText(
                                `${property.title} - ${property.price}`
                              );
                              toast.success("Listing link copied to clipboard");
                            }}
                          >
                            <Share2 className="size-3.5" />
                            <span className="sr-only">Share</span>
                          </Button>
                        </CardFooter>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex -left-4 md:-left-6" />
                <CarouselNext className="hidden sm:flex -right-4 md:-right-6" />
              </Carousel>
            </div>
          </section>

          {/* --- INTERACTIVE ACTION & TOAST NOTIFICATION SECTION --- */}
          <section className="rounded-xl border border-border bg-card p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Interactive Feedback System
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Week 1 Demonstration
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight">
                  Instant Notifications & Alert Actions
                </h3>
                <p className="text-sm text-muted-foreground">
                  Trigger rich feedback toasts powered by Sonner to communicate
                  state transitions, price movements, and search updates.
                </p>
              </div>

              {/* Toast Trigger Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleAlertTrigger}
                  className="gap-2 shadow-xs"
                >
                  <Bell className="size-4" />
                  Subscribe for Alerts
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSimulatePriceDrop}
                  className="gap-2"
                >
                  <TrendingUp className="size-4" />
                  Trigger Price Toast
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleSaveSearch}
                  className="gap-2"
                >
                  <SlidersHorizontal className="size-4" />
                  Save Search Filter
                </Button>
              </div>
            </div>
          </section>
        </main>
        </div>
  );
}

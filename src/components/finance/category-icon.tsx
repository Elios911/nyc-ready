import {
  Activity,
  Apple,
  Bike,
  Calendar,
  CarTaxiFront,
  CircleEllipsis,
  Clapperboard,
  Coffee,
  Cookie,
  Croissant,
  Droplet,
  Drumstick,
  Dumbbell,
  Footprints,
  HeartPulse,
  Home,
  KeyRound,
  LifeBuoy,
  Milk,
  Mountain,
  Package,
  PackageOpen,
  Palette,
  PiggyBank,
  Pill,
  Repeat,
  Scissors,
  Shield,
  Shirt,
  ShoppingBasket,
  Sofa,
  Sparkles,
  SprayCan,
  Stethoscope,
  Ticket,
  TrainFront,
  TrendingUp,
  Truck,
  Utensils,
  Wallet,
  Wifi,
  Wine,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { getCategory } from "@/lib/domain/categories";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  apple: Apple,
  bike: Bike,
  calendar: Calendar,
  "car-taxi-front": CarTaxiFront,
  "circle-ellipsis": CircleEllipsis,
  clapperboard: Clapperboard,
  coffee: Coffee,
  cookie: Cookie,
  croissant: Croissant,
  droplet: Droplet,
  drumstick: Drumstick,
  dumbbell: Dumbbell,
  footprints: Footprints,
  "heart-pulse": HeartPulse,
  home: Home,
  "key-round": KeyRound,
  "life-buoy": LifeBuoy,
  milk: Milk,
  mountain: Mountain,
  package: Package,
  "package-open": PackageOpen,
  palette: Palette,
  "piggy-bank": PiggyBank,
  pill: Pill,
  repeat: Repeat,
  scissors: Scissors,
  shield: Shield,
  shirt: Shirt,
  "shopping-basket": ShoppingBasket,
  sofa: Sofa,
  sparkles: Sparkles,
  "spray-can": SprayCan,
  stethoscope: Stethoscope,
  ticket: Ticket,
  "train-front": TrainFront,
  "trending-up": TrendingUp,
  truck: Truck,
  utensils: Utensils,
  wallet: Wallet,
  wifi: Wifi,
  wine: Wine,
  zap: Zap,
};

export function CategoryIcon({ categoryId, className }: { categoryId: string | null; className?: string }) {
  const Icon = ICONS[getCategory(categoryId)?.icon ?? ""] ?? CircleEllipsis;
  return <Icon aria-hidden className={cn("size-4", className)} />;
}

/** Icon in a soft rounded square, used in lists. */
export function CategoryIconTile({ categoryId, className }: { categoryId: string | null; className?: string }) {
  return (
    <span className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground", className)}>
      <CategoryIcon categoryId={categoryId} />
    </span>
  );
}

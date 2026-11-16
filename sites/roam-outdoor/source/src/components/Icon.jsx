import { ArrowUpRight, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, X, Plus, Minus, ShoppingBag, Check, Info, Mountain, Shirt, Backpack, Footprints, LayoutGrid, Wind, Droplets, Feather, MoveHorizontal, RotateCcw, Trash2, MapPin, Compass, Smartphone, Wallet } from 'lucide-react';

const registry = { arrowUpRight: ArrowUpRight, arrowLeft: ArrowLeft, arrowRight: ArrowRight, chevronLeft: ChevronLeft, chevronRight: ChevronRight, close: X, plus: Plus, minus: Minus, bag: ShoppingBag, check: Check, info: Info, mountain: Mountain, shirt: Shirt, backpack: Backpack, footprints: Footprints, grid: LayoutGrid, wind: Wind, rain: Droplets, feather: Feather, move: MoveHorizontal, reset: RotateCcw, trash: Trash2, pin: MapPin, compass: Compass, phone: Smartphone, wallet: Wallet };

export default function Icon({ name, size = 20, ...props }) {
  const Glyph = registry[name];
  if (!Glyph) return null;
  return <Glyph size={size} strokeWidth={2} aria-hidden="true" {...props} />;
}

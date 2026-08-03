import {
  Tag, Key, Search, Building2, Home, Wheat, Square, Store,
  Briefcase, Building, Scale, Stamp, FileText, ArrowLeftRight, FileSignature,
  Gift, FileMinus, FileX, Scroll, BookText, Flame, Zap, Droplets,
  Calculator, BadgeCheck, type LucideIcon,
} from 'lucide-react';

const map: Record<string, LucideIcon> = {
  Tag, Key, Search, Building2, Home, Wheat, Square, Store,
  Briefcase, Building, Scale, Stamp, FileText, ArrowLeftRight, FileSignature,
  Gift, FileMinus, FileX, Scroll, BookText, Flame, Zap, Droplets,
  Calculator, BadgeCheck,
};

export function getIcon(name: string): LucideIcon {
  return map[name] ?? Tag;
}

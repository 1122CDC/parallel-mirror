import type { Component } from 'vue'
import {
  Bike,
  BookUser,
  Camera,
  ChevronLeft,
  ChevronRight,
  Compass,
  Fingerprint,
  GraduationCap,
  Heart,
  Laptop,
  MessageSquare,
  MoreHorizontal,
  PlusCircle,
  Radar,
  Search,
  Share2,
  Store,
  User,
} from 'lucide-vue-next'

const iconMap: Record<string, Component> = {
  bike: Bike,
  'book-user': BookUser,
  camera: Camera,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  compass: Compass,
  fingerprint: Fingerprint,
  'graduation-cap': GraduationCap,
  heart: Heart,
  laptop: Laptop,
  'message-square': MessageSquare,
  'more-horizontal': MoreHorizontal,
  'plus-circle': PlusCircle,
  radar: Radar,
  search: Search,
  'share-2': Share2,
  store: Store,
  user: User,
}

export function resolveIcon(name: string): Component {
  return iconMap[name] ?? User
}


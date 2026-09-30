"use client";
// Phosphor icon set (duotone for navigation, regular/bold for inline actions) behind one name map,
// so the whole app stays visually consistent and swappable.
import {
  SquaresFour, ChatsCircle, Briefcase, UsersThree, BookmarksSimple, GearSix, X, BookmarkSimple, Pause, Play, Stop,
  ArrowCounterClockwise, DownloadSimple, SlidersHorizontal, Columns, Quotes, Calculator, MagnifyingGlass, Sparkle, Trash,
  LockSimple, Copy, Warning, ArrowRight, ArrowUpRight, CheckCircle, XCircle, Question, Clock, CaretUpDown, Plus, UploadSimple,
  FileText, ArrowsClockwise, Lightning, ShieldCheck, Target, type Icon as PhIcon, type IconWeight,
} from "@phosphor-icons/react";

const MAP = {
  overview: SquaresFour, ask: ChatsCircle, jobs: Briefcase, candidates: UsersThree, shortlists: BookmarksSimple, settings: GearSix,
  close: X, bookmark: BookmarkSimple, bookmarkFilled: BookmarkSimple, pause: Pause, play: Play, stop: Stop, retry: ArrowCounterClockwise,
  download: DownloadSimple, sliders: SlidersHorizontal, columns: Columns, quote: Quotes, calculator: Calculator, search: MagnifyingGlass,
  sparkle: Sparkle, trash: Trash, lock: LockSimple, copy: Copy, warning: Warning, arrowRight: ArrowRight, arrowUpRight: ArrowUpRight,
  supported: CheckCircle, contradicted: XCircle, unknown: Question, pending: Clock, updown: CaretUpDown, plus: Plus, upload: UploadSimple,
  file: FileText, refresh: ArrowsClockwise, bolt: Lightning, shield: ShieldCheck, target: Target,
} satisfies Record<string, PhIcon>;

export type IconName = keyof typeof MAP;

export function Icon({ name, className, weight, ...rest }: { name: IconName; className?: string; weight?: IconWeight } & React.SVGProps<SVGSVGElement>) {
  const C = MAP[name];
  const w: IconWeight = weight ?? (name === "bookmarkFilled" || name === "supported" || name === "contradicted" ? "fill" : "bold");
  return <C className={className} weight={w} {...(rest as object)} />;
}

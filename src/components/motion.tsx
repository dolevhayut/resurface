"use client";
// Motion primitives. AnimatedNumber and AnimatedBackground are adapted from ibelick's
// components on 21st.dev (motion-primitives), ported from framer-motion to `motion`.
import { motion, useSpring, useTransform, AnimatePresence, type SpringOptions, type Transition } from "motion/react";
import { Children, cloneElement, useEffect, useId, useState, type ReactElement } from "react";
import clsx from "clsx";

export const spring: Transition = { type: "spring", stiffness: 420, damping: 34, mass: 0.8 };
export const softSpring: Transition = { type: "spring", stiffness: 220, damping: 28 };

export function AnimatedNumber({ value, className, format, springOptions }: { value: number; className?: string; format?: (n: number) => string; springOptions?: SpringOptions }) {
  const s = useSpring(value, springOptions ?? { bounce: 0, duration: 900 });
  const display = useTransform(s, (v) => (format ? format(v) : Math.round(v).toLocaleString()));
  useEffect(() => {
    s.set(value);
  }, [s, value]);
  return <motion.span className={clsx("tabular-nums", className)}>{display}</motion.span>;
}

type BgChild = ReactElement<{ "data-id": string; className?: string; children?: React.ReactNode }>;

/** Sliding highlight behind the active / hovered child (shared layoutId). */
export function AnimatedBackground({ children, value, className, hover = false, transition = spring }: { children: BgChild[] | BgChild; value?: string | null; className?: string; hover?: boolean; transition?: Transition }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const uid = useId();
  const active = hover ? hovered ?? value : value;
  return (
    <>
      {Children.map(children, (child: BgChild) => {
        const id = child.props["data-id"];
        return cloneElement(
          child,
          {
            className: clsx("relative", child.props.className),
            ...(hover ? { onMouseEnter: () => setHovered(id), onMouseLeave: () => setHovered(null) } : {}),
          } as object,
          <>
            <AnimatePresence initial={false}>
              {active === id && (
                <motion.span layoutId={`bg-${uid}`} className={clsx("absolute inset-0 -z-0", className)} transition={transition} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
              )}
            </AnimatePresence>
            <span className="relative z-10 flex w-full items-center gap-[inherit]">{child.props.children}</span>
          </>,
        );
      })}
    </>
  );
}

export function FadeIn({ children, delay = 0, className, y = 8 }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ ...softSpring, delay }}>
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className, gap = 0.04 }: { children: React.ReactNode; className?: string; gap?: number }) {
  return (
    <motion.div className={className} initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={{ hidden: { opacity: 0, y: 10, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: softSpring } }}>
      {children}
    </motion.div>
  );
}

export function Press({ children, className, ...rest }: React.ComponentProps<typeof motion.button>) {
  return (
    <motion.button whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={spring} className={className} {...rest}>
      {children}
    </motion.button>
  );
}

export function SpringBar({ value, className, barClassName }: { value: number; className?: string; barClassName?: string }) {
  return (
    <div className={clsx("h-1.5 overflow-hidden rounded-full bg-subtle", className)}>
      <motion.div className={clsx("h-full rounded-full bg-pine", barClassName)} initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} transition={softSpring} />
    </div>
  );
}

export { motion, AnimatePresence };

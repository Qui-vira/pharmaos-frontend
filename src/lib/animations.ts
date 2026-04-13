import { type Variants } from 'framer-motion';

// Page-level transitions
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

// Stagger children container
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

// Individual stagger item
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  },
};

// Fade in from below
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// Scale in (for cards, modals)
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

// Slide in from right (for panels)
export const slideInRight: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 200 } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.2 } },
};

// Slide in from left (for sidebar)
export const slideInLeft: Variants = {
  hidden: { x: '-100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 200 } },
  exit: { x: '-100%', opacity: 0, transition: { duration: 0.2 } },
};

// Number counter spring
export const counterSpring = {
  type: 'spring' as const,
  damping: 20,
  stiffness: 100,
};

// Card hover effect
export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.02, y: -4, transition: { duration: 0.2 } },
};

// Tab indicator (uses layoutId)
export const tabIndicator = {
  layout: true,
  transition: { type: 'spring', stiffness: 500, damping: 30 },
};

// List item enter/exit
export const listItem: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 12, transition: { duration: 0.15 } },
};

// Pulse animation for alerts
export const pulse: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: { duration: 2, repeat: Infinity },
  },
};

## Packages
framer-motion | Page transitions and scroll-triggered animations
date-fns | Human-readable date formatting
lucide-react | Beautiful icons

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  sans: ["var(--font-sans)"],
  display: ["var(--font-display)"],
}

The backend handles AI generation via Anthropic integrations. Please ensure the /api/star-answers/generate endpoint takes 5-15 seconds; the frontend has handling for this loading state.

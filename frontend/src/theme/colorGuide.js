/**
 * Color Theme Reference
 * ==================================================
 * CURRENT CLINIC THEME
 * ==================================================
 *
 * To apply the new theme across all components:
 * 
 * PRIMARY COLORS:
 * ---------
 * Primary: #0EA5E9 (Blue — trust, healthcare)
 * Secondary: #22C55E (Green — recovery, health)
 * Accent: #F97316 (Orange — energy, sports)
 * Background: #F8FAFC
 * Text: #0F172A
 *
 * TAILWIND CLASS REPLACEMENTS:
 * ---------
 * text-[#0EA5E9] → text-primary or text-accent
 * bg-[#0EA5E9] → bg-primary or bg-gradient-primary
 * border-[#0EA5E9] → border-primary
 * hover:text-[#0EA5E9] → hover:text-accent
 * hover:bg-[#0EA5E9] → hover:bg-primary or hover:shadow-glow-primary
 *
 * GRADIENT BACKGROUNDS:
 * ---------
 * bg-gradient-primary - Blue to Green gradient
 * bg-gradient-dark - Light neutral gradient
 * bg-gradient-card - Subtle blue/green card tint
 *
 * SHADOWS/GLOWS:
 * ---------
 * shadow-glow-primary - Blue glow effect
 * shadow-glow-accent - Orange glow effect
 * shadow-card - Standard card shadow
 */

export const THEME_COLORS = {
  primary: '#0ea5e9',      // Blue
  primaryLight: '#38bdf8',
  primaryDark: '#0369a1',
  secondary: '#22c55e',    // Green
  
  accent: '#f97316',       // Orange
  accentLight: '#fb923c',
  accentDark: '#c2410c',
  
  dark: {
    50: '#f8fafc',
    100: '#f1f5f9',
    900: '#0f172a',
  }
};

export const TAILWIND_REPLACEMENTS = {
  text: 'Prefer text-slate-900 / text-primary / text-accent',
  bg: 'Prefer bg-slate-50 / bg-gradient-primary',
  border: 'Prefer border-primary or border-accent',
  hover: 'Prefer hover:text-accent or hover:shadow-glow-primary',
};

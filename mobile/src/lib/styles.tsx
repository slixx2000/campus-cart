import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

/**
 * Design tokens, mirroring the web app's CSS variables in src/app/globals.css.
 *
 * Kept as a hand-maintained copy rather than a generated artefact: it is twenty
 * colour strings that change roughly never, and sharing them between a Next
 * build and a Metro bundle would cost more than it saves.
 */
export type Mode = 'light' | 'dark';

export type Theme = {
  bg: string;
  surface: string;
  surface2: string;
  line: string;
  fg: string;
  muted: string;
  primary: string;
  onPrimary: string;
  accent: string;
  danger: string;
  /** Modal/backdrop veil — the one place translucency survives the flat design. */
  scrim: string;
};

export const palettes: Record<Mode, Theme> = {
  light: {
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    surface2: '#F1F5F9',
    line: '#E2E8F0',
    fg: '#0F172A',
    muted: '#64748B',
    primary: '#0F172A',
    onPrimary: '#FFFFFF',
    accent: '#10B981',
    danger: '#DC2626',
    scrim: 'rgba(15, 23, 42, 0.45)',
  },
  dark: {
    bg: '#0B1120',
    surface: '#111827',
    surface2: '#1E293B',
    line: '#1F2937',
    fg: '#F8FAFC',
    muted: '#94A3B8',
    primary: '#F8FAFC',
    onPrimary: '#0F172A',
    accent: '#34D399',
    danger: '#F87171',
    scrim: 'rgba(2, 6, 23, 0.60)',
  },
};

/** Mode-independent scales — deliberately not in context. */
export const radius = { sm: 6, md: 8, full: 999 } as const;
export const text = { xs: 11, sm: 13, base: 15, lg: 18, xl: 22, xxl: 28 } as const;

const createStyles = (c: Theme) =>
  StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: c.bg },
  container: { flex: 1, backgroundColor: c.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingCard: {
    width: '84%',
    maxWidth: 320,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.line,
    paddingHorizontal: 18,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 12,
  },
  loadingCartWrap: {
    padding: 10,
    borderRadius: radius.full,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
  },
  loadingTrack: {
    width: 120,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: c.surface2,
    overflow: 'hidden',
  },
  loadingTrackGlow: {
    width: 30,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: c.surface,
  },
  loadingText: { color: c.muted, fontSize: text.base },
  authToastContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 40,
  },
  authToastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    maxWidth: 360,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  authToastCopy: { flex: 1 },
  authToastTitle: { color: c.fg, fontSize: text.sm, fontWeight: '800' },
  authToastBody: { color: c.muted, fontSize: text.sm, marginTop: 1 },
  feedbackModalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surface,
    paddingHorizontal: 22,
  },
  feedbackModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: c.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.line,
    paddingHorizontal: 18,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 10,
  },
  feedbackModalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surface2,
    borderWidth: 1,
    borderColor: c.line,
  },
  feedbackModalTitle: { color: c.fg, fontSize: text.lg, fontWeight: '900', textAlign: 'center' },
  feedbackModalMessage: { color: c.muted, fontSize: text.base, lineHeight: 21, textAlign: 'center' },
  feedbackModalButton: {
    marginTop: 6,
    width: '100%',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.surface2,
    paddingVertical: 12,
    alignItems: 'center',
  },
  feedbackModalButtonText: { color: c.accent, fontSize: text.base, fontWeight: '800' },
  headerBrand: { color: c.fg, fontSize: text.xl, fontWeight: '800' },
  headerSubtitle: { color: c.muted, fontSize: text.sm },
  screenContent: { paddingHorizontal: 18, paddingBottom: 120, paddingTop: 16, gap: 14 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 },
  sectionHeaderCopy: { flex: 1, gap: 4 },
  sectionEyebrow: { color: c.accent, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '800', fontSize: text.xs },
  sectionBody: { color: c.muted, fontSize: text.base, lineHeight: 20 },
  sectionBadge: { backgroundColor: c.surface2, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: c.accent },
  sectionBadgeText: { color: c.accent, fontWeight: '800', fontSize: text.xs, textTransform: 'uppercase' },
  heroCard: { backgroundColor: c.surface, borderRadius: radius.md, padding: 22, borderWidth: 1, borderColor: c.line, gap: 12 },
  heroCardCompact: { backgroundColor: c.surface, borderRadius: radius.md, paddingHorizontal: 18, paddingVertical: 16, borderWidth: 1, borderColor: c.line, gap: 10 },
  heroBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  heroLogo: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: c.surface },
  heroBrandTitle: { color: c.fg, fontWeight: '900', fontSize: text.base },
  heroBrandSubtitle: { color: c.muted, fontSize: text.xs, marginTop: 1 },
  heroEyebrow: { color: c.accent, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '800', fontSize: text.sm },
  heroTitle: { color: c.fg, fontSize: text.xxl, fontWeight: '900', lineHeight: 36 },
  heroBody: { color: c.muted, fontSize: text.base, lineHeight: 22 },
  heroButtonRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  statCard: { flex: 1, backgroundColor: c.bg, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, padding: 14, gap: 4 },
  statValue: { color: c.fg, fontWeight: '900', fontSize: text.xl },
  statLabel: { color: c.muted, fontSize: text.sm },
  primaryButton: { backgroundColor: c.primary, paddingHorizontal: 18, paddingVertical: 14, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: c.onPrimary, fontWeight: '600', fontSize: text.base },
  secondaryButton: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, paddingHorizontal: 18, paddingVertical: 14, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: c.fg, fontWeight: '600', fontSize: text.base },
  sectionTitle: { color: c.fg, fontWeight: '800', fontSize: text.xl, marginTop: 8 },
  horizontalStrip: { marginTop: 4 },
  homeCategoryChip: {
    backgroundColor: c.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: c.line,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginRight: 8,
  },
  homeCategoryChipText: { color: c.muted, fontWeight: '700', fontSize: text.xs },
  filterStripContent: { paddingRight: 8 },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: c.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: c.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchBarInput: { flex: 1, color: c.fg, fontSize: text.base, padding: 0 },
  homeActionRow: { flexDirection: 'row', gap: 10 },
  homeActionButton: { flex: 1 },
  homeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 },
  homeGridItem: { width: '48%', marginBottom: 10 },
  carouselDots: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  carouselDot: { height: 6, borderRadius: radius.full, marginHorizontal: 3 },
  browseHeaderSection: { gap: 10, marginBottom: 8 },
  browseListContent: { paddingBottom: 120, gap: 12 },
  browseGridRow: { gap: 10, marginBottom: 10 },
  browseGridItem: { flex: 1 },
  chip: { backgroundColor: c.surface2, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  chipActive: { backgroundColor: c.primary },
  chipText: { color: c.muted, fontWeight: '500', fontSize: text.sm },
  chipTextActive: { color: c.onPrimary, fontWeight: '600' },
  favoriteButton: { width: 42, height: 42, borderRadius: radius.full, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.line },
  favoriteButtonActive: { backgroundColor: c.danger, borderColor: c.danger },
  favoriteButtonText: { color: c.onPrimary, fontSize: text.lg },
  input: { backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, paddingHorizontal: 16, paddingVertical: 14, color: c.fg, fontSize: text.base },
  multilineInput: { minHeight: 110, textAlignVertical: 'top' },
  card: { backgroundColor: c.surface, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: c.line, marginTop: 10 },
  cardCompact: { marginTop: 0, borderRadius: radius.md },
  cardHomeTight: { borderRadius: radius.md },
  cardImage: { width: '100%', height: 210, backgroundColor: c.surface },
  cardImageCompact: { height: 152 },
  cardImageHomeTight: { height: 180 },
  cardImageWrap: { position: 'relative' },
  imageCountBadge: { position: 'absolute', right: 12, bottom: 12, backgroundColor: c.surface, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: c.line },
  cardTopActions: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', gap: 8 },
  cardImageMessageButton: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: c.surface,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: c.line,
  },
  cardImageMessageButtonText: { color: c.onPrimary, fontSize: text.xs, fontWeight: '800' },
  imageCountBadgeText: { color: c.onPrimary, fontWeight: '700', fontSize: text.xs },
  cardContent: { paddingHorizontal: 10, paddingTop: 9, paddingBottom: 10, gap: 4 },
  cardContentHomeTight: { paddingHorizontal: 7, paddingTop: 6, paddingBottom: 7, gap: 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  cardCategory: { color: c.accent, fontWeight: '800', fontSize: text.sm },
  cardConditionLabel: {
    color: c.accent,
    fontWeight: '800',
    fontSize: text.xs,
    backgroundColor: c.surface2,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  trustRowCompact: { marginTop: 2, gap: 6 },
  trustRowHomeTight: { marginTop: 1, gap: 5 },
  trustPill: { backgroundColor: c.surface2, borderWidth: 1, borderColor: c.line, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  trustPillText: { color: c.accent, fontSize: text.xs, fontWeight: '700' },
  trustPillHomeTight: { paddingHorizontal: 8, paddingVertical: 4 },
  trustPillTextHomeTight: { fontSize: text.xs },
  cardPrice: { color: c.fg, fontWeight: '900', fontSize: text.base },
  cardPriceCompact: { fontSize: text.xs },
  cardPriceHomeTight: { fontSize: text.sm },
  cardTitle: { color: c.fg, fontWeight: '800', fontSize: text.base },
  cardTitleCompact: { fontSize: text.xs, lineHeight: 14 },
  cardTitleHomeTight: { fontSize: text.xs, lineHeight: 13 },
  cardMeta: { color: c.muted, fontSize: text.sm },
  cardMetaHomeTight: { fontSize: text.xs },
  cardMetaLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardMetaLineLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  cardDescription: { color: c.muted, fontSize: text.base, lineHeight: 20 },
  cardSeller: { color: c.fg, fontWeight: '700', fontSize: text.xs },
  cardSellerHomeTight: { fontSize: text.xs },
  cardVerifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: c.surface2,
    borderWidth: 1,
    borderColor: c.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardVerifiedBadgeText: { color: c.accent, fontSize: text.sm, fontWeight: '900' },
  cardSellerAvatar: { width: 24, height: 24, borderRadius: radius.md, marginRight: 6 },
  cardDate: { color: c.muted, fontSize: text.xs },
  cardDateHomeTight: { fontSize: text.xs },
  cardFooterCompact: { marginTop: 2 },
  detailImage: { width: '100%', height: 260, borderRadius: radius.md, backgroundColor: c.surface },
  detailThumbRow: { marginTop: 12 },
  detailThumb: { width: 78, height: 78, borderRadius: radius.md, marginRight: 10, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface },
  detailCategory: { color: c.accent, fontWeight: '800', fontSize: text.sm, marginTop: 16 },
  detailTitle: { color: c.fg, fontWeight: '900', fontSize: text.xxl, lineHeight: 34, marginTop: 8 },
  detailPrice: { color: c.fg, fontWeight: '900', fontSize: text.xl, marginTop: 8 },
  detailMeta: { color: c.muted, marginTop: 6, fontSize: text.base },
  detailBody: { color: c.muted, marginTop: 14, fontSize: text.base, lineHeight: 22 },
  detailMetaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  detailMetaPill: { backgroundColor: c.bg, borderRadius: radius.full, borderWidth: 1, borderColor: c.line, paddingHorizontal: 12, paddingVertical: 8 },
  detailMetaPillText: { color: c.muted, fontWeight: '700', fontSize: text.sm },
  detailInfoCard: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, padding: 18, marginTop: 18, gap: 4 },
  infoLabel: { color: c.muted, textTransform: 'uppercase', fontSize: text.xs, fontWeight: '800', marginTop: 10 },
  infoValue: { color: c.fg, fontSize: text.base },
  noticeCard: { backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, padding: 18, marginTop: 8 },
  noticeTitle: { color: c.fg, fontWeight: '800', fontSize: text.lg },
  noticeBody: { color: c.muted, lineHeight: 22, marginTop: 8 },
  fieldLabel: { color: c.muted, fontWeight: '700', marginTop: 6 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryChoice: { backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, paddingHorizontal: 14, paddingVertical: 12 },
  categoryChoiceActive: { backgroundColor: c.primary, borderColor: c.primary },
  categoryChoiceText: { color: c.muted, fontWeight: '700' },
  categoryChoiceTextActive: { color: c.onPrimary },
  // Glassmorphic Profile Card with premium feel
  profileCard: { 
    backgroundColor: c.surface, 
    borderRadius: radius.md, 
    borderWidth: 1.5, 
    borderColor: c.line, 
    padding: 24,
  },
  profileTopRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarLarge: { 
    width: 80, 
    height: 80, 
    borderRadius: radius.full, 
    backgroundColor: c.surface,
    borderWidth: 2,
    borderColor: c.line,
  },
  profileName: { color: c.fg, fontWeight: '800', fontSize: text.xl, letterSpacing: 0.2 },
  profileMeta: { color: c.muted, marginTop: 6, fontSize: text.base },
  miniStatRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  miniStatCard: { 
    flex: 1, 
    backgroundColor: c.surface, 
    borderRadius: radius.md, 
    borderWidth: 1, 
    borderColor: c.line, 
    padding: 14,
  },
  miniStatValue: { color: c.accent, fontWeight: '900', fontSize: text.xl, letterSpacing: 0.3 },
  miniStatLabel: { color: c.muted, fontSize: text.sm, marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  badge: { 
    borderRadius: radius.full, 
    paddingHorizontal: 14, 
    paddingVertical: 10,
  },
  badgeVerified: { 
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
  },
  badgePending: { 
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
  },
  badgeText: { color: c.onPrimary, fontWeight: '700', fontSize: text.sm },
  unreadDot: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: c.accent },
  switchAuthText: { color: c.accent, textAlign: 'center', fontWeight: '700', marginTop: 4 },
  emptyState: { backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, padding: 22, marginTop: 12 },
  emptyTitle: { color: c.fg, fontWeight: '800', fontSize: text.lg },
  emptyBody: { color: c.muted, marginTop: 6, lineHeight: 20 },
  backButton: { alignSelf: 'flex-start', backgroundColor: c.surface, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: c.line },
  backButtonText: { color: c.fg, fontWeight: '700' },
  imagePreview: { width: 96, height: 96, borderRadius: radius.md, marginRight: 10, backgroundColor: c.surface },
  helperText: { color: c.muted, fontSize: text.sm, lineHeight: 18 },
  helperCard: { backgroundColor: c.bg, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, padding: 14, gap: 6 },
  helperCardTitle: { color: c.fg, fontWeight: '800', fontSize: text.base },
  formSection: { gap: 10, marginTop: 6 },
  divider: { height: 1, backgroundColor: c.line, marginVertical: 6 },
  statusCard: { backgroundColor: c.bg, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, padding: 14, gap: 6 },
  statusTitle: { color: c.fg, fontWeight: '800', fontSize: text.base },
  statusBody: { color: c.muted, lineHeight: 20, fontSize: text.sm },
  sellerListingCard: { backgroundColor: c.bg, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, padding: 14, gap: 8 },
  sellerListingTitle: { color: c.fg, fontWeight: '800', fontSize: text.base },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  smallButton: { backgroundColor: c.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: c.line, paddingHorizontal: 12, paddingVertical: 10 },
  smallButtonDanger: { backgroundColor: c.danger, borderColor: c.danger },
  smallButtonText: { color: c.fg, fontWeight: '700', fontSize: text.sm },
  avatarOption: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: c.line,
    marginRight: 10,
    marginVertical: 6,
  },
  avatarOptionSelected: {
    borderColor: c.accent,
  },
  avatarOptionImage: {
    width: '100%',
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: c.surface,
  },
  
  // Premium profile features
  profileContactButton: { 
    backgroundColor: c.surface2,
    borderWidth: 1.5,
    borderColor: c.line,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  profileContactButtonText: { 
    color: c.accent, 
    fontWeight: '800', 
    fontSize: text.base 
  },
  profileMetricsRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 16 
  },
  profileMetricItem: { 
    flex: 1,
    backgroundColor: c.surface2,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  profileMetricLabel: { 
    color: c.muted, 
    fontSize: text.xs, 
    fontWeight: '700',
    marginTop: 4
  },
  profileMetricValue: { 
    color: c.accent, 
    fontWeight: '900', 
    fontSize: text.base 
  },
  profileAboutCard: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.line,
    padding: 14,
    marginTop: 14,
  },
  profileAboutLabel: {
    color: c.accent,
    fontSize: text.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  profileAboutText: {
    color: c.muted,
    fontSize: text.sm,
    lineHeight: 18,
    marginTop: 6,
  },

  viewMoreButton: {
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: c.surface2,
    borderWidth: 1.5,
    borderColor: c.accent,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewMoreButtonText: {
    color: c.accent,
    fontWeight: '800',
    fontSize: text.base,
  },
  });

// Two themes, so both sheets are built once at import and picking one is an
// object lookup. That is the memoisation — no per-component style factory.
const sheets = {
  light: createStyles(palettes.light),
  dark: createStyles(palettes.dark),
};

type ThemeContextValue = {
  mode: Mode;
  colors: Theme;
  styles: typeof sheets.light;
  setMode: (mode: Mode) => void;
};

const ThemeContext = createContext<ThemeContextValue>(null as unknown as ThemeContextValue);

// Same key and values as the web app (see src/components/ThemeToggle.tsx), so the
// two clients describe the preference identically.
const STORAGE_KEY = 'campuscart-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemMode = useColorScheme();
  const [mode, setModeState] = useState<Mode | null>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!active) return;
        // A stored choice always wins; the system preference only seeds the
        // first launch. Matches the web behaviour exactly.
        setModeState(stored === 'dark' || stored === 'light' ? stored : systemMode === 'dark' ? 'dark' : 'light');
      })
      .catch(() => active && setModeState('light'));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render nothing for the first frame rather than flashing the wrong theme.
  if (!mode) return null;

  const setMode = (next: Mode) => {
    setModeState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <ThemeContext.Provider value={{ mode, colors: palettes[mode], styles: sheets[mode], setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

/**
 * The themed stylesheet.
 *
 * Consumers do `const styles = useStyles();` inside the component, which shadows
 * what used to be a module-scope import — so every existing `styles.x` reference
 * keeps working untouched. Renaming the *export* is what makes `tsc` list every
 * file still to be migrated.
 */
export const useStyles = () => useContext(ThemeContext).styles;

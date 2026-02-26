# Things to Revisit Later

Intentional shortcuts and deferred decisions. Each entry describes *what* was done, *why*, and *what the proper solution looks like* when we're ready.

---

## 1. Theme System Locked to Light Mode

**Date:** 2026-02-25
**Files affected:**
- `src/app/(frontend)/layout.tsx` — `data-theme="light"` hardcoded on `<html>`
- `src/providers/Theme/index.tsx` — `ThemeProvider` locked to `'light'`, no localStorage/OS-preference reads
- `src/providers/Theme/InitTheme/index.tsx` — no longer imported (but file still exists)
- `src/Footer/Component.tsx` — `ThemeSelector` removed from footer bottom bar

**Why we did this:**
On Macs with dark mode enabled, the original `InitTheme` script and `ThemeProvider` would detect `prefers-color-scheme: dark`, set `data-theme="dark"` on `<html>`, and blow up the entire site's color scheme. Nav links became invisible (white on white header), hover states turned into dark slabs, and the whole thing looked broken on first load. The SSR frame was correct (light), but React hydration immediately overwrote it.

**What the proper fix looks like:**
When we're ready for real multi-theme support:
1. Restore `ThemeProvider` to read from localStorage (but NOT OS preference — default should always be light for a Chamber website)
2. Restore `InitTheme` to prevent FOUC, but have it default to `'light'` instead of falling through to OS preference
3. Bring back `ThemeSelector` in the footer (or settings panel)
4. Audit every component that uses `text-foreground`, `bg-muted`, `bg-background` etc. to ensure they look correct in both themes
5. The utility nav (`bg-theme-primary text-white`) and main nav (`bg-white`) use hardcoded colors — these would need conditional logic or to remain fixed regardless of theme

---

## 2. Header `data-theme` Propagation Removed

**Date:** 2026-02-25
**File:** `src/Header/Component.client.tsx`

**What was there:**
The `<header>` element received `data-theme={theme}` based on `headerTheme` from `HeaderThemeProvider`. The `FullBleed` hero component calls `setHeaderTheme("dark")` to make the header look good overlaid on dark hero images.

**Why we removed it:**
With a solid white nav bar (`bg-white`), propagating `data-theme="dark"` onto the header made all CSS custom property-based colors resolve to dark mode values *within the header scope*. This caused:
- `text-foreground` → white (invisible on white bg)
- `bg-muted` → dark grey (jarring dark hover states)
- `text-muted-foreground` → light grey (low contrast)

**What the proper fix looks like:**
The original pattern is actually clever — it lets the header "float" transparently over dark hero images with light text. If we want that back:
1. The header needs a "transparent mode" vs "solid mode" design
2. In transparent mode: no background, light text, `data-theme="dark"` makes sense
3. In solid mode: white background, dark text, `data-theme` should be omitted or forced to `'light'`
4. The transition between modes (e.g., on scroll) needs to swap both background and theme
5. Consider whether this complexity is worth it for a Chamber site — the OBOT-style solid header is probably the right default

---

## 3. `InitTheme` Component Still Exists But Is Unused

**Date:** 2026-02-25
**File:** `src/providers/Theme/InitTheme/index.tsx`

The file is still in the codebase but no longer imported anywhere. It contains a `<Script strategy="beforeInteractive">` that sets `data-theme` based on localStorage/OS preference. Keep it around for when multi-theme returns; delete it if we decide single-theme is permanent.

---

## 4. `ThemeSelector` Component Still Exists But Is Unused

**Date:** 2026-02-25
**File:** `src/providers/Theme/ThemeSelector/index.tsx`

Same story. The Select dropdown with Auto/Light/Dark options is fully functional but not rendered anywhere. The footer has a comment placeholder where it used to live.

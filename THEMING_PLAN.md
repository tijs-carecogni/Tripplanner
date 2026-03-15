# TripMind Theming Plan (MindTrip-inspired)

This plan keeps the product language consistent across planning, map, chat, and recommendation surfaces.

## 1) Visual principles

1. **One system, many surfaces**: every panel should feel like part of the same product.
2. **Information first**: visual hierarchy should make trip decisions faster.
3. **Meaningful color**: accents are restrained; strong color is reserved for status, transport, and primary actions.
4. **Stable interaction states**: hover, focus, active, pinned, and disabled look predictable.

## 2) Token architecture

All styling values are sourced from `theme.css` tokens:

- **Typography**: font family, scale, line-height, font weights
- **Spacing**: 4px baseline scale (`--space-*`)
- **Radius**: small/medium/large/pill
- **Motion**: fast/base/slow durations + easing
- **Palette**: page, surfaces, text, brand, borders
- **Semantic transport colors**: flight/train/drive/walk
- **Elevation**: 3 shadow tiers + focus ring

## 3) Component contracts

Components should consume tokens only (no ad-hoc colors).

- **Cards**: common border, radius, elevation
- **Buttons**: primary/secondary/ghost variants with shared motion
- **Inputs**: unified border + focus ring + spacing
- **Chips**: shared pill style with semantic modifiers
- **List items/results/itinerary stops**: same shell, content changes by context
- **Map legend**: same chip primitives as non-map UI

## 4) State model (global consistency)

- **Hover**: subtle lift + stronger border
- **Focus-visible**: same focus ring on all interactive controls
- **Active/Selected**: stronger border + glow + slight transform
- **Pinned**: persistent highlight style shared between map and DOM cards
- **Dimmed**: low-opacity + desaturated, never fully hidden

## 5) Layout and density guidelines

- Sidebar optimized for data entry (tight but readable density)
- Workspace optimized for analysis (more breathing room)
- Header and section dividers provide orientation with minimal visual noise
- Typography target:
  - labels: `--font-size-sm`
  - metadata: `--font-size-sm` to `--font-size-xs`
  - section titles: `--font-size-lg`

## 6) Accessibility requirements

- Maintain AA contrast targets for body text and key controls
- Ensure keyboard focus is always visible
- Avoid color-only communication for critical statuses
- Keep motion subtle and quick for performance/readability

## 7) Dark mode strategy

- Use `[data-theme="dark"]` token overrides only
- Avoid component-specific dark mode hacks
- Keep semantics stable (e.g. transport colors still map the same meaning)

## 8) Rollout checklist

1. Foundation tokens (`theme.css`) ✅
2. Link token file in app shell ✅
3. Refactor core surfaces to token usage (ongoing)
4. Refactor all component hardcoded colors to tokens
5. Screenshot review loop after each styling pass
6. Contrast/focus audit

## 9) Definition of done

- No new hardcoded color values in components
- Shared interaction patterns across cards, map, and chat
- Visual consistency across full-page screenshot set
- Light and dark themes both usable and coherent

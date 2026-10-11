# AI Initiative Portfolio Explorer

A local, browser-based decision workspace for comparing AI and digital transformation initiatives. The seeded Accor example is **illustrative data — not actual Accor performance or forecasts**.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). For a production build, run `npm run build` and `npm run preview`. Run the automated checks with `npm test`.

## Five-minute workflow

1. Use the **Base / Conservative / Optimistic** control above the chart to inspect plausible planning cases. **Fit to Initiatives** focuses the axes on visible assessments; **Full Scale** shows the full 1–5 impact scale. Lock the fitted axes across scenarios when comparing bubble movement.
2. Select a bubble to read its rationale, evidence limits, cost, feasibility, and scenario differences.
3. In Compare, use sidebar checkboxes to compare two to four initiatives without an automatic winner.
4. Add an initiative, enter its name and archetype, then set impact, months to meaningful value, pilot investment, and residual urgency. Other inputs add context and can be completed later.
5. Export the chart as SVG, the portfolio as JSON, the current assessment as CSV, or print the presentation summary.

## Assessment method

- **Business Impact (1–5)** is a confirmed management judgment guided by magnitude, reach, and strategic significance. Productivity and revenue are equally valid sources. The scale is ordinal; horizontal distance is not a monetary difference. Fitted axes change only the display range; they never change an assessment.
- **Time to value (months)** starts at the investment decision and ends at the first meaningful, observable, sustained benefit. Faster appears higher. The KPI and improvement threshold define “meaningful.” Pilot length, broader rollout, and payback remain separate.
- **Bubble area** represents pilot investment in EUR, including internal resources. Advanced cost components replace the simple total to prevent double-counting. Rollout and annual operating cost are separate.
- **Color** represents user-confirmed residual urgency after temporary workarounds. Transparent guidance considers underlying severity, deadlines, and mandatory committed dependencies; it does not calculate a hidden numerical score.
- **Feasibility and evidence** stay outside the chart. A blocked feasibility check visibly marks an initiative; missing inputs remain incomplete rather than being plotted as zero.

Scenarios are independently editable plausible downside, central, and upside assumptions, not statistical intervals. They have no arbitrary multipliers. A more optimistic case can also cost more. The demo shows that pattern.

## Data and modules

`src/types.ts` defines the explicit initiative and scenario model. `src/lib/data.ts` holds the editable demo and blank form defaults. `src/lib/assessment.ts` contains calculation and guidance rules. `src/lib/classification.ts` defines main regions, subregions, scope choices, and the three business functions. `src/lib/metadata.ts` defines the eight archetypes and reference labels. `src/lib/portfolio.ts` handles immutable initiative changes. `src/lib/storage.ts` validates JSON, migrates known legacy classifications, persists portfolios in versioned `localStorage`, and handles import/export. Unknown legacy values remain visible for review. `src/ui` holds the chart, editor, and decision views.

All changes are saved in this browser. JSON export is the portable backup. Reset Demo Data replaces the local workspace with the three sample initiatives.

## Known limits

- Browser storage is device and browser specific; there is no account sync, backend, or live Accor data.
- The smallest bubbles have a visual minimum radius for legibility, so area proportionality is exact only above that floor. The tooltip shows the actual investment.
- The assessment depends on management judgment and evidence entered by users. It does not estimate ROI, optimize a portfolio, or select a winner.
- The SVG export uses the current filter and month range; initiatives outside that view remain in the portfolio and data exports.

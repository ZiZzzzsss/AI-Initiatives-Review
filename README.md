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
4. Open **Business Impact** on a seeded initiative and adjust one of its three qualitative assumptions. The suggested rating updates immediately. Save to move the chart bubble; switch scenarios to compare planning cases.
5. Export the chart as SVG, the portfolio as JSON, the current assessment as CSV, or print the presentation summary.

## Assessment method

- **Business Impact (1–5)** is a structured management judgment about potential business scale, incremental improvement beyond current practice, and the pathway to economic contribution for Accor. The scale is ordinal; horizontal distance is not a monetary difference. Fitted axes change only the display range; they never change an assessment.
- **Time to value (months)** starts at the investment decision and ends at the first meaningful, observable, sustained benefit. Faster appears higher. The KPI and improvement threshold define “meaningful.” Pilot length, broader rollout, and payback remain separate.
- **Bubble area** represents pilot investment in EUR, including internal resources. Advanced cost components replace the simple total to prevent double-counting. Rollout and annual operating cost are separate.
- **Color** represents user-confirmed residual urgency after temporary workarounds. Transparent guidance considers underlying severity, deadlines, and mandatory committed dependencies; it does not calculate a hidden numerical score.
- **Feasibility and evidence** stay outside the chart. A blocked feasibility check visibly marks an initiative; missing inputs remain incomplete rather than being plotted as zero.

Scenarios are independently editable plausible downside, central, and upside assumptions, not statistical intervals. They have no arbitrary multipliers. A more optimistic case can also cost more. The demo shows that pattern.

## Qualitative Business Impact guide

Each seeded initiative has three editable assumptions per scenario. Pricing considers incremental improvement beyond existing revenue management, deployment reach, and Accor's ability to capture contribution from improved hotel revenue. CRM considers the severity of the data-quality bottleneck, attributable sales effectiveness, and reach; record completeness alone does not imply more sales. Pitch Writer considers net proposal effort saved, the ability to turn released time into additional profitable work or realizable savings, and reach; time savings alone are not booked as financial value. A generic three-assumption guide is available for other initiative types, and existing manual assessments remain available.

The guide uses a visible *limiting-assumption rule*: each selected option states the highest defensible impact category it supports; the lowest of the three ceilings is the suggestion. Negligible incremental improvement limits the suggestion to 1; limited reach or a weak value pathway limits it to 2; regional reach or an uncertain value pathway limits it to 3; multi-regional reach or moderate improvement/value realization limits it to 4; 5 requires significant improvement, broad reach, and a strong plausible value pathway. This is a structured qualitative recommendation, not a weighted average, financial forecast, or proven ROI. Feasibility, urgency, readiness, and evidence confidence do not change the suggested impact.

**Model-suggested** mode uses the suggestion on the chart. **Management-confirmed** mode uses a confirmed 1–5 rating; a different rating requires a written rationale. The suggested and effective ratings remain visible together. If any assumption is missing, no suggestion is made. Existing local portfolios and JSON imports without the new assessment retain their saved manual ratings until a user explicitly starts a guide. The three seeded scenarios are illustrative, unvalidated judgments; they do not use hidden multipliers or force an optimistic score.

Open **Assumption evidence** to note source class, optional reference, rationale, and pilot validation for each assumption. Missing evidence is flagged but does not lower potential impact. Pilot work should test the incremental effect against current practice, the relevant deployment scope, and whether Accor realizes value. Strategic dependencies may inform management discussion but do not automatically raise CRM impact.

## Data and modules

`src/types.ts` defines the explicit initiative and scenario model. `src/lib/data.ts` holds the editable demo and blank form defaults. `src/lib/impactGuide.ts` holds the qualitative options, visible decision rule, and effective rating. `src/lib/assessment.ts` contains the remaining guidance rules. `src/lib/classification.ts` defines main regions, subregions, scope choices, and the three business functions. `src/lib/metadata.ts` defines the eight archetypes and reference labels. `src/lib/portfolio.ts` handles immutable initiative changes. `src/lib/storage.ts` validates JSON, migrates known legacy classifications, persists portfolios in versioned `localStorage`, and handles import/export. Unknown legacy values remain visible for review. `src/ui` holds the chart, editor, and decision views.

All changes are saved in this browser. JSON export is the portable backup. Reset Demo Data replaces the local workspace with the three sample initiatives.

## Known limits

- Browser storage is device and browser specific; there is no account sync, backend, or live Accor data.
- The smallest bubbles have a visual minimum radius for legibility, so area proportionality is exact only above that floor. The tooltip shows the actual investment.
- The assumption options and suggested categories are management aids, not validated Accor measurements. The assessment depends on judgment and pilot evidence. It does not estimate ROI, optimize a portfolio, or select a winner.
- The SVG export uses the current filter and month range; initiatives outside that view remain in the portfolio and data exports.

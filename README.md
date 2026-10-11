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
4. Edit a seeded initiative to change one economic assumption. The live preview and saved chart update from the active scenario. New initiatives retain manual impact assessment unless a supported economic model is assigned.
5. Export the chart as SVG, the portfolio as JSON, the current assessment as CSV, or print the presentation summary.

## Assessment method

- **Business Impact (1–5)** uses a common annual net Accor contribution scale for the three seeded models. Portfolio cutoffs default to €0, €100,000, €500,000 and €2,000,000 for ratings 2–5; below €0 is 1. These are illustrative, not Accor-approved. Edit them under **Impact thresholds** beside the portfolio selector. Cutoffs must strictly increase. Other initiatives use manual assessment. The scale remains ordinal; horizontal distance is not a monetary difference.
- **Time to value (months)** starts at the investment decision and ends at the first meaningful, observable, sustained benefit. Faster appears higher. The KPI and improvement threshold define “meaningful.” Pilot length, broader rollout, and payback remain separate.
- **Bubble area** represents pilot investment in EUR, including internal resources. Advanced cost components replace the simple total to prevent double-counting. Rollout and annual operating cost are separate.
- **Color** represents user-confirmed residual urgency after temporary workarounds. Transparent guidance considers underlying severity, deadlines, and mandatory committed dependencies; it does not calculate a hidden numerical score.
- **Feasibility and evidence** stay outside the chart. A blocked feasibility check visibly marks an initiative; missing inputs remain incomplete rather than being plotted as zero.

Scenarios are independently editable plausible downside, central, and upside assumptions, not statistical intervals. They have no arbitrary multipliers. A more optimistic case can also cost more. The demo shows that pattern.

## Economic models and assumption editing

Open a seeded initiative, choose **Business Impact**, and select Conservative, Base or Optimistic. Every numeric input is independent for each scenario. The **Economic Impact Model** displays the formula, a live breakdown, a calculated rating, and a separate final chart rating. Inputs are hypothetical planning estimates. The **Assumptions & Evidence** disclosure records source class, optional reference, explanation, and what the pilot must validate for each input.

- **Predictive Pricing:** incremental hotel room revenue = eligible annual hotel room revenue × incremental RevPAR uplift versus current practice × deployment reach. Captured Accor contribution = that incremental hotel revenue × assumed capture rate. Net annual Accor contribution subtracts annual operating cost. Hotel revenue is displayed separately and is never treated as consolidated Accor revenue.
- **Automated CRM Data Enrichment:** additional converted sales = eligible annual opportunity value × share materially affected by poor CRM data × deployment reach × *absolute percentage-point* win-rate improvement. Captured contribution applies the assumed capture rate; net subtracts annual operating cost. Baseline win rate plus improvement cannot exceed 100%. Improved data quality is a pilot KPI, not automatically a converted sale. Future strategic dependencies remain qualitative.
- **GenAI Pitch Writer:** existing-proposal conversion gains = adopted proposal volume × absolute win-rate improvement. Released drafting hours come from adopted volume × original drafting hours × time-saving rate. Extra proposal capacity uses only the redeployed share divided by post-improvement drafting hours, capped by available qualified demand. Additional wins use the improved win rate. Commercial value from both win sources is multiplied by the capture rate. Operating savings apply only the *non-redeployed* released hours × realizable saving share × loaded hourly cost. Net contribution combines captured commercial contribution and realizable savings, then subtracts annual operating cost. If neither demand nor realizable savings exist, time savings alone create no financial value.

Pilot investment and one-off rollout investment remain separate from annual recurring contribution. The tool does not infer a first-year cash flow or payback period. Missing or invalid model inputs show **Not calculated**. A management override can set the final 1–5 chart rating only with a written rationale; the calculated rating remains visible. Legacy confirmed manual ratings remain manual after import or storage migration and are never silently replaced by a model.

The selected initiative panel compares scenario contributions and shows the three largest one-variable sensitivity effects. Each input is moved up and down by 10% of its current value, at least one unit, with percentages bounded at 0–100; the larger valid effect is shown while all other inputs stay fixed. It flags a crossed rating cutoff or reversed economic ordering relative to another modelled initiative. This is a local planning probe, not a probability interval or automatic winner selection.

The seeded Base assumptions are illustrative expert judgments: pricing uses €1 billion eligible hotel room revenue, 0.8% incremental uplift, 45% reach and 30% capture; CRM uses €500 million eligible opportunity value, 30% affected share, 2 percentage points of uplift, 65% reach and 20% capture; Pitch Writer uses 10,000 eligible proposals at €200,000 average value, 1 percentage point of conversion uplift, 60% reach, 30% drafting time saving, 50% redeployment, demand for 300 extra proposals, and 20% realizable savings on non-redeployed time. Annual operating costs come from the existing scenario cost assumptions. None of these numbers is measured Accor performance, a forecast, or validated ROI.

## Data and modules

`src/types.ts` defines the explicit initiative and scenario model. `src/lib/data.ts` holds the editable demo and blank form defaults. `src/lib/economics.ts` contains pure economic formulas, score cutoffs, effective ratings, and sensitivity. `src/lib/assessment.ts` contains the remaining guidance rules. `src/lib/classification.ts` defines main regions, subregions, scope choices, and the three business functions. `src/lib/metadata.ts` defines the eight archetypes and reference labels. `src/lib/portfolio.ts` handles immutable initiative changes. `src/lib/storage.ts` validates JSON, migrates known legacy classifications, persists portfolios in versioned `localStorage`, and handles import/export. Unknown legacy values remain visible for review. `src/ui` holds the chart, editor, and decision views.

All changes are saved in this browser. JSON export is the portable backup. Reset Demo Data replaces the local workspace with the three sample initiatives.

## Known limits

- Browser storage is device and browser specific; there is no account sync, backend, or live Accor data.
- The smallest bubbles have a visual minimum radius for legibility, so area proportionality is exact only above that floor. The tooltip shows the actual investment.
- Capture rates, incremental uplift against current practice, sales conversion attribution, qualified demand, and realizable labor savings need pilot validation. Sensitivity changes only one variable and does not represent uncertainty or causality.
- The tool does not estimate ROI, optimize a portfolio, or select a winner.
- The SVG export uses the current filter and month range; initiatives outside that view remain in the portfolio and data exports.

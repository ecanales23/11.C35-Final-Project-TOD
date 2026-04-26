<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import { base } from "$app/paths";

  export let step = null;

  // All six GeoJSONs loaded on mount
  let tractData = { "2014": null, "2019": null, "2024": null };
  let todData   = { "2014": null, "2019": null, "2024": null };

  let svgEl;
  let width = 600;
  let height = 560;
  let transform = d3.zoomIdentity;
  let zoomBehavior;
  let hoveredTod = null;
  let hoveredTract = null;
  let lastStepKey = "";
  let basemap = null;

  // ── Choropleth color ramp ─────────────────────────────────────────────────
  const choroColors = ["#ffefb0", "#fad643", "#f59e0b", "#d97706", "#92400e"];

  // ── Extract low-income renter share (<$50k / total) from properties ───────
  function getLowIncomeRenterShare(props, periodKey) {
    let rentersUnder50k, total;
    if (periodKey === "2014") {
      const lt20 = props["j_wtd_C_Total:Renter-occupied housing units:Less than $20,000"] ?? 0;
      const to35 = props["j_wtd_C_Total:Renter-occupied housing units:$20,000 to $34,999"] ?? 0;
      const to50 = props["j_wtd_C_Total:Renter-occupied housing units:$35,000 to $49,999"] ?? 0;
      rentersUnder50k = lt20 + to35 + to50;
      total = props["j_wtd_C_Total"] ?? 0;
    } else if (periodKey === "2019") {
      const lt20 = props["j_wtd_C_Total: Renter-occupied housing units: Less than $20,000:"] ?? 0;
      const to35 = props["j_wtd_C_Total: Renter-occupied housing units: $20,000 to $34,999:"] ?? 0;
      const to50 = props["j_wtd_C_Total: Renter-occupied housing units: $35,000 to $49,999:"] ?? 0;
      rentersUnder50k = lt20 + to35 + to50;
      total = props["j_wtd_C_Total"] ?? 0;
    } else {
      // 2024
      const lt20 = props["Renter-Occupied Housing Units: Less Than $20,000"] ?? 0;
      const to35 = props["Renter-Occupied Housing Units: $20,000 To $34,999"] ?? 0;
      const to50 = props["Renter-Occupied Housing Units: $35,000 To $49,999"] ?? 0;
      rentersUnder50k = lt20 + to35 + to50;
      total = props["TotalUnits"] ?? 0;
    }
    return total > 0 ? rentersUnder50k / total : null;
  }

  // ── Get total households from properties (for tooltip) ────────────────────
  function getTotalHouseholds(props, periodKey) {
    if (periodKey === "2024") return props["TotalUnits"] ?? null;
    return props["j_wtd_C_Total"] ?? null;
  }

  onMount(async () => {
    const [t14, t19, t24, p14, p19, p24, base_] = await Promise.all([
      fetch(`${base}/data/Clipped_2014_2_wtd.geojson`).then(r => r.json()),
      fetch(`${base}/data/Clipped_2019_2_wtd.geojson`).then(r => r.json()),
      fetch(`${base}/data/Clipped_2024_wtd.geojson`).then(r => r.json()),
      fetch(`${base}/data/TOD_2014_WeightedDemographics.geojson`).then(r => r.json()),
      fetch(`${base}/data/TOD_2019_WeightedDemographics.geojson`).then(r => r.json()),
      fetch(`${base}/data/TOD_2024_WeightedDemographics.geojson`).then(r => r.json()),
      fetch(`${base}/data/MAPC_census_tracts/mapc_census_tracts.geojson`).then(r => r.json()),
    ]);

    tractData = { "2014": t14, "2019": t19, "2024": t24 };
    todData   = { "2014": p14, "2019": p19, "2024": p24 };
    basemap   = base_;

    zoomBehavior = d3
      .zoom()
      .scaleExtent([0.5, 20])
      .on("zoom", (event) => { transform = event.transform; });

    d3.select(svgEl).call(zoomBehavior);
  });

  // ── Current period ────────────────────────────────────────────────────────
  $: periodKey = step?.periodKey ?? "2014";
  $: currentTracts = tractData[periodKey]?.features ?? [];
  $: currentTods   = todData[periodKey]?.features ?? [];

  // ── Projection: fit to 2014 TOD buffers (consistent across all periods) ───
  $: combinedForFit = todData["2014"]
    ? { type: "FeatureCollection", features: todData["2014"].features }
    : null;

  $: projection = combinedForFit
    ? d3.geoIdentity().reflectY(true)
        .fitExtent([[48, 48], [width - 48, height - 48]], combinedForFit)
    : null;

  $: pathGenerator = projection ? d3.geoPath().projection(projection) : null;

  // ── Color scales built across all periods for consistency ────────────────
  $: allTractValues = Object.entries(tractData)
    .flatMap(([pk, gj]) =>
      gj ? gj.features.map(f => getLowIncomeRenterShare(f.properties, pk)) : []
    )
    .filter(v => v !== null && isFinite(v));

  $: choroScale = allTractValues.length
    ? d3.scaleQuantile().domain(allTractValues).range(choroColors)
    : null;

  $: allTodValues = Object.entries(todData)
    .flatMap(([pk, gj]) =>
      gj ? gj.features.map(f => getLowIncomeRenterShare(f.properties, pk)) : []
    )
    .filter(v => v !== null && isFinite(v));

  // TOD buffers use a slightly different (darker) ramp so they read on top of tracts
  const todColors = ["#bfdbfe", "#60a5fa", "#2563eb", "#1d4ed8", "#1e3a8a"];
  $: todScale = allTodValues.length
    ? d3.scaleQuantile().domain(allTodValues).range(todColors)
    : null;

  // ── Legend thresholds ─────────────────────────────────────────────────────
  $: choroThresholds = choroScale ? [0, ...choroScale.quantiles()] : [];
  $: todThresholds   = todScale   ? [0, ...todScale.quantiles()]   : [];

  // ── Auto-zoom on focusProject ─────────────────────────────────────────────
  $: if (projection && step && zoomBehavior && svgEl) {
    const stepKey = `${step.periodKey}-${step.focusProject ?? ""}`;
    if (stepKey !== lastStepKey) {
      lastStepKey = stepKey;
      if (step.focusProject) {
        // Search across all period TOD files for the project name
        const allTodFeatures = Object.values(todData).flatMap(gj => gj?.features ?? []);
        const feat = allTodFeatures.find(f => f.properties.Project === step.focusProject);
        if (feat && pathGenerator) {
          const [[x0, y0], [x1, y1]] = pathGenerator.bounds(feat);
          const cx = (x0 + x1) / 2;
          const cy = (y0 + y1) / 2;
          const scale = step.focusZoom ?? 6;
          const tx = width / 2 - scale * cx;
          const ty = height / 2 - scale * cy;
          d3.select(svgEl).transition().duration(1200).call(
            zoomBehavior.transform,
            d3.zoomIdentity.translate(tx, ty).scale(scale)
          );
        }
      } else {
        d3.select(svgEl).transition().duration(800)
          .call(zoomBehavior.transform, d3.zoomIdentity);
      }
    }
  }

  function centroidScreen(feature) {
    if (!pathGenerator) return [width / 2, height / 2];
    const [cx, cy] = pathGenerator.centroid(feature);
    return [cx * transform.k + transform.x, cy * transform.k + transform.y];
  }
</script>

<div class="map-wrap" bind:clientWidth={width}>
  <svg bind:this={svgEl} {width} {height}>
    <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
      <!-- Layer 0: Boston basemap -->
      {#if pathGenerator && basemap}
        {#each basemap.features as feature}
          <path
            d={pathGenerator(feature)}
            fill="#f0f2f4"
            stroke="#d1d9e0"
            stroke-width={0.6 / transform.k}
          />
        {/each}
      {/if}
      <!-- Layer 1: choropleth census tracts -->
      {#if pathGenerator && choroScale}
        {#each currentTracts as feature}
          {@const val = getLowIncomeRenterShare(feature.properties, periodKey)}
          {@const isHovered = hoveredTract === feature}
          <path
            d={pathGenerator(feature)}
            fill={val !== null ? choroScale(val) : "#9da1a6"}
            stroke={isHovered ? "#334155" : "white"}
            stroke-width={isHovered ? 1.5 / transform.k : 0.4 / transform.k}
            opacity={0.85}
            class="tract"
            on:mouseenter={() => { hoveredTract = feature; hoveredTod = null; }}
            on:mouseleave={() => (hoveredTract = null)}
          />
        {/each}
      {/if}

      <!-- Layer 2: TOD buffer polygons -->
      {#if pathGenerator && choroScale}
        {#each currentTods as feature}
          {@const val = getLowIncomeRenterShare(feature.properties, periodKey)}
          {@const isFocused = step?.focusProject === feature.properties.Project}
          {@const isUnfocused = !!step?.focusProject && !isFocused}
          {@const isHovered = hoveredTod === feature}
          {@const [cx, cy] = pathGenerator.centroid(feature)}
      
        <!-- Buffer outline -->
          <path
            d={pathGenerator(feature)}
            fill="none"
            stroke="#94a3b8"
            stroke-width={3 / transform.k}
            stroke-dasharray={`${4 / transform.k} ${3 / transform.k}`}
            opacity={isUnfocused ? 0.5 : 1}
          />
    <!-- Centroid dot --> 
          <circle
            cx={cx}
            cy={cy}
            r={isFocused ? 12 / transform.k : 8 / transform.k}
            fill={val !== null ? choroScale(val) : "#cbd5e1"}
            stroke={isFocused ? "#000000" : "black"}
            stroke-width={isFocused ? 4 / transform.k : 2.5 / transform.k}
            opacity={isUnfocused ? 1 : 1}
            class="tod-dot"
            on:mouseenter={() => { hoveredTod = feature; hoveredTract = null; }}
            on:mouseleave={() => (hoveredTod = null)}
          >
            <title>{feature.properties.Project}</title>
          </circle>
        {/each}
      {/if}

    </g>
  </svg>

  <!-- TOD buffer tooltip -->
  {#if hoveredTod}
    {@const props = hoveredTod.properties}
    {@const val = getLowIncomeRenterShare(props, periodKey)}
    {@const total = getTotalHouseholds(props, periodKey)}
    {@const [tx, ty] = centroidScreen(hoveredTod)}
    <div class="tooltip" style="left:{Math.min(tx + 16, width - 250)}px; top:{Math.max(ty - 60, 8)}px;">
      <p class="tt-name">{props.Project}</p>
      <p class="tt-period">{periodKey} period</p>
      <div class="tt-grid">
        <span class="tt-label">Low-income renters (&lt;$50k)</span>
        <span class="tt-val">{val !== null ? d3.format(".0%")(val) : "N/A"}</span>
        <span class="tt-label">Total households</span>
        <span class="tt-val">{total !== null ? Math.round(total).toLocaleString() : "N/A"}</span>
        <span class="tt-label">Census tracts</span>
        <span class="tt-val">{props["Tract Count"] ?? "—"}</span>
      </div>
    </div>
  {/if}

  <!-- Tract tooltip (shows when hovering tracts outside TOD buffers) -->
  {#if hoveredTract && !hoveredTod}
    {@const props = hoveredTract.properties}
    {@const val = getLowIncomeRenterShare(props, periodKey)}
    <div class="tooltip tract-tooltip">
      <p class="tt-name">{props.NAMELSAD ?? props.NAME}</p>
      <div class="tt-grid">
        <span class="tt-label">Low-income renters (&lt;$50k)</span>
        <span class="tt-val">{val !== null ? d3.format(".0%")(val) : "N/A"}</span>
      </div>
    </div>
  {/if}

  <!-- Legend -->
  <!-- simplified legend -->
  <div class="legend">
    <p class="legend-title">Low-income renters &lt;$50k</p>
    <div class="legend-swatches">
      {#each choroColors as color}
        <span class="swatch" style="background:{color}"></span>
      {/each}
    </div>
    <div class="legend-ticks">
      {#each choroThresholds as tick}
        <span>{d3.format(".0%")(tick)}</span>
      {/each}
    </div>
    <div class="legend-divider"></div>
    <div class="legend-row">
      <svg width="12" height="12"><circle cx="6" cy="6" r="5" stroke="#000" stroke-width="2" fill="none"/></svg>
      <p class="legend-sub">TOD project (buffer average)</p>
    </div>
    <div class="legend-row">
      <svg width="14" height="14" style="flex-shrink:0">
        <rect x="1" y="1" width="12" height="12" fill="#f0f2f4" stroke="#d1d9e0" stroke-width="1.5" rx="1"/>
      </svg>
      <p class="legend-sub">Census tract (background)</p>
    </div>
  </div>
</div>

<style>
  .map-wrap {
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    background: #a8c8e8;
    box-shadow:
      0 4px 24px rgba(15, 23, 42, 0.10),
      0 1px 4px rgba(15, 23, 42, 0.06);
    cursor: grab;
  }

  .map-wrap:active { cursor: grabbing; }
  .map-wrap svg { display: block; }

  .tract { cursor: default; }
  .tod-dot { cursor: pointer; transition: opacity 0.2s ease; }

  .tooltip {
    position: absolute;
    width: 240px;
    background: rgba(15, 23, 42, 0.93);
    backdrop-filter: blur(8px);
    border-radius: 14px;
    padding: 14px 16px;
    z-index: 10;
    color: white;
    box-shadow: 0 8px 32px rgba(0,0,0,0.24);
    pointer-events: none;
  }

  .tract-tooltip {
    top: 16px;
    right: 16px;
    left: unset;
  }

  .tt-name {
    margin: 0 0 2px;
    font-size: 0.88rem;
    font-weight: 700;
    line-height: 1.25;
  }

  .tt-period {
    margin: 0 0 10px;
    font-size: 0.72rem;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .tt-grid {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 4px 10px;
  }

  .tt-label { font-size: 0.76rem; color: rgba(255,255,255,0.62); }
  .tt-val { font-size: 0.76rem; font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; }

  .legend {
    position: absolute;
    bottom: 16px;
    left: 16px;
    z-index: 5;
    background: rgba(255,255,255,0.93);
    backdrop-filter: blur(6px);
    border-radius: 12px;
    padding: 12px 14px;
    box-shadow: 0 2px 12px rgba(15,23,42,0.10);
    min-width: 190px;
  }

  .legend-title {
    margin: 0 0 8px;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #1e293b;
  }

  .legend-sub-label {
    margin: 0 0 5px;
    font-size: 0.65rem;
    color: #94a3b8;
  }

  .legend-divider {
    border-top: 1px solid #e2e8f0;
    margin: 10px 0;
  }

  .legend-swatches { display: flex; gap: 2px; margin-bottom: 4px; }
  .legend-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }
  .swatch { flex: 1; height: 8px; border-radius: 2px; }

  .legend-ticks {
    display: flex;
    justify-content: space-between;
    font-size: 0.68rem;
    color: #64748b;
    font-variant-numeric: tabular-nums;
    margin-bottom: 4px;
  }
</style>
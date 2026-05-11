<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import { base } from "$app/paths";

  export let step = null;

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
  let bostonBasemap = null;
  let mapcBostonBasemap = null;

  const choroColors = ["#ffefb0", "#fad643", "#f59e0b", "#d97706", "#92400e"];

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
      const lt20 = props["Renter-Occupied Housing Units: Less Than $20,000"] ?? 0;
      const to35 = props["Renter-Occupied Housing Units: $20,000 To $34,999"] ?? 0;
      const to50 = props["Renter-Occupied Housing Units: $35,000 To $49,999"] ?? 0;
      rentersUnder50k = lt20 + to35 + to50;
      total = props["TotalUnits"] ?? 0;
    }
    return total > 0 ? rentersUnder50k / total : null;
  }

  function getCostBurdenShare(props, periodKey) {
    let burdened, totalRenter;
    if (periodKey === "2014") {
      burdened =
        (props["j_wtd_C_Total:Renter-occupied housing units:Less than $20,000:30 percent or more"] ?? 0) +
        (props["j_wtd_C_Total:Renter-occupied housing units:$20,000 to $34,999:30 percent or more"] ?? 0) +
        (props["j_wtd_C_Total:Renter-occupied housing units:$35,000 to $49,999:30 percent or more"] ?? 0) +
        (props["j_wtd_C_Total:Renter-occupied housing units:$50,000 to $74,999:30 percent or more"] ?? 0) +
        (props["j_wtd_C_Total:Renter-occupied housing units:$75,000 or more:30 percent or more"] ?? 0);
      totalRenter = props["j_wtd_C_Total:Renter-occupied housing units"] ?? 0;
    } else if (periodKey === "2019") {
      burdened =
        (props["j_wtd_C_Total: Renter-occupied housing units: Less than $20,000: 30 percent or more"] ?? 0) +
        (props["j_wtd_C_Total: Renter-occupied housing units: $20,000 to $34,999: 30 percent or more"] ?? 0) +
        (props["j_wtd_C_Total: Renter-occupied housing units: $35,000 to $49,999: 30 percent or more"] ?? 0) +
        (props["j_wtd_C_Total: Renter-occupied housing units: $50,000 to $74,999: 30 percent or more"] ?? 0) +
        (props["j_wtd_C_Total: Renter-occupied housing units: $75,000 or more: 30 percent or more"] ?? 0);
      totalRenter = props["j_wtd_C_Total: Renter-occupied housing units:"] ?? 0;
    } else {
      return null;
    }
    return totalRenter > 0 ? burdened / totalRenter : null;
  }

  function getMetricValue(props, periodKey, metricKey) {
    return metricKey === "costBurdenedRenterShare"
      ? getCostBurdenShare(props, periodKey)
      : getLowIncomeRenterShare(props, periodKey);
  }

  function getTotalHouseholds(props, periodKey) {
    if (periodKey === "2024") return props["TotalUnits"] ?? null;
    return props["j_wtd_C_Total"] ?? null;
  }

  onMount(async () => {
    const [t14, t19, t24, p14, p19, p24, base_, bos_, mapcBos_] = await Promise.all([
      fetch(`${base}/data/Clipped_2014_2_wtd.geojson`).then(r => r.json()),
      fetch(`${base}/data/Clipped_2019_2_wtd.geojson`).then(r => r.json()),
      fetch(`${base}/data/Clipped_2024_wtd.geojson`).then(r => r.json()),
      fetch(`${base}/data/TOD_2014_WeightedDemographics.geojson`).then(r => r.json()),
      fetch(`${base}/data/TOD_2019_WeightedDemographics.geojson`).then(r => r.json()),
      fetch(`${base}/data/TOD_2024_WeightedDemographics.geojson`).then(r => r.json()),
      fetch(`${base}/data/MAPC_census_tracts/mapc_census_tracts.geojson`).then(r => r.json()),
      fetch(`${base}/data/bostonn.geojson`).then(r => r.json()),
      fetch(`${base}/data/mapc_boston.geojson`).then(r => r.json()),
    ]);

    tractData = { "2014": t14, "2019": t19, "2024": t24 };
    todData   = { "2014": p14, "2019": p19, "2024": p24 };
    basemap   = base_;
    bostonBasemap = bos_;
    mapcBostonBasemap = mapcBos_;

    zoomBehavior = d3
      .zoom()
      .scaleExtent([0.5, 20])
      .on("zoom", (event) => { transform = event.transform; });

    d3.select(svgEl).call(zoomBehavior);
  });

  $: periodKey = step?.periodKey ?? "2014";
  $: metric    = step?.metric    ?? "lowIncomeRenterShare";
  $: currentTracts = tractData[periodKey]?.features ?? [];
  $: currentTods   = todData[periodKey]?.features ?? [];

  $: combinedForFit = todData["2014"]
    ? { type: "FeatureCollection", features: todData["2014"].features }
    : null;

  $: projection = combinedForFit
    ? d3.geoIdentity().reflectY(true)
        .fitExtent([[48, 48], [width - 48, height - 48]], combinedForFit)
    : null;

  $: pathGenerator = projection ? d3.geoPath().projection(projection) : null;

  $: allTractValues = Object.entries(tractData)
    .flatMap(([pk, gj]) =>
      gj ? gj.features.map(f => getMetricValue(f.properties, pk, metric)) : []
    )
    .filter(v => v !== null && isFinite(v));

  $: choroScale = allTractValues.length
    ? d3.scaleQuantile().domain(allTractValues).range(choroColors)
    : null;

  $: allTodValues = Object.entries(todData)
    .flatMap(([pk, gj]) =>
      gj ? gj.features.map(f => getMetricValue(f.properties, pk, metric)) : []
    )
    .filter(v => v !== null && isFinite(v));

  const todColors = ["#bfdbfe", "#60a5fa", "#2563eb", "#1d4ed8", "#1e3a8a"];
  $: todScale = allTodValues.length
    ? d3.scaleQuantile().domain(allTodValues).range(todColors)
    : null;

  $: choroThresholds = choroScale ? [0, ...choroScale.quantiles()] : [];
  $: todThresholds   = todScale   ? [0, ...todScale.quantiles()]   : [];

  $: if (projection && step && zoomBehavior && svgEl) {
    const stepKey = `${step.periodKey}-${step.focusProject ?? ""}`;
    if (stepKey !== lastStepKey) {
      lastStepKey = stepKey;
      if (step.focusProject) {
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
    <defs>
      <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.2"/>
      </filter>
      <radialGradient id="water-gradient" cx="50%" cy="50%" r="75%">
        <stop offset="0%" stop-color="#cae3f7" />
        <stop offset="100%" stop-color="#9fc5e8" />
      </radialGradient>
    </defs>

    <rect width="100%" height="100%" fill="url(#water-gradient)" />

    <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>

      {#if pathGenerator && basemap}
        {#each basemap.features as feature}
          <path
            d={pathGenerator(feature)}
            fill="#f4f7f9"
            stroke="#cbd5e1"
            stroke-width={0.6 / transform.k}
          />
        {/each}
      {/if}

      {#if pathGenerator && choroScale}
        {#each currentTracts as feature}
          {@const val = getMetricValue(feature.properties, periodKey, metric)}
          {@const isHovered = hoveredTract === feature}
          <path
            d={pathGenerator(feature)}
            fill={val !== null ? choroScale(val) : "#e2e8f0"}
            stroke={isHovered ? "#0f172a" : "rgba(255, 255, 255, 0.4)"}
            stroke-width={isHovered ? 2 / transform.k : 0.4 / transform.k}
            opacity={0.95}
            class="tract"
            on:mouseenter={() => { hoveredTract = feature; hoveredTod = null; }}
            on:mouseleave={() => (hoveredTract = null)}
          />
        {/each}
      {/if}

      {#if pathGenerator && mapcBostonBasemap}
        {#each mapcBostonBasemap.features as feature}
          <path
            d={pathGenerator(feature)}
            fill="none"
            stroke="#64748b"
            stroke-width={1 / transform.k}
            stroke-dasharray={`${4 / transform.k} ${4 / transform.k}`}
            style="pointer-events: none; opacity: 0.6;"
          />
          {@const [cx, cy] = pathGenerator.centroid(feature)}
          {#if cx && cy && feature.properties.municipal}
            <text
              x={cx}
              y={cy}
              text-anchor="middle"
              dominant-baseline="middle"
              font-size={9 / transform.k}
              fill="rgba(15, 23, 42, 0.55)"
              stroke="rgba(255, 255, 255, 0.8)"
              stroke-width={2.5 / transform.k}
              paint-order="stroke"
              stroke-linejoin="round"
              style="pointer-events: none; font-weight: 700; font-family: ui-sans-serif, system-ui, sans-serif; text-transform: uppercase; letter-spacing: 0.08em;"
            >
              {feature.properties.municipal}
            </text>
          {/if}
        {/each}
      {/if}

      {#if pathGenerator && bostonBasemap}
        {#each bostonBasemap.features as feature}
          <path
            d={pathGenerator(feature)}
            fill="none"
            stroke="#94a3b8"
            stroke-width={0.8 / transform.k}
            stroke-dasharray={`${3 / transform.k} ${3 / transform.k}`}
            style="pointer-events: none; opacity: 0.4;"
          />
          {@const [cx, cy] = pathGenerator.centroid(feature)}
          {#if cx && cy && feature.properties.name}
            <text
              x={cx}
              y={cy}
              text-anchor="middle"
              dominant-baseline="middle"
              font-size={7.5 / transform.k}
              fill="rgba(15, 23, 42, 0.45)"
              stroke="rgba(255, 255, 255, 0.7)"
              stroke-width={2 / transform.k}
              paint-order="stroke"
              stroke-linejoin="round"
              style="pointer-events: none; font-weight: 600; font-family: ui-sans-serif, system-ui, sans-serif; text-transform: uppercase; letter-spacing: 0.08em;"
            >
              {feature.properties.name}
            </text>
          {/if}
        {/each}
      {/if}

      {#if pathGenerator && choroScale}
        {#each currentTods as feature}
          {@const val = getMetricValue(feature.properties, periodKey, metric)}
          {@const isFocused = step?.focusProject === feature.properties.Project}
          {@const isUnfocused = !!step?.focusProject && !isFocused}
          {@const isHovered = hoveredTod === feature}
          {@const [cx, cy] = pathGenerator.centroid(feature)}

          <path
            d={pathGenerator(feature)}
            fill="none"
            stroke="#334155"
            stroke-width={1.5 / transform.k}
            stroke-dasharray={`${3 / transform.k} ${3 / transform.k}`}
            opacity={isUnfocused ? 0.15 : 0.4}
          />

          {#if isFocused}
            <circle
              cx={cx}
              cy={cy}
              r={30 / transform.k}
              fill="none"
              stroke="#fbbf24"
              stroke-width={2.5 / transform.k}
            >
              <animate attributeName="r" values="{12/transform.k};{35/transform.k}" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite" />
            </circle>
          {/if}

          <circle
            cx={cx}
            cy={cy}
            r={isFocused ? 14 / transform.k : 8 / transform.k}
            fill={val !== null ? choroScale(val) : "#cbd5e1"}
            stroke={isFocused ? "#000000" : "#ffffff"}
            stroke-width={isFocused ? 2.5 / transform.k : 1.5 / transform.k}
            opacity={isUnfocused ? 0.6 : 1}
            filter="url(#drop-shadow)"
            class="tod-dot"
            on:mouseenter={() => { hoveredTod = feature; hoveredTract = null; }}
            on:mouseleave={() => (hoveredTod = null)}
          />
        {/each}
      {/if}

    </g>
  </svg>

  <div class="map-header">
    <h1>Housing around Transit</h1>
    <p>
      Exploring <strong>{metric === 'costBurdenedRenterShare' ? 'rent cost burdens' : 'lower-income households'}</strong> in the Greater Boston area for {periodKey}.
    </p>
    <div class="header-hint">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="11" y1="8" x2="11" y2="14"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
      </svg>
      Scroll to zoom • Hover for details
    </div>
  </div>

  {#if hoveredTod}
    {@const props = hoveredTod.properties}
    {@const val = getMetricValue(props, periodKey, metric)}
    {@const total = getTotalHouseholds(props, periodKey)}
    {@const [tx, ty] = centroidScreen(hoveredTod)}
    <div class="tooltip" style="left:{Math.min(tx + 20, width - 260)}px; top:{Math.max(ty - 70, 20)}px;">
      <p class="tt-name">{props.Project} Station Area</p>
      <div class="tt-grid">
        <span class="tt-label">{metric === "costBurdenedRenterShare" ? "Renters paying >30% on rent" : "Renters earning under $50k/yr"}</span>
        <span class="tt-val highlight">{val !== null ? d3.format(".0%")(val) : "Data Unavailable"}</span>
        <span class="tt-label">Total households in 0.5-mi area</span>
        <span class="tt-val">{total !== null ? Math.round(total).toLocaleString() : "N/A"}</span>
      </div>
    </div>
  {/if}

  {#if hoveredTract && !hoveredTod}
    {@const props = hoveredTract.properties}
    {@const val = getMetricValue(props, periodKey, metric)}
    <div class="tooltip tract-tooltip">
      <p class="tt-name">{props.NAMELSAD ?? props.NAME}</p>
      <div class="tt-grid">
        <span class="tt-label">{metric === "costBurdenedRenterShare" ? "Renters paying >30% on rent" : "Renters earning under $50k/yr"}</span>
        <span class="tt-val highlight">{val !== null ? d3.format(".0%")(val) : "Data Unavailable"}</span>
      </div>
    </div>
  {/if}

  <div class="legend">
    <div class="legend-section">
      <p class="legend-title">Data Values</p>
      <p class="legend-sub">
        {metric === "costBurdenedRenterShare" ? "Percentage of renters spending >30% of income on rent" : "Percentage of renters earning under $50,000 per year"}
      </p>
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
      <div class="legend-labels">
        <span>Lower Percentage</span>
        <span>Higher Percentage</span>
      </div>
    </div>

    <div class="legend-divider"></div>

    <div class="legend-section">
      <p class="legend-title">Map Guide</p>
      <div class="legend-row">
        <svg width="14" height="14" style="flex-shrink:0; margin-right: 4px;">
          <circle cx="7" cy="7" r="4" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5" filter="url(#drop-shadow)"/>
        </svg>
        <p class="legend-item-text">Station Area (Average)</p>
      </div>
      <div class="legend-row">
        <svg width="14" height="14" style="flex-shrink:0; margin-right: 4px;">
          <circle cx="7" cy="7" r="5" fill="none" stroke="#334155" stroke-width="1.5" stroke-dasharray="2 2"/>
        </svg>
        <p class="legend-item-text">0.5-mile walk distance</p>
      </div>
      <div class="legend-row">
        <svg width="14" height="14" style="flex-shrink:0; margin-right: 4px;">
          <rect x="1" y="3" width="12" height="8" fill="#f0f2f4" stroke="#cbd5e1" stroke-width="1.5" rx="1"/>
        </svg>
        <p class="legend-item-text">Local Area (Census Tract)</p>
      </div>
      <div class="legend-row">
        <svg width="14" height="14" style="flex-shrink:0; margin-right: 4px;">
          <line x1="1" y1="7" x2="13" y2="7" stroke="#64748b" stroke-width="1.5" stroke-dasharray="2 2"/>
        </svg>
        <p class="legend-item-text">City / Neighborhood Border</p>
      </div>
    </div>
  </div>
</div>

<style>
  .map-wrap {
    position: relative;
    border-radius: 24px;
    overflow: hidden;
    background: #cae3f7;
    box-shadow:
      0 10px 30px rgba(15, 23, 42, 0.08),
      0 1px 8px rgba(15, 23, 42, 0.04);
    cursor: grab;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1e293b;
  }

  .map-wrap:active { cursor: grabbing; }
  .map-wrap svg { display: block; }

  .map-header {
    position: absolute;
    top: 16px;
    left: 16px;
    z-index: 5;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    border-radius: 12px;
    padding: 12px 14px;
    max-width: 250px;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.5);
    pointer-events: none;
  }

  .map-header h1 {
    margin: 0 0 4px 0;
    font-size: 0.9rem;
    font-weight: 800;
    line-height: 1.2;
    color: #0f172a;
    letter-spacing: -0.01em;
  }

  .map-header p {
    margin: 0 0 8px 0;
    font-size: 0.7rem;
    color: #475569;
    line-height: 1.4;
  }

  .header-hint {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #f1f5f9;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.65rem;
    font-weight: 600;
    color: #334155;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .tract {
    cursor: default;
    transition: fill 0.2s ease, stroke-width 0.1s ease;
  }
  .tod-dot {
    cursor: pointer;
    transition: opacity 0.2s ease, r 0.2s ease, stroke-width 0.2s ease;
  }
  .tod-dot:hover {
    stroke-width: 3px;
    stroke: #0f172a;
  }

  .tooltip {
    position: absolute;
    width: 240px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(16px);
    border-radius: 12px;
    padding: 14px;
    z-index: 10;
    color: #0f172a;
    box-shadow: 0 10px 40px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(0,0,0,0.05);
    pointer-events: none;
    transition: top 0.1s ease, left 0.1s ease;
  }

  .tract-tooltip {
    top: 20px;
    right: 20px;
    left: unset;
    width: 220px;
  }

  .tt-name {
    margin: 0 0 8px;
    font-size: 0.85rem;
    font-weight: 800;
    line-height: 1.2;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 6px;
  }

  .tt-grid {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 6px 10px;
    align-items: center;
  }

  .tt-label {
    font-size: 0.7rem;
    color: #475569;
    line-height: 1.3;
  }

  .tt-val {
    font-size: 0.8rem;
    font-weight: 700;
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: #0f172a;
  }

  .tt-val.highlight {
    color: #d97706;
    font-size: 0.9rem;
  }

  /* Consolidated Single Legend - Bottom Left Only */
  .legend {
    position: absolute;
    bottom: 16px;
    left: 16px;
    z-index: 5;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    border-radius: 12px;
    padding: 12px 14px;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.5);
    max-width: 230px;
  }

  .legend-section {
    display: flex;
    flex-direction: column;
  }

  .legend-title {
    margin: 0 0 4px;
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #0f172a;
  }

  .legend-sub {
    margin: 0 0 8px;
    font-size: 0.65rem;
    color: #64748b;
    line-height: 1.3;
  }

  .legend-divider {
    border-top: 1px solid #e2e8f0;
    margin: 10px 0;
  }

  .legend-swatches {
    display: flex;
    gap: 2px;
    margin-bottom: 4px;
    border-radius: 4px;
    overflow: hidden;
  }

  .swatch { flex: 1; height: 8px; }

  .legend-ticks {
    display: flex;
    justify-content: space-between;
    font-size: 0.6rem;
    color: #475569;
    font-variant-numeric: tabular-nums;
    margin-bottom: 2px;
    font-weight: 600;
  }

  .legend-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.6rem;
    color: #94a3b8;
  }

  .legend-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }
  .legend-row:last-child { margin-bottom: 0; }

  .legend-item-text {
    margin: 0;
    font-size: 0.7rem;
    color: #334155;
    font-weight: 500;
  }
</style>

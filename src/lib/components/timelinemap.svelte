<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import { base } from "$app/paths";
  import narrativestory from "./narrativestory.svelte";

  export let timelineRows = [];
  export let step = null;

  const metricMeta = {
    lowIncomeRenterShare: {
      label: "Low-income renters",
      colors: ["#fffbeb", "#fde68a", "#f59e0b", "#b45309", "#7c2d12"],
      symbol: d3.symbolCircle,
      symbolLabel: "●  circle",
    },
    renterShare: {
      label: "Renter households",
      colors: ["#eff6ff", "#bfdbfe", "#3b82f6", "#1d4ed8", "#1e3a8a"],
      symbol: d3.symbolSquare,
      symbolLabel: "■  square",
    },
    lowIncomeHouseholdShare: {
      label: "Low-income households",
      colors: ["#f0fdf4", "#86efac", "#22c55e", "#15803d", "#14532d"],
      symbol: d3.symbolDiamond,
      symbolLabel: "◆  diamond",
    },
    costBurdenedRenterShare: {
      label: "Cost-burdened renters",
      colors: ["#fff1f2", "#fecdd3", "#f43f5e", "#be123c", "#881337"],
      symbol: d3.symbolTriangle,
      symbolLabel: "▲  triangle",
    },
  };

  let geojson = null;
  let neighborhoods = [];
  let svgEl;
  let width = 600;
  let height = 560;
  let transform = d3.zoomIdentity;
  let zoomBehavior;
  let hoveredProject = null;
  let lastStepKey = "";

  onMount(async () => {
    const [geoRes, nhoodRes] = await Promise.all([
      fetch(`${base}/data/TODLocations_4.4.26.geojson`),
      fetch(`${base}/data/MAPC_census_tracts/mapc_census_tracts.geojson`),
    ]);
    geojson = await geoRes.json();
    const nhoodData = await nhoodRes.json();
    neighborhoods = nhoodData.features;

    zoomBehavior = d3
      .zoom()
      .scaleExtent([0.5, 20])
      .on("zoom", (event) => {
        transform = event.transform;
      });

    d3.select(svgEl).call(zoomBehavior);
  });

  $: periodRows = step
    ? timelineRows.filter((d) => d.periodKey === step.periodKey)
    : [];

  $: metricKey = step?.metric ?? "lowIncomeRenterShare";
  $: meta = metricMeta[metricKey] ?? metricMeta.lowIncomeRenterShare;

  $: allMetricValues = timelineRows
    .map((d) => d[metricKey])
    .filter((v) => v !== null && v !== undefined && Number.isFinite(v));

  $: colorScale = d3
    .scaleQuantile()
    .domain(allMetricValues)
    .range(meta.colors);

  $: areaScale = d3
    .scaleSqrt()
    .domain([0, d3.max(timelineRows, (d) => d.occupiedTotal) || 1])
    .range([150, 2100]);

  $: symbolGenerator = d3.symbol().type(meta.symbol);


  $: projection = geojson
    ? d3
        .geoIdentity()
        .reflectY(true)
        .fitExtent([[48, 48], [width - 48, height - 48]], geojson)
    : null;

  $: pathGenerator = projection ? d3.geoPath().projection(projection) : null;

  $: if (projection && step && zoomBehavior && svgEl) {
    const stepKey = `${step.periodKey}-${step.metric}-${step.focusProject ?? ""}`;
    if (stepKey !== lastStepKey) {
      lastStepKey = stepKey;
      if (step.focusProject && geojson) {
        const feat = geojson.features.find(
          (f) => f.properties.j_Project === step.focusProject
        );
        if (feat) {
          const [px, py] = projection(feat.geometry.coordinates);
          const scale = 6;
          const tx = width / 2 - scale * px;
          const ty = height / 2 - scale * py;
          d3.select(svgEl)
            .transition()
            .duration(1200)
            .call(
              zoomBehavior.transform,
              d3.zoomIdentity.translate(tx, ty).scale(scale)
            );
        }
      } else {
        d3.select(svgEl)
          .transition()
          .duration(800)
          .call(zoomBehavior.transform, d3.zoomIdentity);
      }
    }
  }

  $: legendThresholds = allMetricValues.length
    ? [0, ...colorScale.quantiles()]
    : [0, 0.25, 0.5, 0.75, 1];

  function screenCoords(geometry) {
    if (!projection) return [0, 0];
    const [x, y] = projection(geometry.coordinates);
    return [x * transform.k + transform.x, y * transform.k + transform.y];
  }
</script>

<div class="map-wrap" bind:clientWidth={width}>
  <svg bind:this={svgEl} {width} {height}>
    <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>

      <!-- Basemap census tracts -->
      {#each neighborhoods as feature}
        {#if pathGenerator}
          <path
            d={pathGenerator(feature)}
            fill="#f7f8fa"
            stroke="#cfd8df"
            stroke-width={0.6 / transform.k}
          />
        {/if}
      {/each}

      {#each periodRows as row}
        {#if projection}
          {@const [x, y] = projection(row.geometry.coordinates)}
          {@const val = row[metricKey]}
          {@const hasData = val !== null && val !== undefined && Number.isFinite(val)}
          {@const isFocused = step?.focusProject === row.project}
          {@const isUnfocused = !!step?.focusProject && !isFocused}
          {@const pathD = symbolGenerator.size(areaScale(row.occupiedTotal))()}
          <path
            transform="translate({x},{y}) scale({1 / transform.k})"
            d={pathD}
            fill={hasData ? colorScale(val) : "#cbd5e1"}
            stroke={isFocused ? "#0f172a" : "white"}
            stroke-width={isFocused ? 3 : 1.5}
            opacity={isUnfocused ? 0.25 : 0.92}
            class="tod-dot"
            role="img"
            on:mouseenter={() => (hoveredProject = row)}
            on:mouseleave={() => (hoveredProject = null)}
          >
            <title>{row.project}</title>
          </path>
        {/if}
      {/each}
    </g>
  </svg>

  {#if hoveredProject}
    {@const [tx, ty] = screenCoords(hoveredProject.geometry)}
    {@const hv = hoveredProject}
    <div class="tooltip" style="left:{tx + 16}px; top:{ty - 18}px;">
      <p class="tt-name">{hv.project.split("-")[0].split(",")[0].trim()}</p>
      <p class="tt-period">{hv.period}</p>
      <div class="tt-grid">
        <span class="tt-label">Low-income renters</span>
        <span class="tt-val">{d3.format(".0%")(hv.lowIncomeRenterShare)}</span>

        <span class="tt-label">All renters</span>
        <span class="tt-val">{d3.format(".0%")(hv.renterShare)}</span>

        <span class="tt-label">Low-income households</span>
        <span class="tt-val">{d3.format(".0%")(hv.lowIncomeHouseholdShare)}</span>

        {#if hv.costBurdenedRenterShare !== null}
          <span class="tt-label">Cost-burdened renters</span>
          <span class="tt-val">{d3.format(".0%")(hv.costBurdenedRenterShare)}</span>
        {/if}

        <span class="tt-label">Nearby households</span>
        <span class="tt-val">{Math.round(hv.occupiedTotal).toLocaleString()}</span>
      </div>
    </div>
  {/if}

  <div class="legend">
    <div class="legend-header">
      <svg class="legend-shape" viewBox="-14 -14 28 28" width="22" height="22">
        <path d={symbolGenerator.size(260)()} fill="#64748b" />
      </svg>
      <p class="legend-label">{meta.label}</p>
    </div>
    <div class="legend-swatches">
      {#each meta.colors as color}
        <span class="swatch" style="background:{color}"></span>
      {/each}
    </div>
    <div class="legend-ticks">
      {#each legendThresholds as tick}
        <span>{d3.format(".0%")(tick)}</span>
      {/each}
    </div>
    <p class="legend-sub">Size = nearby households</p>
  </div>
</div>

<style>
  .map-wrap {
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    background: #d9edf8;
    box-shadow:
      0 4px 24px rgba(15, 23, 42, 0.10),
      0 1px 4px rgba(15, 23, 42, 0.06);
    cursor: grab;
  }

  .map-wrap:active {
    cursor: grabbing;
  }

  .map-wrap svg {
    display: block;
  }

  .tod-dot {
    cursor: pointer;
    transition: opacity 0.3s ease;
  }

  .tooltip {
    position: absolute;
    width: 230px;
    background: rgba(15, 23, 42, 0.93);
    backdrop-filter: blur(8px);
    border-radius: 14px;
    padding: 14px 16px;
    z-index: 10;
    color: white;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
    pointer-events: none;
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
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .tt-grid {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 4px 10px;
  }

  .tt-label {
    font-size: 0.76rem;
    color: rgba(255, 255, 255, 0.62);
  }

  .tt-val {
    font-size: 0.76rem;
    font-weight: 700;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .legend {
    position: absolute;
    bottom: 16px;
    left: 16px;
    z-index: 5;
    background: rgba(255, 255, 255, 0.93);
    backdrop-filter: blur(6px);
    border-radius: 12px;
    padding: 10px 14px;
    box-shadow: 0 2px 12px rgba(15, 23, 42, 0.10);
    min-width: 180px;
  }

  .legend-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }

  .legend-shape {
    flex-shrink: 0;
    overflow: visible;
  }

  .legend-label {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #1e293b;
  }

  .legend-swatches {
    display: flex;
    gap: 2px;
    margin-bottom: 4px;
  }

  .swatch {
    flex: 1;
    height: 8px;
    border-radius: 2px;
  }

  .legend-ticks {
    display: flex;
    justify-content: space-between;
    font-size: 0.68rem;
    color: #64748b;
    font-variant-numeric: tabular-nums;
    margin-bottom: 4px;
  }

  .legend-sub {
    margin: 0;
    font-size: 0.66rem;
    color: #94a3b8;
    font-style: italic;
  }
</style>

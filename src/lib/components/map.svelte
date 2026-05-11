<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";
  import { base } from "$app/paths";

  export let data = [];
  export let selectedId = null;
  export let onSelect = (d) => {};
  export let showLowIncomeChoropleth = false;
  export let showCostBurdenChoropleth = false;

  let geojson = null;
  let neighborhoods = [];
  let projects = [];
  let transitLines = [];
  let bufferGeoFeatures = [];
  let bostonGeojson = null;
  let mapcBostonGeojson = null;

  let width = 900;
  let height = 480;
  let hoveredProject = null;
  let svgElement;
  let transform = d3.zoomIdentity;
  let zoomBehavior;
  let homeTransform = d3.zoomIdentity;

  onMount(async () => {
    const [geoRes, nhoodRes, transitRes, bufferRes, bostonRes, mapcBostonRes] = await Promise.all([
      fetch(`${base}/data/TODLocations_4.4.26.geojson`),
      fetch(`${base}/data/MAPC_census_tracts/mapc_census_tracts.geojson`),
      fetch(`${base}/data/mbta_transit_lines.geojson`),
      fetch(`${base}/data/TOD_2024_WeightedDemographics.geojson`),
      fetch(`${base}/data/bostonn.geojson`),
      fetch(`${base}/data/mapc_boston.geojson`)
    ]);

    geojson = await geoRes.json();
    const nhoodData = await nhoodRes.json();
    neighborhoods = nhoodData.features;
    const transitData = await transitRes.json();
    transitLines = transitData.features;
    const bufferData = await bufferRes.json();
    bufferGeoFeatures = bufferData.features;
    bostonGeojson = await bostonRes.json();
    mapcBostonGeojson = await mapcBostonRes.json();

    zoomBehavior = d3.zoom()
      .scaleExtent([1, 10])
      .on("zoom", (event) => {
        transform = event.transform;
      });

    homeTransform = d3.zoomIdentity;
    transform = homeTransform;

    d3.select(svgElement).call(zoomBehavior);
    d3.select(svgElement).call(zoomBehavior.transform, homeTransform);
  });

  $: if (geojson && data.length) {
    projects = geojson.features
      .map(feature => {
        const match = data.find(d => d.project === feature.properties.j_Project);
        return match ? { ...match, geometry: feature.geometry } : null;
      })
      .filter(Boolean);
  } else {
    projects = [];
  }

  $: projectFeatures = projects.map(p => ({
    type: "Feature",
    geometry: p.geometry
  }));

  $: projection = projectFeatures.length
    ? d3.geoIdentity()
        .reflectY(true)
        .fitExtent([[50, 50], [width - 50, height - 50]], {
          type: "FeatureCollection",
          features: projectFeatures
        })
    : null;

  $: pathGenerator = projection ? d3.geoPath().projection(projection) : null;

  $: bufferRadius = projection ? 2640 * projection.scale() : 0;

  $: colorScale = d3.scaleLinear()
      .domain([-0.5, 0, 0.5])
      .range(["#d80073", "#f5f4ef", "#2f7f5f"])
      .clamp(true);

  $: bufferProjects = bufferGeoFeatures
    .map(feature => {
      const match = data.find(d => d.project === feature.properties.Project);
      return match ? { ...match, geometry: feature.geometry } : null;
    })
    .filter(Boolean);

  const lowIncomeScale = d3.scaleSequential()
    .domain([0.2, 0.65])
    .interpolator(d3.interpolateBlues)
    .clamp(true);

  const costBurdenScale = d3.scaleSequential()
    .domain([0.35, 0.65])
    .interpolator(d3.interpolateOrRd)
    .clamp(true);

  function getProjectedCoords(geometry) {
    if (!projection) return [0, 0];
    const [x, y] = projection(geometry.coordinates);
    return [x * transform.k + transform.x, y * transform.k + transform.y];
  }

  function resetZoom() {
    if (!zoomBehavior || !svgElement) return;
    d3.select(svgElement)
      .transition()
      .duration(500)
      .call(zoomBehavior.transform, homeTransform);
  }
</script>

<div class="map-wrapper">
  <div class="header">
    <div>
      <p class="eyebrow">Map view</p>
    </div>
    <button class="reset" on:click={resetZoom}>Reset view</button>
  </div>

  <div class="map-container" bind:clientWidth={width}>
    <svg bind:this={svgElement} {width} {height}>
      <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
        <g class="basemap">
          {#each neighborhoods as feature}
            {#if pathGenerator}
              <path
                d={pathGenerator(feature)}
                fill="#f7f8fa"
                stroke="#e2e8f0"
                stroke-width={0.4 / transform.k}
                style="vector-effect: non-scaling-stroke;"
              />
            {/if}
          {/each}
        </g>

        {#if showLowIncomeChoropleth}
          <g class="choropleth-low-income">
            {#each bufferProjects as bp}
              {#if pathGenerator}
                <path
                  d={pathGenerator({ type: "Feature", geometry: bp.geometry })}
                  fill={lowIncomeScale(bp.lowerIncomeDemandShare)}
                  opacity="0.8"
                  stroke="none"
                  style="pointer-events:none;"
                />
              {/if}
            {/each}
          </g>
        {/if}

        {#if showCostBurdenChoropleth}
          <g class="choropleth-cost-burden">
            {#each bufferProjects as bp}
              {#if pathGenerator}
                <path
                  d={pathGenerator({ type: "Feature", geometry: bp.geometry })}
                  fill={costBurdenScale(bp.costBurdenShare)}
                  opacity="0.8"
                  stroke="none"
                  style="pointer-events:none;"
                />
              {/if}
            {/each}
          </g>
        {/if}

        {#if pathGenerator && mapcBostonGeojson}
          <g class="mapc-boston-boundaries">
            {#each mapcBostonGeojson.features as feature}
              <path
                d={pathGenerator(feature)}
                fill="none"
                stroke="#94a3b8"
                stroke-width={0.6 / transform.k}
                style="pointer-events: none; opacity: 0.3;"
              />
              {@const [cx, cy] = pathGenerator.centroid(feature)}
              {#if cx && cy && feature.properties.municipal}
                <text
                  x={cx}
                  y={cy}
                  text-anchor="middle"
                  dominant-baseline="middle"
                  font-size={8.5 / transform.k}
                  fill="rgba(30, 41, 59, 0.25)"
                  stroke="rgba(255, 255, 255, 0.5)"
                  stroke-width={1.5 / transform.k}
                  paint-order="stroke"
                  stroke-linejoin="round"
                  style="pointer-events: none; font-weight: 700; font-family: ui-sans-serif, system-ui, sans-serif; text-transform: uppercase; letter-spacing: 0.1em;"
                >
                  {feature.properties.municipal}
                </text>
              {/if}
            {/each}
          </g>
        {/if}

        {#if pathGenerator && bostonGeojson}
          <g class="boston-neighborhoods">
            {#each bostonGeojson.features as feature}
              <path
                d={pathGenerator(feature)}
                fill="none"
                stroke="#cbd5e1"
                stroke-width={0.5 / transform.k}
                style="pointer-events: none; opacity: 0.3;"
              />
              {@const [cx, cy] = pathGenerator.centroid(feature)}
              {#if cx && cy && feature.properties.name}
                <text
                  x={cx}
                  y={cy}
                  text-anchor="middle"
                  dominant-baseline="middle"
                  font-size={7 / transform.k}
                  fill="rgba(30, 41, 59, 0.25)"
                  stroke="rgba(255, 255, 255, 0.5)"
                  stroke-width={1.5 / transform.k}
                  paint-order="stroke"
                  stroke-linejoin="round"
                  style="pointer-events: none; font-weight: 600; font-family: ui-sans-serif, system-ui, sans-serif; text-transform: uppercase; letter-spacing: 0.1em;"
                >
                  {feature.properties.name}
                </text>
              {/if}
            {/each}
          </g>
        {/if}

        <g class="transit-lines">
          {#each transitLines as line}
            {#if pathGenerator}
              <path
                d={pathGenerator(line)}
                fill="none"
                stroke="#1e40af"
                stroke-width={1.5 / transform.k}
                stroke-linecap="round"
                stroke-linejoin="round"
                opacity="0.4"
                style="pointer-events:none;"
              />
            {/if}
          {/each}
        </g>

        {#each projects as project}
          {#if projection}
            {@const [x, y] = projection(project.geometry.coordinates)}
            {@const isSelected = selectedId === project.id}
            {@const isHovered = hoveredProject?.id === project.id}

            <circle
              cx={x}
              cy={y}
              r={bufferRadius}
              fill="rgba(31, 41, 55, 0.04)"
              stroke="#64748b"
              stroke-dasharray={`${4 / transform.k} ${4 / transform.k}`}
              stroke-width={(isSelected ? 1.5 : 1) / transform.k}
              opacity={isSelected || isHovered ? 1 : 0}
              style="pointer-events:none; transition: opacity 0.2s ease;"
            />

            <circle
              cx={x}
              cy={y}
              r={(isSelected ? 16 : isHovered ? 12 : 8.5) / transform.k}
              fill={colorScale(project.mismatchScore)}
              stroke={isSelected ? "#111827" : "white"}
              stroke-width={(isSelected ? 3 : 2) / transform.k}
              class="project-node"
              on:mouseenter={() => hoveredProject = project}
              on:mouseleave={() => hoveredProject = null}
              on:click={() => onSelect(project)}
            />

            {#if isSelected || isHovered}
              <text
                x={x + 15 / transform.k}
                y={y - 5 / transform.k}
                font-size={isSelected ? 12 / transform.k : 10 / transform.k}
                font-weight="700"
                fill="#0f172a"
                style="paint-order: stroke fill; stroke: rgba(255,255,255,0.95); stroke-width: {3.5 / transform.k}; stroke-linejoin: round; pointer-events: none;"
              >
                {project.project}
              </text>
            {/if}
          {/if}
        {/each}
      </g>
    </svg>

    <div class="legend-overlay">
      <div class="legend-gradient-bar"></div>
      <div class="legend-bar-labels">
        <span>Less opportunity</span>
        <span>Meeting needs</span>
        <span>More opportunity</span>
      </div>

      {#if showLowIncomeChoropleth}
        <div class="choropleth-legend-entry">
          <p class="choropleth-legend-label">Low-income demand (buffer)</p>
          <div class="choropleth-gradient-bar" style="background: linear-gradient(to right, #deebf7, #08519c);"></div>
          <div class="choropleth-bar-ends">
            <span>20%</span>
            <span>65%+</span>
          </div>
        </div>
      {/if}

      {#if showCostBurdenChoropleth}
        <div class="choropleth-legend-entry">
          <p class="choropleth-legend-label">Cost-burdened rate (buffer)</p>
          <div class="choropleth-gradient-bar" style="background: linear-gradient(to right, #fee5d9, #a50f15);"></div>
          <div class="choropleth-bar-ends">
            <span>35%</span>
            <span>65%+</span>
          </div>
        </div>
      {/if}

      <div class="legend-symbols">
        <div class="sym-item">
          <span class="sym dot-sym"></span>
          <span>Station Area</span>
        </div>
        <div class="sym-item">
          <span class="sym dashed-sym"></span>
          <span>0.5 mi buffer (Hover)</span>
        </div>
        <div class="sym-item">
          <span class="sym transit-sym"></span>
          <span>MBTA lines</span>
        </div>
        <div class="sym-item">
          <span class="sym boundary-sym"></span>
          <span>City / Neighborhood</span>
        </div>
      </div>
    </div>

    {#if hoveredProject}
      {@const [tx, ty] = getProjectedCoords(hoveredProject.geometry)}
      {@const tooltipX = tx + 280 > width ? tx - 275 : tx + 15}
      {@const tooltipY = ty + 190 > height ? ty - 180 : Math.max(12, ty - 18)}
      <div class="tooltip" style={`left:${tooltipX}px; top:${tooltipY}px;`}>
        <p class="tooltip-title">{hoveredProject.project}</p>
        <p class="tooltip-address">{hoveredProject.address}</p>

        <div class="stats">
          <div class="stat-row">
            <span>Affordable share</span>
            <strong>{(hoveredProject.affordableShare * 100).toFixed(0)}%</strong>
          </div>
          <div class="stat-row">
            <span>Nearby lower-income demand</span>
            <strong>{(hoveredProject.lowerIncomeDemandShare * 100).toFixed(0)}%</strong>
          </div>
          <div class="stat-row">
            <span>Total units</span>
            <strong>{hoveredProject.totalUnits}</strong>
          </div>
        </div>

        <div class="mismatch-flag" style={`background:${colorScale(hoveredProject.mismatchScore)}22`}>
          <strong>Gap: {(hoveredProject.mismatchScore * 100).toFixed(1)} percentage points</strong>
          <p>{hoveredProject.mismatchScore < 0 ? "Affordable share falls short of nearby lower-income demand." : "Affordable share is above nearby lower-income demand share."}</p>
        </div>
      </div>
    {/if}
  </div>
</div>

{#if data.length}
  {@const worst = [...data].sort((a, b) => a.mismatchScore - b.mismatchScore)[0]}
  <footer class="insight-bar">
    <div class="insight-icon">💡</div>
    <div class="insight-content">
      <span class="insight-label">Current Takeaway</span>
      <p>
        In the current filtered view, the largest affordability gap appears at <strong>{worst.project}</strong>,
        where the project’s affordable unit share falls below nearby demand by
        <strong>{(Math.abs(worst.mismatchScore) * 100).toFixed(1)}</strong> percentage points.
      </p>
    </div>
  </footer>
{/if}

<style>
  .map-wrapper {
    padding: 18px;
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 12px;
    flex-shrink: 0;
  }

  .eyebrow {
    margin: 0 0 6px 0;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    font-weight: 700;
  }

  .reset {
    border: 1px solid #d0d7de;
    background: white;
    border-radius: 10px;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
  }

  .map-container {
    position: relative;
    background: #d9edf8;
    border: 1px solid #d9e0e7;
    border-radius: 14px;
    overflow: hidden;
    cursor: grab;
    flex-grow: 1;
    min-height: 350px;
  }

  .map-container:active {
    cursor: grabbing;
  }

  .tooltip {
    position: absolute;
    width: 260px;
    box-sizing: border-box;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    border: 1px solid #cfd8df;
    border-radius: 12px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
    padding: 14px;
    pointer-events: none;
    z-index: 10;
  }

  .tooltip-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 800;
    color: #0f172a;
  }

  .tooltip-address {
    margin: 4px 0 10px 0;
    color: #64748b;
    font-size: 0.8rem;
  }

  .stats {
    display: grid;
    gap: 6px;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 0.8rem;
    color: #334155;
  }

  .stat-row strong {
    color: #0f172a;
  }

  .mismatch-flag {
    margin-top: 10px;
    padding: 10px;
    border-radius: 8px;
    font-size: 0.78rem;
    color: #1e293b;
  }

  .mismatch-flag p {
    margin: 4px 0 0 0;
    line-height: 1.3;
  }

  .legend-overlay {
    position: absolute;
    bottom: 12px;
    left: 12px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    border: 1px solid #d1d5db;
    border-radius: 10px;
    padding: 10px 14px;
    width: 200px;
    z-index: 5;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(15,23,42,0.05);
  }

  .legend-gradient-bar {
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(to right, #d80073, #f5f4ef, #2f7f5f);
  }

  .legend-bar-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.65rem;
    color: #475569;
    margin-top: 4px;
    margin-bottom: 8px;
    line-height: 1.3;
    font-weight: 500;
  }

  .choropleth-legend-entry {
    margin-top: 8px;
    padding-top: 7px;
    border-top: 1px solid #e5e7eb;
  }

  .choropleth-legend-label {
    margin: 0 0 4px;
    font-size: 0.65rem;
    font-weight: 700;
    color: #374151;
  }

  .choropleth-gradient-bar {
    height: 8px;
    border-radius: 4px;
  }

  .choropleth-bar-ends {
    display: flex;
    justify-content: space-between;
    font-size: 0.6rem;
    color: #6b7280;
    margin-top: 2px;
    margin-bottom: 4px;
  }

  .legend-symbols {
    display: flex;
    flex-direction: column;
    gap: 6px;
    border-top: 1px solid #e5e7eb;
    padding-top: 8px;
  }

  .sym-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.7rem;
    color: #475569;
    font-weight: 500;
  }

  .sym {
    display: inline-block;
    flex-shrink: 0;
  }

  .dashed-sym {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 1.5px dashed #64748b;
  }

  .dot-sym {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #f5f4ef;
    border: 1.5px solid #6b7280;
  }

  .boundary-sym {
    width: 16px;
    height: 0;
    border-top: 1.5px solid #94a3b8;
  }

  .transit-sym {
    width: 16px;
    height: 0;
    border-top: 2.5px solid #1e40af;
    border-radius: 1px;
    opacity: 0.6;
  }

  .project-node {
    cursor: pointer;
    transition: opacity 0.15s ease, r 0.2s ease, stroke-width 0.2s ease;
  }

  .insight-bar {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-top: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #475569;
    padding: 10px 14px;
    border-radius: 10px;
    width: fit-content;
    max-width: 100%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .insight-icon {
    font-size: 14px;
    background: #fef3c7;
    padding: 6px;
    border-radius: 6px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .insight-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .insight-label {
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
  }

  .insight-bar p {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: #334155;
  }

  .insight-bar strong {
    color: #0f172a;
    font-weight: 700;
  }

  @media (max-width: 900px) {
    .legend-overlay {
      width: 160px;
    }
  }
</style>

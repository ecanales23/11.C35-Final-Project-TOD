<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";
  import { base } from "$app/paths";

  export let data = [];
  export let selectedId = null;
  export let onSelect = (d) => {};

  let geojson = null;
  let neighborhoods = [];
  let projects = [];
  let transitLines = [];

  let width = 900;
  let height = 480;
  let hoveredProject = null;
  let svgElement;
  let transform = d3.zoomIdentity;
  let zoomBehavior;
  let homeTransform = d3.zoomIdentity;

  onMount(async () => {
    const [geoRes, nhoodRes, transitRes] = await Promise.all([
      fetch(`${base}/data/TODLocations_4.4.26.geojson`),
      fetch(`${base}/data/MAPC_census_tracts/mapc_census_tracts.geojson`),
      fetch(`${base}/data/mbta_transit_lines.geojson`)
    ]);

    geojson = await geoRes.json();
    const nhoodData = await nhoodRes.json();
    neighborhoods = nhoodData.features;
    const transitData = await transitRes.json();
    transitLines = transitData.features;

    zoomBehavior = d3.zoom()
      .scaleExtent([0.7, 18])
      .on("zoom", (event) => {
        transform = event.transform;
      });

    // 3.3× zoom, shifted up and slightly left to center on the project cluster
    const k = 3.3;
    homeTransform = d3.zoomIdentity
      .translate(width * (1 - k) / 2 - 45, height * (1 - k) / 2 - 80)
      .scale(k);

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

  $: featureCollection =
    projects.length || neighborhoods.length
      ? {
          type: "FeatureCollection",
          features: [
            ...neighborhoods,
            ...projects.map(p => ({ type: "Feature", geometry: p.geometry }))
          ]
        }
      : null;

  $: projection =
    featureCollection
      ? d3.geoIdentity().reflectY(true).fitSize([width, height], featureCollection)
      : null;

  $: pathGenerator = projection ? d3.geoPath().projection(projection) : null;

  $: colorScale = d3.scaleLinear()
      .domain([-0.5, 0, 0.5])
      .range(["#d80073", "#f5f4ef", "#2f7f5f"])
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
                stroke="#cfd8df"
                stroke-width={0.6 / transform.k}
                style="vector-effect: non-scaling-stroke;"
              />
            {/if}
          {/each}
        </g>

        <g class="transit-lines">
          {#each transitLines as line}
            {#if pathGenerator}
              <path
                d={pathGenerator(line)}
                fill="none"
                stroke={line.properties.color}
                stroke-width={3 / transform.k}
                stroke-linecap="round"
                stroke-linejoin="round"
                opacity="0.7"
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
              r={32 / transform.k}
              fill="rgba(31, 41, 55, 0.04)"
              stroke={isSelected ? "#111827" : "#c6ced6"}
              stroke-dasharray="4 4"
              stroke-width={1 / transform.k}
              style="pointer-events:none;"
            />

            <circle
              cx={x}
              cy={y}
              r={(isSelected ? 13 : isHovered ? 10 : 7) / transform.k}
              fill={colorScale(project.mismatchScore)}
              stroke={isSelected ? "#111827" : "white"}
              stroke-width={(isSelected ? 2.4 : 1.5) / transform.k}
              class="project-node"
              on:mouseenter={() => hoveredProject = project}
              on:mouseleave={() => hoveredProject = null}
              on:click={() => onSelect(project)}
            />

            <text
              x={x + 10 / transform.k}
              y={y - 4 / transform.k}
              font-size={isSelected ? 11 / transform.k : 9 / transform.k}
              font-weight={isSelected ? "700" : "500"}
              fill={isSelected ? "#1a0f00" : "#374151"}
              opacity={isSelected ? 1 : 0.8}
              style="paint-order: stroke fill; stroke: white; stroke-width: {3 / transform.k}; stroke-linejoin: round; pointer-events: none;"
            >
              {project.project}
            </text>
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
      <div class="legend-symbols">
        <div class="sym-item">
          <span class="sym dashed-sym"></span>
          <span>0.5 mi buffer</span>
        </div>
        <div class="sym-item">
          <span class="sym dot-sym"></span>
          <span>TOD project (click to select)</span>
        </div>
        <div class="sym-item">
          <span class="transit-multi-sym">
            <span style="background:#DA291C;"></span>
            <span style="background:#ED8B00;"></span>
            <span style="background:#00843D;"></span>
            <span style="background:#7C878E;"></span>
          </span>
          <span>MBTA lines</span>
        </div>
      </div>
    </div>

    {#if hoveredProject}
      {@const [tx, ty] = getProjectedCoords(hoveredProject.geometry)}
      <div class="tooltip" style={`left:${tx + 16}px; top:${ty - 18}px;`}>
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
    background: white;
    border: 1px solid #cfd8df;
    border-radius: 12px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
    padding: 12px;
    pointer-events: none;
    z-index: 10;
  }

  .tooltip-title {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 700;
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
  }

  .mismatch-flag {
    margin-top: 10px;
    padding: 8px;
    border-radius: 8px;
    font-size: 0.78rem;
  }

  .mismatch-flag p {
    margin: 4px 0 0 0;
  }

  .legend-overlay {
    position: absolute;
    bottom: 12px;
    left: 12px;
    background: rgba(255, 255, 255, 0.93);
    border: 1px solid #d1d5db;
    border-radius: 10px;
    padding: 10px 12px;
    width: 200px;
    z-index: 5;
    pointer-events: none;
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
  }

  .legend-symbols {
    display: flex;
    flex-direction: column;
    gap: 5px;
    border-top: 1px solid #e5e7eb;
    padding-top: 7px;
  }

  .sym-item {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 0.67rem;
    color: #475569;
  }

  .sym {
    display: inline-block;
    flex-shrink: 0;
  }

  .dashed-sym {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 1.5px dashed #6b7280;
    background: rgba(31, 41, 55, 0.04);
  }

  .dot-sym {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #f5f4ef;
    border: 1.5px solid #6b7280;
  }

  .transit-multi-sym {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
    margin-top: 5px;
  }

  .transit-multi-sym span {
    width: 7px;
    height: 4px;
    border-radius: 1px;
    display: block;
  }

  .project-node {
    cursor: pointer;
    transition: opacity 0.15s ease;
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

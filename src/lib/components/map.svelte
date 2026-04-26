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

  let width = 900;
  let height = 480;
  let hoveredProject = null;
  let svgElement;
  let transform = d3.zoomIdentity;
  let zoomBehavior;

  onMount(async () => {
    const [geoRes, nhoodRes] = await Promise.all([
      fetch(`${base}/data/TODLocations_4.4.26.geojson`),
      fetch(`${base}/data/MAPC_census_tracts/mapc_census_tracts.geojson`)
    ]);

    geojson = await geoRes.json();
    const nhoodData = await nhoodRes.json();
    neighborhoods = nhoodData.features;

    zoomBehavior = d3.zoom()
      .scaleExtent([0.7, 18])
      .on("zoom", (event) => {
        transform = event.transform;
      });

    d3.select(svgElement).call(zoomBehavior);
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
      .call(zoomBehavior.transform, d3.zoomIdentity);
  }
</script>

<div class="map-wrapper">
  <section class="intro">
    <div class="intro-inner">
      <details class="info-box yellow">
        <summary>
          <div class="summary-content">
            <p class="eyebrow">What this visualization shows</p>
            <h2>How to read the map</h2>
          </div>
        </summary>
        <div class="details-content">
          <p>
            Each point on the map is a TOD project. The large dashed circle shows the buffer area used to summarize nearby census data around that project.
            Color shows whether the project’s affordable share is below, near, or above the nearby lower-income renter share. Clicking a project updates the detail panel on the right.
          </p>
        </div>
      </details>

      <details class="info-box yellow">
        <summary>
          <div class="summary-content">
            <p class="eyebrow">Why this matters</p>
            <h2>Why planners and policymakers should care</h2>
          </div>
        </summary>
        <div class="details-content">
          <p>
            TOD projects are often evaluated by how many total units they add, but that does not show whether they are creating housing that matches the needs of nearby residents.
            This visualization helps planners and policymakers compare where projects appear to under-serve or better match nearby lower-income renter demand, using a simple affordability-gap measure.
          </p>
        </div>
      </details>
    </div>
  </section>

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
          {/if}
        {/each}
      </g>
    </svg>

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

  <div class="legend-section">
    <div class="legend">
      <div class="bar"></div>
      <div class="labels">
        <span>Under-serving</span>
        <span>Meeting Needs</span>
        <span>Serves Opportunity</span>
      </div>
    </div>

    <div class="symbol-legend">
      <div class="symbol-item">
        <span class="symbol dashed"></span>
        <span>0.5 mile-radius analysis buffer around each TOD</span>
      </div>
      <div class="symbol-item">
        <span class="symbol selected"></span>
        <span>Selected TOD project</span>
      </div>
      <div class="symbol-item">
        <span class="symbol default"></span>
        <span>Other TOD projects</span>
      </div>
    </div>
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

  .intro {
    margin-bottom: 12px;
    flex-shrink: 0;
    max-height: 200px;
    overflow-y: auto;
    padding-right: 8px;
  }

  .intro-inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 8px;
  }

  .info-box.yellow {
    background: #fefce8;
    border: 1px solid #fef08a;
    border-radius: 10px;
    overflow: hidden;
    height: fit-content;
  }

  .info-box summary {
    padding: 6px 10px;
    cursor: pointer;
    list-style: none;
    display: flex;
    align-items: center;
  }

  .info-box summary::before {
    content: "▶";
    font-size: 0.7rem;
    margin-right: 8px;
    color: #a16207;
    transition: transform 0.2s;
  }

  .info-box[open] summary::before {
    transform: rotate(90deg);
  }

  .summary-content h2 {
    font-size: 0.85rem;
    margin: 0;
  }

  .summary-content .eyebrow {
    font-size: 9px;
    margin-bottom: 2px;
  }

  .details-content {
    padding: 0 12px 12px 28px;
    color: #713f12;
    line-height: 1.4;
    font-size: 0.85rem;
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

  .legend-section {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 20px;
    margin-top: 12px;
    align-items: start;
    flex-shrink: 0;
  }

  .legend {
    width: 320px;
  }

  .bar {
    height: 10px;
    border-radius: 8px;
    background: linear-gradient(to right, #d80073, #f5f4ef, #2f7f5f);
  }

  .labels {
    display: flex;
    justify-content: space-between;
    color: #64748b;
    font-size: 0.74rem;
    margin-top: 6px;
  }

  .symbol-legend {
    display: grid;
    gap: 8px;
    font-size: 0.74rem;
    color: #475569;
  }

  .symbol-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .symbol {
    display: inline-block;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    flex: 0 0 auto;
  }

  .symbol.default {
    background: #f5f4ef;
    border: 1.5px solid #c6ced6;
  }

  .symbol.selected {
    background: #f5f4ef;
    border: 2.4px solid #111827;
    width: 22px;
    height: 22px;
  }

  .symbol.dashed {
    background: rgba(31, 41, 55, 0.04);
    border: 1px dashed #6b7280;
    width: 26px;
    height: 26px;
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

  @media (max-width: 1150px) {
    .intro-inner {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 900px) {
    .legend-section {
      grid-template-columns: 1fr;
    }
  }
</style>

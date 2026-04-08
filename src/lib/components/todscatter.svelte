<script>
  import * as d3 from "d3";

  export let data = [];
  export let selectedId = null;
  export let onSelect = (d) => {};
  export let width = 920;
  export let height = 430;

  const margin = { top: 40, right: 32, bottom: 56, left: 66 };

  $: innerWidth = width - margin.left - margin.right;
  $: innerHeight = height - margin.top - margin.bottom;

  $: x = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]);
  $: y = d3.scaleLinear().domain([0, 1]).range([innerHeight, 0]);
  $: r = d3.scaleSqrt()
    .domain([0, d3.max(data, d => d.totalUnits) || 1])
    .range([4, 18]);

  $: xTicks = [0, 0.25, 0.5, 0.75, 1];
  $: yTicks = [0, 0.25, 0.5, 0.75, 1];
</script>

<div class="wrapper">
  <div class="header">
    <div>
      <p class="eyebrow">Comparison view</p>
      <h3>Projects with higher affordable shares sit higher; projects in areas with more lower-income renters sit farther right</h3>
      <p class="caption">
        The dashed diagonal marks parity between affordable share and local lower-income demand share. Points below the line under-serve nearby demand.
      </p>
      <p class="count">{data.length} projects visible</p>
    </div>
  </div>

  {#if data.length}
    {@const belowLine = data.filter(d => d.mismatchScore < 0).length}
    <div class="annotation">
      <strong>{belowLine}</strong> of <strong>{data.length}</strong> visible projects fall below the parity line,
      meaning their affordable unit share is lower than the nearby lower-income renter share.
    </div>
  {/if}

  <svg {width} {height}>
    <g transform={`translate(${margin.left},${margin.top})`}>
      {#each xTicks as tick}
        <line x1={x(tick)} x2={x(tick)} y1="0" y2={innerHeight} stroke="#eef2f7" />
        <text x={x(tick)} y={innerHeight + 20} text-anchor="middle" font-size="11" fill="#64748b">
          {d3.format(".0%")(tick)}
        </text>
      {/each}

      {#each yTicks as tick}
        <line x1="0" x2={innerWidth} y1={y(tick)} y2={y(tick)} stroke="#eef2f7" />
        <text x="-10" y={y(tick) + 4} text-anchor="end" font-size="11" fill="#64748b">
          {d3.format(".0%")(tick)}
        </text>
      {/each}

      <line
        x1={x(0)}
        y1={y(0)}
        x2={x(1)}
        y2={y(1)}
        stroke="#8c99a5"
        stroke-dasharray="5 5"
      />

      {#each data as d}
        {@const selected = d.id === selectedId}
        <circle
          cx={x(d.lowerIncomeDemandShare)}
          cy={y(d.affordableShare)}
          r={r(d.totalUnits)}
          fill={selected ? "#d1495b" : "#4f7cac"}
          fill-opacity={selected ? 0.95 : 0.72}
          stroke={selected ? "#7f1d1d" : "#ffffff"}
          stroke-width={selected ? 2 : 1.5}
          on:click={() => onSelect(d)}
        >
          <title>
            {d.project}
            Affordable share: {d3.format(".0%")(d.affordableShare)}
            Lower-income demand: {d3.format(".0%")(d.lowerIncomeDemandShare)}
            Total units: {d.totalUnits}
          </title>
        </circle>
      {/each}

      <text x={innerWidth / 2} y={innerHeight + 42} text-anchor="middle" font-size="12" fill="#334155">
        Share of nearby renter households under selected threshold
      </text>

      <text
        x={-innerHeight / 2}
        y={-46}
        transform="rotate(-90)"
        text-anchor="middle"
        font-size="12"
        fill="#334155"
      >
        Affordable share of project units
      </text>
    </g>
  </svg>
</div>

<style>
  .wrapper {
    padding: 18px;
  }

  .eyebrow {
    margin: 0 0 6px 0;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    font-weight: 700;
  }

  h3 {
    margin: 0 0 4px 0;
    font-size: 1rem;
  }

  .caption {
    margin: 0 0 8px 0;
    color: #5b6b7a;
    font-size: 0.88rem;
    max-width: 760px;
  }

  .count {
    margin: 0 0 12px 0;
    font-size: 0.82rem;
    color: #64748b;
  }

  circle {
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  .annotation {
    margin: 0 0 10px 0;
    padding: 10px 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    font-size: 0.84rem;
    color: #334155;
  }
</style>
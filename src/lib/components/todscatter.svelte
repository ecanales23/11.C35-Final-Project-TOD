<script>
  import * as d3 from "d3";

  export let data = [];
  export let selectedId = null;
  export let onSelect = (d) => {};

  export let width = 700;
  export let height = 420;

  const margin = { top: 28, right: 24, bottom: 52, left: 58 };

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

<svg {width} {height}>
  <g transform={`translate(${margin.left},${margin.top})`}>
    <text x="0" y="-10" font-size="13" font-weight="600">
      Affordable share vs. nearby lower-income renter demand
    </text>

    {#each xTicks as tick}
      <line x1={x(tick)} x2={x(tick)} y1="0" y2={innerHeight} stroke="#f0f0f0" />
      <text x={x(tick)} y={innerHeight + 18} text-anchor="middle" font-size="10" fill="#666">
        {d3.format(".0%")(tick)}
      </text>
    {/each}

    {#each yTicks as tick}
      <line x1="0" x2={innerWidth} y1={y(tick)} y2={y(tick)} stroke="#f0f0f0" />
      <text x="-8" y={y(tick) + 4} text-anchor="end" font-size="10" fill="#666">
        {d3.format(".0%")(tick)}
      </text>
    {/each}

    <line
      x1={x(0)}
      y1={y(0)}
      x2={x(1)}
      y2={y(1)}
      stroke="#999"
      stroke-dasharray="4 4"
    />

    {#each data as d}
      <circle
        cx={x(d.lowerIncomeDemandShare)}
        cy={y(d.affordableShare)}
        r={r(d.totalUnits)}
        fill={d.id === selectedId ? "#d1495b" : "#4c78a8"}
        fill-opacity="0.72"
        stroke={d.id === selectedId ? "#7f1d1d" : "#ffffff"}
        stroke-width="1.5"
        on:click={() => onSelect(d)}
      >
        <title>
          {d.project}
          Affordable share: {d3.format(".0%")(d.affordableShare)}
          Nearby renters under $50k: {d3.format(".0%")(d.lowerIncomeDemandShare)}
          Total units: {d.totalUnits}
        </title>
      </circle>
    {/each}

    <text x={innerWidth / 2} y={innerHeight + 40} text-anchor="middle" font-size="11" fill="#444">
      Share of nearby renter households under $50k
    </text>

    <text
      x={-innerHeight / 2}
      y={-42}
      transform="rotate(-90)"
      text-anchor="middle"
      font-size="11"
      fill="#444"
    >
      Affordable share of project units
    </text>
  </g>
</svg>
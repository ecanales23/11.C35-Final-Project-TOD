<script>
  import * as d3 from "d3";
  export let tod;
  export let width = 360;
  export let height = 180;

  const margin = { top: 60, right: 35, bottom: 32, left: 155 };
  $: innerWidth = width - margin.left - margin.right;
  $: innerHeight = height - margin.top - margin.bottom;

  $: data = tod ? [
    { label: "Affordable share of TOD", value: tod.affordableShare, color: "#2f7f5f" },
    { label: "Nearby lower-income demand", value: tod.lowerIncomeDemandShare, color: "#d80073" }
  ] : [];

  $: x = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]);
  $: y = d3.scaleBand().domain(data.map(d => d.label)).range([0, innerHeight]).padding(0.28);
  $: xTicks = [0, 0.25, 0.5, 0.75, 1];
</script>

<svg {width} {height} viewBox="0 0 {width} {height}" style="max-width: 100%; height: auto;">
  <g transform={`translate(${margin.left},${margin.top})`}>
    <text x="-75" y="-45" font-size="12" font-weight="700" fill="#000">
      Project supply vs. nearby demand
    </text>

    <text x="-155" y="-30" font-size="9" fill="#64748b">
      <tspan x="-155" dy="0">This compares the affordable share of the TOD with the share of nearby renters </tspan>
      <tspan x="-55" dy="12">under the selected income threshold.</tspan>
    </text>

    {#each xTicks as tick}
      <line x1={x(tick)} x2={x(tick)} y1="0" y2={innerHeight} stroke="#edf2f7" />
      <text x={x(tick)} y={innerHeight + 18} text-anchor="middle" font-size="10" fill="#94a3b8">
        {d3.format(".0%")(tick)}
      </text>
    {/each}

    {#each data as d}
      <text
        x="-10"
        y={y(d.label) + y.bandwidth()/2 + 4}
        text-anchor="end"
        font-size="10"
        fill="#475569"
      >
        {d.label}
      </text>

      <rect
        x="0"
        y={y(d.label)}
        width={x(d.value)}
        height={y.bandwidth()}
        fill={d.color}
        rx="4"
      />

      <text
        x={x(d.value) + 6}
        y={y(d.label) + y.bandwidth()/2 + 4}
        font-size="10"
        font-weight="500"
        fill="#334155"
      >
        {d3.format(".0%")(d.value)}
      </text>
    {/each}
  </g>
</svg>

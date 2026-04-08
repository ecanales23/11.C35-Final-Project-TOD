<script>
  import * as d3 from "d3";
  export let tod;
  export let width = 360;
  export let height = 280;

  const margin = { top: 80, right: 20, bottom: 32, left: 45 };
  $: innerWidth = width - margin.left - margin.right;
  $: innerHeight = height - margin.top - margin.bottom;
  $: bins = tod?.renterBins ?? [];

  $: x = d3.scaleBand().domain(bins.map(d => d.label)).range([0, innerWidth]).padding(0.2);
  $: y = d3.scaleLinear().domain([0, d3.max(bins, d => d.value) || 1]).nice().range([innerHeight, 0]);
  $: yTicks = y.ticks(4);
</script>

<svg {width} {height}>
  <g transform={`translate(${margin.left},${margin.top})`}>
    <text x="30" y="-60" font-size="13" font-weight="700">
      Nearby renter households by income
    </text>
    <text x="-35" y="-45" font-size="9" fill="#64748b">
      Households come from the census-based buffer area around the selected TOD.
    </text>

    {#each yTicks as tick}
      <line x1="0" x2={innerWidth} y1={y(tick)} y2={y(tick)} stroke="#edf2f7" />
      <text x="-10" y={y(tick) + 4} text-anchor="end" font-size="10" fill="#94a3b8">
        {d3.format(".2s")(tick)}
      </text>
    {/each}

    {#each bins as d}
      <rect
        x={x(d.label)}
        y={y(d.value)}
        width={x.bandwidth()}
        height={innerHeight - y(d.value)}
        fill="#6b8fb3"
        rx="4"
      />
      <text
        x={x(d.label) + x.bandwidth()/2}
        y={innerHeight + 14}
        text-anchor="middle"
        font-size="9"
        fill="#475569"
      >
        {d.label}
      </text>
    {/each}
  </g>
</svg>

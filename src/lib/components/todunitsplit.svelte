<script>
  import * as d3 from "d3";

  export let tod;
  export let width = 360;
  export let height = 64;

  const margin = { top: 18, right: 16, bottom: 22, left: 16 };

  $: innerWidth = width - margin.left - margin.right;
  $: innerHeight = height - margin.top - margin.bottom;

  $: data = [
    { label: "Affordable", value: tod?.affordableUnits ?? 0, color: "#2a6f97" },
    { label: "Market-rate", value: tod?.marketRateUnits ?? 0, color: "#c97b63" }
  ];

  $: total = d3.sum(data, d => d.value);
  $: x = d3.scaleLinear().domain([0, Math.max(total, 1)]).range([0, innerWidth]);

  $: stacked = (() => {
    let acc = 0;
    return data.map(d => {
      const x0 = acc;
      acc += d.value;
      return { ...d, x0, x1: acc };
    });
  })();
</script>

{#if tod}
<svg {width} {height}>
  <g transform={`translate(${margin.left},${margin.top})`}>
    {#each stacked as d}
      <rect
        x={x(d.x0)}
        y={0}
        width={Math.max(0, x(d.x1) - x(d.x0))}
        height={22}
        fill={d.color}
        rx="4"
      />
    {/each}

    <text x="0" y="-4" font-size="12" font-weight="600">
      Unit mix
    </text>

    <text x="0" y="40" font-size="11" fill="#444">
      Affordable: {tod.affordableUnits}
    </text>
    <text x="120" y="40" font-size="11" fill="#444">
      Market-rate: {tod.marketRateUnits}
    </text>
    <text x="260" y="40" font-size="11" fill="#444">
      {d3.format(".0%")(tod.affordableShare)} affordable
    </text>
  </g>
</svg>
{/if}
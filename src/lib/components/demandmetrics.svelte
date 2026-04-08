<script>
  import * as d3 from "d3";

  export let data = [];
  export let selectedId = null;
  export let onSelect = (d) => {};
  export let mode = "underserved"; 

  $: sorted = [...data]
    .filter(d => d.totalUnits > 0)
    .sort((a, b) => {
      if (mode === "underserved") return a.mismatchScore - b.mismatchScore;
      return b.mismatchScore - a.mismatchScore;
    })
    .slice(0, 5);
</script>

<div class="panel">
  <div class="header">
    <p class="eyebrow">Quick findings</p>
    <h3>{mode === "underserved" ? "Top 5 projects with the largest local affordability gap" : "Top 5 projects exceeding nearby demand share"}</h3>
  </div>

  <div class="toggle-row">
    <button class:active={mode === "underserved"} on:click={() => mode = "underserved"}>
      Biggest gaps
    </button>
    <button class:active={mode === "overprovided"} on:click={() => mode = "overprovided"}>
      Strongest affordable share
    </button>
  </div>

  <ol>
    {#each sorted as d, i}
      <li class:selected={d.id === selectedId} on:click={() => onSelect(d)}>
        <div class="rank">{i + 1}</div>
        <div class="content">
          <p class="name">{d.project}</p>
          <p class="meta">
            Gap: {d3.format("+.0%")(d.mismatchScore)} ·
            Affordable: {d3.format(".0%")(d.affordableShare)} ·
            Units: {d.totalUnits}
          </p>
        </div>
      </li>
    {/each}
  </ol>
</div>

<style>
  .panel {
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
    margin: 0 0 10px 0;
    font-size: 1rem;
    line-height: 1.25;
  }

  .toggle-row {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  button {
    border: 1px solid #d0d7de;
    background: white;
    border-radius: 999px;
    padding: 7px 12px;
    font-size: 12px;
    cursor: pointer;
  }

  button.active {
    background: #1f2937;
    color: white;
    border-color: #1f2937;
  }

  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }

  li {
    display: grid;
    grid-template-columns: 28px 1fr;
    gap: 10px;
    align-items: start;
    padding: 10px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    cursor: pointer;
    background: #fff;
  }

  li.selected {
    border-color: #d1495b;
    box-shadow: inset 0 0 0 1px #d1495b;
    background: #fff8f8;
  }

  .rank {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: #f3f4f6;
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 700;
  }

  .name {
    margin: 0 0 4px 0;
    font-size: 0.9rem;
    font-weight: 700;
  }

  .meta {
    margin: 0;
    font-size: 0.78rem;
    color: #64748b;
  }
</style>
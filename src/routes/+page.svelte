<script>
  import { onMount } from "svelte";
  import { loadTodData } from "$lib/data/TODdata";
  import TodScatterplot from "$lib/components/todscatter.svelte";
  import TodDetailPanel from "$lib/components/toddetailpanel.svelte";
  import Map from "$lib/components/map.svelte";

  let todData = [];
  let selectedTod = null;
  let loading = true;

  onMount(async () => {
    todData = await loadTodData();
    selectedTod = todData[0] ?? null;
    loading = false;
  });

  function handleSelect(event) {
    const id = event.target.value;
    selectedTod = todData.find(d => d.id === id);
  }

  function handleScatterSelect(d) {
    selectedTod = d;
  }
</script>

{#if loading}
  <p>Loading…</p>
{:else}
  <main class="page">
    <h1>TOD housing dashboard</h1>

    <div class="controls">
      <label for="tod-select">Choose a TOD:</label>
      <select id="tod-select" on:change={handleSelect} bind:value={selectedTod.id}>
        {#each todData as d}
          <option value={d.id}>{d.project}</option>
        {/each}
      </select>
    </div>

    <section class="chart-block">
      <TodScatterplot
        data={todData}
        selectedId={selectedTod?.id}
        onSelect={handleScatterSelect}
      />
    </section>

    <section class="detail-block">
      <TodDetailPanel tod={selectedTod} />
    </section>

    <section class="map-block">
      <Map
        data={todData}
        selectedId={selectedTod?.id}
        onSelect={handleScatterSelect}
      />
    </section>
  </main>
{/if}

<style>
  .page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem;
    font-family: Arial, sans-serif;
  }

  .controls {
    margin-bottom: 1.5rem;
  }

  label {
    margin-right: 0.5rem;
    font-weight: 600;
  }

  select {
    padding: 0.4rem 0.6rem;
    font-size: 0.95rem;
  }

  .chart-block {
    margin-bottom: 2rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 1rem;
  }

  .detail-block {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
  }

  .map-block {
    margin-bottom: 2rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 1rem;
  }
</style>

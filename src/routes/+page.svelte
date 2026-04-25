<script>
  import { onMount } from "svelte";
  import { loadTodData, enrichTodWithThreshold } from "$lib/data/TODdata";
  import Map from "$lib/components/map.svelte";
  import TodDetailPanel from "$lib/components/toddetailpanel.svelte";
  import StorySteps from "$lib/components/standouts.svelte";
  import TimelineSection from "$lib/components/timelinesection.svelte";
  import ScrollStory from "$lib/components/narrativestory.svelte";

  let baseTodData = [];
  let todData = [];
  let selectedTod = null;
  let loading = true;

  let demandThreshold = "50k";
  let showOnlyAffordable = false;
  let showUnderServingOnly = false;
  let minUnits = 0;
  let sortBy = "name";

  onMount(async () => {
    baseTodData = await loadTodData();
    loading = false;
  });

  function sortData(data) {
    const copy = [...data];
    if (sortBy === "gap") copy.sort((a, b) => a.mismatchScore - b.mismatchScore);
    else if (sortBy === "affordable") copy.sort((a, b) => b.affordableShare - a.affordableShare);
    else if (sortBy === "units") copy.sort((a, b) => b.totalUnits - a.totalUnits);
    else copy.sort((a, b) => a.project.localeCompare(b.project));
    return copy;
  }

  function updateDerived() {
    const enriched = enrichTodWithThreshold(baseTodData, demandThreshold);
    let filtered = enriched.filter(d => {
      if (showOnlyAffordable && d.affordableUnits <= 0) return false;
      if (showUnderServingOnly && d.mismatchScore >= 0) return false;
      if (d.totalUnits < minUnits) return false;
      return true;
    });
    todData = sortData(filtered);
    const selectedStillVisible = selectedTod && todData.find(d => d.id === selectedTod.id);
    selectedTod = selectedStillVisible || (todData[0] ?? null);
  }

  $: {
    if (baseTodData.length) {
      updateDerived(demandThreshold, showOnlyAffordable, showUnderServingOnly, minUnits, sortBy);
    }
  }

  function handleDropdown(event) {
    const id = event.target.value;
    selectedTod = todData.find(d => d.id === id) ?? null;
  }

  function handleSelect(d) {
    selectedTod = d;
  }

  function applyStoryStep(step) {
    if (step === "all") {
      showOnlyAffordable = false;
      showUnderServingOnly = false;
      minUnits = 0;
      sortBy = "name";
    } else if (step === "largest-gaps") {
      showUnderServingOnly = true;
      showOnlyAffordable = false;
      minUnits = 0;
      sortBy = "gap";
    } else if (step === "high-affordable") {
      showOnlyAffordable = true;
      showUnderServingOnly = false;
      minUnits = 0;
      sortBy = "affordable";
    } else if (step === "large-projects") {
      showOnlyAffordable = false;
      showUnderServingOnly = false;
      minUnits = 150;
      sortBy = "units";
    }
  }
</script>

{#if loading}
  <div class="loading-container">
    <p>Loading…</p>
  </div>
{:else}
  <main class="page-wrapper">
    <TimelineSection />

    <header class="hero-section">
      <div class="header-content">
        <p class="eyebrow">Greater Boston TOD dashboard</p>
        <h1>Do current TOD projects match nearby lower-income housing demand?</h1>
        <p class="subtitle">
          This dashboard compares the affordable share of each transit-oriented development (TOD) with the share of nearby renter households under a selected income threshold. Our goal is to show where new housing supply appears more or less aligned with nearby lower-income demand.
        </p>
      </div>
    </header>

    <div class="narrative-container">
      <StorySteps onApplyStep={applyStoryStep} />
    </div>

    <section class="controls-toolbar">
      <div class="control-group flex-2">
        <label for="tod-select">Selected TOD</label>
        {#if selectedTod}
          <select id="tod-select" on:change={handleDropdown} bind:value={selectedTod.id}>
            {#each todData as d}
              <option value={d.id}>{d.project}</option>
            {/each}
          </select>
        {/if}
      </div>

      <div class="control-group flex-1">
        <label for="threshold">Demand threshold</label>
        <select id="threshold" bind:value={demandThreshold}>
          <option value="35k">Renters under $35k</option>
          <option value="50k">Renters under $50k</option>
          <option value="75k">Renters under $75k</option>
        </select>
      </div>

      <div class="control-group flex-1">
        <label for="sort">Sort projects by</label>
        <select id="sort" bind:value={sortBy}>
          <option value="name">Project name</option>
          <option value="gap">Largest gap</option>
          <option value="affordable">Affordable share</option>
          <option value="units">Total units</option>
        </select>
      </div>

      <div class="control-group flex-1 slider-container">
        <label for="min-units">Min project size</label>
        <div class="slider-wrapper">
          <input id="min-units" type="range" min="0" max="400" step="10" bind:value={minUnits} />
        </div>
      </div>

      <div class="control-group flex-1-5 check-stack">
        <label class="custom-check">
          <input type="checkbox" bind:checked={showOnlyAffordable} />
          <span>Only projects with affordable units</span>
        </label>
        <label class="custom-check">
          <input type="checkbox" bind:checked={showUnderServingOnly} />
          <span>Only under-serving projects</span>
        </label>
      </div>
    </section>

    <div class="status-bar">
      <p><strong>{todData.length}</strong> projects visible • Threshold: <strong>{demandThreshold}</strong></p>
    </div>

    <div class="visualization-layout">
      <div class="map-container">
        <Map data={todData} selectedId={selectedTod?.id} onSelect={handleSelect} />
      </div>
      <aside class="detail-sidebar">
        <TodDetailPanel tod={selectedTod} />
      </aside>
    </div>
  </main>
{/if}

<style>
  :global(body) {
    margin: 0;
    background: #f8fafc;
    color: #0f172a;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .page-wrapper {
    max-width: 1600px;
    margin: 0 auto;
    padding: 40px;
  }

  .loading-container {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
  }

  .hero-section {
    margin-bottom: 48px;
  }

  .eyebrow {
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #3b82f6;
    margin-bottom: 12px;
  }

  h1 {
    font-size: 2.75rem;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.03em;
    margin: 0 0 16px;
    max-width: 900px;
  }

  .subtitle {
    font-size: 1.15rem;
    line-height: 1.6;
    color: #475569;
    max-width: 850px;
    margin: 0;
  }

  .narrative-container {
    margin-bottom: 32px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 4px;
  }

  .controls-toolbar {
    display: flex;
    align-items: stretch;
    gap: 24px;
    margin-bottom: 16px;
    background: white;
    padding: 24px 32px;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .control-group {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .flex-1 { flex: 1; }
  .flex-1-5 { flex: 1.5; }
  .flex-2 { flex: 2; }

  .control-group label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #94a3b8;
    margin-bottom: 8px;
  }

  select {
    width: 100%;
    height: 42px;
    padding: 0 12px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
    font-size: 14px;
    background: #fff;
    color: #1e293b;
  }

  .slider-wrapper {
    height: 42px;
    display: flex;
    align-items: center;
  }

  input[type="range"] {
    width: 100%;
    cursor: pointer;
  }

  .check-stack {
    justify-content: center;
    gap: 6px;
  }

  .custom-check {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 11px;
    color: #475569;
    font-weight: 700;
    line-height: 1.2;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status-bar {
    padding: 0 8px 16px;
    font-size: 14px;
    color: #64748b;
  }

  .visualization-layout {
    display: grid;
    grid-template-columns: 1fr 420px;
    gap: 24px;
    height: 750px;
  }

  .map-container, .detail-sidebar {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  }

  .detail-sidebar {
    overflow-y: auto;
  }

  @media (max-width: 1280px) {
    .controls-toolbar {
      display: grid;
      grid-template-columns: 1fr 1fr;
      padding: 20px;
    }
    .visualization-layout {
      grid-template-columns: 1fr;
      height: auto;
    }
    .map-container { height: 600px; }
  }
</style>

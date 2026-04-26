<script>
  import { onMount } from "svelte";
  import { loadTodData, enrichTodWithThreshold } from "$lib/data/TODdata";
  import Map from "$lib/components/map.svelte";
  import TodDetailPanel from "$lib/components/toddetailpanel.svelte";
  import StorySteps from "$lib/components/standouts.svelte";
  import TimelineSection from "$lib/components/timelinesection.svelte";

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
        <p class="eyebrow">Greater Boston TOD Opportunity Dashboard</p>
        <h1>Which TOD projects are opening doors for renters like Maya?</h1>
        <p class="subtitle">
          For each transit-oriented development, we compare the affordable share of new housing with the proportion of nearby lower-income renters. Projects with a positive score are providing <strong>more housing opportunity</strong> than local demand suggests. Projects with a negative score are providing <strong>less</strong>.
        </p>
      </div>
    </header>

    <div class="narrative-container">
      <StorySteps onApplyStep={applyStoryStep} />
    </div>

    <div class="dashboard-context">
      <p>
        Use the controls below to explore how each TOD compares to the needs of its surrounding community.
        A project exceeding local lower-income demand is <strong>providing more opportunity</strong> for renters like Maya — opening doors to neighborhoods they otherwise couldn't afford.
        A project falling short is <strong>providing less opportunity</strong>, and in high-need areas, may be contributing to gentrification pressure as the current population can't afford to move into the new units.
      </p>
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
        <label for="min-units">
          Min project size: <strong>{minUnits} units</strong>
        </label>
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
          <span>Only projects providing less opportunity than local demand</span>
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
    background: #faf7f0;
    color: #1a0f00;
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
    color: #92846e;
  }

  .hero-section {
    display: flex;
    justify-content: center;
    text-align: center;
    padding: 60px 0 40px;
  }

  .eyebrow {
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #b45309;
    margin-bottom: 12px;
  }

  h1 {
    font-family: 'Lora', Georgia, serif;
    font-size: 2.75rem;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.02em;
    margin: 0 0 16px;
    max-width: 900px;
    color: #1a0f00;
  }

  .subtitle {
    font-size: 1.1rem;
    line-height: 1.65;
    color: #5a5040;
    max-width: 820px;
    margin: 0;
  }

  .narrative-container {
    margin-bottom: 24px;
    background: #fff;
    border: 1px solid #e8e0d4;
    border-radius: 16px;
    padding: 4px;
  }

  .dashboard-context {
    margin-bottom: 24px;
    padding: 20px 28px;
    background: #fff7ed;
    border: 1px solid #fed7aa;
    border-radius: 14px;
    font-size: 0.95rem;
    line-height: 1.65;
    color: #7c3a0a;
  }

  .dashboard-context strong { color: #1a0f00; }

  .controls-toolbar {
    display: flex;
    align-items: stretch;
    gap: 24px;
    margin-bottom: 16px;
    background: white;
    padding: 24px 32px;
    border-radius: 20px;
    border: 1px solid #e8e0d4;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
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
    color: #92846e;
    margin-bottom: 8px;
  }

  select {
    width: 100%;
    height: 42px;
    padding: 0 12px;
    border-radius: 10px;
    border: 1px solid #d6cfc3;
    font-size: 14px;
    background: #faf7f0;
    color: #1a0f00;
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
    color: #5a5040;
    font-weight: 700;
    line-height: 1.2;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status-bar {
    padding: 0 8px 16px;
    font-size: 14px;
    color: #92846e;
  }

  .visualization-layout {
    display: grid;
    grid-template-columns: 1fr 420px;
    gap: 24px;
    height: 750px;
  }

  .map-container, .detail-sidebar {
    background: white;
    border: 1px solid #e8e0d4;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04);
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

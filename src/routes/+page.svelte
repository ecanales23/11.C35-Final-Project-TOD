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
  let showOverServingOnly = false;
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
      if (showOverServingOnly && d.mismatchScore <= 0) return false;
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
      showOverServingOnly = false;
      minUnits = 0;
      sortBy = "name";
    } else if (step === "largest-gaps") {
      showUnderServingOnly = true;
      showOverServingOnly = false;
      showOnlyAffordable = false;
      minUnits = 0;
      sortBy = "gap";
    } else if (step === "high-affordable") {
      showOverServingOnly = true;
      showUnderServingOnly = false;
      showOnlyAffordable = false;
      minUnits = 0;
      sortBy = "affordable";
    } else if (step === "large-projects") {
      showOnlyAffordable = false;
      showUnderServingOnly = false;
      showOverServingOnly = false;
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

    <div class="dashboard-shell" id="dashboard">

      <div class="controls-col">

        <details class="info-box">
          <summary>
            <div class="summary-content">
              <p class="eyebrow">How to use this dashboard</p>
              <h2>Dashboard Controls</h2>
            </div>
          </summary>
          <div class="details-content">
            <p>
              Use the controls below to explore how each TOD compares to the needs of its surrounding community.
              Projects exceeding local lower-income demand are <strong>opening doors</strong> for renters like Maya.
              Projects falling short may be contributing to <strong>gentrification pressure</strong>.
            </p>
          </div>
        </details>

        <div class="controls-block">
          <div class="control-group">
            <label for="tod-select">Selected TOD</label>
            {#if selectedTod}
              <select id="tod-select" on:change={handleDropdown} bind:value={selectedTod.id}>
                {#each todData as d}
                  <option value={d.id}>{d.project}</option>
                {/each}
              </select>
            {/if}
          </div>

          <div class="control-row">
            <div class="control-group">
              <label for="threshold">Demand threshold</label>
              <select id="threshold" bind:value={demandThreshold}>
                <option value="35k">Renters under $35k</option>
                <option value="50k">Renters under $50k</option>
                <option value="75k">Renters under $75k</option>
              </select>
            </div>

            <div class="control-group">
              <label for="sort">Sort by</label>
              <select id="sort" bind:value={sortBy}>
                <option value="name">Project name</option>
                <option value="gap">Largest gap</option>
                <option value="affordable">Affordable share</option>
                <option value="units">Total units</option>
              </select>
            </div>
          </div>

          <div class="control-group">
            <label for="min-units">Min project size: <strong>{minUnits} units</strong></label>
            <input id="min-units" type="range" min="0" max="400" step="10" bind:value={minUnits} />
          </div>

          <div class="check-stack">
            <label class="custom-check">
              <input type="checkbox" bind:checked={showOnlyAffordable} />
              <span>Only projects with affordable units</span>
            </label>
            <label class="custom-check">
              <input type="checkbox" bind:checked={showUnderServingOnly} />
              <span>Only projects providing less opportunity than local demand</span>
            </label>
          </div>
        </div>

        <div class="status-bar">
          <strong>{todData.length}</strong> projects visible &nbsp;·&nbsp; Threshold: <strong>{demandThreshold}</strong>
        </div>
        <div class="story-block">
          <p class="section-label">Guided views</p>
          <StorySteps onApplyStep={applyStoryStep} />
        </div>
      </div> 

      <div class="map-col">
        <header class="map-header">
          <p class="eyebrow">Greater Boston TOD Opportunity Dashboard</p>
          <h1>Which TOD projects are opening doors for renters like Maya?</h1>
          <p class="subtitle">
            Compare each TOD's affordable share against nearby lower-income renter demand.
            A <strong>positive score</strong> means more opportunity than local demand suggests.
            A <strong>negative score</strong> means less.
          </p>
        </header>

        <div class="map-and-panel">
          <div class="map-container">
            <Map data={todData} selectedId={selectedTod?.id} onSelect={handleSelect} />
          </div>
          <aside class="detail-sidebar">
            <TodDetailPanel tod={selectedTod} />
          </aside>
        </div>
      </div>  

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
  }

  .loading-container {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #92846e;
  }

  .dashboard-shell {
    display: grid;
    grid-template-columns: 380px 1fr;  
    gap: 24px;
    height: 100vh;
    position: sticky;
    top: 0;
    padding: 24px;
    box-sizing: border-box;
  }

  .map-col {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 0;
  }

  .map-header {
    flex-shrink: 0;
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #b45309;
    margin: 0 0 8px;
  }

  h1 {
    font-family: 'Lora', Georgia, serif;
    font-size: 1.6rem;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.02em;
    margin: 0 0 8px;
    color: #1a0f00;
  }

  .subtitle {
    font-size: 0.9rem;
    line-height: 1.6;
    color: #5a5040;
    margin: 0;
  }

  .map-and-panel {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 16px;
    flex: 1;
    min-height: 0;
  }

  .map-container {
    background: white;
    border: 1px solid #e8e0d4;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04);
    min-height: 0;
  }

  .detail-sidebar {
    background: white;
    border: 1px solid #e8e0d4;
    border-radius: 20px;
    overflow-y: auto;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04);
  }

  .controls-col {
    display: flex;
    flex-direction: column;
    gap: 0px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .section-label {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #92846e;
    margin: 0 0 10px;
  }

  .story-block {
    background: white;
    border: 1px solid #e8e0d4;
    border-radius: 16px;
    padding: 20px;
    flex-shrink: 0;
  }

  .controls-block {
    background: white;
    border: 1px solid #e8e0d4;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
  }

  .control-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .control-group label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #92846e;
  }

  select {
    width: 100%;
    height: 38px;
    padding: 0 10px;
    border-radius: 10px;
    border: 1px solid #d6cfc3;
    font-size: 13px;
    background: #faf7f0;
    color: #1a0f00;
  }

  input[type="range"] {
    width: 100%;
    cursor: pointer;
  }

  .check-stack {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .custom-check {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    cursor: pointer;
    font-size: 12px;
    color: #5a5040;
    line-height: 1.4;
  }

  .custom-check input { margin-top: 2px; flex-shrink: 0; }

  .status-bar {
    font-size: 13px;
    color: #92846e;
    padding: 4px 0;
    flex-shrink: 0;
  }

  @media (max-width: 1100px) {
    .dashboard-shell {
      grid-template-columns: 1fr;
      height: auto;
      position: static;
    }
    .map-and-panel {
      grid-template-columns: 1fr;
      height: 600px;
    }
    .detail-sidebar { display: none; }
  }


</style>

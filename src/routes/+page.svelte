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

    if (!selectedStillVisible) {
      selectedTod = todData[0] ?? null;
    } else {
      selectedTod = selectedStillVisible;
    }
  }

  $: {
    baseTodData;
    demandThreshold;
    showOnlyAffordable;
    showUnderServingOnly;
    minUnits;
    sortBy;

    if (baseTodData.length) {
      updateDerived();
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
  <p>Loading…</p>
{:else}
  <main class="page">
    <TimelineSection />

    <header class="hero">
      <div>
        <p class="eyebrow">Greater Boston TOD dashboard</p>
        <h1>Do current TOD projects match nearby lower-income housing demand?</h1>
        <p class="subtitle">
          This dashboard compares the affordable share of each transit-oriented development (TOD) with the share of nearby renter households under a selected income threshold. Our goal is to show where new housing supply appears more or less aligned with nearby lower-income demand.
        </p>
      </div>
    </header>

    <section class="controls">
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

      <div class="control-group">
        <label for="threshold">Demand threshold</label>
        <select id="threshold" bind:value={demandThreshold}>
          <option value="35k">Renters under $35k</option>
          <option value="50k">Renters under $50k</option>
          <option value="75k">Renters under $75k</option>
        </select>
      </div>

      <div class="control-group">
        <label for="sort">Sort projects by</label>
        <select id="sort" bind:value={sortBy}>
          <option value="name">Project name</option>
          <option value="gap">Largest gap</option>
          <option value="affordable">Affordable share</option>
          <option value="units">Total units</option>
        </select>
      </div>

      <div class="control-group">
        <label for="min-units">Minimum project size: {minUnits} units</label>
        <input id="min-units" type="range" min="0" max="400" step="10" bind:value={minUnits} />
      </div>

      <div class="control-group checkbox-group">
        <label><input type="checkbox" bind:checked={showOnlyAffordable} /> Only projects with affordable units</label>
        <label><input type="checkbox" bind:checked={showUnderServingOnly} /> Only under-serving projects</label>
      </div>
    </section>

    <section class="status-bar">
      <p><strong>{todData.length}</strong> projects visible</p>
      <p>Threshold: <strong>{demandThreshold}</strong></p>
    </section>

    <section class="card">
      <StorySteps onApplyStep={applyStoryStep} />
    </section>

    <section class="main-grid">
      <div class="card large">
        <Map
          data={todData}
          selectedId={selectedTod?.id}
          onSelect={handleSelect}
        />
      </div>

      <div class="card side">
        <TodDetailPanel tod={selectedTod} />
      </div>
    </section>
  </main>
{/if}

<style>
  :global(body) {
    margin: 0;
    background: #f4f6f8;
    color: #1f2937;
    font-family: Inter, system-ui, sans-serif;
  }

  .page {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px;
  }

  .hero {
    text-align: center;
    margin-bottom: 48px;
    display: flex;
    justify-content: center;
  }

  .eyebrow {
    margin: 0 0 8px 0;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #5b6b7a;
    font-weight: 700;
  }

  h1 {
    margin: 0 0 8px 0;
    font-size: 2rem;
    line-height: 1.08;
    color: #111827;
  }

  .subtitle {
    margin: 0;
    max-width: 980px;
    color: #5b6b7a;
    line-height: 1.5;
  }

  .card {
    background: white;
    border: 1px solid #d9e0e7;
    border-radius: 16px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    overflow: hidden;
  }

  .controls {
    display: grid;
    grid-template-columns: repeat(5, minmax(160px, 1fr));
    gap: 16px;
    margin: 0 0 12px;
  }

  .control-group {
    background: white;
    border: 1px solid #d9e0e7;
    border-radius: 12px;
    padding: 14px;
  }

  .control-group label {
    display: block;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 8px;
    color: #475569;
  }

  .control-group select,
  .control-group input[type="range"] {
    width: 100%;
  }

  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 13px;
    color: #374151;
  }

  .status-bar {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    color: #5b6b7a;
    font-size: 0.9rem;
  }

  .main-grid {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(360px, 430px);
    gap: 20px;
    align-items: start;
    margin-top: 20px;
  }

  .large, .side {
    min-height: 760px;
  }

  @media (max-width: 1150px) {
    .context-grid {
      grid-template-columns: 1fr;
      gap: 32px;
    }

    .controls,
    .main-grid {
      grid-template-columns: 1fr;
    }

    .large,
    .side {
      min-height: unset;
    }
  }
</style>

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
  let activeSection = "timeline";

  let showUnderServingOnly = false;
  let showOverServingOnly = false;
  let minUnits = 0;
  let sortBy = "name";
  let activeStep = null;
  let showLowIncomeChoropleth = false;
  let showCostBurdenChoropleth = false;

  const guidedBlurb = {
    "largest-gaps": "These properties have the widest gap between their affordable unit share and the surrounding concentration of lower-income renters. Local renters have the fewest options here.",
    "high-affordable": "These properties provide more affordable units than the surrounding concentration of lower-income renters requires."
  };

  $: highlightedProjects = !activeStep ? []
    : activeStep === 'largest-gaps' ? todData.filter(d => d.mismatchScore < 0)
    : activeStep === 'high-affordable' ? todData.filter(d => d.mismatchScore > 0)
    : [];

  onMount(async () => {
    baseTodData = await loadTodData();
    loading = false;

    const sectionIds = ['timeline', 'maya-story', 'timeline-details', 'dashboard'];
    const NAV_HEIGHT = 80;

    function updateActiveSection() {
      let current = 'timeline';
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= NAV_HEIGHT) {
          current = id;
        }
      }
      activeSection = current;
    }

    setTimeout(() => {
      window.addEventListener('scroll', updateActiveSection, { passive: true });
      updateActiveSection();
    }, 600);

    return () => window.removeEventListener('scroll', updateActiveSection);
  });

  function scrollToSection(id, storyStep = null) {
    const el = document.getElementById(id);
    if (el) {
      activeSection = id;
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
    if (storyStep) {
      applyStoryStep(storyStep);
    }
  }

  function sortData(data) {
    const copy = [...data];
    if (sortBy === "gap") copy.sort((a, b) => a.mismatchScore - b.mismatchScore);
    else if (sortBy === "affordable") copy.sort((a, b) => b.affordableShare - a.affordableShare);
    else if (sortBy === "units") copy.sort((a, b) => b.totalUnits - a.totalUnits);
    else copy.sort((a, b) => a.project.localeCompare(b.project));
    return copy;
  }

  function updateDerived() {
    const enriched = enrichTodWithThreshold(baseTodData, "50k");
    let filtered = enriched.filter(d => {
      if (showUnderServingOnly && d.mismatchScore >= 0) return false;
      if (showOverServingOnly && d.mismatchScore <= 0) return false;
      if (d.totalUnits < minUnits) return false;
      return true;
    });
    todData = sortData(filtered);
    const selectedStillVisible = selectedTod && todData.find(d => d.id === selectedTod.id);
    selectedTod = selectedStillVisible || (todData[0] ?? null);
  }

  $: if (baseTodData.length) {
    void [showUnderServingOnly, showOverServingOnly, minUnits, sortBy];
    updateDerived();
  }

  function handleSelect(d) {
    selectedTod = d;
  }

  function applyStoryStep(step) {
    activeStep = step === "all" ? null : step;
    showUnderServingOnly = false;
    showOverServingOnly = false;
    minUnits = 0;
    sortBy = "name";
  }
</script>

{#if loading}
  <div class="loading-container">
    <p>Loading…</p>
  </div>
{:else}
  <nav class="sticky-nav">
    <div class="nav-inner">
      <button
        class:active={activeSection === 'timeline'}
        on:click={() => scrollToSection('timeline')}>
        1. Start
      </button>
      <button
        class:active={activeSection === 'maya-story'}
        on:click={() => scrollToSection('maya-story')}>
        2. Maya's Story
      </button>
      <button
        class:active={activeSection === 'timeline-details'}
        on:click={() => scrollToSection('timeline-details')}>
        3. Timeline
      </button>
      <button
        class:active={activeSection === 'dashboard'}
        on:click={() => scrollToSection('dashboard', 'all')}>
        4. Dashboard
      </button>
    </div>
    <div class="progress-container">
      <div class="progress-bar"></div>
    </div>
  </nav>

  <main class="page-wrapper">
    <section id="timeline">
      <TimelineSection />
    </section>

    <header class="map-header">
      <p class="eyebrow">Greater Boston TOD Opportunity Dashboard</p>
      <h1>Which TOD projects are opening doors for renters like Maya?</h1>
      <p class="subtitle">
        Compare each TOD's affordable share against nearby lower-income renter demand.
      </p>
      <p class="data-note-inline">
        Analysis draws from the 15 completed TOD projects available via MBTA Realty.
        Projects with incomplete affordability data were excluded, leaving the 9 shown here.
      </p>
    </header>

    <div class="dashboard-shell" id="dashboard" class:mode-active={!!activeStep}>
      <div class="controls-col">
        <div class="controls-block">
          <p class="controls-block-label">Map layers</p>

          <button
            class="choropleth-toggle"
            class:active-blue={showLowIncomeChoropleth}
            on:click={() => { showLowIncomeChoropleth = !showLowIncomeChoropleth; if (showLowIncomeChoropleth) showCostBurdenChoropleth = false; }}
          >
            <span class="toggle-swatch" style="background: linear-gradient(135deg, #deebf7, #08519c);"></span>
            <span class="toggle-text">
              <strong>Low-income demand</strong>
              <span>% of nearby renters earning under $50k</span>
            </span>
            <span class="toggle-indicator">{showLowIncomeChoropleth ? "On" : "Off"}</span>
          </button>

          <button
            class="choropleth-toggle"
            class:active-red={showCostBurdenChoropleth}
            on:click={() => { showCostBurdenChoropleth = !showCostBurdenChoropleth; if (showCostBurdenChoropleth) showLowIncomeChoropleth = false; }}
          >
            <span class="toggle-swatch" style="background: linear-gradient(135deg, #fee5d9, #a50f15);"></span>
            <span class="toggle-text">
              <strong>Cost-burdened rate</strong>
              <span>% of nearby renters spending 30%+ on rent</span>
            </span>
            <span class="toggle-indicator">{showCostBurdenChoropleth ? "On" : "Off"}</span>
          </button>
        </div>

        <div class="story-block">
          <StorySteps onApplyStep={applyStoryStep} {activeStep} />
        </div>

        {#if activeStep}
          <div class="mode-popup">
            <div class="mode-popup-top">
              <div class="mode-popup-info">
                <span class="mode-popup-badge">
                  {activeStep === 'largest-gaps' ? 'The biggest affordability gaps' : 'The strongest performers'}
                </span>
                <p class="mode-popup-blurb">{guidedBlurb[activeStep]}</p>
              </div>
              <button class="mode-popup-x" on:click={() => applyStoryStep("all")}>✕</button>
            </div>
            {#if highlightedProjects.length}
              <div class="mode-popup-props">
                <p class="mode-popup-props-label">
                  {highlightedProjects.length === 1 ? '1 highlighted property' : `${highlightedProjects.length} highlighted properties`}
                </p>
                <div class="mode-popup-chips">
                  {#each highlightedProjects as p}
                    <button
                      class="mode-chip"
                      class:selected={selectedTod?.id === p.id}
                      on:click={() => handleSelect(p)}
                    >{p.project}</button>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <div class="map-col">
        <div class="map-and-panel">
          <div class="map-container">
            <Map
              data={todData}
              selectedId={selectedTod?.id}
              onSelect={handleSelect}
              {showLowIncomeChoropleth}
              {showCostBurdenChoropleth}
              {activeStep}
            />
          </div>
          <aside class="detail-sidebar">
            <TodDetailPanel tod={selectedTod} />
          </aside>
        </div>
      </div>
    </div>
  </main>

  <footer class="credits-footer">
    <div class="credits-inner">
      <div class="credits-section">
        <p class="credits-label">Developed by</p>
        <p>Emily Canales, Amira Ravshanova, Courtney Ma</p>
      </div>
      <div class="credits-section">
        <p class="credits-label">Partner</p>
        <p>This project was developed with guidance and feedback from the <a href="https://www.mapc.org/" target="_blank" rel="noopener">Metropolitan Area Planning Commission (MAPC)</a>.</p>
      </div>
      <div class="credits-section">
        <p class="credits-label">Data Sources</p>
        <ul class="sources-list">
          <li>U.S. Census Bureau, American Community Survey (ACS) 5-Year Estimates, 2010–2014, 2015–2019, and 2020–2024</li>
          <li>U.S. Census Bureau, Decennial Census 2020</li>
          <li>MAPC Census Tract Boundaries, Metropolitan Area Planning Commission</li>
          <li>TOD Project Locations and Unit Data, MBTA Realty</li>
        </ul>
      </div>
    </div>
  </footer>
{/if}

<style>
  :global(body) {
    margin: 0;
    background: #faf7f0;
    color: #1a0f00;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .sticky-nav {
    position: sticky;
    top: 0;
    z-index: 1000;
    background: white;
    border-bottom: 1px solid #e8e0d4;
  }

  .nav-inner {
    max-width: 600px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    padding: 12px 24px;
  }

  .nav-inner button {
    background: none;
    border: none;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #92846e;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 8px 0;
    border-bottom: 2px solid transparent;
  }

  .nav-inner button.active {
    color: #b45309;
    border-bottom: 2px solid #b45309;
  }

  .progress-container {
    width: 100%;
    height: 3px;
    background: #f0ede8;
  }

  .progress-bar {
    height: 100%;
    background: #b45309;
    width: 0%;
    animation: scroll-progress linear;
    animation-timeline: scroll();
  }

  @keyframes scroll-progress {
    from { width: 0%; }
    to { width: 100%; }
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

  .map-header {
    text-align: center;
    max-width: 900px;
    margin: 48px auto 32px;
    padding: 0 24px;
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #b45309;
    margin: 0 0 12px;
    display: block;
  }

  h1 {
    font-family: 'Lora', Georgia, serif;
    font-size: 1.85rem;
    font-weight: 700;
    margin: 0 0 12px;
    line-height: 1.3;
  }

  .subtitle {
    font-size: 1rem;
    line-height: 1.6;
    color: #5a5040;
    margin: 0 auto;
  }

  .data-note-inline {
    margin: 12px auto 0;
    font-size: 0.8rem;
    color: #92846e;
    line-height: 1.5;
    max-width: 750px;
  }

  .dashboard-shell {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 24px;
    padding: 0 24px 24px;
    box-sizing: border-box;
    align-items: start;
  }

  .map-col {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 0;
  }

  .map-and-panel {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 16px;
    height: 700px;
  }

  .map-container {
    background: white;
    border: 1px solid #e8e0d4;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04);
  }

  .detail-sidebar {
    background: white;
    border: 1px solid #e8e0d4;
    border-radius: 20px;
    overflow-y: auto;
  }

  .controls-col {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .mode-active .controls-block {
    opacity: 0.25;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  .mode-active .story-block {
    opacity: 0.25;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  .story-block {
    background: white;
    border: 1px solid #e8e0d4;
    border-radius: 16px;
    padding: 20px;
  }

  .controls-block {
    background: white;
    border: 1px solid #e8e0d4;
    border-radius: 16px;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .controls-block-label {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #b45309;
    margin: 0 0 2px;
  }

  .choropleth-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    background: #faf7f0;
    border: 1px solid #e2d8cc;
    border-radius: 12px;
    padding: 10px 12px;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
  }

  .choropleth-toggle:hover {
    border-color: #c0b09a;
    background: #f3ede4;
  }

  .choropleth-toggle.active-blue { background: #eff6ff; border-color: #3b82f6; }
  .choropleth-toggle.active-red { background: #fff5f0; border-color: #ef4444; }

  .toggle-swatch {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    flex-shrink: 0;
    border: 1px solid rgba(0,0,0,0.08);
  }

  .toggle-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .toggle-text strong {
    font-size: 12px;
    color: #1a0f00;
    font-weight: 700;
  }

  .toggle-text span {
    font-size: 10px;
    color: #92846e;
    line-height: 1.3;
  }

  .toggle-indicator {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    color: #92846e;
  }

  .active-blue .toggle-indicator { color: #2563eb; }
  .active-red .toggle-indicator { color: #dc2626; }

  .mode-popup {
    background: white;
    border: 1px solid #e8e0d4;
    border-radius: 16px;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }

  .mode-popup-top {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .mode-popup-info { flex: 1; display: flex; flex-direction: column; gap: 6px; }

  .mode-popup-badge {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #b45309;
  }

  .mode-popup-blurb {
    margin: 0;
    font-size: 0.8rem;
    color: #5a5040;
    line-height: 1.55;
  }

  .mode-popup-x {
    background: none;
    border: 1px solid #e8e0d4;
    border-radius: 8px;
    padding: 4px 9px;
    font-size: 13px;
    cursor: pointer;
    color: #92846e;
    flex-shrink: 0;
    line-height: 1;
    transition: all 0.15s;
  }

  .mode-popup-x:hover { background: #faf0e8; color: #1a0f00; border-color: #c0b09a; }

  .mode-popup-props {
    border-top: 1px solid #f0ede8;
    padding-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .mode-popup-props-label {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #92846e;
    margin: 0;
  }

  .mode-popup-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .mode-chip {
    background: #faf7f0;
    border: 1px solid #e2d8cc;
    border-radius: 20px;
    padding: 4px 11px;
    font-size: 11px;
    font-weight: 600;
    color: #1a0f00;
    cursor: pointer;
    transition: all 0.15s;
  }

  .mode-chip:hover { background: #f3ede4; border-color: #c0b09a; }

  .mode-chip.selected {
    background: #b45309;
    border-color: #b45309;
    color: white;
  }

  @media (max-width: 1100px) {
    .dashboard-shell { grid-template-columns: 1fr; }
    .map-and-panel { grid-template-columns: 1fr; height: 600px; }
    .detail-sidebar { display: none; }
  }

  .credits-footer {
    background: #1a0f00;
    color: #c9b99a;
    padding: 48px 40px;
    margin-top: 64px;
  }

  .credits-inner {
    max-width: 1500px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1.5fr 2.5fr;
    gap: 40px;
  }

  .credits-label {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #b45309;
    margin: 0 0 12px;
  }

  .credits-section p, .credits-section ul { font-size: 0.85rem; line-height: 1.7; color: #c9b99a; margin: 0; }
  .credits-section a { color: #f59e0b; text-decoration: underline; }
  .sources-list { padding-left: 16px; column-count: 2; column-gap: 30px; }
  .sources-list li { margin-bottom: 8px; break-inside: avoid; }

  @media (max-width: 900px) {
    .credits-inner { grid-template-columns: 1fr; gap: 32px; }
    .sources-list { column-count: 1; }
  }
</style>

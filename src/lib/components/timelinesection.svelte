<script>
  import { onMount, tick } from "svelte";
  import { loadTimelineData } from "$lib/data/timelinedata";
  import TimelineMap from "./timelinemap.svelte";
  import { base } from "$app/paths";
  import Narrativestory from "./narrativestory.svelte";

  const chartMetrics = [
    { key: "renterShare",            label: "All renters",             color: "#3b82f6" },
    { key: "lowIncomeRenterShare",   label: "Low-income renters",      color: "#f59e0b" },
    { key: "lowIncomeHouseholdShare",label: "Low-income households",   color: "#22c55e" },
    { key: "costBurdenedRenterShare",label: "Cost-burdened renters",   color: "#f43f5e" },
  ];

  function pct(v) {
    return v != null && isFinite(v) ? `${Math.round(v * 100)}%` : "N/A";
  }

  const todProjects = [
    { name: "225 Centre Street", neighborhood: "Roxbury", station: "Jackson Square", totalUnits: 438, affordableUnits: 291, affordablePct: 66 },
    { name: "Arborpoint at Woodland Station", neighborhood: "Newton", station: "Woodland Station", totalUnits: 180, affordableUnits: 45, affordablePct: 25 },
    { name: "Avenir", neighborhood: "Downtown Boston", station: "North Station", totalUnits: 241, affordableUnits: 17, affordablePct: 7 },
    { name: "Hingham Intermodal Center", neighborhood: "Hingham", station: "Hingham Ferry", totalUnits: 479, affordableUnits: 24, affordablePct: 5 },
    { name: "New Balance Boston Landing", neighborhood: "Allston/Brighton", station: "Boston Landing", totalUnits: 275, affordableUnits: 38, affordablePct: 14 },
    { name: "One Greenway (Parcel 24)", neighborhood: "Chinatown", station: "Tufts Medical Center", totalUnits: 362, affordableUnits: 95, affordablePct: 26 },
    { name: "Bartlett Yard", neighborhood: "Roxbury", station: "Nubian Station", totalUnits: 313, affordableUnits: 241, affordablePct: 77 },
    { name: "One Roxbury Crossing", neighborhood: "Roxbury", station: "Roxbury Crossing", totalUnits: 88, affordableUnits: 88, affordablePct: 100 },
    { name: "Parcel U", neighborhood: "Jamaica Plain", station: "Forest Hills", totalUnits: 120, affordableUnits: 60, affordablePct: 50 },
  ];

  let timelineRows = [];
  let loading = true;
  let activeStep = 0;
  let stepEls = [];

  let waffleVisible = false;
  let waffleEl;

  const steps = [
    {
      part: "Part 1",
      partTitle: "The need before TODs",
      periodKey: "2014",
      metric: "lowIncomeRenterShare",
      eyebrow: "2010–2014 · Before TODs Were Built",
      title: "Before most TODs broke ground, lower-income renters were already the majority in transit neighborhoods.",
      body: "Each circle is a transit-oriented development site. Color shows the share of nearby households that were lower-income renters — people earning under $50,000/year — before most projects were completed. In Roxbury and Jamaica Plain, more than half of all households were lower-income renters. This is the community that Boston's TOD pipeline was entering.",
      callout: null,
    },
    {
      part: "Part 2",
      partTitle: "What changed after TODs opened",
      periodKey: "2019",
      metric: "lowIncomeRenterShare",
      eyebrow: "2015–2019 · After TODs Opened",
      title: "New units arrived — but the community's need for affordable housing didn't go away.",
      body: "By 2015–2019, many TODs had opened, adding hundreds of market-rate apartments near transit. But the lower-income renter population barely changed. In Roxbury and Jamaica Plain, over half of nearby households were still lower-income renters. New supply was flowing in, but it wasn't priced for the people who were already there.",
      callout: null,
    },
    {
      part: "Part 2",
      partTitle: "What changed after TODs opened",
      periodKey: "2019",
      metric: "costBurdenedRenterShare",
      eyebrow: "2015–2019 · Cost Burden After Construction",
      title: "Cost burden barely improved — because the new supply wasn't priced for existing residents.",
      body: "Cost burden means spending over 30% of income on rent. Before the TODs opened, it was already severe near nearly every site. After construction, cost burden at most sites was no better. New apartments went to higher-income tenants at rents that most existing residents couldn't afford.",
      callout: "Cost burden data is available for the 2014 and 2019 periods only.",
    },
    {
      part: "Part 3",
      partTitle: "Two TODs, two communities",
      periodKey: "2019",
      metric: "lowIncomeRenterShare",
      eyebrow: "Roxbury · 2015–2019",
      title: "One Roxbury Crossing: built in a high-need community, yet most new units were market-rate.",
      body: "One Roxbury Crossing opened in 2017 near Roxbury Crossing station. The surrounding neighborhood had one of the highest lower-income renter concentrations of any TOD site — over 60% of households. Yet the majority of units added were market-rate, with rents most nearby residents couldn't afford. This is the supply-demand gap at the heart of Boston's affordability problem.",
      focusProject: "One Roxbury Crossing- Roxbury Crossing Station, Roxbury",
      focusZoom: 13.6,
      photo: "/images/roxbury-crossing.jpg",
      callout: null,
    },
    {
      part: "Part 3",
      partTitle: "Two TODs, two communities",
      periodKey: "2019",
      metric: "lowIncomeRenterShare",
      eyebrow: "Hingham · 2015–2019",
      title: "For contrast: Hingham Intermodal was built in a wealthy suburb with far fewer lower-income renters.",
      body: "Hingham Intermodal Center also opened in 2017 — but fewer than 10% of nearby households were lower-income renters. Both are called TODs. Only one was built into a community facing an acute affordable housing crisis. Not all TOD sites begin with the same level of need. The real equity question is whether housing added near transit matches the people already living there.",
      focusProject: "Hingham Intermodal Center, Hingham",
      focusZoom: 13.4,
      photo: "/images/hingham-intermodal.jpg",
      callout: "Both projects opened in 2017, making them useful comparison cases.",
    },
  ];

  onMount(async () => {
    timelineRows = await loadTimelineData("50k");
    loading = false;

    await tick();

    const mapObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) activeStep = Number(visible[0].target.dataset.step);
      },
      { root: null, threshold: [0.15, 0.4, 0.65], rootMargin: "0px 0px -30% 0px" }
    );
    stepEls.forEach((el) => el && mapObserver.observe(el));

    if (waffleEl) {
      const waffleObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            waffleVisible = true;
            waffleObserver.disconnect();
          }
        },
        { threshold: 0.25 }
      );
      waffleObserver.observe(waffleEl);
    }

    return () => mapObserver.disconnect();
  });

  function partBreaks(steps) {
    const breaks = [];
    let lastPart = null;
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].part !== lastPart) {
        breaks.push(i);
        lastPart = steps[i].part;
      }
    }
    return breaks;
  }
  $: breaks = partBreaks(steps);
</script>

{#if loading}
  <div class="loading-state">
    <div class="loading-pulse"></div>
    <p>Loading neighborhood data…</p>
  </div>
{:else}
  <section class="timeline-container">

    <header class="hero-header">
      <div class="container hero-inner">
        <p class="section-eyebrow">Transit-Oriented Development & Affordability in Greater Boston</p>
        <h1>Boston is adding transit housing.<br><span class="highlight">But for whom?</span></h1>
        <p class="hero-desc">
          Transit-oriented developments (TODs) put housing near jobs, transit, and opportunity. But do Boston's TODs actually serve the people already living near transit? Follow Maya's story — then explore a decade of neighborhood data.
        </p>
        <div class="hero-scroll-hint">
          <span class="scroll-arrow">↓</span>
          <span>Scroll to meet Maya</span>
        </div>
      </div>
    </header>

    <section class="research-summary container">
      <div class="context-grid">
        <div class="info-card">
          <span class="label">Research question</span>
          <p class="main-q">To what extent does the affordable share of current TOD projects in Greater Boston align with nearby lower-income renter demand?</p>
          <p class="sub-text">
            We provide planners and policymakers with an "opportunity score" measuring the gap between new supply and local demand, analyzing data within a 0.5-mile radius of each station.
          </p>
        </div>
        <div class="info-card secondary">
          <span class="label">Why affordability near transit matters</span>
          <p>
            When housing costs exceed 30% of income, families cut back on healthcare, food, and savings. A lack of affordable housing near transit pushes lower-income workers further from reliable transportation — and further from opportunity.
          </p>
        </div>
      </div>
    </section>

    <Narrativestory />

    <section class="maya-humanize" bind:this={waffleEl}>
      <div class="container humanize-inner">
        <div class="humanize-header">
          <span class="section-eyebrow">Who Maya represents</span>
          <h2 class="section-title">Maya is typical of lower-income renters across Boston</h2>
          <p class="humanize-lead">At $52,000/year — roughly 50% of Boston's Area Median Income — Maya isn't an outlier. She's representative of thousands of renters across the city: people who work here, depend on the T, and are searching for housing they can actually afford near transit. Nearly half of all renters near MBTA stations earn under $50,000/year. Yet only about 35% of new TOD units are priced to serve them.</p>
        </div>

        <div class="graphic-pair" class:waffle-visible={waffleVisible}>
          <div class="graphic-card">
            <p class="graphic-title">Who's renting near Boston's transit?</p>
            <p class="graphic-subtitle">Each figure = 1 in 100 renters near MBTA stations</p>
            <div class="icon-grid">
              {#each Array(100) as _, i}
                <svg
                  class="person-icon"
                  class:icon-highlighted={i < 45}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  style="transition-delay: {waffleVisible ? i * 7 : 0}ms"
                >
                  <circle cx="12" cy="7" r="4"/>
                  <path d="M4 21v-1a8 8 0 0 1 16 0v1"/>
                </svg>
              {/each}
            </div>
            <div class="graphic-legend">
              <div class="legend-row">
                <span class="legend-swatch swatch-people"></span>
                <span><strong>~45%</strong> earn under $50k/year — renters like Maya</span>
              </div>
              <div class="legend-row">
                <span class="legend-swatch swatch-other"></span>
                <span>Other renters</span>
              </div>
            </div>
            <p class="graphic-source">Source: ACS 5-Year Estimates, 2020–2024, transit station buffers</p>
          </div>

          <div class="graphic-card">
            <p class="graphic-title">How much of new TOD housing is affordable?</p>
            <p class="graphic-subtitle">Each figure = 1 in 100 new TOD units in Greater Boston</p>
            <div class="icon-grid">
              {#each Array(100) as _, i}
                <svg
                  class="house-icon"
                  class:icon-highlighted={i < 35}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  style="transition-delay: {waffleVisible ? i * 7 + 300 : 0}ms"
                >
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
              {/each}
            </div>
            <div class="graphic-legend">
              <div class="legend-row">
                <span class="legend-swatch swatch-housing"></span>
                <span><strong>~35%</strong> of new TOD units are deed-restricted affordable</span>
              </div>
              <div class="legend-row">
                <span class="legend-swatch swatch-other"></span>
                <span>Market-rate units</span>
              </div>
            </div>
            <p class="graphic-source">Source: Our analysis of 9 Greater Boston TOD projects (2,400+ units)</p>
          </div>
        </div>

        <div class="gap-callout">
          <strong>TOD is a vehicle, not a guarantee.</strong> When it includes affordable units, it can open access to neighborhoods with better transit, jobs, and services for renters like Maya. Without them, these developments largely remain out of reach — and can increase pressure on the communities they're built in.
        </div>
      </div>
    </section>

    <section class="tod-list">
      <div class="container tod-list-inner">
        <div class="tod-list-header">
          <span class="section-eyebrow">The 9 TOD projects we studied</span>
          <h2 class="section-title">These are some transit-oriented developments built across Greater Boston</h2>
          <p class="tod-list-desc">Each is within walking distance of an MBTA station, adding over 2,400 new units. The bar shows what share of each project is affordable for lower-income renters.</p>
        </div>
        <div class="tod-cards-grid">
          {#each todProjects as p}
            <div class="tod-project-card">
              <div class="tod-card-top">
                <span class="tod-neighborhood">{p.neighborhood}</span>
                <span class="tod-station">{p.station}</span>
              </div>
              <h4 class="tod-name">{p.name}</h4>
              <div class="tod-unit-bar" title="{p.affordablePct}% affordable">
                <div class="tod-bar-affordable" style="width:{p.affordablePct}%"></div>
                <div class="tod-bar-market" style="width:{100 - p.affordablePct}%"></div>
              </div>
              <div class="tod-unit-stats">
                <span class="stat-affordable" class:stat-high={p.affordablePct >= 50} class:stat-low={p.affordablePct < 15}>
                  {p.affordablePct}% affordable
                </span>
                <span class="stat-total">{p.totalUnits} units</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </section>

    <div class="scrolly-grid">
      <div class="map-viewport">
        <div class="map-inner">
          <TimelineMap {timelineRows} step={steps[activeStep]} />
        </div>
      </div>

      <div class="text-stream">
        {#each steps as step, i}
          {#if breaks.includes(i)}
            <div class="part-marker">
              <span class="pill">{step.part}</span>
              <span class="label">{step.partTitle}</span>
            </div>
          {/if}

          <article
            class="step-card"
            class:active={i === activeStep}
            bind:this={stepEls[i]}
            data-step={i}
          >
            <div class="step-content">
              <p class="step-eyebrow">
                <span class="year-badge">{step.eyebrow.split(' · ')[0]}</span>
                <span class="eyebrow-text">{step.eyebrow.split(' · ')[1]}</span>
              </p>

              <h3 class="step-title">{step.title}</h3>
              <p class="step-body">{step.body}</p>

              {#if step.focusProject}
                {@const focusRow = timelineRows.find(
                  (d) => d.project === step.focusProject && d.periodKey === step.periodKey
                )}

                <div class="focus-details">
                  {#if step.photo}
                    <figure class="tod-photo">
                      <img src={`${base}${step.photo}`} alt={step.focusProject} />
                    </figure>
                  {/if}

                  {#if focusRow}
                    <div class="demo-chart">
                      <p class="chart-header">Neighborhood Profile · {focusRow.period}</p>
                      {#each chartMetrics as m}
                        {@const val = focusRow[m.key]}
                        {#if val != null && isFinite(val)}
                          <div class="bar-row">
                            <div class="bar-info">
                              <span class="bar-label">{m.label}</span>
                              <span class="bar-value">{pct(val)}</span>
                            </div>
                            <div class="bar-track">
                              <div
                                class="bar-fill"
                                style="width:{val * 100}%; background:{m.color}"
                              ></div>
                            </div>
                          </div>
                        {/if}
                      {/each}
                    </div>
                  {/if}
                </div>
              {/if}

              {#if step.callout}
                <div class="step-callout">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <span>{step.callout}</span>
                </div>
              {/if}
            </div>
          </article>
        {/each}
        <div class="spacer"></div>
      </div>
    </div>

    <section class="advocacy-bridge container">
      <div class="bridge-inner">
        <span class="section-eyebrow">What this means for Maya — and what we can do</span>
        <h2 class="section-title">Affordable housing near transit determines who gets to stay in Boston</h2>
        <div class="bridge-grid">
          <div class="bridge-text">
            <p>TODs are going to keep being built near Boston's transit stops. The question is whether they'll include housing that lower-income renters like Maya can actually afford.</p>
            <p>When TODs include more affordable units, they open doors for residents who already live nearby, depend on the T, and would stay in their neighborhoods if they could. When TODs are mostly market-rate, they risk displacing the very communities they're built in.</p>
            <p>Introducing affordable housing into new TOD developments <strong>diversifies neighborhoods</strong>, lets lower-income residents access areas they otherwise couldn't afford, and keeps long-standing communities intact as transit corridors develop.</p>
          </div>
          <div class="bridge-callouts">
            <div class="bridge-callout positive">
              <span class="callout-icon">+</span>
              <div>
                <strong>More affordable units = more opportunity</strong>
                <p>TODs that go beyond the local lower-income renter share provide real housing opportunity for people like Maya — and help diversify neighborhoods that have historically been out of reach.</p>
              </div>
            </div>
            <div class="bridge-callout negative">
              <span class="callout-icon">−</span>
              <div>
                <strong>Mostly market-rate = more gentrification pressure</strong>
                <p>When TODs in high-need neighborhoods are mostly market-rate, the current population can't afford to move in. Rising land values and new higher-income residents can push rents up for everyone nearby.</p>
              </div>
            </div>
          </div>
        </div>
        <div class="dashboard-cta">
          <span class="cta-arrow">↓</span>
          <span class="cta-text">Use the dashboard below to explore opportunity gaps across all 9 TOD projects</span>
        </div>
      </div>
    </section>

    <section class="limitations-container container">
      <div class="info-card">
        <p class="main-q">Research Limitations</p>
        <ul class="limitations-list">
          <li>Our opportunity score is only a rough estimate. Even if a project's affordability reaches "demand" levels, it does not mean it is meeting those households' needs in practice.</li>
          <li>The metric treats all units as serving the same population, regardless of targeted AMI levels, unit sizes, or eligibility rules.</li>
          <li>Lower-income renter households are a proxy for demand, not a direct measure of who is actively seeking housing, who is cost-burdened, or who may be displaced.</li>
          <li>Focusing on 0.5-mile radii may miss the regional nature of housing markets. TODs serve households beyond immediate tracts.</li>
          <li>This visualization highlights relative patterns and possible mismatches rather than definitively proving whether a project meets a specific demand.</li>
          <li>Project-level data is sometimes incomplete or inconsistent. We used mbtarealty.com, but other sources note different unit counts.</li>
        </ul>
      </div>
    </section>
  </section>
{/if}

<style>
  :global(body) {
    background-color: #faf7f0;
    color: #1e293b;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    margin: 0;
  }

  .container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 24px;
  }

  .hero-header {
    min-height: 100vh;
    display: flex;
    align-items: center;
    text-align: center;
    background: linear-gradient(180deg, #faf7f0 60%, #faf7f0 100%);
    border-bottom: 1px solid #e8e0d4;
  }

  .hero-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding-top: 60px;
    padding-bottom: 60px;
  }

  .section-eyebrow {
    display: block;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #b45309;
    margin-bottom: 0;
  }

  .hero-header h1 {
    font-family: 'Lora', Georgia, serif;
    font-size: clamp(2.8rem, 5.5vw, 4.5rem);
    font-weight: 700;
    line-height: 1.1;
    margin: 0;
    letter-spacing: -0.02em;
    color: #1a0f00;
    max-width: 800px;
  }

  .highlight { color: #2563eb; }

  .hero-desc {
    font-size: 1.2rem;
    color: #5a5040;
    max-width: 680px;
    margin: 0;
    line-height: 1.6;
  }

  .hero-scroll-hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    margin-top: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #b45309;
    opacity: 0.8;
  }

  .scroll-arrow {
    font-size: 1.2rem;
    animation: bounce 1.8s ease-in-out infinite;
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(8px); }
  }

  .research-summary { padding: 60px 24px; margin-bottom: 0; }
  .context-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 24px; }

  .info-card {
    background: white;
    padding: 36px;
    border-radius: 20px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.05);
    border: 1px solid #e8e0d4;
  }

  .info-card.secondary { background: #1e1209; color: #f5ede0; }
  .info-card .label { display: block; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px; opacity: 0.6; }
  .main-q {
    font-family: 'Lora', Georgia, serif;
    font-size: 1.4rem;
    font-weight: 700;
    margin-bottom: 14px;
    line-height: 1.25;
  }
  .sub-text { color: #64748b; font-size: 0.95rem; line-height: 1.6; margin: 0; }

  .maya-humanize {
    min-height: 100vh;
    display: flex;
    align-items: center;
    background: white;
    border-top: 1px solid #e8e0d4;
    border-bottom: 1px solid #e8e0d4;
    padding: 40px 0;
  }

  .humanize-inner {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .humanize-header { text-align: center; }

  .section-title {
    font-family: 'Lora', Georgia, serif;
    font-size: clamp(1.5rem, 2.5vw, 2rem);
    font-weight: 700;
    color: #1a0f00;
    margin: 8px 0 12px;
    line-height: 1.2;
    letter-spacing: -0.01em;
  }

  .humanize-lead {
    font-size: 1rem;
    line-height: 1.6;
    color: #5a5040;
    max-width: 680px;
    margin: 0 auto;
  }

  .graphic-pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .graphic-card {
    background: #faf7f0;
    border: 1px solid #e8e0d4;
    border-radius: 16px;
    padding: 22px;
  }

  .graphic-title {
    font-family: 'Lora', Georgia, serif;
    font-size: 0.95rem;
    font-weight: 700;
    color: #1a0f00;
    margin: 0 0 3px;
  }

  .graphic-subtitle {
    font-size: 0.75rem;
    color: #92846e;
    margin: 0 0 14px;
  }

  .icon-grid {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 3px;
    margin-bottom: 14px;
  }

  .person-icon {
    width: 100%;
    aspect-ratio: 1;
    fill: #e8e0d4;
    opacity: 0;
    transform: scale(0.4);
    transition: fill 0.3s ease, opacity 0.3s ease, transform 0.3s ease;
  }

  .waffle-visible .person-icon {
    opacity: 1;
    transform: scale(1);
  }

  .waffle-visible .person-icon.icon-highlighted { fill: #2563eb; }
  .waffle-visible .person-icon:not(.icon-highlighted) { fill: #e8e0d4; }

  .house-icon {
    width: 100%;
    aspect-ratio: 1;
    fill: #e8e0d4;
    opacity: 0;
    transform: scale(0.4);
    transition: fill 0.3s ease, opacity 0.3s ease, transform 0.3s ease;
  }

  .waffle-visible .house-icon {
    opacity: 1;
    transform: scale(1);
  }

  .waffle-visible .house-icon.icon-highlighted { fill: #16a34a; }
  .waffle-visible .house-icon:not(.icon-highlighted) { fill: #e8e0d4; }

  .graphic-legend { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
  .legend-row { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: #5a5040; }
  .legend-swatch { display: inline-block; width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
  .swatch-people { background: #2563eb; }
  .swatch-housing { background: #16a34a; }
  .swatch-other { background: #e8e0d4; border: 1px solid #d6cfc3; }

  .graphic-source { font-size: 0.7rem; color: #a09070; margin: 0; font-style: italic; }

  .gap-callout {
    background: #fff7ed;
    border: 1px solid #fed7aa;
    border-radius: 14px;
    padding: 16px 24px;
    font-size: 0.95rem;
    line-height: 1.6;
    color: #7c2d12;
    text-align: center;
  }

  .tod-list {
    min-height: 100vh;
    display: flex;
    align-items: center;
    background: #faf7f0;
    border-bottom: 1px solid #e8e0d4;
    padding: 40px 0;
  }

  .tod-list-inner {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .tod-list-header { text-align: center; }
  .tod-list-desc { font-size: 0.95rem; color: #5a5040; max-width: 580px; margin: 0 auto; line-height: 1.6; }

  .tod-cards-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }

  .tod-project-card {
    background: white;
    border: 1px solid #e8e0d4;
    border-radius: 14px;
    padding: 16px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  }

  .tod-card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 6px;
    gap: 6px;
  }

  .tod-neighborhood {
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #b45309;
  }

  .tod-station {
    font-size: 0.65rem;
    color: #92846e;
    text-align: right;
    line-height: 1.3;
  }

  .tod-name {
    font-family: 'Lora', Georgia, serif;
    font-size: 0.88rem;
    font-weight: 600;
    color: #1a0f00;
    margin: 0 0 10px;
    line-height: 1.3;
  }

  .tod-unit-bar {
    display: flex;
    height: 7px;
    border-radius: 5px;
    overflow: hidden;
    margin-bottom: 6px;
    background: #f1ebe0;
  }

  .tod-bar-affordable { background: #16a34a; }
  .tod-bar-market { background: #e2d8c8; }

  .tod-unit-stats {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
  }

  .stat-affordable { font-weight: 700; color: #15803d; }
  .stat-affordable.stat-high { color: #15803d; }
  .stat-affordable.stat-low { color: #b45309; }
  .stat-total { color: #92846e; }

  .scrolly-grid { display: flex; position: relative; }

  .map-viewport {
    flex: 1.3;
    height: 100vh;
    position: sticky;
    top: 0;
    padding: 32px;
    display: flex;
    align-items: center;
  }

  .map-inner {
    width: 100%;
    height: 85vh;
    background: #fff;
    border-radius: 28px;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.08);
    overflow: hidden;
    border: 1px solid #e8e0d4;
  }

  .text-stream { flex: 0.7; padding: 0 40px 0 0; }

  .step-eyebrow { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }

  .year-badge {
    background: #f5ede0;
    color: #7c5e38;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    border: 1px solid #e8d5b8;
    transition: all 0.4s ease;
  }
  .active .year-badge { background: #fff7ed; color: #b45309; border-color: #ffedd5; }

  .eyebrow-text { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; }

  .part-marker {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 120px 0 30px 20px;
  }

  .part-marker .pill { background: #2563eb; color: white; font-size: 0.65rem; font-weight: 900; padding: 4px 12px; border-radius: 99px; }
  .part-marker .label { font-size: 0.78rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }

  .step-card {
    min-height: 100vh;
    display: flex;
    align-items: center;
    opacity: 0.15;
    transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateY(20px);
  }

  .step-card.active { opacity: 1; transform: translateY(0); }

  .step-content {
    background: white;
    padding: 36px;
    border-radius: 24px;
    box-shadow: 0 16px 24px -8px rgba(80,40,0,0.07);
    border: 1px solid #e8e0d4;
  }

  .step-title {
    font-family: 'Lora', Georgia, serif;
    font-size: 1.35rem;
    font-weight: 700;
    line-height: 1.25;
    margin: 0 0 14px;
    color: #1a0f00;
  }

  .step-body { font-size: 1rem; line-height: 1.65; color: #5a5040; }

  .focus-details { margin-top: 24px; border-top: 1px solid #f1ebe0; padding-top: 24px; }
  .tod-photo { margin: 0 0 20px; border-radius: 14px; overflow: hidden; height: 180px; background: #e8e0d4; }
  .tod-photo img { width: 100%; height: 100%; object-fit: cover; }

  .demo-chart { background: #faf7f0; padding: 18px; border-radius: 16px; border: 1px solid #f1ebe0; }
  .chart-header { font-size: 0.62rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 14px; }
  .bar-row { margin-bottom: 12px; }
  .bar-info { display: flex; justify-content: space-between; margin-bottom: 5px; }
  .bar-label { font-size: 0.78rem; font-weight: 600; color: #5a5040; }
  .bar-value { font-size: 0.78rem; font-weight: 800; color: #1a0f00; }
  .bar-track { height: 7px; background: #e8e0d4; border-radius: 8px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 8px; transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1); }

  .step-callout {
    margin-top: 20px;
    display: flex;
    gap: 10px;
    padding: 14px 18px;
    background: #fffbeb;
    border-radius: 12px;
    color: #92400e;
    font-size: 0.85rem;
    line-height: 1.5;
    border: 1px solid #fef3c7;
  }

  .spacer { height: 50vh; }

  /* ── ADVOCACY WRAP-UP ── */
  .advocacy-bridge {
    margin: 60px auto;
    background: white;
    border-radius: 28px;
    border: 1px solid #e8e0d4;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  }

  .bridge-inner { padding: 56px; }

  .bridge-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    margin: 28px 0 36px;
    align-items: start;
  }

  .bridge-text p { font-size: 1rem; line-height: 1.7; color: #5a5040; margin: 0 0 14px; }
  .bridge-text p:last-child { margin-bottom: 0; }

  .bridge-callouts { display: flex; flex-direction: column; gap: 16px; }

  .bridge-callout {
    display: flex;
    gap: 14px;
    padding: 18px;
    border-radius: 14px;
    align-items: flex-start;
  }

  .bridge-callout.positive { background: #f0fdf4; border: 1px solid #bbf7d0; }
  .bridge-callout.negative { background: #fff7ed; border: 1px solid #fed7aa; }

  .callout-icon {
    width: 30px; height: 30px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem; font-weight: 900;
    flex-shrink: 0; line-height: 1;
  }

  .bridge-callout.positive .callout-icon { background: #16a34a; color: white; }
  .bridge-callout.negative .callout-icon { background: #ea580c; color: white; }

  .bridge-callout strong { display: block; font-size: 0.88rem; margin-bottom: 5px; color: #1a0f00; }
  .bridge-callout p { margin: 0; font-size: 0.84rem; line-height: 1.55; color: #5a5040; }

  .dashboard-cta {
    display: flex;
    align-items: center;
    gap: 14px;
    padding-top: 28px;
    border-top: 1px solid #e8e0d4;
  }

  .cta-arrow {
    font-size: 1.4rem;
    color: #2563eb;
    animation: bounce 1.5s ease-in-out infinite;
  }

  .cta-text { font-size: 0.95rem; font-weight: 700; color: #2563eb; }

  .limitations-container { margin: 0 auto 80px; }

  .limitations-container .info-card { border-left: 5px solid #d6cfc3; }

  .limitations-list { margin: 20px 0 0; padding-left: 20px; list-style-type: disc; }
  .limitations-list li { margin-bottom: 14px; line-height: 1.7; color: #5a5040; font-size: 0.95rem; padding-left: 6px; }
  .limitations-list li::marker { color: #a09070; }
  .limitations-list li:last-child { margin-bottom: 0; }

  .loading-state {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; height: 100vh; color: #92846e;
  }

  .loading-pulse {
    width: 40px; height: 40px;
    border: 4px solid #e8e0d4;
    border-top: 4px solid #b45309;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 900px) {
    .scrolly-grid { flex-direction: column; }
    .map-viewport { position: sticky; height: 50vh; z-index: 10; padding: 12px; top: 0; }
    .map-inner { height: 100%; border-radius: 20px; }
    .text-stream { padding: 0 20px; }
    .step-card { min-height: auto; margin-bottom: 60px; opacity: 1; transform: none; }
    .context-grid { grid-template-columns: 1fr; }
    .graphic-pair { grid-template-columns: 1fr; }
    .tod-cards-grid { grid-template-columns: 1fr 1fr; }
    .bridge-grid { grid-template-columns: 1fr; }
    .bridge-inner { padding: 28px 20px; }
    .maya-humanize { padding: 32px 0; min-height: unset; }
    .tod-list { padding: 32px 0; min-height: unset; }
  }

  @media (max-width: 600px) {
    .tod-cards-grid { grid-template-columns: 1fr; }
  }
</style>

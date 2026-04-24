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

  let timelineRows = [];
  let loading = true;
  let activeStep = 0;
  let stepEls = [];


  const steps = [
    {
      part: "Part 1",
      partTitle: "Boston's affordability crisis",
      periodKey: "2014",
      metric: "lowIncomeRenterShare",
      eyebrow: "2010–2014 · Early TOD Development",
      title: "Boston's housing crisis was already acute in transit neighborhoods before most TOD projects were completed.",
      body: "Each circle is a transit-oriented development site. Color shows the share of nearby households that were low-income renters, people earning under $50,000 a year, before some of these projects broke ground. The darkest sites sit in neighborhoods like Roxbury and Jamaica Plain, where more than half of all households were low-income renters. This is the demand backdrop that Boston's TOD pipeline entered.",
      callout: null,
    },
    {
      part: "Part 1",
      partTitle: "Boston's affordability crisis",
      periodKey: "2019",
      metric: "lowIncomeRenterShare",
      eyebrow: "2015–2019 · As TODs were built",
      title: "New units opened. The neighborhoods' need for affordable housing stayed just as high.",
      body: "By 2015–2019, many of these TODs had opened their doors adding hundreds of market-rate apartments near transit. But the low-income renter population surrounding them barely budged. In Roxbury and Jamaica Plain, over half of nearby households were still low-income renters. New supply was flowing in, but it wasn't priced for the people who were already there.",
      callout: null,
    },
    {
      part: "Part 1",
      partTitle: "Boston's affordability crisis",
      periodKey: "2024",
      metric: "lowIncomeRenterShare",
      eyebrow: "2020–2024 · A decade later",
      title: "A decade of TOD construction, and low-income renters are still a dominant population at sites",
      body: "Today, the same transit neighborhoods that were housing-stressed in 2014 remain housing-stressed. The TOD pipeline added thousands of units, but the communities around those stations didn't shift from being predominantly low-income. The affordability crisis didn't change; the supply that arrived just wasn't built for it.",
      callout: null,
    },

    {
      part: "Part 2",
      partTitle: "Can TODs help?",
      periodKey: "2024",
      metric: "renterShare",
      eyebrow: "2020–2024 · Who's most exposed",
      title: "Some TOD neighborhoods are 80–90% renters: a population more vulnerable to Boston's rising housing costs",
      body: "Homeowners build equity when neighborhoods appreciate. Renters face displacement. In neighborhoods like Roxbury and Jamaica Plain, where multiple TODs have opened in the past decade, renters make up the overwhelming majority of households. If TODs could be designed to serve this population, they'd be adding housing precisely where it's needed most. The question is whether they have been.",
      callout: null,
    },
    {
      part: "Part 2",
      partTitle: "Can TODs help?",
      periodKey: "2014",
      metric: "costBurdenedRenterShare",
      eyebrow: "2010–2014 · Cost burden at baseline",
      title: "Before most TODs were completed, more than half of nearby renters were already cost-burdened, spending 30%+ of income on rent",
      body: "Cost burden, spending over 30% of household income on housing, is the federal threshold for unaffordability. In 2010–2014, cost burden was already severe near nearly every future TOD site. The communities these developments were entering were under acute financial pressure. That's exactly a context where affordable TOD supply could have made a real difference.",
      callout: "Cost burden data is available for the 2014 and 2019 periods only.",
    },
    {
      part: "Part 2",
      partTitle: "Can TODs help?",
      periodKey: "2019",
      metric: "costBurdenedRenterShare",
      eyebrow: "2015–2019 · After construction",
      title: "After TODs many opened, cost burden didn't improve. The supply wasn't priced for the demand already there.",
      body: "By 2015–2019, with many TODs open, cost burden at most sites was no better than before. New apartments went to higher-income tenants at rents that existing residents couldn't afford. TODs can, in theory, alleviate cost burden by adding supply near transit. But only if that supply is priced for the people who already live in those neighborhoods.",
      callout: null,
    },

    {
      part: "Part 3",
      partTitle: "The supply-demand gap",
      periodKey: "2014",
      metric: "lowIncomeRenterShare",
      eyebrow: "Roxbury · Before",
      title: "One Roxbury Crossing: before it opened, the surrounding community was overwhelmingly low-income and renter-dominated",
      body: "One Roxbury Crossing opened in 2017 near the Roxbury Crossing Orange Line stop. In 2010–2014, the surrounding neighborhood had among the highest low-income renter concentrations of any TOD site in our dataset with over 60% of households being low-income renters.",
      focusProject: "One Roxbury Crossing- Roxbury Crossing Station, Roxbury",
      focusZoom: 13.6,
      photo: "/images/roxbury-crossing.jpg",
      callout: null,
    },
    {
      part: "Part 3",
      partTitle: "The supply-demand gap",
      periodKey: "2019",
      metric: "lowIncomeRenterShare",
      eyebrow: "Roxbury · After",
      title: "The TOD was completed supplying new housing. Yet, the neighborhood's demand didn't change — the new units weren't built for it.",
      body: "By 2015–2019, the surrounding community was still predominantly low-income renters. Yet the majority of units One Roxbury Crossing added were market-rate with rents that exceeded what most nearby households could afford. This is the supply-demand mismatch at part of the core of Boston's affordability problem: new housing goes in, but not for the people who need it most.",
      focusProject: "One Roxbury Crossing- Roxbury Crossing Station, Roxbury",
      focusZoom: 13.6,
      photo: "/images/roxbury-crossing.jpg",
      callout: null,
    },
    {
      part: "Part 3",
      partTitle: "The supply-demand gap",
      periodKey: "2014",
      metric: "lowIncomeRenterShare",
      eyebrow: "Hingham · Before",
      title: "For contrast: Hingham Intermodal Center was built into a wealthy suburb with far fewer low-income renters nearby",
      body: "Hingham Intermodal Center also opened in 2017 on the South Shore commuter ferry line. But the surrounding context couldn't be more different. In 2010–2014, fewer than 10% of nearby households were low-income renters. The site serves a higher-income commuter population with convenient access to downtown Boston.",
      focusProject: "Hingham Intermodal Center, Hingham",
      focusZoom: 13.4,
      photo: "/images/hingham-intermodal.jpg",
      callout: null,
    },
    {
      part: "Part 3",
      partTitle: "The supply-demand gap",
      periodKey: "2019",
      metric: "lowIncomeRenterShare",
      eyebrow: "Hingham · After",
      title: "Both are called TODs. Only one was built into a community facing an acute affordable housing crisis.",
      body: "By 2015–2019, Hingham remained a low-renter, high-income context, while Roxbury remained a neighborhood with a far larger concentration of low-income renters. The comparison makes clear that not all TOD sites begin with the same level of affordability need. Transit-oriented development may increase housing supply near transit, but it does not inherently produce affordable housing. The real equity question is whether the housing being added near transit matches the affordability pressures of the surrounding community.",
      focusProject: "Hingham Intermodal Center, Hingham",
      focusZoom: 13.4,
      photo: "/images/hingham-intermodal.jpg",
      callout: "Both projects opened in 2017, making them ideal before/after comparison cases using the 2014 (pre) and 2019 (post) ACS windows.",
    },
  ];

  onMount(async () => {
    timelineRows = await loadTimelineData("50k");
    loading = false;

    await tick();

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          activeStep = Number(visible[0].target.dataset.step);
        }
      },
      {
        root: null,
        threshold: [0.15, 0.4, 0.65],
        rootMargin: "0px 0px -30% 0px",
      }
    );

    stepEls.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
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
      <div class="container">
        <p class="section-eyebrow">Transit-Oriented Development & Affordability</p>
        <h1>Boston is adding transit housing. <span class="highlight">But for whom?</span></h1>
        <p class="hero-desc">
          Transit-oriented developments (TODs) have the potential to put housing where people need it: near jobs, near transit, in the heart of the city. But do Boston's TODs actually add housing for the people already living near transit? Scroll through a decade of neighborhood data to see what the supply-demand relationship really looks like.
        </p>
      </div>
    </header>

    <section class="research-summary container">
      <div class="context-grid">
        <div class="info-card">
          <span class="label">Research question</span>
          <p class="main-q">To what extent does the affordable share of current transit-oriented development (TOD) projects in Greater Boston align with nearby lower-income renter demand?</p>
          <p class="sub-text">
            We provide planners and policymakers with a "mismatch score" that measures the gap between new supply and local demand. We analyze data within a 0.5-mile radius of each station to show whether these projects serve the existing community or cater to higher-income residents.
          </p>
        </div>
        <div class="info-card secondary">
          <span class="label">Why is Affordability Important?</span>
          <p>
            Housing affordability determines who can actually afford to live and work in the city. When housing costs exceed 30% of a household's income, families need to cut back on other necessities like healthcare and healthy food. In a city like Boston where so much depends on the T, a lack of affordable housing near transit stations makes it harder for lower-income workers to access reliable transportation. This can push the people who rely most on public transit further away from the city center and result in significantly longer commutes.
          </p>
        </div>
      </div>
    </section>

    <Narrativestory />

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
    <section class="limitations-container container">
      <div class="info-card">
        <p class="main-q">Research Limitations</p>
        <ul class="limitations-list">
          <li>
            Our affordability score is only a rough estimate. Even if affordability reaches "demand" levels, it does not mean the project is meeting those households’ needs in practice.
          </li>
          <li>
            The metric treats all units as serving the same population, regardless of targeted AMI levels, sizes, or rules. Without detailed TOD breakdowns, the comparison was simplified.
          </li>
          <li>
            Lower-income renter households are a proxy for demand, not a direct measure of who is actively seeking housing, who is cost-burdened, or who may be displaced.
          </li>
          <li>
            Focusing on 0.5-mile radii may miss the regional nature of housing markets. TODs serve households beyond immediate tracts, so our comparison may not capture the full picture.
          </li>
          <li>
            This visual highlights relative patterns and possible mismatches rather than definitively proving whether a project meets a specific demand.
          </li>
          <li>
            Project-level data is sometimes incomplete or inconsistent. We used mbtarealty.com, but other sources note different unit counts; we aim to better represent this uncertainty in the future.
          </li>
        </ul>
      </div>
    </section>
  </section>
{/if}

<style>
  :global(body) {
    background-color: #f8fafc;
    color: #1e293b;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    margin: 0;
  }

  .container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 24px;
  }

  .hero-header {
    padding: 10px 0 60px;
    text-align: center;
  }

  .section-eyebrow {
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #b45309;
    margin-bottom: 12px;
  }

  .hero-header h1 {
    font-size: clamp(2.2rem, 5vw, 3.8rem);
    font-weight: 900;
    line-height: 1.1;
    margin-bottom: 24px;
    letter-spacing: -0.04em;
    color: #0f172a;
  }

  .highlight { color: #2563eb; }

  .hero-desc {
    font-size: 1.25rem;
    color: #64748b;
    max-width: 1100px;
    margin: 0 auto;
    line-height: 1.5;
  }

  .research-summary { margin-bottom: 120px; }
  .context-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 24px; }

  .info-card {
    background: white;
    padding: 40px;
    border-radius: 24px;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.04);
    border: 1px solid #e2e8f0;
  }

  .info-card.secondary { background: #1e293b; color: #f8fafc; }
  .info-card .label { display: block; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; margin-bottom: 20px; opacity: 0.7; }
  .main-q { font-size: 1.6rem; font-weight: 800; margin-bottom: 16px; line-height: 1.2; letter-spacing: -0.02em; }
  .sub-text { color: #64748b; font-size: 1.05rem; }

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
    border: 1px solid #e2e8f0;
  }

  .text-stream { flex: 0.7; padding: 0 40px 0 0; }

  .step-eyebrow {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .year-badge {
    background: #f1f5f9;
    color: #475569;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    border: 1px solid #e2e8f0;
    transition: all 0.4s ease;
  }

  .active .year-badge {
    background: #fff7ed;
    color: #b45309;
    border-color: #ffedd5;
  }

  .eyebrow-text {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #94a3b8;
  }

  .part-marker {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 120px 0 30px 20px;
  }

  .part-marker .pill { background: #2563eb; color: white; font-size: 0.65rem; font-weight: 900; padding: 4px 12px; border-radius: 99px; }
  .part-marker .label { font-size: 0.8rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }

  .step-card {
    min-height: 100vh;
    display: flex;
    align-items: center;
    opacity: 0.15;
    transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1),
                transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateY(20px);
  }

  .step-card.active { opacity: 1; transform: translateY(0); }

  .step-content {
    background: white;
    padding: 40px;
    border-radius: 28px;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05);
    border: 1px solid rgba(255,255,255,0.8);
  }

  .step-title { font-size: 1.5rem; font-weight: 800; line-height: 1.25; margin: 0 0 16px; color: #0f172a; letter-spacing: -0.02em; }
  .step-body { font-size: 1.05rem; line-height: 1.6; color: #475569; }

  .focus-details { margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 28px; }
  .tod-photo { margin: 0 0 24px; border-radius: 18px; overflow: hidden; height: 200px; background: #e2e8f0; }
  .tod-photo img { width: 100%; height: 100%; object-fit: cover; }

  .demo-chart { background: #f8fafc; padding: 20px; border-radius: 20px; border: 1px solid #f1f5f9; }
  .chart-header { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 16px; }
  .bar-row { margin-bottom: 14px; }
  .bar-info { display: flex; justify-content: space-between; margin-bottom: 6px; }
  .bar-label { font-size: 0.8rem; font-weight: 600; color: #475569; }
  .bar-value { font-size: 0.8rem; font-weight: 800; color: #0f172a; }
  .bar-track { height: 8px; background: #e2e8f0; border-radius: 10px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 10px; transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1); }

  .step-callout {
    margin-top: 24px;
    display: flex;
    gap: 12px;
    padding: 16px 20px;
    background: #fffbeb;
    border-radius: 14px;
    color: #92400e;
    font-size: 0.9rem;
    line-height: 1.5;
    border: 1px solid #fef3c7;
  }

  .spacer { height: 50vh; }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    color: #64748b;
  }

  .loading-pulse {
    width: 40px;
    height: 40px;
    border: 4px solid #e2e8f0;
    border-top: 4px solid #2563eb;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

.limitations-container {
    margin-top: 50px;
    margin-bottom: 100px;
  }

  .limitations-container .info-card {
    max-width: 100%;
    border-left: 6px solid #94a3b8;
  }

  .limitations-list {
    margin: 24px 0 0;
    padding-left: 20px;
    list-style-type: disc;
  }

  .limitations-list li {
    margin-bottom: 16px;
    line-height: 1.7;
    color: #4b5563;
    font-size: 1.05rem;
    padding-left: 8px;
  }

  .limitations-list li::marker {
    color: #94a3b8;
  }

  .limitations-list li:last-child {
    margin-bottom: 0;
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
  }
</style>

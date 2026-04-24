<script>
  import { onMount, tick } from "svelte";
  import { loadTimelineData } from "$lib/data/timelinedata";
  import TimelineMap from "./timelinemap.svelte";

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
  <section class="timeline-section">

    <header class="section-header">
      <p class="section-eyebrow">Transit-oriented development &amp; affordability</p>
      <h2>Boston is adding transit-oriented housing. But for whom?</h2>
      <p class="section-desc">
        Transit-oriented developments have the potential to put housing where people need it: near jobs,
        near transit, in the heart of the city. But did Boston's TODs actually add housing for the
        people already living near transit? Scroll through a decade of neighborhood data to see
        what the supply-demand relationship really looks like.
      </p>
    </header>

    <div class="scrolly-grid">

      <div class="map-col">
        <TimelineMap {timelineRows} step={steps[activeStep]} />
      </div>

      <div class="text-col">
        {#each steps as step, i}
          {#if breaks.includes(i)}
            <div class="part-header" aria-hidden="true">
              <span class="part-pill">{step.part}</span>
              <span class="part-title">{step.partTitle}</span>
            </div>
          {/if}

          <article
            class="step-card"
            class:active={i === activeStep}
            bind:this={stepEls[i]}
            data-step={i}
          >
            <p class="step-eyebrow">{step.eyebrow}</p>
            <h3 class="step-title">{step.title}</h3>
            <p class="step-body">{step.body}</p>

            {#if step.callout}
              <p class="step-callout">{step.callout}</p>
            {/if}

            <div class="step-progress" aria-hidden="true">
              {#each steps as _, j}
                <span class="pip" class:filled={j === i} class:active={j === activeStep}></span>
              {/each}
            </div>
          </article>
        {/each}

        <div style="height: 30vh"></div>
      </div>
    </div>
  </section>
{/if}

<style>
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 80px;
    color: #64748b;
    font-size: 0.9rem;
  }

  .loading-pulse {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 3px solid #e2e8f0;
    border-top-color: #1e3a5f;
    animation: spin 0.9s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .timeline-section {
    margin-bottom: 80px;
  }

  .section-header {
    max-width: 760px;
    margin: 0 auto 52px;
    text-align: center;
    padding: 0 16px;
  }

  .section-eyebrow {
    margin: 0 0 10px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #b45309;
    font-weight: 800;
  }

  .section-header h2 {
    margin: 0 0 16px;
    font-size: clamp(1.6rem, 3vw, 2.2rem);
    line-height: 1.12;
    color: #0f172a;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .section-desc {
    margin: 0;
    color: #475569;
    line-height: 1.65;
    font-size: 1rem;
  }

  .scrolly-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(300px, 0.7fr);
    gap: 40px;
    align-items: start;
  }

  .map-col {
    position: sticky;
    top: 24px;
    align-self: start;
  }

  .text-col {
    padding-top: 16px;
  }

  .part-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 48px 0 4px;
    padding: 0 0 0 18px;
  }

  .part-header:first-child {
    margin-top: 0;
  }

  .part-pill {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: white;
    background: #1e3a5f;
    border-radius: 100px;
    padding: 3px 9px;
    white-space: nowrap;
  }

  .part-title {
    font-size: 0.78rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }

  .step-card {
    padding: 28px 20px 28px 22px;
    border-left: 3px solid #e2e8f0;
    margin-bottom: 0;
    opacity: 0.38;
    transition: opacity 0.3s ease, border-color 0.3s ease;
    min-height: 85vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0;
  }

  .step-card.active {
    opacity: 1;
    border-color: #b45309;
  }

  .step-eyebrow {
    margin: 0 0 10px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    color: #64748b;
  }

  .step-card.active .step-eyebrow {
    color: #b45309;
  }

  .step-title {
    margin: 0 0 14px;
    font-size: 1.05rem;
    line-height: 1.35;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.01em;
  }

  .step-body {
    margin: 0;
    color: #475569;
    line-height: 1.68;
    font-size: 0.93rem;
    flex-grow: 1;
  }

  .step-callout {
    margin: 14px 0 0;
    padding: 10px 14px;
    background: #fffbeb;
    border-radius: 8px;
    border-left: 3px solid #f59e0b;
    font-size: 0.8rem;
    color: #78350f;
    line-height: 1.5;
  }

  .step-progress {
    display: flex;
    gap: 5px;
    margin-top: 20px;
  }

  .pip {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #e2e8f0;
    transition: background 0.2s ease, transform 0.2s ease;
  }

  .pip.filled {
    background: #94a3b8;
  }

  .pip.active {
    background: #b45309;
    transform: scale(1.4);
  }

  @media (max-width: 1050px) {
    .scrolly-grid {
      grid-template-columns: 1fr;
    }

    .map-col {
      position: static;
    }

    .step-card {
      min-height: auto;
      opacity: 1;
      border-color: #cbd5e1;
      padding: 20px 0 20px 16px;
    }

    .step-card.active {
      border-color: #b45309;
    }
  }
</style>
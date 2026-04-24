<script>
  import { onMount, tick } from "svelte";

  const steps = [
    {
      eyebrow: "Step 1 · Setting the scene",
      title: "Meet Maya — searching for an apartment near the T",
      body: "Maya earns $52,000 a year working as a dental hygienist in Dorchester. She wants to live within a 10-minute walk of an Orange Line station so she can get to work without a car. Her budget: around $1,300/month — the maximum she can spend without being cost-burdened.",
      stats: [
        { label: "Annual income", val: "$52k" },
        { label: "Max rent (30%)", val: "$1,300/mo" },
        { label: "Area median income", val: "~74% AMI" },
      ],
    },
    {
      eyebrow: "Step 2 · What's being built",
      title: "A new TOD opens near her target station",
      body: "A developer just completed a 200-unit transit-oriented development half a mile from Forest Hills. The building advertises itself as 'mixed-income' — but what does that actually mean for Maya?",
      stats: [
        { label: "Total units", val: "200" },
        { label: "Affordable units", val: "20 (10%)" },
        { label: "AMI target", val: "≤80% AMI" },
      ],
    },
    {
      eyebrow: "Step 3 · The mismatch",
      title: "Her income qualifies — but she's too late",
      body: "Maya earns about 74% AMI, so she technically qualifies for the affordable units. But those 20 units received over 400 applications in the lottery. The other 180 market-rate units start at $2,400/month — nearly double her budget.",
      stats: [
        { label: "Lottery odds", val: "1 in 20" },
        { label: "Market-rate starting rent", val: "$2,400/mo" },
        { label: "Over Maya's budget by", val: "+$1,100/mo" },
      ],
    },
    {
      eyebrow: "Step 4 · The neighborhood context",
      title: "She's not alone — most nearby renters face the same gap",
      body: "Within 0.5 miles of this station, 48% of renters earn under $50k. But only 10% of the new development's units are affordable. This gap — the mismatch score — is what is measured across all Boston TODs.",
      stats: [
        { label: "Nearby renters under $50k", val: "48%" },
        { label: "Affordable share of TOD", val: "10%" },
        { label: "Mismatch score", val: "−38 pts" },
      ],
    },
    {
      eyebrow: "Step 5 · What this means",
      title: "TODs can exclude the transit-dependent residents they're meant to serve",
      body: "Maya ends up commuting 45 minutes from Brockton because no affordable unit opened near her station.",
      stats: [
        { label: "Maya's new commute", val: "45 min" },
        { label: "TODs with negative mismatch", val: "Most" },
      ],
    },
  ];

  let activeStep = 0;
  let stepEls = [];

  onMount(async () => {
    await tick();
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) activeStep = Number(visible[0].target.dataset.step);
      },
      { root: null, threshold: [0.15, 0.4, 0.65], rootMargin: "0px 0px -30% 0px" }
    );
    stepEls.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  });
</script>

<section class="maya-container">
  <div class="scrolly-grid">

    <div class="sticky-panel">
      <div class="panel-inner">

        <!-- VISUAL AREA — swaps per step -->
        <div class="visual-area">

          {#if activeStep === 0}
            <!-- Income vs median bar chart -->
            <p class="vis-title">Maya's income vs Boston renters</p>
            <div class="bar-group">
              <div class="bar-row-vis">
                <span class="bar-name">Maya</span>
                <div class="bar-track-vis">
                  <div class="bar-fill-vis" style="width: 61%; background: #2563eb;"></div>
                </div>
                <span class="bar-val">$52k</span>
              </div>
              <div class="bar-row-vis">
                <span class="bar-name">Median Boston renter</span>
                <div class="bar-track-vis">
                  <div class="bar-fill-vis" style="width: 85%; background: #94a3b8;"></div>
                </div>
                <span class="bar-val">$70k</span>
              </div>
              <div class="bar-row-vis">
                <span class="bar-name">Boston AMI</span>
                <div class="bar-track-vis">
                  <div class="bar-fill-vis" style="width: 100%; background: #e2e8f0;"></div>
                </div>
                <span class="bar-val">$85k</span>
              </div>
            </div>
            <div class="budget-callout">
              At 30% of income, Maya's max affordable rent is <strong>$1,300/mo</strong>
            </div>

          {:else if activeStep === 1}
            <!-- Unit breakdown donut-style -->
            <p class="vis-title">200 units — who are they for?</p>
            <div class="donut-wrap">
              <svg viewBox="0 0 200 200" width="160" height="160">
                <!-- market rate: 90% = 324deg, affordable: 10% = 36deg -->
                <!-- full gray circle -->
                <circle cx="100" cy="100" r="70" fill="none" stroke="#e2e8f0" stroke-width="28"/>
                <!-- affordable slice (10%) in blue, starting from top (-90deg) -->
                <circle cx="100" cy="100" r="70" fill="none" stroke="#2563eb" stroke-width="28"
                  stroke-dasharray="43.98 395.84"
                  stroke-dashoffset="0"
                  transform="rotate(-90 100 100)"/>
                <text x="100" y="95" text-anchor="middle" font-size="22" font-weight="800" fill="#0f172a">10%</text>
                <text x="100" y="115" text-anchor="middle" font-size="11" fill="#64748b">affordable</text>
              </svg>
              <div class="donut-legend">
                <div class="legend-item"><span class="dot" style="background:#2563eb"></span> 20 affordable units</div>
                <div class="legend-item"><span class="dot" style="background:#e2e8f0"></span> 180 market-rate units</div>
              </div>
            </div>
            <div class="budget-callout">
              Market-rate units start at <strong>$2,400/mo</strong> — Maya's entire monthly budget is $1,300
            </div>

          {:else if activeStep === 2}
            <!-- Cost burden gauge -->
            <p class="vis-title">How much of Maya's income goes to rent?</p>
            <div class="gauge-wrap">
              <svg viewBox="0 0 240 140" width="100%">
                <!-- background arc -->
                <path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke="#e2e8f0" stroke-width="20" stroke-linecap="round"/>
                <!-- affordable threshold arc (30%) -->
                <path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke="#bbf7d0" stroke-width="20" stroke-linecap="round"
                  stroke-dasharray="94.2 314"
                  stroke-dashoffset="0"/>
                <!-- market rent burden arc (55%) — blue -->
                <path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke="#2563eb" stroke-width="20" stroke-linecap="round"
                  stroke-dasharray="172.7 314"
                  stroke-dashoffset="0"/>
                <!-- 30% threshold marker line -->
                <line x1="120" y1="20" x2="120" y2="36" stroke="#64748b" stroke-width="1.5" stroke-dasharray="3 2"/>
                <text x="120" y="14" text-anchor="middle" font-size="9" fill="#64748b">30% threshold</text>
                <!-- center label -->
                <text x="120" y="105" text-anchor="middle" font-size="28" font-weight="800" fill="#2563eb">55%</text>
                <text x="120" y="122" text-anchor="middle" font-size="10" fill="#475569">of income to market rent</text>
              </svg>
            </div>
            <div class="gauge-labels">
              <div class="gauge-label safe"><span class="dot" style="background:#bbf7d0; border: 1px solid #86efac;"></span> Affordable ≤30%</div>
              <div class="gauge-label burden"><span class="dot" style="background:#2563eb"></span> Maya at market rate: 55%</div>
            </div>
            <div class="budget-callout">
              Spending 55% of income on rent means cutting back on healthcare, food, and savings
            </div>

          {:else if activeStep === 3}
            <!-- Supply vs demand gap bars -->
            <p class="vis-title">Supply vs demand near this station</p>
            <div class="gap-chart">
              <div class="gap-row">
                <span class="gap-label">Low-income renters nearby</span>
                <div class="gap-track">
                  <div class="gap-fill demand" style="width: 48%;"></div>
                  <span class="gap-pct">48%</span>
                </div>
              </div>
              <div class="gap-row">
                <span class="gap-label">Affordable units in TOD</span>
                <div class="gap-track">
                  <div class="gap-fill supply" style="width: 10%;"></div>
                  <span class="gap-pct">10%</span>
                </div>
              </div>
              <div class="mismatch-badge">
                Mismatch score: <strong>−38 pts</strong>
              </div>
            </div>
            <div class="budget-callout">
              For every affordable unit, there are roughly 20 eligible households nearby
            </div>

          {:else if activeStep === 4}
            <!-- Commute tradeoff -->
            <p class="vis-title">The cost of being priced out</p>
            <div class="commute-compare">
              <div class="commute-option">
                <div class="commute-icon near">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
                </div>
                <p class="commute-place">Near TOD</p>
                <p class="commute-stat unaffordable">$2,400/mo</p>
                <p class="commute-sub">10 min commute</p>
                <p class="commute-sub red">55% of income</p>
              </div>
              <div class="commute-vs">vs</div>
              <div class="commute-option">
                <div class="commute-icon far">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
                </div>
                <p class="commute-place">Brockton</p>
                <p class="commute-stat affordable">$1,200/mo</p>
                <p class="commute-sub">45 min commute</p>
                <p class="commute-sub green">28% of income</p>
              </div>
            </div>
            <div class="budget-callout">
              Maya saves money but loses nearly 90 minutes of her day to commuting
            </div>
          {/if}

        </div>

        <!-- progress dots -->
        <div class="progress-track">
          {#each steps as _, i}
            <div class="progress-dot" class:active={i === activeStep} class:past={i < activeStep}></div>
          {/each}
          <p class="progress-label">Step {activeStep + 1} of {steps.length}</p>
        </div>

      </div>
    </div>

    <div class="text-stream">
      {#each steps as step, i}
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
            <div class="stat-row">
              {#each step.stats as stat}
                <div class="stat-pill">
                  <strong>{stat.val}</strong>
                  {stat.label}
                </div>
              {/each}
            </div>
          </div>
        </article>
      {/each}
      <div class="spacer"></div>
    </div>

  </div>
</section>

<style>
  .maya-container { background: #f8fafc; }

  .scrolly-grid {
    display: flex;
    position: relative;
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 24px;
  }

  .sticky-panel {
    flex: 1.3;
    height: 100vh;
    position: sticky;
    top: 0;
    padding: 32px;
    display: flex;
    align-items: center;
  }

  .panel-inner {
    background: white;
    border-radius: 28px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.08);
    padding: 36px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .visual-area { width: 100%; }

  .vis-title {
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #94a3b8;
    margin: 0 0 16px;
  }

  /* Step 1 — income bars */
  .bar-group { display: flex; flex-direction: column; gap: 14px; margin-bottom: 16px; }
  .bar-row-vis { display: flex; align-items: center; gap: 10px; }
  .bar-name { font-size: 12px; color: #475569; width: 140px; flex-shrink: 0; }
  .bar-track-vis { flex: 1; height: 10px; background: #f1f5f9; border-radius: 6px; overflow: hidden; }
  .bar-fill-vis { height: 100%; border-radius: 6px; transition: width 0.8s cubic-bezier(0.34,1.56,0.64,1); }
  .bar-val { font-size: 12px; font-weight: 700; color: #0f172a; width: 36px; text-align: right; }

  /* Step 2 — donut */
  .donut-wrap { display: flex; align-items: center; gap: 20px; margin-bottom: 16px; }
  .donut-legend { display: flex; flex-direction: column; gap: 10px; }
  .legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #475569; }
  .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

  /* Step 3 — gauge */
  .gauge-wrap { margin-bottom: 8px; }
  .gauge-labels { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
  .gauge-label { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #475569; }

  /* Step 4 — gap chart */
  .gap-chart { display: flex; flex-direction: column; gap: 14px; margin-bottom: 16px; }
  .gap-row { display: flex; flex-direction: column; gap: 6px; }
  .gap-label { font-size: 12px; color: #475569; }
  .gap-track { display: flex; align-items: center; gap: 8px; height: 14px; background: #f1f5f9; border-radius: 8px; overflow: visible; position: relative; }
  .gap-fill { height: 100%; border-radius: 8px; transition: width 0.8s cubic-bezier(0.34,1.56,0.64,1); }
  .gap-fill.demand { background: #f59e0b; }
  .gap-fill.supply { background: #2563eb; }
  .gap-pct { font-size: 11px; font-weight: 800; color: #0f172a; margin-left: 4px; }
  .mismatch-badge {
    margin-top: 4px;
    background: #fff7ed;
    border: 1px solid #ffedd5;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 13px;
    color: #92400e;
  }
  .mismatch-badge strong { color: #b45309; }

  /* Step 5 — commute compare */
  .commute-compare { display: flex; align-items: center; justify-content: space-around; margin-bottom: 16px; }
  .commute-option { text-align: center; }
  .commute-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; }
  .commute-icon.near { background: #eff6ff; }
  .commute-icon.far { background: #f8fafc; border: 1px solid #e2e8f0; }
  .commute-place { font-size: 12px; font-weight: 700; color: #475569; margin: 0 0 4px; }
  .commute-stat { font-size: 1.2rem; font-weight: 800; margin: 0 0 4px; }
  .commute-stat.unaffordable { color: #ef4444; }
  .commute-stat.affordable { color: #22c55e; }
  .commute-sub { font-size: 11px; color: #64748b; margin: 2px 0; }
  .commute-sub.red { color: #ef4444; font-weight: 700; }
  .commute-sub.green { color: #16a34a; font-weight: 700; }
  .commute-vs { font-size: 14px; font-weight: 800; color: #94a3b8; }

  /* shared callout */
  .budget-callout {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 13px;
    color: #475569;
    line-height: 1.5;
  }
  .budget-callout strong { color: #0f172a; }

  /* progress */
  .progress-track { display: flex; align-items: center; gap: 8px; }
  .progress-dot { width: 8px; height: 8px; border-radius: 50%; background: #e2e8f0; transition: background 0.4s ease, transform 0.3s ease; }
  .progress-dot.past { background: #93c5fd; }
  .progress-dot.active { background: #2563eb; transform: scale(1.4); }
  .progress-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; margin: 0 0 0 8px; text-transform: uppercase; letter-spacing: 0.08em; }

  /* right side cards */
  .text-stream { flex: 0.7; padding: 0 40px 0 0; }

  .step-card {
    min-height: 100vh;
    display: flex;
    align-items: center;
    opacity: 0.15;
    transition: opacity 0.6s cubic-bezier(0.4,0,0.2,1), transform 0.6s cubic-bezier(0.4,0,0.2,1);
    transform: translateY(20px);
  }
  .step-card.active { opacity: 1; transform: translateY(0); }

  .step-content {
    background: white;
    padding: 40px;
    border-radius: 28px;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05);
    border: 1px solid rgba(255,255,255,0.8);
    width: 100%;
  }

  .step-eyebrow { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }

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
  .active .year-badge { background: #fff7ed; color: #b45309; border-color: #ffedd5; }

  .eyebrow-text { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; }
  .step-title { font-size: 1.5rem; font-weight: 800; line-height: 1.25; margin: 0 0 16px; color: #0f172a; letter-spacing: -0.02em; }
  .step-body { font-size: 1.05rem; line-height: 1.6; color: #475569; margin: 0; }

  .stat-row { display: flex; gap: 12px; margin-top: 1.5rem; flex-wrap: wrap; }
  .stat-pill { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; font-size: 13px; color: #475569; }
  .stat-pill strong { display: block; font-size: 1.3rem; font-weight: 800; color: #2563eb; margin-bottom: 2px; }

  .spacer { height: 50vh; }

  @media (max-width: 900px) {
    .scrolly-grid { flex-direction: column; }
    .sticky-panel { position: sticky; height: auto; padding: 12px; top: 0; z-index: 10; }
    .panel-inner { border-radius: 20px; padding: 24px; }
    .text-stream { padding: 0 20px; }
    .step-card { min-height: auto; margin-bottom: 60px; opacity: 1; transform: none; }
  }
</style>
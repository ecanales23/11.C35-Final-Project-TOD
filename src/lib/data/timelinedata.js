import { base } from "$app/paths";

export async function loadTimelineData(threshold = "50k") {
  const [p14, p19, p24] = await Promise.all([
    fetch(`${base}/data/TOD_2014_WeightedDemographics.geojson`).then(r => r.json()),
    fetch(`${base}/data/TOD_2019_WeightedDemographics.geojson`).then(r => r.json()),
    fetch(`${base}/data/TOD_2024_WeightedDemographics.geojson`).then(r => r.json()),
  ]);

  const rows = [];

  function extractMetrics(props, periodKey, threshold) {
    let ownerLower, renterLower, totalOwner, totalRenter,
        costBurdenedRenters = null;

    if (periodKey === "2014") {
      const total = props["j_wtd_C_Total"] ?? 0;
      totalOwner  = props["j_wtd_C_Total:Owner-occupied housing units"] ?? 0;
      totalRenter = props["j_wtd_C_Total:Renter-occupied housing units"] ?? 0;

      const rLt20  = props["j_wtd_C_Total:Renter-occupied housing units:Less than $20,000"] ?? 0;
      const r20_35 = props["j_wtd_C_Total:Renter-occupied housing units:$20,000 to $34,999"] ?? 0;
      const r35_50 = props["j_wtd_C_Total:Renter-occupied housing units:$35,000 to $49,999"] ?? 0;
      const r50_75 = props["j_wtd_C_Total:Renter-occupied housing units:$50,000 to $74,999"] ?? 0;

      const oLt20  = props["j_wtd_C_Total:Owner-occupied housing units:Less than $20,000"] ?? 0;
      const o20_35 = props["j_wtd_C_Total:Owner-occupied housing units:$20,000 to $34,999"] ?? 0;
      const o35_50 = props["j_wtd_C_Total:Owner-occupied housing units:$35,000 to $49,999"] ?? 0;
      const o50_75 = props["j_wtd_C_Total:Owner-occupied housing units:$50,000 to $74,999"] ?? 0;

      if (threshold === "35k") {
        renterLower = rLt20 + r20_35;
        ownerLower  = oLt20 + o20_35;
      } else if (threshold === "75k") {
        renterLower = rLt20 + r20_35 + r35_50 + r50_75;
        ownerLower  = oLt20 + o20_35 + o35_50 + o50_75;
      } else { // 50k default
        renterLower = rLt20 + r20_35 + r35_50;
        ownerLower  = oLt20 + o20_35 + o35_50;
      }

      costBurdenedRenters =
        (props["j_wtd_C_Total:Renter-occupied housing units:Less than $20,000:30 percent or more"] ?? 0) +
        (props["j_wtd_C_Total:Renter-occupied housing units:$20,000 to $34,999:30 percent or more"] ?? 0) +
        (props["j_wtd_C_Total:Renter-occupied housing units:$35,000 to $49,999:30 percent or more"] ?? 0) +
        (props["j_wtd_C_Total:Renter-occupied housing units:$50,000 to $74,999:30 percent or more"] ?? 0) +
        (props["j_wtd_C_Total:Renter-occupied housing units:$75,000 or more:30 percent or more"] ?? 0);

    } else if (periodKey === "2019") {
      totalOwner  = props["j_wtd_C_Total: Owner-occupied housing units:"] ?? 0;
      totalRenter = props["j_wtd_C_Total: Renter-occupied housing units:"] ?? 0;

      const rLt20  = props["j_wtd_C_Total: Renter-occupied housing units: Less than $20,000:"] ?? 0;
      const r20_35 = props["j_wtd_C_Total: Renter-occupied housing units: $20,000 to $34,999:"] ?? 0;
      const r35_50 = props["j_wtd_C_Total: Renter-occupied housing units: $35,000 to $49,999:"] ?? 0;
      const r50_75 = props["j_wtd_C_Total: Renter-occupied housing units: $50,000 to $74,999:"] ?? 0;

      const oLt20  = props["j_wtd_C_Total: Owner-occupied housing units: Less than $20,000:"] ?? 0;
      const o20_35 = props["j_wtd_C_Total: Owner-occupied housing units: $20,000 to $34,999:"] ?? 0;
      const o35_50 = props["j_wtd_C_Total: Owner-occupied housing units: $35,000 to $49,999:"] ?? 0;
      const o50_75 = props["j_wtd_C_Total: Owner-occupied housing units: $50,000 to $74,999:"] ?? 0;

      if (threshold === "35k") {
        renterLower = rLt20 + r20_35;
        ownerLower  = oLt20 + o20_35;
      } else if (threshold === "75k") {
        renterLower = rLt20 + r20_35 + r35_50 + r50_75;
        ownerLower  = oLt20 + o20_35 + o35_50 + o50_75;
      } else {
        renterLower = rLt20 + r20_35 + r35_50;
        ownerLower  = oLt20 + o20_35 + o35_50;
      }

      costBurdenedRenters =
        (props["j_wtd_C_Total: Renter-occupied housing units: Less than $20,000: 30 percent or more"] ?? 0) +
        (props["j_wtd_C_Total: Renter-occupied housing units: $20,000 to $34,999: 30 percent or more"] ?? 0) +
        (props["j_wtd_C_Total: Renter-occupied housing units: $35,000 to $49,999: 30 percent or more"] ?? 0) +
        (props["j_wtd_C_Total: Renter-occupied housing units: $50,000 to $74,999: 30 percent or more"] ?? 0) +
        (props["j_wtd_C_Total: Renter-occupied housing units: $75,000 or more: 30 percent or more"] ?? 0);

    } else {
      // 2024
      totalOwner  = props["Owner-Occupied Housing Units"] ?? 0;
      totalRenter = props["Renter-Occupied Housing Units"] ?? 0;

      const rLt20  = props["Renter-Occupied Housing Units: Less Than $20,000"] ?? 0;
      const r20_35 = props["Renter-Occupied Housing Units: $20,000 To $34,999"] ?? 0;
      const r35_50 = props["Renter-Occupied Housing Units: $35,000 To $49,999"] ?? 0;
      const r50_75 = props["Renter-Occupied Housing Units: $50,000 To $74,999"] ?? 0;

      const oLt20  = props["Owner-Occupied Housing Units: Less Than $20,000"] ?? 0;
      const o20_35 = props["Owner-Occupied Housing Units: $20,000 To $34,999"] ?? 0;
      const o35_50 = props["Owner-Occupied Housing Units: $35,000 To $49,999"] ?? 0;
      const o50_75 = props["Owner-Occupied Housing Units: $50,000 To $74,999"] ?? 0;

      if (threshold === "35k") {
        renterLower = rLt20 + r20_35;
        ownerLower  = oLt20 + o20_35;
      } else if (threshold === "75k") {
        renterLower = rLt20 + r20_35 + r35_50 + r50_75;
        ownerLower  = oLt20 + o20_35 + o35_50 + o50_75;
      } else {
        renterLower = rLt20 + r20_35 + r35_50;
        ownerLower  = oLt20 + o20_35 + o35_50;
      }
      // no cost burden data for 2024
      costBurdenedRenters = null;
    }

    const occupiedTotal = totalOwner + totalRenter;

    return {
      totalOwner,
      totalRenter,
      occupiedTotal,
      ownerLower,
      renterLower,
      renterShare:            occupiedTotal > 0 ? totalRenter / occupiedTotal : 0,
      lowIncomeHouseholdShare: occupiedTotal > 0 ? (ownerLower + renterLower) / occupiedTotal : 0,
      lowIncomeRenterShare:   occupiedTotal > 0 ? renterLower / occupiedTotal : 0,
      costBurdenedRenterShare: costBurdenedRenters !== null && totalRenter > 0
        ? costBurdenedRenters / totalRenter
        : null,
    };
  }

  const periodMap = [
    { gj: p14, periodKey: "2014", period: "2010–2014" },
    { gj: p19, periodKey: "2019", period: "2015–2019" },
    { gj: p24, periodKey: "2024", period: "2020–2024" },
  ];

  for (const { gj, periodKey, period } of periodMap) {
    for (const feature of gj.features) {
      const props = feature.properties;
      const project = String(props.Project ?? "").trim();
      if (!project) continue;

      const metrics = extractMetrics(props, periodKey, threshold);

      rows.push({
        project,
        period,
        periodKey,
        geometry: feature.geometry,
        ...metrics,
      });
    }
  }

  return rows;
}
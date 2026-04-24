import * as d3 from "d3";

function num(v) {
  const n = +v;
  return Number.isFinite(n) ? n : 0;
}

function cleanProjectName(name = "") {
  return String(name).trim();
}

function normalizeProjectName(name = "") {
  return cleanProjectName(name)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['".,()/:-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function totalsForThreshold(ownerBins, renterBins, threshold = "50k") {
  let ownerLower = 0;
  let renterLower = 0;

  if (threshold === "35k") {
    ownerLower = ownerBins.zeroNeg + ownerBins.lt20 + ownerBins.x20_35;
    renterLower = renterBins.zeroNeg + renterBins.lt20 + renterBins.x20_35;
  } else if (threshold === "75k") {
    ownerLower =
      ownerBins.zeroNeg +
      ownerBins.lt20 +
      ownerBins.x20_35 +
      ownerBins.x35_50 +
      ownerBins.x50_75;
    renterLower =
      renterBins.zeroNeg +
      renterBins.lt20 +
      renterBins.x20_35 +
      renterBins.x35_50 +
      renterBins.x50_75;
  } else {
    ownerLower =
      ownerBins.zeroNeg + ownerBins.lt20 + ownerBins.x20_35 + ownerBins.x35_50;
    renterLower =
      renterBins.zeroNeg +
      renterBins.lt20 +
      renterBins.x20_35 +
      renterBins.x35_50;
  }

  return { ownerLower, renterLower };
}

function computeCostBurdenedRenters(burdenBins) {
  return (
    (burdenBins.lt20_30plus || 0) +
    (burdenBins.x20_35_30plus || 0) +
    (burdenBins.x35_50_30plus || 0) +
    (burdenBins.x50_75_30plus || 0) +
    (burdenBins.x75plus_30plus || 0)
  );
}

function makeMetrics(
  project,
  period,
  periodKey,
  ownerBins,
  renterBins,
  renterBurdenBins, 
  geometry,
  threshold = "50k"
) {
  const totalOwner = d3.sum(Object.values(ownerBins));
  const totalRenter = d3.sum(Object.values(renterBins));
  const occupiedTotal = totalOwner + totalRenter;

  const { ownerLower, renterLower } = totalsForThreshold(
    ownerBins,
    renterBins,
    threshold
  );

  const costBurdenedRenters = renterBurdenBins
    ? computeCostBurdenedRenters(renterBurdenBins)
    : null;

  return {
    project,
    normalizedProject: normalizeProjectName(project),
    period,
    periodKey,
    geometry,
    totalOwner,
    totalRenter,
    occupiedTotal,
    ownerLower,
    renterLower,

    renterShare: occupiedTotal > 0 ? totalRenter / occupiedTotal : 0,
    lowIncomeHouseholdShare:
      occupiedTotal > 0 ? (ownerLower + renterLower) / occupiedTotal : 0,
    lowIncomeRenterShare:
      occupiedTotal > 0 ? renterLower / occupiedTotal : 0,

    costBurdenedRenterShare:
      renterBurdenBins && totalRenter > 0
        ? costBurdenedRenters / totalRenter
        : null,

    lowIncomeCostBurdenedShare:
      renterBurdenBins && occupiedTotal > 0
        ? ((renterBurdenBins.lt20_30plus || 0) +
            (renterBurdenBins.x20_35_30plus || 0) +
            (renterBurdenBins.x35_50_30plus || 0)) /
          occupiedTotal
        : null,
  };
}

export async function loadTimelineData(threshold = "50k") {
  const [histRows, currentRows, geojson] = await Promise.all([
    d3.csv("/data/TOD_14_19_WeightedDemographics.csv"),
    d3.csv("/data/TODLocation+BufferDemoAvgs.csv"),
    d3.json("/data/TODLocations_4.4.26.geojson"),
  ]);

  const geometryByNormalizedName = new Map(
    geojson.features.map((f) => [
      normalizeProjectName(f.properties.j_Project),
      f.geometry,
    ])
  );

  const rows = [];

  for (const row of histRows) {
    const project = cleanProjectName(row["Project"]);
    const geometry =
      geometryByNormalizedName.get(normalizeProjectName(project)) ?? null;

    const ownerBins14 = {
      lt20: num(
        row[
          "wtd_14_Total:Owner-occupied housing units:Less than $20,000"
        ]
      ),
      x20_35: num(
        row[
          "wtd_14_Total:Owner-occupied housing units:$20,000 to $34,999"
        ]
      ),
      x35_50: num(
        row[
          "wtd_14_Total:Owner-occupied housing units:$35,000 to $49,999"
        ]
      ),
      x50_75: num(
        row[
          "wtd_14_Total:Owner-occupied housing units:$50,000 to $74,999"
        ]
      ),
      x75plus: num(
        row["wtd_14_Total:Owner-occupied housing units:$75,000 or more"]
      ),
      zeroNeg: num(
        row[
          "wtd_14_Total:Owner-occupied housing units:Zero or negative income"
        ]
      ),
    };

    const renterBins14 = {
      lt20: num(
        row[
          "wtd_14_Total:Renter-occupied housing units:Less than $20,000"
        ]
      ),
      x20_35: num(
        row[
          "wtd_14_Total:Renter-occupied housing units:$20,000 to $34,999"
        ]
      ),
      x35_50: num(
        row[
          "wtd_14_Total:Renter-occupied housing units:$35,000 to $49,999"
        ]
      ),
      x50_75: num(
        row[
          "wtd_14_Total:Renter-occupied housing units:$50,000 to $74,999"
        ]
      ),
      x75plus: num(
        row["wtd_14_Total:Renter-occupied housing units:$75,000 or more"]
      ),
      zeroNeg: num(
        row[
          "wtd_14_Total:Renter-occupied housing units:Zero or negative income"
        ]
      ),
    };

    const renterBurdenBins14 = {
      lt20_30plus: num(
        row[
          "wtd_14_Total:Renter-occupied housing units:Less than $20,000:30 percent or more"
        ]
      ),
      x20_35_30plus: num(
        row[
          "wtd_14_Total:Renter-occupied housing units:$20,000 to $34,999:30 percent or more"
        ]
      ),
      x35_50_30plus: num(
        row[
          "wtd_14_Total:Renter-occupied housing units:$35,000 to $49,999:30 percent or more"
        ]
      ),
      x50_75_30plus: num(
        row[
          "wtd_14_Total:Renter-occupied housing units:$50,000 to $74,999:30 percent or more"
        ]
      ),
      x75plus_30plus: num(
        row[
          "wtd_14_Total:Renter-occupied housing units:$75,000 or more:30 percent or more"
        ]
      ),
    };

    rows.push(
      makeMetrics(
        project,
        "2010–2014",
        "2014",
        ownerBins14,
        renterBins14,
        renterBurdenBins14,
        geometry,
        threshold
      )
    );

    const ownerBins19 = {
      lt20: num(
        row[
          "wtd_19_Total: Owner-occupied housing units: Less than $20,000:"
        ]
      ),
      x20_35: num(
        row[
          "wtd_19_Total: Owner-occupied housing units: $20,000 to $34,999:"
        ]
      ),
      x35_50: num(
        row[
          "wtd_19_Total: Owner-occupied housing units: $35,000 to $49,999:"
        ]
      ),
      x50_75: num(
        row[
          "wtd_19_Total: Owner-occupied housing units: $50,000 to $74,999:"
        ]
      ),
      x75plus: num(
        row[
          "wtd_19_Total: Owner-occupied housing units: $75,000 or more:"
        ]
      ),
      zeroNeg: num(
        row[
          "wtd_19_Total: Owner-occupied housing units: Zero or negative income"
        ]
      ),
    };

    const renterBins19 = {
      lt20: num(
        row[
          "wtd_19_Total: Renter-occupied housing units: Less than $20,000:"
        ]
      ),
      x20_35: num(
        row[
          "wtd_19_Total: Renter-occupied housing units: $20,000 to $34,999:"
        ]
      ),
      x35_50: num(
        row[
          "wtd_19_Total: Renter-occupied housing units: $35,000 to $49,999:"
        ]
      ),
      x50_75: num(
        row[
          "wtd_19_Total: Renter-occupied housing units: $50,000 to $74,999:"
        ]
      ),
      x75plus: num(
        row[
          "wtd_19_Total: Renter-occupied housing units: $75,000 or more:"
        ]
      ),
      zeroNeg: num(
        row[
          "wtd_19_Total: Renter-occupied housing units: Zero or negative income"
        ]
      ),
    };

    const renterBurdenBins19 = {
      lt20_30plus: num(
        row[
          "wtd_19_Total: Renter-occupied housing units: Less than $20,000: 30 percent or more"
        ]
      ),
      x20_35_30plus: num(
        row[
          "wtd_19_Total: Renter-occupied housing units: $20,000 to $34,999: 30 percent or more"
        ]
      ),
      x35_50_30plus: num(
        row[
          "wtd_19_Total: Renter-occupied housing units: $35,000 to $49,999: 30 percent or more"
        ]
      ),
      x50_75_30plus: num(
        row[
          "wtd_19_Total: Renter-occupied housing units: $50,000 to $74,999: 30 percent or more"
        ]
      ),
      x75plus_30plus: num(
        row[
          "wtd_19_Total: Renter-occupied housing units: $75,000 or more: 30 percent or more"
        ]
      ),
    };

    rows.push(
      makeMetrics(
        project,
        "2015–2019",
        "2019",
        ownerBins19,
        renterBins19,
        renterBurdenBins19,
        geometry,
        threshold
      )
    );
  }

  for (const row of currentRows) {
    const project = cleanProjectName(row["j_Project"]);
    const geometry =
      geometryByNormalizedName.get(normalizeProjectName(project)) ?? null;

    const ownerBins24 = {
      lt20: num(row["D_Owner-Occupied Housing Units: Less Than $20,000"]),
      x20_35: num(
        row["D_Owner-Occupied Housing Units: $20,000 To $34,999"]
      ),
      x35_50: num(
        row["D_Owner-Occupied Housing Units: $35,000 To $49,999"]
      ),
      x50_75: num(
        row["D_Owner-Occupied Housing Units: $50,000 To $74,999"]
      ),
      x75plus: num(row["D_Owner-Occupied Housing Units: $75,000 Or More"]),
      zeroNeg: num(
        row["D_Owner-Occupied Housing Units: Zero Or Negative Income"]
      ),
    };

    const renterBins24 = {
      lt20: num(row["D_Renter-Occupied Housing Units: Less Than $20,000"]),
      x20_35: num(
        row["D_Renter-Occupied Housing Units: $20,000 To $34,999"]
      ),
      x35_50: num(
        row["D_Renter-Occupied Housing Units: $35,000 To $49,999"]
      ),
      x50_75: num(
        row["D_Renter-Occupied Housing Units: $50,000 To $74,999"]
      ),
      x75plus: num(row["D_Renter-Occupied Housing Units: $75,000 Or More"]),
      zeroNeg: num(
        row["D_Renter-Occupied Housing Units: Zero Or Negative Income"]
      ),
    };

    rows.push(
      makeMetrics(
        project,
        "2020–2024",
        "2024",
        ownerBins24,
        renterBins24,
        null,
        geometry,
        threshold
      )
    );
  }

  return rows.filter((d) => d.geometry);
}
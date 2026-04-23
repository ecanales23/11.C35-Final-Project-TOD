import * as d3 from "d3";

function num(v) {
  const n = +v;
  return Number.isFinite(n) ? n : 0;
}

function cleanProjectName(name = "") {
  return String(name).trim();
}

function getThresholdTotals(bins, threshold = "50k") {
  const total = d3.sum(Object.values(bins));
  let lower = 0;

  if (threshold === "35k") {
    lower = bins.zeroNeg + bins.lt20 + bins.x20_35;
  } else if (threshold === "75k") {
    lower = bins.zeroNeg + bins.lt20 + bins.x20_35 + bins.x35_50 + bins.x50_75;
  } else {
    lower = bins.zeroNeg + bins.lt20 + bins.x20_35 + bins.x35_50;
  }

  return {
    total,
    lower,
    share: total > 0 ? lower / total : 0
  };
}

function parse2014(row, threshold) {
  const bins = {
    zeroNeg: num(row["wtd_14_Total:Renter-occupied housing units:Zero or negative income"]),
    lt20: num(row["wtd_14_Total:Renter-occupied housing units:Less than $20,000"]),
    x20_35: num(row["wtd_14_Total:Renter-occupied housing units:$20,000 to $34,999"]),
    x35_50: num(row["wtd_14_Total:Renter-occupied housing units:$35,000 to $49,999"]),
    x50_75: num(row["wtd_14_Total:Renter-occupied housing units:$50,000 to $74,999"]),
    x75plus: num(row["wtd_14_Total:Renter-occupied housing units:$75,000 or more"])
  };

  const { total, lower, share } = getThresholdTotals(bins, threshold);

  return {
    project: cleanProjectName(row["Project"]),
    period: "2010–2014",
    periodKey: "2014",
    totalRenters: total,
    lowerIncomeRenters: lower,
    lowerIncomeShare: share,
    bins
  };
}

function parse2019(row, threshold) {
  const bins = {
    zeroNeg: num(row["wtd_19_Total: Renter-occupied housing units: Zero or negative income"]),
    lt20: num(row["wtd_19_Total: Renter-occupied housing units: Less than $20,000:"]),
    x20_35: num(row["wtd_19_Total: Renter-occupied housing units: $20,000 to $34,999:"]),
    x35_50: num(row["wtd_19_Total: Renter-occupied housing units: $35,000 to $49,999:"]),
    x50_75: num(row["wtd_19_Total: Renter-occupied housing units: $50,000 to $74,999:"]),
    x75plus: num(row["wtd_19_Total: Renter-occupied housing units: $75,000 or more:"])
  };

  const { total, lower, share } = getThresholdTotals(bins, threshold);

  return {
    project: cleanProjectName(row["Project"]),
    period: "2015–2019",
    periodKey: "2019",
    totalRenters: total,
    lowerIncomeRenters: lower,
    lowerIncomeShare: share,
    bins
  };
}

function parse2024(row, threshold) {
  const bins = {
    zeroNeg: num(row["D_Renter-Occupied Housing Units: Zero Or Negative Income"]),
    lt20: num(row["D_Renter-Occupied Housing Units: Less Than $20,000"]),
    x20_35: num(row["D_Renter-Occupied Housing Units: $20,000 To $34,999"]),
    x35_50: num(row["D_Renter-Occupied Housing Units: $35,000 To $49,999"]),
    x50_75: num(row["D_Renter-Occupied Housing Units: $50,000 To $74,999"]),
    x75plus: num(row["D_Renter-Occupied Housing Units: $75,000 Or More"])
  };

  const { total, lower, share } = getThresholdTotals(bins, threshold);

  return {
    project: cleanProjectName(row["j_Project"]),
    period: "2020–2024",
    periodKey: "2024",
    totalRenters: total,
    lowerIncomeRenters: lower,
    lowerIncomeShare: share,
    bins
  };
}

export async function loadHistoricalTOD(threshold = "50k") {
  const [histRows, currentRows] = await Promise.all([
    d3.csv("/data/TOD_14_19_WeightedDemographics.csv"),
    d3.csv("/data/TODLocation+BufferDemoAvgs.csv")
  ]);

  const rows = [];

  for (const row of histRows) {
    rows.push(parse2014(row, threshold));
    rows.push(parse2019(row, threshold));
  }

  for (const row of currentRows) {
    rows.push(parse2024(row, threshold));
  }

  return rows;
}

export function groupHistoryByProject(rows) {
  return d3.groups(rows, d => d.project).map(([project, values]) => ({
    project,
    values: values.sort((a, b) => a.periodKey.localeCompare(b.periodKey))
  }));
}
(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Color palette — index 0 = primary library (emerald), rest = compare libs.
  // ---------------------------------------------------------------------------
  var PALETTE = [
    { border: "#6ee7c5", band: "rgba(110,231,197,0.18)", text: "rgb(167,243,208)" },
    { border: "#93b4ff", band: "rgba(147,180,255,0.16)", text: "rgb(186,213,254)" },
    { border: "#fbbf77", band: "rgba(251,191,119,0.16)", text: "rgb(253,224,169)" },
    { border: "#f472b6", band: "rgba(244,114,182,0.16)", text: "rgb(249,168,212)" },
    { border: "#a78bfa", band: "rgba(167,139,250,0.16)", text: "rgb(196,181,253)" },
  ];

  var ZOOM_STEP_X = 1.15;
  var PAN_PIXELS_X = 120;
  var DISPERSION_IQR_ALERT = 0.25;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function esc(unsafe) {
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtHz(n) {
    if (n === null || n === undefined || !Number.isFinite(n)) {
      return "—";
    }
    return Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  function fmtPctChange(from, to) {
    if (from === null || to === null || from <= 0 || to <= 0) {
      return "—";
    }
    var pct = ((to - from) / from) * 100;
    return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
  }

  function searchNorm(s) {
    return String(s || "").toLowerCase();
  }

  function formatLocal(timestampIso, fallbackFolder) {
    if (!timestampIso) {
      return fallbackFolder || "";
    }
    var d = new Date(timestampIso);
    if (Number.isNaN(d.getTime())) {
      return fallbackFolder || "";
    }
    return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  }

  function medianNumeric(values) {
    var a = values
      .filter(function (v) {
        return typeof v === "number" && Number.isFinite(v) && v > 0;
      })
      .sort(function (x, y) {
        return x - y;
      });
    if (a.length === 0) {
      return null;
    }
    var m = Math.floor(a.length / 2);
    return a.length % 2 === 1 ? a[m] : ((a[m - 1] || 0) + (a[m] || 0)) / 2;
  }

  function ratioFrom(a, b) {
    return typeof a === "number" && typeof b === "number" && a > 0 && b > 0 ? a / b : null;
  }

  function sliceByIndices(arr, indices) {
    return indices.map(function (i) {
      return arr[i];
    });
  }

  // ---------------------------------------------------------------------------
  // DOM refs
  // ---------------------------------------------------------------------------
  var loadingOverlay = document.getElementById("loading-overlay");
  var appEl = document.getElementById("app");
  var pageTitleEl = document.getElementById("page-title");
  var scenarioSelect = document.getElementById("scenario-select");
  var scenarioSearch = document.getElementById("scenario-search");
  var groupFilter = document.getElementById("group-filter");
  var envFilter = document.getElementById("env-filter");
  var showBands = document.getElementById("show-bands");
  var logScale = document.getElementById("log-scale");
  var showRatio = document.getElementById("show-ratio");
  var ratioLabel = document.getElementById("ratio-label");
  var chartSubtitleLine = document.getElementById("chart-subtitle-line");
  var metricsScenarioChip = document.getElementById("metrics-scenario-chip");
  var scenarioWhatLineEl = document.getElementById("scenario-what-line");
  var metricsCardsEl = document.getElementById("metrics-cards");
  var metricsFootnoteEl = document.getElementById("metrics-footnote");
  var multiEnvBanner = document.getElementById("multi-env-banner");
  var pageFooter = document.getElementById("page-footer");
  var snapshotDesc = document.getElementById("snapshot-desc");
  var snapshotTheadRow = document.getElementById("snapshot-thead-row");
  var snapshotTbody = document.getElementById("snapshot-latest-tbody");
  var snapshotMeta = document.getElementById("snapshot-latest-meta");
  var btnZoomIn = document.getElementById("chart-zoom-in");
  var btnZoomOut = document.getElementById("chart-zoom-out");
  var btnPanEarlier = document.getElementById("chart-pan-earlier");
  var btnPanLater = document.getElementById("chart-pan-later");
  var btnResetZoom = document.getElementById("chart-reset-zoom");
  var btnDownload = document.getElementById("chart-download-png");

  var chart = null;
  var resizeScheduled = false;
  /** @type {{ title: string, primaryLibraryKey: string, libraries: any[], runs: any[], scenarios: any[] } | null} */
  var data = null;
  /** Libraries sorted so primary is first, then compares in order. */
  var orderedLibraries = [];
  /** Map: libraryKey → palette entry */
  var paletteMap = {};

  // ---------------------------------------------------------------------------
  // Chart resize helper
  // ---------------------------------------------------------------------------
  function scheduleChartResize() {
    if (!chart || resizeScheduled) {
      return;
    }
    resizeScheduled = true;
    requestAnimationFrame(function () {
      resizeScheduled = false;
      if (chart) {
        chart.resize();
      }
    });
  }
  window.addEventListener("resize", scheduleChartResize);

  // ---------------------------------------------------------------------------
  // Filter helpers
  // ---------------------------------------------------------------------------
  function filteredRunIndices() {
    var key = envFilter.value;
    if (!key) {
      return data.runs.map(function (_, i) {
        return i;
      });
    }
    var out = [];
    for (var i = 0; i < data.runs.length; i++) {
      if (data.runs[i].envKey === key) {
        out.push(i);
      }
    }
    return out;
  }

  function visibleScenarios() {
    var gf = groupFilter.value;
    var q = searchNorm(scenarioSearch.value).trim();
    return data.scenarios.filter(function (s) {
      if (gf && s.group !== gf) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        searchNorm(s.id).includes(q) ||
        searchNorm(s.group).includes(q) ||
        searchNorm(s.what).includes(q)
      );
    });
  }

  // ---------------------------------------------------------------------------
  // KPI cards
  // ---------------------------------------------------------------------------
  function applyKpis() {
    var runCountEl = document.getElementById("kpi-run-count");
    var scenCountEl = document.getElementById("kpi-scenario-count");
    var clockEl = document.getElementById("kpi-latest-clock");
    var verEl = document.getElementById("kpi-lib-versions");
    if (!runCountEl || !scenCountEl || !clockEl || !verEl) {
      return;
    }
    runCountEl.textContent = String(data.runs.length);
    scenCountEl.textContent = String(data.scenarios.length);
    if (data.runs.length === 0) {
      clockEl.textContent = "—";
      verEl.textContent = "—";
      return;
    }
    var lr = data.runs[data.runs.length - 1];
    var clock = formatLocal(lr.timestampIso, lr.folder);
    clockEl.textContent = clock ? clock + " · folder " + lr.folder : lr.folder;
    var versionLines = (lr.libraryVersions || [])
      .map(function (lv) {
        return (
          '<div style="line-height:1.45;margin-top:2px"><span style="color:#a3a3a8">' +
          esc(lv.key) +
          "</span> " +
          esc(lv.version) +
          (lv.gcExposed
            ? ' <span style="color:#fbbf24" title="--expose-gc active">[gc]</span>'
            : "") +
          "</div>"
        );
      })
      .join("");
    verEl.innerHTML = versionLines || "—";
  }

  // ---------------------------------------------------------------------------
  // Environment banner
  // ---------------------------------------------------------------------------
  function refreshEnvBanner() {
    if (!multiEnvBanner) {
      return;
    }
    var keys = [
      ...new Set(
        data.runs.map(function (r) {
          return r.envKey;
        }),
      ),
    ];
    multiEnvBanner.classList.toggle("hidden", keys.length <= 1 || !!envFilter.value);
  }

  // ---------------------------------------------------------------------------
  // Snapshot table
  // ---------------------------------------------------------------------------
  function buildSnapshotTable() {
    if (!snapshotTheadRow || !snapshotTbody || !snapshotMeta) {
      return;
    }
    // Header
    var ths = "<th scope='col'>Scenario</th><th scope='col'>Group</th>";
    for (var li = 0; li < orderedLibraries.length; li++) {
      var lib = orderedLibraries[li];
      ths +=
        "<th scope='col' class='bh-num' style='color:" +
        esc(paletteMap[lib.key].text) +
        "'>" +
        esc(lib.displayName) +
        "</th>";
    }
    // Ratio columns: primary ÷ each compare
    var primaryLib =
      orderedLibraries.find(function (l) {
        return l.isPrimary;
      }) || orderedLibraries[0];
    var compareLibs = orderedLibraries.filter(function (l) {
      return !l.isPrimary;
    });
    for (var ci = 0; ci < compareLibs.length; ci++) {
      ths +=
        "<th scope='col' class='bh-num' style='color:rgb(253,224,169)'>÷ " +
        esc(compareLibs[ci].displayName) +
        "</th>";
    }
    snapshotTheadRow.innerHTML = ths;

    snapshotTbody.innerHTML = "";
    if (data.runs.length === 0) {
      snapshotMeta.textContent = "";
      return;
    }
    var lastIx = data.runs.length - 1;
    data.scenarios.forEach(function (s) {
      var tds = "<td>" + esc(s.id) + "</td><td>" + esc(s.group) + "</td>";
      var libHzValues = {};
      for (var li2 = 0; li2 < orderedLibraries.length; li2++) {
        var libKey = orderedLibraries[li2].key;
        var libData = s.libraries[libKey];
        var hz = libData ? libData.hz[lastIx] : null;
        libHzValues[libKey] = hz;
        var has = typeof hz === "number" && hz > 0;
        tds += "<td class='bh-num'>" + (has ? esc(fmtHz(hz)) : "—") + "</td>";
      }
      var primaryHz = libHzValues[primaryLib ? primaryLib.key : ""];
      for (var ci2 = 0; ci2 < compareLibs.length; ci2++) {
        var cmpHz = libHzValues[compareLibs[ci2].key];
        var ratio = ratioFrom(primaryHz, cmpHz);
        tds += "<td class='bh-num'>" + (ratio !== null ? ratio.toFixed(3) + "×" : "—") + "</td>";
      }
      var rowEl = document.createElement("tr");
      rowEl.innerHTML = tds;
      snapshotTbody.appendChild(rowEl);
    });
    var runMeta = data.runs[lastIx];
    snapshotMeta.textContent =
      "Folder " +
      runMeta.folder +
      " · " +
      formatLocal(runMeta.timestampIso, runMeta.folder) +
      " (local)";
  }

  // ---------------------------------------------------------------------------
  // Scenario select population
  // ---------------------------------------------------------------------------
  function fillScenarioOptions() {
    var list = visibleScenarios();
    var previous = scenarioSelect.value;
    scenarioSelect.innerHTML = "";
    list.forEach(function (s) {
      var opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = "[" + s.group + "] " + s.id;
      scenarioSelect.appendChild(opt);
    });
    if (
      list.some(function (s) {
        return s.id === previous;
      })
    ) {
      scenarioSelect.value = previous;
    } else if (list.length > 0) {
      scenarioSelect.selectedIndex = 0;
    }
  }

  // ---------------------------------------------------------------------------
  // Metrics panel
  // ---------------------------------------------------------------------------
  function updateMetricsPanel(scenarioRow, indices) {
    if (!metricsScenarioChip || !scenarioWhatLineEl || !metricsCardsEl || !metricsFootnoteEl) {
      return;
    }
    if (!scenarioRow || indices.length === 0) {
      metricsScenarioChip.textContent = "";
      metricsScenarioChip.className = "bh-chip bh-chip-ok";
      scenarioWhatLineEl.textContent = "";
      scenarioWhatLineEl.style.display = "none";
      metricsCardsEl.innerHTML = "";
      metricsFootnoteEl.textContent = "";
      return;
    }

    metricsScenarioChip.textContent = "[" + scenarioRow.group + "] " + scenarioRow.id;
    metricsScenarioChip.className = "bh-chip bh-chip-ok";
    scenarioWhatLineEl.style.display = scenarioRow.what ? "block" : "none";
    scenarioWhatLineEl.textContent = scenarioRow.what || "";

    var primaryLib =
      orderedLibraries.find(function (l) {
        return l.isPrimary;
      }) || orderedLibraries[0];
    var compareLibs = orderedLibraries.filter(function (l) {
      return !l.isPrimary;
    });

    var html =
      '<div style="display:grid;gap:0.75rem;grid-template-columns:repeat(auto-fill,minmax(10.5rem,1fr))">';

    var worstIqr = 0;
    orderedLibraries.forEach(function (lib) {
      var libData = scenarioRow.libraries[lib.key];
      if (!libData) {
        return;
      }
      var color = paletteMap[lib.key].text;
      var hzValues = indices
        .map(function (gx) {
          var v = libData.hz[gx];
          return typeof v === "number" && v > 0 ? v : null;
        })
        .filter(Boolean);
      var median = medianNumeric(hzValues);
      var lo = hzValues.length ? Math.min.apply(Math, hzValues) : null;
      var hi = hzValues.length ? Math.max.apply(Math, hzValues) : null;
      var trend =
        hzValues.length >= 2
          ? fmtPctChange(hzValues[0], hzValues[hzValues.length - 1]) + ", newest vs oldest"
          : "—";
      indices.forEach(function (gx) {
        var f = libData.iqrFraction[gx];
        if (typeof f === "number" && Number.isFinite(f)) {
          worstIqr = Math.max(worstIqr, f);
        }
      });
      html +=
        '<div class="bh-card">' +
        '<div class="bh-lbl" style="color:' +
        color +
        '">' +
        esc(lib.displayName) +
        " median hz/op</div>" +
        '<div class="bh-val" style="color:' +
        color +
        '">' +
        (median !== null ? fmtHz(median) + " Hz/op" : "—") +
        "</div>" +
        '<div class="mt-1 font-mono text-[0.72rem]" style="color:rgb(161,161,170)">' +
        (lo !== null && hi !== null ? "Range " + fmtHz(lo) + " … " + fmtHz(hi) : "") +
        "</div>" +
        '<div class="mt-1 text-[0.72rem]" style="color:rgb(161,161,170)">Δ ' +
        trend +
        "</div>" +
        "</div>";
    });

    // Ratio cards
    compareLibs.forEach(function (cmpLib) {
      var primData = scenarioRow.libraries[primaryLib ? primaryLib.key : ""];
      var cmpData = scenarioRow.libraries[cmpLib.key];
      if (!primData || !cmpData) {
        return;
      }
      var ratios = indices
        .map(function (gx) {
          return ratioFrom(primData.hz[gx], cmpData.hz[gx]);
        })
        .filter(function (v) {
          return v !== null;
        });
      var medianRatio = medianNumeric(ratios);
      html +=
        '<div class="bh-card">' +
        '<div class="bh-lbl" style="color:rgb(253,224,169)">Ratio · ' +
        esc((primaryLib || orderedLibraries[0]).displayName) +
        " ÷ " +
        esc(cmpLib.displayName) +
        "</div>" +
        '<div class="bh-val" style="color:rgb(253,224,169)">' +
        (medianRatio !== null ? medianRatio.toFixed(3) + "×" : "—") +
        "</div></div>";
    });

    // IQR card
    html +=
      '<div class="bh-card">' +
      '<div class="bh-lbl">Worst IQR÷median · per plotted run</div>' +
      '<div class="text-[0.78rem] leading-snug" style="color:rgb(212,212,216)">' +
      orderedLibraries
        .map(function (lib) {
          var libData = scenarioRow.libraries[lib.key];
          if (!libData) {
            return lib.displayName + ": —";
          }
          var maxF = 0;
          indices.forEach(function (gx) {
            var f = libData.iqrFraction[gx];
            if (typeof f === "number" && Number.isFinite(f)) {
              maxF = Math.max(maxF, f);
            }
          });
          return lib.displayName + ": " + (maxF > 0 ? (maxF * 100).toFixed(1) + "%" : "—");
        })
        .join(" · ") +
      "</div></div>";

    html += "</div>";
    metricsCardsEl.innerHTML = html;

    var footPieces = [
      indices.length +
        " plotted point(s)" +
        (envFilter.value ? ", environment filter on" : ", all environments"),
    ];
    if (worstIqr > DISPERSION_IQR_ALERT) {
      footPieces.push(
        "elevated per-trial dispersion (IQR above " +
          DISPERSION_IQR_ALERT * 100 +
          "% of median) on ≥1 plotted run — inspect tooltip IQR%",
      );
      metricsScenarioChip.className = "bh-chip bh-chip-warn";
    } else {
      metricsScenarioChip.className = "bh-chip bh-chip-ok";
    }
    metricsFootnoteEl.textContent = footPieces.join(". ") + ".";
  }

  // ---------------------------------------------------------------------------
  // Chart render
  // ---------------------------------------------------------------------------
  function render() {
    var id = scenarioSelect.value;
    var scenarioRow = data.scenarios.find(function (s) {
      return s.id === id;
    });
    var indices = filteredRunIndices();

    if (!scenarioRow || indices.length === 0) {
      if (chart) {
        chart.destroy();
        chart = null;
      }
      updateMetricsPanel(null, []);
      if (chartSubtitleLine) {
        if (indices.length === 0 && data.runs.length > 0) {
          chartSubtitleLine.textContent = "No saved runs match the current Environment filter.";
        } else if (!scenarioRow) {
          chartSubtitleLine.textContent = "No scenario available for these filters.";
        } else {
          chartSubtitleLine.textContent = "";
        }
      }
      return;
    }

    if (chartSubtitleLine) {
      chartSubtitleLine.textContent =
        "[" +
        scenarioRow.group +
        "] " +
        scenarioRow.id +
        " · " +
        indices.length +
        " plotted point(s)" +
        (envFilter.value ? " · environment filter on" : "");
    }

    var labels = indices.map(function (i) {
      var run = data.runs[i];
      return formatLocal(run.timestampIso, run.folder);
    });
    var runsSlice = indices.map(function (i) {
      return data.runs[i];
    });

    var datasets = [];
    var bandOn = showBands.checked;
    var ratioOn = showRatio.checked;

    // Bands and main hz lines per library.
    orderedLibraries.forEach(function (lib) {
      var libData = scenarioRow.libraries[lib.key];
      if (!libData) {
        return;
      }
      var pal = paletteMap[lib.key];
      var hz = sliceByIndices(libData.hz, indices);
      if (bandOn) {
        var p25 = sliceByIndices(libData.p25, indices);
        var p75 = sliceByIndices(libData.p75, indices);
        datasets.push({
          label: lib.displayName + " P25",
          data: p25,
          borderWidth: 0,
          pointRadius: 0,
          borderColor: "transparent",
          backgroundColor: "transparent",
          spanGaps: false,
          yAxisID: "y",
          order: 10,
        });
        datasets.push({
          label: lib.displayName + " P25–P75",
          data: p75,
          borderWidth: 0,
          pointRadius: 0,
          fill: "-1",
          borderColor: "transparent",
          backgroundColor: pal.band,
          spanGaps: false,
          yAxisID: "y",
          order: 10,
        });
      }
      datasets.push({
        label: lib.displayName + " hz/op (median)",
        data: hz,
        borderColor: pal.border,
        backgroundColor: pal.band.replace(/[\d.]+\)$/, "0.08)"),
        spanGaps: false,
        yAxisID: "y",
        tension: 0.12,
        order: 5,
      });
    });

    // Ratio lines: primary ÷ each compare.
    var primaryLib =
      orderedLibraries.find(function (l) {
        return l.isPrimary;
      }) || orderedLibraries[0];
    var compareLibs = orderedLibraries.filter(function (l) {
      return !l.isPrimary;
    });
    var ratioColors = ["#fbbf77", "#f472b6", "#a78bfa", "#34d399"];
    if (ratioOn) {
      compareLibs.forEach(function (cmpLib, ci) {
        var primData = scenarioRow.libraries[primaryLib ? primaryLib.key : ""];
        var cmpData = scenarioRow.libraries[cmpLib.key];
        if (!primData || !cmpData) {
          return;
        }
        var ratioData = indices.map(function (i) {
          return ratioFrom(primData.hz[i], cmpData.hz[i]);
        });
        datasets.push({
          label: (primaryLib || orderedLibraries[0]).displayName + " ÷ " + cmpLib.displayName,
          data: ratioData,
          borderColor: ratioColors[ci % ratioColors.length],
          backgroundColor: "rgba(251,191,119,0.08)",
          spanGaps: true,
          yAxisID: "y1",
          tension: 0.12,
          order: 3,
        });
      });
    }

    var yType = logScale.checked ? "logarithmic" : "linear";
    var scales = {
      x: {
        type: "category",
        offset: true,
        ticks: {
          autoSkip: true,
          maxTicksLimit: Math.min(22, Math.max(labels.length || 2, 2)),
          maxRotation: 52,
          minRotation: 0,
          color: "#999",
        },
        grid: { color: "#2a2a36", drawOnChartArea: true },
      },
      y: {
        type: yType,
        position: "left",
        title: { display: true, text: "hz/op", color: "#aaa" },
        ticks: { color: "#999" },
        grid: { color: "#2a2a36" },
      },
    };
    if (ratioOn) {
      scales.y1 = {
        type: "linear",
        position: "right",
        title: { display: true, text: "ratio", color: "#aaa" },
        ticks: { color: "#b98" },
        grid: { drawOnChartArea: false },
      };
    }

    updateMetricsPanel(scenarioRow, indices);

    var plugins = {
      legend: {
        labels: {
          color: "#ccc",
          filter: function (item) {
            var t = item.text || "";
            return !t.endsWith(" P25") && t.indexOf("P25–P75") < 0;
          },
        },
      },
      tooltip: {
        filter: function (item) {
          var t = item.dataset.label || "";
          return !t.endsWith(" P25") && t.indexOf("P25–P75") < 0;
        },
        callbacks: {
          title: function (items) {
            if (!items.length) {
              return "";
            }
            var idx = items[0].dataIndex;
            var run = runsSlice[idx];
            if (!run) {
              return "";
            }
            var localClock = formatLocal(run.timestampIso, run.folder);
            return localClock ? localClock + " (local)\n" + run.folder : run.folder;
          },
          afterTitle: function (items) {
            if (!items.length) {
              return "";
            }
            var idx = items[0].dataIndex;
            var run = runsSlice[idx];
            if (!run) {
              return "";
            }
            var verLine = (run.libraryVersions || [])
              .map(function (lv) {
                return lv.key + " " + lv.version + (lv.gcExposed ? " [gc]" : "");
              })
              .join(" · ");
            return [
              run.cpuModel + " · " + run.platform + "/" + run.arch,
              "Node " + run.nodeVersion + " · V8 " + run.v8Version,
              verLine,
            ].join("\n");
          },
          label: function (ctx) {
            var v = ctx.raw;
            var lbl = ctx.dataset.label || "";
            if (lbl.indexOf("P25–P75") >= 0 || lbl.endsWith(" P25")) {
              return null;
            }
            if (v === null || v === undefined) {
              return lbl + ": —";
            }
            if (ctx.dataset.yAxisID === "y1") {
              return lbl + ": " + Number(v).toFixed(3) + "×";
            }
            // Find which library this dataset belongs to for IQR annotation.
            var matchedLib = orderedLibraries.find(function (lib) {
              return lbl.startsWith(lib.displayName);
            });
            var extra = "";
            if (matchedLib) {
              var libData2 = scenarioRow.libraries[matchedLib.key];
              if (libData2) {
                var globalIx = indices[ctx.dataIndex];
                var f = globalIx !== undefined ? libData2.iqrFraction[globalIx] : null;
                if (typeof f === "number" && Number.isFinite(f)) {
                  extra = " · IQR " + (f * 100).toFixed(1) + "%";
                }
              }
            }
            return (
              lbl + ": " + Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 }) + extra
            );
          },
        },
      },
    };

    if (typeof ChartZoom !== "undefined") {
      plugins.zoom = {
        pan: { enabled: true, mode: "x" },
        zoom: {
          wheel: { enabled: true, modifierKey: "ctrl" },
          pinch: { enabled: true },
          mode: "x",
          drag: { enabled: false },
        },
        limits: {},
      };
    }

    if (chart) {
      chart.destroy();
    }
    chart = new Chart(document.getElementById("bench-chart"), {
      type: "line",
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: scales,
        plugins: plugins,
        layout: { padding: { top: 4, right: 12 + (ratioOn ? 20 : 0), bottom: 2, left: 12 } },
      },
    });

    // Focus on newest portion.
    (function applyInitialFocus() {
      if (!chart || typeof chart.zoomScale !== "function") {
        return;
      }
      var L = chart.data.labels ? chart.data.labels.length : 0;
      if (L < 6) {
        return;
      }
      var lastIx = L - 1;
      var span = Math.min(Math.max(Math.floor(L * 0.5), 18), Math.min(56, lastIx + 1));
      chart.zoomScale("x", { min: Math.max(0, lastIx - span + 1), max: lastIx }, "none");
    })();
    scheduleChartResize();
  }

  // ---------------------------------------------------------------------------
  // Wire up controls
  // ---------------------------------------------------------------------------
  function wireControls() {
    scenarioSelect.addEventListener("change", render);
    scenarioSearch.addEventListener("input", function () {
      fillScenarioOptions();
      render();
    });
    groupFilter.addEventListener("change", function () {
      fillScenarioOptions();
      render();
    });
    envFilter.addEventListener("change", function () {
      refreshEnvBanner();
      render();
    });
    showBands.addEventListener("change", render);
    logScale.addEventListener("change", render);
    showRatio.addEventListener("change", render);

    if (btnZoomIn) {
      btnZoomIn.addEventListener("click", function () {
        if (chart && chart.zoom) {
          chart.zoom({ x: ZOOM_STEP_X }, "none");
          scheduleChartResize();
        }
      });
    }
    if (btnZoomOut) {
      btnZoomOut.addEventListener("click", function () {
        if (chart && chart.zoom) {
          chart.zoom({ x: 1 / ZOOM_STEP_X }, "none");
          scheduleChartResize();
        }
      });
    }
    if (btnPanEarlier) {
      btnPanEarlier.addEventListener("click", function () {
        if (chart && chart.pan) {
          chart.pan({ x: PAN_PIXELS_X }, undefined, "none");
          scheduleChartResize();
        }
      });
    }
    if (btnPanLater) {
      btnPanLater.addEventListener("click", function () {
        if (chart && chart.pan) {
          chart.pan({ x: -PAN_PIXELS_X }, undefined, "none");
          scheduleChartResize();
        }
      });
    }
    if (btnResetZoom) {
      btnResetZoom.addEventListener("click", function () {
        if (chart && chart.resetZoom) {
          chart.resetZoom();
          scheduleChartResize();
        }
      });
    }
    if (btnDownload) {
      btnDownload.addEventListener("click", function () {
        if (!chart || !chart.toBase64Image) {
          return;
        }
        var sid = String(scenarioSelect.value || "chart").replace(/[^a-zA-Z0-9_.-]+/g, "_");
        var a = document.createElement("a");
        a.download = "bench-history-" + sid + ".png";
        a.href = chart.toBase64Image("image/png", 1);
        a.click();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Bootstrap: fetch payload then initialise
  // ---------------------------------------------------------------------------
  async function init() {
    try {
      var res = await fetch("/api/payload");
      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }
      data = await res.json();
    } catch (err) {
      if (loadingOverlay) {
        loadingOverlay.innerHTML =
          '<div class="text-center"><p class="text-red-400 text-sm">Failed to load bench data.</p>' +
          '<p class="mt-1 text-xs text-zinc-500">' +
          String(err) +
          "</p>" +
          '<p class="mt-3 text-xs text-zinc-600">Run <code class="text-indigo-400">pnpm bench</code> first to generate data.</p></div>';
      }
      return;
    }

    // Register zoom plugin.
    if (typeof Chart !== "undefined" && typeof ChartZoom !== "undefined") {
      Chart.register(ChartZoom);
    }

    // Build ordered libraries list and palette map.
    var primary =
      data.libraries.find(function (l) {
        return l.isPrimary;
      }) || data.libraries[0];
    var compares = data.libraries.filter(function (l) {
      return !l.isPrimary;
    });
    orderedLibraries = primary ? [primary].concat(compares) : data.libraries.slice();
    orderedLibraries.forEach(function (lib, idx) {
      paletteMap[lib.key] = PALETTE[idx % PALETTE.length];
    });

    // Set page title.
    if (pageTitleEl) {
      pageTitleEl.innerHTML =
        esc(data.title) + '<span class="font-normal text-zinc-400"> · hz/op median per run</span>';
    }
    document.title = data.title + " — bench history";

    // Ratio toggle label.
    if (ratioLabel && primary && compares.length > 0) {
      ratioLabel.textContent =
        compares.length === 1
          ? primary.displayName + " ÷ " + compares[0].displayName
          : "Primary ratios";
    }

    // Populate environment filter.
    var envKeys = [
      ...new Set(
        data.runs.map(function (r) {
          return r.envKey;
        }),
      ),
    ].sort(function (a, b) {
      return a.localeCompare(b);
    });
    envKeys.forEach(function (key) {
      var sample = data.runs.find(function (r) {
        return r.envKey === key;
      });
      if (!sample) {
        return;
      }
      var opt = document.createElement("option");
      opt.value = key;
      opt.textContent = sample.envLabel;
      envFilter.appendChild(opt);
    });

    // Populate group filter.
    var groups = [
      ...new Set(
        data.scenarios.map(function (s) {
          return s.group;
        }),
      ),
    ].sort(function (a, b) {
      return a.localeCompare(b);
    });
    groups.forEach(function (g) {
      var opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      groupFilter.appendChild(opt);
    });

    // Page footer.
    if (pageFooter) {
      pageFooter.innerHTML =
        "Dynamic server — refresh page for latest data · " +
        esc(String(data.runs.length)) +
        " runs · " +
        esc(String(data.scenarios.length)) +
        " scenarios";
    }

    // Snapshot description.
    if (snapshotDesc) {
      snapshotDesc.textContent =
        "Rows use the chronologically last run directory (" +
        data.runs.length +
        " total), independent of the Environment selector.";
    }

    applyKpis();
    buildSnapshotTable();
    refreshEnvBanner();
    fillScenarioOptions();
    wireControls();

    // Show app.
    if (loadingOverlay) {
      loadingOverlay.classList.add("hidden");
    }
    if (appEl) {
      appEl.style.display = "";
    }

    render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    void init();
  });
})();

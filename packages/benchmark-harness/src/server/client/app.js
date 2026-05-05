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

  var toastHideTimer = null;

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

  function isMacLikePlatform() {
    return (
      /Mac|iPhone|iPod|iPad/i.test(navigator.platform || "") ||
      (typeof navigator.userAgentData !== "undefined" &&
        navigator.userAgentData &&
        navigator.userAgentData.platform === "macOS")
    );
  }

  function chartWheelModifierKbdHtml() {
    var kbdClass =
      "rounded border border-zinc-700 bg-zinc-800 px-1.5 py-px font-mono text-zinc-300";
    if (isMacLikePlatform()) {
      return "<kbd class='" + kbdClass + "'>⌃ Control</kbd>";
    }
    return "<kbd class='" + kbdClass + "'>Ctrl</kbd>";
  }

  function applyChartWheelHint() {
    var el = document.getElementById("chart-wheel-hint");
    if (!el) {
      return;
    }
    el.innerHTML = "&nbsp;" + chartWheelModifierKbdHtml() + "+wheel zooms ·";
  }

  function showToast(message) {
    var t = document.getElementById("bh-toast");
    if (!t) {
      return;
    }
    t.textContent = message;
    t.classList.add("is-visible");
    if (toastHideTimer) {
      clearTimeout(toastHideTimer);
    }
    toastHideTimer = setTimeout(function () {
      t.classList.remove("is-visible");
      toastHideTimer = null;
    }, 3500);
  }

  function wireDetailsPersistence() {
    [
      { id: "intro-howto-details", key: "bh-howto-open" },
      { id: "chart-data-details", key: "bh-chartdata-open" },
      { id: "snapshot-details", key: "bh-snapshot-open" },
    ].forEach(function (cfg) {
      var el = document.getElementById(cfg.id);
      if (!el) {
        return;
      }
      try {
        if (localStorage.getItem(cfg.key) === "1") {
          el.open = true;
        }
      } catch {
        /* ignore */
      }
      el.addEventListener("toggle", function () {
        try {
          localStorage.setItem(cfg.key, el.open ? "1" : "0");
        } catch {
          /* ignore */
        }
      });
    });
  }

  function clearChartDataTable() {
    var thead = document.getElementById("chart-data-thead");
    var tbody = document.getElementById("chart-data-tbody");
    if (thead) {
      thead.innerHTML = "";
    }
    if (tbody) {
      tbody.innerHTML = "";
    }
  }

  function updateChartDataTable(scenarioRow, indices, runsSlice) {
    var thead = document.getElementById("chart-data-thead");
    var tbody = document.getElementById("chart-data-tbody");
    if (!thead || !tbody || !scenarioRow || !indices.length) {
      clearChartDataTable();
      return;
    }
    var primaryLib =
      orderedLibraries.find(function (l) {
        return l.isPrimary;
      }) || orderedLibraries[0];
    var compareLibs = orderedLibraries.filter(function (l) {
      return !l.isPrimary;
    });

    var hr = "<tr><th scope='col'>Run (local)</th><th scope='col'>Folder</th>";
    orderedLibraries.forEach(function (lib) {
      hr +=
        "<th scope='col' class='bh-num' style='color:" +
        esc(paletteMap[lib.key].text) +
        "'>" +
        esc(lib.displayName) +
        " hz/op</th>";
    });
    compareLibs.forEach(function (cmp) {
      hr +=
        "<th scope='col' class='bh-num' style='color:rgb(253,224,169)'>÷ " +
        esc(cmp.displayName) +
        "</th>";
    });
    hr += "</tr>";
    thead.innerHTML = hr;

    var bodyHtml = "";
    for (var j = indices.length - 1; j >= 0; j--) {
      var globalIx = indices[j];
      var run = runsSlice[j];
      var row =
        "<td>" +
        esc(formatLocal(run.timestampIso, run.folder)) +
        "</td><td>" +
        esc(run.folder) +
        "</td>";
      orderedLibraries.forEach(function (lib) {
        var ld = scenarioRow.libraries[lib.key];
        var hz = ld ? ld.hz[globalIx] : null;
        var has = typeof hz === "number" && hz > 0;
        row += "<td class='bh-num'>" + (has ? esc(fmtHz(hz)) : "—") + "</td>";
      });
      var primLibData = scenarioRow.libraries[primaryLib ? primaryLib.key : ""];
      var primaryHz = primLibData ? primLibData.hz[globalIx] : null;
      compareLibs.forEach(function (cmp) {
        var cmpLd = scenarioRow.libraries[cmp.key];
        var cmpHz = cmpLd ? cmpLd.hz[globalIx] : null;
        var r = ratioFrom(
          typeof primaryHz === "number" && primaryHz > 0 ? primaryHz : null,
          typeof cmpHz === "number" && cmpHz > 0 ? cmpHz : null,
        );
        row += "<td class='bh-num'>" + (r !== null ? r.toFixed(3) + "×" : "—") + "</td>";
      });
      bodyHtml += "<tr>" + row + "</tr>";
    }
    tbody.innerHTML = bodyHtml;
  }

  function updateChartEmptyState(scenarioRow, indices) {
    var overlay = document.getElementById("chart-empty-state");
    var msgEl = document.getElementById("chart-empty-message");
    var btnEnv = document.getElementById("empty-btn-clear-env");
    var btnSearch = document.getElementById("empty-btn-clear-search");
    var btnGroups = document.getElementById("empty-btn-all-groups");
    if (!overlay || !msgEl || !data) {
      return;
    }

    var hasChart = !!(scenarioRow && indices.length > 0);
    if (hasChart) {
      overlay.classList.remove("is-visible");
      return;
    }

    overlay.classList.add("is-visible");

    var msg = "";
    if (data.runs.length === 0) {
      msg =
        "No benchmark runs are in this history yet. Generate data with your bench command, then refresh this page.";
    } else if (indices.length === 0) {
      msg = "No runs match the selected environment. Widen the filter to see the chart again.";
    } else if (!scenarioRow) {
      var vis = visibleScenarios();
      if (vis.length === 0) {
        msg = "No scenarios match the current search or group. Loosen filters to continue.";
      } else {
        msg = "Pick a scenario from the Scenario list above.";
      }
    } else {
      msg = "Nothing to plot for this selection.";
    }
    msgEl.textContent = msg;

    function toggleBtn(el, isVisible) {
      if (!el) {
        return;
      }
      el.classList.toggle("hidden", !isVisible);
    }

    toggleBtn(btnEnv, data.runs.length > 0 && indices.length === 0 && !!envFilter.value);
    var q = searchNorm(scenarioSearch.value).trim();
    var visEmpty = visibleScenarios().length === 0;
    toggleBtn(btnSearch, visEmpty && q !== "");
    toggleBtn(btnGroups, visEmpty && !!groupFilter.value);
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
  /** @type {{ title: string, primaryLibraryKey: string, libraries: any[], runs: any[], scenarios: any[], generatedAtIso?: string } | null} */
  var data = null;
  /** Libraries sorted so primary is first, then compares in order. */
  var orderedLibraries = [];
  /** Map: libraryKey → palette entry */
  var paletteMap = {};

  var sessionPageOpenedAt = null;
  var chartZoomRegistered = false;
  var wireControlsApplied = false;
  var detailsPersistenceApplied = false;
  var chartWheelHintApplied = false;

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
        chart.update("none");
      }
    });
  }
  window.addEventListener("resize", scheduleChartResize);

  /**
   * Initial visible index range on the category (time) axis — same math as the old zoomScale call,
   * but applied via scale options so Chart.js measures Y/X together on first layout (avoids axis
   * ticks drifting after scenario changes when zoom was applied post-construct).
   * @returns {{ min?: number, max?: number }}
   */
  function initialCategoryAxisWindow(labelCount) {
    var L = labelCount;
    if (L < 6) {
      return {};
    }
    var lastIx = L - 1;
    var span = Math.min(Math.max(Math.floor(L * 0.5), 18), Math.min(56, lastIx + 1));
    return { min: Math.max(0, lastIx - span + 1), max: lastIx };
  }

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

  function refreshScenarioNavButtons() {
    var prevBtn = document.getElementById("scenario-prev");
    var nextBtn = document.getElementById("scenario-next");
    if (!prevBtn || !nextBtn || !scenarioSelect) {
      return;
    }
    var count = scenarioSelect.options.length;
    if (count === 0) {
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }
    var i = scenarioSelect.selectedIndex;
    if (i < 0) {
      i = 0;
    }
    prevBtn.disabled = i <= 0;
    nextBtn.disabled = i >= count - 1;
  }

  function stepScenarioNav(delta) {
    if (!scenarioSelect) {
      return;
    }
    var count = scenarioSelect.options.length;
    if (count < 2) {
      return;
    }
    var i = scenarioSelect.selectedIndex;
    if (i < 0) {
      i = 0;
    }
    var next = i + delta;
    if (next < 0 || next >= count) {
      return;
    }
    scenarioSelect.selectedIndex = next;
    render();
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
          '<div class="bh-lib-version-row"><span class="bh-lib-version-key">' +
          esc(lv.key) +
          "</span> " +
          esc(lv.version) +
          (lv.gcExposed ? ' <span class="bh-gc-tag" title="--expose-gc active">[gc]</span>' : "") +
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
    var ths =
      "<th scope='col' class='bh-sticky-1'>Scenario</th><th scope='col' class='bh-sticky-2'>Group</th>";
    for (var li = 0; li < orderedLibraries.length; li++) {
      var lib = orderedLibraries[li];
      ths +=
        "<th scope='col' class='bh-num' style='color:" +
        esc(paletteMap[lib.key].text) +
        "'>" +
        esc(lib.displayName) +
        "</th>";
    }
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
      var tds =
        "<td class='bh-sticky-1'>" +
        esc(s.id) +
        "</td><td class='bh-sticky-2'>" +
        esc(s.group) +
        "</td>";
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

    var html = '<div class="bh-metrics-grid">';

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

      var oldestRunIx = indices[0];
      var newestRunIx = indices[indices.length - 1];
      var hzAtOldest = oldestRunIx !== undefined ? libData.hz[oldestRunIx] : null;
      var hzAtNewest = newestRunIx !== undefined ? libData.hz[newestRunIx] : null;
      var trend = "—";
      if (
        indices.length >= 2 &&
        typeof hzAtOldest === "number" &&
        hzAtOldest > 0 &&
        typeof hzAtNewest === "number" &&
        hzAtNewest > 0
      ) {
        trend = fmtPctChange(hzAtOldest, hzAtNewest) + ", oldest → newest run in filter";
      }

      var runsWithData = hzValues.length;
      var runsPlotted = indices.length;
      var coverageHint =
        runsWithData < runsPlotted
          ? '<div class="bh-metric-meta bh-metric-meta--fine">' +
            esc(String(runsWithData)) +
            " of " +
            esc(String(runsPlotted)) +
            " plotted runs have median hz/op</div>"
          : "";
      indices.forEach(function (gx) {
        var f = libData.iqrFraction[gx];
        if (typeof f === "number" && Number.isFinite(f)) {
          worstIqr = Math.max(worstIqr, f);
        }
      });
      html +=
        '<div class="bh-card" role="group" aria-label="' +
        esc(lib.displayName + " median hz/op over filtered runs with data") +
        '" style="--bh-accent:' +
        esc(color) +
        '">' +
        '<div class="bh-lbl bh-tint-lbl">' +
        esc(lib.displayName) +
        " median hz/op</div>" +
        '<div class="bh-val bh-tint-val">' +
        (median !== null ? fmtHz(median) + " Hz/op" : "—") +
        "</div>" +
        (lo !== null && hi !== null
          ? '<div class="bh-metric-meta bh-metric-meta--mono">Range ' +
            fmtHz(lo) +
            " … " +
            fmtHz(hi) +
            "</div>"
          : "") +
        '<div class="bh-metric-meta">Δ ' +
        trend +
        "</div>" +
        coverageHint +
        "</div>";
    });

    compareLibs.forEach(function (cmpLib) {
      var primKey = primaryLib ? primaryLib.key : "";
      var primData = scenarioRow.libraries[primKey];
      var cmpData = scenarioRow.libraries[cmpLib.key];
      if (!primData || !cmpData) {
        return;
      }
      var primHzVals = indices
        .map(function (gx) {
          var v = primData.hz[gx];
          return typeof v === "number" && v > 0 ? v : null;
        })
        .filter(Boolean);
      var cmpHzVals = indices
        .map(function (gx) {
          var v = cmpData.hz[gx];
          return typeof v === "number" && v > 0 ? v : null;
        })
        .filter(Boolean);
      var primMed = medianNumeric(primHzVals);
      var cmpMed = medianNumeric(cmpHzVals);
      var ratioMedians = ratioFrom(primMed, cmpMed);
      var ratios = indices
        .map(function (gx) {
          return ratioFrom(primData.hz[gx], cmpData.hz[gx]);
        })
        .filter(function (v) {
          return v !== null;
        });
      var medianOfRunRatios = medianNumeric(ratios);
      var showPairedMedian =
        medianOfRunRatios !== null &&
        ratioMedians !== null &&
        Math.abs(medianOfRunRatios - ratioMedians) / ratioMedians > 0.002;
      var primaryName = (primaryLib || orderedLibraries[0]).displayName;
      var ratioAria =
        "Ratio " +
        primaryName +
        " divided by " +
        cmpLib.displayName +
        ", median hz/op divided by median hz/op";
      var ratioCaptionLine =
        '<div class="bh-metric-meta">' +
        "Median ÷ median for this filter; each side uses runs with hz/op for that library." +
        "</div>";
      var ratioPairedLine = showPairedMedian
        ? '<div class="bh-metric-meta">Median of per-run ratios · <span class="bh-metric-fig">' +
          medianOfRunRatios.toFixed(3) +
          "×</span></div>"
        : "";
      html +=
        '<div class="bh-card" role="group" aria-label="' +
        esc(ratioAria) +
        '" style="--bh-accent:rgb(253,224,169)">' +
        '<div class="bh-lbl bh-tint-lbl">Ratio · ' +
        esc(primaryName) +
        " ÷ " +
        esc(cmpLib.displayName) +
        "</div>" +
        '<div class="bh-val bh-tint-val">' +
        (ratioMedians !== null ? ratioMedians.toFixed(3) + "×" : "—") +
        "</div>" +
        ratioCaptionLine +
        ratioPairedLine +
        "</div>";
    });

    var iqrRowHtml = orderedLibraries
      .map(function (lib) {
        var libData = scenarioRow.libraries[lib.key];
        var fig = "—";
        if (libData) {
          var maxF = 0;
          indices.forEach(function (gx) {
            var f = libData.iqrFraction[gx];
            if (typeof f === "number" && Number.isFinite(f)) {
              maxF = Math.max(maxF, f);
            }
          });
          if (maxF > 0) {
            fig = (maxF * 100).toFixed(1) + "%";
          }
        }
        return (
          '<div class="bh-metric-row">' +
          '<span class="bh-metric-row__name">' +
          esc(lib.displayName) +
          "</span>" +
          '<span class="bh-metric-row__fig">' +
          fig +
          "</span></div>"
        );
      })
      .join("");
    html +=
      '<div class="bh-card" role="group" aria-label="Worst IQR divided by median, per plotted run">' +
      '<div class="bh-lbl">Worst IQR÷median · per plotted run</div>' +
      '<div class="bh-metric-iqr">' +
      iqrRowHtml +
      "</div></div>";

    html += "</div>";
    metricsCardsEl.innerHTML = html;

    var footPieces = [
      indices.length +
        " run(s) on the chart" +
        (envFilter.value ? "; environment filter on" : "; all environments") +
        ". Median & range: all filtered runs with hz/op. Δ: % change from first → last run in this view when both have data",
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

    updateChartEmptyState(scenarioRow, indices);

    if (!scenarioRow || indices.length === 0) {
      if (chart) {
        chart.destroy();
        chart = null;
      }
      updateMetricsPanel(null, []);
      clearChartDataTable();
      if (chartSubtitleLine) {
        if (indices.length === 0 && data.runs.length > 0) {
          chartSubtitleLine.textContent = "No saved runs match the current Environment filter.";
        } else if (!scenarioRow) {
          chartSubtitleLine.textContent = "No scenario available for these filters.";
        } else {
          chartSubtitleLine.textContent = "";
        }
      }
      refreshScenarioNavButtons();
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

    updateChartDataTable(scenarioRow, indices, runsSlice);

    var datasets = [];
    var bandOn = showBands.checked;
    var ratioOn = showRatio.checked;

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
    var xAxisWindow = initialCategoryAxisWindow(labels.length);
    var scales = {
      x: Object.assign(
        {
          type: "category",
          offset: true,
          ticks: {
            autoSkip: true,
            maxTicksLimit: Math.min(22, Math.max(labels.length || 2, 2)),
            maxRotation: 52,
            minRotation: 0,
            color: "rgba(235, 235, 245, 0.42)",
          },
          grid: { color: "rgba(255, 255, 255, 0.055)", drawOnChartArea: true },
        },
        xAxisWindow.min !== undefined ? { min: xAxisWindow.min, max: xAxisWindow.max } : {},
      ),
      y: {
        type: yType,
        position: "left",
        title: { display: true, text: "hz/op", color: "rgba(235, 235, 245, 0.5)" },
        ticks: { color: "rgba(235, 235, 245, 0.42)" },
        grid: { color: "rgba(255, 255, 255, 0.055)" },
      },
    };
    if (ratioOn) {
      scales.y1 = {
        type: "linear",
        position: "right",
        title: { display: true, text: "ratio", color: "rgba(235, 235, 245, 0.5)" },
        ticks: { color: "rgba(255, 200, 150, 0.55)" },
        grid: { drawOnChartArea: false },
      };
    }

    updateMetricsPanel(scenarioRow, indices);

    var plugins = {
      legend: {
        labels: {
          color: "rgba(235, 235, 245, 0.72)",
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

    var canvasEl = document.getElementById("bench-chart");
    if (canvasEl && typeof Chart.getChart === "function") {
      var staleChart = Chart.getChart(canvasEl);
      if (staleChart) {
        staleChart.destroy();
      }
    } else if (chart) {
      chart.destroy();
    }
    chart = new Chart(canvasEl, {
      type: "line",
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: "index", intersect: false },
        scales: scales,
        plugins: plugins,
        layout: { padding: { top: 4, right: 12 + (ratioOn ? 20 : 0), bottom: 2, left: 12 } },
      },
    });
    scheduleChartResize();
    refreshScenarioNavButtons();
  }

  // ---------------------------------------------------------------------------
  // Wire up controls
  // ---------------------------------------------------------------------------
  function wireEmptyStateButtons() {
    var btnEnv = document.getElementById("empty-btn-clear-env");
    var btnSearch = document.getElementById("empty-btn-clear-search");
    var btnGroups = document.getElementById("empty-btn-all-groups");
    if (btnEnv) {
      btnEnv.addEventListener("click", function () {
        envFilter.value = "";
        refreshEnvBanner();
        render();
      });
    }
    if (btnSearch) {
      btnSearch.addEventListener("click", function () {
        scenarioSearch.value = "";
        fillScenarioOptions();
        render();
      });
    }
    if (btnGroups) {
      btnGroups.addEventListener("click", function () {
        groupFilter.value = "";
        fillScenarioOptions();
        render();
      });
    }
  }

  function wireControls() {
    var btnReloadData = document.getElementById("reload-data-btn");
    if (btnReloadData) {
      btnReloadData.addEventListener("click", function () {
        void loadBenchData({ isReload: true });
      });
    }
    scenarioSelect.addEventListener("change", render);
    var btnScenarioPrev = document.getElementById("scenario-prev");
    var btnScenarioNext = document.getElementById("scenario-next");
    if (btnScenarioPrev) {
      btnScenarioPrev.addEventListener("click", function () {
        stepScenarioNav(-1);
      });
    }
    if (btnScenarioNext) {
      btnScenarioNext.addEventListener("click", function () {
        stepScenarioNav(1);
      });
    }
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

    wireEmptyStateButtons();

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
          showToast("Nothing to export yet — select a scenario with plotted runs.");
          return;
        }
        var sid = String(scenarioSelect.value || "chart").replace(/[^a-zA-Z0-9_.-]+/g, "_");
        var filename = "bench-history-" + sid + ".png";
        var a = document.createElement("a");
        a.download = filename;
        a.href = chart.toBase64Image("image/png", 1);
        a.click();
        showToast("Saved " + filename);
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Payload load + bootstrap
  // ---------------------------------------------------------------------------
  function selectHasValue(selectEl, value) {
    for (var i = 0; i < selectEl.options.length; i++) {
      if (selectEl.options[i].value === value) {
        return true;
      }
    }
    return false;
  }

  function updatePageFooter() {
    if (!pageFooter || !data || !sessionPageOpenedAt) {
      return;
    }
    var genPart = "";
    if (data.generatedAtIso) {
      genPart =
        " Data snapshot " +
        esc(formatLocal(data.generatedAtIso, data.generatedAtIso)) +
        " (server clock).";
    }
    pageFooter.innerHTML =
      "Reload data from the header or refresh the page for the latest snapshot · " +
      esc(String(data.runs.length)) +
      " runs · " +
      esc(String(data.scenarios.length)) +
      " scenarios." +
      genPart +
      " Page opened " +
      esc(formatLocal(sessionPageOpenedAt.toISOString(), "")) +
      " (local).";
  }

  function applyLoadedPayload() {
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

    if (pageTitleEl) {
      pageTitleEl.innerHTML =
        esc(data.title) + '<span class="font-normal text-zinc-400"> · hz/op median per run</span>';
    }
    var docTitle = String(data.title || "").trim();
    document.title = /bench history\s*$/i.test(docTitle) ? docTitle : docTitle + " — bench history";

    if (ratioLabel && primary && compares.length > 0) {
      ratioLabel.textContent =
        compares.length === 1
          ? primary.displayName + " ÷ " + compares[0].displayName
          : "Primary ratios";
    }

    var savedEnv = envFilter.value;
    while (envFilter.options.length > 1) {
      envFilter.remove(1);
    }
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
    if (selectHasValue(envFilter, savedEnv)) {
      envFilter.value = savedEnv;
    } else {
      envFilter.selectedIndex = 0;
    }

    var savedGroup = groupFilter.value;
    while (groupFilter.options.length > 1) {
      groupFilter.remove(1);
    }
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
    if (selectHasValue(groupFilter, savedGroup)) {
      groupFilter.value = savedGroup;
    } else {
      groupFilter.selectedIndex = 0;
    }

    updatePageFooter();

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
  }

  /**
   * @param {{ isReload?: boolean }} opts
   */
  async function loadBenchData(opts) {
    var isReload = !!(opts && opts.isReload);
    var btnReload = document.getElementById("reload-data-btn");
    if (isReload && btnReload) {
      btnReload.disabled = true;
      btnReload.setAttribute("aria-busy", "true");
    }
    try {
      var res = await fetch("/api/payload", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }
      data = await res.json();
    } catch (err) {
      if (isReload) {
        showToast("Could not reload data: " + String(err));
      } else if (loadingOverlay) {
        loadingOverlay.innerHTML =
          '<div class="text-center"><p class="text-red-400 text-sm">Failed to load bench data.</p>' +
          '<p class="mt-1 text-xs text-zinc-500">' +
          String(err) +
          "</p>" +
          '<p class="mt-3 text-xs text-zinc-600">Run <code class="text-indigo-400">pnpm bench</code> first to generate data.</p></div>';
      }
      return false;
    } finally {
      if (isReload && btnReload) {
        btnReload.disabled = false;
        btnReload.removeAttribute("aria-busy");
      }
    }

    if (!chartZoomRegistered && typeof Chart !== "undefined" && typeof ChartZoom !== "undefined") {
      Chart.register(ChartZoom);
      chartZoomRegistered = true;
    }

    if (sessionPageOpenedAt === null) {
      sessionPageOpenedAt = new Date();
    }

    applyLoadedPayload();

    if (!wireControlsApplied) {
      wireControls();
      wireControlsApplied = true;
    }
    if (!detailsPersistenceApplied) {
      wireDetailsPersistence();
      detailsPersistenceApplied = true;
    }
    if (!chartWheelHintApplied) {
      applyChartWheelHint();
      chartWheelHintApplied = true;
    }

    if (!isReload) {
      if (loadingOverlay) {
        loadingOverlay.classList.add("hidden");
        loadingOverlay.setAttribute("aria-hidden", "true");
      }
      if (appEl) {
        appEl.style.display = "";
      }
    }

    render();
    if (isReload) {
      showToast("Bench data reloaded.");
    }
    return true;
  }

  async function init() {
    await loadBenchData({ isReload: false });
  }

  document.addEventListener("DOMContentLoaded", function () {
    void init();
  });
})();

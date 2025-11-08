console.log('✅ Script loaded: AegisNet Sentinel');

const API_BASE_URL = 'http://127.0.0.1:5001';

const TOP_FEATURES = [
  'Max Packet Length',
  'Avg Bwd Segment Size',
  'Packet Length Variance',
  'Destination Port',
  'Packet Length Std',
  'Average Packet Size',
  'Bwd Packet Length Max',
  'Bwd Packet Length Std',
  'Total Length of Bwd Packets',
  'Init_Win_bytes_forward',
  'Total Length of Fwd Packets',
  'Subflow Fwd Bytes',
  'Bwd Packet Length Mean',
  'Packet Length Mean',
  'Subflow Bwd Bytes',
  'Fwd Header Length.1',
  'Avg Fwd Segment Size',
  'Fwd Packet Length Max',
  'Bwd Header Length',
  'Subflow Fwd Packets',
  'Fwd Header Length',
  'Fwd IAT Max',
  'Init_Win_bytes_backward',
  'Fwd Packet Length Mean',
  'Flow Bytes/s',
  'Total Fwd Packets',
  'Flow IAT Mean',
  'Flow IAT Std',
  'Flow Packets/s',
  'Bwd Packets/s',
];

let resultsChartInstance = null;
let featureChartInstance = null;
let currentThreatIndices = [];
let currentThreatDetails = [];

document.addEventListener('DOMContentLoaded', () => {
  // Ensure submit button is disabled on initial load regardless of HTML state
  const initialSubmitBtn = document.getElementById('submitBtn');
  if (initialSubmitBtn) {
    initialSubmitBtn.disabled = true;
    console.log(
      '� INIT: Submit button force-disabled until valid CSV selected'
    );
  }
  console.log('�🛡️ AegisNet Frontend Initialized');

  // ===============================
  // TOASTR CONFIG
  // ===============================
  if (typeof toastr !== 'undefined') {
    toastr.options = {
      closeButton: true,
      progressBar: true,
      positionClass: 'toast-top-right',
      timeOut: 5000,
    };
  } else {
    console.error('❌ Toastr not loaded');
  }

  // ===============================
  // DOM ELEMENTS
  // ===============================
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const fileNameDisplay = document.getElementById('fileName');
  const submitBtn = document.getElementById('submitBtn');
  const spinner = document.getElementById('spinner');
  const neonLoader = document.getElementById('neon-loader');
  const awaitingData = document.getElementById('awaitingData');
  const chartContainer = document.getElementById('chartContainer');
  const readoutContainer = document.getElementById('readoutContainer');
  const totalFlowsEl = document.getElementById('totalFlows');
  const benignFlowsEl = document.getElementById('benignFlows');
  const threatFlowsEl = document.getElementById('threatFlows');
  const manualForm = document.getElementById('manual-form');
  const manualFormInputs = document.getElementById('manual-form-inputs');
  const manualSubmitBtn = document.getElementById('manual-submit-btn');
  const manualResult = document.getElementById('manual-result');

  // Threat Records Panel Elements
  const threatRecordsPanel = document.getElementById('threat-records-panel');
  const threatPanelHeader = document.getElementById('threat-panel-header');
  const threatPanelToggle = document.getElementById('threat-panel-toggle');
  const threatPanelContent = document.getElementById('threat-panel-content');
  const threatIndicesList = document.getElementById('threat-indices-list');
  const threatMoreText = document.getElementById('threat-more-text');
  const downloadThreatBtn = document.getElementById('download-threat-btn');

  // CSV Modal Elements
  const openCsvPreviewBtn = document.getElementById('openCsvPreviewBtn');
  const csvModal = document.getElementById('csvModal');
  const csvModalBackdrop = document.getElementById('csvModalBackdrop');
  const csvModalContent = document.getElementById('csvModalContent');
  const closeCsvModalBtn = document.getElementById('closeCsvModalBtn');
  const downloadCsvBtn = document.getElementById('downloadCsvBtn');
  const csvModalStats = document.getElementById('csv-modal-stats');
  const csvModalColumns = document.getElementById('csv-modal-columns');
  const csvModalThead = document.getElementById('csv-modal-thead');
  const csvModalTbody = document.getElementById('csv-modal-tbody');
  const csvModalResizeHandle = document.getElementById('csvModalResizeHandle');
  // Ensure CSV Preview button starts disabled
  if (openCsvPreviewBtn) {
    openCsvPreviewBtn.disabled = true;
  }

  // Global storage for parsed CSV (preview subset + file ref)
  let latestCsvMeta = null; // { columns:[], previewRows:[], file:File, totalRows:number }

  // Quick Insights Elements
  const quickInsights = document.getElementById('quick-insights');
  const insightsLine = document.getElementById('insights-line');
  const metricThreatPct = document.getElementById('metric-threat-pct');
  const metricBenignCount = document.getElementById('metric-benign-count');
  const metricAttackCount = document.getElementById('metric-attack-count');

  // Feature Importance Chart
  const fiChartContainer = document.getElementById('fiChartContainer');
  const featureChartEl = document.getElementById('featureChart');

  // System Console
  const systemConsoleBody = document.getElementById('system-console-body');
  const themeToggle = document.getElementById('themeToggle');
  const themeOverlay = document.getElementById('themeOverlay');
  const systemLed = document.getElementById('systemLed');
  // ===============================
  // THEME SYSTEM
  // ===============================
  function setSystemLed(state) {
    if (!systemLed) return;
    systemLed.setAttribute('data-state', state);
  }

  function applyTheme(theme, { animate = false } = {}) {
    const finalTheme = theme === 'magenta' ? 'magenta' : 'neon';
    if (animate && themeOverlay) {
      // start overlay + LED transition state
      document.body.classList.add('overlay-active');
      setSystemLed('transition');
      // mid-sweep: perform the theme swap
      setTimeout(() => {
        document.documentElement.setAttribute('data-theme', finalTheme);
        localStorage.setItem('aegisnet-theme', finalTheme);
        updateChartTheme(finalTheme);
      }, 250);
      // end sweep: clear overlay and set LED to target theme
      setTimeout(() => {
        document.body.classList.remove('overlay-active');
        setSystemLed(finalTheme);
      }, 600);
    } else {
      document.documentElement.setAttribute('data-theme', finalTheme);
      localStorage.setItem('aegisnet-theme', finalTheme);
      updateChartTheme(finalTheme);
      setSystemLed(finalTheme);
    }
  }

  function updateChartTheme(theme) {
    const isMagenta = theme === 'magenta';
    const doughnutColors = isMagenta
      ? ['#ff00ff', '#00bfff']
      : ['#00ff00', '#ff3333'];
    const titleColor = isMagenta ? '#ff00ff' : '#00ffff';
    const legendColor = isMagenta ? '#ff00ff' : '#00ff00';
    if (resultsChartInstance) {
      resultsChartInstance.data.datasets[0].backgroundColor = doughnutColors;
      resultsChartInstance.data.datasets[0].borderColor = doughnutColors;
      if (resultsChartInstance.options.plugins?.title) {
        resultsChartInstance.options.plugins.title.color = titleColor;
      }
      if (resultsChartInstance.options.plugins?.legend?.labels) {
        resultsChartInstance.options.plugins.legend.labels.color = legendColor;
      }
      resultsChartInstance.update();
    }
    if (featureChartInstance) {
      const accent = isMagenta ? '#00bfff' : '#00ffff';
      const primary = isMagenta ? '#ff00ff' : '#00ff00';
      featureChartInstance.data.datasets[0].backgroundColor = accent + 'AA';
      featureChartInstance.data.datasets[0].borderColor = accent;
      if (featureChartInstance.options.plugins?.title) {
        featureChartInstance.options.plugins.title.color = accent;
      }
      if (featureChartInstance.options.scales) {
        featureChartInstance.options.scales.x.ticks.color = primary;
        featureChartInstance.options.scales.y.ticks.color = primary;
        featureChartInstance.options.scales.x.grid.color =
          accent.replace('#', '#') + '33';
        featureChartInstance.options.scales.y.grid.color =
          accent.replace('#', '#') + '33';
      }
      featureChartInstance.update();
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = localStorage.getItem('aegisnet-theme') || 'neon';
      const next = current === 'neon' ? 'magenta' : 'neon';
      applyTheme(next, { animate: true });
      if (typeof toastr !== 'undefined') {
        toastr.info(`Theme switched to ${next.toUpperCase()}`, '🎨 Theme');
      }
    });
  }

  // Initialize saved theme
  applyTheme(localStorage.getItem('aegisnet-theme') || 'neon', {
    animate: false,
  });

  // ===============================
  // INITIAL SETUP
  // ===============================
  populateManualForm();
  initializeChart();
  initializeThreatPanel();

  // ===============================
  // LOADER UTILITY FUNCTIONS
  // ===============================
  function showLoader() {
    if (neonLoader) {
      neonLoader.classList.add('active');
    }
  }

  function hideLoader() {
    if (neonLoader) {
      neonLoader.classList.remove('active');
    }
  }

  // ===============================
  // FILE HANDLING
  // ===============================
  fileInput.addEventListener('change', (e) => {
    console.log('📁 File input changed');
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    } else {
      // File cleared - disable button and reset UI
      console.log('🔄 File input cleared — disabling submit');
      fileNameDisplay.textContent = '';
      submitBtn.disabled = true;
      if (openCsvPreviewBtn) openCsvPreviewBtn.disabled = true;
    }
  });

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-over');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');

    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        handleFileSelect(file);
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
      } else {
        toastr.warning('⚠️ Please upload a valid CSV file.');
        fileInput.value = '';
        fileNameDisplay.textContent = '';
        submitBtn.disabled = true;
        if (openCsvPreviewBtn) openCsvPreviewBtn.disabled = true;
      }
    }
  });

  function handleFileSelect(file) {
    if (!file) {
      console.warn('❌ handleFileSelect invoked without file object');
      submitBtn.disabled = true;
      return;
    }

    console.log(`🔍 File selection attempt: ${file.name}`);

    // Enforce CSV validation
    const isCSV = /\.csv$/i.test(file.name);
    if (!isCSV) {
      console.warn('❌ Invalid file type (expected .csv)');
      toastr.warning('⚠️ Invalid file type. Please upload a CSV file.');
      // Reset state
      fileInput.value = '';
      fileNameDisplay.textContent = '';
      submitBtn.disabled = true;
      return;
    }

    // Valid CSV
    fileNameDisplay.textContent = `📄 Selected: ${file.name}`;
    submitBtn.disabled = false;
    console.log('✅ Valid CSV detected — submit button enabled');
    toastr.info(`File ready for analysis: ${file.name}`);

    // Parse CSV (header + first 50 rows) for modal preview
    parseCsvForModal(file);
  }

  // ===============================
  // EVENT LISTENER 1: FILE UPLOAD
  // ===============================
  submitBtn.addEventListener('click', async () => {
    // CRITICAL: Early validation check - must have valid CSV file
    const file = fileInput.files[0];

    if (!file) {
      console.warn('❌ No file selected — analysis aborted');
      toastr.warning(
        '⚠️ Please select a valid CSV file before initiating analysis.'
      );
      submitBtn.disabled = true;
      return; // IMMEDIATE EXIT
    }

    if (!/\.csv$/i.test(file.name)) {
      console.warn('❌ Invalid file type selected — analysis aborted');
      toastr.warning(
        '⚠️ Please select a valid CSV file before initiating analysis.'
      );
      submitBtn.disabled = true;
      fileInput.value = '';
      fileNameDisplay.textContent = '';
      return; // IMMEDIATE EXIT
    }

    // Validation passed - proceed with analysis
    console.log(`🚀 Starting analysis for file: ${file.name}`);
    consoleLog('> Initializing AegisNet Core...', 'info');
    submitBtn.disabled = true;
    showLoader();
    toastr.info('🔍 Analyzing file... Please wait.', 'Processing');

    const formData = new FormData();
    formData.append('file', file);

    try {
      consoleLog('> Dataset validated successfully.', 'success');
      consoleLog('> Running deep threat scan...', 'info');
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const data = await response.json();
      hideLoader();

      if (data.status === 'success') {
        updateUIWithResults(data);
        consoleLog(
          `> ${data.attack_count} threats detected across ${
            data.feature_importances
              ? Object.keys(data.feature_importances).length
              : 0
          } feature clusters.`,
          'success'
        );
        consoleLog('> Analysis complete.', 'success');
        toastr.success(
          `✅ Analysis complete. ${data.attack_count} threats detected.`,
          'Success'
        );
      } else {
        throw new Error(data.error || 'Unexpected API response');
      }
    } catch (error) {
      hideLoader();
      submitBtn.disabled = false;
      console.error('❌ File Upload Error:', error);
      consoleLog(`> Error: ${error.message}`, 'error');
      toastr.error(`Analysis Failed: ${error.message}`, 'Error');
    } finally {
      submitBtn.disabled = false;
    }
  });

  // ===============================
  // EVENT LISTENER 2: MANUAL ANALYSIS
  // ===============================
  manualForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    toastr.info('🔍 Analyzing single flow...', 'Processing');
    manualSubmitBtn.disabled = true;
    showLoader();

    const formData = {};
    TOP_FEATURES.forEach((feature) => {
      const inputElement = document.getElementById(feature);
      const value = inputElement.value.trim();
      formData[feature] = value ? parseFloat(value) : 0.0;
    });

    try {
      const response = await fetch(`${API_BASE_URL}/predict_single`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const data = await response.json();
      hideLoader();

      if (data.status === 'success') {
        updateManualResult(data);
        toastr.success(`Analysis Complete: ${data.prediction}`, 'Success');
      } else {
        throw new Error(data.error || 'Unknown server error');
      }
    } catch (error) {
      hideLoader();
      console.error('❌ Manual Analysis Error:', error);
      manualResult.classList.remove('safe', 'danger');
      manualResult.classList.add('danger');
      manualResult.textContent = `❌ ERROR: ${error.message}`;
      toastr.error(`Analysis Failed: ${error.message}`, 'Error');
    } finally {
      manualSubmitBtn.disabled = false;
    }
  });

  // ===============================
  // HELPER FUNCTIONS
  // ===============================
  function populateManualForm() {
    let formHTML = '';
    TOP_FEATURES.forEach((feature) => {
      formHTML += `
        <div class="manual-input-group">
          <label for="${feature}" class="manual-input-label">${feature}</label>
          <input 
            type="number" 
            id="${feature}" 
            name="${feature}" 
            class="manual-input-field"
            placeholder="0.0" 
            step="any" 
            required
          />
        </div>`;
    });
    manualFormInputs.innerHTML = formHTML;
    console.log(
      '✅ Manual form populated with',
      TOP_FEATURES.length,
      'features'
    );
  }

  function initializeChart() {
    const ctx = document.getElementById('threatChart');
    if (!ctx) {
      console.error('❌ Chart canvas not found');
      return;
    }
    const theme = document.documentElement.getAttribute('data-theme') || 'neon';
    const isMagenta = theme === 'magenta';
    const doughnutColors = isMagenta
      ? ['#ff00ff', '#00bfff']
      : ['#00ff00', '#ff3333'];
    const legendColor = isMagenta ? '#ff00ff' : '#00ff00';
    const titleColor = isMagenta ? '#ff00ff' : '#00ffff';
    resultsChartInstance = new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Benign', 'Attacks'],
        datasets: [
          {
            data: [0, 0],
            backgroundColor: doughnutColors,
            borderColor: doughnutColors,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: legendColor,
              font: { family: 'Share Tech Mono', size: 14 },
              padding: 20,
            },
          },
          title: {
            display: true,
            text: 'THREAT ANALYSIS',
            color: titleColor,
            font: { family: 'Share Tech Mono', size: 18, weight: 'bold' },
            padding: 20,
          },
        },
      },
    });
    console.log('✅ Chart initialized successfully');
  }

  function updateUIWithResults(data) {
    const {
      total_flows,
      benign_count,
      attack_count,
      threat_indices,
      threat_details,
      feature_importances,
    } = data;

    awaitingData.style.display = 'none';
    chartContainer.style.display = 'block';
    readoutContainer.style.display = 'block';

    totalFlowsEl.textContent = total_flows.toLocaleString();
    benignFlowsEl.textContent = benign_count.toLocaleString();
    threatFlowsEl.textContent = attack_count.toLocaleString();

    if (resultsChartInstance) {
      resultsChartInstance.data.datasets[0].data = [benign_count, attack_count];
      resultsChartInstance.update();
    }

    // Handle threat indices display
    if (threat_indices && threat_indices.length > 0) {
      currentThreatIndices = threat_indices;
      currentThreatDetails = Array.isArray(threat_details)
        ? threat_details
        : [];
      displayThreatIndices(threat_indices);
      threatRecordsPanel.classList.add('active');
    } else {
      threatRecordsPanel.classList.remove('active');
    }

    // Quick Insights
    const pct =
      total_flows > 0
        ? ((attack_count / total_flows) * 100).toFixed(2)
        : '0.00';
    insightsLine.textContent = `Out of ${total_flows.toLocaleString()} total flows, ${attack_count.toLocaleString()} (${pct}%) were identified as potential threats.`;
    metricThreatPct.textContent = `${pct}%`;
    metricBenignCount.textContent = `${benign_count.toLocaleString()} Benign`;
    metricAttackCount.textContent = `${attack_count.toLocaleString()} Threats`;
    quickInsights.style.display = 'block';
    requestAnimationFrame(() => quickInsights.classList.add('show'));

    // Feature Importance chart (optional)
    if (feature_importances && typeof feature_importances === 'object') {
      const labels = Object.keys(feature_importances);
      const values = Object.values(feature_importances).map((v) =>
        Number((v * 100).toFixed(2))
      );
      renderFeatureChart(labels, values);
      fiChartContainer.style.display = 'block';
    } else {
      fiChartContainer.style.display = 'none';
    }

    submitBtn.disabled = false;
  }

  function updateManualResult(data) {
    const { prediction, confidence_score } = data;
    manualResult.classList.remove('safe', 'danger');

    const confidencePercent = (confidence_score * 100).toFixed(2);

    if (prediction === 'ATTACK') {
      manualResult.classList.add('danger');
      manualResult.textContent = `⚠️ RESULT: THREAT DETECTED (Confidence: ${confidencePercent}%)`;
    } else {
      manualResult.classList.add('safe');
      manualResult.textContent = `✅ RESULT: FLOW IS BENIGN (Confidence: ${confidencePercent}%)`;
    }
  }

  // ===============================
  // THREAT PANEL FUNCTIONS
  // ===============================
  function initializeThreatPanel() {
    // Toggle panel collapse/expand
    if (threatPanelHeader) {
      threatPanelHeader.addEventListener('click', () => {
        const isCollapsed = threatPanelContent.classList.contains('collapsed');
        if (isCollapsed) {
          threatPanelContent.classList.remove('collapsed');
          threatPanelToggle.classList.remove('collapsed');
          threatPanelToggle.textContent = '▼';
        } else {
          threatPanelContent.classList.add('collapsed');
          threatPanelToggle.classList.add('collapsed');
          threatPanelToggle.textContent = '▶';
        }
      });
    }

    // Download threat log
    if (downloadThreatBtn) {
      downloadThreatBtn.addEventListener('click', () => {
        downloadThreatLog();
      });
    }

    console.log('✅ Threat panel initialized');
  }

  function displayThreatIndices(indices) {
    if (!threatIndicesList) return;

    // Clear previous content
    threatIndicesList.innerHTML = '';
    threatMoreText.style.display = 'none';

    // Display first 50 indices
    const displayCount = Math.min(50, indices.length);
    const displayIndices = indices.slice(0, displayCount);

    displayIndices.forEach((index) => {
      const indexItem = document.createElement('span');
      indexItem.className = 'threat-index-item';
      indexItem.textContent = `Row ${index}`;
      threatIndicesList.appendChild(indexItem);
    });

    // Show "and more" message if there are more than 50
    if (indices.length > 50) {
      threatMoreText.style.display = 'block';
      threatMoreText.textContent = `...and ${
        indices.length - 50
      } more. Download full log below.`;
    }

    console.log(
      `✅ Displayed ${displayCount} of ${indices.length} threat indices`
    );
  }

  function downloadThreatLog() {
    if (!currentThreatDetails || currentThreatDetails.length === 0) {
      toastr.warning('⚠️ No threat records to download.');
      return;
    }
    // Build CSV content
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const headers = ['row_number', 'predicted_label', 'confidence_score'];
    const rows = currentThreatDetails.map((d) => [
      d.row_number,
      d.predicted_label,
      d.confidence_score,
    ]);
    const csvLines = [headers.join(','), ...rows.map((r) => r.join(','))];
    const csvContent = csvLines.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AegisNet_Threat_Log_${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toastr.success(
      `📥 Threat CSV downloaded: ${rows.length} rows`,
      'Download Complete'
    );
    console.log(`✅ Downloaded threat CSV with ${rows.length} rows`);
  }

  function renderFeatureChart(labels, values) {
    if (!featureChartEl) return;
    if (featureChartInstance) {
      featureChartInstance.destroy();
    }
    const theme = document.documentElement.getAttribute('data-theme') || 'neon';
    const isMagenta = theme === 'magenta';
    const accent = isMagenta ? '#00bfff' : '#00ffff';
    const primary = isMagenta ? '#ff00ff' : '#00ff00';
    featureChartInstance = new Chart(featureChartEl.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Importance (%)',
            data: values,
            backgroundColor: accent + 'AA',
            borderColor: accent,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: accent, font: { family: 'Share Tech Mono' } },
          },
          title: {
            display: true,
            text: '🔥 Top Threat-Influencing Features',
            color: accent,
            font: { family: 'Share Tech Mono', size: 18, weight: 'bold' },
          },
        },
        scales: {
          x: {
            ticks: { color: primary, font: { family: 'Share Tech Mono' } },
            grid: { color: 'rgba(0, 191, 255, 0.15)' },
          },
          y: {
            ticks: { color: primary, font: { family: 'Share Tech Mono' } },
            grid: { color: 'rgba(0, 191, 255, 0.15)' },
          },
        },
      },
    });
  }

  // ===============================
  // CSV PREVIEW FUNCTIONS
  // ===============================
  // ===============================
  // CSV MODAL PARSING & RENDERING
  // ===============================
  function parseCsvForModal(file) {
    if (!file) return;
    const usePapa = typeof Papa !== 'undefined';
    if (usePapa) {
      Papa.parse(file, {
        header: true,
        preview: 50, // capture more rows for richer preview
        skipEmptyLines: true,
        complete: (results) => {
          const columns = results.meta?.fields || [];
          const rows = results.data || [];
          latestCsvMeta = {
            columns,
            previewRows: rows,
            file,
            totalRows: rows.length, // approximate (preview size)
          };
          if (openCsvPreviewBtn) {
            openCsvPreviewBtn.disabled = false;
          }
          consoleLog(
            `> CSV parsed: ${columns.length} columns, preview ${rows.length} rows`,
            'success'
          );
        },
        error: (err) => {
          console.error('PapaParse error:', err);
          fallbackFileReader(file);
        },
      });
    } else {
      fallbackFileReader(file);
    }
  }

  function fallbackFileReader(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (!lines.length) return;
      const header = lines[0].split(',');
      const rowsRaw = lines.slice(1, 51).map((line) => line.split(','));
      const rows = rowsRaw.map((r) =>
        Object.fromEntries(r.map((v, i) => [header[i], v]))
      );
      latestCsvMeta = {
        columns: header,
        previewRows: rows,
        file,
        totalRows: rows.length,
      };
      if (openCsvPreviewBtn) openCsvPreviewBtn.disabled = false;
      consoleLog(
        `> CSV parsed (fallback): ${header.length} columns, preview ${rows.length} rows`,
        'info'
      );
    };
    reader.readAsText(file);
  }

  function openCsvModal() {
    if (!latestCsvMeta || !csvModal) return;
    // Clear previous
    csvModalColumns.innerHTML = '';
    csvModalThead.innerHTML = '';
    csvModalTbody.innerHTML = '';
    csvModalStats.textContent = '';

    const { columns, previewRows, totalRows } = latestCsvMeta;
    // Columns chips
    columns.forEach((col) => {
      const span = document.createElement('span');
      span.textContent = col;
      csvModalColumns.appendChild(span);
    });
    csvModalStats.textContent = `Columns: ${columns.length} | Preview Rows: ${previewRows.length}`;
    // Header row
    const trHead = document.createElement('tr');
    columns.forEach((c) => {
      const th = document.createElement('th');
      th.textContent = c;
      trHead.appendChild(th);
    });
    csvModalThead.appendChild(trHead);
    // Body rows
    previewRows.forEach((rowObj) => {
      const tr = document.createElement('tr');
      columns.forEach((c) => {
        const td = document.createElement('td');
        td.textContent = rowObj[c];
        tr.appendChild(td);
      });
      csvModalTbody.appendChild(tr);
    });

    csvModal.style.display = 'block';
    csvModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    if (closeCsvModalBtn) closeCsvModalBtn.focus();
  }

  function closeCsvModal() {
    if (!csvModal) return;
    csvModal.style.display = 'none';
    csvModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  // Resize logic
  let resizing = false;
  let startX = 0;
  let startY = 0;
  let startW = 0;
  let startH = 0;
  if (csvModalResizeHandle) {
    csvModalResizeHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      resizing = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = csvModalContent.getBoundingClientRect();
      startW = rect.width;
      startH = rect.height;
      document.addEventListener('mousemove', resizeModal);
      document.addEventListener('mouseup', stopResize);
    });
  }

  function resizeModal(e) {
    if (!resizing) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    let newW = startW + dx;
    let newH = startH + dy;
    // Bounds
    newW = Math.max(480, Math.min(newW, window.innerWidth * 0.95));
    newH = Math.max(320, Math.min(newH, window.innerHeight * 0.85));
    csvModalContent.style.width = newW + 'px';
    csvModalContent.style.height = newH + 'px';
  }

  function stopResize() {
    resizing = false;
    document.removeEventListener('mousemove', resizeModal);
    document.removeEventListener('mouseup', stopResize);
  }

  // Event bindings for modal
  if (openCsvPreviewBtn) {
    openCsvPreviewBtn.addEventListener('click', () => openCsvModal());
  }
  if (closeCsvModalBtn) {
    closeCsvModalBtn.addEventListener('click', () => closeCsvModal());
  }
  if (csvModalBackdrop) {
    csvModalBackdrop.addEventListener('click', () => closeCsvModal());
  }
  if (downloadCsvBtn) {
    downloadCsvBtn.addEventListener('click', () => {
      if (!latestCsvMeta || !latestCsvMeta.file) {
        toastr.warning('⚠️ No CSV loaded.');
        return;
      }
      const file = latestCsvMeta.file;
      const blobUrl = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = file.name || 'dataset.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toastr.success('📥 Original CSV downloaded.', 'Download Complete');
    });
  }

  // ESC key handling
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && csvModal && csvModal.style.display === 'block') {
      closeCsvModal();
    }
  });

  // ===============================
  // SYSTEM CONSOLE FUNCTIONS
  // ===============================
  function consoleLog(message, type = 'info') {
    if (!systemConsoleBody) return;
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.textContent = message;
    systemConsoleBody.appendChild(line);
    systemConsoleBody.scrollTop = systemConsoleBody.scrollHeight;
  }

  console.log('✅ Initialization Complete');
});

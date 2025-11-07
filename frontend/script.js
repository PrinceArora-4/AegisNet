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

  // Store threat indices globally for download
  let currentThreatIndices = [];

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
    submitBtn.disabled = true;
    showLoader();
    toastr.info('🔍 Analyzing file... Please wait.', 'Processing');

    const formData = new FormData();
    formData.append('file', file);

    try {
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

    resultsChartInstance = new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Benign', 'Attacks'],
        datasets: [
          {
            data: [0, 0],
            backgroundColor: ['#00ff00', '#ff3333'],
            borderColor: ['#00ff00', '#ff3333'],
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
              color: '#00ff00',
              font: { family: 'Share Tech Mono', size: 14 },
              padding: 20,
            },
          },
          title: {
            display: true,
            text: 'THREAT ANALYSIS',
            color: '#00ffff',
            font: { family: 'Share Tech Mono', size: 18, weight: 'bold' },
            padding: 20,
          },
        },
      },
    });
    console.log('✅ Chart initialized successfully');
  }

  function updateUIWithResults(data) {
    const { total_flows, benign_count, attack_count, threat_indices } = data;

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
      displayThreatIndices(threat_indices);
      threatRecordsPanel.classList.add('active');
    } else {
      threatRecordsPanel.classList.remove('active');
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
    if (!currentThreatIndices || currentThreatIndices.length === 0) {
      toastr.warning('⚠️ No threat records to download.');
      return;
    }

    // Create text content
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let content = `AegisNet Sentinel - Threat Records Log\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `Total Threats Identified: ${currentThreatIndices.length}\n`;
    content += `${'='.repeat(60)}\n\n`;
    content += `Threat Row Indices (1-based):\n`;
    content += currentThreatIndices.join(', ');
    content += `\n\n${'='.repeat(60)}\n`;
    content += `End of Report\n`;

    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AegisNet_Threat_Log_${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toastr.success(
      `📥 Threat log downloaded: ${currentThreatIndices.length} records`,
      'Download Complete'
    );
    console.log(
      `✅ Downloaded threat log with ${currentThreatIndices.length} indices`
    );
  }

  console.log('✅ Initialization Complete');
});

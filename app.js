/* ============================================
   TrackWealth — App Logic
   ============================================ */

(function () {
  'use strict';

  // ── Constants ──
  const STORAGE_KEY = 'trackwealth_instruments';

  const CATEGORY_META = {
    'mutual-funds': { icon: '📊', color: '#6c63ff' },
    'stocks':       { icon: '📈', color: '#4dabf7' },
    'epf':          { icon: '🏛️', color: '#38d9a9' },
    'nps':          { icon: '🏦', color: '#f5c542' },
    'bank':         { icon: '🏠', color: '#9775fa' },
    'fd':           { icon: '🔒', color: '#ff922b' },
    'gold':         { icon: '🥇', color: '#f5c542' },
    'crypto':       { icon: '₿',  color: '#ff6b6b' },
    'real-estate':  { icon: '🏢', color: '#a9e34b' },
    'other':        { icon: '💼', color: '#22b8cf' },
  };

  const CHART_COLORS = [
    '#6c63ff', '#4dabf7', '#38d9a9', '#f5c542', '#9775fa',
    '#ff922b', '#ff6b6b', '#a9e34b', '#f06595', '#22b8cf',
    '#5c7cfa', '#20c997',
  ];

  // ── State ──
  let instruments = loadInstruments();

  // ── DOM Elements ──
  const $totalWealth       = document.getElementById('total-wealth');
  const $totalChange       = document.getElementById('total-change');
  const $totalInstruments  = document.getElementById('total-instruments');
  const $topAllocation     = document.getElementById('top-allocation');
  const $avgInvestment     = document.getElementById('avg-investment');
  const $instrumentList    = document.getElementById('instrument-list');
  const $emptyState        = document.getElementById('empty-state');
  const $addFormWrapper    = document.getElementById('add-form-wrapper');
  const $addForm           = document.getElementById('add-form');
  const $btnAdd            = document.getElementById('btn-add-instrument');
  const $btnAddEmpty       = document.getElementById('btn-add-empty');
  const $btnCancel         = document.getElementById('btn-cancel');
  const $chartSection      = document.getElementById('chart-section');
  const $chartCanvas       = document.getElementById('allocation-chart');
  const $chartTotal        = document.getElementById('chart-total');
  const $chartLegend       = document.getElementById('chart-legend');
  const $editModal         = document.getElementById('edit-modal');
  const $editForm          = document.getElementById('edit-form');
  const $modalClose        = document.getElementById('modal-close');
  const $deleteBtn         = document.getElementById('btn-delete-instrument');
  const $toast             = document.getElementById('toast');
  const $btnExport         = document.getElementById('btn-export');
  const $btnImport         = document.getElementById('btn-import');
  const $fileInput         = document.getElementById('file-input');

  // ── Init ──
  render();
  bindEvents();

  // ── Persistence ──
  function loadInstruments() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveInstruments() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(instruments));
  }

  // ── Formatting ──
  function formatCurrency(num) {
    if (num === undefined || num === null) return '₹0';
    const absNum = Math.abs(num);
    // Indian numbering system
    if (absNum >= 10000000) {
      return (num < 0 ? '-' : '') + '₹' + (absNum / 10000000).toFixed(2) + ' Cr';
    }
    if (absNum >= 100000) {
      return (num < 0 ? '-' : '') + '₹' + (absNum / 100000).toFixed(2) + ' L';
    }
    return '₹' + num.toLocaleString('en-IN');
  }

  function formatFullCurrency(num) {
    if (num === undefined || num === null) return '₹0';
    return '₹' + Math.round(num).toLocaleString('en-IN');
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ── Rendering ──
  function render() {
    renderHero();
    renderInsights();
    renderInstruments();
    renderChart();
  }

  function renderHero() {
    const total = instruments.reduce((sum, i) => sum + (i.amount || 0), 0);

    // Animate total amount with counting effect
    animateValue($totalWealth, total);

    // Calculate weighted daily change
    if (total > 0) {
      let weightedChange = 0;
      instruments.forEach(inst => {
        const change = inst.dailyChange || 0;
        const weight = inst.amount / total;
        weightedChange += change * weight;
      });
      const changeAmount = total * (weightedChange / 100);
      const isPositive = weightedChange >= 0;

      $totalChange.className = 'hero-change' + (isPositive ? '' : ' negative');
      $totalChange.innerHTML = `
        <span class="change-icon">${isPositive ? '↑' : '↓'}</span>
        <span class="change-value">${formatFullCurrency(Math.abs(changeAmount))} (${Math.abs(weightedChange).toFixed(2)}%)</span>
        <span class="change-period">1 DAY</span>
      `;
    } else {
      $totalChange.className = 'hero-change';
      $totalChange.innerHTML = `
        <span class="change-icon">↑</span>
        <span class="change-value">₹0 (0.00%)</span>
        <span class="change-period">1 DAY</span>
      `;
    }
  }

  function animateValue(element, target) {
    const duration = 800;
    const start = parseInt(element.dataset.current || '0');
    element.dataset.current = target;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * eased);
      element.textContent = formatFullCurrency(current);
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  function renderInsights() {
    const total = instruments.reduce((sum, i) => sum + (i.amount || 0), 0);
    const count = instruments.length;

    $totalInstruments.textContent = count;

    if (count > 0) {
      // Find top allocation
      const sorted = [...instruments].sort((a, b) => b.amount - a.amount);
      $topAllocation.textContent = sorted[0].name.length > 12
        ? sorted[0].name.slice(0, 12) + '…'
        : sorted[0].name;

      // Average
      $avgInvestment.textContent = formatCurrency(Math.round(total / count));
    } else {
      $topAllocation.textContent = '—';
      $avgInvestment.textContent = '₹0';
    }
  }

  function renderInstruments() {
    const total = instruments.reduce((sum, i) => sum + (i.amount || 0), 0);

    if (instruments.length === 0) {
      $instrumentList.innerHTML = '';
      $emptyState.style.display = 'block';
      return;
    }

    $emptyState.style.display = 'none';

    // Sort by amount descending
    const sorted = [...instruments].sort((a, b) => b.amount - a.amount);

    $instrumentList.innerHTML = sorted.map((inst, idx) => {
      const meta = CATEGORY_META[inst.category] || CATEGORY_META['other'];
      const allocation = total > 0 ? ((inst.amount / total) * 100).toFixed(2) : '0.00';
      const change = inst.dailyChange || 0;
      const changeClass = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
      const changeText = change !== 0
        ? `${change > 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(2)}% (1 DAY)`
        : '—';

      return `
        <div class="instrument-card" data-id="${inst.id}" style="animation-delay: ${idx * 0.05}s" tabindex="0">
          <div class="instrument-icon" style="background: ${meta.color}18; color: ${meta.color}">
            ${meta.icon}
          </div>
          <div class="instrument-info">
            <div class="instrument-name">${escapeHtml(inst.name)}</div>
            <div class="instrument-allocation">${allocation}% ALLOCATION</div>
          </div>
          <div class="instrument-value">
            <div class="instrument-amount">${formatFullCurrency(inst.amount)}</div>
            <div class="instrument-daily ${changeClass}">${changeText}</div>
          </div>
          <span class="instrument-arrow">›</span>
        </div>
      `;
    }).join('');

    // Attach click events
    document.querySelectorAll('.instrument-card').forEach(card => {
      card.addEventListener('click', () => openEditModal(card.dataset.id));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openEditModal(card.dataset.id);
        }
      });
    });
  }

  function renderChart() {
    if (instruments.length === 0) {
      $chartSection.style.display = 'none';
      return;
    }

    $chartSection.style.display = 'block';
    const total = instruments.reduce((sum, i) => sum + (i.amount || 0), 0);
    $chartTotal.textContent = formatCurrency(total);

    const sorted = [...instruments].sort((a, b) => b.amount - a.amount);
    const canvas = $chartCanvas;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 240;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2 - 8;
    const innerR = outerR * 0.65;
    const gap = 0.02; // gap between slices in radians

    ctx.clearRect(0, 0, size, size);

    let currentAngle = -Math.PI / 2;

    sorted.forEach((inst, i) => {
      const fraction = total > 0 ? inst.amount / total : 0;
      const sliceAngle = fraction * Math.PI * 2;
      const color = CHART_COLORS[i % CHART_COLORS.length];

      if (sliceAngle > gap * 2) {
        const start = currentAngle + gap;
        const end = currentAngle + sliceAngle - gap;

        ctx.beginPath();
        ctx.arc(cx, cy, outerR, start, end);
        ctx.arc(cx, cy, innerR, end, start, true);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      }

      currentAngle += sliceAngle;
    });

    // Legend
    $chartLegend.innerHTML = sorted.map((inst, i) => {
      const color = CHART_COLORS[i % CHART_COLORS.length];
      const pct = total > 0 ? ((inst.amount / total) * 100).toFixed(1) : '0';
      return `
        <div class="legend-item">
          <span class="legend-dot" style="background: ${color}"></span>
          ${escapeHtml(inst.name)} (${pct}%)
        </div>
      `;
    }).join('');
  }

  // ── Events ──
  function bindEvents() {
    $btnAdd.addEventListener('click', toggleForm);
    $btnAddEmpty.addEventListener('click', toggleForm);
    $btnCancel.addEventListener('click', closeForm);

    $addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addInstrument();
    });

    $modalClose.addEventListener('click', closeEditModal);
    $editModal.addEventListener('click', (e) => {
      if (e.target === $editModal) closeEditModal();
    });

    $editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveEdit();
    });

    $deleteBtn.addEventListener('click', deleteInstrument);

    // Data management
    $btnExport.addEventListener('click', exportData);
    $btnImport.addEventListener('click', () => $fileInput.click());
    $fileInput.addEventListener('change', importData);

    // ESC to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if ($editModal.style.display !== 'none') closeEditModal();
        if ($addFormWrapper.classList.contains('open')) closeForm();
      }
    });
  }

  function toggleForm() {
    const isOpen = $addFormWrapper.classList.contains('open');
    if (isOpen) {
      closeForm();
    } else {
      $addFormWrapper.classList.add('open');
      document.getElementById('instrument-name').focus();
    }
  }

  function closeForm() {
    $addFormWrapper.classList.remove('open');
    $addForm.reset();
  }

  function addInstrument() {
    const name = document.getElementById('instrument-name').value.trim();
    const category = document.getElementById('instrument-category').value;
    const amount = parseFloat(document.getElementById('instrument-amount').value) || 0;
    const dailyChange = parseFloat(document.getElementById('instrument-change').value) || 0;

    if (!name || amount <= 0) {
      showToast('Please enter a valid name and amount');
      return;
    }

    const instrument = {
      id: generateId(),
      name,
      category,
      amount,
      dailyChange,
      createdAt: Date.now(),
    };

    instruments.push(instrument);
    saveInstruments();
    closeForm();
    render();
    showToast(`${name} added successfully ✓`);
  }

  function openEditModal(id) {
    const inst = instruments.find(i => i.id === id);
    if (!inst) return;

    document.getElementById('edit-id').value = inst.id;
    document.getElementById('edit-name').value = inst.name;
    document.getElementById('edit-category').value = inst.category;
    document.getElementById('edit-amount').value = inst.amount;
    document.getElementById('edit-change').value = inst.dailyChange || '';

    $editModal.style.display = 'flex';
    document.getElementById('edit-name').focus();
  }

  function closeEditModal() {
    $editModal.style.display = 'none';
    $editForm.reset();
  }

  function saveEdit() {
    const id = document.getElementById('edit-id').value;
    const idx = instruments.findIndex(i => i.id === id);
    if (idx === -1) return;

    instruments[idx].name = document.getElementById('edit-name').value.trim();
    instruments[idx].category = document.getElementById('edit-category').value;
    instruments[idx].amount = parseFloat(document.getElementById('edit-amount').value) || 0;
    instruments[idx].dailyChange = parseFloat(document.getElementById('edit-change').value) || 0;

    saveInstruments();
    closeEditModal();
    render();
    showToast('Instrument updated ✓');
  }

  function deleteInstrument() {
    const id = document.getElementById('edit-id').value;
    const inst = instruments.find(i => i.id === id);
    if (!inst) return;

    instruments = instruments.filter(i => i.id !== id);
    saveInstruments();
    closeEditModal();
    render();
    showToast(`${inst.name} deleted`);
  }

  // ── Export / Import ──
  function exportData() {
    if (instruments.length === 0) {
      showToast('Nothing to export — add some instruments first');
      return;
    }

    const exportPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      instruments: instruments,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `trackwealth-backup-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Exported ${instruments.length} instruments ✓`);
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      try {
        const data = JSON.parse(evt.target.result);

        // Validate structure
        let importedItems;
        if (Array.isArray(data)) {
          // Plain array of instruments
          importedItems = data;
        } else if (data && Array.isArray(data.instruments)) {
          // Wrapped export format
          importedItems = data.instruments;
        } else {
          showToast('Invalid file — expected a TrackWealth JSON export');
          return;
        }

        // Validate each instrument has required fields
        const valid = importedItems.every(item =>
          item && typeof item.name === 'string' && typeof item.amount === 'number'
        );

        if (!valid || importedItems.length === 0) {
          showToast('Invalid data — each instrument needs a name and amount');
          return;
        }

        // Ensure each item has an id and category
        importedItems.forEach(item => {
          if (!item.id) item.id = generateId();
          if (!item.category) item.category = 'other';
          if (typeof item.dailyChange !== 'number') item.dailyChange = 0;
          if (!item.createdAt) item.createdAt = Date.now();
        });

        instruments = importedItems;
        saveInstruments();
        render();
        showToast(`Imported ${importedItems.length} instruments ✓`);
      } catch (err) {
        showToast('Failed to read file — make sure it\'s valid JSON');
      }
    };
    reader.readAsText(file);

    // Reset so the same file can be re-imported
    $fileInput.value = '';
  }

  function showToast(message) {
    $toast.textContent = message;
    $toast.classList.add('show');
    setTimeout(() => $toast.classList.remove('show'), 2500);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();

// Chart instances for destroying and re-creating charts dynamically
let intakeChartInstance = null;
let durationChartInstance = null;
let reasonChartInstance = null;
let yearChartInstance = null;
let speciesChartInstance = null;

// Arrays to manage star data for the starry background
let stars = [];         // Stars already fixed in the sky
let risingStars = [];   // Stars currently rising
let canvas, ctx;        // Canvas element and its 2D context

// Fetch and parse CSV data asynchronously using PapaParse library
async function fetchCSV(path) {
  const response = await fetch(path);
  const text = await response.text();
  return Papa.parse(text, { header: true, skipEmptyLines: true }).data;
}

// Filter data to include only deceased or euthanized animals
function getMemorialAnimals(data) {
  return data.filter(a => a.puttosleep === '1' || a.deceaseddate);
}

// Increment star count and trigger a rising star
function lightCandle() {
  let count = parseInt(localStorage.getItem('candleCount') || '0');
  count++;
  localStorage.setItem('candleCount', count);
  document.getElementById('candle-count').innerText = count;
  spawnRisingStar();
}

// Load star count from localStorage and display
function loadCandleCount() {
  let count = parseInt(localStorage.getItem('candleCount') || '0');
  document.getElementById('candle-count').innerText = count;
}

// Export a chart as PNG using a temporary link
function exportChart(canvasId) {
  const link = document.createElement('a');
  link.download = `${canvasId}.png`;
  link.href = document.getElementById(canvasId).toDataURL('image/png');
  link.click();
}

// Render summary charts: pie (reason, species), bar (year)
function renderSummaryCharts(animals) {
  if (reasonChartInstance) reasonChartInstance.destroy();
  if (yearChartInstance) yearChartInstance.destroy();
  if (speciesChartInstance) speciesChartInstance.destroy();     // Destroy existing instances if they exist

// Count data
  const reasonCounts = {}, yearCounts = {}, speciesCounts = {};
  animals.forEach(a => {
    const reason = a.deceasedreason || 'Unknown';
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;

    if (a.deceaseddate) {
      const year = a.deceaseddate.slice(0,4);
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    }

    const species = a.speciesname || 'Unknown';
    speciesCounts[species] = (speciesCounts[species] || 0) + 1;
  });

// Initialize charts using Chart.js
  reasonChartInstance = new Chart(reasonChart, {
    type: 'pie',
    data: {
      labels: Object.keys(reasonCounts),
      datasets: [{
        data: Object.values(reasonCounts),
        backgroundColor: ['#7bc47f', '#ffb347', '#6ec6ff', '#f08080', '#fdd835', '#ce93d8']
      }]
    }
  });

  yearChartInstance = new Chart(yearChart, {
    type: 'bar',
    data: {
      labels: Object.keys(yearCounts),
      datasets: [{
        label: 'Annual death amount',
        data: Object.values(yearCounts),
        backgroundColor: '#7bc47f'
      }]
    }
  });

  speciesChartInstance = new Chart(speciesChart, {
    type: 'pie',
    data: {
      labels: Object.keys(speciesCounts),
      datasets: [{
        data: Object.values(speciesCounts),
        backgroundColor: ['#ffb347', '#7bc47f', '#6ec6ff', '#ce93d8']
      }]
    }
  });
}

// Render Memorial Wall cards with onclick to details
function renderMemorialWall(animals) {
  const wall = document.getElementById('memorial-wall');
  wall.innerHTML = '';
  animals.forEach(a => {
    const card = document.createElement('div');
    card.className = 'animal-card';
    card.innerHTML = `
      <h3>${a.animalname || 'Unknown'}</h3>
      <p>${a.speciesname}</p>
      <p>${a.deceaseddate || 'N/A'}</p>`;
    card.onclick = () => {
      localStorage.setItem('selectedAnimal', JSON.stringify(a));
      window.location.href = 'animal.html';
    };
    wall.appendChild(card);
  });
}

// Render Animal Detail page from localStorage
function renderAnimalDetail() {
  const a = JSON.parse(localStorage.getItem('selectedAnimal'));
  const div = document.getElementById('animal-detail');
  div.innerHTML = a ? `
    <h2>${a.animalname || 'Unknown'}</h2>
    <p>Species: ${a.speciesname}</p>
    <p>Breed: ${a.breedname}</p>
    <p>Sex: ${a.sexname}</p>
    <p>Intake date: ${a.intakedate}</p>
    <p>Deceased date: ${a.deceaseddate}</p>
    <p>Deceased reason: ${a.deceasedreason}</p>` : '<p>No animal detail</p>';
}

// Render Stray Animal Data for data filters
function renderDataCharts(filtered) {
  if (intakeChartInstance) intakeChartInstance.destroy();
  if (durationChartInstance) durationChartInstance.destroy();

  if (filtered.length === 0) {
    alert("No matching data");
    return;
  }

  const intake = filtered.length;
  const adopted = filtered.filter(a => a.movementtype === 'Adoption').length;
  const euth = filtered.filter(a => a.puttosleep === '1').length;
  const transfer = filtered.filter(a => a.movementtype === 'Transfer').length;

  intakeChartInstance = new Chart(intakeFunnel, {
    type: 'bar',
    data: {
      labels: ['Intake', 'Adopted', 'Euthanatized', 'Transfer'],
      datasets: [{
        label: 'Amount',
        data: [intake, adopted, euth, transfer],
        backgroundColor: ['#7bc47f', '#ffb347', '#f08080', '#6ec6ff']
      }]
    }
  });

  const durations = filtered.map(a => {
    if (!a.intakedate || !a.movementdate) return null;
    return (new Date(a.movementdate) - new Date(a.intakedate)) / (1000 * 60 * 60 * 24);
  }).filter(v => v !== null);

  durationChartInstance = new Chart(durationChart, {
    type: 'bar',
    data: {
      labels: durations.map((_, i) => i + 1),
      datasets: [{
        label: 'Intake Durations(days)',
        data: durations,
        backgroundColor: '#ffb347'
      }]
    }
  });
}

// Calculate simulated euthanasia rate based on user sliders
function simulateEuthRate(base, budget, staff) {
  const reduce = (budget - 1) * 0.05 + (staff - 1) * 0.03;
  return Math.max(0, base * (1 - reduce));
}

// Populate dropdown filter options dynamically
function populateSelectOptions(data) {
  // Build sets for year, species, sex
  const yearSet = new Set();
  const speciesSet = new Set();
  const sexSet = new Set();

  data.forEach(a => {
    if (a.intakedate) yearSet.add(a.intakedate.slice(0, 4));
    if (a.speciesname) speciesSet.add(a.speciesname);
    if (a.sexname) sexSet.add(a.sexname);
  });

  const yearSelect = document.getElementById('filter-year');
  [...yearSet].sort().forEach(y => {
    const opt = document.createElement('option');
    opt.value = y;
    opt.text = y;
    yearSelect.appendChild(opt);
  });

  const speciesSelect = document.getElementById('filter-species');
  [...speciesSet].sort().forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.text = s;
    speciesSelect.appendChild(opt);
  });

  const sexSelect = document.getElementById('filter-sex');
  [...sexSet].sort().forEach(sx => {
    const opt = document.createElement('option');
    opt.value = sx;
    opt.text = sx;
    sexSelect.appendChild(opt);
  });
}

// Setup star canvas and start animation
function setupStarCanvas() {
  canvas = document.getElementById('star-canvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  loadStarsFromStorage();
  animateStars();
}

// Resize canvas to match window size
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// Load stars from localStorage to render in the sky
function loadStarsFromStorage() {
  const count = parseInt(localStorage.getItem('candleCount') || '0');
  stars = [];
  for (let i = 0; i < count; i++) {
    stars.push(createRandomStarAtFixedPosition());
  }
}

// Create a random star at fixed position
function createRandomStarAtFixedPosition() {
  const colors = ['#ffffff', '#cceeff', '#fffae5', '#e5ccff'];
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height * 0.5,
    size: Math.random() * 2 + 1,
    baseOpacity: Math.random() * 0.5 + 0.5,
    phase: Math.random() * Math.PI * 2,
    color: colors[Math.floor(Math.random() * colors.length)]
  };
}

// Create rising star animation
function spawnRisingStar() {
  const colors = ['#ffffff', '#cceeff', '#fffae5', '#e5ccff'];
  risingStars.push({
    x: Math.random() * canvas.width,
    y: canvas.height,
    size: Math.random() * 2 + 1,
    baseOpacity: 1,
    phase: Math.random() * Math.PI * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    speed: Math.random() * 1 + 0.5,
    targetY: Math.random() * canvas.height * 0.5
  });
}

// Main star animation loop
function animateStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const time = Date.now() * 0.002;

  // // Draw fixed stars (flashing)
  for (const s of stars) {
    const flicker = (Math.sin(time + s.phase) + 1) / 2;
    const opacity = s.baseOpacity * (0.5 + flicker * 0.5);
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fillStyle = hexToRGBA(s.color, opacity);
    ctx.fill();
  }

  // Draw rising stars
  for (let i = risingStars.length - 1; i >= 0; i--) {
    const star = risingStars[i];
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fillStyle = hexToRGBA(star.color, star.baseOpacity);
    ctx.fill();

    star.y -= star.speed;

    if (star.y <= star.targetY) {
      // Fixed in the starry sky
      stars.push({
        x: star.x,
        y: star.targetY,
        size: star.size,
        baseOpacity: Math.random() * 0.5 + 0.5, // Give it a flashing reference
        phase: Math.random() * Math.PI * 2,
        color: star.color
      });
      risingStars.splice(i, 1);
    }
  }

  requestAnimationFrame(animateStars);
}

// Convert hex color to rgba with opacity
function hexToRGBA(hex, alpha) {
  const bigint = parseInt(hex.replace('#', ''), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

// Logic of lighting up the stars
function lightCandle() {
  let count = parseInt(localStorage.getItem('candleCount') || '0');
  count++;
  localStorage.setItem('candleCount', count);
  document.getElementById('candle-count').innerText = count;
  spawnRisingStar();
}

// Main init function that sets up page depending on context
async function init() {
  const data = await fetchCSV('stray_animals_data.csv');
  const memorial = getMemorialAnimals(data);

  if (document.getElementById('total-count')) {
    document.getElementById('total-count').innerText = `Total decease/euthanasia: ${memorial.length}`;
    loadCandleCount();
    renderSummaryCharts(memorial);
    setupStarCanvas();
  }

  if (document.getElementById('memorial-wall')) {
    renderMemorialWall(memorial);
  }

  if (document.getElementById('animal-detail')) {
    renderAnimalDetail();
  }

  if (document.getElementById('apply-filters')) {
    populateSelectOptions(data);

    document.getElementById('apply-filters').onclick = () => {
      const year = document.getElementById('filter-year').value;
      const species = document.getElementById('filter-species').value;
      const sex = document.getElementById('filter-sex').value;

      const filtered = data.filter(a =>
        (!year || (a.intakedate && a.intakedate.startsWith(year))) &&
        (!species || a.speciesname === species) &&
        (!sex || a.sexname === sex)
      );

      renderDataCharts(filtered);
    };

    document.getElementById('simulate-btn').onclick = () => {
      const budget = parseFloat(document.getElementById('budget-slider').value);
      const staff = parseFloat(document.getElementById('staff-slider').value);
      const rate = memorial.filter(a => a.puttosleep === '1').length / memorial.length;
      const result = simulateEuthRate(rate, budget, staff);
      document.getElementById('sim-result').innerText = `Simulated euthanasia rate: ${(result * 100).toFixed(2)}%`;
    };
  }
}

init();

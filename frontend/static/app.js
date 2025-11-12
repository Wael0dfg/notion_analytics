// frontend/static/app.js
// Renders all charts and summary boxes, auto-loads on page load.
// Uses Chart.js

// helper to fetch JSON
async function fetchJSON(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  return res.json();
}

// ---------- Initialize Libraries ----------
const dateRangeInput = document.getElementById('dateRange');
const clearButton = document.getElementById('clearRange');
let startDate = null;
let endDate = null;

const fp = flatpickr(dateRangeInput, {
    mode: "range",
    dateFormat: "Y-m-d",
    onChange: function(selectedDates, dateStr, instance) {
        if (selectedDates.length === 2) {
            startDate = instance.formatDate(selectedDates[0], "Y-m-d");
            endDate = instance.formatDate(selectedDates[1], "Y-m-d");
            clearButton.style.display = 'block';
            updateCustomRange(startDate, endDate);
        } else {
            clearButton.style.display = 'none';
        }
    }
});


// Initialize Choices.js on select elements
const choices = new Choices('.choices-select', {
    itemSelectText: '',
    searchEnabled: false,
    placeholder: false,
    shouldSort: false,
});


// ---------- Summary ----------
async function loadSummary(){
  try{
    const data = await fetchJSON('/api/summary');
    document.getElementById('allTime').innerText = data.all_time ?? 0;
    document.getElementById('last7').innerText = data.last_7_days ?? 0;
    document.getElementById('last1').innerText = data.last_1_day ?? 0;
    // clear the date picker and custom range summary
    fp.clear();
    document.getElementById('customRange').innerText = '—';
    clearButton.style.display = 'none';
  }catch(e){
    console.error(e);
  }
}

// Function to update the custom range summary and chart
async function updateCustomRange(start, end) {
  try {
    const url = `/api/summary?start=${start}&end=${end}`;
    const data = await fetchJSON(url);
    document.getElementById('customRange').innerText = data.custom_range ?? 0;
    renderTemplatesRange(start, end);
  } catch (err) {
    console.error(err);
    alert('Failed to fetch range');
  }
}

// Function to clear the custom range
function clearCustomRange() {
  fp.clear();
  document.getElementById('customRange').innerText = '—';
  const canvas = document.getElementById('chartTemplatesRange');
  const chartCard = canvas.closest('.chart-card');
  if (chartTemplatesRange) chartTemplatesRange.destroy();
  chartCard.classList.add('no-data');
  canvas.style.display = 'none';
  clearButton.style.display = 'none';
}

// ---------- Charts ----------
let chartTotal=null, chartTemplates=null, chartWeekdays=null, chartTemplatesRange=null;

async function renderTotal(){
  const d = await fetchJSON('/api/total_downloads');
  const ctx = document.getElementById('chartTotal').getContext('2d');
  if(chartTotal) chartTotal.destroy();
  chartTotal = new Chart(ctx, {
    type: 'line',
    data: { labels: d.labels, datasets: [{ label:'Downloads', data: d.values, borderColor:'#60a5fa', backgroundColor: 'rgba(96,165,250,0.12)', fill:true, tension:0.3 }]},
    options: { responsive:true, plugins:{legend:{display:false}}}
  });
}

async function renderTemplates(){
  const d = await fetchJSON('/api/downloads_by_template');
  const topN = parseInt(document.getElementById('topN').value,10) || 10;
  const labels = d.labels.slice(0,topN);
  const values = d.values.slice(0,topN);
  const ctx = document.getElementById('chartTemplates').getContext('2d');
  if(chartTemplates) chartTemplates.destroy();
  chartTemplates = new Chart(ctx, {
    type:'bar',
    data:{ labels, datasets:[{ label:'Downloads', data:values, backgroundColor:'#34d399' }]},
    options:{ 
      indexAxis:'y', 
      responsive:true, 
      maintainAspectRatio: false,
      plugins:{legend:{display:false}},
      scales: {
        y: {
          ticks: {
            font: {
              size: 10 // Adjust font size for more labels
            },
            autoSkip: false // Don't skip labels
          }
        }
      }
    }
  });
}

// NEW FUNCTION TO RENDER THE CUSTOM RANGE CHART
async function renderTemplatesRange(start, end){
  try{
    const d = await fetchJSON(`/api/downloads_by_template_range?start=${start}&end=${end}`);
    const canvas = document.getElementById('chartTemplatesRange');
    const chartCard = canvas.closest('.chart-card');

    if(chartTemplatesRange) chartTemplatesRange.destroy();
    
    if (d.values.length === 0) {
      chartCard.classList.add('no-data');
      canvas.style.display = 'none';
      return;
    }
    
    chartCard.classList.remove('no-data');
    canvas.style.display = 'block';

    const ctx = canvas.getContext('2d');
    chartTemplatesRange = new Chart(ctx, {
      type:'bar',
      data:{ labels:d.labels, datasets:[{ label:'Downloads', data:d.values, backgroundColor:'#f9a8d4' }]},
      options:{
        indexAxis:'y',
        responsive:true,
        maintainAspectRatio: false,
        plugins:{legend:{display:false}},
        scales: {
          y: {
            ticks: {
              font: {
                size: 10
              },
              autoSkip: false
            }
          }
        }
      }
    });
  } catch(err) {
    console.error(err);
    alert('Failed to fetch custom range template data.');
  }
}

async function renderWeekdays(){
  const d = await fetchJSON('/api/best_weekdays');
  const ctx = document.getElementById('chartWeekdays').getContext('2d');
  if(chartWeekdays) chartWeekdays.destroy();
  chartWeekdays = new Chart(ctx, {
    type:'bar',
    data:{ labels:d.labels, datasets:[{ label:'Downloads', data:d.values, backgroundColor:'#fca5a5' }]},
    options:{ responsive:true, plugins:{legend:{display:false}} }
  });
}

// ---------- Export helpers ----------
function exportChartAsImage(chart, filename){
  if(!chart) return alert('Chart not ready');
  const a = document.createElement('a');
  a.href = chart.toBase64Image('image/png', 1);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ---------- Events ----------
document.getElementById('topN').addEventListener('change', ()=>{
  renderTemplates();
});

document.getElementById('exportTotal').addEventListener('click', ()=>{
  exportChartAsImage(chartTotal, 'total_downloads.png');
});
document.getElementById('exportTemplates').addEventListener('click', ()=>{
  exportChartAsImage(chartTemplates, 'templates.png');
});
document.getElementById('exportTemplatesRange').addEventListener('click', ()=>{
  exportChartAsImage(chartTemplatesRange, 'templates_range.png');
});
document.getElementById('exportWeekdays').addEventListener('click', ()=>{
  exportChartAsImage(chartWeekdays, 'weekdays.png');
});

document.getElementById('clearRange').addEventListener('click', clearCustomRange);

// ---------- Initialize all ----------
async function boot(){
  await loadSummary();
  await Promise.all([renderTotal(), renderTemplates(), renderWeekdays()]);
}
boot();

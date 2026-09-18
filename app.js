// ---------------------------------------------------------------
// Mirrors the RECIPES / ALL_INGREDIENTS in your Code.gs so the
// dropdowns match exactly. If you ever edit recipes on the backend,
// mirror the same edit here.
// ---------------------------------------------------------------
const RECIPES = {
  "REC01": { nameEn: "Vegetable Pulao", nameMr: "वेजिटेबल पुलाव" },
  "REC02": { nameEn: "Moong Dal Khichdi (Wk 1,3)", nameMr: "मुगडाळ खिचडी (आठवडा १,३)" },
  "REC03": { nameEn: "Mug-Shevga Varan Bhat (Wk 1,3)", nameMr: "मुग शेवग्याचे वरण आणि भात (आठवडा १,३)" },
  "REC04": { nameEn: "Masoori Pulao", nameMr: "मसुरी पुलाव" },
  "REC05": { nameEn: "Chana / Harbhara Pulao", nameMr: "चणा / हरभरा पुलाव" },
  "REC06": { nameEn: "Chawli Khichdi", nameMr: "चवळीची खिचडी" },
  "REC07": { nameEn: "Matar Pulao", nameMr: "मटार पुलाव" },
  "REC08": { nameEn: "Mug-Shevga Varan Bhat (Wk 2,4)", nameMr: "मुग शेवग्याचे वरण आणि भात (आठवडा २,४)" },
  "REC09": { nameEn: "Moong Dal Khichdi (Wk 2,4)", nameMr: "मुगडाळ खिचडी (आठवडा २,४)" },
  "REC10": { nameEn: "Masale Bhaat", nameMr: "मसाले भात" },
  "REC11": { nameEn: "Mod Alelya Matki Usal Bhat", nameMr: "मोड आलेल्या मटकीची उसळ व भात" },
  "REC12": { nameEn: "Soyabean Pulao", nameMr: "सोयाबीन पुलाव" }
};

const ALL_INGREDIENTS = [
  "तांदूळ", "हिरवा वाटाणा", "मुगडाळ", "अख्खा मूग", "तुरडाळ", "मसूरडाळ",
  "चणा / हरभरा", "चवळी", "मटकी", "सोयाबीन वडी (सोया चंक्स)",
  "सोयाबीन खाद्यतेल", "मीठ (आयोडाईज्ड)", "हळद पावडर", "कांदा लसूण मसाला",
  "गरम मसाला", "जिरे", "मोहरी", "मिरची पावडर"
];

let currentLang = 'en';
const now = new Date();
let currentYear = now.getFullYear();
let currentMonth = now.getMonth();
let logsCache = {}; // dateKey -> 'OFF' | recipeKey
let userPin = sessionStorage.getItem('app_pin') || '';

/* ---------------- PIN gate ---------------- */
function pressPin(num){
  const input = document.getElementById('pin-input');
  if(input.value.length < 4) input.value += num;
}
function clearPin(){ document.getElementById('pin-input').value = ''; }

async function validatePin(){
  const entered = document.getElementById('pin-input').value;
  const errEl = document.getElementById('pin-error');
  errEl.style.display = 'none';
  try{
    const res = await window.PantryApi.verifyPin(entered);
    if(res && res.success){
      userPin = entered;
      sessionStorage.setItem('app_pin', entered);
      document.getElementById('pin-screen').style.display = 'none';
      afterUnlock();
    } else {
      errEl.style.display = 'block';
      clearPin();
    }
  }catch(e){
    errEl.innerText = 'Could not reach the server. Check your connection.';
    errEl.style.display = 'block';
  }
}

function afterUnlock(){
  renderCalendar();
  loadCalendarMonth();
  renderBulkStockForm();
  populateMonthDropdowns();
  populateRecipeDropdown();
  updateQueueStatus();
  window.PantryQueue.flushQueue(userPin, updateQueueStatus);
}

/* ---------------- Language ---------------- */
function setLanguage(lang){
  currentLang = lang;
  document.getElementById('btn-en').classList.toggle('active', lang === 'en');
  document.getElementById('btn-mr').classList.toggle('active', lang === 'mr');
  const dict = lang === 'mr' ? {
    title:"शाळा आहार दैनंदिनी", subtitle:"शाळा पोषण आहार व साठा नोंद",
    legRec:"नोंद केली", legOff:"सुट्टी दिवस", legNot:"नोंद नाही",
    navCal:"कॅलेंडर", navEntries:"दैनिक नोंदी", navStock:"साठा अहवाल", navSettings:"सेटिंग्ज",
    isOff:"शाळेला सुट्टी", recipe:"रेसिपी / मेनू", students:"विद्यार्थी संख्या", save:"जतन करा",
    selectMonth:"महिना निवडा:", addStockTitle:"नवीन प्राप्त साठा नोंदवा (सर्व साहित्य)",
    addStockBtn:"सर्व प्राप्त साठा जतन करा", stockTitle:"मासिक साठा अहवाल",
    connTitle:"जोडणी", connDesc:"हे अ‍ॅप थेट तुमच्या Google Sheet शी तुमच्या Apps Script च्या माध्यमातून बोलते. यात Claude किंवा इतर कोणतेही खाते सामील नाही.",
    syncNow:"आता सिंक करा"
  } : {
    title:"Pantry Diary", subtitle:"School meal & stock log",
    legRec:"Recipe recorded", legOff:"Off day", legNot:"Not recorded",
    navCal:"Calendar", navEntries:"Entries", navStock:"Stock", navSettings:"Settings",
    isOff:"School Off Day", recipe:"Recipe", students:"Students Count", save:"Save Entry",
    selectMonth:"Select Month:", addStockTitle:"Feed New Received Stock",
    addStockBtn:"Save All Received Stock", stockTitle:"Monthly Stock Summary",
    connTitle:"Connection", connDesc:"This app talks directly to your own Google Sheet through your Apps Script backend. There is no Claude or third-party account involved.",
    syncNow:"Sync Now"
  };
  document.getElementById('txt-title').innerText = dict.title;
  document.getElementById('txt-subtitle').innerText = dict.subtitle;
  document.getElementById('leg-rec').innerText = dict.legRec;
  document.getElementById('leg-off').innerText = dict.legOff;
  document.getElementById('leg-not').innerText = dict.legNot;
  document.getElementById('nav-cal-lbl').innerText = dict.navCal;
  document.getElementById('nav-entries-lbl').innerText = dict.navEntries;
  document.getElementById('nav-stock-lbl').innerText = dict.navStock;
  document.getElementById('nav-settings-lbl').innerText = dict.navSettings;
  document.getElementById('lbl-is-off').innerText = dict.isOff;
  document.getElementById('lbl-recipe').innerText = dict.recipe;
  document.getElementById('lbl-students').innerText = dict.students;
  document.getElementById('btn-save').innerText = dict.save;
  document.getElementById('lbl-select-month').innerText = dict.selectMonth;
  document.getElementById('lbl-entries-month').innerText = dict.selectMonth;
  document.getElementById('txt-add-stock-title').innerText = dict.addStockTitle;
  document.getElementById('btn-add-stock').innerText = dict.addStockBtn;
  document.getElementById('txt-stock-title').innerText = dict.stockTitle;
  document.getElementById('txt-conn-title').innerText = dict.connTitle;
  document.getElementById('txt-conn-desc').innerText = dict.connDesc;
  document.getElementById('btn-manual-sync').innerText = dict.syncNow;
  populateRecipeDropdown();
  renderCalendar();
}

function populateRecipeDropdown(){
  const sel = document.getElementById('select-recipe');
  sel.innerHTML = Object.entries(RECIPES).map(([key, r]) =>
    `<option value="${key}">${currentLang === 'mr' ? r.nameMr : r.nameEn}</option>`
  ).join('');
}

/* ---------------- Month helpers ---------------- */
function monthYearStr(y, mIdx){ return `${String(mIdx+1).padStart(2,'0')}-${y}`; }

function populateMonthDropdowns(){
  const pickers = [document.getElementById('stock-month-picker'), document.getElementById('entries-month-picker')];
  let fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
  const monthConfigs = [
    {month:"04",year:fyStartYear,name:"Apr"}, {month:"05",year:fyStartYear,name:"May"}, {month:"06",year:fyStartYear,name:"Jun"},
    {month:"07",year:fyStartYear,name:"Jul"}, {month:"08",year:fyStartYear,name:"Aug"}, {month:"09",year:fyStartYear,name:"Sep"},
    {month:"10",year:fyStartYear,name:"Oct"}, {month:"11",year:fyStartYear,name:"Nov"}, {month:"12",year:fyStartYear,name:"Dec"},
    {month:"01",year:fyStartYear+1,name:"Jan"}, {month:"02",year:fyStartYear+1,name:"Feb"}, {month:"03",year:fyStartYear+1,name:"Mar"}
  ];
  const currentFormatted = monthYearStr(currentYear, currentMonth);
  pickers.forEach(picker => {
    picker.innerHTML = '';
    monthConfigs.forEach(item => {
      const val = `${item.month}-${item.year}`;
      const opt = document.createElement('option');
      opt.value = val; opt.innerText = `${item.name} ${item.year}`;
      if(val === currentFormatted) opt.selected = true;
      picker.appendChild(opt);
    });
  });
}

function renderBulkStockForm(){
  const tbody = document.getElementById('bulk-stock-tbody');
  tbody.innerHTML = ALL_INGREDIENTS.map(item => `
    <tr><td style="font-weight:600; font-size:0.9rem;">${item}</td>
    <td style="text-align:right;"><input type="number" step="0.01" class="bulk-input" data-item="${item}" placeholder="0"></td></tr>
  `).join('');
}

/* ---------------- Calendar ---------------- */
async function loadCalendarMonth(){
  const my = monthYearStr(currentYear, currentMonth);
  try{
    const res = await window.PantryApi.getEntries(my, userPin);
    if(res && res.success){
      window.PantryQueue.cacheSet('entries_'+my, res.data);
      applyEntriesToLogsCache(res.data);
      renderCalendar();
    }
  }catch(e){
    const cached = window.PantryQueue.cacheGet('entries_'+my);
    if(cached){ applyEntriesToLogsCache(cached); renderCalendar(); }
  }
}
function applyEntriesToLogsCache(entries){
  entries.forEach(e => { logsCache[e.date] = e.isOffDay ? 'OFF' : 'RECORDED'; });
}

function renderCalendar(){
  const daysContainer = document.getElementById('calendar-days');
  daysContainer.innerHTML = '';
  const monthNamesEn = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const monthNamesMr = ["जानेवारी","फेब्रुवारी","मार्च","एप्रिल","मे","जून","जुलै","ऑगस्ट","सप्टेंबर","ऑक्टोबर","नोव्हेंबर","डिसेंबर"];
  document.getElementById('month-display').innerText = `${(currentLang==='mr'?monthNamesMr:monthNamesEn)[currentMonth]} ${currentYear}`;

  let firstDayIndex = new Date(currentYear, currentMonth, 1).getDay() - 1;
  if(firstDayIndex === -1) firstDayIndex = 6;
  const totalDays = new Date(currentYear, currentMonth+1, 0).getDate();

  for(let i=0;i<firstDayIndex;i++) daysContainer.appendChild(document.createElement('div'));

  for(let day=1; day<=totalDays; day++){
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    cell.innerText = day;
    const dayOfWeek = (firstDayIndex + day - 1) % 7;
    if(dayOfWeek === 6) cell.classList.add('weekend');

    const padDay = String(day).padStart(2,'0');
    const padMo = String(currentMonth+1).padStart(2,'0');
    const dateKey = `${currentYear}-${padMo}-${padDay}`;

    if(logsCache[dateKey]){
      const dot = document.createElement('span');
      dot.className = `status-dot ${logsCache[dateKey] === 'OFF' ? 'off' : 'recorded'}`;
      cell.appendChild(dot);
    }
    cell.onclick = () => openModal(dateKey);
    daysContainer.appendChild(cell);
  }
}

function changeMonth(dir){
  currentMonth += dir;
  if(currentMonth > 11){ currentMonth = 0; currentYear++; }
  if(currentMonth < 0){ currentMonth = 11; currentYear--; }
  logsCache = {};
  renderCalendar();
  populateMonthDropdowns();
  loadCalendarMonth();
}

/* ---------------- Entry modal ---------------- */
function openModal(dateStr){
  document.getElementById('selected-date').value = dateStr;
  document.getElementById('modal-date-title').innerText = `Entry for ${dateStr}`;
  document.getElementById('chk-off').checked = false;
  hideModalError();
  toggleOff(false);
  document.getElementById('entry-modal').classList.add('active');
}
function closeModal(){ document.getElementById('entry-modal').classList.remove('active'); hideModalError(); }
function showModalError(msg){ const el = document.getElementById('modal-error'); el.innerText = msg; el.classList.add('active'); }
function hideModalError(){ const el = document.getElementById('modal-error'); el.innerText=''; el.classList.remove('active'); }
function toggleOff(isOff){ document.getElementById('recipe-group').style.display = isOff ? 'none' : 'block'; }

async function submitDailyLog(e){
  e.preventDefault();
  hideModalError();
  const dateVal = document.getElementById('selected-date').value;
  const isOff = document.getElementById('chk-off').checked;
  const recipeKey = document.getElementById('select-recipe').value;
  const students = parseInt(document.getElementById('input-students').value) || 0;
  const saveBtn = document.getElementById('btn-save');
  const [yr, mo, ] = dateVal.split('-');
  const payload = { date: dateVal, monthYear: `${mo}-${yr}`, recipeKey, students, isOffDay: isOff };

  saveBtn.disabled = true;
  try{
    const result = await window.PantryApi.saveDailyEntry(payload, userPin);
    saveBtn.disabled = false;
    if(result && result.success === false){ showModalError(result.message || 'Could not save entry.'); return; }
    logsCache[dateVal] = isOff ? 'OFF' : recipeKey;
    closeModal(); renderCalendar();
  }catch(err){
    // offline or network failure — queue it, but still reflect it locally right away
    window.PantryQueue.queuePush({ kind:'entry', entry: payload });
    logsCache[dateVal] = isOff ? 'OFF' : recipeKey;
    saveBtn.disabled = false;
    closeModal(); renderCalendar(); updateQueueStatus();
  }
}

/* ---------------- Entries list view ---------------- */
async function loadDailyEntries(){
  const container = document.getElementById('entries-list-container');
  const errEl = document.getElementById('entries-error');
  errEl.classList.remove('active');
  container.innerHTML = 'Loading daily entries...';
  const my = document.getElementById('entries-month-picker').value;

  let data;
  try{
    const res = await window.PantryApi.getEntries(my, userPin);
    data = res.data;
    window.PantryQueue.cacheSet('entries_'+my, data);
  }catch(e){
    data = window.PantryQueue.cacheGet('entries_'+my);
    if(!data){ container.innerHTML=''; errEl.innerText = 'Offline, and no cached data for this month yet.'; errEl.classList.add('active'); return; }
  }

  if(!data || data.length === 0){
    container.innerHTML = "<div class='card' style='text-align:center;'>No entries found for this month.</div>";
    return;
  }

  container.innerHTML = data.map((ent, idx) => `
    <div class="entry-card">
      <div class="entry-header ${ent.isOffDay ? 'off' : ''}" onclick="toggleEntryDetails(${idx})">
        <div><div class="entry-date">${ent.date}</div><div class="entry-recipe">${ent.recipe}</div></div>
        <div style="display:flex; align-items:center;">
          ${!ent.isOffDay ? `<span class="entry-students">${ent.students} ${currentLang==='mr'?'विद्यार्थी':'Students'}</span>` : ''}
          <span class="entry-toggle-icon" id="icon-${idx}">▼</span>
        </div>
      </div>
      ${!ent.isOffDay && ent.ingredients.length > 0 ? `
        <div class="entry-details" id="details-${idx}">
          <table class="ing-table">
            <thead><tr><th>${currentLang==='mr'?'साहित्य':'Ingredient'}</th><th style="text-align:right;">${currentLang==='mr'?'वापरलेला साठा':'Quantity Used'}</th></tr></thead>
            <tbody>${ent.ingredients.map(ing=>`<tr><td style="font-weight:600;">${ing.name}</td><td style="text-align:right; font-weight:700; color:var(--primary-dark);">${ing.qty}</td></tr>`).join('')}</tbody>
          </table>
        </div>` : `
        <div class="entry-details" id="details-${idx}"><div style="font-size:0.85rem; color:var(--text-muted);">${currentLang==='mr'?'या दिवशी शाळेला सुट्टी होती.':'School was off on this date.'}</div></div>`}
    </div>
  `).join('');
}
function toggleEntryDetails(idx){
  const details = document.getElementById(`details-${idx}`);
  const icon = document.getElementById(`icon-${idx}`);
  const isOpen = details.classList.contains('open');
  details.classList.toggle('open', !isOpen);
  icon.innerText = isOpen ? '▼' : '▲';
}

/* ---------------- Stock view ---------------- */
async function loadStock(){
  const container = document.getElementById('stock-list');
  const stockErrorEl = document.getElementById('stock-error');
  stockErrorEl.classList.remove('active');
  container.innerHTML = 'Loading live stock data...';
  const my = document.getElementById('stock-month-picker').value;

  let data;
  try{
    const res = await window.PantryApi.getStock(my, userPin);
    data = res.data;
    window.PantryQueue.cacheSet('stock_'+my, data);
  }catch(e){
    data = window.PantryQueue.cacheGet('stock_'+my);
    if(!data){ container.innerHTML=''; stockErrorEl.innerText = 'Offline, and no cached stock data for this month yet.'; stockErrorEl.classList.add('active'); return; }
  }

  if(!data || data.length === 0){ container.innerHTML = 'No stock report found for this month.'; return; }
  container.innerHTML = data.map(d => `
    <div class="stock-row">
      <div><div class="stock-item-name">${d.item}</div><div class="stock-details">Opening: ${d.opening} kg | Recv: ${d.received} kg | Used: ${d.used} kg</div></div>
      <div class="stock-closing">${d.closing} kg</div>
    </div>
  `).join('');
}

async function submitBulkStock(e){
  e.preventDefault();
  const inputs = document.querySelectorAll('.bulk-input');
  const stockMap = {};
  inputs.forEach(input => { const item = input.getAttribute('data-item'); const qty = parseFloat(input.value)||0; if(qty>0) stockMap[item]=qty; });
  const my = document.getElementById('stock-month-picker').value;
  const stockErrorEl = document.getElementById('stock-error');
  stockErrorEl.classList.remove('active');

  try{
    await window.PantryApi.saveBulkStock(my, stockMap, userPin);
    inputs.forEach(i => i.value = '');
    loadStock();
  }catch(err){
    window.PantryQueue.queuePush({ kind:'bulkStock', monthYearStr: my, stockMap });
    inputs.forEach(i => i.value = '');
    updateQueueStatus();
    stockErrorEl.innerText = 'Offline — saved locally, will sync when back online.';
    stockErrorEl.classList.add('active');
  }
}

async function downloadExcel(){
  const my = document.getElementById('stock-month-picker').value;
  const exportBtn = document.getElementById('btn-export-excel');
  const originalText = exportBtn.innerHTML;
  exportBtn.disabled = true;
  exportBtn.innerText = currentLang==='mr' ? 'प्रक्रिया सुरू आहे...' : 'Exporting...';
  try{
    const res = await window.PantryApi.getExportUrl(my, userPin);
    exportBtn.disabled = false; exportBtn.innerHTML = originalText;
    if(res && res.success) window.open(res.url, '_blank');
    else alert(res.message || 'Export failed.');
  }catch(err){
    exportBtn.disabled = false; exportBtn.innerHTML = originalText;
    alert('Export requires an internet connection.');
  }
}

/* ---------------- Settings / sync ---------------- */
function updateQueueStatus(){
  const n = window.PantryQueue.queueCount();
  const el = document.getElementById('txt-queue-status');
  const banner = document.getElementById('sync-banner');
  if(el) el.innerText = n === 0 ? (currentLang==='mr' ? 'सर्व नोंदी सिंक झाल्या आहेत.' : 'Everything is synced.')
                                 : (currentLang==='mr' ? `${n} नोंदी सिंक होण्याच्या प्रतीक्षेत आहेत.` : `${n} item(s) waiting to sync.`);
  if(banner){
    if(n === 0){ banner.style.display = 'none'; }
    else { banner.style.display = 'flex'; banner.innerHTML = `<span>${n} ${currentLang==='mr'?'नोंदी सिंक होण्याच्या प्रतीक्षेत':'item(s) waiting to sync'}</span>`; }
  }
}
async function manualSync(){
  await window.PantryQueue.flushQueue(userPin, updateQueueStatus);
  updateQueueStatus();
}
document.addEventListener('pantry-sync-progress', updateQueueStatus);

/* ---------------- Navigation ---------------- */
function switchView(viewId, btn){
  document.querySelectorAll('.view-section').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(viewId).classList.add('active');
  btn.classList.add('active');
  if(viewId === 'view-stock') loadStock();
  if(viewId === 'view-entries') loadDailyEntries();
  if(viewId === 'view-settings') updateQueueStatus();
}

/* ---------------- Install prompt ---------------- */
let deferredInstallPrompt = null;
function setupInstallPrompt(){
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); deferredInstallPrompt = e; showInstallBanner('android'); });
  if(isIOS && !isStandalone) showInstallBanner('ios');
  window.addEventListener('appinstalled', ()=>{ document.getElementById('install-banner').style.display = 'none'; });
}
function showInstallBanner(kind){
  const banner = document.getElementById('install-banner');
  if(kind === 'android'){
    banner.innerHTML = `<div class="txt">Install this as an app on your phone.</div><button id="do-install">Install</button><button class="close-hint" id="hide-install">✕</button>`;
    document.getElementById('do-install').onclick = async ()=>{ if(!deferredInstallPrompt) return; deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt=null; banner.style.display='none'; };
  } else {
    banner.innerHTML = `<div class="txt">Add to Home Screen: tap Share, then "Add to Home Screen".</div><button class="close-hint" id="hide-install">✕</button>`;
  }
  banner.style.display = 'flex';
  document.getElementById('hide-install').onclick = ()=> banner.style.display = 'none';
}

/* ---------------- Boot ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  if(userPin) document.getElementById('pin-screen').style.display = 'none';
  populateRecipeDropdown();
  renderCalendar();
  renderBulkStockForm();
  populateMonthDropdowns();
  setupInstallPrompt();
  if(userPin) afterUnlock();

  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW registration failed', e));
  }
});

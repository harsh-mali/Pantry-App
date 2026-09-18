// ---------------------------------------------------------------
// Keeps the app usable when the connection drops:
// - QUEUE: writes (daily entries, bulk stock) that failed to reach
//   the server are stored here and retried automatically once
//   you're back online.
// - CACHE: the last successful read for each month is stored so the
//   calendar/entries/stock screens still show something useful
//   offline, clearly marked as "last synced" data.
// ---------------------------------------------------------------
const QUEUE_KEY = 'pantry_pending_ops';
const CACHE_PREFIX = 'pantry_cache_';

function queueGet(){
  try{ return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }catch(e){ return []; }
}
function queueSet(list){ localStorage.setItem(QUEUE_KEY, JSON.stringify(list)); }
function queuePush(op){
  const list = queueGet();
  list.push({ ...op, id: Date.now() + '-' + Math.random().toString(36).slice(2,7) });
  queueSet(list);
}
function queueRemove(id){ queueSet(queueGet().filter(o => o.id !== id)); }
function queueCount(){ return queueGet().length; }

function cacheGet(key){
  try{ const raw = localStorage.getItem(CACHE_PREFIX+key); return raw ? JSON.parse(raw) : null; }catch(e){ return null; }
}
function cacheSet(key, value){
  try{ localStorage.setItem(CACHE_PREFIX+key, JSON.stringify(value)); }catch(e){}
}

async function flushQueue(pin, onProgress){
  const list = queueGet();
  for(const op of list){
    try{
      if(op.kind === 'entry') await window.PantryApi.saveDailyEntry(op.entry, pin);
      else if(op.kind === 'bulkStock') await window.PantryApi.saveBulkStock(op.monthYearStr, op.stockMap, pin);
      queueRemove(op.id);
      if(onProgress) onProgress();
    }catch(e){
      break; // likely still offline — stop and retry the whole queue next time
    }
  }
}

window.PantryQueue = { queuePush, queueCount, queueGet, flushQueue, cacheGet, cacheSet };
window.addEventListener('online', () => {
  const pin = sessionStorage.getItem('app_pin');
  if(pin) window.PantryQueue.flushQueue(pin, () => document.dispatchEvent(new Event('pantry-sync-progress')));
});

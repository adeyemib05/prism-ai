/* Prism Watchlist */
var Watchlist = (function() {
  function _key() { return ((typeof Auth !== 'undefined' && Auth.isConnected()) ? Auth.getUserKey() : 'prism_guest') + '_watchlist'; }
  function getAll() { try { return JSON.parse(localStorage.getItem(_key()) || '[]'); } catch(e) { return []; } }
  function add(sym) {
    var all = getAll();
    if (all.indexOf(sym) >= 0 || all.length >= 20) return;
    all.push(sym);
    localStorage.setItem(_key(), JSON.stringify(all));
    updateBadge();
    _toast(sym + ' added to Watchlist');
  }
  function remove(sym) {
    localStorage.setItem(_key(), JSON.stringify(getAll().filter(function(s) { return s !== sym; })));
    updateBadge(); render();
  }
  function has(sym) { return getAll().indexOf(sym) >= 0; }
  function updateBadge() {
    var b = document.getElementById('watchlistBadge');
    if (b) b.textContent = getAll().length;
  }
  function render() {
    var grid = document.getElementById('watchlistGrid');
    if (!grid) return;
    var all = getAll();
    if (!all.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="es-icon"><i class="fas fa-star"></i></div><h3>Watchlist empty</h3><p>After analyzing a token, click \u2605 Add to Watchlist to pin it here.</p></div>';
      return;
    }
    grid.innerHTML = all.map(function(sym) {
      return '<div class="watchlist-card" data-sym="' + sym + '">'
        + '<div class="wc-top"><span class="wc-symbol">' + sym + '</span>'
        + '<button class="wc-remove" data-sym="' + sym + '"><i class="fas fa-times"></i></button></div>'
        + '<div class="wc-price" id="wc-price-' + sym + '">Loading...</div>'
        + '<div class="wc-change" id="wc-change-' + sym + '">\u2014</div>'
        + '</div>';
    }).join('');
    // Attach event listeners
    grid.querySelectorAll('.watchlist-card').forEach(function(card) {
      card.addEventListener('click', function(ev) {
        if (ev.target.closest('.wc-remove')) return;
        _goAnalyze(this.getAttribute('data-sym'));
      });
    });
    grid.querySelectorAll('.wc-remove').forEach(function(btn) {
      btn.addEventListener('click', function(ev) {
        ev.stopPropagation();
        Watchlist.remove(this.getAttribute('data-sym'));
      });
    });
    all.forEach(function(sym) { _fetchPrice(sym); });
  }
  function _fetchPrice(sym) {
    fetch('/tools/quick_check', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({symbol:sym}) })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.success) {
          var pe = document.getElementById('wc-price-' + sym);
          var ce = document.getElementById('wc-change-' + sym);
          var p = d.data.price;
          if (pe) pe.textContent = '$' + (p < 0.001 ? p.toFixed(6) : p < 1 ? p.toFixed(4) : p.toLocaleString());
          if (ce) { var c = d.data.change24h; ce.textContent = (c>=0?'+':'') + c.toFixed(2)+'%'; ce.className = 'wc-change ' + (c>=0?'up':'down'); }
        }
      })
      .catch(function() {});
  }
  function _toast(msg) {
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;background:var(--bg-elevated);border:1px solid var(--border-accent);border-radius:var(--radius-md);padding:0.65rem 1rem;font-size:0.82rem;color:var(--text-primary);z-index:999;animation:fadeIn 0.2s ease;pointer-events:none';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function() { t.remove(); }, 3000);
  }
  return { add: add, remove: remove, has: has, updateBadge: updateBadge, render: render };
})();

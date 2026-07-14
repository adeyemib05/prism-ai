/* Prism History */
var History = (function() {
  function _key() { return ((typeof Auth !== 'undefined' && Auth.isConnected()) ? Auth.getUserKey() : 'prism_guest') + '_history'; }
  function getAll() { try { return JSON.parse(localStorage.getItem(_key()) || '[]'); } catch(e) { return []; } }
  function save(entry) {
    var all = getAll();
    entry.id = Date.now();
    entry.time = new Date().toISOString();
    all.unshift(entry);
    if (all.length > 50) all.pop();
    localStorage.setItem(_key(), JSON.stringify(all));
    updateBadge();
  }
  function remove(id) {
    localStorage.setItem(_key(), JSON.stringify(getAll().filter(function(e) { return e.id !== id; })));
    updateBadge(); render();
  }
  function updateBadge() {
    var b = document.getElementById('historyBadge');
    if (b) b.textContent = getAll().length;
  }
  function addChat(id, msg) {
    var all = getAll();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) {
        all[i].chat = all[i].chat || [];
        all[i].chat.push(msg);
        break;
      }
    }
    localStorage.setItem(_key(), JSON.stringify(all));
  }
  var _filter = '';
  function filter(q) { _filter = q; render(); }
  function render() {
    var list = document.getElementById('historyList');
    if (!list) return;
    var all = getAll();
    if (_filter) all = all.filter(function(e) { return (e.symbol || '').toLowerCase().indexOf(_filter.toLowerCase()) >= 0; });
    if (!all.length) {
      list.innerHTML = '<div class="empty-state"><div class="es-icon"><i class="fas fa-clock-rotate-left"></i></div><h3>No history yet</h3><p>Run a paid analysis and it will appear here automatically.</p></div>';
      return;
    }
    list.innerHTML = all.map(function(e) {
      var d = new Date(e.time);
      var vClass = (e.verdict || 'watch').toLowerCase().replace(/ /g,'_');
      return '<div class="history-card" data-id="' + e.id + '">'
        + '<div class="hc-symbol">' + (e.symbol || '?') + '</div>'
        + '<div class="hc-meta"><div class="hc-name">' + (e.name || e.symbol || '') + '</div>'
        + '<div class="hc-time">' + d.toLocaleDateString() + ' ' + d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) + '</div></div>'
        + '<span class="verdict-badge ' + vClass + '">' + (e.verdict || 'WATCH') + '</span>'
        + '<button class="hc-delete" data-id="' + e.id + '"><i class="fas fa-trash"></i></button>'
        + '</div>';
    }).join('');
    // Attach event listeners using event delegation
    list.querySelectorAll('.history-card').forEach(function(card) {
      card.addEventListener('click', function(ev) {
        if (ev.target.closest('.hc-delete')) return;
        History.openDetail(Number(this.getAttribute('data-id')));
      });
    });
    list.querySelectorAll('.hc-delete').forEach(function(btn) {
      btn.addEventListener('click', function(ev) {
        ev.stopPropagation();
        History.remove(Number(this.getAttribute('data-id')));
      });
    });
  }
  function openDetail(id) {
    var entry = null;
    var all = getAll();
    for (var i = 0; i < all.length; i++) { if (all[i].id === id) { entry = all[i]; break; } }
    if (!entry) return;
    var container = document.getElementById('histDetailContent');
    container.innerHTML =
      '<h3 style="margin-bottom:1rem;font-size:1rem">' + (entry.symbol || '') + ' \u2014 Analysis Report</h3>'
      + '<div class="markdown-body">' + (typeof marked !== 'undefined' ? marked.parse(entry.markdown || '') : (entry.markdown || '')) + '</div>'
      + '<div class="followup-section">'
      + '<div class="followup-header"><i class="fas fa-comment-dots"></i> Ask a follow-up question'
      + '<span style="margin-left:auto;font-size:0.7rem;color:var(--text-muted)">1st free &middot; additional $0.10</span></div>'
      + '<div class="chat-messages" id="hChat-' + id + '"></div>'
      + '<div class="followup-input-row">'
      + '<input class="followup-input" id="hFuInput-' + id + '" placeholder="e.g. What are the biggest risks?">'
      + '<button class="btn btn-purple btn-sm" id="hFuSend-' + id + '"><i class="fas fa-paper-plane"></i></button>'
      + '</div>'
      + '<div class="followup-note">Contextual AI answers based on this analysis</div></div>';
    
    // Render existing chat history if any
    var chatContainer = container.querySelector('#hChat-' + id);
    if (chatContainer && entry.chat && entry.chat.length > 0) {
      entry.chat.forEach(function(msg) {
        var m = document.createElement('div');
        m.className = 'chat-msg ' + msg.role;
        if (msg.role === 'ai' && typeof marked !== 'undefined') { m.innerHTML = marked.parse(msg.text); }
        else { m.textContent = msg.text; }
        chatContainer.appendChild(m);
      });
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Attach event listeners
    var inp = document.getElementById('hFuInput-' + id);
    var btn = document.getElementById('hFuSend-' + id);
    if (inp) inp.addEventListener('keypress', function(e) { if (e.key === 'Enter') FollowUp.askHistory(id); });
    if (btn) btn.addEventListener('click', function() { FollowUp.askHistory(id); });
    document.getElementById('histDetailModal').classList.add('active');
  }
  function closeDetail() { document.getElementById('histDetailModal').classList.remove('active'); }
  return { save: save, remove: remove, getAll: getAll, updateBadge: updateBadge, filter: filter, render: render, openDetail: openDetail, closeDetail: closeDetail, addChat: addChat };
})();

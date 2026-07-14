/* Prism Analyze + Payment + FollowUp */
function _fmtN(n) {
  if (n===null||n===undefined) return 'Unknown';
  if (n>=1e9) return (n/1e9).toFixed(2)+'B';
  if (n>=1e6) return (n/1e6).toFixed(2)+'M';
  if (n>=1e3) return (n/1e3).toFixed(2)+'K';
  if (n<0.001) return n.toFixed(6);
  if (n<1) return n.toFixed(4);
  return n.toLocaleString();
}
function _riskCls(level) {
  if (!level) return 'medium';
  var l = level.toLowerCase();
  if (l.startsWith('low')) return 'low';
  if (l.startsWith('extreme')) return 'extreme';
  if (l.startsWith('high')) return 'high';
  return 'medium';
}

/* Helper: navigate to analyze tab and run a symbol */
function _goAnalyze(sym) {
  navigate('analyze');
  var inp = document.getElementById('analyzeInput');
  if (inp) inp.value = sym;
  Analyze.run();
}

var Analyze = (function() {
  var _sym = '', _report = null, _fuCount = 0;

  function run() {
    var q = (document.getElementById('analyzeInput') || {}).value || '';
    var query = q.trim();
    if (!query) return;
    _sym = query; _fuCount = 0; _report = null;
    var qcEl = document.getElementById('qcResult');
    var rpEl = document.getElementById('reportResult');
    var ub = document.getElementById('unlockBanner');
    if (qcEl) qcEl.innerHTML = '<div class="loading-state"><span class="loader"></span>&nbsp;Fetching market data...</div>';
    if (rpEl) rpEl.innerHTML = '<div class="empty-state"><div class="es-icon"><i class="fas fa-lock"></i></div><h3>Full analysis locked</h3><p>Run Quick Check first, then unlock.</p></div>';
    if (ub) ub.classList.add('hidden');
    fetch('/tools/quick_check', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({symbol:query}) })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (!data.success) throw new Error(data.error || 'Unknown error');
        _renderQC(data.data);
        if (ub) ub.classList.remove('hidden');
      })
      .catch(function(e) {
        if (qcEl) qcEl.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-circle"></i>&nbsp;' + e.message + '</div>';
      });
  }

  function _renderQC(d) {
    var rc = _riskCls(d.riskLevel);
    var up = d.change24h >= 0;
    var qcEl = document.getElementById('qcResult');
    if (!qcEl) return;
    var watching = (typeof Watchlist !== 'undefined') && Watchlist.has(d.symbol);
    qcEl.innerHTML =
      '<div class="qc-token-header">'
      + '<div class="qc-left"><div class="qc-symbol">' + d.symbol + '</div></div>'
      + '<div class="qc-right"><div class="qc-price">$' + _fmtN(d.price) + '</div>'
      + '<div class="qc-change ' + (up?'up':'down') + '">' + (up?'+':'') + d.change24h.toFixed(2) + '%</div></div>'
      + '</div>'
      + '<div class="stats-row">'
      + '<div class="stat-pill"><span class="sp-label">24h Volume</span><span class="sp-value">$' + _fmtN(d.volume24h) + '</span></div>'
      + '<div class="stat-pill"><span class="sp-label">Risk</span><span class="sp-value"><span class="risk-badge ' + rc + '">' + d.riskLevel + '</span></span></div>'
      + '</div>'
      + '<div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.4rem;font-style:italic">' + d.note + '</div>'
      + '<div style="margin-top:0.9rem;display:flex;gap:0.5rem;flex-wrap:wrap">'
      + '<button class="btn btn-ghost btn-sm" id="watchBtn" data-sym="' + d.symbol + '">'
      + '<i class="fas fa-star"></i> ' + (watching ? 'Unwatch' : '+ Watchlist') + '</button>'
      + '<button class="btn btn-ghost btn-sm" id="compareFromQC" data-sym="' + d.symbol + '">'
      + '<i class="fas fa-code-compare"></i> Compare</button>'
      + '</div>';
    // Attach event listeners
    var watchBtn = document.getElementById('watchBtn');
    if (watchBtn) {
      watchBtn.addEventListener('click', function() {
        var s = this.getAttribute('data-sym');
        if (Watchlist.has(s)) { Watchlist.remove(s); } else { Watchlist.add(s); }
        this.innerHTML = '<i class="fas fa-star"></i> ' + (Watchlist.has(s) ? 'Unwatch' : '+ Watchlist');
      });
    }
    var cmpBtn = document.getElementById('compareFromQC');
    if (cmpBtn) {
      cmpBtn.addEventListener('click', function() {
        navigate('compare');
        var inp = document.getElementById('compareInputA');
        if (inp) inp.value = this.getAttribute('data-sym');
      });
    }
  }

  function unlock() {
    if (!Auth.isConnected()) { Auth.openModal(); return; }
    Payment.request(0.50, 'Full Analysis \u2014 ' + _sym, _fetchFullReport);
  }

  function _fetchFullReport() {
    var ub = document.getElementById('unlockBanner');
    var rpEl = document.getElementById('reportResult');
    if (ub) ub.classList.add('hidden');
    if (rpEl) rpEl.innerHTML = '<div class="loading-state"><span class="loader"></span>&nbsp;AI Engine generating strategy \u2014 takes ~5 seconds...</div>';
    fetch('/tools/analyze_token', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'L402 mock-macaroon'},
      body:JSON.stringify({symbol:_sym})
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (!data.success) throw new Error(data.error || 'Unknown error');
      _report = data.data;
      _renderReport(data.data);
      if (typeof History !== 'undefined') {
        History.save({
          symbol: (data.data.token||{}).symbol || _sym,
          name: (data.data.token||{}).name || _sym,
          verdict: (data.data.trade||{}).verdict || 'WATCH',
          riskLevel: (data.data.risk||{}).level || 'MEDIUM',
          markdown: data.data.markdown || ''
        });
      }
      if (typeof Watchlist !== 'undefined') Watchlist.updateBadge();
    })
    .catch(function(e) {
      if (rpEl) rpEl.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-circle"></i>&nbsp;' + e.message + '</div>';
      if (ub) ub.classList.remove('hidden');
    });
  }

  function _renderReport(data) {
    var rpEl = document.getElementById('reportResult');
    if (!rpEl) return;
    rpEl.innerHTML =
      '<div class="markdown-body">' + (typeof marked !== 'undefined' ? marked.parse(data.markdown || '') : (data.markdown || '')) + '</div>'
      + '<div class="followup-section">'
      + '<div class="followup-header"><i class="fas fa-comment-dots"></i> Ask a follow-up question'
      + '<span style="margin-left:auto;font-size:0.7rem;color:var(--text-muted)">1st free &middot; additional $0.10</span></div>'
      + '<div class="chat-messages" id="aChat"></div>'
      + '<div class="followup-input-row">'
      + '<input class="followup-input" id="aFuInput" placeholder="e.g. What happens if volume doubles?">'
      + '<button class="btn btn-purple btn-sm" id="aFuSend"><i class="fas fa-paper-plane"></i></button>'
      + '</div></div>';
    // Attach event listeners
    var inp = document.getElementById('aFuInput');
    var btn = document.getElementById('aFuSend');
    if (inp) inp.addEventListener('keypress', function(e) { if (e.key === 'Enter') FollowUp.askAnalyze(); });
    if (btn) btn.addEventListener('click', function() { FollowUp.askAnalyze(); });
  }

  function getReport() { return _report; }
  function getSymbol() { return _sym; }
  function getFuCount() { return _fuCount; }
  function incFu() { _fuCount++; }
  return { run: run, unlock: unlock, getReport: getReport, getSymbol: getSymbol, getFuCount: getFuCount, incFu: incFu };
})();

var Payment = (function() {
  var _cb = null;
  function request(amount, detail, cb) {
    _cb = cb;
    var amtEl = document.getElementById('paymentAmount');
    var detEl = document.getElementById('paymentDetail');
    if (amtEl) amtEl.textContent = '$' + Number(amount).toFixed(2);
    if (detEl) detEl.textContent = 'Authorise payment of $' + Number(amount).toFixed(2) + ' USDT for ' + detail + '.';
    document.getElementById('paymentModal').classList.add('active');
  }
  function confirm() {
    document.getElementById('paymentModal').classList.remove('active');
    if (_cb) { var c = _cb; _cb = null; c(); }
  }
  function cancel() { document.getElementById('paymentModal').classList.remove('active'); _cb = null; }
  return { request: request, confirm: confirm, cancel: cancel };
})();

var FollowUp = (function() {
  function _addMsg(chatId, text, role) {
    var el = document.getElementById(chatId);
    if (!el) return null;
    var m = document.createElement('div');
    m.className = 'chat-msg ' + role;
    if (role === 'ai' && typeof marked !== 'undefined') {
      m.innerHTML = marked.parse(text);
    } else {
      m.textContent = text;
    }
    el.appendChild(m);
    el.scrollTop = el.scrollHeight;
    return m;
  }
  function _send(q, chatId, inputId, context, histId) {
    var input = document.getElementById(inputId);
    if (!input || !q) return;
    input.value = '';
    _addMsg(chatId, q, 'user');
    if (histId && typeof History !== 'undefined') History.addChat(histId, {role: 'user', text: q});
    var typing = _addMsg(chatId, 'Thinking...', 'ai');
    fetch('/tools/follow_up', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'L402 mock-macaroon'},
      body:JSON.stringify({question:q, context:context})
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (typing) {
        if (data.success) {
          if (typeof marked !== 'undefined') { typing.innerHTML = marked.parse(data.data.answer); }
          else { typing.textContent = data.data.answer; }
          if (histId && typeof History !== 'undefined') History.addChat(histId, {role: 'ai', text: data.data.answer});
        } else {
          typing.textContent = 'Could not get a response.';
        }
      }
    })
    .catch(function() {
      if (typing) typing.textContent = 'Connection failed. Please try again.';
    });
  }
  function askAnalyze() {
    var input = document.getElementById('aFuInput');
    var q = input ? input.value.trim() : '';
    if (!q) return;
    var count = Analyze.getFuCount();
    if (count > 0 && !Auth.canPay()) { Auth.openModal(); return; }
    if (count > 0) { Payment.request(0.10, 'Follow-up Question', function() { _send(q, 'aChat', 'aFuInput', Analyze.getReport()); }); return; }
    _send(q, 'aChat', 'aFuInput', Analyze.getReport());
    Analyze.incFu();
  }
  function askHistory(histId) {
    var input = document.getElementById('hFuInput-' + histId);
    var q = input ? input.value.trim() : '';
    if (!q) return;
    var entries = typeof History !== 'undefined' ? History.getAll() : [];
    var entry = null;
    for (var i = 0; i < entries.length; i++) { if (entries[i].id == histId) { entry = entries[i]; break; } }
    var ctx = entry ? { token: { symbol: entry.symbol }, markdown: entry.markdown } : {};
    _send(q, 'hChat-' + histId, 'hFuInput-' + histId, ctx, histId);
  }
  return { askAnalyze: askAnalyze, askHistory: askHistory };
})();

/* Prism Token Compare */
var Compare = (function() {
  function run() {
    var a = (document.getElementById('compareInputA') || {}).value || '';
    var b = (document.getElementById('compareInputB') || {}).value || '';
    if (!a.trim() || !b.trim()) return;
    var el = document.getElementById('compareResult');
    el.innerHTML = '<div class="loading-state"><span class="loader"></span>&nbsp;Fetching both tokens...</div>';
    Promise.all([
      fetch('/tools/quick_check', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbol:a.trim()})}).then(function(r){return r.json();}),
      fetch('/tools/quick_check', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbol:b.trim()})}).then(function(r){return r.json();})
    ])
    .then(function(results) {
      var rA = results[0], rB = results[1];
      if (!rA.success || !rB.success) throw new Error('Could not fetch one or both tokens.');
      _render(rA.data, rB.data);
    })
    .catch(function(e) {
      el.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-circle"></i>&nbsp;' + e.message + '</div>';
    });
  }
  function _fmtP(n) { if(!n) return '\u2014'; return '$' + (n<0.001?n.toFixed(6):n<1?n.toFixed(4):n.toLocaleString()); }
  function _fmtC(n) { return (n>=0?'+':'') + (n||0).toFixed(2) + '%'; }
  function _fmtV(n) { if(!n) return '\u2014'; if(n>=1e9) return '$'+(n/1e9).toFixed(2)+'B'; if(n>=1e6) return '$'+(n/1e6).toFixed(2)+'M'; return '$'+(n/1e3).toFixed(0)+'K'; }
  function _render(a, b) {
    var rows = [
      {label:'Symbol', va:a.symbol, vb:b.symbol, w:null},
      {label:'Price', va:_fmtP(a.price), vb:_fmtP(b.price), w:null},
      {label:'24h Change', va:_fmtC(a.change24h), vb:_fmtC(b.change24h), w:a.change24h>b.change24h?'A':b.change24h>a.change24h?'B':null},
      {label:'24h Volume', va:_fmtV(a.volume24h), vb:_fmtV(b.volume24h), w:a.volume24h>b.volume24h?'A':b.volume24h>a.volume24h?'B':null},
      {label:'Risk Level', va:a.riskLevel, vb:b.riskLevel, w:null},
    ];
    var el = document.getElementById('compareResult');
    el.innerHTML = '<div class="panel" style="overflow:hidden;margin-bottom:0.75rem"><table class="compare-table"><thead><tr>'
      + '<th class="td-label">Metric</th><th>' + a.symbol + '</th><th>' + b.symbol + '</th>'
      + '</tr></thead><tbody>'
      + rows.map(function(r) { return '<tr><td class="td-label">' + r.label + '</td>'
        + '<td ' + (r.w==='A'?'class="td-winner"':'') + '>' + r.va + '</td>'
        + '<td ' + (r.w==='B'?'class="td-winner"':'') + '>' + r.vb + '</td>'
        + '</tr>'; }).join('')
      + '</tbody></table></div>'
      + '<div style="display:flex;gap:0.5rem;flex-wrap:wrap">'
      + '<button class="btn btn-secondary btn-sm compare-analyze-btn" data-sym="' + a.symbol + '">Full Analysis: ' + a.symbol + '</button>'
      + '<button class="btn btn-secondary btn-sm compare-analyze-btn" data-sym="' + b.symbol + '">Full Analysis: ' + b.symbol + '</button>'
      + '</div>';
    // Attach event listeners
    el.querySelectorAll('.compare-analyze-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        _goAnalyze(this.getAttribute('data-sym'));
      });
    });
  }
  return { run: run };
})();

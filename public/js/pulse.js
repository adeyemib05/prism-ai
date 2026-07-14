/* Prism Market Pulse */
var Pulse = (function() {
  var _timer = null, _loaded = false;
  function init() {
    if (_timer) clearInterval(_timer);
    _load();
    _timer = setInterval(_load, 60000);
  }
  function _load() {
    fetch('/tools/pulse')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (!data.success) throw new Error(data.error || 'Failed');
        _render(data.data);
        _loaded = true;
      })
      .catch(function() {
        var grid = document.getElementById('pulseGrid');
        if (grid) grid.innerHTML = '<div class="error-state" style="grid-column:1/-1"><i class="fas fa-exclamation-circle"></i>&nbsp;Failed to load market data. Check server logs.</div>';
      });
  }
  function _fmtP(n) { if(!n) return '\u2014'; return '$'+(n<0.001?n.toFixed(6):n<1?n.toFixed(4):n>=1000?n.toLocaleString():n.toFixed(2)); }
  function _render(d) {
    function list(items, title, icon) {
      return '<div><div class="pulse-section-title"><i class="fas ' + icon + '"></i>&nbsp;' + title + '</div><div class="pulse-list">'
        + items.map(function(item, i) {
          return '<div class="pulse-item" data-sym="' + item.symbol + '">'
            + '<span class="pulse-rank">' + (i+1) + '</span>'
            + '<span class="pulse-symbol">' + item.symbol + '</span>'
            + '<span class="pulse-price">' + _fmtP(item.price) + '</span>'
            + '<span class="pulse-change ' + (item.change>=0?'up':'down') + '">' + (item.change>=0?'+':'') + (item.change||0).toFixed(2) + '%</span>'
            + '</div>';
        }).join('')
        + '</div></div>';
    }
    var grid = document.getElementById('pulseGrid');
    if (!grid) return;
    grid.innerHTML =
      list(d.gainers || [], 'Top Gainers', 'fa-arrow-trend-up') +
      list(d.losers || [], 'Top Losers', 'fa-arrow-trend-down');
    // Attach event listeners
    grid.querySelectorAll('.pulse-item').forEach(function(item) {
      item.addEventListener('click', function() {
        _goAnalyze(this.getAttribute('data-sym'));
      });
    });
  }
  return { init: init };
})();

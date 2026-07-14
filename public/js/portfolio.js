/* Prism Portfolio Scanner */
const Portfolio = (() => {
  async function scan() {
    if (typeof Auth !== 'undefined' && !Auth.isConnected()) { Auth.openModal(); return; }
    const raw = (document.getElementById('portfolioInput') || {}).value || '';
    const syms = raw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).slice(0, 5);
    if (!syms.length) return;
    Payment.request(1.50, 'Portfolio Scan (' + syms.join(', ') + ')', async () => {
      const el = document.getElementById('portfolioResults');
      el.classList.remove('hidden');
      el.innerHTML = '<div class="loading-state"><span class="loader"></span>&nbsp;Scanning ' + syms.length + ' tokens...</div>';
      try {
        const res = await fetch('/tools/portfolio_scan', {
          method:'POST',
          headers:{'Content-Type':'application/json','Authorization':'L402 mock-macaroon'},
          body:JSON.stringify({symbols:syms})
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        const reports = data.data.reports;
        if (!reports || !reports.length) { el.innerHTML = '<div class="empty-state"><h3>No results returned</h3></div>'; return; }
        el.innerHTML = reports.map(r => {
          const vCls = ((r.trade||{}).verdict||'watch').toLowerCase().replace(/ /g,'_');
          const rCls = ((r.risk||{}).level||'medium').toLowerCase();
          const price = (r.token||{}).price;
          return '<div class="portfolio-card">'
            + '<div class="pc-symbol">' + ((r.token||{}).symbol||'—') + '</div>'
            + '<div class="pc-verdict"><span class="verdict-badge ' + vCls + '">' + ((r.trade||{}).verdict||'—') + '</span>'
            + '&nbsp;<span class="risk-badge ' + rCls + '">' + ((r.risk||{}).level||'—') + '</span></div>'
            + '<div class="pc-price">' + (price ? ('$' + (price < 1 ? price.toFixed(4) : price.toLocaleString())) : '—') + '</div>'
            + '</div>';
        }).join('');
      } catch(e) {
        el.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-circle"></i>&nbsp;' + e.message + '</div>';
      }
    });
  }
  return { scan };
})();

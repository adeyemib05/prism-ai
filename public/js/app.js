document.addEventListener('DOMContentLoaded', () => {
    const tokenInput = document.getElementById('tokenInput');
    const searchBtn = document.getElementById('searchBtn');
    const quickCheckResult = document.getElementById('quickCheckResult');
    const fullReportResult = document.getElementById('fullReportResult');
    const unlockBtn = document.getElementById('unlockBtn');
    const paymentModal = document.getElementById('paymentModal');
    const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
    const cancelPaymentBtn = document.getElementById('cancelPaymentBtn');

    let currentTarget = '';

    searchBtn.addEventListener('click', handleSearch);
    tokenInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    unlockBtn.addEventListener('click', () => {
        paymentModal.classList.add('active');
    });

    cancelPaymentBtn.addEventListener('click', () => {
        paymentModal.classList.remove('active');
    });

    confirmPaymentBtn.addEventListener('click', async () => {
        paymentModal.classList.remove('active');
        await fetchFullReport(currentTarget);
    });

    async function handleSearch() {
        const query = tokenInput.value.trim();
        if (!query) return;

        currentTarget = query;
        
        // Reset UI
        quickCheckResult.innerHTML = '<div class="loader"></div><p style="text-align:center; margin-top:1rem; color:#888;">Fetching free snapshot...</p>';
        fullReportResult.innerHTML = '<div class="placeholder-text">Unlock deep market analysis, risk evaluation, and an AI-driven trade plan.</div>';
        unlockBtn.classList.add('hidden');

        try {
            const res = await fetch('/tools/quick_check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol: query })
            });
            const data = await res.json();
            
            if (!data.success) throw new Error(data.error);
            
            renderQuickCheck(data.data);
            
            // Show the unlock button for the full report
            unlockBtn.classList.remove('hidden');
            fullReportResult.appendChild(unlockBtn); // move it to the bottom
            
        } catch (error) {
            quickCheckResult.innerHTML = `<div class="text-danger"><i class="fas fa-exclamation-circle"></i> Error: ${error.message}</div>`;
        }
    }

    function renderQuickCheck(data) {
        let riskColor = 'var(--text-main)';
        if (data.riskLevel.includes('LOW')) riskColor = '#00ff88';
        if (data.riskLevel.includes('MEDIUM')) riskColor = '#ffb84d';
        if (data.riskLevel.includes('HIGH') || data.riskLevel.includes('EXTREME')) riskColor = '#ff4d4d';

        const changeClass = data.change24h >= 0 ? 'text-success' : 'text-danger';
        const changeSign = data.change24h >= 0 ? '+' : '';

        quickCheckResult.innerHTML = `
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <h3 style="font-size: 2rem;">${data.symbol}</h3>
                <div style="font-size: 1.5rem; font-weight: bold;">$${data.price < 0.01 ? data.price.toFixed(6) : data.price.toFixed(2)}</div>
                <div style="color: ${data.change24h >= 0 ? '#00ff88' : '#ff4d4d'}">${changeSign}${data.change24h.toFixed(2)}%</div>
            </div>
            
            <div class="stat-row">
                <span class="stat-label">24h Volume</span>
                <span class="stat-val">$${formatNumber(data.volume24h)}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Initial Risk</span>
                <span class="stat-val" style="color: ${riskColor}">${data.riskLevel}</span>
            </div>
            
            <div style="margin-top: 1.5rem; font-style: italic; color: var(--text-muted); font-size: 0.9rem; text-align: center;">
                ${data.note}
            </div>
        `;
    }

    async function fetchFullReport(symbol) {
        unlockBtn.classList.add('hidden');
        fullReportResult.innerHTML = '<div class="loader"></div><p style="text-align:center; margin-top:1rem; color:var(--accent-secondary);">AI Engine is generating trade plan...</p>';

        try {
            // Include our mock payment header
            const res = await fetch('/tools/analyze_token', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'L402 mock-macaroon'
                },
                body: JSON.stringify({ symbol })
            });
            const data = await res.json();
            
            if (!data.success) throw new Error(data.error);
            
            // Render Markdown
            fullReportResult.innerHTML = `<div class="markdown-body">${marked.parse(data.data.markdown)}</div>`;
            
        } catch (error) {
            fullReportResult.innerHTML = `<div class="text-danger"><i class="fas fa-exclamation-circle"></i> Error: ${error.message}</div>`;
            fullReportResult.appendChild(unlockBtn); // let them try again
            unlockBtn.classList.remove('hidden');
        }
    }

    function formatNumber(n) {
        if (n === null || n === undefined) return 'Unknown';
        if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
        if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
        if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
        return n.toFixed(2);
    }
});

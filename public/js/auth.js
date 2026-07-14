/* Prism Auth */
const Auth = (() => {
  let _user = null;
  function init() {
    const saved = localStorage.getItem('prism_user');
    if (saved) try { _user = JSON.parse(saved); _updateUI(); } catch(e) {}
  }
  function openModal() {
    if (_user) { if (confirm('Disconnect from Prism?')) logout(); return; }
    document.getElementById('authModal').classList.add('active');
  }
  function closeModal() { document.getElementById('authModal').classList.remove('active'); }
  async function connectOKX() {
    closeModal();
    try {
      const provider = window.okxwallet || window.ethereum;
      if (provider) {
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        _setWalletUser(accounts[0], 'OKX');
      } else { _setDemoWallet(); }
    } catch(e) { _setDemoWallet(); }
  }
  async function connectMetaMask() {
    closeModal();
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        _setWalletUser(accounts[0], 'MetaMask');
      } else { _setDemoWallet(); }
    } catch(e) { _setDemoWallet(); }
  }
  function loginEmail() {
    const email = (document.getElementById('authEmail') || {}).value || '';
    if (!email.includes('@')) { alert('Please enter a valid email address.'); return; }
    closeModal();
    _setEmailUser(email.split('@')[0], email);
  }
  function _setWalletUser(address, label) {
    const short = address.slice(0,6) + '...' + address.slice(-4);
    _user = { type:'wallet', address, display: short, canPay: true, label };
    localStorage.setItem('prism_user', JSON.stringify(_user));
    _updateUI();
  }
  function _setEmailUser(name, email) {
    _user = { type:'email', address: email, display: name, canPay: false };
    localStorage.setItem('prism_user', JSON.stringify(_user));
    _updateUI();
  }
  function _setDemoWallet() {
    _setWalletUser('0xDEMO000000000000000000000000000000000000', 'Demo');
  }
  function logout() {
    _user = null;
    localStorage.removeItem('prism_user');
    _updateUI();
  }
  function _updateUI() {
    const btn = document.getElementById('connectBtn');
    const label = document.getElementById('connectLabel');
    const sideUser = document.getElementById('sidebarUser');
    const sideAvatar = document.getElementById('sidebarAvatar');
    const sideName = document.getElementById('sidebarName');
    const sideRole = document.getElementById('sidebarRole');
    if (_user) {
      btn && btn.classList.add('connected');
      if (label) label.textContent = _user.display;
      sideUser && sideUser.classList.remove('hidden');
      if (sideAvatar) sideAvatar.textContent = _user.display.charAt(0).toUpperCase();
      if (sideName) sideName.textContent = _user.display;
      if (sideRole) sideRole.textContent = _user.canPay ? 'Full Access' : 'View Only';
    } else {
      btn && btn.classList.remove('connected');
      if (label) label.textContent = 'Connect Wallet';
      sideUser && sideUser.classList.add('hidden');
    }
  }
  function getUser() { return _user; }
  function isConnected() { return !!_user; }
  function canPay() { return !!(_user && _user.canPay); }
  function getUserKey() { return _user ? 'prism_' + btoa(_user.address).replace(/=/g,'').slice(0,12) : 'prism_guest'; }
  return { init, openModal, closeModal, connectOKX, connectMetaMask, loginEmail, logout, getUser, isConnected, canPay, getUserKey };
})();

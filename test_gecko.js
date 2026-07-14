const https = require('https');
https.get('https://api.geckoterminal.com/api/v2/search?query=BTC', res => {
  let data = '';
  res.on('data', d => data+=d);
  res.on('end', () => console.log('Gecko:', data.substring(0, 200)));
});

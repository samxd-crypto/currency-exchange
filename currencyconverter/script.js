const API_BASE = 'https://open.er-api.com/v6/latest';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'MXN', name: 'Mexican Peso', flag: '🇲🇽' },
  { code: 'BRL', name: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'RUB', name: 'Russian Ruble', flag: '🇷🇺' },
  { code: 'KRW', name: 'South Korean Won', flag: '🇰🇷' },
  { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'HKD', name: 'Hong Kong Dollar', flag: '🇭🇰' },
  { code: 'SEK', name: 'Swedish Krona', flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', flag: '🇩🇰' },
  { code: 'NZD', name: 'New Zealand Dollar', flag: '🇳🇿' },
  { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦' },
  { code: 'THB', name: 'Thai Baht', flag: '🇹🇭' },
  { code: 'IDR', name: 'Indonesian Rupiah', flag: '🇮🇩' },
  { code: 'MYR', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  { code: 'PHP', name: 'Philippine Peso', flag: '🇵🇭' },
  { code: 'PKR', name: 'Pakistani Rupee', flag: '🇵🇰' },
  { code: 'BDT', name: 'Bangladeshi Taka', flag: '🇧🇩' },
  { code: 'EGP', name: 'Egyptian Pound', flag: '🇪🇬' },
  { code: 'TRY', name: 'Turkish Lira', flag: '🇹🇷' },
  { code: 'PLN', name: 'Polish Zloty', flag: '🇵🇱' },
  { code: 'CZK', name: 'Czech Koruna', flag: '🇨🇿' },
  { code: 'HUF', name: 'Hungarian Forint', flag: '🇭🇺' },
  { code: 'ILS', name: 'Israeli Shekel', flag: '🇮🇱' },
  { code: 'CLP', name: 'Chilean Peso', flag: '🇨🇱' },
  { code: 'COP', name: 'Colombian Peso', flag: '🇨🇴' },
  { code: 'ARS', name: 'Argentine Peso', flag: '🇦🇷' },
  { code: 'NGN', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'KES', name: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'MAD', name: 'Moroccan Dirham', flag: '🇲🇦' },
];

const amountInput = document.getElementById('amount');
const fromSelect = document.getElementById('from-currency');
const toSelect = document.getElementById('to-currency');
const convertBtn = document.getElementById('convert-btn');
const swapBtn = document.getElementById('swap-btn');
const resultPanel = document.getElementById('result-panel');
const resultInner = document.getElementById('result-inner');
const rateStrip = document.getElementById('rate-strip');
const rateDisplay = document.getElementById('rate-display');
const rateTimestamp = document.getElementById('rate-timestamp');
const rateInverse = document.getElementById('rate-inverse');
const quickPairsEl = document.getElementById('quick-pairs');

let lastRates = null;
let lastBase = null;
let activePair = null;

populateSelects();
setDefaults();
bindEvents();

function populateSelects() {
  CURRENCIES.forEach(({ code, name, flag }) => {
    const label = `${flag} ${code} — ${name}`;
    [fromSelect, toSelect].forEach(sel => {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = label;
      sel.appendChild(opt);
    });
  });
}

function setDefaults() {
  fromSelect.value = 'USD';
  toSelect.value = 'EUR';
}

function bindEvents() {
  convertBtn.addEventListener('click', handleConvert);
  swapBtn.addEventListener('click', handleSwap);

  amountInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleConvert();
  });

  quickPairsEl.addEventListener('click', e => {
    const chip = e.target.closest('.pair-chip');
    if (!chip) return;
    const { from, to } = chip.dataset;
    fromSelect.value = from;
    toSelect.value = to;

    document.querySelectorAll('.pair-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activePair = chip;

    handleConvert();
  });

  [fromSelect, toSelect].forEach(sel => {
    sel.addEventListener('change', () => {
      document.querySelectorAll('.pair-chip').forEach(c => c.classList.remove('active'));
      activePair = null;
    });
  });
}

function handleSwap() {
  const temp = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = temp;

  swapBtn.classList.remove('spinning');
  void swapBtn.offsetWidth;
  swapBtn.classList.add('spinning');

  setTimeout(() => swapBtn.classList.remove('spinning'), 450);

  if (resultPanel.classList.contains('has-result')) {
    handleConvert();
  }
}

async function handleConvert() {
  const amount = parseFloat(amountInput.value);
  const from = fromSelect.value;
  const to = toSelect.value;

  if (isNaN(amount) || amount < 0) {
    showError('Please enter a valid amount.');
    return;
  }

  if (!from || !to) {
    showError('Please select both currencies.');
    return;
  }

  if (from === to) {
    showResult(amount, amount, from, to, 1);
    return;
  }

  setLoading(true);

  try {
    const rate = await fetchRate(from, to);
    const converted = amount * rate;
    showResult(amount, converted, from, to, rate);
  } catch (err) {
    showError(err.message || 'Failed to fetch rates. Please try again.');
  } finally {
    setLoading(false);
  }
}

async function fetchRate(from, to) {
  if (lastBase === from && lastRates) {
    if (lastRates[to] !== undefined) return lastRates[to];
  }

  const url = `${API_BASE}/${from}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (data.result !== 'success' && !data.rates) {
    throw new Error('Invalid API response.');
  }

  lastRates = data.rates;
  lastBase = from;

  if (lastRates[to] === undefined) {
    throw new Error(`Currency "${to}" not found.`);
  }

  return lastRates[to];
}

function showResult(amount, converted, from, to, rate) {
  resultPanel.classList.remove('has-error');
  resultPanel.classList.add('has-result');

  const fromInfo = CURRENCIES.find(c => c.code === from) || { flag: '', code: from };
  const toInfo = CURRENCIES.find(c => c.code === to) || { flag: '', code: to };

  const formattedAmount = formatNumber(amount, from);
  const formattedConverted = formatNumber(converted, to);

  resultInner.innerHTML = `
    <div class="result-number">${toInfo.flag} ${formattedConverted}</div>
    <div class="result-label">${fromInfo.flag} ${formattedAmount} ${from} = ${toInfo.flag} ${formattedConverted} ${to}</div>
  `;

  rateStrip.classList.remove('hidden');
  rateDisplay.textContent = `1 ${from} = ${formatRate(rate)} ${to}`;
  rateTimestamp.textContent = formatTime(new Date());
  rateInverse.textContent = `1 ${to} = ${formatRate(1 / rate)} ${from}`;
}

function showError(msg) {
  resultPanel.classList.remove('has-result');
  resultPanel.classList.add('has-error');
  resultInner.innerHTML = `
    <div class="result-error">
      <span>⚠</span>
      <span>${msg}</span>
    </div>
  `;
  rateStrip.classList.add('hidden');
}

function setLoading(loading) {
  convertBtn.disabled = loading;
  if (loading) convertBtn.classList.add('loading');
  else convertBtn.classList.remove('loading');
}

function formatNumber(value, currency) {
  const decimals = getDecimals(currency);
  try {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    return value.toFixed(decimals);
  }
}

function formatRate(rate) {
  if (rate >= 100) return rate.toFixed(2);
  if (rate >= 10) return rate.toFixed(4);
  if (rate >= 1) return rate.toFixed(6);
  return rate.toFixed(8);
}

function getDecimals(currency) {
  const zeroDecimal = ['JPY','KRW','IDR','HUF','CLP','COP','PYG','BIF'];
  const highDecimal = ['BTC','ETH'];
  if (zeroDecimal.includes(currency)) return 0;
  if (highDecimal.includes(currency)) return 8;
  return 2;
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
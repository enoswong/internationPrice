document.addEventListener('DOMContentLoaded', () => {
    restoreOptions();
    document.getElementById('refreshRates').addEventListener('click', refreshRates);
    document.getElementById('save').addEventListener('click', saveOptions);
    setupCurrencyConverter();
    document.getElementById('toggleSavedRates').addEventListener('click', toggleSavedRates);
});

function refreshRates() {
    chrome.runtime.sendMessage({ action: "refreshRates" }, (response) => {
        if (response.success) {
            document.getElementById('lastUpdate').textContent = 'Rates updated successfully!';
            chrome.storage.local.get(['exchangeRates', 'selectedCurrencies'], (result) => {
                if (result.exchangeRates) {
                    console.log('All rate data:', result.exchangeRates);
                    const savedRates = {};
                    (result.selectedCurrencies || []).forEach(currency => {
                        if (result.exchangeRates[currency]) {
                            savedRates[currency] = result.exchangeRates[currency];
                        }
                    });
                    console.log('Saved rate data:', savedRates);
                    displayExchangeRates(result.exchangeRates);
                }
            });
        } else {
            document.getElementById('lastUpdate').textContent = 'Failed to update rates.';
        }
    });
}

function saveOptions() {
    const selectedCurrencies = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    chrome.storage.sync.set({ selectedCurrencies: selectedCurrencies }, () => {
        console.log("Options saved");
        const status = document.createElement('div');
        status.textContent = 'Options saved.';
        status.style.color = 'green';
        document.body.appendChild(status);
        setTimeout(() => status.remove(), 2000);

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "updateExchangeRateDisplay" });
        });
    });
}

function restoreOptions() {
    chrome.storage.sync.get('selectedCurrencies', (result) => {
        const selectedCurrencies = result.selectedCurrencies || currencyList;
        const optionsContainer = document.getElementById('currencyOptions');

        currencyList.forEach(currency => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = currency;
            checkbox.value = currency;
            checkbox.checked = selectedCurrencies.includes(currency);
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(currency));
            optionsContainer.appendChild(label);
        });
    });

    chrome.storage.local.get('lastUpdateTime', (result) => {
        if (result.lastUpdateTime) {
            const lastUpdate = new Date(result.lastUpdateTime);
            document.getElementById('lastUpdate').textContent = `Last updated: ${lastUpdate.toLocaleString()}`;
        }
    });
}

let rates = {}

function setupCurrencyConverter() {
    chrome.storage.local.get(['mainPageCurrency', 'exchangeRates'], (result) => {
        const mainCurrency = result.mainPageCurrency || 'USD';
        rates = result.exchangeRates || {};

        // Add HKD with rate 1 if it doesn't exist
        if (!rates.hasOwnProperty('HKD')) {
            rates['HKD'] = 1;
        }
        
        const fromSelect = document.getElementById('cc-from-currency');
        const toSelect = document.getElementById('cc-to-currency');

        for (const currency of Object.keys(rates)) {
            const fromOption = new Option(currency, currency, currency === mainCurrency, currency === mainCurrency);
            const toOption = new Option(currency, currency, currency === 'HKD', currency === 'HKD');
            fromSelect.add(fromOption);
            toSelect.add(toOption);
        }

        document.getElementById('cc-convert').addEventListener('click', convertCurrency);
    });
}

function convertCurrency() {
    chrome.storage.local.get('exchangeRates', (result) => {
        const fromCurrency = document.getElementById('cc-from-currency').value;
        const toCurrency = document.getElementById('cc-to-currency').value;
        const fromAmount = parseFloat(document.getElementById('cc-from-amount').value);

        if (isNaN(fromAmount)) {
            alert('Empty Amount');
            return;
        }

        const convertedAmount = calculateExchangeRate(fromAmount, fromCurrency, toCurrency, rates);
        if (convertedAmount !== null) {
            document.getElementById('cc-to-amount').value = convertedAmount.toFixed(2);
        } else {
            alert('Cannot use this amount');
        }
    });
}

function calculateExchangeRate(amount, fromCurrency, toCurrency, rates) {
    if (fromCurrency === toCurrency) return amount;

    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];

    if (!fromRate || !toRate) {
        console.error(`Exchange rate not available for ${fromCurrency} or ${toCurrency}`);
        return null;
    }

    return (amount * fromRate) / toRate;
}

function toggleSavedRates() {
    const savedRatesContainer = document.getElementById('savedRatesContainer');
    const toggleButton = document.getElementById('toggleSavedRates');

    if (savedRatesContainer.style.display === 'none') {
        chrome.storage.local.get(['exchangeRates', 'lastUpdated'], (result) => {
            if (result.exchangeRates && result.lastUpdated) {
                let content = `<h4>Last Updated: ${new Date(result.lastUpdated).toLocaleString()}</h4>`;
                content += '<table><tr><th>Currency</th><th>Rate (1 HKD =)</th></tr>';
                for (const [currency, rate] of Object.entries(result.exchangeRates)) {
                    if (currency !== 'HKD') {
                        const inverseRate = (1 / rate).toFixed(4);
                        content += `<tr><td>${currency}</td><td>${inverseRate}</td></tr>`;
                    }
                }
                content += '</table>';
                savedRatesContainer.innerHTML = content;
                savedRatesContainer.style.display = 'block';
                toggleButton.textContent = 'Hide Saved Exchange Rates';
            } else {
                savedRatesContainer.innerHTML = '<p>No saved exchange rates found.</p>';
                savedRatesContainer.style.display = 'block';
                toggleButton.textContent = 'Hide Saved Exchange Rates';
            }
        });
    } else {
        savedRatesContainer.style.display = 'none';
        toggleButton.textContent = 'Show Saved Exchange Rates';
    }
}

// 在獲取匯率的函數中添加存儲邏輯
function fetchExchangeRate() {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
        .then(response => response.json())
        .then(data => {
            const rate = data.rates.TWD;
            document.getElementById('exchange-rate').textContent = rate.toFixed(2);
            
            // 將匯率存儲到 Chrome 存儲中
            chrome.storage.local.set({ 'usdToTwdRate': rate }, function() {
                console.log('Exchange rate saved');
            });
        })
        .catch(error => {
            console.error('Error fetching exchange rate:', error);
        });
}
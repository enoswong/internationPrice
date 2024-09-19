const currencyList = ['HKD', 'USD', 'GBP', 'EUR', 'JPY', 'TWD', 'CNY', 'AUD', 'CAD', 'CHF', 'SGD', 'MYR', 'THB', 'KRW'];

document.addEventListener('DOMContentLoaded', () => {
    restoreOptions();
    document.getElementById('refreshRates').addEventListener('click', refreshRates);
    document.getElementById('save').addEventListener('click', saveOptions);
    setupCurrencyConverter();

    // 初始顯示匯率
    chrome.storage.local.get('ccExchangeRates', (result) => {
        if (result.ccExchangeRates) {
            displayExchangeRates(result.ccExchangeRates);
        }
    });
});

function refreshRates() {
    chrome.runtime.sendMessage({ action: "refreshRates" }, (response) => {
        if (response.success) {
            document.getElementById('lastUpdate').textContent = 'Rates updated successfully!';
            // 重新获取并显示更新后的汇率
            chrome.storage.local.get('ccExchangeRates', (result) => {
                if (result.ccExchangeRates) {
                    // 確保 DOM 已加載完成
                    if (document.readyState === 'complete') {
                        displayExchangeRates(result.ccExchangeRates);
                    } else {
                        window.addEventListener('load', () => {
                            displayExchangeRates(result.ccExchangeRates);
                        });
                    }
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
        console.log('Options saved');
        const status = document.createElement('div');
        status.textContent = 'Options saved.';
        status.style.color = 'green';
        document.body.appendChild(status);
        setTimeout(() => {
            status.remove();
        }, 2000);

        // 通知 content script 更新匯率顯示
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "updateExchangeRateDisplay"});
        });
    });
}

function restoreOptions() {
    chrome.storage.sync.get('selectedCurrencies', (result) => {
        const selectedCurrencies = result.selectedCurrencies || Object.keys(currencyList);
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

    // 显示上次更新时间
    chrome.storage.local.get('lastUpdateTime', (result) => {
        if (result.lastUpdateTime) {
            const lastUpdate = new Date(result.lastUpdateTime);
            document.getElementById('lastUpdate').textContent = `Last updated: ${lastUpdate.toLocaleString()}`;
        }
    });

}

function setupCurrencyConverter() {
    chrome.storage.local.get(['mainPageCurrency', 'ccExchangeRates'], (result) => {
        const mainCurrency = result.mainPageCurrency || 'USD';
        const rates = result.ccExchangeRates || {};

        const fromSelect = document.getElementById('cc-from-currency');
        const toSelect = document.getElementById('cc-to-currency');

        // 填充货币选项
        for (const currency of Object.keys(rates)) {
            const fromOption = new Option(currency, currency, currency === mainCurrency, currency === mainCurrency);
            const toOption = new Option(currency, currency, currency === 'HKD', currency === 'HKD');
            fromSelect.add(fromOption);
            toSelect.add(toOption);
        }

        // 添加转换功能
        document.getElementById('cc-convert').addEventListener('click', convertCurrency);

    });
}

function displayExchangeRates(rates) {
    const ratesContainer = document.getElementById('ccExchangeRates');
    if (!ratesContainer) {
        console.error('Element with id "ccExchangeRates" not found');
        return;
    }
    let content = '<strong>匯率:</strong><br>';
    for (const [currency, rate] of Object.entries(rates)) {
        if (currency !== 'HKD') {
            if (rate < 1) {
                const inverseRate = (1 / rate).toFixed(2);
                content += `${currency}: ${rate.toFixed(4)} HKD (${inverseRate} ${currency} = 1 HKD)<br>`;
            } else {
                content += `${currency}: ${rate.toFixed(4)} HKD<br>`;
            }
        }
    }
    ratesContainer.innerHTML = content;
}

function convertCurrency() {
    chrome.storage.local.get('ccExchangeRates', (result) => {
        const rates = result.ccExchangeRates || {};
        const fromCurrency = document.getElementById('cc-from-currency').value;
        const toCurrency = document.getElementById('cc-to-currency').value;
        const fromAmount = parseFloat(document.getElementById('cc-from-amount').value);

        if (isNaN(fromAmount)) {
            alert('請輸入有效的金額');
            return;
        }

        const fromRate = rates[fromCurrency];
        const toRate = rates[toCurrency];

        if (fromRate && toRate) {
            let toAmount;
            if (toCurrency === 'HKD') {
                toAmount = fromRate < 1 ? (fromAmount / (1 / fromRate)) : (fromAmount * fromRate);
            } else if (fromCurrency === 'HKD') {
                toAmount = toRate < 1 ? (fromAmount * (1 / toRate)) : (fromAmount / toRate);
            } else {
                const hkdAmount = fromRate < 1 ? (fromAmount / (1 / fromRate)) : (fromAmount * fromRate);
                toAmount = toRate < 1 ? (hkdAmount * (1 / toRate)) : (hkdAmount / toRate);
            }
            document.getElementById('cc-to-amount').value = toAmount.toFixed(2);
        } else {
            alert('無法轉換所選貨幣');
        }
    });
}
importScripts('sharedInfo.js');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getExchangeRates") {
        chrome.storage.local.get(['exchangeRates', 'lastUpdated'], (result) => {
            sendResponse({ rates: result.exchangeRates, lastUpdated: result.lastUpdated });
        });
        return true;
    } else if (request.action === "refreshRates") {
        fetchExchangeRates()
            .then(() => sendResponse({success: true}))
            .catch(() => sendResponse({success: false}));
        return true;
    }
});

async function fetchExchangeRates() {
    try {
        const response = await fetch('https://api.hkma.gov.hk/public/market-data-and-statistics/monthly-statistical-bulletin/er-ir/er-eeri-daily');
        const data = await response.json();
        
        if (data.result && data.result.records && data.result.records.length > 0) {
            const latestRecord = data.result.records[0];
            const rates = {};
            
            for (const currency of currencyList) {
                if (latestRecord[currency.toLowerCase()]) {
                    rates[currency] = latestRecord[currency.toLowerCase()];
                }
            }
            
            await chrome.storage.local.set({ 
                exchangeRates: rates, 
                lastUpdated: new Date().toISOString() 
            });
            console.log('Exchange rates updated:', rates);
            return rates;
        } else {
            throw new Error('Invalid data structure from API');
        }
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        throw error;
    }
}

// 每小時更新一次匯率
setInterval(fetchExchangeRates, 60 * 60 * 1000);

// 初始化時獲取匯率
fetchExchangeRates();

// 每天凌晨00:00更新汇率
chrome.alarms.create('updateRates', { periodInMinutes: 1440 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'updateRates') {
        fetchExchangeRates();
    }
});

// 插件安装或更新时立即更新汇率
chrome.runtime.onInstalled.addListener(fetchExchangeRates);
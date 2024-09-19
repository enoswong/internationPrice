chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getExchangeRates") {
        chrome.storage.local.get(['exchangeRates', 'lastUpdated'], (result) => {
            sendResponse({ rates: result.exchangeRates, lastUpdated: result.lastUpdated });
        });
        return true; // 表示會異步發送回應
    } else if (request.action === "refreshRates") {
        checkAndUpdateRates()
            .then(() => sendResponse({success: true}))
            .catch(() => sendResponse({success: false}));
        return true;  // 表示我们将异步发送响应
    }
});

async function checkAndUpdateRates() {
    try {
        const rates = await fetchExchangeRates();
        const now = new Date();
        await chrome.storage.local.set({
            ccExchangeRates: rates,
            lastUpdateTime: now.getTime()
        });
        console.log("Updated exchange rates:", rates);
        return true;
    } catch (error) {
        console.error("Error updating exchange rates:", error);
        throw error;
    }
}

// 判断是否是新的一天
function isNewDay(lastUpdate, now) {
    return lastUpdate.getDate() !== now.getDate() ||
        lastUpdate.getMonth() !== now.getMonth() ||
        lastUpdate.getFullYear() !== now.getFullYear();
}

async function fetchExchangeRates() {
    try {
        const response = await fetch('https://api.hkma.gov.hk/public/market-data-and-statistics/monthly-statistical-bulletin/er-ir/er-eeri-daily');
        const data = await response.json();
        
        if (data.result && data.result.records && data.result.records.length > 0) {
            const latestRecord = data.result.records[0];
            const rates = {};
            const currencies = ['usd', 'gbp', 'jpy', 'eur', 'cad', 'aud', 'sgd', 'chf', 'cny', 'krw', 'thb', 'myr', 'twd'];
            
            for (const currency of currencies) {
                if (latestRecord[currency]) {
                    rates[currency.toUpperCase()] = 1 / latestRecord[currency];
                }
            }
            
            // 儲存匯率到 Chrome 存儲
            chrome.storage.local.set({ exchangeRates: rates, lastUpdated: new Date().toISOString() });
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

// 每天凌晨00:00检查并更新汇率
chrome.alarms.create('updateRates', { periodInMinutes: 1440 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'updateRates') {
        checkAndUpdateRates();
    }
});

// 插件安装或更新时立即检查并更新汇率
chrome.runtime.onInstalled.addListener(() => {
    checkAndUpdateRates();
});
// 儲存匯率的對象
let ccExchangeRates = {};

// 货币符号映射
const ccCurrencySymbols = {
    'USD': '$',
    'GBP': '£',
    'JPY': '¥',
    'EUR': '€',
    'CAD': 'C$',
    'AUD': 'A$',
    'SGD': 'S$',
    'CHF': 'Fr.',
    'CNY': '¥',
    'KRW': '₩',
    'THB': '฿',
    'MYR': 'RM',
    'TWD': 'NT$'
};

// 货币名称和符号映射
const ccCurrencyInfo = {
    'USD': { name: 'US Dollar', symbol: '$', aliases: ['Dollar', 'US', 'USD', 'US$'] },
    'GBP': { name: 'British Pound', symbol: '£', aliases: ['Pound', 'Sterling', 'GBP'] },
    'JPY': { name: 'Japanese Yen', symbol: '¥', aliases: ['Yen', 'JPY', '円'] },
    'EUR': { name: 'Euro', symbol: '€', aliases: ['EUR'] },
    'CAD': { name: 'Canadian Dollar', symbol: 'C$', aliases: ['CAD', 'CA Dollar'] },
    'AUD': { name: 'Australian Dollar', symbol: 'A$', aliases: ['AUD', 'AU Dollar'] },
    'SGD': { name: 'Singapore Dollar', symbol: 'S$', aliases: ['SGD', 'SG Dollar'] },
    'CHF': { name: 'Swiss Franc', symbol: 'Fr.', aliases: ['CHF', 'Franc'] },
    'CNY': { name: 'Chinese Yuan', symbol: '¥', aliases: ['人民幣', 'RMB', 'Yuan', 'CNY', '元'] },
    'KRW': { name: 'South Korean Won', symbol: '₩', aliases: ['KRW', 'Won', '원'] },
    'THB': { name: 'Thai Baht', symbol: '฿', aliases: ['THB', 'Baht', 'บาท'] },
    'MYR': { name: 'Malaysian Ringgit', symbol: 'RM', aliases: ['MYR', 'Ringgit'] },
    'TWD': { name: 'New Taiwan Dollar', symbol: 'NT$', aliases: ['新台幣', 'NT', 'TWD', 'Taiwan Dollar', '台幣'] }
};

// 识别货币和金额的函数
function ccIdentifyCurrency(text) {
    // 更新正则表达式以匹配包含千位分隔符的数字
    const ccPriceRegex = /([\d,]+([.,]\d{1,2})?)/;
    const ccPriceMatch = text.match(ccPriceRegex);

    if (ccPriceMatch) {
        // 移除所有逗号，然后解析为浮点数
        const ccAmount = parseFloat(ccPriceMatch[1].replace(/,/g, ''));

        for (const [currency, info] of Object.entries(ccCurrencyInfo)) {
            // 首先检查完整的货币名称或代码
            if (text.includes(currency) || text.toLowerCase().includes(info.name.toLowerCase())) {
                return { currency, amount: ccAmount };
            }
            
            // 然后检查符号和别名，但要确保不会误识别
            if (info.symbol !== '$' && text.includes(info.symbol)) {
                return { currency, amount: ccAmount };
            }
            
            for (const alias of info.aliases) {
                if (alias !== '$' && text.includes(alias)) {
                    return { currency, amount: ccAmount };
                }
            }
        }

        // 如果只找到 '$' 符号，默认为 USD
        if (text.includes('$')) {
            return { currency: 'USD', amount: ccAmount };
        }
    }

    return null;
}

// 从存储中获取汇率
async function ccFetchExchangeRates() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "getExchangeRates" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error fetching exchange rates:", chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
            } else if (response && response.rates) {
                ccExchangeRates = response.rates;
                console.log("Received exchange rates:", ccExchangeRates);
                resolve(ccExchangeRates);
            } else {
                console.error("Invalid response from background script");
                reject(new Error("Invalid response"));
            }
        });
    });
}

// 转换货币并显示结果
function ccConvertAndDisplayCurrency(element) {
    if (element.hasAttribute('data-cc-converted')) {
        return;
    }

    const ccText = element.textContent.trim();
    const ccCurrencyInfo = ccIdentifyCurrency(ccText);

    if (ccCurrencyInfo) {
        const { currency, amount } = ccCurrencyInfo;
        if (currency in ccExchangeRates && currency !== 'HKD') {
            const rate = ccExchangeRates[currency];
            let convertedAmount;
            
            // 根據匯率是否小於1來調整計算方法
            if (rate < 1) {
                convertedAmount = (amount / (1 / rate)).toFixed(2);
            } else {
                convertedAmount = (amount / rate).toFixed(2);
            }

            // 創建一個新的 span 元素來包含轉換後的金額
            const ccConvertedElement = document.createElement('span');
            ccConvertedElement.textContent = ` (HKD ${convertedAmount})`;
            ccConvertedElement.style.color = 'green';
            ccConvertedElement.classList.add('cc-currency-conversion');
            ccConvertedElement.classList.add(currency.toLowerCase());

            // 將轉換後的金額直接添加到原文本的後面
            element.appendChild(ccConvertedElement);

            // 標記元素已被轉換
            element.setAttribute('data-cc-converted', 'true');

            console.log(`Converted ${amount} ${currency} to HKD ${convertedAmount} (Rate: ${rate})`);
        }
    }
}

// 处理单个元素
function processElement(element) {
    if (element.nodeType === Node.ELEMENT_NODE && !element.hasAttribute('data-cc-converted')) {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while (node = walker.nextNode()) {
            const trimmedText = node.textContent.trim();
            if (trimmedText && ccIdentifyCurrency(trimmedText)) {
                ccConvertAndDisplayCurrency(node.parentNode);
            }
        }
    }
}

// 处理页面上包含文字的元素
function ccProcessAllElements() {
    const elements = document.body.getElementsByTagName('*');
    for (let element of elements) {
        if (!element.hasAttribute('data-cc-converted')) {
            processElement(element);
        }
    }
}

// 处理新添加的元素
function handleAddedNodes(addedNodes) {
    addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            processElement(node);
        } else if (node.nodeType === Node.TEXT_NODE) {
            const parentElement = node.parentElement;
            if (parentElement && !parentElement.hasAttribute('data-cc-converted')) {
                const trimmedText = node.textContent.trim();
                if (trimmedText && ccIdentifyCurrency(trimmedText)) {
                    ccConvertAndDisplayCurrency(parentElement);
                }
            }
        }
    });
}

// 初始化函数
async function ccInitialize() {
    try {
        await ccFetchExchangeRates();
        if (Object.keys(ccExchangeRates).length > 0) {
            console.log("Fetched exchange rates:", ccExchangeRates);
            updateExchangeRateDisplay();
            ccProcessAllElements();
            observer.observe(document.body, { childList: true, subtree: true });
            
            // 添加延迟的二次扫描
            setTimeout(() => {
                ccProcessAllElements();
                updateExchangeRateDisplay();
            }, 3000);
        } else {
            console.error("No exchange rates available.");
        }
    } catch (error) {
        console.error("Error during initialization:", error);
    }
}

// 创建汇率显示框
function createExchangeRateDisplay() {
    console.log("Creating exchange rate display");
    const display = document.createElement('div');
    display.id = 'cc-exchange-rate-display data-cc-converted';
    display.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background-color: rgba(255, 255, 255, 0.9);
        border: 1px solid #ccc;
        border-radius: 5px;
        padding: 10px;
        font-size: 12px;
        z-index: 9999;
        max-width: 200px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        max-height: 300px;
        overflow-y: auto;
        transition: opacity 0.3s ease-in-out;
    `;
    
    document.body.appendChild(display);
    console.log("Exchange rate display created and added to the page");

    // 添加鼠標懸停效果
    display.addEventListener('mouseenter', () => {
        display.style.opacity = '1';
    });
    display.addEventListener('mouseleave', () => {
        display.style.opacity = '0.7';
    });

    return display;
}

// 更新汇率显示
function updateExchangeRateDisplay() {
    console.log("Updating exchange rate display");
    let display = document.getElementById('cc-exchange-rate-display');
    if (!display) {
        console.log("Creating new exchange rate display");
        display = createExchangeRateDisplay();
    }

    if (!ccExchangeRates || Object.keys(ccExchangeRates).length === 0) {
        console.error("No exchange rates available for display");
        display.innerHTML = '<strong>匯率數據不可用</strong>';
        return;
    }

    chrome.storage.sync.get('selectedCurrencies', (result) => {
        const selectedCurrencies = result.selectedCurrencies || Object.keys(ccCurrencySymbols);
        
        let content = '<div  style="display: flex; justify-content: space-between; align-items: center;">';
        content += '<strong>匯率: 1外幣 = x港幣</strong>';
        content += '<button id="cc-close-rates" style="font-size: 12px; padding: 2px 5px;">關閉</button>';
        content += '</div><br>';
        
        for (const [currency, rate] of Object.entries(ccExchangeRates)) {
            if (currency !== 'HKD' && rate !== undefined && selectedCurrencies.includes(currency)) {
                const inverseRate = (1 / rate).toFixed(4);
                content += `${currency}: ${inverseRate} HKD<br>`;

                if(rate > 1){
                    content += `<span style="color: red;">(${currency}: ${rate.toFixed(4)} HKD)</span><br>`;
                }                
            }
        }

        display.innerHTML = content;
        console.log("Exchange rate display updated");

        // 添加關閉按鈕事件監聽器
        document.getElementById('cc-close-rates').addEventListener('click', () => {
            display.style.display = 'none';
            createShowButton();
        });
    });
}

// 创建显示按钮
function createShowButton() {
    const showButton = document.createElement('button');
    showButton.id = 'cc-show-rates';
    showButton.textContent = '顯示匯率';
    showButton.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background-color: rgba(255, 255, 255, 0.9);
        border: 1px solid #ccc;
        border-radius: 5px;
        padding: 5px 10px;
        font-size: 12px;
        z-index: 9999;
        cursor: pointer;
    `;
    
    showButton.addEventListener('click', () => {
        showButton.remove();
        const display = document.getElementById('cc-exchange-rate-display');
        if (display) {
            display.style.display = 'block';
        } else {
            updateExchangeRateDisplay();
        }
    });
    
    document.body.appendChild(showButton);
}

// 创建一个 MutationObserver 实例
const observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
        if (mutation.type === 'childList') {
            console.log("Mutation observed:", mutation);
            handleAddedNodes(mutation.addedNodes);
        }
    }
});

// 当DOM加载完成时执行初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ccInitialize);
} else {
    ccInitialize();
}

// 监听页面刷新事件
window.addEventListener('beforeunload', () => {
    // 断开观察器连接
    observer.disconnect();
});

// 添加到文件末尾
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateExchangeRateDisplay") {
        updateExchangeRateDisplay();
    }
});
const currencyList = ['TWD', 'USD', 'GBP', 'JPY', 'CAD', 'AUD', 'SGD', 'CHF', 'CNY', 'KRW', 'THB', 'MYR', 'EUR', 'PHP', 'INR', 'IDR', 'ZAR', 'HKD'];

// 儲存匯率的對象
let ccExchangeRates = {};

const ccCurrencyList = ['TWD', 'USD', 'GBP', 'JPY', 'CAD', 'AUD', 'SGD', 'CHF', 'CNY', 'KRW', 'THB', 'MYR', 'EUR', 'PHP', 'INR', 'IDR', 'ZAR', 'HKD'];

// 货币名称和符号映射
const ccCurrencyInfo = {
    'TWD': { name: 'New Taiwan Dollar', symbol: 'NT$', aliases: ['TWD', 'NT$', '新台幣', 'NT', '台幣'] },
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
    'HKD': { name: 'Hong Kong Dollar', symbol: 'HK$', aliases: ['HKD', 'HK$', '港幣', 'HK'] },
    'PHP': { name: 'Philippine Peso', symbol: '₱', aliases: ['PHP', 'Peso'] },
    'INR': { name: 'Indian Rupee', symbol: '₹', aliases: ['INR', 'Rupee'] },
    'IDR': { name: 'Indonesian Rupiah', symbol: 'Rp', aliases: ['IDR', 'Rupiah'] },
    'ZAR': { name: 'South African Rand', symbol: 'R', aliases: ['ZAR', 'Rand'] }
};
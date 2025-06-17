// 全局变量
let selectedAPIs = JSON.parse(localStorage.getItem('selectedAPIs') || '[]'); // 初始设置为空，DOMContentLoaded中会填充
let customAPIs = JSON.parse(localStorage.getItem('customAPIs') || '[]'); // 存储自定义API列表

// 添加当前播放的集数索引
let currentEpisodeIndex = 0;
// 添加当前视频的所有集数
let currentEpisodes = [];
// 添加当前视频的标题
let currentVideoTitle = '';
// 全局变量用于倒序状态
let episodesReversed = false;

// 新增：全局常量，用于控制是否隐藏内置的成人API
// 根据您的新要求：我们希望所有接口都显示，因此设置为 false。
const HIDE_BUILTIN_ADULT_APIS = false; 

// !!! 请用您实际的 20 个（或更多）内置API配置替换我代码中模拟的 API_SITES 对象。!!!
// !!! 确保每个API都正确标记了 adult: false 以符合您的默认显示所有接口的要求。!!!
const API_SITES = {
    "api1": { name: "通用资源站A", url: "https://api.example.com/api1/", adult: false },
    "api2": { name: "通用资源站B", url: "https://api.example.com/api2/", adult: false },
    "api3": { name: "通用资源站C", url: "https://api.example.com/api3/", adult: false },
    "api4": { name: "通用资源站D", url: "https://api.example.com/api4/", adult: false },
    "api5": { name: "通用资源站E", url: "https://api.example.com/api5/", adult: false },
    "api6": { name: "通用资源站F", url: "https://api.example.com/api6/", adult: false },
    "api7": { name: "通用资源站G", url: "https://api.example.com/api7/", adult: false },
    "api8": { name: "通用资源站H", url: "https://api.example.com/api8/", adult: false },
    "api9": { name: "通用资源站I", url: "https://api.example.com/api9/", adult: false },
    "api10": { name: "通用资源站J", url: "https://api.example.com/api10/", adult: false },
    "api11": { name: "通用资源站K", url: "https://api.example.com/api11/", adult: false },
    "api12": { name: "通用资源站L", url: "https://api.example.com/api12/", adult: false },
    "api13": { name: "通用资源站M", url: "https://api.example.com/api13/", adult: false },
    "api14": { name: "通用资源站N", url: "https://api.example.com/api14/", adult: false },
    "api15": { name: "通用资源站O", url: "https://api.example.com/api15/", adult: false },
    "api16": { name: "通用资源站P", url: "https://api.example.com/api16/", adult: false },
    "api17": { name: "通用资源站Q", url: "https://api.example.com/api17/", adult: false },
    "api18": { name: "通用资源站R", url: "https://api.example.com/api18/", adult: false },
    "api19": { name: "通用资源站S", url: "https://api.example.com/api19/", adult: false },
    "api20": { name: "通用资源站T", url: "https://api.example.com/api20/", adult: false }
};


const PLAYER_CONFIG = {
    adFilteringStorage: 'adFilteringEnabled'
};

// ... 保持其他代码不变，特别是以下两个函数中的修改是关键

// 2. 修正 `DOMContentLoaded` 中的默认初始化逻辑
// 确保即使 localStorage 中有旧数据，也会默认选中所有 API
document.addEventListener('DOMContentLoaded', function () {
    // 每次加载时，强制默认选中所有内置资源和所有自定义资源
    // 这样做可以确保无论 localStorage 中有什么，初始状态都符合您的要求
    selectedAPIs = Object.keys(API_SITES); // 选中所有内置API

    // 默认选中所有自定义资源
    customAPIs.forEach((api, index) => {
        // 如果自定义API没有被标记为成人或我们不隐藏成人API，则选中
        // 由于 HIDE_BUILTIN_ADULT_APIS = false，此处实际上不进行隐藏
        // 但仍然检查 isAdult 属性以区分，尽管它们都会被选中
        selectedAPIs.push('custom_' + index);
    });

    // 去重并保存
    selectedAPIs = [...new Set(selectedAPIs)];
    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));

    // 强制黄色内容过滤默认开启
    localStorage.setItem('yellowFilterEnabled', 'true');
    localStorage.setItem(PLAYER_CONFIG.adFilteringStorage, 'true');

    // 默认启用豆瓣功能 (如果存在，假设有相关函数)
    localStorage.setItem('doubanEnabled', 'true');

    // 标记已初始化默认值（这个标记现在更多是形式，因为我们每次都强制设置默认值）
    localStorage.setItem('hasInitializedDefaults', 'true'); // 保持此行

    // 初始化API复选框
    initAPICheckboxes();

    // 初始化自定义API列表
    renderCustomAPIsList();

    // 初始化显示选中的API数量
    updateSelectedApiCount();

    // 渲染搜索历史
    renderSearchHistory();

    // 设置黄色内容过滤器开关初始状态
    const yellowFilterToggle = document.getElementById('yellowFilterToggle');
    if (yellowFilterToggle) {
        // 强制黄色内容过滤器开启并禁用，不可更改
        yellowFilterToggle.checked = true;
        yellowFilterToggle.disabled = true;
        localStorage.setItem('yellowFilterEnabled', 'true'); // 确保本地存储也是true
        const yellowFilterContainer = yellowFilterToggle.closest('div').parentNode;
        yellowFilterContainer.classList.add('filter-disabled');
        const filterDescription = yellowFilterContainer.querySelector('p.filter-description');
        if (filterDescription) {
            filterDescription.innerHTML = '<strong class="text-green-400">已强制启用敏感内容过滤</strong>';
        }
    }

    // 设置广告过滤开关初始状态
    const adFilterToggle = document.getElementById('adFilterToggle');
    if (adFilterToggle) {
        adFilterToggle.checked = localStorage.getItem(PLAYER_CONFIG.adFilteringStorage) !== 'false'; // 默认为true
    }

    // 设置事件监听器
    setupEventListeners();

    // 初始检查成人API选中状态 (这部分现在更多是确保如果localStorage有旧数据也能被过滤掉)
    checkAdultAPIsSelected();
});

// 3. 修正 `initAPICheckboxes` 确保所有 API 都被渲染
function initAPICheckboxes() {
    const container = document.getElementById('apiCheckboxes');
    if (!container) return; // 添加安全检查

    container.innerHTML = '';

    // 添加普通API组标题
    const normaldiv = document.createElement('div');
    normaldiv.id = 'normaldiv';
    normaldiv.className = 'grid grid-cols-2 gap-2'; // 保持网格布局
    const normalTitle = document.createElement('div');
    normalTitle.className = 'api-group-title col-span-full'; // 标题占满两列
    normalTitle.textContent = '内置资源'; // 更名为“内置资源”
    normaldiv.appendChild(normalTitle);

    // 创建普通API源的复选框
    Object.keys(API_SITES).forEach(apiKey => {
        const api = API_SITES[apiKey];
        // !!!! 移除所有可能跳过渲染的条件，确保所有API都被创建复选框 !!!!
        // if (HIDE_BUILTIN_ADULT_APIS && api.adult) return; // 移除此行

        // 从 selectedAPIs 中检查是否选中
        const checked = selectedAPIs.includes(apiKey); 

        const checkbox = document.createElement('div');
        checkbox.className = 'flex items-center';
        checkbox.innerHTML = `
            <input type="checkbox" id="api_${apiKey}" 
                           class="form-checkbox h-3 w-3 text-blue-600 bg-[#222] border border-[#333] ${api.adult ? 'api-adult' : ''}" 
                           ${checked ? 'checked' : ''} 
                           data-api="${apiKey}">
            <label for="api_${apiKey}" class="ml-1 text-xs text-gray-400 truncate">${api.name}</label>
        `;
        normaldiv.appendChild(checkbox);

        // 添加事件监听器
        checkbox.querySelector('input').addEventListener('change', function () {
            updateSelectedAPIs();
        });
    });
    container.appendChild(normaldiv);
    
    // 确保移除可能存在的 adultdiv，因为现在所有内置API都在 normaldiv 中显示
    const existingAdultDiv = document.getElementById('adultdiv');
    if (existingAdultDiv) {
        existingAdultDiv.remove();
    }
}

// ... 保持 `addAdultAPI` 函数为空，确保不添加单独的成人API列表
function addAdultAPI() {
    const existingAdultDiv = document.getElementById('adultdiv');
    if (existingAdultDiv) {
        existingAdultDiv.remove();
    }
}

// ... 保持 `checkAdultAPIsSelected` 函数不变 (它现在主要用于强制过滤器的状态)
function checkAdultAPIsSelected() {
    const yellowFilterToggle = document.getElementById('yellowFilterToggle');
    const yellowFilterContainer = yellowFilterToggle ? yellowFilterToggle.closest('div').parentNode : null;
    const filterDescription = yellowFilterContainer ? yellowFilterContainer.querySelector('p.filter-description') : null;

    // 始终保持黄色内容过滤器开启并禁用
    if (yellowFilterToggle) {
        yellowFilterToggle.checked = true;
        yellowFilterToggle.disabled = true;
        localStorage.setItem('yellowFilterEnabled', 'true');

        if (yellowFilterContainer) {
            yellowFilterContainer.classList.add('filter-disabled');
        }

        if (filterDescription) {
            filterDescription.innerHTML = '<strong class="text-green-400">已强制启用敏感内容过滤</strong>';
        }
    }
    // 确保 selectedAPIs 反映当前页面上被勾选的复选框
    updateSelectedAPIs(); // 确保 selectedAPIs 同步最新的选择状态
}

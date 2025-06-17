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
// 设置为 true 则在任何情况下都不显示内置的成人API选项
// 根据您的新要求：我们希望所有接口都显示，因此设置为 false。
const HIDE_BUILTIN_ADULT_APIS = false; 

// 模拟 API_SITES 和 PLAYER_CONFIG。您需要根据实际情况填充。
// 如果您的项目中已经定义了这些变量，请删除这里的定义，避免重复！
// 确保 API_SITES 中包含您所有的 20 个内置 API，且 adult 属性统一设置为 false。
const API_SITES = {
    "api1": { name: "资源站一", url: "https://api.example.com/api1/", adult: false },
    "api2": { name: "资源站二", url: "https://api.example.com/api2/", adult: false },
    "api3": { name: "资源站三", url: "https://api.example.com/api3/", adult: false },
    "api4": { name: "资源站四", url: "https://api.example.com/api4/", adult: false },
    "api5": { name: "资源站五", url: "https://api.example.com/api5/", adult: false },
    "api6": { name: "资源站六", url: "https://api.example.com/api6/", adult: false },
    "api7": { name: "资源站七", url: "https://api.example.com/api7/", adult: false },
    "api8": { name: "资源站八", url: "https://api.example.com/api8/", adult: false },
    "api9": { name: "资源站九", url: "https://api.example.com/api9/", adult: false },
    "api10": { name: "资源站十", url: "https://api.example.com/api10/", adult: false },
    "api11": { name: "资源站十一", url: "https://api.example.com/api11/", adult: false },
    "api12": { name: "资源站十二", url: "https://api.example.com/api12/", adult: false },
    "api13": { name: "资源站十三", url: "https://api.example.com/api13/", adult: false },
    "api14": { name: "资源站十四", url: "https://api.example.com/api14/", adult: false },
    "api15": { name: "资源站十五", url: "https://api.example.com/api15/", adult: false },
    "api16": { name: "资源站十六", url: "https://api.example.com/api16/", adult: false },
    "api17": { name: "资源站十七", url: "https://api.example.com/api17/", adult: false },
    "api18": { name: "资源站十八", url: "https://api.example.com/api18/", adult: false },
    "api19": { name: "资源站十九", url: "https://api.example.com/api19/", adult: false },
    "api20": { name: "资源站二十", url: "https://api.example.com/api20/", adult: false }
};


const PLAYER_CONFIG = {
    adFilteringStorage: 'adFilteringEnabled'
};


// 页面初始化
document.addEventListener('DOMContentLoaded', function () {
    // 设置默认API选择（如果是第一次加载或需要重置）
    if (!localStorage.getItem('hasInitializedDefaults') || selectedAPIs.length === 0) {
        // 默认选中所有内置资源（现在 HIDE_BUILTIN_ADULT_APIS 为 false，且 API_SITES 中的 adult 都为 false，所以会选中所有）
        selectedAPIs = Object.keys(API_SITES); // 选中所有API
        
        // 默认选中所有自定义资源
        customAPIs.forEach((api, index) => {
            selectedAPIs.push('custom_' + index);
        });

        // 去重并保存
        selectedAPIs = [...new Set(selectedAPIs)];
        localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));

        // 默认选中过滤开关 (黄色内容过滤默认开启)
        localStorage.setItem('yellowFilterEnabled', 'true');
        localStorage.setItem(PLAYER_CONFIG.adFilteringStorage, 'true');

        // 默认启用豆瓣功能 (如果存在，假设有相关函数)
        localStorage.setItem('doubanEnabled', 'true');

        // 标记已初始化默认值
        localStorage.setItem('hasInitializedDefaults', 'true');
    }

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

// 初始化API复选框
function initAPICheckboxes() {
    const container = document.getElementById('apiCheckboxes');
    container.innerHTML = '';

    // 添加普通API组标题
    const normaldiv = document.createElement('div');
    normaldiv.id = 'normaldiv';
    normaldiv.className = 'grid grid-cols-2 gap-2';
    const normalTitle = document.createElement('div');
    normalTitle.className = 'api-group-title';
    normalTitle.textContent = '普通资源';
    normaldiv.appendChild(normalTitle);

    // 创建普通API源的复选框
    Object.keys(API_SITES).forEach(apiKey => {
        const api = API_SITES[apiKey];
        // 根据新要求：不跳过任何API的渲染
        // if (HIDE_BUILTIN_ADULT_APIS && api.adult) return; // 移除此行，确保所有API都被渲染

        const checked = selectedAPIs.includes(apiKey); // 检查是否已选中

        const checkbox = document.createElement('div');
        checkbox.className = 'flex items-center';
        checkbox.innerHTML = `
            <input type="checkbox" id="api_${apiKey}" 
                           class="form-checkbox h-3 w-3 text-blue-600 bg-[#222] border border-[#333] ${api.adult ? 'api-adult' : ''}" 
                           <span class="math-inline">\{checked ? 'checked' \: ''\} 
data\-api\="</span>{apiKey}">
            <label for="api_${apiKey}" class="ml-1 text-xs text-gray-400 truncate">${api.name}</label>
        `;
        normaldiv.appendChild(checkbox);

        // 添加事件监听器
        checkbox.querySelector('input').addEventListener('change', function () {
            updateSelectedAPIs();
            // checkAdultAPIsSelected(); // 不再需要，因为成人API已被强制隐藏/禁用
        });
    });
    container.appendChild(normaldiv);

    // 不再添加单独的成人API列表部分，因为所有API都将通过上方渲染
    // addAdultAPI(); // 移除此调用
    
    // 初始检查成人内容状态 (这部分现在更多是确保如果localStorage有旧数据也能被过滤掉)
    checkAdultAPIsSelected();
}

// 移除或修改 addAdultAPI 函数，使其不再添加任何内容
function addAdultAPI() {
    // 确保移除可能存在的 adultdiv
    const existingAdultDiv = document.getElementById('adultdiv');
    if (existingAdultDiv) {
        existingAdultDiv.remove();
    }
    // 根据新要求，此函数不再添加任何API列表
}

// 检查是否有成人API被选中 (此函数现在主要是为了确保即使有旧的成人API选中也能触发强制过滤)
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

    // 根据新要求：selectedAPIs 不再因为 adult 属性而移除接口
    // 我们信任后续的搜索过滤逻辑来处理敏感内容
    // 这意味着 selectedAPIs 应该包含所有被选中的接口，无论其潜在内容
    // 确保 selectedAPIs 反映当前页面上被勾选的复选框
    updateSelectedAPIs(); // 确保 selectedAPIs 同步最新的选择状态
}


// 渲染自定义API列表
function renderCustomAPIsList() {
    const container = document.getElementById('customApisList');
    if (!container) return;

    if (customAPIs.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-500 text-center my-2">未添加自定义API</p>';
        return;
    }

    container.innerHTML = '';
    customAPIs.forEach((api, index) => {
        const apiItem = document.createElement('div');
        apiItem.className = 'flex items-center justify-between p-1 mb-1 bg-[#222] rounded';
        const textColorClass = api.isAdult ? 'text-pink-400' : 'text-white';
        const adultTag = api.isAdult ? '<span class="text-xs text-pink-400 mr-1">(18+)</span>' : '';
        // 新增 detail 地址显示
        const detailLine = api.detail ? `<div class="text-xs text-gray-400 truncate">detail: ${api.detail}</div>` : '';

        // 根据新要求：自定义API也应该显示，且可被勾选
        // const isDisabled = api.isAdult && HIDE_BUILTIN_ADULT_APIS; // 移除此行，不再禁用成人自定义API的勾选框
        const isDisabled = false; // 始终不禁用，因为我们希望显示所有接口

        apiItem.innerHTML = `
            <div class="flex items-center flex-1 min-w-0">
                <input type="checkbox" id="custom_api_${index}" 
                               class="form-checkbox h-3 w-3 text-blue-600 mr-1 ${api.isAdult ? 'api-adult' : ''}" 
                               <span class="math-inline">\{selectedAPIs\.includes\('custom\_' \+ index\) ? 'checked' \: ''\} 
data\-custom\-index\="</span>{index}"
                               ${isDisabled ? 'disabled' : ''}>
                <div class="flex-1 min-w-0">
                    <div class="text-xs font-medium ${textColorClass} truncate">
                        <span class="math-inline">\{adultTag\}</span>{api.name}
                    </div>
                    <div class="text-xs text-gray-500 truncate">${api.url}</div>
                    <span class="math-inline">\{detailLine\}
</div\>
</div\>
<div class\="flex items\-center"\>
<button class\="text\-blue\-500 hover\:text\-blue\-700 text\-xs px\-1" onclick\="editCustomApi\(</span>{index})">✎</button>
                <button class="text-red-500 hover:text-red-700 text-xs px-1" onclick="removeCustomApi(${index})">✕</button>
            </div>
        `;
        container.appendChild(apiItem);
        apiItem.querySelector('input').addEventListener('change', function () {
            updateSelectedAPIs();
            // checkAdultAPIsSelected(); // 不再需要
        });
    });
}

// 编辑自定义API
function editCustomApi(index) {
    if (index < 0 || index >= customAPIs.length) return;
    const api = customAPIs[index];
    document.getElementById('customApiName').value = api.name;
    document.getElementById('customApiUrl').value = api.url;
    document.getElementById('customApiDetail').value = api.detail || '';
    const isAdultInput = document.getElementById('customApiIsAdult');
    if (isAdultInput) {
        isAdultInput.checked = api.isAdult || false;
        // 根据新要求：不禁用isAdult复选框
        isAdultInput.disabled = false; 
    }
    const form = document.getElementById('addCustomApiForm');
    if (form) {
        form.classList.remove('hidden');
        const buttonContainer = form.querySelector('div:last-child');
        buttonContainer.innerHTML = `
            <button onclick="updateCustomApi(${index})" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">更新</button>
            <button onclick="cancelEditCustomApi()" class="bg-[#444] hover:bg-[#555] text-white px-3 py-1 rounded text-xs">取消</button>
        `;
    }
}

// 更新自定义API
function updateCustomApi(index) {
    if (index < 0 || index >= customAPIs.length) return;
    const nameInput = document.getElementById('customApiName');
    const urlInput = document.getElementById('customApiUrl');
    const detailInput = document.getElementById('customApiDetail');
    const isAdultInput = document.getElementById('customApiIsAdult');
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();
    const detail = detailInput ? detailInput.value.trim() : '';
    // 根据新要求：不强制isAdult为false
    const isAdult = isAdultInput ? isAdultInput.checked : false;

    if (!name || !url) {
        showToast('请输入API名称和链接', 'warning');
        return;
    }
    if (!/^https?:\/\/.+/.test(url)) {
        showToast('API链接格式不正确，需以http://或https://开头', 'warning');
        return;
    }
    if (url.endsWith('/')) url = url.slice(0, -1);
    // 保存 detail 字段
    customAPIs[index] = { name, url, detail, isAdult };
    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));
    renderCustomAPIsList();
    updateSelectedAPIs(); // 重新更新选中API列表
    restoreAddCustomApiButtons();
    nameInput.value = '';
    urlInput.value = '';
    if (detailInput) detailInput.value = '';
    if (isAdultInput) isAdultInput.checked = false;
    document.getElementById('addCustomApiForm').classList.add('hidden');
    showToast('已更新自定义API: ' + name, 'success');
}

// 取消编辑自定义API
function cancelEditCustomApi() {
    // 清空表单
    document.getElementById('customApiName').value = '';
    document.getElementById('customApiUrl').value = '';
    document.getElementById('customApiDetail').value = '';
    const isAdultInput = document.getElementById('customApiIsAdult');
    if (isAdultInput) {
        isAdultInput.checked = false;
        isAdultInput.disabled = false; // 恢复禁用状态
    }

    // 隐藏表单
    document.getElementById('addCustomApiForm').classList.add('hidden');

    // 恢复添加按钮
    restoreAddCustomApiButtons();
}

// 恢复自定义API添加按钮
function restoreAddCustomApiButtons() {
    const form = document.getElementById('addCustomApiForm');
    const buttonContainer = form.querySelector('div:last-child');
    buttonContainer.innerHTML = `
        <button onclick="addCustomApi()" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">添加</button>
        <button onclick="cancelAddCustomApi()" class="bg-[#444] hover:bg-[#555] text-white px-3 py-1 rounded text-xs">取消</button>
    `;
    // 根据新要求：isAdult复选框始终可用
    const isAdultInput = document.getElementById('customApiIsAdult');
    if (isAdultInput) {
        isAdultInput.disabled = false;
    }
}

// 更新选中的API列表
function updateSelectedAPIs() {
    // 获取所有内置API复选框
    const builtInApiCheckboxes = document.querySelectorAll('#apiCheckboxes input[type="checkbox"]');

    // 获取选中的内置API，不再过滤成人API
    const builtInApis = Array.from(builtInApiCheckboxes)
        .filter(input => input.checked) // 只获取选中的
        .map(input => input.dataset.api);

    // 获取所有自定义API复选框
    const customApiCheckboxes = document.querySelectorAll('#customApisList input[type="checkbox"]');
    // 获取选中的自定义API，不再过滤成人API
    const customApiIndices = Array.from(customApiCheckboxes)
        .filter(input => input.checked) // 只获取选中的
        .map(input => 'custom_' + input.dataset.customIndex);

    // 合并内置和自定义API
    selectedAPIs = [...builtInApis, ...customApiIndices];

    // 保存到localStorage
    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));

    // 更新显示选中的API数量
    updateSelectedApiCount();
}

// 更新选中的API数量显示
function updateSelectedApiCount() {
    const countEl = document.getElementById('selectedApiCount');
    if (countEl) {
        countEl.textContent = selectedAPIs.length;
    }
}

// 全选或取消全选API
function selectAllAPIs(selectAll = true) { // 移除 excludeAdult 参数，因为我们不再基于此隐藏/禁用复选框
    // 获取所有内置API复选框
    const builtInCheckboxes = document.querySelectorAll('#apiCheckboxes input[type="checkbox"]');
    // 获取所有自定义API复选框
    const customCheckboxes = document.querySelectorAll('#customApisList input[type="checkbox"]');

    // 合并所有复选框
    const allCheckboxes = [...builtInCheckboxes, ...customCheckboxes];

    allCheckboxes.forEach(checkbox => {
        // 根据新要求：所有复选框都应该可以被选中或取消选中，不再基于 adult 属性禁用
        checkbox.checked = selectAll;
        checkbox.disabled = false; // 确保所有复选框都启用
    });

    updateSelectedAPIs();
    // checkAdultAPIsSelected(); // 不再需要，敏感内容过滤是强制开启的
}


// 显示添加自定义API表单
function showAddCustomApiForm() {
    const form = document.getElementById('addCustomApiForm');
    if (form) {
        form.classList.remove('hidden');
        // 根据新要求：isAdult复选框始终可用
        const isAdultInput = document.getElementById('customApiIsAdult');
        if (isAdultInput) {
            isAdultInput.disabled = false;
        }
    }
}

// 取消添加自定义API - 修改函数来重用恢复按钮逻辑
function cancelAddCustomApi() {
    const form = document.getElementById('addCustomApiForm');
    if (form) {
        form.classList.add('hidden');
        document.getElementById('customApiName').value = '';
        document.getElementById('customApiUrl').value = '';
        document.getElementById('customApiDetail').value = '';
        const isAdultInput = document.getElementById('customApiIsAdult');
        if (isAdultInput) {
            isAdultInput.checked = false;
            isAdultInput.disabled = false; // 恢复禁用状态
        }

        // 确保按钮是添加按钮
        restoreAddCustomApiButtons();
    }
}

// 添加自定义API
function addCustomApi() {
    const nameInput = document.getElementById('customApiName');
    const urlInput = document.getElementById('customApiUrl');
    const detailInput = document.getElementById('customApiDetail');
    const isAdultInput = document.getElementById('customApiIsAdult');
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();
    const detail = detailInput ? detailInput.value.trim() : '';
    // 根据新要求：不强制isAdult为false
    const isAdult = isAdultInput ? isAdultInput.checked : false;

    if (!name || !url) {
        showToast('请输入API名称和链接', 'warning');
        return;
    }
    if (!/^https?:\/\/.+/.test(url)) {
        showToast('API链接格式不正确，需以http://或https://开头', 'warning');
        return;
    }
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    
    customAPIs.push({ name, url, detail, isAdult });
    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));
    
    // 默认选中新添加的API，无论是否成人
    const newApiIndex = customAPIs.length - 1;
    selectedAPIs.push('custom_' + newApiIndex);
    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));
    
    // 重新渲染自定义API列表
    renderCustomAPIsList();
    updateSelectedApiCount();
    // checkAdultAPIsSelected(); // 不再需要
    nameInput.value = '';
    urlInput.value = '';
    if (detailInput) detailInput.value = '';
    if (isAdultInput) isAdultInput.checked = false;
    document.getElementById('addCustomApiForm').classList.add('hidden');
    showToast('已添加自定义API: ' + name, 'success');
}

// 移除自定义API
function removeCustomApi(index) {
    if (index < 0 || index >= customAPIs.length) return;

    const apiName = customAPIs[index].name;

    // 从列表中移除API
    customAPIs.splice(index, 1);
    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));

    // 从选中列表中移除此API
    // 重新构建 selectedAPIs，跳过被删除的自定义API，并修正后续索引
    let newSelectedAPIs = [];
    selectedAPIs.forEach(id => {
        if (id.startsWith('custom_')) {
            const currentIndex = parseInt(id.replace('custom_', ''));
            if (currentIndex === index) {
                // 跳过被删除的API
            } else if (currentIndex > index) {
                // 修正索引
                newSelectedAPIs.push('custom_' + (currentIndex - 1));
            } else {
                newSelectedAPIs.push(id);
            }
        } else {
            newSelectedAPIs.push(id);
        }
    });
    selectedAPIs = newSelectedAPIs;

    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));

    // 重新渲染自定义API列表
    renderCustomAPIsList();

    // 更新选中的API数量
    updateSelectedApiCount();

    // checkAdultAPIsSelected(); // 不再需要

    showToast('已移除自定义API: ' + apiName, 'info');
}

function toggleSettings(e) {
    const settingsPanel = document.getElementById('settingsPanel');
    if (!settingsPanel) return;

    // 检查是否有管理员密码
    const hasAdminPassword = window.__ENV__?.ADMINPASSWORD &&
                               window.__ENV__.ADMINPASSWORD.length === 64 &&
                               !/^0+$/.test(window.__ENV__.ADMINPASSWORD);

    if (settingsPanel.classList.contains('show')) {
        settingsPanel.classList.remove('show');
    } else {
        // 只有设置了管理员密码且未验证时才拦截
        if (hasAdminPassword && typeof isAdminVerified === 'function' && !isAdminVerified()) {
            e.preventDefault();
            e.stopPropagation();
            typeof showAdminPasswordModal === 'function' && showAdminPasswordModal();
            return;
        }
        settingsPanel.classList.add('show');
    }

    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 回车搜索
    document.getElementById('searchInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            search();
        }
    });

    // 点击外部关闭设置面板和历史记录面板
    document.addEventListener('click', function (e) {
        // 关闭设置面板
        const settingsPanel = document.querySelector('#settingsPanel.show');
        const settingsButton = document.querySelector('#settingsPanel .close-btn');

        if (settingsPanel && settingsButton &&
            !settingsPanel.contains(e.target) &&
            !settingsButton.contains(e.target)) {
            settingsPanel.classList.remove('show');
        }

        // 关闭历史记录面板
        const historyPanel = document.querySelector('#historyPanel.show');
        const historyButton = document.querySelector('#historyPanel .close-btn');

        if (historyPanel && historyButton &&
            !historyPanel.contains(e.target) &&
            !historyButton

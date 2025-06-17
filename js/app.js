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
const HIDE_BUILTIN_ADULT_APIS = true; // 默认隐藏内置成人API

// 模拟 API_SITES 和 PLAYER_CONFIG。您需要根据实际情况填充。
// 如果您的项目中已经定义了这些变量，请删除这里的定义，避免重复！
// 请确保 API_SITES 中包含您所有的 20 个内置 API，并正确设置 adult 属性。
const API_SITES = {
    "tyyszy": { name: "天空影视", url: "https://api.tyys.live/api.php/provide/vod/from/tyyszy/", adult: false },
    "dyttzy": { name: "电影天堂", url: "https://api.tyys.live/api.php/provide/vod/from/dyttzy/", adult: false },
    "bfzy": { name: "暴风资源", url: "https://api.tyys.live/api.php/provide/vod/from/bfzy/", adult: false },
    "ruyi": { name: "如意资源", url: "https://api.tyys.live/api.php/provide/vod/from/ruyi/", adult: false },
    "qlyzy": { name: "奇乐源", url: "https://api.example.com/qlyzy/", adult: false },
    "lzm3u8": { name: "量子M3U8", url: "https://api.example.com/lzm3u8/", adult: false },
    "okzy": { name: "OK资源", url: "https://api.example.com/okzy/", adult: false },
    "kuaikan": { name: "快看", url: "https://api.example.com/kuaikan/", adult: false },
    "yinyue": { name: "音悦台", url: "https://api.example.com/yinyue/", adult: false },
    "lezhizy": { name: "乐至资源", url: "https://api.example.com/lezhizy/", adult: false },
    "ziyuanmao": { name: "资源猫", url: "https://api.example.com/ziyuanmao/", adult: false },
    "ddzy": { name: "多多资源", url: "https://api.example.com/ddzy/", adult: false },
    "feifan": { name: "非凡", url: "https://api.example.com/feifan/", adult: false },
    "yongjiu": { name: "永久资源", url: "https://api.example.com/yongjiu/", adult: false },
    "hongniu": { name: "红牛资源", url: "https://api.example.com/hongniu/", adult: false },
    "bajie": { name: "八戒资源", url: "https://api.example.com/bajie/", adult: false },
    "subo": { name: "速播资源", url: "https://api.example.com/subo/", adult: false },
    "jisu": { name: "极速资源", url: "https://api.example.com/jisu/", adult: false },
    "chengzi": { name: "橙子资源", url: "https://api.example.com/chengzi/", adult: false },
    // 假设这是第20个非成人API
    "gaoqing": { name: "高清资源", url: "https://api.example.com/gaoqing/", adult: false },
    // 示例成人API，这些将不会被默认选中或显示，即使在 API_SITES 中存在
    "adultzy1": { name: "成人资源站1", url: "https://api.example.com/adult1/", adult: true },
    "adultzy2": { name: "成人资源站2", url: "https://api.example.com/adult2/", adult: true }
};


const PLAYER_CONFIG = {
    adFilteringStorage: 'adFilteringEnabled'
};


// 页面初始化
document.addEventListener('DOMContentLoaded', function () {
    // 设置默认API选择（如果是第一次加载或需要重置）
    // 检查是否有自定义的 selectedAPIs 存储，如果没有或需要强制默认，则重置
    if (!localStorage.getItem('hasInitializedDefaults') || selectedAPIs.length === 0) {
        // 默认选中所有非成人内置资源
        selectedAPIs = Object.keys(API_SITES).filter(apiKey => !API_SITES[apiKey].adult);
        
        // 默认选中所有非成人自定义资源
        customAPIs.forEach((api, index) => {
            if (!api.isAdult) {
                selectedAPIs.push('custom_' + index);
            }
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
        // 只有当 HIDE_BUILTIN_ADULT_APIS 为 false 时才显示成人API，否则跳过成人API
        if (HIDE_BUILTIN_ADULT_APIS && api.adult) return;

        const checked = selectedAPIs.includes(apiKey);

        const checkbox = document.createElement('div');
        checkbox.className = 'flex items-center';
        checkbox.innerHTML = `
            <input type="checkbox" id="api_${apiKey}" 
                           class="form-checkbox h-3 w-3 text-blue-600 bg-[#222] border border-[#333] ${api.adult ? 'api-adult' : ''}" 
                           ${checked ? 'checked' : ''} 
                           data-api="${apiKey}"
                           ${HIDE_BUILTIN_ADULT_APIS && api.adult ? 'disabled' : ''}>
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

    // 根据 HIDE_BUILTIN_ADULT_APIS 决定是否添加成人API列表
    // 在此版本中，addAdultAPI 应该永远不会被调用或显示任何内容
    if (!HIDE_BUILTIN_ADULT_APIS) {
        addAdultAPI();
    }
}

// 添加成人API列表 (此函数在 HIDE_BUILTIN_ADULT_APIS 为 true 时将不会被调用，也不会显示任何内容)
function addAdultAPI() {
    // 如果 HIDE_BUILTIN_ADULT_APIS 为 true，确保移除 adultdiv
    const existingAdultDiv = document.getElementById('adultdiv');
    if (existingAdultDiv) {
        existingAdultDiv.remove();
    }
    // 在此版本中，我们不应该添加任何成人API
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

    // 从 selectedAPIs 中移除所有成人API，无论它们最初是否被选中
    selectedAPIs = selectedAPIs.filter(apiId => {
        if (apiId.startsWith('custom_')) {
            const customIndex = apiId.replace('custom_', '');
            const customApi = getCustomApiInfo(customIndex);
            return customApi ? !customApi.isAdult : true; // 如果找不到API信息，则保留
        } else {
            const api = API_SITES[apiId];
            return api ? !api.adult : true; // 如果找不到API信息，则保留
        }
    });
    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));
    updateSelectedApiCount(); // 更新数量显示
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

        // 如果强制隐藏成人API，则自定义的成人API也应该禁用选择
        const isDisabled = api.isAdult && HIDE_BUILTIN_ADULT_APIS;

        apiItem.innerHTML = `
            <div class="flex items-center flex-1 min-w-0">
                <input type="checkbox" id="custom_api_${index}" 
                               class="form-checkbox h-3 w-3 text-blue-600 mr-1 ${api.isAdult ? 'api-adult' : ''}" 
                               ${selectedAPIs.includes('custom_' + index) && !isDisabled ? 'checked' : ''} 
                               data-custom-index="${index}"
                               ${isDisabled ? 'disabled' : ''}>
                <div class="flex-1 min-w-0">
                    <div class="text-xs font-medium ${textColorClass} truncate">
                        ${adultTag}${api.name}
                    </div>
                    <div class="text-xs text-gray-500 truncate">${api.url}</div>
                    ${detailLine}
                </div>
            </div>
            <div class="flex items-center">
                <button class="text-blue-500 hover:text-blue-700 text-xs px-1" onclick="editCustomApi(${index})">✎</button>
                <button class="text-red-500 hover:text-red-700 text-xs px-1" onclick="removeCustomApi(${index})">✕</button>
            </div>
        `;
        container.appendChild(apiItem);
        apiItem.querySelector('input').addEventListener('change', function () {
            updateSelectedAPIs();
            // checkAdultAPIsSelected(); // 不再需要，因为成人API已被强制隐藏/禁用
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
        // 如果强制隐藏成人API，则禁用isAdult复选框
        isAdultInput.disabled = HIDE_BUILTIN_ADULT_APIS;
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
    // 如果 HIDE_BUILTIN_ADULT_APIS 为 true，则强制 isAdult 为 false
    const isAdult = HIDE_BUILTIN_ADULT_APIS ? false : (isAdultInput ? isAdultInput.checked : false);

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
    checkAdultAPIsSelected(); // 重新检查以确保过滤逻辑正确
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
    // 确保isAdult复选框的禁用状态正确
    const isAdultInput = document.getElementById('customApiIsAdult');
    if (isAdultInput) {
        isAdultInput.disabled = HIDE_BUILTIN_ADULT_APIS;
    }
}

// 更新选中的API列表
function updateSelectedAPIs() {
    // 获取所有内置API复选框
    const builtInApiCheckboxes = document.querySelectorAll('#apiCheckboxes input[type="checkbox"]');

    // 获取选中的内置API，并过滤掉成人API
    const builtInApis = Array.from(builtInApiCheckboxes)
        .filter(input => {
            const api = API_SITES[input.dataset.api];
            return api ? !api.adult : true; // 确保非成人
        })
        .map(input => input.dataset.api);

    // 获取所有自定义API复选框
    const customApiCheckboxes = document.querySelectorAll('#customApisList input[type="checkbox"]');
    const customApiIndices = Array.from(customApiCheckboxes)
        .filter(input => {
            const customIndex = input.dataset.customIndex;
            const customApi = getCustomApiInfo(customIndex);
            return customApi ? !customApi.isAdult : true; // 确保非成人
        })
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
function selectAllAPIs(selectAll = true, excludeAdult = false) {
    // 获取所有内置API复选框
    const builtInCheckboxes = document.querySelectorAll('#apiCheckboxes input[type="checkbox"]');
    // 获取所有自定义API复选框
    const customCheckboxes = document.querySelectorAll('#customApisList input[type="checkbox"]');

    // 合并所有复选框
    const allCheckboxes = [...builtInCheckboxes, ...customCheckboxes];

    allCheckboxes.forEach(checkbox => {
        // 对于内置API，检查是否是成人API
        const isBuiltInAdult = checkbox.classList.contains('api-adult') && checkbox.closest('#apiCheckboxes');
        // 对于自定义API，检查其data-custom-index，然后从customAPIs中查找其isAdult属性
        const customIndex = checkbox.dataset.customIndex;
        let isCustomAdult = false;
        if (customIndex !== undefined) { // 确保是自定义API的复选框
            const apiInfo = getCustomApiInfo(customIndex);
            if (apiInfo) {
                isCustomAdult = apiInfo.isAdult;
            }
        }

        // 统一处理逻辑：如果排除了成人内容，或者 HIDE_BUILTIN_ADULT_APIS 为 true 且是成人API，则强制取消选中并禁用
        if (excludeAdult && (isBuiltInAdult || isCustomAdult) || (HIDE_BUILTIN_ADULT_APIS && (isBuiltInAdult || isCustomAdult))) {
            checkbox.checked = false;
            checkbox.disabled = true; // 禁用成人API的选择框
        } else {
            // 否则根据selectAll参数设置选中状态，并确保非成人API是可用的
            checkbox.checked = selectAll;
            checkbox.disabled = false;
        }
    });

    updateSelectedAPIs();
    checkAdultAPIsSelected(); // 重新运行以确保黄色过滤器状态正确
}


// 显示添加自定义API表单
function showAddCustomApiForm() {
    const form = document.getElementById('addCustomApiForm');
    if (form) {
        form.classList.remove('hidden');
        // 确保isAdult复选框的禁用状态正确
        const isAdultInput = document.getElementById('customApiIsAdult');
        if (isAdultInput) {
            isAdultInput.disabled = HIDE_BUILTIN_ADULT_APIS;
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
    // 如果 HIDE_BUILTIN_ADULT_APIS 为 true，则强制 isAdult 为 false
    const isAdult = HIDE_BUILTIN_ADULT_APIS ? false : (isAdultInput ? isAdultInput.checked : false);

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
    
    // 如果是非成人API，则默认选中
    if (!isAdult) {
        const newApiIndex = customAPIs.length - 1;
        selectedAPIs.push('custom_' + newApiIndex);
        localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));
    }

    // 重新渲染自定义API列表
    renderCustomAPIsList();
    updateSelectedApiCount();
    checkAdultAPIsSelected(); // 重新检查以确保过滤逻辑正确
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

    // 重新检查成人API选中状态 (这可能不再需要严格调用，因为成人API已被强制隐藏/禁用)
    checkAdultAPIsSelected();

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
            !historyButton.contains(e.target)) {
            historyPanel.classList.remove('show');
        }
    });

    // 黄色内容过滤开关事件绑定 (此处开关将被禁用，但保留监听器以防万一)
    const yellowFilterToggle = document.getElementById('yellowFilterToggle');
    if (yellowFilterToggle) {
        yellowFilterToggle.addEventListener('change', function (e) {
            // 无论用户怎么操作，都强制为 true
            e.target.checked = true;
            localStorage.setItem('yellowFilterEnabled', 'true');

            // 这里的逻辑在 HIDE_BUILTIN_ADULT_APIS 为 true 时将不再主要通过开关控制
            const adultdiv = document.getElementById('adultdiv');
            if (adultdiv) {
                adultdiv.style.display = 'none'; // 始终隐藏
            }
        });
    }

    // 广告过滤开关事件绑定
    const adFilterToggle = document.getElementById('adFilterToggle');
    if (adFilterToggle) {
        adFilterToggle.addEventListener('change', function (e) {
            localStorage.setItem(PLAYER_CONFIG.adFilteringStorage, e.target.checked);
        });
    }
}

// 重置搜索区域
function resetSearchArea() {
    // 清理搜索结果
    document.getElementById('results').innerHTML = '';
    document.getElementById('searchInput').value = '';

    // 恢复搜索区域的样式
    document.getElementById('searchArea').classList.add('flex-1');
    document.getElementById('searchArea').classList.remove('mb-8');
    document.getElementById('resultsArea').classList.add('hidden');

    // 确保页脚正确显示，移除相对定位
    const footer = document.querySelector('.footer');
    if (footer) {
        footer.style.position = '';
    }

    // 如果有豆瓣功能，检查是否需要显示豆瓣推荐区域
    if (typeof updateDoubanVisibility === 'function') {
        updateDoubanVisibility();
    }

    // 重置URL为主页
    try {
        window.history.pushState(
            {},
            `LibreTV - 免费在线视频搜索与观看平台`,
            `/`
        );
        // 更新页面标题
        document.title = `LibreTV - 免费在线视频搜索与观看平台`;
    } catch (e) {
        console.error('更新浏览器历史失败:', e);
    }
}

// 获取自定义API信息
function getCustomApiInfo(customApiIndex) {
    const index = parseInt(customApiIndex);
    if (isNaN(index) || index < 0 || index >= customAPIs.length) {
        return null;
    }
    return customAPIs[index];
}

// 搜索功能 - 修改为支持多选API和多页结果
async function search() {
    // 密码保护校验
    if (typeof window.isPasswordProtected === 'function' && typeof window.isPasswordVerified === 'function') {
        if (window.isPasswordProtected() && !window.isPasswordVerified()) {
            typeof showPasswordModal === 'function' && showPasswordModal();
            return;
        }
    }
    const query = document.getElementById('searchInput').value.trim();

    if (!query) {
        showToast('请输入搜索内容', 'info');
        return;
    }

    // 重新获取 selectedAPIs 确保是最新的非成人API列表
    updateSelectedAPIs();
    if (selectedAPIs.length === 0) {
        showToast('当前没有可用的API源（所有成人API已被屏蔽），请检查配置。', 'warning');
        return;
    }

    showLoading();

    try {
        // 保存搜索历史
        typeof saveSearchHistory === 'function' && saveSearchHistory(query);

        // 从所有选中的API源搜索
        let allResults = [];
        const searchPromises = selectedAPIs.map(apiId =>
            searchByAPIAndKeyWord(apiId, query)
        );

        // 等待所有搜索请求完成
        const resultsArray = await Promise.all(searchPromises);

        // 合并所有结果
        resultsArray.forEach(results => {
            if (Array.isArray(results) && results.length > 0) {
                allResults = allResults.concat(results);
            }
        });

        // 更新搜索结果计数
        const searchResultsCount = document.getElementById('searchResultsCount');
        if (searchResultsCount) {
            searchResultsCount.textContent = allResults.length;
        }

        // 显示结果区域，调整搜索区域
        document.getElementById('searchArea').classList.remove('flex-1');
        document.getElementById('searchArea').classList.add('mb-8');
        document.getElementById('resultsArea').classList.remove('hidden');

        // 隐藏豆瓣推荐区域（如果存在）
        const doubanArea = document.getElementById('doubanArea');
        if (doubanArea) {
            doubanArea.classList.add('hidden');
        }

        const resultsDiv = document.getElementById('results');

        // 如果没有结果
        if (!allResults || allResults.length === 0) {
            resultsDiv.innerHTML = `
                <div class="col-span-full text-center py-16">
                    <svg class="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 class="mt-2 text-lg font-medium text-gray-400">没有找到匹配的结果</h3>
                    <p class="mt-1 text-sm text-gray-500">请尝试其他关键词或更换数据源</p>
                </div>
            `;
            hideLoading();
            return;
        }

        // 有搜索结果时，才更新URL
        try {
            // 使用URI编码确保特殊字符能够正确显示
            const encodedQuery = encodeURIComponent(query);
            // 使用HTML5 History API更新URL，不刷新页面
            window.history.pushState(
                { search: query },
                `搜索: ${query} - LibreTV`,
                `/s=${encodedQuery}`
            );
            // 更新页面标题
            document.title = `搜索: ${query} - LibreTV`;
        } catch (e) {
            console.error('更新浏览器历史失败:', e);
            // 如果更新URL失败，继续执行搜索
        }

        // 处理搜索结果过滤：如果启用了黄色内容过滤，则过滤掉分类含有敏感内容的项目
        // 这里 yellowFilterEnabled 已经被强制设置为 true
        const yellowFilterEnabled = true; // 强制开启敏感内容过滤
        if (yellowFilterEnabled) {
            const banned = ['伦理片', '福利', '里番动漫', '门事件', '萝莉少女', '制服诱惑', '国产传媒', 'cosplay', '黑丝诱惑', '无码', '日本无码', '有码', '日本有码', 'SWAG', '网红主播', '色情片', '同性片', '福利视频', '福利片'];
            allResults = allResults.filter(item => {
                const typeName = item.type_name || '';
                const sourceCode = item.source_code;

                // 判断来源本身是否是成人API
                let isSourceAdult = false;
                if (sourceCode.startsWith('custom_')) {
                    const customApi = getCustomApiInfo(sourceCode.replace('custom_', ''));
                    if (customApi) {
                        isSourceAdult = customApi.isAdult;
                    }
                } else {
                    const builtinApi = API_SITES[sourceCode];
                    if (builtinApi) {
                        isSourceAdult = builtinApi.adult;
                    }
                }
                
                // 如果是成人来源，或者分类名包含敏感关键词，则过滤掉
                if (isSourceAdult || banned.some(keyword => typeName.includes(keyword))) {
                    return false;
                }
                return true;
            });
        }

        // 添加XSS保护，使用textContent和属性转义
        const safeResults = allResults.map(item => {
            const safeId = item.vod_id ? item.vod_id.toString().replace(/[^\w-]/g, '') : '';
            const safeName = (item.vod_name || '').toString()
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
            const sourceInfo = item.source_name ?
                `<span class="bg-[#222] text-xs px-1.5 py-0.5 rounded-full">${item.source_name}</span>` : '';
            const sourceCode = item.source_code || '';

            // 添加API URL属性，用于详情获取
            const apiUrlAttr = item.api_url ?
                `data-api-url="${item.api_url.replace(/"/g, '&quot;')}"` : '';

            // 修改为水平卡片布局，图片在左侧，文本在右侧，并优化样式
            const hasCover = item.vod_pic && item.vod_pic.startsWith('http');

            return `
                <div class="card-hover bg-[#111] rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] h-full shadow-sm hover:shadow-md" 
                     onclick="showDetails('${safeId}','${safeName}','${sourceCode}')" ${apiUrlAttr}>
                    <div class="flex h-full">
                        ${hasCover ? `
                        <div class="relative flex-shrink-0 search-card-img-container">
                            <img src="${item.vod_pic}" alt="${safeName}" 
                                 class="h-full w-full object-cover transition-transform hover:scale-110" 
                                 onerror="this.onerror=null; this.src='https://via.placeholder.com/300x450?text=无封面'; this.classList.add('object-contain');" 
                                 loading="lazy">
                            <div class="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent"></div>
                        </div>` : ''}
                        
                        <div class="p-2 flex flex-col flex-grow">
                            <div class="flex-grow">
                                <h3 class="font-semibold mb-2 break-words line-clamp-2 ${hasCover ? '' : 'text-center'}" title="${safeName}">${safeName}</h3>
                                
                                <div class="flex flex-wrap ${hasCover ? '' : 'justify-center'} gap-1 mb-2">
                                    ${(item.type_name || '').toString().replace(/</g, '&lt;') ?
                                        `<span class="text-xs py-0.5 px-1.5 rounded bg-opacity-20 bg-blue-500 text-blue-300">
                                            ${(item.type_name || '').toString().replace(/</g, '&lt;')}
                                        </span>` : ''}
                                    ${(item.vod_year || '') ?
                                        `<span class="text-xs py-0.5 px-1.5 rounded bg-opacity-20 bg-purple-500 text-purple-300">
                                            ${item.vod_year}
                                        </span>` : ''}
                                </div>
                                <p class="text-gray-400 line-clamp-2 overflow-hidden ${hasCover ? '' : 'text-center'} mb-2">
                                    ${(item.vod_remarks || '暂无介绍').toString().replace(/</g, '&lt;')}
                                </p>
                            </div>
                            
                            <div class="flex justify-between items-center mt-1 pt-1 border-t border-gray-800">
                                ${sourceInfo ? `<div>${sourceInfo}</div>` : '<div></div>'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        resultsDiv.innerHTML = safeResults;
    } catch (error) {
        console.error('搜索错误:', error);
        if (error.name === 'AbortError') {
            showToast('搜索请求超时，请检查网络连接', 'error');
        } else {
            showToast('搜索请求失败，请稍后重试', 'error');
        }
    } finally {
        hideLoading();
    }
}

// 切换清空按钮的显示状态
function toggleClearButton() {
    const searchInput = document.getElementById('searchInput');
    const clearButton = document.getElementById('clearSearchInput');
    if (searchInput && clearButton) {
        if (searchInput.value !== '') {
            clearButton.classList.remove('hidden');
        } else {
            clearButton.classList.add('hidden');
        }
    }
}

// 清空搜索框内容
function clearSearchInput() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        const clearButton = document.getElementById('clearSearchInput');
        if (clearButton) {
            clearButton.classList.add('hidden');
        }
    }
}

// 劫持搜索框的value属性以检测外部修改
function hookInput() {
    const input = document.getElementById('searchInput');
    if (!input) return; // 确保元素存在

    const descriptor = Object.getOwnPropertyOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

    // 重写 value 属性的 getter 和 setter
    Object.defineProperty(input, 'value', {
        get: function () {
            // 确保读取时返回字符串（即使原始值为 undefined/null）
            const originalValue = descriptor.get.call(this);
            return originalValue != null ? String(originalValue) : '';
        },
        set: function (value) {
            // 显式将值转换为字符串后写入
            const strValue = String(value);
            descriptor.set.call(this, strValue);
            this.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });

    // 初始化输入框值为空字符串（避免初始值为 undefined）
    input.value = '';
}
document.addEventListener('DOMContentLoaded', hookInput);

// 显示详情 - 修改为支持自定义API
async function showDetails(id, vod_name, sourceCode) {
    // 密码保护校验
    if (typeof window.isPasswordProtected === 'function' && typeof window.isPasswordVerified === 'function') {
        if (window.isPasswordProtected() && !window.isPasswordVerified()) {
            typeof showPasswordModal === 'function' && showPasswordModal();
            return;
        }
    }
    if (!id) {
        showToast('视频ID无效', 'error');
        return;
    }

    showLoading();
    try {
        // 构建API参数
        let apiParams = '';

        // 处理自定义API源
        if (sourceCode.startsWith('custom_')) {
            const customIndex = sourceCode.replace('custom_', '');
            const customApi = getCustomApiInfo(customIndex);
            if (!customApi) {
                showToast('自定义API配置无效', 'error');
                hideLoading();
                return;
            }
            // 传递 detail url 用于详情获取
            apiParams = `id=${encodeURIComponent(id)}&url=${encodeURIComponent(customApi.url)}&detail=${encodeURIComponent(customApi.detail || '')}`;
        } else {
            // 处理内置API源
            const api = API_SITES[sourceCode];
            if (!api) {
                showToast('API源配置无效', 'error');
                hideLoading();
                return;
            }
            apiParams = `id=${encodeURIComponent(id)}&url=${encodeURIComponent(api.url)}`;
        }

        // 统一的详情获取逻辑
        const detailResponse = await fetch(`/api/detail?${apiParams}`);
        if (!detailResponse.ok) {
            throw new Error(`HTTP error! status: ${detailResponse.status}`);
        }
        const detailData = await detailResponse.json();

        if (detailData.code !== 1) {
            showToast(detailData.msg || '获取详情失败', 'error');
            hideLoading();
            return;
        }

        const video = detailData.data;

        // 强制敏感内容过滤 (即使在详情页也进行检查)
        const yellowFilterEnabled = true;
        if (yellowFilterEnabled) {
            const banned = ['伦理片', '福利', '里番动漫', '门事件', '萝莉少女', '制服诱惑', '国产传媒', 'cosplay', '黑丝诱惑', '无码', '日本无码', '有码', '日本有码', 'SWAG', '网红主播', '色情片', '同性片', '福利视频', '福利片'];
            const typeName = video.type_name || '';
            
            // 判断来源本身是否是成人API
            let isSourceAdult = false;
            if (sourceCode.startsWith('custom_')) {
                const customApi = getCustomApiInfo(sourceCode.replace('custom_', ''));
                if (customApi) {
                    isSourceAdult = customApi.isAdult;
                }
            } else {
                const builtinApi = API_SITES[sourceCode];
                if (builtinApi) {
                    isSourceAdult = builtinApi.adult;
                }
            }

            if (isSourceAdult || banned.some(keyword => typeName.includes(keyword))) {
                showToast('此内容包含敏感信息，已屏蔽。', 'error');
                resetSearchArea(); // 返回搜索页面
                hideLoading();
                return;
            }
        }

        currentVideoTitle = video.vod_name || '未知视频';
        currentEpisodes = []; // 清空之前的集数

        // 处理播放列表
        if (video.vod_play_url) {
            // 假设播放链接是按 ### 分割的不同播放源
            const playUrlsBySource = video.vod_play_url.split('$$$');
            playUrlsBySource.forEach(sourceStr => {
                const parts = sourceStr.split('$$');
                const sourceName = parts[0]; // 播放源名称
                const episodesStr = parts[1]; // 集数字符串

                if (episodesStr) {
                    const episodesForSource = episodesStr.split('#').map(episode => {
                        const episodeParts = episode.split('$');
                        return {
                            name: episodeParts[0],
                            url: episodeParts[1],
                            source: sourceCode, // 记录API来源
                            sourceName: sourceName || '默认源' // 记录播放源名称
                        };
                    });
                    currentEpisodes.push(...episodesForSource); // 合并所有播放源的集数
                }
            });
        }

        // 如果没有解析到任何集数
        if (currentEpisodes.length === 0) {
            showToast('未找到可播放的集数。', 'warning');
            resetSearchArea();
            hideLoading();
            return;
        }

        // 默认不倒序
        episodesReversed = false; 

        renderVideoDetails(video);
        renderEpisodeList(currentEpisodes);

        // 自动播放第一集，如果存在
        if (currentEpisodes.length > 0) {
            currentEpisodeIndex = 0;
            playEpisode(currentEpisodes[0].url, currentEpisodes[0].name, currentEpisodes[0].source, currentEpisodes[0].sourceName);
        }

        // 更新URL和页面标题
        try {
            const encodedTitle = encodeURIComponent(currentVideoTitle);
            const encodedSourceCode = encodeURIComponent(sourceCode);
            const encodedId = encodeURIComponent(id);
            window.history.pushState(
                { details: { id, vod_name, sourceCode } },
                `${currentVideoTitle} - LibreTV`,
                `/detail=${encodedId}&source=${encodedSourceCode}`
            );
            document.title = `${currentVideoTitle} - LibreTV`;
        } catch (e) {
            console.error('更新浏览器历史失败:', e);
        }

    } catch (error) {
        console.error('获取详情或渲染失败:', error);
        showToast('获取视频详情失败，请稍后重试。', 'error');
        resetSearchArea();
    } finally {
        hideLoading();
    }
}

// 渲染视频详情页面
function renderVideoDetails(video) {
    const detailsContainer = document.getElementById('detailsContainer');
    if (!detailsContainer) return;

    // 清空现有内容
    detailsContainer.innerHTML = '';

    // 显示详情页面，隐藏搜索结果和搜索区域
    document.getElementById('searchResultsContainer').classList.add('hidden');
    document.getElementById('searchArea').classList.add('hidden');
    document.getElementById('detailsArea').classList.remove('hidden');

    const genres = (video.vod_class || '').split(',').map(g => `<span class="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">${g.trim()}</span>`).join('');
    const actors = (video.vod_actor || '未知').split(',').map(a => a.trim()).filter(Boolean).join(' / ');
    const director = (video.vod_director || '未知').trim();
    const area = (video.vod_area || '未知').trim();
    const lang = (video.vod_lang || '未知').trim();
    const remarks = (video.vod_remarks || '无').trim();
    const year = (video.vod_year || '未知').trim();

    // 构建详情内容
    detailsContainer.innerHTML = `
        <div class="flex flex-col md:flex-row bg-[#111] rounded-lg shadow-lg overflow-hidden p-4">
            <div class="md:w-1/3 flex-shrink-0 mb-4 md:mb-0 md:mr-4">
                <img src="${video.vod_pic}" alt="${video.vod_name}" 
                     class="w-full h-auto rounded-lg object-cover" 
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/400x600?text=无封面'; this.classList.add('object-contain');">
            </div>
            <div class="md:w-2/3 flex flex-col justify-between">
                <div>
                    <h2 class="text-2xl font-bold mb-2">${video.vod_name}</h2>
                    <div class="flex flex-wrap gap-2 mb-4">
                        ${genres}
                    </div>
                    <p class="text-gray-400 text-sm mb-2"><strong>演员:</strong> ${actors}</p>
                    <p class="text-gray-400 text-sm mb-2"><strong>导演:</strong> ${director}</p>
                    <p class="text-gray-400 text-sm mb-2"><strong>地区:</strong> ${area} / <strong>语言:</strong> ${lang}</p>
                    <p class="text-gray-400 text-sm mb-2"><strong>上映年份:</strong> ${year}</p>
                    <p class="text-gray-400 text-sm mb-4"><strong>备注:</strong> ${remarks}</p>
                    <div class="vod-blurb text-gray-300 text-sm leading-relaxed mb-4 overflow-hidden" style="max-height: 150px; overflow-y: auto;">
                        <p>${(video.vod_content || '暂无详细介绍').replace(/\n/g, '<br>')}</p>
                    </div>
                </div>
                <div class="flex flex-col mt-4">
                    <h3 class="text-lg font-semibold mb-2">播放列表</h3>
                    <div id="episodeList" class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                        </div>
                    <div class="mt-2 text-right">
                        <button onclick="toggleEpisodeOrder()" class="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded">
                            ${episodesReversed ? '正序播放' : '倒序播放'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 重新渲染剧集列表以应用倒序状态
    renderEpisodeList(currentEpisodes);
}

// 渲染剧集列表
function renderEpisodeList(episodes) {
    const episodeListDiv = document.getElementById('episodeList');
    if (!episodeListDiv) return;

    episodeListDiv.innerHTML = '';
    
    // 根据倒序状态决定遍历顺序
    const displayEpisodes = episodesReversed ? [...episodes].reverse() : episodes;

    displayEpisodes.forEach((episode, index) => {
        // 找到它在 original currentEpisodes 数组中的真实索引
        const originalIndex = currentEpisodes.findIndex(e => e === episode); 
        const isActive = originalIndex === currentEpisodeIndex;
        const button = document.createElement('button');
        button.className = `episode-btn text-xs px-2 py-1 rounded w-full truncate ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`;
        button.textContent = episode.name;
        button.title = `${episode.name} (${episode.sourceName})`; // 提示源名称
        button.onclick = () => playEpisode(episode.url, episode.name, episode.source, episode.sourceName, originalIndex);
        episodeListDiv.appendChild(button);
    });

    // 更新倒序按钮的文本
    const toggleButton = detailsContainer.querySelector('.toggle-order-button');
    if (toggleButton) {
        toggleButton.textContent = episodesReversed ? '正序播放' : '倒序播放';
    }
}

// 播放剧集
function playEpisode(url, episodeName, sourceCode, sourceName, index) {
    // 密码保护校验
    if (typeof window.isPasswordProtected === 'function' && typeof window.isPasswordVerified === 'function') {
        if (window.isPasswordProtected() && !window.isPasswordVerified()) {
            typeof showPasswordModal === 'function' && showPasswordModal();
            return;
        }
    }

    if (!url) {
        showToast('播放链接无效', 'error');
        return;
    }

    // 更新当前播放集数索引
    if (index !== undefined) {
        currentEpisodeIndex = index;
    }

    const player = document.getElementById('videoPlayer');
    const playerContainer = document.getElementById('playerContainer');
    const playerTitle = document.getElementById('playerTitle');
    
    if (player && playerContainer && playerTitle) {
        playerContainer.classList.remove('hidden');
        playerTitle.textContent = `${currentVideoTitle} - ${episodeName} (${sourceName})`;

        player.src = url;
        player.load(); // 加载新源
        player.play().catch(e => {
            console.error('自动播放失败:', e);
            showToast('播放失败，请手动点击播放。', 'warning');
        });

        // 更新剧集列表的选中状态
        renderEpisodeList(currentEpisodes);

        // 调整播放器区域的可见性
        const detailsArea = document.getElementById('detailsArea');
        if (detailsArea) {
            detailsArea.classList.add('hidden'); // 隐藏详情区域
        }
        document.getElementById('resultsArea').classList.add('hidden'); // 隐藏搜索结果区域
        document.getElementById('searchArea').classList.add('hidden'); // 隐藏搜索区域
        document.getElementById('homeContainer').classList.add('hidden'); // 隐藏主页内容
    } else {
        showToast('播放器元素未找到。', 'error');
    }
}

// 切换播放列表倒序/正序
function toggleEpisodeOrder() {
    episodesReversed = !episodesReversed;
    renderEpisodeList(currentEpisodes); // 重新渲染剧集列表
}

// 播放下一集
function playNextEpisode() {
    let nextIndex;
    if (episodesReversed) {
        // 如果是倒序，下一集是当前集数的前一集
        const currentDisplayIndex = currentEpisodes.length - 1 - currentEpisodeIndex;
        if (currentDisplayIndex > 0) {
            nextIndex = currentEpisodes.length - 1 - (currentDisplayIndex - 1);
        } else {
            showToast('已经是第一集了。', 'info');
            return;
        }
    } else {
        // 如果是正序，下一集是当前集数的后一集
        if (currentEpisodeIndex < currentEpisodes.length - 1) {
            nextIndex = currentEpisodeIndex + 1;
        } else {
            showToast('已经是最后一集了。', 'info');
            return;
        }
    }

    const nextEpisode = currentEpisodes[nextIndex];
    if (nextEpisode) {
        playEpisode(nextEpisode.url, nextEpisode.name, nextEpisode.source, nextEpisode.sourceName, nextIndex);
    } else {
        showToast('没有下一集了。', 'info');
    }
}

// 播放上一集
function playPreviousEpisode() {
    let prevIndex;
    if (episodesReversed) {
        // 如果是倒序，上一集是当前集数的后一集
        const currentDisplayIndex = currentEpisodes.length - 1 - currentEpisodeIndex;
        if (currentDisplayIndex < currentEpisodes.length - 1) {
            prevIndex = currentEpisodes.length - 1 - (currentDisplayIndex + 1);
        } else {
            showToast('已经是最后一集了。', 'info');
            return;
        }
    } else {
        // 如果是正序，上一集是当前集数的前一集
        if (currentEpisodeIndex > 0) {
            prevIndex = currentEpisodeIndex - 1;
        } else {
            showToast('已经是第一集了。', 'info');
            return;
        }
    }

    const prevEpisode = currentEpisodes[prevIndex];
    if (prevEpisode) {
        playEpisode(prevEpisode.url, prevEpisode.name, prevEpisode.source, prevEpisode.sourceName, prevIndex);
    } else {
        showToast('没有上一集了。', 'info');
    }
}

// 关闭播放器并返回详情页
function closePlayer() {
    const player = document.getElementById('videoPlayer');
    const playerContainer = document.getElementById('playerContainer');
    if (player && playerContainer) {
        player.pause(); // 暂停播放
        player.src = ''; // 清空视频源
        playerContainer.classList.add('hidden'); // 隐藏播放器
    }

    // 重新显示详情区域（如果存在）
    const detailsArea = document.getElementById('detailsArea');
    if (detailsArea) {
        detailsArea.classList.remove('hidden');
    } else {
        // 如果详情区域不存在，则返回搜索结果或主页
        resetSearchArea(); // 重置到主页
    }
}

// Placeholder for other global functions (replace with your actual implementations)
// 您需要确保这些函数在您的实际项目中可用
function showToast(message, type) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        console.warn('Toast container not found.');
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} p-3 rounded-md shadow-lg text-white flex items-center justify-between transition-opacity duration-300 ease-out`;
    toast.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentNode.remove()" class="ml-4 text-white opacity-75 hover:opacity-100">&times;</button>
    `;
    
    // Add specific colors based on type
    if (type === 'success') {
        toast.style.backgroundColor = '#4CAF50';
    } else if (type === 'error') {
        toast.style.backgroundColor = '#F44336';
    } else if (type === 'warning') {
        toast.style.backgroundColor = '#FFC107';
    } else {
        toast.style.backgroundColor = '#333';
    }

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000); // 3 seconds
}

function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

function renderSearchHistory() {
    // Implement your search history rendering logic here
    console.log('Rendering search history...');
}

function saveSearchHistory(query) {
    // Implement your search history saving logic here
    console.log('Saving search history:', query);
}

function updateDoubanVisibility() {
    // Implement your Douban visibility update logic here
    console.log('Updating Douban visibility...');
}

// 模拟 searchByAPIAndKeyWord 函数，您需要替换为实际的后端请求
async function searchByAPIAndKeyWord(apiId, keyword) {
    console.log(`Searching API: ${apiId} for keyword: ${keyword}`);
    
    // 获取API信息
    let apiUrl = '';
    let apiName = '';
    let isAdultApi = false;

    if (apiId.startsWith('custom_')) {
        const customApi = getCustomApiInfo(apiId.replace('custom_', ''));
        if (customApi) {
            apiUrl = customApi.url;
            apiName = customApi.name;
            isAdultApi = customApi.isAdult;
        }
    } else {
        const api = API_SITES[apiId];
        if (api) {
            apiUrl = api.url;
            apiName = api.name;
            isAdultApi = api.adult;
        }
    }

    if (!apiUrl || isAdultApi) { // 如果API URL无效或被标记为成人API，则不进行搜索
        console.warn(`Skipping search for API: ${apiName || apiId} (Invalid URL or Adult API)`);
        return [];
    }

    // 模拟网络请求延迟
    await new Promise(resolve => setTimeout(resolve(500))); 

    // 模拟搜索结果
    const mockResults = [
        { vod_id: "1001", vod_name: `${keyword} 电影1 (来自 ${apiName})`, vod_pic: "", vod_remarks: "高清", type_name: "剧情片", vod_year: "2023", source_name: apiName, source_code: apiId, api_url: apiUrl },
        { vod_id: "1002", vod_name: `${keyword} 电视剧2 (来自 ${apiName})`, vod_pic: "", vod_remarks: "全集", type_name: "电视剧", vod_year: "2022", source_name: apiName, source_code: apiId, api_url: apiUrl },
        { vod_id: "1003", vod_name: `敏感内容电影 (来自 ${apiName})`, vod_pic: "", vod_remarks: "限制级", type_name: "伦理片", vod_year: "2024", source_name: apiName, source_code: apiId, api_url: apiUrl, isAdult: true }, // 模拟敏感内容
    ];

    // 返回过滤掉成人内容的模拟结果
    return mockResults.filter(item => !item.isAdult);
}

// 模拟管理员密码和鉴权函数
function isAdminVerified() {
    return localStorage.getItem('isAdminVerified') === 'true';
}

function showAdminPasswordModal() {
    const password = prompt("请输入管理员密码:");
    if (password === window.__ENV__.ADMINPASSWORD) { // 假设 window.__ENV__.ADMINPASSWORD 是您存储的哈希密码
        localStorage.setItem('isAdminVerified', 'true');
        showToast('管理员验证成功！', 'success');
        // 验证成功后重新打开设置面板
        toggleSettings();
    } else {
        showToast('管理员密码错误！', 'error');
    }
}

// 模拟密码保护相关函数 (如果您的应用有播放密码功能)
function isPasswordProtected() {
    // 假设您的播放密码逻辑在这里判断是否需要密码
    return false; // 默认不启用播放密码
}

function isPasswordVerified() {
    // 假设您的播放密码验证状态
    return true; // 默认已验证
}

function showPasswordModal() {
    // 弹出播放密码输入框的逻辑
    alert("请输入播放密码以继续。");
}

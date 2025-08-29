document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const stationsContainer = document.getElementById('stations-container');
    const addStationBtn = document.getElementById('add-station-btn');
    const addStationModal = document.getElementById('add-station-modal');
    const closeModalBtns = document.querySelectorAll('.close-btn');
    const confirmAddStationBtn = document.getElementById('confirm-add-station-btn');
    const pauseAllBtn = document.getElementById('pause-all-btn');
    const resumeAllBtn = document.getElementById('resume-all-btn');
    const endOfDayBtn = document.getElementById('end-of-day-btn');
    const stationNameInput = document.getElementById('station-name-input');
    const stationRateInput = document.getElementById('station-rate-input');
    const stationStartTimeInput = document.getElementById('station-start-time-input');
    const stationEndTimeInput = document.getElementById('station-end-time-input');
    const stationAlarmSound = document.getElementById('station-alarm-sound');
    const themeToggle = document.getElementById('theme-toggle');
    const productsList = document.getElementById('products-list');
    const sidebarProductSearch = document.getElementById('sidebar-product-search');
    const addProductBtn = document.getElementById('add-product-btn');
    const productNameInput = document.getElementById('product-name-input');
    const productPriceInput = document.getElementById('product-price-input');
    const productPurchasePriceInput = document.getElementById('product-purchase-price-input');
    const invoiceModal = document.getElementById('invoice-modal');
    const invoiceDetails = document.getElementById('invoice-details');
    const payCashBtn = document.getElementById('pay-cash-btn');
    const payCardBtn = document.getElementById('pay-card-btn');
    const payTransferBtn = document.getElementById('pay-transfer-btn');
    const reportBtn = document.getElementById('report-btn');
    const reportModal = document.getElementById('report-modal');
    const statsTodayRevenue = document.getElementById('stats-today-revenue');
    const statsTotalRevenue = document.getElementById('stats-total-revenue');
    const statsTotalTransactions = document.getElementById('stats-total-transactions');
    const statsTotalProfit = document.getElementById('stats-total-profit');
    const historyTableBody = document.getElementById('history-table-body');
    const filterStartDate = document.getElementById('filter-start-date');
    const filterEndDate = document.getElementById('filter-end-date');
    const historySearchInput = document.getElementById('history-search-input');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const deleteFilteredBtn = document.getElementById('delete-filtered-btn');
    const toggleChartBtn = document.getElementById('toggle-chart-btn');
    const deleteSelectedHistoryBtn = document.getElementById('delete-selected-history-btn');
    const historySelectAll = document.getElementById('history-select-all');
    const reportTableContainer = document.getElementById('report-table-container');
    const reportChartContainer = document.getElementById('report-chart-container');
    const manualEntryBtn = document.getElementById('manual-entry-btn');
    const manualEntryModal = document.getElementById('manual-entry-modal');
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const manualStationSelect = document.getElementById('manual-station-select');
    const manualStartTime = document.getElementById('manual-start-time');
    const manualEndTime = document.getElementById('manual-end-time');
    const manualPaymentMethod = document.getElementById('manual-payment-method');
    const confirmManualEntryBtn = document.getElementById('confirm-manual-entry-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const defaultRateInput = document.getElementById('default-rate-input');
    const alarmVolumeInput = document.getElementById('alarm-volume-input');
    const customAlarmUpload = document.getElementById('custom-alarm-upload');
    const groupColorList = document.getElementById('group-color-list');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const deleteAllHistoryBtn = document.getElementById('delete-all-history-btn');
    const backupBtn = document.getElementById('backup-btn');
    const restoreInput = document.getElementById('restore-input');
    const stationGroupSelect = document.getElementById('station-group-select');
    const newGroupNameInput = document.getElementById('new-group-name-input');
    const addNewGroupBtn = document.getElementById('add-new-group-btn');
    const stationFiltersContainer = document.getElementById('station-filters');
    const addProductsModal = document.getElementById('add-products-modal');
    const productSelectionList = document.getElementById('product-selection-list');
    const productSearchInput = document.getElementById('product-search-input');
    const confirmAddProductsBtn = document.getElementById('confirm-add-products-btn');


    // --- State ---
    let settings = {
        defaultRate: 20000,
        theme: 'light',
        accentColor: 'blue',
        alarmVolume: 0.8,
        useCustomAlarm: false,
        reportFilters: {
            startDate: '',
            endDate: '',
            searchTerm: ''
        }
    };
    let stations = [];
    let products = [];
    let history = [];
    let stationGroups = [{ name: 'عمومی', color: '#4dabf7'}]; // Default group
    let activeGroupFilter = 'all'; // 'all' or a group name
    let nextStationId = 1;
    let nextProductId = 1;
    let nextHistoryId = 1;
    let isFinalizing = false; // Guard to prevent double-firing transactions
    let reportChartInstance = null;

    // --- IndexedDB Helper for Custom Sound ---
    const dbHelper = {
        db: null,
        initDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open('GameNetDB', 1);
                request.onerror = (event) => reject('Error opening IndexedDB');
                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    resolve();
                };
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains('customSounds')) {
                        db.createObjectStore('customSounds', { keyPath: 'id' });
                    }
                };
            });
        },
        saveSound(buffer) {
            return new Promise((resolve, reject) => {
                if (!this.db) return reject('DB not initialized');
                const transaction = this.db.transaction(['customSounds'], 'readwrite');
                const store = transaction.objectStore('customSounds');
                const request = store.put({ id: 'customAlarm', sound: buffer });
                transaction.oncomplete = () => resolve();
                transaction.onerror = (event) => reject('Error saving sound');
            });
        },
        loadSound() {
            return new Promise((resolve, reject) => {
                if (!this.db) return reject('DB not initialized');
                const transaction = this.db.transaction(['customSounds'], 'readonly');
                const store = transaction.objectStore('customSounds');
                const request = store.get('customAlarm');
                request.onsuccess = (event) => {
                    if (event.target.result) {
                        resolve(event.target.result.sound);
                    } else {
                        resolve(null); // No sound found
                    }
                };
                request.onerror = (event) => reject('Error loading sound');
            });
        }
    };


    // --- Functions ---

    /**
     * Saves the current state (stations and products) to localStorage
     */
    function saveState() {
        // When saving, we don't want to save the interval ID.
        const stationsToSave = stations.map(s => {
            const { timerInterval, ...stationData } = s;
            return stationData;
        });
        localStorage.setItem('gameNetState', JSON.stringify({ settings, stations: stationsToSave, products, history, stationGroups, nextStationId, nextProductId, nextHistoryId }));
    }

    /**
     * Loads state from localStorage
     */
    function loadState() {
        const savedState = localStorage.getItem('gameNetState');
        if (savedState) {
            const state = JSON.parse(savedState);
            // Load settings, merging with defaults to ensure new settings aren't lost
            settings = { ...settings, ...(state.settings || {}) };

            // Safely update state arrays without breaking references
            stations.length = 0;
            Array.prototype.push.apply(stations, state.stations || []);

            products.length = 0;
            Array.prototype.push.apply(products, state.products || []);

            history.length = 0;
            Array.prototype.push.apply(history, state.history || []);

            stationGroups.length = 0;
            // Ensure loaded groups are in the correct object format, migrating old data if necessary
            const loadedGroups = state.stationGroups || [{ name: 'عمومی', color: '#4dabf7'}];
            loadedGroups.forEach(group => {
                if (typeof group === 'string') {
                    // This is old data, convert it
                    stationGroups.push({ name: group, color: '#4dabf7' });
                } else {
                    stationGroups.push(group);
                }
            });
            if (stationGroups.length === 0) {
                 stationGroups.push({ name: 'عمومی', color: '#4dabf7'});
            }

            nextStationId = state.nextStationId || 1;
            nextProductId = state.nextProductId || 1;
            nextHistoryId = state.nextHistoryId || 1;

            // The master timer loop will handle any stations that were running.
            // No need for any specific logic here anymore.
        }
    }

    /**
     * Applies the selected theme and accent color to the body element
     */
    function applyTheme() {
        document.body.dataset.theme = settings.theme;
        document.body.dataset.accent = settings.accentColor;

        // Show/hide accent color selector based on theme
        const accentSelector = document.getElementById('accent-color-selector');
        if (settings.theme === 'ultra-dark') {
            accentSelector.style.display = 'block';
        } else {
            accentSelector.style.display = 'none';
        }
    }

    /**
     * Shows a modal
     * @param {HTMLElement} modal
     */
    function showModal(modal) {
        modal.style.display = 'flex';
    }

    /**
     * Hides a modal
     * @param {HTMLElement} modal
     */
    function hideModal(modal) {
        modal.style.display = 'none';
    }

    /**
     * Renders all stations to the DOM, grouped by category.
     */
    function renderStations() {
        stationsContainer.innerHTML = '';
        const groupsToRender = activeGroupFilter === 'all'
            ? stationGroups
            : stationGroups.filter(g => g.name === activeGroupFilter);

        groupsToRender.forEach(groupObj => {
            const groupName = groupObj.name;
            const groupColor = groupObj.color || '#4dabf7';

            const stationsInGroup = stations.filter(s => s.group === groupName);
            // In filter mode, we might want to show the group header even if it's empty,
            // but for now, let's keep the existing behavior.
            if (stationsInGroup.length === 0 && activeGroupFilter !== 'all') {
                 stationsContainer.innerHTML = '<p class="no-stations-message">هیچ سیستمی در این گروه وجود ندارد.</p>';
                 return;
            }
            if (stationsInGroup.length === 0) return;


            const groupContainer = document.createElement('div');
            groupContainer.className = 'station-group';
            groupContainer.innerHTML = `<h2 class="group-title" style="border-bottom-color: ${groupColor}; color: ${groupColor}">${groupName}</h2>`;

            const groupCardsContainer = document.createElement('div');
            groupCardsContainer.className = 'stations-container-inner';

            stationsInGroup.forEach(station => {
                const stationCard = document.createElement('div');
                stationCard.className = 'station-card';
                stationCard.dataset.id = station.id;

                if (station.isEditing) {
                    // --- EDIT MODE ---
                    let endTimeValue = '';
                    if (station.isCountdown) {
                        const startTime = station.startTime ? new Date(station.startTime) : new Date();
                        const endTime = new Date(startTime.getTime() + station.duration);
                        endTimeValue = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
                    }

                    const groupOptions = stationGroups.map(g => `<option value="${g.name}" ${g.name === station.group ? 'selected' : ''}>${g.name}</option>`).join('');

                    stationCard.innerHTML = `
                        <div class="station-edit-view">
                            <input type="text" class="edit-station-name" value="${station.name}" placeholder="نام سیستم">
                            <input type="number" class="edit-station-rate" value="${station.rate}" placeholder="نرخ ساعتی (تومان)">
                            <label>زمان سپری شده (hh:mm:ss):</label>
                            <input type="text" class="edit-station-elapsed-time" value="${formatTime(station.elapsedTime)}">
                            <label>یادداشت:</label>
                            <textarea class="edit-station-notes">${station.notes}</textarea>
                            <label>ساعت پایان:</label>
                            <input type="time" class="edit-station-endtime" value="${endTimeValue}">
                            <label>گروه:</label>
                            <select class="edit-station-group">${groupOptions}</select>
                            <label>صدای هشدار:</label>
                            <select class="edit-station-alarm">
                                <option value="none" ${station.alarmSound === 'none' ? 'selected' : ''}>بی‌صدا</option>
                                <option value="beep" ${station.alarmSound === 'beep' ? 'selected' : ''}>بیپ</option>
                                <option value="bell" ${station.alarmSound === 'bell' ? 'selected' : ''}>زنگ</option>
                                <option value="tts" ${station.alarmSound === 'tts' ? 'selected' : ''}>هشدار صوتی</option>
                            </select>
                            <div class="controls">
                                <button class="save-station-btn" title="ذخیره"><i class="fas fa-save"></i></button>
                                <button class="cancel-edit-btn" title="لغو"><i class="fas fa-times"></i></button>
                            </div>
                        </div>
                    `;
                } else {
                    // --- DISPLAY MODE ---
                    // Calculate the initial display time. The master loop will update this live.
                    let timeToDisplay;
                    if (station.isCountdown) {
                        const elapsedTime = station.startTime ? (Date.now() - station.startTime) : 0;
                        timeToDisplay = station.duration - station.elapsedTime - elapsedTime;
                        if (timeToDisplay < 0) timeToDisplay = 0;
                    } else {
                        timeToDisplay = station.startTime ? (Date.now() - station.startTime) + station.elapsedTime : station.elapsedTime;
                    }

                    // Set initial visual state. The master loop will manage class toggling.
                    if (station.isCountdown) {
                        if (timeToDisplay <= 0) {
                            stationCard.classList.add('times-up');
                        } else if (timeToDisplay < 5 * 60 * 1000) {
                            stationCard.classList.add('warning');
                        }
                    }

                    const formattedTime = formatTime(timeToDisplay);
                    const timeCost = calculateTimeCost(station);
                    const productsCost = station.products.reduce((total, p) => total + p.price, 0);
                    const totalCost = timeCost + productsCost;
                    const progressPercentage = station.isCountdown ? (timeToDisplay / station.duration) * 100 : 0;
                    const startTimeDisplay = station.originalStartTime ? `<p><small>زمان شروع: ${new Date(station.originalStartTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</small></p>` : '';
                    const notesDisplay = station.notes ? `<div class="station-notes-display"><strong>یادداشت:</strong> ${station.notes}</div>` : '';

                    stationCard.innerHTML = `
                        <h3>${station.name} ${station.isCountdown ? '(پیش‌پرداخت)' : ''}</h3>
                        <p><small>نرخ: ${station.rate.toLocaleString('fa-IR')} تومان/ساعت</small></p>
                        ${startTimeDisplay}
                        <div class="time-display">${formattedTime}</div>
                        ${station.isCountdown ? `<div class="progress-bar-container"><div class="progress-bar-inner" style="width: ${progressPercentage}%;"></div></div>` : ''}
                        <div class="cost-display">${totalCost.toLocaleString('fa-IR')} تومان</div>
                        ${notesDisplay}
                        <div class="station-products">
                            <small>محصولات خریداری شده:</small>
                            <ul class="purchased-products-list">
                                ${station.products.map((p, index) => `<li><span>${p.name} (${p.price.toLocaleString('fa-IR')} تومان)</span><button class="remove-station-product-btn icon-btn" data-product-index="${index}" title="حذف این محصول"><i class="fas fa-times"></i></button></li>`).join('') || '<li>-</li>'}
                            </ul>
                        </div>
                        <div class="controls">
                            ${station.startTime ? `<button class="stop-btn" title="توقف"><i class="fas fa-pause"></i></button>` : `<button class="start-btn" title="شروع"><i class="fas fa-play"></i></button>`}
                            <button class="add-product-to-station-btn" title="افزودن محصول"><i class="fas fa-cart-plus"></i></button>
                            <button class="invoice-btn" title="صدور فاکتور"><i class="fas fa-file-invoice"></i></button>
                            <button class="reset-btn" title="ریست"><i class="fas fa-sync-alt"></i></button>
                            <button class="edit-station-btn" title="ویرایش"><i class="fas fa-pencil-alt"></i></button>
                            <button class="delete-station-btn" title="حذف"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    `;
                }
                groupCardsContainer.appendChild(stationCard);
            });
            groupContainer.appendChild(groupCardsContainer);
            stationsContainer.appendChild(groupContainer);
        });
    }

    /**
     * Adds a new station
     */
    function populateGroupSelect() {
        stationGroupSelect.innerHTML = '';
        stationGroups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.name;
            option.textContent = group.name;
            stationGroupSelect.appendChild(option);
        });
    }

    function addNewGroup() {
        const newGroupName = newGroupNameInput.value.trim();
        if (newGroupName && !stationGroups.some(g => g.name === newGroupName)) {
            stationGroups.push({ name: newGroupName, color: '#ffffff' }); // Default new groups to white

            // Re-render everything to ensure all UI parts are in sync
            renderStations();
            renderGroupFilters();

            // Also update the select in the modal for the next time it's opened
            populateGroupSelect();
            stationGroupSelect.value = newGroupName;

            newGroupNameInput.value = '';
            saveState();
        } else if (!newGroupName) {
            alert('لطفا یک نام برای گروه جدید وارد کنید.');
        } else {
            alert('این نام گروه قبلا استفاده شده است.');
        }
    }

    function addStation() {
        const name = stationNameInput.value.trim();
        const rate = parseFloat(stationRateInput.value);
        const startTimeValue = stationStartTimeInput.value;
        const endTimeValue = stationEndTimeInput.value;

        let duration = 0;
        let isCountdown = false;
        let elapsedTime = 0;

        // Handle custom start time to calculate initial elapsed time
        if (startTimeValue) {
            const startTime = new Date(startTimeValue).getTime();
            const now = Date.now();
            if (startTime < now) {
                elapsedTime = now - startTime;
            }
        }

        if (endTimeValue) {
            const now = new Date();
            const [hours, minutes] = endTimeValue.split(':');
            const endTime = new Date();
            endTime.setHours(hours, minutes, 0, 0);

            if (endTime < now) { // If end time is for the next day
                endTime.setDate(endTime.getDate() + 1);
            }
            duration = endTime.getTime() - now.getTime();
            isCountdown = true;
        }

        if (name && !isNaN(rate) && rate >= 0) {
            const newStation = {
                id: nextStationId++,
                name,
                rate,
                startTime: null,
                originalStartTime: startTimeValue ? new Date(startTimeValue).getTime() : null,
                elapsedTime: elapsedTime, // Use calculated elapsed time
                products: [],
                isEditing: false,
                isCountdown: isCountdown,
                duration: duration,
                alarmSound: stationAlarmSound.value,
                alarmPlayed: false,
                group: stationGroupSelect.value,
                notes: ''
            };
            stations.push(newStation);
            stationNameInput.value = '';
            stationRateInput.value = '';
            stationEndTimeInput.value = '';
            hideModal(addStationModal);
            renderStations();
            saveState();
        } else {
        alert('لطفا نام و نرخ ساعتی معتبر وارد کنید.');
        }
    }

    /**
     * Renders the list of available products in the sidebar
     */
    function renderProducts() {
        const searchTerm = sidebarProductSearch.value.toLowerCase();
        const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm));

        productsList.innerHTML = '';
        if (filteredProducts.length === 0) {
            productsList.innerHTML = '<p>محصولی یافت نشد.</p>';
            return;
        }
        filteredProducts.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.dataset.id = product.id;

            if (product.isEditing) {
                productItem.innerHTML = `
                    <div class="product-edit-view">
                        <input type="text" class="edit-product-name" value="${product.name}" placeholder="نام محصول">
                        <input type="number" class="edit-product-purchase-price" value="${product.purchasePrice}" placeholder="قیمت خرید">
                        <input type="number" class="edit-product-price" value="${product.price}" placeholder="قیمت فروش">
                        <div class="product-edit-controls">
                            <button class="save-product-btn icon-btn" title="ذخیره"><i class="fas fa-save"></i></button>
                            <button class="cancel-edit-product-btn icon-btn" title="لغو"><i class="fas fa-times"></i></button>
                        </div>
                    </div>
                `;
            } else {
                const purchasePriceText = product.purchasePrice > 0 ? `خرید: ${(product.purchasePrice || 0).toLocaleString('fa-IR')}` : '';
                let marginText = '';
                if (product.price > 0 && product.purchasePrice > 0) {
                    const margin = ((product.price - product.purchasePrice) / product.price) * 100;
                    marginText = ` <span class="profit-margin">(سود: ${margin.toFixed(0)}%)</span>`;
                }

                productItem.innerHTML = `
                    <span class="product-info">${product.name} - فروش: ${product.price.toLocaleString('fa-IR')} ${purchasePriceText ? `(${purchasePriceText})` : ''}${marginText}</span>
                    <div class="product-controls">
                        <button class="edit-product-btn icon-btn" title="ویرایش محصول"><i class="fas fa-pencil-alt"></i></button>
                        <button class="delete-product-btn icon-btn" title="حذف محصول"><i class="fas fa-trash-alt"></i></button>
                    </div>
                `;
            }
            productsList.appendChild(productItem);
        });
    }

    /**
     * Adds a new product to the available products list
     */
    function addProduct() {
        const name = productNameInput.value.trim();
        const price = parseFloat(productPriceInput.value);
        const purchasePrice = parseFloat(productPurchasePriceInput.value) || 0;

        if (name && !isNaN(price) && price > 0 && purchasePrice >= 0) {
            const newProduct = {
                id: nextProductId++,
                name,
                price,
                purchasePrice,
                isEditing: false
            };
            products.push(newProduct);
            productNameInput.value = '';
            productPriceInput.value = '';
            productPurchasePriceInput.value = '';
            renderProducts();
            saveState();
        } else {
            alert('لطفا نام، قیمت فروش و قیمت خرید معتبر برای محصول وارد کنید.');
        }
    }

    function saveProductEdits(productId) {
        const product = products.find(p => p.id === productId);
        const productItem = productsList.querySelector(`.product-item[data-id='${productId}']`);
        if (!product || !productItem) return;

        const newName = productItem.querySelector('.edit-product-name').value.trim();
        const newPrice = parseFloat(productItem.querySelector('.edit-product-price').value);
        const newPurchasePrice = parseFloat(productItem.querySelector('.edit-product-purchase-price').value) || 0;

        if (newName && !isNaN(newPrice) && newPrice > 0 && newPurchasePrice >= 0) {
            product.name = newName;
            product.price = newPrice;
            product.purchasePrice = newPurchasePrice;
            product.isEditing = false;
            renderProducts();
            // We need to re-render stations too, in case the product was in use and its name/price changed
            renderStations();
            saveState();
        } else {
            alert('لطفا نام و قیمت‌های معتبر وارد کنید.');
        }
    }

    /**
     * Renders the list of products in the multi-select modal, optionally filtered by a search term.
     * @param {string} [searchTerm=''] - The term to filter products by.
     */
    function renderProductSelectionList(searchTerm = '') {
        productSelectionList.innerHTML = '';
        const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

        if (filteredProducts.length === 0) {
            productSelectionList.innerHTML = '<p>محصولی یافت نشد.</p>';
            return;
        }

        filteredProducts.forEach(product => {
            const item = document.createElement('div');
            item.className = 'product-selection-item';
            item.innerHTML = `
                <input type="checkbox" id="product-check-${product.id}" data-product-id="${product.id}">
                <label for="product-check-${product.id}">${product.name} - ${product.price.toLocaleString('fa-IR')} تومان</label>
                <input type="number" class="product-quantity-input" value="1" min="1">
            `;
            productSelectionList.appendChild(item);
        });
    }

    /**
     * Opens the multi-select product modal for a specific station
     * @param {object} station
     */
    function openAddProductToStationModal(station) {
        if (products.length === 0) {
            alert('ابتدا باید محصولی را در بخش محصولات تعریف کنید.');
            return;
        }
        // Store the station ID on the modal to retrieve it later
        addProductsModal.dataset.stationId = station.id;
        productSearchInput.value = ''; // Clear search
        renderProductSelectionList();
        showModal(addProductsModal);
    }

    /**
     * Handles clicks within the stations container (start, stop, etc.)
     * @param {Event} e
     */
    function handleStationClick(e) {
        const stationCard = e.target.closest('.station-card');
        if (!stationCard) return;

        const stationId = parseInt(stationCard.dataset.id, 10);
        const station = stations.find(s => s.id === stationId);
        const button = e.target.closest('button');

        if (!button) return; // Ignore clicks that are not on buttons inside the card

        if (button.classList.contains('remove-station-product-btn')) {
            const productIndex = parseInt(button.dataset.productIndex, 10);
            station.products.splice(productIndex, 1);
            renderStations();
            saveState();
        } else if (button.classList.contains('start-btn')) {
            startTimer(station);
        } else if (button.classList.contains('stop-btn')) {
            stopTimer(station);
        } else if (button.classList.contains('reset-btn')) {
            resetStation(station);
        } else if (button.classList.contains('add-product-to-station-btn')) {
            openAddProductToStationModal(station);
        } else if (button.classList.contains('invoice-btn')) {
            generateInvoice(station);
        } else if (button.classList.contains('delete-station-btn')) {
            deleteStation(stationId);
        } else if (button.classList.contains('edit-station-btn')) {
            station.isEditing = true;
            renderStations();
        } else if (button.classList.contains('cancel-edit-btn')) {
            station.isEditing = false;
            renderStations();
        } else if (button.classList.contains('save-station-btn')) {
            saveStationEdits(stationId);
        }
    }

    /**
     * Saves the edited data for a station
     * @param {number} stationId
     * @param {HTMLElement} stationCard
     */
    function saveStationEdits(stationId) {
        const station = stations.find(s => s.id === stationId);
        const stationCard = stationsContainer.querySelector(`.station-card[data-id='${stationId}']`);

        if (!station || !stationCard) {
            alert("خطا: سیستم برای ویرایش یافت نشد.");
            return;
        }

        const newName = stationCard.querySelector('.edit-station-name').value.trim();
        const newRate = parseFloat(stationCard.querySelector('.edit-station-rate').value);
        const newElapsedTimeValue = stationCard.querySelector('.edit-station-elapsed-time').value;
        const notesValue = stationCard.querySelector('.edit-station-notes').value.trim();
        const endTimeValue = stationCard.querySelector('.edit-station-endtime').value;
        const alarmSoundValue = stationCard.querySelector('.edit-station-alarm').value;
        const groupValue = stationCard.querySelector('.edit-station-group').value;

        const newElapsedTime = parseTimeToMs(newElapsedTimeValue);

        if (newName && !isNaN(newRate) && newRate >= 0 && !isNaN(newElapsedTime)) {
            station.name = newName;
            station.rate = newRate;
            station.elapsedTime = newElapsedTime;
            station.notes = notesValue;
            station.alarmSound = alarmSoundValue;
            station.group = groupValue;

            if (endTimeValue) {
                station.isCountdown = true;
                const now = new Date();
                const [hours, minutes] = endTimeValue.split(':');
                const endTime = new Date(station.startTime || Date.now());
                endTime.setHours(hours, minutes, 0, 0);
                if (endTime < now) endTime.setDate(endTime.getDate() + 1);

                const originalStartTime = new Date(station.startTime || Date.now());
                station.duration = endTime.getTime() - originalStartTime.getTime();
            } else {
                station.isCountdown = false;
            }

            station.isEditing = false;
            activeGroupFilter = 'all'; // Reset filter to prevent edited station from disappearing
            renderGroupFilters();
            renderStations();
            saveState();
        } else {
            alert('خطا: لطفا مقادیر معتبر برای نام، نرخ و زمان سپری شده وارد کنید.');
        }
    }

    /**
     * Deletes a station after confirmation
     * @param {number} stationId
     */
    function deleteStation(stationId) {
        if (confirm('آیا از حذف این سیستم مطمئن هستید؟ این عمل قابل بازگشت نیست.')) {
            stations = stations.filter(s => s.id !== stationId);
            renderStations();
            saveState();
        }
    }

    /**
     * Deletes a product after confirmation
     * @param {number} productId
     */
    function deleteProduct(productId) {
        if (confirm('آیا از حذف این محصول مطمئن هستید؟')) {
            products = products.filter(p => p.id !== productId);
            // Also remove this product from any station's purchased list
            stations.forEach(station => {
                station.products = station.products.filter(p => p.id !== productId);
            });
            renderProducts();
            renderStations(); // Re-render stations in case a product was removed from them
            saveState();
        }
    }

    /**
     * Starts the timer for a station
     * @param {object} station
     * @param {boolean} silent - If true, won't re-render or save state.
     */
    function startTimer(station, silent = false) {
        if (station.startTime) return;
        if (!station.originalStartTime) {
            station.originalStartTime = Date.now();
        }
        station.alarmPlayed = false; // Reset alarm state
        station.startTime = Date.now();
        if (!silent) {
            renderStations(); // Re-render to change button state
            saveState();
        }
    }

    /**
     * Stops the timer for a station
     * @param {object} station
     * @param {boolean} silent - If true, won't re-render, to prevent infinite loops.
     */
    function stopTimer(station, silent = false) {
        if (!station.startTime) return;

        station.elapsedTime += Date.now() - station.startTime;

        if (station.isCountdown && station.elapsedTime > station.duration) {
            station.elapsedTime = station.duration;
        }

        station.startTime = null;

        if (!silent) {
            renderStations();
            saveState();
        }
    }

    /**
     * Resets a station's timer and products after confirmation.
     * @param {object} station
     */
    function resetStation(station) {
        if (confirm(`آیا از ریست کردن سیستم «${station.name}» مطمئن هستید؟ تمام زمان و محصولات این سیستم پاک خواهد شد.`)) {
            if (station.startTime) {
                stopTimer(station, true); // Stop silently
            }
            station.elapsedTime = 0;
            station.originalStartTime = null;
            station.products = [];
            station.notes = '';
            renderStations();
            saveState();
        }
    }


    /**
     * Formats milliseconds into HH:MM:SS string
     * @param {number} ms
     * @returns {string}
     */
    function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    /**
     * Parses a time string (HH:MM:SS) into milliseconds.
     * @param {string} timeString
     * @returns {number} - Milliseconds, or NaN if invalid.
     */
    function parseTimeToMs(timeString) {
        if (!/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
            return NaN;
        }
        const parts = timeString.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parseInt(parts[2], 10);
        if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
            return NaN;
        }
        return (hours * 3600 + minutes * 60 + seconds) * 1000;
    }

    /**
     * Calculates the total cost for a station (time + products)
     * @param {object} station
     * @returns {number}
     */
    /**
     * Generates and shows the final invoice for a station.
     * @param {object} station
     */
    function generateInvoice(station) {
        if (station.startTime) {
            stopTimer(station);
        }

        const timeCost = calculateTimeCost(station);
        const productsCost = station.products.reduce((total, p) => total + p.price, 0);
        const totalCost = timeCost + productsCost;

        invoiceDetails.innerHTML = `
            <h4>فاکتور برای: ${station.name}</h4>
            <p>مدت زمان استفاده: ${formatTime(station.isCountdown ? station.duration : station.elapsedTime)}</p>
            <p>هزینه زمان: ${timeCost.toLocaleString('fa-IR')} تومان</p>
            <hr>
            <h5>محصولات خریداری شده:</h5>
            <ul>
                ${station.products.map(p => `<li>${p.name}: ${p.price.toLocaleString('fa-IR')} تومان</li>`).join('') || '<li>محصولی خریداری نشده است.</li>'}
            </ul>
            <p>هزینه محصولات: ${productsCost.toLocaleString('fa-IR')} تومان</p>
            <hr>
            <h3>مبلغ نهایی: ${totalCost.toLocaleString('fa-IR')} تومان</h3>
        `;

        // Store the current station ID on the modal for the payment handlers
        invoiceModal.dataset.stationId = station.id;
        showModal(invoiceModal);
    }

    /**
     * Finalizes the transaction, saves it to history, and resets the station.
     * @param {number} stationId
     * @param {string} paymentMethod
     */
    function finalizeTransaction(stationId, paymentMethod) {
        if (isFinalizing) {
            return;
        }
        isFinalizing = true;

        const station = stations.find(s => s.id === stationId);
        if (!station) {
            isFinalizing = false; // Release lock if station not found
            return;
        }

        const timeCost = calculateTimeCost(station);
        const productsCost = station.products.reduce((total, p) => total + p.price, 0);
        const productsProfit = station.products.reduce((total, p) => {
            // Ensure purchasePrice is a number, default to 0 if not present for old data
            const purchasePrice = p.purchasePrice || 0;
            return total + (p.price - purchasePrice);
        }, 0);
        const totalProfit = timeCost + productsProfit;

        const historyRecord = {
            id: nextHistoryId++,
            stationName: station.name,
            date: new Date().toISOString(),
            timeCost,
            productsCost,
            totalCost: timeCost + productsCost,
            totalProfit,
            paymentMethod,
            products: station.products,
            duration: station.isCountdown ? station.duration : station.elapsedTime
        };
        history.push(historyRecord);

        // Reset the station
        station.elapsedTime = 0;
        station.products = [];
        station.startTime = null;
        if (station.isCountdown) {
            // Reset countdown timer for next use
        }

        hideModal(invoiceModal);
        renderStations();
        saveState();

        // Release the lock after a short delay to prevent any lingering click events
        setTimeout(() => {
            isFinalizing = false;
        }, 300);
    }

    function calculateTimeCost(station) {
        let timeForCost = 0;
        if (station.isCountdown) {
            timeForCost = station.duration;
        } else {
            timeForCost = station.startTime ? Date.now() - station.startTime + station.elapsedTime : station.elapsedTime;
        }
        return Math.floor((timeForCost / (1000 * 60 * 60)) * station.rate);
    }


    /**
     * Applies current filters and re-renders the report
     */
    function applyReportFilters() {
        // First, ensure the inputs reflect the saved settings
        filterStartDate.value = settings.reportFilters.startDate || '';
        filterEndDate.value = settings.reportFilters.endDate || '';
        historySearchInput.value = settings.reportFilters.searchTerm || '';

        const filteredHistory = getFilteredHistory();
        renderReport(filteredHistory);
    }

    /**
     * Renders the report modal with a given dataset
     * @param {Array} historyData - The data to render
     */
    function renderReport(historyData) {
        // Stats
        const totalRevenue = historyData.reduce((sum, item) => sum + item.totalCost, 0);
        const totalProfit = historyData.reduce((sum, item) => sum + (item.totalProfit || 0), 0);

        // For "Today's Revenue", we always filter the complete history, regardless of the date filter
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const todayHistory = history.filter(item => item.date >= todayStart);
        const todayRevenue = todayHistory.reduce((sum, item) => sum + item.totalCost, 0);

        statsTodayRevenue.textContent = `${todayRevenue.toLocaleString('fa-IR')} تومان`;
        statsTotalRevenue.textContent = `${totalRevenue.toLocaleString('fa-IR')} تومان`;
        statsTotalProfit.textContent = `${totalProfit.toLocaleString('fa-IR')} تومان`;
        statsTotalTransactions.textContent = historyData.length.toLocaleString('fa-IR');

        // History Table
        historyTableBody.innerHTML = '';
        [...historyData].reverse().forEach(item => {
            const row = document.createElement('tr');
            const paymentMethodText = {
                cash: 'نقدی',
                card: 'کارت',
                transfer: 'کارت به کارت'
            }[item.paymentMethod] || item.paymentMethod;

            row.innerHTML = `
                <td><input type="checkbox" class="history-item-checkbox" data-history-id="${item.id}"></td>
                <td>${item.stationName}</td>
                <td>${new Date(item.date).toLocaleString('fa-IR')}</td>
                <td>${formatTime(item.duration)}</td>
                <td>${paymentMethodText}</td>
                <td>${item.totalCost.toLocaleString('fa-IR')} تومان</td>
                <td>${(item.totalProfit || 0).toLocaleString('fa-IR')} تومان</td>
                <td><button class="delete-history-btn" data-id="${item.id}" title="حذف این رکورد"><i class="fas fa-trash-alt"></i></button></td>
            `;
            historyTableBody.appendChild(row);
        });

        // Render the chart with the same filtered data
        renderReportChart(historyData);
    }

    function deleteHistoryEntry(id) {
        if (confirm('آیا از حذف این رکورد مطمئن هستید؟')) {
            history = history.filter(item => item.id !== id);
            saveState();
            applyReportFilters(); // Re-render the report with current filters
        }
    }

    function deleteFilteredHistory() {
        // This is a complex operation, so we need to be careful.
        // First, get the IDs of all currently visible (filtered) items.
        const filteredIds = Array.from(historyTableBody.querySelectorAll('tr .delete-history-btn')).map(btn => parseInt(btn.dataset.id, 10));

        if (filteredIds.length === 0) {
            alert('موردی برای حذف وجود ندارد.');
            return;
        }

        if (confirm(`آیا از حذف ${filteredIds.length} مورد فیلتر شده مطمئن هستید؟ این عمل غیرقابل بازگشت است.`)) {
            // Filter the main history array to exclude these IDs
            history = history.filter(item => !filteredIds.includes(item.id));
            saveState();
            applyReportFilters(); // Re-render with the items removed
        }
    }

    function exportToCSV() {
        const filteredHistory = getFilteredHistory(); // Get current filtered data
        if (filteredHistory.length === 0) {
            alert('موردی برای خروجی گرفتن وجود ندارد.');
            return;
        }

        const escapeCsvField = (field) => {
            const stringField = String(field ?? '');
            const escapedField = stringField.replace(/"/g, '""');
            return `"${escapedField}"`;
        };

        const headers = ['نام سیستم', 'تاریخ', 'مدت زمان (HH:MM:SS)', 'هزینه زمان', 'هزینه محصولات', 'مبلغ کل', 'سود', 'نحوه پرداخت'].map(escapeCsvField);
        const rows = filteredHistory.map(item => {
            const paymentMethodText = {
                cash: 'نقدی',
                card: 'کارت',
                transfer: 'کارت به کارت'
            }[item.paymentMethod] || item.paymentMethod;

            const rowData = [
                item.stationName,
                new Date(item.date).toLocaleString('fa-IR'),
                formatTime(item.duration),
                item.timeCost,
                item.productsCost,
                item.totalCost,
                item.totalProfit || 0,
                paymentMethodText
            ];
            return rowData.map(escapeCsvField).join(',');
        });

        const totalRevenue = filteredHistory.reduce((sum, item) => sum + item.totalCost, 0);
        const totalProfit = filteredHistory.reduce((sum, item) => sum + (item.totalProfit || 0), 0);
        const summaryRow = ['', '', '', '', '', '"جمع کل:"', `"${totalRevenue}"`, `"${totalProfit}"`].join(',');

        const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n') + '\n' + summaryRow;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "gamenet_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function getFilteredHistory() {
        const startDate = filterStartDate.value ? new Date(filterStartDate.value).toISOString() : null;
        const endDate = filterEndDate.value ? new Date(filterEndDate.value).toISOString() : null;
        const searchTerm = historySearchInput.value.toLowerCase();
        let filteredHistory = history;
        if (startDate) filteredHistory = filteredHistory.filter(item => item.date >= startDate);
        if (endDate) {
            const inclusiveEndDate = new Date(endDate);
            inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
            filteredHistory = filteredHistory.filter(item => item.date < inclusiveEndDate.toISOString());
        }
        if (searchTerm) filteredHistory = filteredHistory.filter(item => item.stationName.toLowerCase().includes(searchTerm));
        return filteredHistory;
    }

    /**
     * Plays a sound using the Web Audio API
     * @param {string} soundName - The name of the sound to play ('beep', 'bell', etc.)
     */
    async function playSound(soundName, stationName = '') {
        if (soundName === 'none') return;

        // Priority 1: Custom Sound
        if (settings.useCustomAlarm) {
            try {
                const soundBuffer = await dbHelper.loadSound();
                if (soundBuffer) {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const decodedBuffer = await audioCtx.decodeAudioData(soundBuffer.slice(0)); // slice(0) to copy
                    const source = audioCtx.createBufferSource();
                    const gainNode = audioCtx.createGain();

                    source.buffer = decodedBuffer;
                    gainNode.gain.value = settings.alarmVolume;

                    source.connect(gainNode);
                    gainNode.connect(audioCtx.destination);
                    source.start(0);
                    return; // Exit after playing custom sound
                }
            } catch (error) {
                console.error("Failed to play custom alarm:", error);
                // Fallback to default sounds
            }
        }

        // Priority 2: Text-to-Speech
        if (soundName === 'tts' && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`وقتِ ${stationName} تمام شد`);
            utterance.lang = 'fa-IR';
            utterance.volume = settings.alarmVolume;
            window.speechSynthesis.speak(utterance);
            return;
        }

        if (!window.AudioContext) return;
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let repeatCount = 0;
        const maxRepeats = 6; // Total of 7 beeps for a more insistent alarm
        const interval = 400; // ms between beeps

        function playBeep() {
            // Don't play if context is closed
            if (audioCtx.state === 'closed') return;

            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            if (soundName === 'beep') {
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(900, audioCtx.currentTime);
            } else if (soundName === 'bell') {
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
            }

            // Use volume from settings
            gainNode.gain.setValueAtTime(settings.alarmVolume, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.2);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.2);

            if (repeatCount < maxRepeats) {
                repeatCount++;
                setTimeout(playBeep, interval);
            } else {
                // Close the context after the last sound has played
                setTimeout(() => audioCtx.close(), interval);
            }
        }

        playBeep();
    }


    // --- Event Listeners ---
    addStationBtn.addEventListener('click', () => {
        // Pre-fill the rate input with the default rate from settings
        stationRateInput.value = settings.defaultRate;

        // Set default start time to now
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Adjust for local timezone
        stationStartTimeInput.value = now.toISOString().slice(0,16);

        populateGroupSelect();
        showModal(addStationModal);
    });

    pauseAllBtn.addEventListener('click', () => {
        let changed = false;
        stations.forEach(station => {
            if (station.startTime) {
                stopTimer(station, true); // Stop silently
                changed = true;
            }
        });
        if (changed) {
            renderStations();
            saveState();
        }
    });

    resumeAllBtn.addEventListener('click', () => {
        let changed = false;
        stations.forEach(station => {
            // Resume only if paused and has elapsed time
            if (!station.startTime && station.elapsedTime > 0) {
                startTimer(station, true); // Start silently
                changed = true;
            }
        });
        if (changed) {
            renderStations();
            saveState();
        }
    });

    addNewGroupBtn.addEventListener('click', addNewGroup);
    closeModalBtns.forEach(btn => btn.addEventListener('click', (e) => hideModal(e.target.closest('.modal'))));
    confirmAddStationBtn.addEventListener('click', addStation);
    stationsContainer.addEventListener('click', handleStationClick);

    sidebarProductSearch.addEventListener('input', () => renderProducts());

    addProductBtn.addEventListener('click', addProduct);
    productsList.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const productItem = e.target.closest('.product-item');
        const productId = parseInt(productItem.dataset.id, 10);
        const product = products.find(p => p.id === productId);

        if (!product) return;

        if (button.classList.contains('delete-product-btn')) {
            deleteProduct(productId);
        } else if (button.classList.contains('edit-product-btn')) {
            // Ensure only one item is editable at a time for simplicity
            products.forEach(p => p.isEditing = false);
            product.isEditing = true;
            renderProducts();
        } else if (button.classList.contains('cancel-edit-product-btn')) {
            product.isEditing = false;
            renderProducts();
        } else if (button.classList.contains('save-product-btn')) {
            saveProductEdits(productId);
        }
    });
    payCashBtn.addEventListener('click', () => {
        const stationId = parseInt(invoiceModal.dataset.stationId);
        if (stationId) finalizeTransaction(stationId, 'cash');
    });

    payCardBtn.addEventListener('click', () => {
        const stationId = parseInt(invoiceModal.dataset.stationId);
        if (stationId) finalizeTransaction(stationId, 'card');
    });

    payTransferBtn.addEventListener('click', () => {
        const stationId = parseInt(invoiceModal.dataset.stationId);
        if (stationId) finalizeTransaction(stationId, 'transfer');
    });

    reportBtn.addEventListener('click', () => {
        applyReportFilters(); // Apply default/empty filters when opening
        showModal(reportModal);
    });

    endOfDayBtn.addEventListener('click', () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayString = `${yyyy}-${mm}-${dd}`;

        // Set the filters to today's date
        settings.reportFilters.startDate = todayString;
        settings.reportFilters.endDate = todayString;
        settings.reportFilters.searchTerm = '';
        saveState();

        // Apply filters and show the modal
        applyReportFilters();
        showModal(reportModal);

        // Prompt for backup
        if (confirm('گزارش روزانه آماده شد. آیا مایل به پشتیبان‌گیری از اطلاعات هستید؟')) {
            backupData();
        }
    });

    manualEntryBtn.addEventListener('click', openManualEntryModal);

    helpBtn.addEventListener('click', () => showModal(helpModal));

    function renderGroupColorSettings() {
        groupColorList.innerHTML = '';
        stationGroups.forEach(group => {
            const item = document.createElement('div');
            item.className = 'group-color-item';
            item.innerHTML = `
                <span>${group.name}</span>
                <input type="color" data-group-name="${group.name}" value="${group.color}">
            `;
            groupColorList.appendChild(item);
        });
    }

    settingsBtn.addEventListener('click', () => {
        // Populate settings modal with current values
        defaultRateInput.value = settings.defaultRate;
        document.getElementById('theme-select').value = settings.theme;
        alarmVolumeInput.value = settings.alarmVolume;
        customAlarmUpload.value = '';

        renderGroupColorSettings();

        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.classList.toggle('selected', swatch.dataset.color === settings.accentColor);
        });
        applyTheme(); // To show/hide accent colors
        showModal(settingsModal);
    });

    document.getElementById('theme-select').addEventListener('change', (e) => {
        settings.theme = e.target.value;
        applyTheme();
    });

    document.querySelector('.color-swatches').addEventListener('click', (e) => {
        const swatch = e.target.closest('.color-swatch');
        if (swatch) {
            settings.accentColor = swatch.dataset.color;
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
            applyTheme();
        }
    });

    saveSettingsBtn.addEventListener('click', async () => {
        // Save group colors
        groupColorList.querySelectorAll('.group-color-item input').forEach(input => {
            const groupName = input.dataset.groupName;
            const group = stationGroups.find(g => g.name === groupName);
            if (group) {
                group.color = input.value;
            }
        });

        const newDefaultRate = parseFloat(defaultRateInput.value);
        const newAlarmVolume = parseFloat(alarmVolumeInput.value);

        if (!isNaN(newDefaultRate) && newDefaultRate >= 0) {
            settings.defaultRate = newDefaultRate;
            settings.alarmVolume = newAlarmVolume;

            const file = customAlarmUpload.files[0];
            if (file) {
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    await dbHelper.saveSound(arrayBuffer);
                    settings.useCustomAlarm = true;
                    alert('زنگ هشدار سفارشی ذخیره شد.');
                } catch (error) {
                    alert('خطا در ذخیره زنگ هشدار.');
                    console.error(error);
                }
            }

            saveState();
            hideModal(settingsModal);
        } else {
            alert('لطفا نرخ پیش‌فرض معتبر وارد کنید.');
        }
    });

    deleteAllHistoryBtn.addEventListener('click', () => {
        if (confirm('آیا از حذف **تمام تاریخچه** مطمئن هستید؟ این عمل غیرقابل بازگشت است!')) {
            history = [];
            nextHistoryId = 1;
            saveState();
            alert('کل تاریخچه با موفقیت پاک شد.');
            // We can also re-render the report if it's open
            if (reportModal.style.display === 'flex') {
                applyReportFilters();
            }
            // Do not close the settings modal, let the user do it.
        }
    });

    // Report filter event listeners that also save the filter state
    filterStartDate.addEventListener('change', (e) => {
        settings.reportFilters.startDate = e.target.value;
        saveState();
        applyReportFilters();
    });
    filterEndDate.addEventListener('change', (e) => {
        settings.reportFilters.endDate = e.target.value;
        saveState();
        applyReportFilters();
    });
    historySearchInput.addEventListener('input', (e) => {
        settings.reportFilters.searchTerm = e.target.value;
        saveState();
        applyReportFilters();
    });


    toggleChartBtn.addEventListener('click', () => {
        const isChartHidden = reportChartContainer.style.display === 'none';
        if (isChartHidden) {
            reportTableContainer.style.display = 'none';
            reportChartContainer.style.display = 'block';
            toggleChartBtn.textContent = 'نمایش جدول';
        } else {
            reportTableContainer.style.display = 'block';
            reportChartContainer.style.display = 'none';
            toggleChartBtn.textContent = 'نمایش چارت';
        }
    });

    historyTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-history-btn')) {
            const historyId = parseInt(e.target.closest('button').dataset.id, 10);
            deleteHistoryEntry(historyId);
        }
        if (e.target.classList.contains('history-item-checkbox')) {
            updateDeleteSelectedButtonVisibility();
        }
    });

    historySelectAll.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        historyTableBody.querySelectorAll('.history-item-checkbox').forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        updateDeleteSelectedButtonVisibility();
    });

    deleteSelectedHistoryBtn.addEventListener('click', () => {
        const selectedIds = Array.from(historyTableBody.querySelectorAll('.history-item-checkbox:checked'))
            .map(cb => parseInt(cb.dataset.historyId, 10));

        if (selectedIds.length === 0) {
            alert('هیچ موردی برای حذف انتخاب نشده است.');
            return;
        }

        if (confirm(`آیا از حذف ${selectedIds.length} مورد انتخاب شده مطمئن هستید؟`)) {
            history = history.filter(item => !selectedIds.includes(item.id));
            saveState();
            applyReportFilters(); // Re-render the report
            updateDeleteSelectedButtonVisibility(); // Hide button again
        }
    });

    function updateDeleteSelectedButtonVisibility() {
        const anyChecked = historyTableBody.querySelector('.history-item-checkbox:checked');
        deleteSelectedHistoryBtn.style.display = anyChecked ? 'inline-block' : 'none';
    }

    exportCsvBtn.addEventListener('click', exportToCSV);
    deleteFilteredBtn.addEventListener('click', deleteFilteredHistory);
    backupBtn.addEventListener('click', backupData);
    restoreInput.addEventListener('change', restoreData);

    productSearchInput.addEventListener('input', (e) => {
        renderProductSelectionList(e.target.value);
    });

    confirmAddProductsBtn.addEventListener('click', () => {
        const stationId = parseInt(addProductsModal.dataset.stationId, 10);
        const station = stations.find(s => s.id === stationId);
        if (!station) return;

        const selectedItems = productSelectionList.querySelectorAll('input[type="checkbox"]:checked');
        selectedItems.forEach(item => {
            const productId = parseInt(item.dataset.productId, 10);
            const product = products.find(p => p.id === productId);
            const quantity = parseInt(item.closest('.product-selection-item').querySelector('.product-quantity-input').value, 10);

            if (product && quantity > 0) {
                for (let i = 0; i < quantity; i++) {
                    station.products.push(product);
                }
            }
        });

        hideModal(addProductsModal);
        renderStations();
        saveState();
    });


    /**
     * Opens the manual entry modal and populates the station list
     */
    function openManualEntryModal() {
        manualStationSelect.innerHTML = '';
        if (stations.length === 0) {
            manualStationSelect.innerHTML = '<option value="">ابتدا یک سیستم اضافه کنید</option>';
            return;
        }
        stations.forEach(station => {
            const option = document.createElement('option');
            option.value = station.id;
            option.textContent = station.name;
            manualStationSelect.appendChild(option);
        });
        showModal(manualEntryModal);
    }

    /**
     * Finalizes a manually entered session
     */
    function finalizeManualEntry() {
        const stationId = parseInt(manualStationSelect.value, 10);
        const startTime = new Date(manualStartTime.value);
        const endTime = new Date(manualEndTime.value);
        const paymentMethod = manualPaymentMethod.value;

        const station = stations.find(s => s.id === stationId);

        if (!stationId || !station || isNaN(startTime) || isNaN(endTime) || endTime <= startTime) {
            alert('لطفا تمام فیلدها را به درستی وارد کنید. زمان پایان باید بعد از زمان شروع باشد.');
            return;
        }

        const duration = endTime.getTime() - startTime.getTime();
        const timeCost = Math.floor((duration / (1000 * 60 * 60)) * station.rate);

        const historyRecord = {
            id: nextHistoryId++,
            stationName: station.name,
            date: endTime.toISOString(),
            timeCost,
            productsCost: 0, // Manual entry does not include products for now
            totalCost: timeCost,
            totalProfit: timeCost, // For manual entry, profit equals time cost
            paymentMethod,
            products: [],
            duration
        };
        history.push(historyRecord);

        manualStartTime.value = '';
        manualEndTime.value = '';
        hideModal(manualEntryModal);
        saveState();
        alert('جلسه دستی با موفقیت ثبت شد.');
    }


    /**
     * Creates a JSON backup file of the entire app state and downloads it.
     */
    function backupData() {
        const stateToSave = { settings, stations, products, history, nextStationId, nextProductId, nextHistoryId };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stateToSave, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `gamenet_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        alert('فایل پشتیبان با موفقیت ایجاد شد.');
    }

    /**
     * Reads a JSON backup file and restores the app state from it.
     * @param {Event} event
     */
    function restoreData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const state = JSON.parse(e.target.result);
                // Basic validation
                if (state && state.settings && state.stations && state.history) {
                    if (confirm('آیا مطمئن هستید؟ تمام اطلاعات فعلی با اطلاعات فایل پشتیبان جایگزین خواهد شد.')) {
                        // Replace current state with restored state
                        settings = state.settings;
                        stations = state.stations;
                        products = state.products;
                        history = state.history;
                        nextStationId = state.nextStationId;
                        nextProductId = state.nextProductId;
                        nextHistoryId = state.nextHistoryId;

                        saveState();
                        alert('اطلاعات با موفقیت بازیابی شد. صفحه مجددا بارگذاری می‌شود.');
                        location.reload();
                    }
                } else {
                    alert('فایل پشتیبان معتبر نیست.');
                }
            } catch (error) {
                alert('خطا در خواندن فایل. لطفا از معتبر بودن فایل پشتیبان اطمینان حاصل کنید.');
                console.error("Error parsing restore file:", error);
            }
        };
        reader.readAsText(file);
        // Clear the input value so the same file can be selected again
        event.target.value = '';
    }


    /**
     * Efficiently updates the display of a single running station card without re-rendering.
     * @param {object} station
     */
    function updateLiveStationData(station) {
        const stationCard = stationsContainer.querySelector(`[data-id="${station.id}"]`);
        if (!stationCard || station.isEditing) return; // Don't update if not found or in edit mode

        let timeToDisplay = 0;
        let isTimeUp = false;

        if (station.isCountdown) {
            const elapsedTime = station.startTime ? Date.now() - station.startTime : 0;
            timeToDisplay = station.duration - station.elapsedTime - elapsedTime;
            if (timeToDisplay < 0) timeToDisplay = 0;

            if (station.startTime && timeToDisplay === 0 && !station.alarmPlayed) {
                isTimeUp = true;
                playSound(station.alarmSound, station.name);
                station.alarmPlayed = true;
                stopTimer(station, true);
                renderStations(); // Re-render once to show stopped state
            }
            stationCard.classList.toggle('warning', timeToDisplay > 0 && timeToDisplay < 5 * 60 * 1000);
            stationCard.classList.toggle('times-up', isTimeUp);

            const progressBar = stationCard.querySelector('.progress-bar-inner');
            if (progressBar) {
                progressBar.style.width = `${(timeToDisplay / station.duration) * 100}%`;
            }
        } else {
            timeToDisplay = Date.now() - station.startTime + station.elapsedTime;
        }

        const timeCost = calculateTimeCost(station);
        const productsCost = station.products.reduce((total, p) => total + p.price, 0);
        const totalCost = timeCost + productsCost;

        stationCard.querySelector('.time-display').textContent = formatTime(timeToDisplay);
        stationCard.querySelector('.cost-display').textContent = `${totalCost.toLocaleString('fa-IR')} تومان`;
    }

    // --- Master Timer Loop ---
    setInterval(() => {
        stations.forEach(station => {
            if (station.startTime) {
                updateLiveStationData(station);
            }
        });
    }, 1000);


    /**
     * Renders the group filter buttons
     */
    function renderGroupFilters() {
        stationFiltersContainer.innerHTML = '';
        const allBtn = document.createElement('button');
        allBtn.className = 'filter-btn';
        allBtn.textContent = 'همه';
        allBtn.dataset.group = 'all';
        if (activeGroupFilter === 'all') {
            allBtn.classList.add('active');
        }
        stationFiltersContainer.appendChild(allBtn);

        stationGroups.forEach(group => {
            const groupBtn = document.createElement('button');
            groupBtn.className = 'filter-btn';
            groupBtn.textContent = group.name;
            groupBtn.dataset.group = group.name;
            if (activeGroupFilter === group.name) {
                groupBtn.classList.add('active');
            }
            stationFiltersContainer.appendChild(groupBtn);
        });
    }


    // --- Event Listeners ---
    addStationBtn.addEventListener('click', () => {
        // Pre-fill the rate input with the default rate from settings
        stationRateInput.value = settings.defaultRate;
        populateGroupSelect();
        showModal(addStationModal);
    });
    addNewGroupBtn.addEventListener('click', addNewGroup);
    closeModalBtns.forEach(btn => btn.addEventListener('click', (e) => hideModal(e.target.closest('.modal'))));
    confirmAddStationBtn.addEventListener('click', addStation);
    stationsContainer.addEventListener('click', handleStationClick);

    stationFiltersContainer.addEventListener('click', e => {
        const filterBtn = e.target.closest('.filter-btn');
        if (filterBtn) {
            activeGroupFilter = filterBtn.dataset.group;
            // Update active class
            stationFiltersContainer.querySelector('.filter-btn.active').classList.remove('active');
            filterBtn.classList.add('active');
            renderStations();
        }
    });

    addProductBtn.addEventListener('click', addProduct);
    productsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-product-btn')) {
            const productId = parseInt(e.target.dataset.id);
            deleteProduct(productId);
        }
    });
    payCashBtn.addEventListener('click', () => {
        const stationId = parseInt(invoiceModal.dataset.stationId);
        if (stationId) finalizeTransaction(stationId, 'cash');
    });

    payCardBtn.addEventListener('click', () => {
        const stationId = parseInt(invoiceModal.dataset.stationId);
        if (stationId) finalizeTransaction(stationId, 'card');
    });

    payTransferBtn.addEventListener('click', () => {
        const stationId = parseInt(invoiceModal.dataset.stationId);
        if (stationId) finalizeTransaction(stationId, 'transfer');
    });

    reportBtn.addEventListener('click', () => {
        applyReportFilters(); // Apply default/empty filters when opening
        showModal(reportModal);
    });

    manualEntryBtn.addEventListener('click', openManualEntryModal);

    settingsBtn.addEventListener('click', () => {
        // Populate settings modal with current values
        defaultRateInput.value = settings.defaultRate;
        document.getElementById('theme-select').value = settings.theme;
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.classList.toggle('selected', swatch.dataset.color === settings.accentColor);
        });
        applyTheme(); // To show/hide accent colors
        showModal(settingsModal);
    });

    document.getElementById('theme-select').addEventListener('change', (e) => {
        settings.theme = e.target.value;
        applyTheme();
    });

    document.querySelector('.color-swatches').addEventListener('click', (e) => {
        const swatch = e.target.closest('.color-swatch');
        if (swatch) {
            settings.accentColor = swatch.dataset.color;
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
            applyTheme();
        }
    });

    saveSettingsBtn.addEventListener('click', () => {
        const newDefaultRate = parseFloat(defaultRateInput.value);
        if (!isNaN(newDefaultRate) && newDefaultRate >= 0) {
            settings.defaultRate = newDefaultRate;
            // Theme and accent are already updated in the settings object by their own listeners
            saveState();
            hideModal(settingsModal);
            alert('تنظیمات ذخیره شد.');
        } else {
            alert('لطفا نرخ پیش‌فرض معتبر وارد کنید.');
        }
    });

    deleteAllHistoryBtn.addEventListener('click', () => {
        if (confirm('آیا از حذف **تمام تاریخچه** مطمئن هستید؟ این عمل غیرقابل بازگشت است!')) {
            history = [];
            nextHistoryId = 1;
            saveState();
            alert('کل تاریخچه با موفقیت پاک شد.');
            // We can also re-render the report if it's open
            if (reportModal.style.display === 'flex') {
                applyReportFilters();
            }
            // Do not close the settings modal, let the user do it.
        }
    });

    // Report filter event listeners
    filterStartDate.addEventListener('change', applyReportFilters);
    filterEndDate.addEventListener('change', applyReportFilters);
    historySearchInput.addEventListener('input', applyReportFilters);

    historyTableBody.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-history-btn');
        if (deleteBtn) {
            const historyId = parseInt(deleteBtn.dataset.id, 10);
            deleteHistoryEntry(historyId);
        }
    });

    exportCsvBtn.addEventListener('click', exportToCSV);
    deleteFilteredBtn.addEventListener('click', deleteFilteredHistory);
    backupBtn.addEventListener('click', backupData);
    restoreInput.addEventListener('change', restoreData);

    productSearchInput.addEventListener('input', (e) => {
        renderProductSelectionList(e.target.value);
    });

    confirmAddProductsBtn.addEventListener('click', () => {
        const stationId = parseInt(addProductsModal.dataset.stationId, 10);
        const station = stations.find(s => s.id === stationId);
        if (!station) return;

        const selectedItems = productSelectionList.querySelectorAll('input[type="checkbox"]:checked');
        selectedItems.forEach(item => {
            const productId = parseInt(item.dataset.productId, 10);
            const product = products.find(p => p.id === productId);
            const quantity = parseInt(item.closest('.product-selection-item').querySelector('.product-quantity-input').value, 10);

            if (product && quantity > 0) {
                for (let i = 0; i < quantity; i++) {
                    station.products.push(product);
                }
            }
        });

        hideModal(addProductsModal);
        renderStations();
        saveState();
    });


    /**
     * Opens the manual entry modal and populates the station list
     */
    function openManualEntryModal() {
        manualStationSelect.innerHTML = '';
        if (stations.length === 0) {
            manualStationSelect.innerHTML = '<option value="">ابتدا یک سیستم اضافه کنید</option>';
            return;
        }
        stations.forEach(station => {
            const option = document.createElement('option');
            option.value = station.id;
            option.textContent = station.name;
            manualStationSelect.appendChild(option);
        });
        showModal(manualEntryModal);
    }

    /**
     * Finalizes a manually entered session
     */
    function finalizeManualEntry() {
        const stationId = parseInt(manualStationSelect.value, 10);
        const startTime = new Date(manualStartTime.value);
        const endTime = new Date(manualEndTime.value);
        const paymentMethod = manualPaymentMethod.value;

        const station = stations.find(s => s.id === stationId);

        if (!stationId || !station || isNaN(startTime) || isNaN(endTime) || endTime <= startTime) {
            alert('لطفا تمام فیلدها را به درستی وارد کنید. زمان پایان باید بعد از زمان شروع باشد.');
            return;
        }

        const duration = endTime.getTime() - startTime.getTime();
        const timeCost = Math.floor((duration / (1000 * 60 * 60)) * station.rate);

        const historyRecord = {
            id: nextHistoryId++,
            stationName: station.name,
            date: endTime.toISOString(),
            timeCost,
            productsCost: 0, // Manual entry does not include products for now
            totalCost: timeCost,
            totalProfit: timeCost, // For manual entry, profit equals time cost
            paymentMethod,
            products: [],
            duration
        };
        history.push(historyRecord);

        manualStartTime.value = '';
        manualEndTime.value = '';
        hideModal(manualEntryModal);
        saveState();
        alert('جلسه دستی با موفقیت ثبت شد.');
    }


    /**
     * Creates a JSON backup file of the entire app state and downloads it.
     */
    function backupData() {
        const stateToSave = { settings, stations, products, history, nextStationId, nextProductId, nextHistoryId };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stateToSave, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `gamenet_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        alert('فایل پشتیبان با موفقیت ایجاد شد.');
    }

    /**
     * Reads a JSON backup file and restores the app state from it.
     * @param {Event} event
     */
    function restoreData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const state = JSON.parse(e.target.result);
                // Basic validation
                if (state && state.settings && state.stations && state.history) {
                    if (confirm('آیا مطمئن هستید؟ تمام اطلاعات فعلی با اطلاعات فایل پشتیبان جایگزین خواهد شد.')) {
                        // Replace current state with restored state
                        settings = state.settings;
                        stations = state.stations;
                        products = state.products;
                        history = state.history;
                        nextStationId = state.nextStationId;
                        nextProductId = state.nextProductId;
                        nextHistoryId = state.nextHistoryId;

                        saveState();
                        alert('اطلاعات با موفقیت بازیابی شد. صفحه مجددا بارگذاری می‌شود.');
                        location.reload();
                    }
                } else {
                    alert('فایل پشتیبان معتبر نیست.');
                }
            } catch (error) {
                alert('خطا در خواندن فایل. لطفا از معتبر بودن فایل پشتیبان اطمینان حاصل کنید.');
                console.error("Error parsing restore file:", error);
            }
        };
        reader.readAsText(file);
        // Clear the input value so the same file can be selected again
        event.target.value = '';
    }


    /**
     * Efficiently updates the display of a single running station card without re-rendering.
     * @param {object} station
     */
    function updateLiveStationData(station) {
        const stationCard = stationsContainer.querySelector(`[data-id="${station.id}"]`);
        if (!stationCard || station.isEditing) return; // Don't update if not found or in edit mode

        let timeToDisplay = 0;
        let isTimeUp = false;

        if (station.isCountdown) {
            const elapsedTime = station.startTime ? Date.now() - station.startTime : 0;
            timeToDisplay = station.duration - station.elapsedTime - elapsedTime;
            if (timeToDisplay < 0) timeToDisplay = 0;

            if (station.startTime && timeToDisplay === 0 && !station.alarmPlayed) {
                isTimeUp = true;
                playSound(station.alarmSound);
                station.alarmPlayed = true;
                stopTimer(station, true);
                renderStations(); // Re-render once to show stopped state
            }
            stationCard.classList.toggle('warning', timeToDisplay > 0 && timeToDisplay < 5 * 60 * 1000);
            stationCard.classList.toggle('times-up', isTimeUp);

            const progressBar = stationCard.querySelector('.progress-bar-inner');
            if (progressBar) {
                progressBar.style.width = `${(timeToDisplay / station.duration) * 100}%`;
            }
        } else {
            timeToDisplay = Date.now() - station.startTime + station.elapsedTime;
        }

        const timeCost = calculateTimeCost(station);
        const productsCost = station.products.reduce((total, p) => total + p.price, 0);
        const totalCost = timeCost + productsCost;

        stationCard.querySelector('.time-display').textContent = formatTime(timeToDisplay);
        stationCard.querySelector('.cost-display').textContent = `${totalCost.toLocaleString('fa-IR')} تومان`;
    }

    // --- Master Timer Loop ---
    setInterval(() => {
        stations.forEach(station => {
            if (station.startTime) {
                updateLiveStationData(station);
            }
        });
    }, 1000);


    /**
     * Renders a chart for the report data
     * @param {Array} historyData
     */
    function renderReportChart(historyData) {
        if (reportChartInstance) {
            reportChartInstance.destroy();
        }

        const dataByDate = historyData.reduce((acc, item) => {
            const date = new Date(item.date).toLocaleDateString('fa-IR');
            if (!acc[date]) {
                acc[date] = { revenue: 0, profit: 0 };
            }
            acc[date].revenue += item.totalCost;
            acc[date].profit += item.totalProfit || 0;
            return acc;
        }, {});

        const labels = Object.keys(dataByDate);
        const revenueData = Object.values(dataByDate).map(d => d.revenue);
        const profitData = Object.values(dataByDate).map(d => d.profit);

        const ctx = document.getElementById('report-chart').getContext('2d');
        reportChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'درآمد کل',
                        data: revenueData,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'سود کل',
                        data: profitData,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('fa-IR') + ' تومان';
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toLocaleString('fa-IR') + ' تومان';
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }


    // --- Initial Load & Render ---
    dbHelper.initDB().then(() => {
        console.log("Database initialized successfully.");
        loadState();
        applyTheme(); // Apply saved theme on startup
        renderGroupFilters();
        renderStations();
        renderProducts();
    }).catch(error => {
        console.error("Failed to initialize database:", error);
        alert("خطا در راه اندازی پایگاه داده. زنگ سفارشی کار نخواهد کرد.");
        // Still load the rest of the app
        loadState();
        applyTheme();
        renderGroupFilters();
        renderStations();
        renderProducts();
    });
});

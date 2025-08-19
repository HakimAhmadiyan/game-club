document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const stationsContainer = document.getElementById('stations-container');
    const addStationBtn = document.getElementById('add-station-btn');
    const addStationModal = document.getElementById('add-station-modal');
    const closeModalBtns = document.querySelectorAll('.close-btn');
    const confirmAddStationBtn = document.getElementById('confirm-add-station-btn');
    const stationNameInput = document.getElementById('station-name-input');
    const stationRateInput = document.getElementById('station-rate-input');
    const stationDurationInput = document.getElementById('station-duration-input');
    const themeToggle = document.getElementById('theme-toggle');
    const productsList = document.getElementById('products-list');
    const addProductBtn = document.getElementById('add-product-btn');
    const productNameInput = document.getElementById('product-name-input');
    const productPriceInput = document.getElementById('product-price-input');
    const invoiceModal = document.getElementById('invoice-modal');
    const invoiceDetails = document.getElementById('invoice-details');
    const payCashBtn = document.getElementById('pay-cash-btn');
    const payCardBtn = document.getElementById('pay-card-btn');
    const reportBtn = document.getElementById('report-btn');
    const reportModal = document.getElementById('report-modal');
    const statsTodayRevenue = document.getElementById('stats-today-revenue');
    const statsTotalRevenue = document.getElementById('stats-total-revenue');
    const statsTotalTransactions = document.getElementById('stats-total-transactions');
    const historyTableBody = document.getElementById('history-table-body');


    // --- State ---
    let stations = [];
    let products = [];
    let history = [];
    let nextStationId = 1;
    let nextProductId = 1;
    let isFinalizing = false; // Guard to prevent double-firing transactions

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
        localStorage.setItem('gameNetState', JSON.stringify({ stations: stationsToSave, products, history, nextStationId, nextProductId }));
    }

    /**
     * Loads state from localStorage
     */
    function loadState() {
        const savedState = localStorage.getItem('gameNetState');
        if (savedState) {
            const state = JSON.parse(savedState);
            stations = state.stations || [];
            products = state.products || [];
            history = state.history || [];
            nextStationId = state.nextStationId || 1;
            nextProductId = state.nextProductId || 1;

            // Recalculate time for running timers
            stations.forEach(station => {
                if (station.startTime) {
                    // Timer was running when page was closed.
                    // Add the offline time to elapsedTime and restart the interval.
                    // This is a simplification. A more robust solution would store the last known time.
                    // For this app, we assume if it was running, it's still running.
                    // Let's restart the interval to keep the UI updating.
                    station.timerInterval = setInterval(() => renderStations(), 1000);
                }
            });
        }
    }

    /**
     * Toggles between light and dark theme
     */
    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('gameNetTheme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
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
     * Renders all stations to the DOM
     */
    function renderStations() {
        stationsContainer.innerHTML = '';
        stations.forEach(station => {
            const stationCard = document.createElement('div');
            stationCard.className = 'station-card';
            stationCard.dataset.id = station.id;

            if (station.isEditing) {
                // --- EDIT MODE ---
                stationCard.innerHTML = `
                    <div class="station-edit-view">
                        <input type="text" class="edit-station-name" value="${station.name}" placeholder="نام سیستم">
                        <input type="number" class="edit-station-rate" value="${station.rate}" placeholder="نرخ ساعتی (تومان)">
                        <div class="controls">
                            <button class="save-station-btn" title="ذخیره"><i class="fas fa-save"></i></button>
                            <button class="cancel-edit-btn" title="لغو"><i class="fas fa-times"></i></button>
                        </div>
                    </div>
                `;
            } else {
                // --- DISPLAY MODE ---
                let timeToDisplay = 0;
                let isTimeUp = false;

                if (station.isCountdown) {
                    const elapsedTime = station.startTime ? Date.now() - station.startTime : 0;
                    timeToDisplay = station.duration - station.elapsedTime - elapsedTime;
                    if (timeToDisplay < 0) timeToDisplay = 0;

                    if (station.startTime && timeToDisplay === 0) {
                        isTimeUp = true;
                        // Automatically stop the timer when time is up
                        stopTimer(station, true);
                    }

                    if (timeToDisplay > 0 && timeToDisplay < 5 * 60 * 1000) { // 5 minutes warning
                        stationCard.classList.add('warning');
                    }
                    if (isTimeUp) {
                        stationCard.classList.add('times-up');
                    }

                } else {
                    timeToDisplay = station.startTime ? Date.now() - station.startTime + station.elapsedTime : station.elapsedTime;
                }

                const formattedTime = formatTime(timeToDisplay);
                const timeCost = calculateTimeCost(station);
                const productsCost = station.products.reduce((total, p) => total + p.price, 0);
                const totalCost = timeCost + productsCost;

                const progressPercentage = station.isCountdown ? (timeToDisplay / station.duration) * 100 : 0;

                stationCard.innerHTML = `
                    <h3>${station.name} ${station.isCountdown ? '(پیش‌پرداخت)' : ''}</h3>
                    <p><small>نرخ: ${station.rate.toLocaleString('fa-IR')} تومان/ساعت</small></p>
                    <div class="time-display">${formattedTime}</div>
                    ${station.isCountdown ? `
                        <div class="progress-bar-container">
                            <div class="progress-bar-inner" style="width: ${progressPercentage}%;"></div>
                        </div>
                    ` : ''}
                    <div class="cost-display">${totalCost.toLocaleString('fa-IR')} تومان</div>
                    <div class="station-products">
                        <small>محصولات خریداری شده:</small>
                        <ul class="purchased-products-list">
                            ${station.products.map(p => `<li>${p.name} (${p.price.toLocaleString('fa-IR')} تومان)</li>`).join('') || '<li>-</li>'}
                        </ul>
                    </div>
                    <div class="controls">
                        ${
                            station.startTime
                                ? `<button class="stop-btn" title="توقف"><i class="fas fa-pause"></i></button>`
                                : `<button class="start-btn" title="شروع"><i class="fas fa-play"></i></button>`
                        }
                        <button class="add-product-to-station-btn" title="افزودن محصول"><i class="fas fa-cart-plus"></i></button>
                        <button class="invoice-btn" title="صدور فاکتور"><i class="fas fa-file-invoice"></i></button>
                        <button class="edit-station-btn" title="ویرایش"><i class="fas fa-pencil-alt"></i></button>
                        <button class="delete-station-btn" title="حذف"><i class="fas fa-trash-alt"></i></button>
                    </div>
                `;
            }
            stationsContainer.appendChild(stationCard);
        });
    }

    /**
     * Adds a new station
     */
    function addStation() {
        const name = stationNameInput.value.trim();
        const rate = parseFloat(stationRateInput.value);
        const duration = parseInt(stationDurationInput.value, 10);

        if (name && !isNaN(rate) && rate >= 0) {
            const newStation = {
                id: nextStationId++,
                name,
                rate,
                startTime: null,
                elapsedTime: 0,
                timerInterval: null,
                products: [],
                isEditing: false,
                isCountdown: !isNaN(duration) && duration > 0,
                duration: (!isNaN(duration) && duration > 0) ? duration * 60 * 1000 : 0,
            };
            stations.push(newStation);
            stationNameInput.value = '';
            stationRateInput.value = '';
            stationDurationInput.value = '';
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
        productsList.innerHTML = '';
        if (products.length === 0) {
            productsList.innerHTML = '<p>محصولی برای نمایش وجود ندارد.</p>';
            return;
        }
        products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.innerHTML = `
                <span class="product-info">${product.name} - ${product.price.toLocaleString('fa-IR')} تومان</span>
                <button class="delete-product-btn" data-id="${product.id}">&times;</button>
            `;
            productsList.appendChild(productItem);
        });
    }

    /**
     * Adds a new product to the available products list
     */
    function addProduct() {
        const name = productNameInput.value.trim();
        const price = parseFloat(productPriceInput.value);

        if (name && !isNaN(price) && price > 0) {
            const newProduct = {
                id: nextProductId++,
                name,
                price
            };
            products.push(newProduct);
            productNameInput.value = '';
            productPriceInput.value = '';
            renderProducts();
            saveState();
        } else {
            alert('لطفا نام و قیمت معتبر برای محصول وارد کنید.');
        }
    }

    /**
     * Opens a modal to add a product to a specific station
     * @param {object} station
     */
    function openAddProductToStationModal(station) {
        // For simplicity, we'll use a prompt for now.
        // A better UI would be a custom modal listing all available products.
        if (products.length === 0) {
            alert('ابتدا باید محصولی را در بخش محصولات تعریف کنید.');
            return;
        }

        let productPromptMsg = 'کدام محصول را می‌خواهید اضافه کنید؟\n\n';
        products.forEach((p, index) => {
            productPromptMsg += `${index + 1}: ${p.name} (${p.price.toLocaleString('fa-IR')} تومان)\n`;
        });

        const choiceIndex = parseInt(prompt(productPromptMsg)) - 1;

        if (!isNaN(choiceIndex) && choiceIndex >= 0 && choiceIndex < products.length) {
            const selectedProduct = products[choiceIndex];
            station.products.push(selectedProduct);
            renderStations();
            saveState();
        } else {
            alert('انتخاب نامعتبر.');
        }
    }

    /**
     * Handles clicks within the stations container (start, stop, etc.)
     * @param {Event} e
     */
    function handleStationClick(e) {
        const stationCard = e.target.closest('.station-card');
        if (!stationCard) return;

        const stationId = parseInt(stationCard.dataset.id);
        const station = stations.find(s => s.id === stationId);

        if (e.target.classList.contains('start-btn')) {
            startTimer(station);
        } else if (e.target.classList.contains('stop-btn')) {
            stopTimer(station);
        } else if (e.target.classList.contains('reset-btn')) {
            // Note: The reset button was removed in the new design to avoid accidental resets.
            // If needed, it can be re-added. For now, we handle invoice generation.
            // resetTimer(station);
        } else if (e.target.classList.contains('add-product-to-station-btn')) {
            openAddProductToStationModal(station);
        } else if (e.target.classList.contains('invoice-btn')) {
            generateInvoice(station);
        } else if (e.target.classList.contains('delete-station-btn')) {
            deleteStation(stationId);
        } else if (e.target.classList.contains('edit-station-btn')) {
            station.isEditing = true;
            renderStations();
        } else if (e.target.classList.contains('cancel-edit-btn')) {
            station.isEditing = false;
            renderStations();
        } else if (e.target.classList.contains('save-station-btn')) {
            saveStationEdits(stationId, stationCard);
        }
    }

    /**
     * Saves the edited data for a station
     * @param {number} stationId
     * @param {HTMLElement} stationCard
     */
    function saveStationEdits(stationId, stationCard) {
        const station = stations.find(s => s.id === stationId);
        const newName = stationCard.querySelector('.edit-station-name').value.trim();
        const newRate = parseFloat(stationCard.querySelector('.edit-station-rate').value);

        if (newName && !isNaN(newRate) && newRate > 0) {
            station.name = newName;
            station.rate = newRate;
            station.isEditing = false;
            renderStations();
            saveState();
        } else {
            alert('لطفا نام و نرخ ساعتی معتبر وارد کنید.');
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
     */
    function startTimer(station) {
        if (station.startTime) return; // Already running

        station.startTime = Date.now();
        station.timerInterval = setInterval(() => {
            renderStations(); // Re-render to update time and cost
        }, 1000);
        renderStations(); // Immediate re-render to change button state
        saveState();
    }

    /**
     * Stops the timer for a station
     * @param {object} station
     * @param {boolean} silent - If true, won't re-render, to prevent infinite loops.
     */
    function stopTimer(station, silent = false) {
        if (!station.startTime) return; // Already stopped

        clearInterval(station.timerInterval);
        station.elapsedTime += Date.now() - station.startTime;

        if (station.isCountdown && station.elapsedTime > station.duration) {
            station.elapsedTime = station.duration;
        }

        station.startTime = null;
        station.timerInterval = null;

        if (!silent) {
            renderStations();
            saveState();
        }
    }

    /**
     * Resets the timer for a station
     * @param {object} station
     */
    function resetTimer(station) {
        if (station.startTime) {
            stopTimer(station);
        }
        station.elapsedTime = 0;
        renderStations();
        saveState();
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

        const historyRecord = {
            stationName: station.name,
            date: new Date().toISOString(),
            timeCost,
            productsCost,
            totalCost: timeCost + productsCost,
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


    // --- Event Listeners ---
    themeToggle.addEventListener('change', toggleTheme);
    addStationBtn.addEventListener('click', () => showModal(addStationModal));
    closeModalBtns.forEach(btn => btn.addEventListener('click', (e) => hideModal(e.target.closest('.modal'))));
    confirmAddStationBtn.addEventListener('click', addStation);
    stationsContainer.addEventListener('click', handleStationClick);
    addProductBtn.addEventListener('click', addProduct);
    productsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-product-btn')) {
            const productId = parseInt(e.target.dataset.id);
            deleteProduct(productId);
        }
    });
    /**
     * Processes history and renders the report modal
     */
    function renderReport() {
        // Stats
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

        const todayHistory = history.filter(item => item.date >= todayStart);

        const todayRevenue = todayHistory.reduce((sum, item) => sum + item.totalCost, 0);
        const totalRevenue = history.reduce((sum, item) => sum + item.totalCost, 0);

        statsTodayRevenue.textContent = `${todayRevenue.toLocaleString('fa-IR')} تومان`;
        statsTotalRevenue.textContent = `${totalRevenue.toLocaleString('fa-IR')} تومان`;
        statsTotalTransactions.textContent = history.length.toLocaleString('fa-IR');

        // History Table
        historyTableBody.innerHTML = '';
        [...history].reverse().forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.stationName}</td>
                <td>${new Date(item.date).toLocaleString('fa-IR')}</td>
                <td>${formatTime(item.duration)}</td>
                <td>${item.paymentMethod === 'cash' ? 'نقدی' : 'کارت'}</td>
                <td>${item.totalCost.toLocaleString('fa-IR')} تومان</td>
            `;
            historyTableBody.appendChild(row);
        });
    }


    // --- Event Listeners ---
    themeToggle.addEventListener('change', toggleTheme);
    addStationBtn.addEventListener('click', () => showModal(addStationModal));
    closeModalBtns.forEach(btn => btn.addEventListener('click', (e) => hideModal(e.target.closest('.modal'))));
    confirmAddStationBtn.addEventListener('click', addStation);
    stationsContainer.addEventListener('click', handleStationClick);
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

    reportBtn.addEventListener('click', () => {
        renderReport();
        showModal(reportModal);
    });

    // --- Initial Load & Render ---
    loadState();
    const savedTheme = localStorage.getItem('gameNetTheme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
    }
    renderStations();
    renderProducts();
});

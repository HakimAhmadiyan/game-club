document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const stationsContainer = document.getElementById('stations-container');
    const addStationBtn = document.getElementById('add-station-btn');
    const addStationModal = document.getElementById('add-station-modal');
    const closeModalBtns = document.querySelectorAll('.close-btn');
    const confirmAddStationBtn = document.getElementById('confirm-add-station-btn');
    const stationNameInput = document.getElementById('station-name-input');
    const stationRateInput = document.getElementById('station-rate-input');
    const themeToggle = document.getElementById('theme-toggle');
    const productsList = document.getElementById('products-list');
    const addProductBtn = document.getElementById('add-product-btn');
    const productNameInput = document.getElementById('product-name-input');
    const productPriceInput = document.getElementById('product-price-input');
    const invoiceModal = document.getElementById('invoice-modal');
    const invoiceDetails = document.getElementById('invoice-details');


    // --- State ---
    let stations = [];
    let products = [];
    let nextStationId = 1;
    let nextProductId = 1;

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
        localStorage.setItem('gameNetState', JSON.stringify({ stations: stationsToSave, products, nextStationId, nextProductId }));
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
            stationCard.className = 'station-card glass';
            stationCard.dataset.id = station.id;

            const elapsedTime = station.startTime ? Date.now() - station.startTime + station.elapsedTime : station.elapsedTime;
            const formattedTime = formatTime(elapsedTime);
            const totalCost = calculateTotalCost(station);

            stationCard.innerHTML = `
                <h3>${station.name}</h3>
                <div class="time-display">${formattedTime}</div>
                <div class="cost-display">${totalCost.toLocaleString('fa-IR')} تومان</div>
                <div class="station-products">
                    <small>محصولات خریداری شده:</small>
                    <ul class="purchased-products-list">
                        ${station.products.map(p => `<li>${p.name} (${p.price.toLocaleString('fa-IR')} تومان)</li>`).join('') || '<li>-</li>'}
                    </ul>
                </div>
                <div class="controls">
                    <button class="start-btn" ${station.startTime ? 'disabled' : ''}>شروع</button>
                    <button class="stop-btn" ${!station.startTime ? 'disabled' : ''}>توقف</button>
                    <button class="add-product-to-station-btn">افزودن محصول</button>
                    <button class="invoice-btn">صدور فاکتور</button>
                </div>
            `;
            stationsContainer.appendChild(stationCard);
        });
    }

    /**
     * Adds a new station
     */
    function addStation() {
        const name = stationNameInput.value.trim();
        const rate = parseFloat(stationRateInput.value);

        if (name && !isNaN(rate) && rate > 0) {
            const newStation = {
                id: nextStationId++,
                name,
                rate,
                startTime: null, // timestamp when timer starts
                elapsedTime: 0, // ms
                timerInterval: null,
                products: [], // Array of product objects
            };
            stations.push(newStation);
            stationNameInput.value = '';
            stationRateInput.value = '';
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
                <span>${product.name}</span>
                <span>${product.price.toLocaleString('fa-IR')} تومان</span>
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
            showInvoice(station);
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
     */
    function stopTimer(station) {
        if (!station.startTime) return; // Already stopped

        clearInterval(station.timerInterval);
        station.elapsedTime += Date.now() - station.startTime;
        station.startTime = null;
        station.timerInterval = null;
        renderStations();
        saveState();
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
    function calculateTotalCost(station) {
        const elapsedTime = station.startTime ? Date.now() - station.startTime + station.elapsedTime : station.elapsedTime;
        const timeCost = (elapsedTime / (1000 * 60 * 60)) * station.rate;
        const productsCost = station.products.reduce((total, p) => total + p.price, 0);
        return Math.floor(timeCost + productsCost);
    }

    /**
     * Shows the final invoice for a station and resets it.
     * @param {object} station
     */
    function showInvoice(station) {
        // Stop the timer if it's running
        if (station.startTime) {
            stopTimer(station);
        }

        const timeCost = Math.floor((station.elapsedTime / (1000 * 60 * 60)) * station.rate);
        const productsCost = station.products.reduce((total, p) => total + p.price, 0);
        const totalCost = timeCost + productsCost;

        invoiceDetails.innerHTML = `
            <h4>فاکتور برای: ${station.name}</h4>
            <p>مدت زمان استفاده: ${formatTime(station.elapsedTime)}</p>
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
        showModal(invoiceModal);

        // Reset the station after showing the invoice
        station.elapsedTime = 0;
        station.products = [];
        renderStations();
        saveState();
    }


    // --- Event Listeners ---
    themeToggle.addEventListener('change', toggleTheme);
    addStationBtn.addEventListener('click', () => showModal(addStationModal));
    closeModalBtns.forEach(btn => btn.addEventListener('click', (e) => hideModal(e.target.closest('.modal'))));
    confirmAddStationBtn.addEventListener('click', addStation);
    stationsContainer.addEventListener('click', handleStationClick);
    addProductBtn.addEventListener('click', addProduct);

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

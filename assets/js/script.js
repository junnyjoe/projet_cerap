/**
 * script.js — CERAP Éditions
 * Logiciel Principal : Catalogue, Panier, Recherche et UI
 * Version : 2.1 (Production Ready)
 */

(function() {
    // --- Configuration Supabase ---
    let supabase = window.supabaseClient;

    // --- État Global ---
    let allBooks = [];
    let filteredBooks = [];
    let cart = [];

    // --- Initialisation au DOMContentLoaded ---
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('🚀 CERAP Editions - Script Initialisé');

        // Rafraîchir la référence Supabase (au cas où chargé via defer)
        supabase = window.supabaseClient;

        // 1. Charger les utilitaires de base
        if (window.Utils) {
            window.Utils.initScrollReveals();
        }

        // 2. Charger le panier
        loadCart();
        updateCartUI();

        // 3. Charger les données (Livres)
        await fetchAllBooks();
        updateHeroStats();

        // 4. Initialiser les composants UI
        initMobileMenu();
        initNavSearch();

        // 5. Logique spécifique à la page
        initPageSpecificLogic();
    });

    // --- Fonctions d'Initialisation ---
    function initMobileMenu() {
        const toggle = document.querySelector('[data-js="mobile-menu-toggle"]');
        const menu = document.getElementById('mobileNav');
        if (toggle && menu) {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.classList.toggle('active');
                const isOpen = menu.classList.contains('active');
                toggle.setAttribute('aria-expanded', isOpen);
            });
            // Fermer au clic extérieur
            document.addEventListener('click', () => menu.classList.remove('active'));
        }
    }

    function initNavSearch() {
        const searchInput = document.querySelector('.nav-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const val = e.target.value;
                if (window.location.pathname.includes('librairie.html')) {
                    filterBySearch(val);
                }
            });
        }
    }

    function initPageSpecificLogic() {
        // Accueil
        if (document.getElementById('newArrivalsGrid')) {
            renderNewArrivals();
        }
        // Boutique
        if (document.getElementById('booksGrid')) {
            renderFullCatalog();
        }
        // Ligne Éditoriale (Sélection aléatoire)
        if (document.getElementById('randomBooksList')) {
            renderRandomBooks();
        }
    }

    // --- Data Fetching ---
    async function fetchAllBooks() {
        try {
            if (supabase) {
                const { data, error } = await supabase
                    .from('books')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                allBooks = data;
                filteredBooks = [...allBooks];
            } else {
                // Fallback local
                const res = await fetch('./data/books.json');
                allBooks = await res.json();
                filteredBooks = [...allBooks];
            }
        } catch (err) {
            console.error('❌ Erreur de chargement:', err);
            showToast('Erreur lors du chargement du catalogue.');
        }
    }

    function updateHeroStats() {
        const booksEl = document.getElementById('heroBooksCount');
        const authorsEl = document.getElementById('heroAuthorsCount');
        
        if (booksEl && allBooks.length > 0) {
            booksEl.textContent = allBooks.length;
            // Optionnel: On peut ajouter un '+' si c'est significatif
            if (allBooks.length > 10) booksEl.textContent += '+';
        }
        
        if (authorsEl && allBooks.length > 0) {
            const uniqueAuthors = new Set(allBooks.map(b => b.author)).size;
            authorsEl.textContent = uniqueAuthors;
            if (uniqueAuthors > 5) authorsEl.textContent += '+';
        }
    }

    // --- Rendu des Composants ---
    function createBookCard(b) {
        const formattedPrice = window.Utils ? window.Utils.formatCurrency(b.price) : `${b.price} XOF`;
        const isNew = b.is_new ? '<span class="book-badge">Nouveauté</span>' : '';
        
        return `
            <div class="book-card js-reveal" data-reveal onclick="showBookDetails('${b.id}')">
                <div class="book-image-container">
                    <img src="${b.cover_url}" alt="${b.title}" loading="lazy">
                    <div class="book-actions-overlay">
                        <button class="action-btn" onclick="event.stopPropagation(); addToCart('${b.id}', '${b.title}', ${b.price}, '${b.cover_url}')" title="Ajouter au panier">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                        </button>
                    </div>
                    ${isNew}
                </div>
                <div class="book-info">
                    <div class="book-category">${b.category || 'Général'}</div>
                    <h3 class="book-title">${b.title}</h3>
                    <div class="book-author">${b.author}</div>
                    <div class="book-price-row">
                        <span class="price-val">XOF: ${b.price.toLocaleString()}</span>
                        <span class="stock-status ${b.status === 'En stock' ? 'in-stock' : 'low-stock'}">${b.status || 'Disponible'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    function renderNewArrivals() {
        const grid = document.getElementById('newArrivalsGrid');
        if (!grid) return;
        const subset = allBooks.slice(0, 4);
        grid.innerHTML = subset.map(b => createBookCard(b)).join('');
        if (window.Utils) window.Utils.initScrollReveals();
    }

    function renderFullCatalog() {
        const grid = document.getElementById('booksGrid');
        if (!grid) return;
        if (filteredBooks.length === 0) {
            grid.innerHTML = `
                <div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 80px 20px;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" style="margin: 0 auto 20px; display: block;">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M8 11h6"/></svg>
                    <p style="font-size: 1.1rem; font-weight: 700; color: var(--navy); margin-bottom: 8px;">Aucun ouvrage trouv\u00e9</p>
                    <p style="color: #64748b; font-size: 0.95rem; margin-bottom: 24px;">Aucun r\u00e9sultat ne correspond \u00e0 vos crit\u00e8res de recherche.</p>
                    <button class="btn-secondary" onclick="window.filterByGenre('all'); document.getElementById('libSearchInput').value=''; document.getElementById('priceSort') && (document.getElementById('priceSort').value='default');" style="color:var(--navy);">
                        R\u00e9initialiser les filtres
                    </button>
                </div>`;
            return;
        }
        grid.innerHTML = filteredBooks.map(b => createBookCard(b)).join('');
        if (window.Utils) window.Utils.initScrollReveals();
    }

    function renderRandomBooks() {
        const grid = document.getElementById('randomBooksList');
        if (!grid || allBooks.length === 0) return;
        const shuffled = [...allBooks].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3);
        grid.innerHTML = selected.map(b => createBookCard(b)).join('');
        if (window.Utils) window.Utils.initScrollReveals();
    }

    // --- Panier (Cart) ---
    function loadCart() {
        try {
            const saved = localStorage.getItem('cerap_cart');
            if (saved) {
                cart = JSON.parse(saved);
                console.log('📦 Panier chargé:', cart.length, 'articles');
            }
        } catch (err) {
            console.error('❌ Erreur chargement panier:', err);
            cart = [];
        }
    }

    function saveCart() {
        try {
            localStorage.setItem('cerap_cart', JSON.stringify(cart));
        } catch (err) {
            console.error('❌ Erreur sauvegarde panier:', err);
        }
    }

    function updateCartUI() {
        const countEls = document.querySelectorAll('#cartCount');
        const itemsContainer = document.getElementById('cartItems');
        const totalEl = document.getElementById('cartTotal');
        
        const totalCount = cart.reduce((sum, i) => sum + i.quantity, 0);
        countEls.forEach(el => el.textContent = totalCount);

        if (!itemsContainer) return;

        if (cart.length === 0) {
            itemsContainer.innerHTML = '<div class="empty-cart-msg">Votre panier est vide.</div>';
            if (totalEl) totalEl.textContent = '0 F';
            return;
        }

        itemsContainer.innerHTML = cart.map(i => `
            <div class="cart-item">
                <img src="${i.cover}" alt="${i.title}">
                <div class="cart-item-info">
                    <div class="cart-item-title">${i.title}</div>
                    <div class="cart-item-price">${i.price.toLocaleString()} F</div>
                    <div class="cart-item-qty">
                        <button onclick="updateQty('${i.id}', -1)">-</button>
                        <span>${i.quantity}</span>
                        <button onclick="updateQty('${i.id}', 1)">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart('${i.id}')">&times;</button>
            </div>
        `).join('');

        const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        if (totalEl) totalEl.textContent = `${total.toLocaleString()} F`;
    }

    // --- Exports Globaux (window) ---
    window.addToCart = function(id, title, price, cover) {
        // Sanitize price (handle strings like "9 500 F CFA")
        let cleanPrice = price;
        if (typeof price === 'string') {
            cleanPrice = parseInt(price.replace(/[^0-9]/g, '')) || 0;
        }

        const existing = cart.find(i => i.id === id);
        if (existing) {
            existing.quantity++;
        } else {
            cart.push({ id, title, price: cleanPrice, cover, quantity: 1 });
        }
        saveCart();
        updateCartUI();
        window.toggleCart(true);
        showToast(`"${title}" ajouté au panier`);
    };

    window.removeFromCart = function(id) {
        cart = cart.filter(i => i.id !== id);
        saveCart();
        updateCartUI();
    };

    window.updateQty = function(id, delta) {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) window.removeFromCart(id);
            else {
                saveCart();
                updateCartUI();
            }
        }
    };

    window.toggleCart = function(force) {
        const panel = document.getElementById('cartPanel');
        if (!panel) return;
        if (force === true) panel.classList.add('active');
        else if (force === false) panel.classList.remove('active');
        else panel.classList.toggle('active');
    };

    window.checkout = function() {
        if (cart.length === 0) {
            showToast('Votre panier est vide.');
            return;
        }
        
        const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        const modal = document.getElementById('checkoutModal');
        const totalDisplay = document.getElementById('checkoutTotal');
        
        if (modal && totalDisplay) {
            totalDisplay.textContent = total.toLocaleString() + ' F CFA';
            modal.classList.add('active');
            window.toggleCart(false);
        } else {
            // Fallback: direct CinetPay if modal is missing
            startCinetPay(total);
        }
    };

    window.selectPayMethod = function(method, el) {
        document.querySelectorAll('.pay-method').forEach(m => m.classList.remove('active'));
        el.classList.add('active');
        
        const fields = document.getElementById('paymentFields');
        const phone = document.getElementById('phoneField');
        const card = document.getElementById('cardFields');
        
        fields.style.display = 'block';
        if (method === 'card') {
            phone.style.display = 'none';
            card.style.display = 'block';
        } else {
            phone.style.display = 'block';
            card.style.display = 'none';
        }
        window.selectedPaymentMethod = method;
    };

    window.confirmPayment = function() {
        const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        const phoneInput = document.getElementById('payPhone');
        const phone = phoneInput ? phoneInput.value : '';
        
        startCinetPay(total, phone);
    };

    function startCinetPay(total, phone = '') {
        if (typeof CinetPay === 'undefined') {
            showToast('Passerelle de paiement indisponible.');
            return;
        }

        const transId = 'CERAP-' + Date.now();

        CinetPay.setConfig({
            apikey: 'YOUR_API_KEY', 
            site_id: 'YOUR_SITE_ID', 
            notify_url: 'https://mondomaine.com/notify/'
        });

        CinetPay.getCheckout({
            transaction_id: transId,
            amount: total,
            currency: 'XOF',
            channels: 'ALL',
            description: 'Commande CERAP Éditions',
            customer_name: "Client",
            customer_surname: "CERAP",
            customer_email: "client@cerap.org",
            customer_phone_number: phone || "00000000",
            customer_address: "Abidjan",
            customer_city: "Abidjan",
            customer_country: "CI",
            customer_state: "CI",
            customer_zip_code: "00225"
        });

        CinetPay.waitResponse(async (data) => {
            if (data.status === "ACCEPTED") {
                showToast('Paiement réussi !');
                await saveOrder(transId, total, data);
                cart = [];
                saveCart();
                updateCartUI();
                window.toggleCart(false);
            } else {
                showToast('Échec du paiement.');
            }
        });
    };

    async function saveOrder(transId, amount, paymentData) {
        if (!supabase) {
            console.error('❌ Supabase non initialisé. Commande non enregistrée en DB.');
            return;
        }
        try {
            await supabase.from('orders').insert([{
                transaction_id: transId,
                amount: amount,
                items: cart,
                payment_status: paymentData.status,
                created_at: new Date()
            }]);
        } catch (err) {
            console.error('Erreur SQL:', err);
        }
    }

    window.showBookDetails = async (id) => {
        const book = allBooks.find(b => b.id == id);
        if (!book) return;

        let modal = document.getElementById('bookModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'bookModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="bookModalTitle">
                <button class="modal-close" id="modalCloseBtn" onclick="closeModal()" aria-label="Fermer le modal">&times;</button>
                <div class="modal-body-grid">
                    <div class="modal-img">
                        <img src="${book.cover_url}" alt="Couverture de ${book.title}">
                    </div>
                    <div class="modal-info">
                        <span class="modal-cat">${book.category || 'Général'}</span>
                        <h2 class="modal-title" id="bookModalTitle">${book.title}</h2>
                        <div class="modal-author">Par ${book.author}</div>
                        <div class="modal-desc">${book.description || 'Une exploration approfondie des enjeux contemporains à travers le prisme de l\'excellence académique.'}</div>
                        <div class="modal-meta">
                            <span>ISBN: ${book.isbn || 'En cours'}</span>
                            <span>Pages: ${book.pages || 'N/A'}</span>
                        </div>
                        <div class="modal-price">${book.price.toLocaleString()} XOF</div>
                        <button class="btn-primary" id="modalAddBtn" onclick="addToCart('${book.id}', '${book.title}', ${book.price}, '${book.cover_url}'); closeModal();">Ajouter au panier</button>
                    </div>
                </div>
            </div>
        `;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Focus trap: focus the close button when modal opens
        const closeBtn = modal.querySelector('#modalCloseBtn');
        if (closeBtn) closeBtn.focus();

        // Trap focus inside modal
        modal._trapHandler = function(e) {
            if (e.key !== 'Tab') return;
            const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus(); }
            } else {
                if (document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        };
        document.addEventListener('keydown', modal._trapHandler);
    };

    window.closeModal = (id) => {
        const modal = id ? document.getElementById(id) : document.querySelector('.modal-overlay.active');
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            // Remove focus trap listener
            if (modal._trapHandler) {
                document.removeEventListener('keydown', modal._trapHandler);
                delete modal._trapHandler;
            }
            if (!document.querySelector('.modal-overlay.active')) {
                document.body.style.overflow = '';
            }
        }
    };

    // --- Filtres ---
    window.filterByGenre = (genre) => {
        if (genre === 'all') filteredBooks = [...allBooks];
        else filteredBooks = allBooks.filter(b => b.category === genre);
        renderFullCatalog();
    };

    window.filterByAlpha = (letter) => {
        filteredBooks = allBooks.filter(b => b.title.toUpperCase().startsWith(letter));
        renderFullCatalog();
    };

    window.filterBySearch = (val) => {
        const query = val.toLowerCase();
        filteredBooks = allBooks.filter(b => 
            b.title.toLowerCase().includes(query) || 
            b.author.toLowerCase().includes(query)
        );
        renderFullCatalog();
    };

    window.sortByPrice = (order) => {
        if (order === 'asc') {
            filteredBooks.sort((a, b) => a.price - b.price);
        } else if (order === 'desc') {
            filteredBooks.sort((a, b) => b.price - a.price);
        } else {
            // default sorting (id or created_at)
            // for simplicity, just re-filter with current genre and search to restore default order
            // actually allBooks is already default order.
            // If we sort filteredBooks, we lose the original order.
            // Let's re-run the search filter to restore order.
            const searchVal = document.getElementById('libSearchInput') ? document.getElementById('libSearchInput').value : '';
            if (searchVal) {
                window.filterBySearch(searchVal);
                return;
            } else {
                // If no search, maybe a genre is selected?
                const activeGenre = document.querySelector('.genre-pill.active');
                if (activeGenre) {
                    const text = activeGenre.textContent.trim();
                    if (text === 'Tous') window.filterByGenre('all');
                    else window.filterByGenre(text);
                    return;
                } else {
                    filteredBooks = [...allBooks];
                }
            }
        }
        renderFullCatalog();
    };

    // --- Aliases pour compatibilité ---
    window.searchBooks = window.filterBySearch;
    window.loadRandomBooks = renderRandomBooks;
    window.renderRandomSelection = renderRandomBooks;

    // --- Utils ---
    function showToast(msg) {
        if (window.Utils && window.Utils.showToast) {
            window.Utils.showToast(msg);
        } else {
            console.log('Toast:', msg);
        }
    }

})();

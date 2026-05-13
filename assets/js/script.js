/* script.js — refactor JS depuis index 1.html */
window.onerror = function(msg, url, line) {
  const errDiv = document.createElement('div');
  errDiv.style.cssText = 'position:fixed; top:0; left:0; width:100%; background:#C43E4E; color:white; padding:10px; font-size:12px; z-index:9999; text-align:center;';
  errDiv.textContent = `Erreur: ${msg} (Ligne ${line})`;
  document.body.appendChild(errDiv);
  setTimeout(() => errDiv.remove(), 10000);
};

const supabase = window.supabaseClient;

// Données (catalogue)
let books = [];

/**
 * Charge les données du catalogue depuis le fichier JSON
 */
async function loadBooks() {
  const mainGrid = document.getElementById('booksGrid');
  const featuredGrid = document.getElementById('featuredBooks');
  const newArrivalsGrid = document.getElementById('newArrivalsGrid');

  if (!mainGrid && !featuredGrid && !newArrivalsGrid) return;
  
  if (mainGrid) renderSkeletons('booksGrid');
  if (featuredGrid) renderSkeletons('featuredBooks');
  if (newArrivalsGrid) renderSkeletons('newArrivalsGrid');

  console.log('Tentative de chargement du catalogue...');

  try {
    // Timeout pour la BDD (3s max)
    const dbPromise = supabase.from('books').select('*').order('created_at', { ascending: false });
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout BDD')), 3000));
    
    const { data, error } = await Promise.race([dbPromise, timeoutPromise]);
    if (error) throw error;

    const res = await fetch('./data/books.json');
    const localBooks = res.ok ? await res.json() : [];
    
    if (data && data.length > 0) {
      books = [...data, ...localBooks];
      console.log(`${data.length} livres chargés depuis Supabase + ${localBooks.length} locaux.`);
    } else {
      books = localBooks;
      console.log('Aucune donnée en BDD, chargement du catalogue local.');
    }
  } catch (err) {
    console.error('Erreur catalogue, passage en mode secours:', err);
    try {
      const res = await fetch('./data/books.json');
      books = res.ok ? await res.json() : [];
    } catch(e) {
      console.error('Échec total du chargement:', e);
    }
  }

  // Rendu final
  if (mainGrid) renderBooks('all', 'booksGrid');
  if (featuredGrid) renderBooks('all', 'featuredBooks', 4);
  if (newArrivalsGrid) renderBooks('all', 'newArrivalsGrid', 4);
}

function renderSkeletons(gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = Array(4).fill(0).map(() => `
    <div class="book-card skeleton-card">
      <div class="book-cover skeleton"></div>
      <div class="book-body">
        <div class="skeleton" style="height:12px; width:40%; margin-bottom:10px;"></div>
        <div class="skeleton" style="height:20px; width:90%; margin-bottom:10px;"></div>
        <div class="skeleton" style="height:14px; width:60%;"></div>
      </div>
    </div>
  `).join('');
}

let cart = [];

/**
 * Sauvegarde le panier dans le localStorage
 */
function saveCart() {
  try {
    localStorage.setItem('cerap_cart', JSON.stringify(cart));
  } catch (e) {
    console.warn('Impossible de sauvegarder le panier:', e);
  }
}

/**
 * Initialise le panier au chargement de chaque page
 * Récupère les données depuis le localStorage et met à jour le badge
 */
function initCart() {
  try {
    const saved = localStorage.getItem('cerap_cart');
    if (saved) {
      cart = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Erreur de lecture du panier:', e);
    cart = [];
  }
  // Met à jour le badge flottant
  const countEl = document.getElementById('cartCount');
  if (countEl) {
    countEl.textContent = cart.length;
  }
  // Met à jour le rendu du panier si le panneau existe
  if (document.getElementById('cartItems')) {
    renderCart();
  }
}
let currentFilter = 'all';

/**
 * Affiche les livres dans la grille selon le filtre sélectionné
 * @param {string} filter - Catégorie de filtre
 */
function renderBooks(filter, gridId = 'booksGrid', limit = null) {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  let filtered = filter === 'all' ? books : books.filter((b) => b.category.toLowerCase().includes(filter.toLowerCase()));
  if (limit) filtered = filtered.slice(0, limit);

  grid.innerHTML = filtered.map((b) => {
    const safeTitle = b.title.replace(/'/g, "\\'");
    const safeCover = b.cover.replace(/'/g, "\\'");
    const formattedPrice = Utils.formatCurrency(b.price);
    
    return `
    <div class="book-card js-reveal" data-reveal onclick="showBookDetails('${b.id}')" style="background: white; border: 1px solid rgba(0,0,0,0.08); overflow: hidden; display: flex; flex-direction: column;">
      <div class="book-cover" style="aspect-ratio: 1/1.4; background:${b.cover ? 'transparent' : `linear-gradient(145deg,${b.color || '#07152d'} 0%,${b.color || '#07152d'}99 100%)`}; padding: 12px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;">
        ${b.cover ? `<img src="${b.cover}" alt="${safeTitle}" style="width:100%;height:100%;object-fit:contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.15));" onerror="this.parentElement.innerHTML='<div class=\'book-cover-title\'>${b.title}</div>'"/>` : `<div class="book-cover-title">${b.title}</div>`}
      </div>
      <div class="book-body" style="padding: 20px; flex: 1; display: flex; flex-direction: column;">
        <span style="display: inline-block; background: #C43E4E; color: white; font-size: 11px; padding: 4px 10px; font-weight: 700; margin-bottom: 12px; width: fit-content; text-transform: uppercase;">${b.category}</span>
        <div class="book-title" style="font-family: 'EB Garamond', serif; font-size: 16px; font-weight: 700; margin-bottom: 12px; line-height: 1.3; color: var(--navy); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${b.title}</div>
        <div style="margin-top: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
             <span style="color: #0088CC; font-size: 13px; font-weight: 600;">${b.status === 'stock_faible' ? 'Stock faible' : 'Disponible'}</span>
             <span style="font-weight: 800; color: #333; font-size: 14px;">XOF: ${formattedPrice}</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <button class="book-add-btn" style="margin:0; padding: 10px; font-size: 11px; font-weight: 700; text-transform: uppercase;" onclick="event.stopPropagation(); showBookDetails('${b.id}')">Détails</button>
            <button class="book-add-btn" style="margin:0; padding: 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: var(--navy); color: white;" onclick="event.stopPropagation(); addToCart('${b.id}', '${safeTitle}', '${formattedPrice}', '${safeCover}')">Acheter</button>
          </div>
        </div>
      </div>
    </div>
  `;
  }).join('');


  Utils.initScrollReveals('.book-card', true);
}

/**
 * Filtre les livres par catégorie
 * @param {string} cat - Catégorie cible
 * @param {HTMLElement} btn - Bouton cliqué
 */
function filterBooks(cat, btn) {
  currentFilter = cat;
  document.querySelectorAll('.cat-btn').forEach((b) => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderBooks(cat);
}

 * @param {number} id - ID du livre
 * @param {string} title - Titre du livre
 * @param {string} price - Prix formaté
 * @param {string} abbr - Abréviation (pour l'icône)
 */
function addToCart(id, title, price, abbr) {
  cart.push({ id, title, price, abbr });
  saveCart();
  const countEl = document.getElementById('cartCount');
  countEl.textContent = cart.length;
  // Bump animation
  countEl.classList.remove('bump');
  void countEl.offsetWidth; // force reflow
  countEl.classList.add('bump');

  renderCart();
  Utils.showToast('Article ajouté au panier');
  toggleCart(true);
}

// --- ADVANCED LIBRAIRIE JS ---

window.searchBooks = function() {
  const val = document.getElementById('bookSearch').value.toLowerCase();
  const filtered = books.filter(b => 
    b.title.toLowerCase().includes(val) || 
    b.author.toLowerCase().includes(val) || 
    b.category.toLowerCase().includes(val)
  );
  renderBooksList(filtered);
}

window.filterByGenre = function() {
  const genre = document.getElementById('genreFilter').value;
  const filtered = (genre === 'all') ? books : books.filter(b => b.category === genre);
  renderBooksList(filtered);
}

function renderBooksList(data) {
  const grid = document.getElementById('booksGrid');
  if (!grid) return;

  grid.innerHTML = data.map(b => {
    const safeTitle = b.title.replace(/'/g, "\\'");
    
    return `
    <div class="book-card-clean js-reveal" data-reveal onclick="showBookDetails('${b.id}')" style="cursor:pointer; transition: transform 0.3s ease;">
      <div style="aspect-ratio: 1/1.4; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); background: #eee; position: relative;">
        ${b.cover ? `<img src="${b.cover}" alt="${safeTitle}" style="width: 100%; height: 100%; object-fit: cover;">` : `<div style="height:100%; display:flex; align-items:center; justify-content:center; background: #002147; color:white; padding:20px; text-align:center; font-family:'EB Garamond', serif;">${b.title}</div>`}
        <div class="card-overlay" style="position:absolute; bottom:0; left:0; width:100%; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 20px; opacity:0; transition: opacity 0.3s;">
           <h4 style="color:white; margin:0; font-size:14px;">${b.title}</h4>
           <p style="color:rgba(255,255,255,0.7); margin:5px 0 0; font-size:11px;">${b.author}</p>
        </div>
      </div>
    </div>
    `;
  }).join('');
  
  if (data.length === 0) {
    grid.innerHTML = '<div style="text-align:center; grid-column: 1/-1; padding:100px; color:#64748b;">Aucun ouvrage trouvé.</div>';
  }

  Utils.initScrollReveals('.book-card-clean', true);
}

function renderRandomSelection() {
  const el = document.getElementById('randomSelection');
  if (!el || !books.length) return;

  const shuffled = [...books].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 4);

  el.innerHTML = selected.map(b => `
    <div class="lib-mini-book" onclick="showBookDetails('${b.id}')" style="cursor:pointer;">
      <div class="lib-mini-cover" style="background: ${b.color || '#eee'}; display:flex; align-items:center; justify-content:center; overflow:hidden;">
         ${b.cover ? `<img src="${b.cover}" style="width:100%; height:100%; object-fit:cover;">` : `<span style="font-size:8px; text-align:center;">${b.title}</span>`}
      </div>
      <div class="lib-mini-info">
        <h4>${b.title}</h4>
        <p>Auteur: ${b.author || 'CERAP'}</p>
        <span>XOF: ${Utils.formatCurrency(b.price)}</span>
      </div>
    </div>
  `).join('');
}

// Update loadBooks to call list view if needed
const originalLoadBooks = loadBooks;
loadBooks = async function() {
  await originalLoadBooks();
  const booksGrid = document.getElementById('booksGrid');
  // If we are in the lib-main-layout, switch to list view by default
  if (booksGrid && booksGrid.closest('.lib-main-layout')) {
    renderBooksList(books);
    renderRandomSelection();
  }
}

function removeFromCart(i) {
  cart.splice(i, 1);
  saveCart();
  document.getElementById('cartCount').textContent = cart.length;
  renderCart();
  if (cart.length === 0) toggleCart(false);
}

/**
 * Met à jour l'affichage HTML du panier
 */
function renderCart() {
  const el = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  const headerCount = document.getElementById('cartHeaderCount');

  if (headerCount) headerCount.textContent = cart.length + ' article' + (cart.length > 1 ? 's' : '');

  if (cart.length === 0) {
    el.innerHTML = `
      <div class="cart-empty">
        <span class="cart-empty-icon">📚</span>
        <div class="cart-empty-text">Votre panier est vide</div>
        <div class="cart-empty-sub">Parcourez notre catalogue pour ajouter des ouvrages</div>
      </div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';

  let total = 0;
  el.innerHTML = cart.map((item, i) => {
    const numPrice = parseInt(item.price.replace(/[^0-9]/g, ''), 10);
    total += numPrice;
    return `
    <div class="cart-item" style="animation-delay:${i * 0.06}s">
      <div class="cart-item-cover" style="background:${item.abbr && item.abbr.startsWith('http') ? 'transparent' : 'linear-gradient(135deg,#0a2d5c,#001a3a)'}; border-radius:6px;">
        ${item.abbr && item.abbr.startsWith('http') ? `<img src="${item.abbr}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;"/>` : item.abbr}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-title">${item.title}</div>
        <div class="cart-item-price">${item.price}</div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${i})" aria-label="Retirer ${item.title}">✕</button>
    </div>`;
  }).join('');
 
  document.getElementById('cartTotal').textContent = Utils.formatCurrency(total);
}

function toggleCart(force) {
  const panel = document.getElementById('cartPanel');
  const overlay = document.getElementById('cartOverlay');
  const btn = document.querySelector('[aria-controls="cartPanel"]');
  if (!panel) return;

  const shouldOpen = typeof force === 'boolean' ? force : !panel.classList.contains('open');

  panel.classList.toggle('open', shouldOpen);
  if (overlay) overlay.classList.toggle('open', shouldOpen);
  panel.setAttribute('aria-hidden', String(!shouldOpen));
  if (btn) btn.setAttribute('aria-expanded', String(shouldOpen));
  document.body.style.overflow = shouldOpen ? 'hidden' : '';

  if (shouldOpen) {
    const closeBtn = panel.querySelector('.cart-close');
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  } else if (btn) {
    btn.focus({ preventScroll: true });
  }
}

// Accessibilité UX panier : fermeture Escape
(function attachCartEscapeHandler() {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const panel = document.getElementById('cartPanel');
    if (!panel) return;
    if (panel.classList.contains('open')) toggleCart(false);
  }, { passive: true });
})();

function checkout() {
  const total = cart.reduce((acc, item) => acc + parseInt(item.price.replace(/[^0-9]/g, ''), 10), 0);
  if (total === 0) return;
  
  document.getElementById('checkoutTotal').textContent = Utils.formatCurrency(total);
  document.getElementById('checkoutModal').classList.add('open');
  toggleCart(false);
}

function selectPayMethod(method, el) {
  document.querySelectorAll('.pay-method').forEach(m => m.classList.remove('selected'));
  el.classList.add('selected');
  
  const fields = document.getElementById('paymentFields');
  const phoneField = document.getElementById('phoneField');
  const cardFields = document.getElementById('cardFields');
  
  fields.style.display = 'block';
  if (method === 'card') {
    phoneField.style.display = 'none';
    cardFields.style.display = 'block';
  } else {
    phoneField.style.display = 'block';
    cardFields.style.display = 'none';
  }
}

/**
 * Déclenche le paiement réel via CinetPay
 */
function confirmPayment() {
  const totalStr = document.getElementById('checkoutTotal').textContent;
  const total = parseInt(totalStr.replace(/[^0-9]/g, ''), 10);
  
  if (isNaN(total) || total <= 0) return;

  // 1. Préparation des données (Simulation d'ID transaction)
  const transId = Math.floor(Math.random() * 100000000).toString();
  
  // 2. Vérification de la présence du SDK
  if (typeof CinetPay === 'undefined') {
    console.error("SDK CinetPay introuvable. Assurez-vous d'être en ligne.");
    alert("Le système de paiement est momentanément indisponible (SDK non chargé).");
    return;
  }

  // 3. Configuration (À REMPLACER PAR VOS CLÉS RÉELLES)
  // IMPORTANT: Ces clés devraient idéalement être gérées via un backend pour la sécurité
  CinetPay.setConfig({
    apikey: 'YOUR_API_KEY', // Remplacer par votre API KEY
    site_id: 'YOUR_SITE_ID', // Remplacer par votre SITE ID
    notify_url: window.location.origin + '/notify' // URL de notification (IPN)
  });

  // 4. Lancement du paiement
  try {
    CinetPay.getCheckout({
      transaction_id: transId,
      amount: total,
      currency: 'XOF',
      channels: 'ALL',
      description: 'Achat d\'ouvrages — CERAP Éditions',
      customer_name: "Client",
      customer_surname: "CERAP",
      customer_email: "client@cerap-inades.org",
      customer_phone_number: "0700000000",
      customer_address: "Cocody, Abidjan",
      customer_city: "Abidjan",
      customer_country: "CI",
      customer_state: "CI",
      customer_zip_code: "00225"
    });

    // 5. Attente de la réponse
    CinetPay.waitResponse(async function(data) {
      if (data.status === "ACCEPTED") {
        // Succès : Enregistrement dans Supabase avant redirection
        await saveOrderToSupabase(transId, total, totalStr);
        window.location.href = `./success.html?total=${encodeURIComponent(totalStr)}&id=${transId}`;
      } else {
        alert("Le paiement a échoué ou a été annulé. Veuillez réessayer.");
      }
    });

    CinetPay.onError(async function(data) {
      console.error("Erreur CinetPay:", data);
      // Simulation pour la démo si les clés sont "YOUR_API_KEY"
      if (CinetPay._config.apikey === 'YOUR_API_KEY') {
        if (confirm("(Mode Démo) Voulez-vous simuler un paiement réussi ?")) {
          await saveOrderToSupabase(transId, total, totalStr);
          window.location.href = `./success.html?total=${encodeURIComponent(totalStr)}&id=${transId}`;
        }
      }
    });

  } catch (err) {
    console.error("Erreur lors de l'initialisation CinetPay:", err);
  }
}

function showBookDetails(id) {
  const b = books.find(x => String(x.id) === String(id));
  if (!b) return;
  
  const body = document.getElementById('bookDetailsBody');
  const formattedPrice = Utils.formatCurrency(b.price);
  
  body.innerHTML = `
    <div class="book-details-grid">
      <div class="details-cover" style="background:${b.cover ? 'transparent' : `linear-gradient(135deg,${b.color || '#002147'},${b.color || '#002147'}cc)`}">
        ${b.cover ? `<img src="${b.cover}" alt="Cover" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" onerror="this.parentElement.innerText='${b.title}'"/>` : b.title}
      </div>
      <div>
        <span class="details-cat">${b.category}</span>
        <h4 class="details-title">${b.title}</h4>
        <div class="details-author">Par ${b.author}</div>
        <div class="details-meta">
          <strong>Prix :</strong> ${formattedPrice}<br>
          <strong>Date :</strong> ${b.date ? new Date(b.date).toLocaleDateString('fr-FR', {year: 'numeric', month: 'long', day: 'numeric'}) : 'N/A'}
        </div>
        <div class="details-desc">${b.description || 'Ouvrage universitaire de référence.'}</div>
      </div>
    </div>
  `;
  
  const addBtn = document.getElementById('modalAddToCartBtn');
  if (addBtn) {
    addBtn.onclick = () => {
      addToCart(b.id, b.title, formattedPrice, b.cover);
      closeModal('bookDetailsModal');
    };
  }
  
  const modal = document.getElementById('bookDetailsModal');
  if (modal) modal.classList.add('open');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

/**
 * Enregistre la commande dans Supabase
 */
async function saveOrderToSupabase(transId, total, totalStr) {
  const orderData = {
    transaction_id: transId,
    total_amount: total,
    items: cart,
    customer_name: "Client Démo", // En prod, à lier à un formulaire
    customer_email: "client@cerap.org",
    status: 'en_cours'
  };

  try {
    const { error } = await supabase.from('orders').insert([orderData]);
    if (error) throw error;
    console.log("Commande enregistrée avec succès.");
  } catch (err) {
    console.error("Erreur Supabase (orders):", err);
    // On continue quand même pour la démo, mais on log l'erreur
  }
}

window.selectPayMethod = selectPayMethod;
window.confirmPayment = confirmPayment;
window.showBookDetails = showBookDetails;
window.closeModal = closeModal;

async function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = {
    first_name: form.querySelector('input[placeholder="Kofi"]')?.value || '',
    last_name: form.querySelector('input[placeholder="Asante"]')?.value || '',
    email: form.querySelector('input[type="email"]')?.value || '',
    subject: form.querySelector('select')?.value || 'Contact',
    message: form.querySelector('textarea')?.value || ''
  };

  try {
    const { error } = await supabase.from('contacts').insert([formData]);
    if (error) throw error;
    
    const success = document.getElementById('formSuccess');
    if (success) {
      success.style.display = 'block';
      success.textContent = '✓ Message envoyé ! Nous vous répondrons dans les 48h.';
    }
    form.reset();
  } catch (error) {
    console.error('Erreur Supabase contact:', error);
    // Simuler le succès pour l'UX si on est en local sans clé
    const success = document.getElementById('formSuccess');
    if (success) {
      success.style.display = 'block';
      success.textContent = '(Simulation) Message reçu ! (Connectez Supabase pour le voir en admin)';
    }
    form.reset();
  }
}

// Nav mobile (clavier + fermeture à la sélection)
(function initMobileMenu() {
  const btn = document.querySelector('[data-js="mobile-menu-toggle"]');
  const panel = document.getElementById('mobileNav');
  if (!btn || !panel) return;

  const toggle = () => {
    const isOpen = panel.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
  };

  btn.addEventListener('click', toggle);
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  });

  panel.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      if (panel.classList.contains('open')) {
        panel.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  });
})();



// Revue : choix abonnement
function initRevueOptions() {
  document.querySelectorAll('.revue-sub-option').forEach((opt) => {
    opt.addEventListener('click', function () {
      document.querySelectorAll('.revue-sub-option').forEach((o) => o.classList.remove('selected'));
      this.classList.add('selected');
    });
  });
}

// Init dom ready
document.addEventListener('DOMContentLoaded', async () => {
  // Show loader immediately
  Utils.showPageLoader();

  // Restaurer le panier depuis le localStorage
  initCart();

  // init catalogue
  await loadBooks();
  
  // init reveals
  Utils.initScrollReveals('.js-reveal', false);

  // animate hero numbers
  if (document.getElementById('statFounding')) {
    setTimeout(() => {
      Utils.animateNumber(document.getElementById('statFounding'), 2003, 2000);
      Utils.animateNumber(document.getElementById('statBooksPublished'), 80, 2000);
    }, 500);
  }

  // Hide loader with a slight delay for smooth entry
  setTimeout(() => Utils.hidePageLoader(), 800);

  // revue seulement si présente
  if (document.querySelector('.revue-sub-option')) {
    initRevueOptions();
  }

  const form = document.querySelector('[data-js="contact-form"]');
  if (form) form.addEventListener('submit', handleFormSubmit);
});


// Exposer aux attributs inline existants (btns/onclick dans le HTML)
window.filterBooks = filterBooks;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.toggleCart = toggleCart;
window.checkout = checkout;
window.handleFormSubmit = handleFormSubmit;



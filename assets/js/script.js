/* script.js — refactor JS depuis index 1.html */

// Données (catalogue)
let books = [];

/**
 * Charge les données du catalogue depuis le fichier JSON
 */
function renderSkeletons() {
  const grid = document.getElementById('booksGrid');
  if (!grid) return;
  grid.innerHTML = Array(6).fill(0).map(() => `
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

async function loadBooks() {
  if (!document.getElementById('booksGrid')) return;
  renderSkeletons();
  try {
    // Tentative Supabase
    const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false });
    
    if (error) throw error;

    if (data && data.length > 0) {
      books = data;
    } else {
      // Fallback JSON local si Supabase est vide
      const response = await fetch('./data/books.json');
      books = await response.json();
    }
    
    renderBooks('all');
  } catch (error) {
    console.warn('Supabase non configuré ou erreur, passage au local JSON:', error);
    const response = await fetch('./data/books.json');
    books = await response.json();
    renderBooks('all');
  }
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
function renderBooks(filter) {
  const grid = document.getElementById('booksGrid');
  const filtered = filter === 'all' ? books : books.filter((b) => b.category.toLowerCase().includes(filter.toLowerCase()));

  grid.innerHTML = filtered.map((b) => {
    const safeTitle = b.title.replace(/'/g, "\\'");
    const safeCover = b.cover.replace(/'/g, "\\'");
    const formattedPrice = Utils.formatCurrency(b.price);
    
    return `
    <div class="book-card js-reveal" data-reveal onclick="showBookDetails(${b.id})">
      <div class="book-cover" style="background:${b.cover ? 'transparent' : `linear-gradient(145deg,${b.color || '#002147'} 0%,${b.color || '#002147'}99 100%)`}">
        ${b.cover ? `<img src="${b.cover}" alt="Couverture de ${safeTitle}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='<div class=\'book-cover-title\'>${b.title}</div>'"/>` : `<div class="book-cover-title">${b.title}</div>`}
      </div>
      <div class="book-body">
        <span class="book-cat-tag">${b.category}</span>
        <div class="book-title">${b.title}</div>
        <div class="book-footer">
          <span class="book-status">${b.status === 'stock_faible' ? 'Stock faible' : 'Disponible'}</span>
          <span class="book-price">XOF: ${formattedPrice}</span>
        </div>
        <div class="book-card-actions" style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:12px;">
           <button class="book-add-btn" style="margin-top:0" onclick="event.stopPropagation(); showBookDetails(${b.id})">Détails</button>
           <button class="book-add-btn" style="margin-top:0; background:var(--gold); color:var(--deep)" onclick="event.stopPropagation(); addToCart(${b.id}, '${safeTitle}', '${formattedPrice}', '${safeCover}')">+ Panier</button>
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
  const b = books.find(x => x.id === id);
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
          <strong>Date :</strong> ${new Date(b.date).toLocaleDateString('fr-FR', {year: 'numeric', month: 'long', day: 'numeric'})}
        </div>
        <div class="details-desc">${b.description || 'Ouvrage universitaire de référence.'}</div>
      </div>
    </div>
  `;
  
  const addBtn = document.getElementById('modalAddToCartBtn');
  addBtn.onclick = () => {
    addToCart(b.id, b.title, formattedPrice, b.cover);
    closeModal('bookDetailsModal');
  };
  
  document.getElementById('bookDetailsModal').classList.add('open');
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



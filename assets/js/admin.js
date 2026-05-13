/* ══════════════════════════════════════════
   CERAP Éditions — Admin Dashboard JS
   ══════════════════════════════════════════ */
const supabase = window.supabaseClient;

// ── STATE ──
let booksData = [];
let salesData = {};
let contactsData = [];
let currentPage = 'dashboard';
let revenueChart = null;
let catChart = null;
let salesLineChartInstance = null;

function logout() {
  localStorage.removeItem('cerap_admin_session');
  window.location.href = 'login.html';
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  renderDashboard();
  initNav();
  initMobileMenu();
  Utils.initScrollReveals('.stat-card, .chart-card, .table-card', true);
});

// ── MODALS ──
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('open');
    // Si c'est le modal livre, on réinitialise le titre si c'est un nouvel ajout
    if (id === 'bookModal' && !document.getElementById('bookFormId').value) {
      document.getElementById('bookModalTitle').textContent = 'Ajouter un livre';
    }
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('open');
    // Nettoyage si c'est le formulaire livre
    if (id === 'bookModal') {
      document.getElementById('bookForm').reset();
      document.getElementById('bookFormId').value = '';
      document.getElementById('bookCoverPreview').style.display = 'none';
      document.getElementById('bookFormCoverData').value = '';
    }
  }
}



async function loadData() {
  const statusEl = document.getElementById('backendStatus');
  try {
    // Test connection with a simple query
    const { data: bData, error: bError } = await supabase.from('books').select('*').limit(1);
    if (bError) {
      console.error('Supabase connection error:', bError);
      throw bError;
    }

    // If test passes, fetch everything
    const [books, contacts, orders] = await Promise.all([
      supabase.from('books').select('*').order('created_at', { ascending: false }),
      supabase.from('contacts').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false })
    ]);

    if (books.data) booksData = books.data;
    if (contacts.data) contactsData = contacts.data;

    if (orders.data && orders.data.length > 0) {
      salesData = processOrders(orders.data);
    } else {
      const sRes = await fetch('./data/sales.json');
      salesData = await sRes.json();
    }

    if (statusEl) {
      statusEl.className = 'backend-status status-online';
      statusEl.querySelector('.status-text').textContent = 'Connecté (Live)';
    }

  } catch (e) {
    console.error('Switching to Local Mode. Reason:', e.message || e);
    const [bRes, sRes, cRes] = await Promise.all([
      fetch('./data/books.json'),
      fetch('./data/sales.json'),
      fetch('./data/contacts.json')
    ]);
    booksData = await bRes.json();
    salesData = await sRes.json();
    contactsData = await cRes.json();

    if (statusEl) {
      statusEl.className = 'backend-status status-offline';
      statusEl.querySelector('.status-text').textContent = 'Mode Local (' + (e.message || 'Erreur') + ')';
    }
  }
}

/**
 * Calcule les statistiques à partir des commandes réelles
 */
function processOrders(orders) {
  const summary = {
    totalRevenue: 0,
    totalOrders: orders.length,
    todayOrders: 0,
    monthOrders: 0,
    avgCart: 0,
    totalBooks: booksData.length,
    totalContacts: contactsData.length
  };

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const thisMonth = now.getMonth();

  const monthly = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'].map(m => ({ month: m, revenue: 0, orders: 0 }));
  const weekly = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'].map(d => ({ day: d, revenue: 0, orders: 0 }));
  
  // Recent orders list
  const recentOrders = orders.slice(0, 8).map(o => ({
    id: o.transaction_id || o.id.slice(0, 8),
    client: o.customer_name || 'Client',
    items: o.items ? o.items.length : 1,
    total: o.total_amount,
    date: o.created_at,
    status: o.status || 'en_cours'
  }));

  // Stats calculation
  orders.forEach(o => {
    const d = new Date(o.created_at);
    summary.totalRevenue += o.total_amount;
    
    if (o.created_at.startsWith(today)) summary.todayOrders++;
    if (d.getMonth() === thisMonth) summary.monthOrders++;

    monthly[d.getMonth()].revenue += o.total_amount;
    monthly[d.getMonth()].orders++;
    
    weekly[d.getDay()].revenue += o.total_amount;
    weekly[d.getDay()].orders++;
  });

  summary.avgCart = summary.totalOrders > 0 ? Math.round(summary.totalRevenue / summary.totalOrders) : 0;

  // Derive categories from items if possible, else use default
  const categories = [
    { name: 'Droit', value: 35 },
    { name: 'Histoire', value: 25 },
    { name: 'Revue', value: 20 },
    { name: 'Religion', value: 10 }
  ];

  return { summary, monthly, weekly, categories, recentOrders };
}

function syncStorage() {
  // Optionnel maintenant avec Supabase, on peut garder pour le cache offline
  localStorage.setItem('cerap_books', JSON.stringify(booksData));
  localStorage.setItem('cerap_contacts', JSON.stringify(contactsData));
}

// ── NAVIGATION ──
function initNav() {
  document.querySelectorAll('.sidebar-link[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      navigateTo(page);
    });
  });
}

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));

  const target = document.getElementById('page-' + page);
  const link = document.querySelector(`.sidebar-link[data-page="${page}"]`);
  if (target) target.classList.add('active');
  if (link) link.classList.add('active');

  // Update topbar title
  const titles = { dashboard: 'Tableau de bord', books: 'Gestion des livres', sales: 'Analyses & Statistiques', messages: 'Messages reçus' };
  const subtitles = { dashboard: 'Vue d\'ensemble de votre activité', books: 'Catalogue et inventaire', sales: 'Revenus et performances des ventes', messages: 'Formulaire de contact' };
  document.getElementById('topbarTitle').textContent = titles[page] || '';
  document.getElementById('topbarSub').textContent = subtitles[page] || '';

  // Render page content
  if (page === 'dashboard') renderDashboard();
  else if (page === 'books') renderBooks();
  else if (page === 'sales') renderSalesPage();
  else if (page === 'messages') renderMessages();

  // Close mobile menu
  document.querySelector('.admin-sidebar')?.classList.remove('open');
}

function initMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const sidebar = document.querySelector('.admin-sidebar');
  if (btn && sidebar) {
    btn.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
}

// ── DASHBOARD ──
function renderDashboard() {
  const s = salesData.summary || {};
  const totalSold = booksData.reduce((a, b) => a + (b.sold || 0), 0);
  const unread = contactsData.filter(c => !c.read).length;

  // Stat cards
  // Stat cards with animation
  Utils.animateNumber(document.getElementById('statBooks'), booksData.length);
  Utils.animateNumber(document.getElementById('statSales'), totalSold);
  Utils.animateNumber(document.getElementById('statRevenue'), s.totalRevenue || 0);
  Utils.animateNumber(document.getElementById('statToday'), s.todayOrders || 0);
  Utils.animateNumber(document.getElementById('statMonth'), s.monthOrders || 0);
  Utils.animateNumber(document.getElementById('statContacts'), contactsData.length);
  Utils.animateNumber(document.getElementById('statUnread'), unread);
  Utils.animateNumber(document.getElementById('statAvgCart'), s.avgCart || 0);

  renderRevenueChart('monthly');
  renderCategoryChart();
  renderRecentOrders();
  renderDashboardTopSellers();
}

// ── CHARTS ──
function renderRevenueChart(period) {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;

  const data = period === 'monthly' ? salesData.monthly : salesData.weekly;
  const labels = data.map(d => d.month || d.day);
  const revenues = data.map(d => d.revenue);
  const orders = data.map(d => d.orders);

  if (revenueChart) {
    revenueChart.data.labels = labels;
    revenueChart.data.datasets[0].data = revenues;
    revenueChart.data.datasets[1].data = orders;
    revenueChart.update('active');
    
    document.querySelectorAll('.chart-tab[data-period]').forEach(t => {
      t.classList.toggle('active', t.dataset.period === period);
    });
    return;
  }

  revenueChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Revenus (F CFA)',
          data: revenues,
          backgroundColor: 'rgba(0,33,71,0.8)',
          borderRadius: 6,
          barPercentage: 0.6,
          yAxisID: 'y'
        },
        {
          label: 'Commandes',
          data: orders,
          type: 'line',
          borderColor: '#D48806',
          backgroundColor: 'rgba(212,136,6,0.1)',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#D48806',
          fill: true,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: { position: 'top', labels: { font: { family: "'Atkinson Hyperlegible'", size: 11 }, usePointStyle: true, padding: 16 } },
        tooltip: {
          backgroundColor: '#002147',
          titleFont: { family: "'EB Garamond'", size: 14 },
          bodyFont: { family: "'Atkinson Hyperlegible'", size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: { label: ctx => ctx.dataset.label + ': ' + ctx.parsed.y.toLocaleString('fr-FR') + (ctx.datasetIndex === 0 ? ' F' : '') }
        }
      },
      scales: {
        y: { position: 'left', ticks: { font: { size: 11 }, callback: v => (v / 1000000).toFixed(1) + 'M' }, grid: { color: 'rgba(0,0,0,0.05)' } },
        y1: { position: 'right', ticks: { font: { size: 11 } }, grid: { display: false } },
        x: { ticks: { font: { size: 11 } }, grid: { display: false } }
      }
    }
  });

  // Update tabs
  document.querySelectorAll('.chart-tab[data-period]').forEach(t => {
    t.classList.toggle('active', t.dataset.period === period);
  });
}

function renderCategoryChart() {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;

  const cats = salesData.categories || [];
  const colors = ['#002147', '#D48806', '#0a2d5c', '#1a4a5c', '#003366', '#5c0a1a'];

  if (catChart) catChart.destroy();

  catChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: cats.map(c => c.name),
      datasets: [{
        data: cats.map(c => c.value),
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: "'Atkinson Hyperlegible'", size: 11 }, padding: 12, usePointStyle: true } },
        tooltip: { backgroundColor: '#002147', cornerRadius: 8, padding: 10 }
      }
    }
  });
}

// ── RECENT ORDERS TABLE ──
function renderRecentOrders() {
  const tbody = document.getElementById('recentOrdersBody');
  if (!tbody) return;
  const orders = salesData.recentOrders || [];

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.client}</td>
      <td>${o.items}</td>
      <td>${Utils.formatCurrency(o.total)}</td>
      <td>${new Date(o.date).toLocaleDateString('fr-FR')}</td>
      <td><span class="status-badge ${o.status}">${o.status.replace('_', ' ')}</span></td>
    </tr>
  `).join('');
}

// ── DASHBOARD TOP SELLERS ──
function renderDashboardTopSellers() {
  const el = document.getElementById('dashTopSellers');
  if (!el) return;
  const sorted = [...booksData].sort((a, b) => b.sold - a.sold).slice(0, 5);

  el.innerHTML = sorted.map((b, i) => `
    <div class="top-seller-item">
      <div class="top-rank ${i === 0 ? 'gold' : ''}">${i + 1}</div>
      <div class="top-seller-info">
        <div class="top-seller-title">${b.title}</div>
        <div class="top-seller-meta">${b.catLabel}</div>
      </div>
      <div class="top-seller-stat">
        <div class="top-seller-sold">${b.sold} vdus</div>
        <div class="top-seller-revenue">${Utils.formatCurrency(b.sold * b.price)}</div>
      </div>
    </div>
  `).join('');
}
/* ── COVER IMAGE HANDLING ── */
function handleCoverChange(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result;
    document.getElementById('bookCoverPreview').src = base64;
    document.getElementById('bookCoverPreview').style.display = 'block';
    document.getElementById('bookFormCoverData').value = base64;
  };
  reader.readAsDataURL(file);
}

/* Update saveBook to include cover image */
async function saveBook() {
  const id = document.getElementById('bookFormId').value;
  const title = document.getElementById('bookFormTitle').value;
  const author = document.getElementById('bookFormAuthor').value;
  const category = document.getElementById('bookFormCategory').value;
  const price = parseInt(document.getElementById('bookFormPrice').value) || 0;
  const stock = parseInt(document.getElementById('bookFormStock').value) || 0;
  const date = document.getElementById('bookFormDate').value;
  const description = document.getElementById('bookFormDesc').value;
  const coverData = document.getElementById('bookFormCoverData').value;

  if (!title || !author) return alert('Titre et auteur requis.');

  const bookPayload = {
    title,
    author,
    category,
    price,
    stock,
    date: date || new Date().toISOString().split('T')[0],
    description,
    cover: coverData || (id ? undefined : `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='36' height='48'><rect width='36' height='48' fill='%23002147'/><text x='50%' y='55%' fill='%23fff' font-size='14' font-family='Arial' text-anchor='middle'>BK</text></svg>`)
  };

  try {
    let result;
    if (id) {
      // Update
      result = await supabase.from('books').update(bookPayload).eq('id', id);
    } else {
      // Insert
      result = await supabase.from('books').insert([bookPayload]);
    }

    if (result.error) throw result.error;

    // Refresh local data
    await loadData();
    
    closeModal('bookModal');
    renderBooks();
    renderDashboardTopSellers();
    renderTopSellers();
  } catch (error) {
    console.error('Erreur Supabase saveBook:', error);
    alert('Erreur lors de la sauvegarde : ' + (error.message || 'Erreur inconnue'));
    
    // Fallback local pour démo
    if (id) {
      const book = booksData.find(b => b.id === parseInt(id));
      if (book) Object.assign(book, bookPayload);
    } else {
      const newId = Math.max(0, ...booksData.map(b => b.id)) + 1;
      booksData.push({ id: newId, ...bookPayload, sold: 0, status: 'disponible', color: '#002147' });
    }
    closeModal('bookModal');
    syncStorage();
    renderBooks();
  }
}

/* Update editBook to populate cover preview */
function editBook(id) {
  const book = booksData.find(b => b.id === id);
  if (!book) return;
  document.getElementById('bookModalTitle').textContent = 'Modifier le livre';
  document.getElementById('bookFormId').value = book.id;
  document.getElementById('bookFormTitle').value = book.title;
  document.getElementById('bookFormAuthor').value = book.author;
  document.getElementById('bookFormCategory').value = book.category;
  document.getElementById('bookFormPrice').value = book.price;
  document.getElementById('bookFormStock').value = book.stock;
  document.getElementById('bookFormDate').value = book.date || '';
  document.getElementById('bookFormDesc').value = book.description || '';
  // cover
  if (book.cover && book.cover.startsWith('data:image')) {
    document.getElementById('bookCoverPreview').src = book.cover;
    document.getElementById('bookCoverPreview').style.display = 'block';
    document.getElementById('bookFormCoverData').value = book.cover;
  } else {
    document.getElementById('bookCoverPreview').style.display = 'none';
    document.getElementById('bookFormCoverData').value = '';
    document.getElementById('bookFormCover').value = '';
  }
  document.getElementById('bookModal').classList.add('open');
}

/* Adjust rendering to show image thumbnails */
function renderBooks(filter = '') {
  const tbody = document.getElementById('booksTableBody');
  if (!tbody) return;
  let filtered = booksData;
  if (filter) {
    const q = filter.toLowerCase();
    filtered = booksData.filter(b => b.title.toLowerCase().includes(q) || b.category.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
  }
  tbody.innerHTML = filtered.map(b => `
    <tr>
      <td>
        <div class="table-book-cell">
          <div class="table-book-cover" style="background:${b.cover && b.cover.startsWith('data:image') ? 'transparent' : 'linear-gradient(135deg,#002147,#002147cc)'};">
            ${b.cover && b.cover.startsWith('data:image') ? `<img src="${b.cover}" alt="Cover" style="width:100%;height:100%;object-fit:cover;border-radius:4px;"/>` : b.cover}
          </div>
          <div>
            <div class="table-book-title">${b.title}</div>
            <div class="table-book-author">${b.author}</div>
          </div>
        </div>
      </td>
      <td>${b.category}</td>
      <td><strong>${b.price.toLocaleString('fr-FR')} F</strong></td>
      <td>${b.stock}</td>
      <td>${b.sold}</td>
      <td><span class="status-badge ${b.status}">${b.status.replace('_', ' ')}</span></td>
      <td>
        <div class="table-action-btns">
          <button class="table-action-btn" onclick="editBook(${b.id})" title="Modifier">✏️</button>
          <button class="table-action-btn danger" onclick="deleteBook(${b.id})" title="Supprimer">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* Ensure top sellers use image if available */
function renderDashboardTopSellers() {
  const el = document.getElementById('dashTopSellers');
  if (!el) return;
  const sorted = [...booksData].sort((a, b) => b.sold - a.sold).slice(0, 5);
  el.innerHTML = sorted.map((b, i) => `
    <div class="top-seller-item">
      <div class="top-rank ${i < 3 ? 'gold' : ''}">${i + 1}</div>
      <div class="top-seller-info">
        <div class="top-seller-title">${b.title}</div>
        <div class="top-seller-meta">${b.category}</div>
      </div>
      <div class="top-seller-stat">
        <div class="top-seller-sold">${b.sold} ventes</div>
        <div class="top-seller-revenue">${(b.sold * b.price).toLocaleString('fr-FR')} F</div>
      </div>
    </div>
  `).join('');
}

function renderTopSellers() {
  const el = document.getElementById('topSellersFullList');
  if (!el) return;
  const sorted = [...booksData].sort((a, b) => b.sold - a.sold);
  el.innerHTML = sorted.map((b, i) => `
    <tr>
      <td><div class="top-rank ${i < 3 ? 'gold' : ''}">${i + 1}</div></td>
      <td>
        <div class="table-book-cell">
          <div class="table-book-cover" style="background:${b.cover && b.cover.startsWith('data:image') ? 'transparent' : 'linear-gradient(135deg,#002147,#002147cc)'};">
            ${b.cover && b.cover.startsWith('data:image') ? `<img src="${b.cover}" alt="Cover" style="width:100%;height:100%;object-fit:cover;border-radius:4px;"/>` : b.cover}
          </div>
          <div>
            <div class="table-book-title">${b.title}</div>
            <div class="table-book-author">${b.author}</div>
          </div>
        </div>
      </td>
      <td><strong>${b.sold}</strong></td>
      <td>${Utils.formatCurrency(b.sold * b.price)}</td>
      <td>${Utils.formatCurrency(b.price)}</td>
      <td><span class="status-badge disponible">📈 Tendance</span></td>
    </tr>
  `).join('');
}

async function deleteBook(id) {
  const book = booksData.find(b => b.id === id);
  if (!book) return;
  if (!confirm(`Supprimer "${book.title}" ?`)) return;
  
  try {
    const { error } = await supabase.from('books').delete().eq('id', id);
    if (error) throw error;
    
    await loadData();
    renderBooks();
  } catch (error) {
    console.error('Erreur Supabase deleteBook:', error);
    // Fallback local
    booksData = booksData.filter(b => b.id !== id);
    syncStorage();
    renderBooks();
  }
}

// ── SALES PAGE ──
function renderSalesPage() {
  const s = salesData.summary || {};
  const totalSold = booksData.reduce((a, b) => a + (b.sold || 0), 0);

  document.getElementById('salesRevenue').textContent = Utils.formatCurrency(s.totalRevenue || 0);
  document.getElementById('salesOrders').textContent = (s.totalOrders || 0).toLocaleString('fr-FR');
  document.getElementById('salesAvg').textContent = Utils.formatCurrency(s.avgCart || 0);
  document.getElementById('salesItems').textContent = totalSold.toLocaleString('fr-FR');

  renderSalesChart();
  renderTopSellers();
}

function renderSalesChart() {
  const ctx = document.getElementById('salesLineChart');
  if (!ctx) return;

  const data = salesData.monthly || [];
  if (salesLineChartInstance) {
    salesLineChartInstance.data.labels = data.map(d => d.month);
    salesLineChartInstance.data.datasets[0].data = data.map(d => d.revenue);
    salesLineChartInstance.data.datasets[1].data = data.map(d => d.orders * 10000);
    salesLineChartInstance.update();
    return;
  }

  salesLineChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.month),
      datasets: [{
        label: 'Revenus mensuels',
        data: data.map(d => d.revenue),
        borderColor: '#002147',
        backgroundColor: 'rgba(0,33,71,0.08)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#002147',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }, {
        label: 'Commandes',
        data: data.map(d => d.orders * 10000),
        borderColor: '#D48806',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#D48806'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { family: "'Atkinson Hyperlegible'", size: 11 }, usePointStyle: true } },
        tooltip: { backgroundColor: '#002147', cornerRadius: 8 }
      },
      scales: {
        y: { ticks: { callback: v => (v / 1000000).toFixed(1) + 'M' }, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { grid: { display: false } }
      }
    }
  });
}

// ── TOP SELLERS PAGE ──
function renderTopSellers() {
  const el = document.getElementById('topSellersFullList');
  if (!el) return;
  const sorted = [...booksData].sort((a, b) => b.sold - a.sold);

  el.innerHTML = sorted.map((b, i) => `
    <tr>
      <td><div class="top-rank ${i < 3 ? 'gold' : ''}">${i + 1}</div></td>
      <td>
        <div class="table-book-cell">
          <div class="table-book-cover" style="background:linear-gradient(135deg,${b.color},${b.color}cc)">${b.cover}</div>
          <div>
            <div class="table-book-title">${b.title}</div>
            <div class="table-book-author">${b.author}</div>
          </div>
        </div>
      </td>
      <td><strong>${b.sold}</strong></td>
      <td>${(b.sold * b.price).toLocaleString('fr-FR')} F</td>
      <td>${b.price.toLocaleString('fr-FR')} F</td>
      <td><span class="status-badge disponible">📈 Tendance</span></td>
    </tr>
  `).join('');
}

// ── MESSAGES PAGE ──
function renderMessages(filter = '') {
  const tbody = document.getElementById('messagesBody');
  if (!tbody) return;

  let msgs = contactsData;
  if (filter) {
    const q = filter.toLowerCase();
    msgs = contactsData.filter(m => 
      (m.first_name || '').toLowerCase().includes(q) || 
      (m.last_name || '').toLowerCase().includes(q) || 
      (m.email || '').toLowerCase().includes(q) || 
      (m.subject || '').toLowerCase().includes(q)
    );
  }

  const unread = contactsData.filter(c => !c.read).length;
  const unreadBadge = document.getElementById('msgUnreadCount');
  if (unreadBadge) unreadBadge.textContent = unread;

  tbody.innerHTML = msgs.map(m => `
    <tr class="msg-row ${m.read ? '' : 'unread'}" onclick="viewMessage(${m.id})">
      <td>${m.read ? '📖' : '📩'}</td>
      <td><strong>${m.first_name || ''} ${m.last_name || ''}</strong></td>
      <td>${m.email}</td>
      <td>${m.subject}</td>
      <td class="msg-preview">${m.message}</td>
      <td>${new Date(m.created_at || m.date).toLocaleDateString('fr-FR')}</td>
      <td><span class="status-badge ${m.read ? 'lu' : 'non_lu'}">${m.read ? 'Lu' : 'Non lu'}</span></td>
      <td>
        <div class="table-action-btns">
          <button class="table-action-btn" onclick="event.stopPropagation();toggleRead(${m.id})" title="${m.read ? 'Marquer non lu' : 'Marquer lu'}">📌</button>
          <button class="table-action-btn danger" onclick="event.stopPropagation();deleteMessage(${m.id})" title="Supprimer">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function viewMessage(id) {
  const m = contactsData.find(c => c.id === id);
  if (!m) return;
  
  try {
    const { error } = await supabase.from('contacts').update({ read: true }).eq('id', id);
    if (error) throw error;
    m.read = true;
  } catch (e) { console.error('Supabase viewMessage error:', e); m.read = true; }

  document.getElementById('msgDetailName').textContent = m.first_name + ' ' + m.last_name;
  document.getElementById('msgDetailEmail').textContent = m.email;
  document.getElementById('msgDetailSubject').textContent = m.subject;
  document.getElementById('msgDetailDate').textContent = new Date(m.created_at).toLocaleString('fr-FR');
  document.getElementById('msgDetailBody').textContent = m.message;
  document.getElementById('msgModal').classList.add('open');

  renderMessages();
  updateUnreadBadge();
  syncStorage();
}

async function toggleRead(id) {
  const m = contactsData.find(c => c.id === id);
  if (!m) return;
  const newState = !m.read;

  try {
    const { error } = await supabase.from('contacts').update({ read: newState }).eq('id', id);
    if (error) throw error;
    m.read = newState;
  } catch (e) { console.error('Supabase toggleRead error:', e); m.read = newState; }

  renderMessages();
  updateUnreadBadge();
  syncStorage();
}

async function deleteMessage(id) {
  if (!confirm('Supprimer ce message ?')) return;
  
  try {
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (error) throw error;
    contactsData = contactsData.filter(c => c.id !== id);
  } catch (e) { 
    console.error('Supabase deleteMessage error:', e);
    contactsData = contactsData.filter(c => c.id !== id);
  }
  
  renderMessages();
  updateUnreadBadge();
  syncStorage();
}

function updateUnreadBadge() {
  const count = contactsData.filter(c => !c.read).length;
  const badge = document.getElementById('sidebarMsgBadge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  }
}

// ── GLOBAL SEARCH ──
function handleGlobalSearch(query) {
  if (currentPage === 'books') {
    renderBooks(query);
  } else if (currentPage === 'messages') {
    renderMessages(query);
  } else if (currentPage === 'dashboard') {
    // If searching on dashboard, maybe just filter the top sellers or similar
    // Or redirect to books if query is significant
    if (query.length > 2) {
      navigateTo('books');
      const searchInput = document.getElementById('globalSearchInput');
      if (searchInput) searchInput.value = query;
      renderBooks(query);
    }
  }
}

window.logout = logout;
window.saveBook = saveBook;
window.editBook = editBook;
window.deleteBook = deleteBook;
window.toggleRead = toggleRead;
window.viewMessage = viewMessage;
window.deleteMessage = deleteMessage;
window.handleGlobalSearch = handleGlobalSearch;
window.navigateTo = navigateTo;
window.openModal = openModal;
window.closeModal = closeModal;

// Escape key closes modals
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  }
});

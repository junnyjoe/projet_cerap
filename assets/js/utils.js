/**
 * utils.js — Fonctions utilitaires partagées (Pattern Global)
 * CERAP Éditions
 */

const Utils = {
  /**
   * Formate un nombre en devise F CFA
   * @param {number} amount
   * @returns {string}
   */
  formatCurrency: function(amount) {
    return amount.toLocaleString('fr-FR') + ' F CFA';
  },

  /**
   * Initialise l'observateur d'intersection pour les animations au scroll
   * @param {string} selector - Sélecteur des éléments à animer
   * @param {boolean} stagger - Si vrai, ajoute un délai progressif
   */
  initScrollReveals: function(selector = '[data-reveal], .js-reveal', stagger = false) {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodes = document.querySelectorAll(selector);
    
    if (!nodes.length) return;

    if (reduce || !('IntersectionObserver' in window)) {
      nodes.forEach(n => n.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      let delay = 0;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (stagger) {
            entry.target.style.transitionDelay = `${delay}ms`;
            delay += 80;
          }
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

    nodes.forEach(n => io.observe(n));
  },

  /**
   * Anime un nombre de 0 vers sa valeur cible
   * @param {HTMLElement} el - Élément cible
   * @param {number} target - Valeur finale
   * @param {number} duration - Durée en ms
   */
  animateNumber: function(el, target, duration = 1500) {
    if (!el) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = Math.floor(progress * target);
      el.textContent = current.toLocaleString('fr-FR');
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString('fr-FR');
      }
    };
    window.requestAnimationFrame(step);
  },

  /**
   * Affiche un loader global de page
   */
  showPageLoader: function() {
    const loader = document.createElement('div');
    loader.id = 'globalLoader';
    loader.className = 'page-loader';
    loader.innerHTML = '<div class="loader-spinner"></div>';
    document.body.appendChild(loader);
  },

  /**
   * Masque le loader global
   */
  hidePageLoader: function() {
    const loader = document.getElementById('globalLoader');
    if (loader) {
      loader.classList.add('fade-out');
      setTimeout(() => loader.remove(), 600);
    }
  }
};

// Exposer globalement
window.Utils = Utils;

/**
 * Navigation bar component with glassmorphism.
 */
import { router } from '../router.js';
import { isConfigured } from '../services/llm-service.js';

export function createNavbar() {
    const nav = document.createElement('nav');
    nav.className = 'navbar glass';
    nav.innerHTML = `
    <div class="navbar-inner container">
      <a href="#/" class="navbar-brand" id="nav-brand">
        <span class="navbar-logo">R</span>
        <span class="navbar-title">Resume<span class="gradient-text">Crafter</span></span>
      </a>
      <div class="navbar-links">
        <a href="#/" class="navbar-link" data-route="/">Home</a>
        <a href="#/builder" class="navbar-link" data-route="/builder">Builder</a>
        <a href="#/crafter" class="navbar-link" data-route="/crafter">Crafter</a>
      </div>
      <div class="navbar-actions">
        <button class="btn btn-ghost btn-sm navbar-api-btn" id="nav-api-btn" title="AI Setup">
          <span class="api-status-dot ${isConfigured() ? 'connected' : ''}"></span>
          <span>AI Setup</span>
        </button>
      </div>
    </div>
  `;

    // Style
    const style = document.createElement('style');
    style.textContent = `
    .navbar {
      position: sticky;
      top: 0;
      z-index: var(--z-sticky);
      padding: var(--space-3) 0;
    }
    .navbar-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
    }
    .navbar-brand {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      text-decoration: none;
      color: var(--text-primary);
    }
    .navbar-logo {
      width: 34px;
      height: 34px;
      border-radius: var(--radius-md);
      background: var(--gradient-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: var(--weight-extrabold);
      font-size: var(--font-lg);
      color: white;
    }
    .navbar-title {
      font-size: var(--font-lg);
      font-weight: var(--weight-bold);
    }
    .navbar-links {
      display: flex;
      gap: var(--space-1);
    }
    .navbar-link {
      padding: var(--space-2) var(--space-4);
      font-size: var(--font-sm);
      font-weight: var(--weight-medium);
      color: var(--text-tertiary);
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
      text-decoration: none;
    }
    .navbar-link:hover {
      color: var(--text-primary);
      background: var(--color-primary-50);
    }
    .navbar-link.active {
      color: var(--color-primary-light);
      background: var(--color-primary-100);
    }
    .api-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-error);
      display: inline-block;
    }
    .api-status-dot.connected {
      background: var(--color-success);
      box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
    }
    .navbar-api-btn {
      gap: var(--space-2);
    }
    @media (max-width: 640px) {
      .navbar-links { display: none; }
      .navbar-title { display: none; }
    }
  `;
    nav.prepend(style);

    // Update active link on route change
    function updateActive() {
        const current = window.location.hash.replace('#', '') || '/';
        nav.querySelectorAll('.navbar-link').forEach(link => {
            link.classList.toggle('active', link.dataset.route === current);
        });

        // Update API status dot
        const dot = nav.querySelector('.api-status-dot');
        if (dot) dot.classList.toggle('connected', isConfigured());
    }

    window.addEventListener('hashchange', updateActive);
    setTimeout(updateActive, 0);

    return nav;
}

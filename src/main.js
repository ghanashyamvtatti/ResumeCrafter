/**
 * ResumeCrafter — Main entry point.
 */
import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';
import './styles/animations.css';

import { router } from './router.js';
import { createNavbar } from './components/navbar.js';
import { showApiSetupModal } from './components/api-setup-modal.js';
import { renderHomePage } from './pages/home.js';
import { renderBuilderPage } from './pages/builder.js';
import { renderCrafterPage } from './pages/crafter.js';

// Initialize app
function init() {
  const app = document.getElementById('app');

  // Create navbar
  const navbar = createNavbar();
  app.appendChild(navbar);

  // Create page container
  const pageContainer = document.createElement('main');
  pageContainer.id = 'page-container';
  pageContainer.style.flex = '1';
  app.appendChild(pageContainer);

  // Set up router
  router.setContainer(pageContainer);

  router.on('/', () => renderHomePage());
  router.on('/builder', () => renderBuilderPage());
  router.on('/crafter', () => renderCrafterPage());

  // Listen for API setup button
  document.addEventListener('click', (e) => {
    if (e.target.closest('#nav-api-btn') || e.target.closest('.navbar-api-btn')) {
      showApiSetupModal();
    }
  });

  // Resolve initial route
  router.resolve();
}

// Start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

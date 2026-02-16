/**
 * API Setup Modal — select provider, enter key, pick model.
 */
import { getProviders, listModels } from '../services/llm-service.js';
import { store } from '../store/resume-store.js';
import { showToast } from '../utils/toast.js';

export function showApiSetupModal() {
    // Remove any existing modal
    document.querySelector('.modal-backdrop')?.remove();

    const config = store.constructor.getApiConfig() || {};

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    const providers = getProviders();

    backdrop.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">⚙️ AI Provider Setup</h3>
        <button class="modal-close" id="modal-close">&times;</button>
      </div>

      <div class="api-setup-notice" style="
        background: var(--color-info-bg);
        border: 1px solid rgba(59, 130, 246, 0.2);
        border-radius: var(--radius-md);
        padding: var(--space-3) var(--space-4);
        margin-bottom: var(--space-6);
        font-size: var(--font-xs);
        color: var(--text-secondary);
      ">
        🔒 Your API key is stored only in your browser's session memory. It is never sent to any server except the LLM provider's API. The key is cleared when you close this tab.
      </div>

      <div class="form-group mb-6">
        <label class="form-label">AI Provider</label>
        <select class="form-select" id="api-provider">
          <option value="">Select a provider...</option>
          ${providers.map(p => `<option value="${p.id}" ${config.provider === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
        </select>
      </div>

      <div class="form-group mb-6">
        <label class="form-label">API Key</label>
        <div style="display: flex; gap: var(--space-2);">
          <input type="password" class="form-input" id="api-key" placeholder="Enter your API key" value="${config.apiKey || ''}" style="flex: 1;" />
          <button class="btn btn-secondary btn-sm" id="api-toggle-visibility" title="Show/hide key" style="flex-shrink: 0;">👁</button>
        </div>
        <span class="form-hint" id="api-key-hint"></span>
      </div>

      <div class="form-group mb-6">
        <label class="form-label">Model</label>
        <div style="display: flex; gap: var(--space-2);">
          <select class="form-select" id="api-model" style="flex: 1;" disabled>
            <option value="">Enter API key to load models...</option>
          </select>
          <button class="btn btn-secondary btn-sm" id="api-fetch-models" title="Fetch models" style="flex-shrink: 0;">🔄</button>
        </div>
        <span class="form-hint" id="api-model-hint"></span>
      </div>

      <div class="flex gap-3" style="margin-top: var(--space-6);">
        <button class="btn btn-primary flex-1" id="api-save">Save Configuration</button>
        ${config.apiKey ? '<button class="btn btn-danger btn-sm" id="api-clear">Clear</button>' : ''}
      </div>
    </div>
  `;

    document.body.appendChild(backdrop);

    // Elements
    const providerSelect = backdrop.querySelector('#api-provider');
    const keyInput = backdrop.querySelector('#api-key');
    const modelSelect = backdrop.querySelector('#api-model');
    const fetchBtn = backdrop.querySelector('#api-fetch-models');
    const saveBtn = backdrop.querySelector('#api-save');
    const clearBtn = backdrop.querySelector('#api-clear');
    const toggleBtn = backdrop.querySelector('#api-toggle-visibility');
    const modelHint = backdrop.querySelector('#api-model-hint');

    // Close
    backdrop.querySelector('#modal-close').addEventListener('click', () => backdrop.remove());
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.remove();
    });

    // Toggle password visibility
    toggleBtn.addEventListener('click', () => {
        keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
        toggleBtn.textContent = keyInput.type === 'password' ? '👁' : '🔒';
    });

    // Fetch models
    async function fetchModels() {
        const provider = providerSelect.value;
        const apiKey = keyInput.value.trim();
        if (!provider || !apiKey) {
            showToast('Please select a provider and enter an API key', 'warning');
            return;
        }

        modelSelect.disabled = true;
        modelSelect.innerHTML = '<option value="">Loading models...</option>';
        modelHint.textContent = '';

        try {
            const models = await listModels(provider, apiKey);
            modelSelect.disabled = false;

            if (models.length === 0) {
                modelSelect.innerHTML = '<option value="">No models found</option>';
                modelHint.textContent = 'No compatible models found for this API key.';
                return;
            }

            modelSelect.innerHTML = `<option value="">Select a model...</option>` +
                models.map(m => `<option value="${m.id}" ${config.model === m.id ? 'selected' : ''}>${m.name}</option>`).join('');
            modelHint.textContent = `${models.length} models available`;
        } catch (err) {
            modelSelect.innerHTML = '<option value="">Failed to load models</option>';
            modelHint.textContent = err.message;
            modelHint.style.color = 'var(--color-error)';
            showToast(`Failed to fetch models: ${err.message}`, 'error');
        }
    }

    fetchBtn.addEventListener('click', fetchModels);
    providerSelect.addEventListener('change', () => {
        modelSelect.innerHTML = '<option value="">Enter API key to load models...</option>';
        modelSelect.disabled = true;
        modelHint.textContent = '';
    });

    // Auto-fetch models if key exists
    keyInput.addEventListener('blur', () => {
        if (providerSelect.value && keyInput.value.trim()) {
            fetchModels();
        }
    });

    // If config already exists, load models
    if (config.provider && config.apiKey) {
        fetchModels();
    }

    // Save
    saveBtn.addEventListener('click', () => {
        const provider = providerSelect.value;
        const apiKey = keyInput.value.trim();
        const model = modelSelect.value;

        if (!provider || !apiKey || !model) {
            showToast('Please fill in all fields', 'warning');
            return;
        }

        store.constructor.setApiConfig({ provider, apiKey, model });
        showToast('AI configuration saved for this session!', 'success');
        backdrop.remove();

        // Update navbar status dot
        document.querySelectorAll('.api-status-dot').forEach(dot => {
            dot.classList.add('connected');
        });
    });

    // Clear
    clearBtn?.addEventListener('click', () => {
        store.constructor.clearApiConfig();
        showToast('API configuration cleared', 'info');
        backdrop.remove();

        document.querySelectorAll('.api-status-dot').forEach(dot => {
            dot.classList.remove('connected');
        });
    });
}

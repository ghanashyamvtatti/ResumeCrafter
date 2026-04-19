/**
 * Unified LLM Service — supports Claude, Gemini, and OpenAI.
 * All API keys are stored in sessionStorage only.
 */
import { wrapWithProxy as proxyUrl } from './cors-proxy.js';
import { store } from '../store/resume-store.js';

/* ---- Provider Definitions ---- */

const providers = {
    anthropic: {
        name: 'Claude (Anthropic)',
        needsProxy: true,
        baseUrl: 'https://api.anthropic.com',

        headers(apiKey) {
            return {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            };
        },

        async listModels(apiKey) {
            const url = proxyUrl(`${this.baseUrl}/v1/models`, this.needsProxy);
            const res = await fetch(url, { headers: this.headers(apiKey) });
            if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
            const data = await res.json();

            return (data.data || [])
                .filter(m => m.id && m.id.includes('claude'))
                .map(m => ({
                    id: m.id,
                    name: m.display_name || m.id,
                }))
                .sort((a, b) => a.name.localeCompare(b.name));
        },

        async chat(apiKey, model, messages, options = {}) {
            const url = proxyUrl(`${this.baseUrl}/v1/messages`, this.needsProxy);

            // Convert standard format to Claude format
            const systemMsg = messages.find(m => m.role === 'system');
            const chatMsgs = messages.filter(m => m.role !== 'system');

            const body = {
                model,
                max_tokens: options.maxTokens || 4096,
                messages: chatMsgs.map(m => ({ role: m.role, content: m.content })),
            };

            if (systemMsg) {
                body.system = systemMsg.content;
            }

            if (options.temperature !== undefined) {
                body.temperature = options.temperature;
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: this.headers(apiKey),
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error?.message || `Claude API error: ${res.status}`);
            }

            const data = await res.json();
            return data.content?.[0]?.text || '';
        },
    },

    google: {
        name: 'Gemini (Google)',
        needsProxy: false,
        baseUrl: 'https://generativelanguage.googleapis.com',

        headers() {
            return { 'content-type': 'application/json' };
        },

        async listModels(apiKey) {
            const url = `${this.baseUrl}/v1beta/models?key=${apiKey}`;
            const res = await fetch(url, { headers: this.headers() });
            if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
            const data = await res.json();

            return (data.models || [])
                .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
                .map(m => ({
                    id: m.name.replace('models/', ''),
                    name: m.displayName || m.name.replace('models/', ''),
                }))
                .sort((a, b) => a.name.localeCompare(b.name));
        },

        async chat(apiKey, model, messages, options = {}) {
            const url = `${this.baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;

            // Convert standard format to Gemini format
            const systemMsg = messages.find(m => m.role === 'system');
            const chatMsgs = messages.filter(m => m.role !== 'system');

            const body = {
                contents: chatMsgs.map(m => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }],
                })),
                generationConfig: {
                    maxOutputTokens: options.maxTokens || 4096,
                },
            };

            if (systemMsg) {
                body.systemInstruction = { parts: [{ text: systemMsg.content }] };
            }

            if (options.temperature !== undefined) {
                body.generationConfig.temperature = options.temperature;
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: this.headers(),
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error?.message || `Gemini API error: ${res.status}`);
            }

            const data = await res.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        },
    },

    openai: {
        name: 'OpenAI (GPT)',
        needsProxy: true,
        baseUrl: 'https://api.openai.com',

        headers(apiKey) {
            return {
                'Authorization': `Bearer ${apiKey}`,
                'content-type': 'application/json',
            };
        },

        async listModels(apiKey) {
            const url = proxyUrl(`${this.baseUrl}/v1/models`, this.needsProxy);
            const res = await fetch(url, { headers: this.headers(apiKey) });
            if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
            const data = await res.json();

            return (data.data || [])
                .filter(m => m.id && (m.id.includes('gpt') || m.id.includes('o1') || m.id.includes('o3') || m.id.includes('o4')))
                .map(m => ({
                    id: m.id,
                    name: m.id,
                }))
                .sort((a, b) => a.name.localeCompare(b.name));
        },

        async chat(apiKey, model, messages, options = {}) {
            const url = proxyUrl(`${this.baseUrl}/v1/chat/completions`, this.needsProxy);

            const body = {
                model,
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                max_tokens: options.maxTokens || 4096,
            };

            if (options.temperature !== undefined) {
                body.temperature = options.temperature;
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: this.headers(apiKey),
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error?.message || `OpenAI API error: ${res.status}`);
            }

            const data = await res.json();
            return data.choices?.[0]?.message?.content || '';
        },
    },

    openrouter: {
        name: 'OpenRouter',
        needsProxy: false,
        baseUrl: 'https://openrouter.ai',

        headers(apiKey) {
            return {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-OpenRouter-Title': 'ResumeCrafter',
            };
        },

        async listModels(apiKey) {
            const res = await fetch(`${this.baseUrl}/api/v1/models`, {
                headers: this.headers(apiKey),
            });
            if (!res.ok) throw new Error(`OpenRouter API error: ${res.status}`);
            const data = await res.json();

            return (data.data || [])
                .filter(m => m.id && m.context_length > 0)
                .map(m => ({
                    id: m.id,
                    name: m.name || m.id,
                }))
                .sort((a, b) => a.name.localeCompare(b.name));
        },

        async chat(apiKey, model, messages, options = {}) {
            const body = {
                model,
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                max_tokens: options.maxTokens || 4096,
            };

            if (options.temperature !== undefined) {
                body.temperature = options.temperature;
            }

            const res = await fetch(`${this.baseUrl}/api/v1/chat/completions`, {
                method: 'POST',
                headers: this.headers(apiKey),
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error?.message || `OpenRouter API error: ${res.status}`);
            }

            const data = await res.json();
            return data.choices?.[0]?.message?.content || '';
        },
    },

    local: {
        name: 'Local (Ollama / LM Studio / llama.cpp)',
        needsProxy: false,
        defaultBaseUrl: 'http://localhost:11434',
        isLocal: true,

        headers(apiKey) {
            const h = { 'Content-Type': 'application/json' };
            if (apiKey) h['Authorization'] = `Bearer ${apiKey}`;
            return h;
        },

        async listModels(apiKey, baseUrl) {
            const base = baseUrl || this.defaultBaseUrl;

            // Try OpenAI-compatible endpoint first (/v1/models)
            // Ollama (>=0.1.24), LM Studio, and llama.cpp all support this
            try {
                const res = await fetch(`${base}/v1/models`, { headers: this.headers(apiKey) });
                if (res.ok) {
                    const data = await res.json();
                    return (data.data || [])
                        .map(m => ({ id: m.id, name: m.id }))
                        .sort((a, b) => a.name.localeCompare(b.name));
                }
            } catch { /* fall through to Ollama-native endpoint */ }

            // Fallback: Ollama's native /api/tags endpoint
            try {
                const res = await fetch(`${base}/api/tags`, { headers: this.headers(apiKey) });
                if (res.ok) {
                    const data = await res.json();
                    return (data.models || [])
                        .map(m => ({ id: m.name || m.model, name: m.name || m.model }))
                        .sort((a, b) => a.name.localeCompare(b.name));
                }
            } catch { /* fall through */ }

            throw new Error(`Could not connect to local LLM at ${base}. Make sure your server is running and CORS is enabled.`);
        },

        async chat(apiKey, model, messages, options = {}, baseUrl) {
            const base = baseUrl || this.defaultBaseUrl;

            const body = {
                model,
                messages: messages.map(m => ({ role: m.role, content: m.content })),
            };

            // Some local servers don't support max_tokens
            if (options.maxTokens) body.max_tokens = options.maxTokens;
            if (options.temperature !== undefined) body.temperature = options.temperature;
            // Disable streaming for simplicity
            body.stream = false;

            const res = await fetch(`${base}/v1/chat/completions`, {
                method: 'POST',
                headers: this.headers(apiKey),
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error?.message || `Local LLM error: ${res.status}. Is the server running at ${base}?`);
            }

            const data = await res.json();
            return data.choices?.[0]?.message?.content || '';
        },
    },
};

/* ---- Public API ---- */

export function getProviders() {
    return Object.entries(providers).map(([id, p]) => ({
        id,
        name: p.name,
    }));
}

export async function listModels(providerId, apiKey, baseUrl) {
    const provider = providers[providerId];
    if (!provider) throw new Error(`Unknown provider: ${providerId}`);
    return provider.listModels(apiKey, baseUrl);
}

export async function chat(messages, options = {}) {
    const config = store.constructor.getApiConfig();
    if (!config) throw new Error('No API configuration. Please set up your API key first.');

    const provider = providers[config.provider];
    if (!provider) throw new Error(`Unknown provider: ${config.provider}`);

    return provider.chat(config.apiKey, config.model, messages, options, config.baseUrl);
}

export function isConfigured() {
    const config = store.constructor.getApiConfig();
    if (!config || !config.provider || !config.model) return false;
    // Local providers don't require an API key
    const provider = providers[config.provider];
    if (provider?.isLocal) return true;
    return !!config.apiKey;
}

export function getConfig() {
    return store.constructor.getApiConfig();
}

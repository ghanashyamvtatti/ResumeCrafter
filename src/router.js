/**
 * Simple hash-based SPA router for GitHub Pages compatibility.
 */
export class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.container = null;
        window.addEventListener('hashchange', () => this.resolve());
    }

    setContainer(el) {
        this.container = el;
    }

    on(path, handler) {
        this.routes[path] = handler;
    }

    navigate(path) {
        window.location.hash = path;
    }

    resolve() {
        const hash = window.location.hash.replace('#', '') || '/';
        const route = this.routes[hash];

        if (route && this.container) {
            this.currentRoute = hash;
            this.container.innerHTML = '';
            this.container.classList.add('page-enter');

            const result = route();
            if (typeof result === 'string') {
                this.container.innerHTML = result;
            } else if (result instanceof HTMLElement) {
                this.container.appendChild(result);
            }

            // Remove animation class after it's done
            setTimeout(() => this.container.classList.remove('page-enter'), 400);

            // Dispatch route change event
            window.dispatchEvent(new CustomEvent('routechange', { detail: { path: hash } }));
        } else if (this.container) {
            this.navigate('/');
        }
    }

    getCurrentRoute() {
        return this.currentRoute;
    }
}

export const router = new Router();

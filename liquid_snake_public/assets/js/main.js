/**
 * Couchbase Query Analyzer - Shared JavaScript
 * Version: 4.0.0-dev
 * 
 * This file contains shared JavaScript used across all public pages:
 * - index.html
 * - analysis_hub.html
 * - getting_started.html
 * - sql_queries.html
 */

/* ==========================================================================
   Tab Switcher
   ========================================================================== */

/**
 * Switch between tabs in a tab container.
 * Only affects tabs within the same .tabs-container as the clicked button.
 * @param {string} tabId - The ID suffix of the tab to show (e.g., 'docker' for 'tab-docker')
 * @param {Event} [evt] - The click event (optional, for better cross-browser support)
 */
function switchTab(tabId, evt) {
    const eventSource = evt?.target || window.event?.target;
    
    // Find the parent .tabs-container to scope the tab switching
    const container = eventSource?.closest('.tabs-container');
    
    if (container) {
        // Only affect tabs within this container
        container.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        container.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        
        if (eventSource && eventSource.classList.contains('tab-btn')) {
            eventSource.classList.add('active');
        }
        
        const targetTab = container.querySelector('#tab-' + tabId);
        if (targetTab) {
            targetTab.classList.add('active');
        }
    } else {
        // Fallback to global behavior if no container found
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        
        if (eventSource && eventSource.classList.contains('tab-btn')) {
            eventSource.classList.add('active');
        }
        
        const targetTab = document.getElementById('tab-' + tabId);
        if (targetTab) {
            targetTab.classList.add('active');
        }
    }
}

/* ==========================================================================
   SQL Copy Button
   ========================================================================== */

/**
 * Initialize SQL copy-to-clipboard buttons.
 * Finds all elements with class 'sql-copy-btn' and adds click handlers.
 */
function initSqlCopyButtons() {
    document.querySelectorAll('.sql-copy-btn').forEach(button => {
        button.addEventListener('click', () => {
            const pre = button.parentElement.querySelector('pre');
            if (!pre) return;
            
            const code = pre.textContent;
            navigator.clipboard.writeText(code).then(() => {
                button.style.background = '#28a745';
                const prevText = button.textContent;
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = prevText;
                    button.style.background = '';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        });
    });
}

/* ==========================================================================
   Accordion
   ========================================================================== */

/**
 * Toggle an accordion section open/closed.
 * @param {HTMLElement} header - The accordion header element that was clicked
 */
function toggleAccordion(header) {
    const content = header.nextElementSibling;
    if (!content) return;
    
    const isOpen = content.classList.toggle('open');
    header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

/**
 * Initialize accordion ARIA attributes and keyboard support.
 */
function initAccordions() {
    document.querySelectorAll('.accordion').forEach((acc, i) => {
        const header = acc.querySelector('.accordion-header');
        const content = acc.querySelector('.accordion-content');
        if (!header || !content) return;
        
        const id = content.id || `acc-content-${i}`;
        content.id = id;
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.setAttribute('aria-controls', id);
        header.setAttribute('aria-expanded', 'false');
        
        // Add keyboard support (Enter and Space to toggle)
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleAccordion(header);
            }
        });
    });
}

/* ==========================================================================
   Screenshot Preview Lightbox
   ========================================================================== */

/**
 * Initialize screenshot preview lightbox.
 * Click on .screenshot-preview images to show full-size in overlay.
 */
function initScreenshotPreviews() {
    document.querySelectorAll('.screenshot-preview').forEach(img => {
        img.addEventListener('click', () => {
            const overlay = document.createElement('div');
            overlay.className = 'lightbox-overlay';
            
            const fullImg = document.createElement('img');
            fullImg.src = img.src;
            fullImg.alt = img.alt;
            
            overlay.appendChild(fullImg);
            document.body.appendChild(overlay);
            
            // Close on click
            overlay.addEventListener('click', () => {
                overlay.remove();
            });
            
            // Close on Escape key
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    overlay.remove();
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
    });
}

/* ==========================================================================
   DOM Ready Initialization
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize SQL copy buttons
    initSqlCopyButtons();
    
    // Initialize accordions (basic version)
    // Note: analysis_hub.html has additional accordion logic for glossary/lockable sections
    // that should be kept in that file's <script> block
    initAccordions();
    
    // Initialize screenshot preview lightbox
    initScreenshotPreviews();
});

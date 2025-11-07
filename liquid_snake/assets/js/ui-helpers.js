// ============================================================
// UI-HELPERS.JS - DOM and UX Utilities
// ============================================================
// This module provides:
// - DOM utilities ($, $$, on, off)
// - Toast notifications
// - Modal helpers
// - Clipboard utilities
// - Formatters (number, duration, bytes)
// - Debounce/throttle
// ============================================================

import { TEXT_CONSTANTS, Logger } from './base.js';

// ============================================================
// DOM UTILITIES
// ============================================================

// Shorthand for querySelector
export function $(selector, root = document) {
    return root.querySelector(selector);
}

// Shorthand for querySelectorAll (returns array)
export function $$(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
}

// Add event listener helper
export function on(element, event, handler) {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.addEventListener(event, handler);
    }
}

// Remove event listener helper
export function off(element, event, handler) {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.removeEventListener(event, handler);
    }
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================

export function showToast(message, type = "info", durationMs = 10000) {
    // Remove any existing toasts
    const existingToasts = $$(".toast, .sliding-toast");
    existingToasts.forEach((toast) => toast.remove());

    const toast = document.createElement("div");
    toast.className = "sliding-toast";
    toast.style.cssText = `
      position: fixed;
      top: -50px;
      left: 20px;
      padding: 12px 40px 12px 20px;
      border-radius: 6px;
      background: #e3f2fd;
      border: 1px solid #bbdefb;
      color: #0d47a1;
      font-size: 13px;
      font-weight: 600;
      z-index: 10001;
      max-width: 360px;
      word-wrap: break-word;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.35s ease-out;
      transform: translateY(0px);
    `;

    // Add message text
    const messageSpan = document.createElement("span");
    messageSpan.textContent = message;
    toast.appendChild(messageSpan);

    // Add close button
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "×";
    closeBtn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: transparent;
      border: none;
      color: inherit;
      font-size: 20px;
      font-weight: bold;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      line-height: 20px;
      text-align: center;
      opacity: 0.6;
      transition: opacity 0.2s;
    `;
    closeBtn.onmouseover = () => closeBtn.style.opacity = "1";
    closeBtn.onmouseout = () => closeBtn.style.opacity = "0.6";
    closeBtn.onclick = () => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px)";
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 400);
    };
    toast.appendChild(closeBtn);

    // Type-specific styling
    if (type === "success") {
        toast.style.background = "#d4edda";
        toast.style.border = "1px solid #c3e6cb";
        toast.style.color = "#155724";
    } else if (type === "warning") {
        toast.style.background = "#fff3cd";
        toast.style.border = "1px solid #ffeaa7";
        toast.style.color = "#856404";
    } else if (type === "error") {
        toast.style.background = "#f8d7da";
        toast.style.border = "1px solid #f5c6cb";
        toast.style.color = "#721c24";
    }

    document.body.appendChild(toast);

    // Slide in animation
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.style.top = "20px";
        });
    });

    // Auto-remove after duration
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px)";
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 400);
    }, durationMs);
}

// ============================================================
// CLIPBOARD UTILITIES
// ============================================================

export const ClipboardUtils = {
    // Copy text to clipboard with button feedback
    copyToClipboard(text, button, options = {}) {
        const {
            successText = TEXT_CONSTANTS.COPIED || "Copied!",
            originalText = button.textContent,
            successColor = "#4CAF50",
            duration = 1000,
            useToast = false
        } = options;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
                .writeText(text)
                .then(() => {
                    this._showButtonFeedback(button, successText, originalText, successColor, duration);
                    if (useToast) showToast(TEXT_CONSTANTS.COPIED_CLIPBOARD);
                })
                .catch((err) => {
                    Logger.error("Failed to copy:", err);
                    this._fallbackCopy(text, button);
                });
        } else {
            this._fallbackCopy(text, button);
        }
    },

    // Show visual feedback on button
    _showButtonFeedback(button, successText, originalText, successColor, duration) {
        const originalBg = button.style.backgroundColor;
        button.textContent = successText;
        button.style.backgroundColor = successColor;
        setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = originalBg;
        }, duration);
    },

    // Fallback copy for older browsers
    _fallbackCopy(text, button) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.top = "-1000px";
        textArea.style.left = "-1000px";
        textArea.setAttribute("aria-hidden", "true");
        textArea.setAttribute("tabindex", "-1");

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand("copy");
            if (successful) {
                showToast(TEXT_CONSTANTS.COPIED_CLIPBOARD);
            } else {
                showToast(TEXT_CONSTANTS.FAILED_COPY_CLIPBOARD, "error");
            }
        } catch (err) {
            Logger.error("Fallback: Unable to copy", err);
            showToast("Failed to copy to clipboard", "error");
        }

        document.body.removeChild(textArea);
    }
};

// Convenience function
export function copyToClipboard(text, event) {
    ClipboardUtils.copyToClipboard(text, event.target, {
        successColor: "#28a745"
    });
}

// ============================================================
// PERFORMANCE UTILITIES
// ============================================================

// Debounce function
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================================
// FORMATTERS
// ============================================================

// Format number with commas
export function formatNumber(num) {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString();
}

// Format bytes to human readable
export function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    if (!bytes) return 'N/A';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Format duration in milliseconds to human readable
export function formatDuration(ms) {
    if (!ms && ms !== 0) return 'N/A';
    
    if (ms < 1000) {
        return `${Math.round(ms)}ms`;
    } else if (ms < 60000) {
        return `${(ms / 1000).toFixed(2)}s`;
    } else if (ms < 3600000) {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return `${minutes}m ${seconds}s`;
    } else {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    }
}

// Escape HTML to prevent XSS
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
// MODAL HELPERS
// ============================================================

// Open modal
export function openModal(modalId) {
    const modal = $(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

// Close modal
export function closeModal(modalId) {
    const modal = $(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal on outside click
export function setupModalClose(modalId) {
    const modal = $(modalId);
    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal(modalId);
            }
        });
    }
}

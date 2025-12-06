// ============================================================
// UTILS.JS - Miscellaneous Utility Functions
// ============================================================
// Contains utility functions that don't fit in other modules
// ============================================================

import { Logger, TEXT_CONSTANTS } from './base.js';

// Get app version info
export function getVersionInfo() {
    return {
        version: "4.0.0-dev",
        lastUpdated: "2025-11-06",
        features: [
            "Global system query exclusion",
            "Enhanced accessibility (ARIA)",
            "Chart performance optimizations",
            "Time range filtering with buffers",
            "Index/Query Flow analysis",
            "Toast notification system"
        ]
    };
}

// Expose globally
window.getVersionInfo = getVersionInfo;

export default {
    getVersionInfo
};

console.log('✅ utils.js module loaded');

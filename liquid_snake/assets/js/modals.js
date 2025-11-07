// ============================================================
// MODALS.JS - Modal Dialogs and UI Toggles Module
// ============================================================
// This module handles modal dialogs, tooltips, and UI toggles.
// ============================================================

import { Logger, TEXT_CONSTANTS } from './base.js';
import { 
    statementStore,
    getOperators
} from './data-layer.js';
import { 
    escapeHtml,
    ClipboardUtils
} from './ui-helpers.js';

// ============================================================
// MODAL AND TOGGLE FUNCTIONS
// ============================================================


// ============================================================
// buildEnhancedPlanModal
// ============================================================

        function buildEnhancedPlanModal(plan, indexesAndKeys, request) {
            let html = '<div style="margin-bottom: 20px;">';

            // Indexes section
            if (indexesAndKeys.indexes.length > 0) {
                html += '<div style="margin-bottom: 15px;">';
                html +=
                    '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">';
                html += `<h3 style="margin: 0; color: #333; font-size: 16px;">${TEXT_CONSTANTS.INDEXES_USED_HEADER}</h3>`;
                const allIndexes = indexesAndKeys.indexes.join(", ");
                html += `<button onclick="copyToClipboard('${allIndexes.replace(
                    /'/g,
                    "\\'"
                )}', event)" 
                        class="btn-standard" style="background: #4CAF50;">${TEXT_CONSTANTS.COPY_ALL}</button>`;
                html += "</div>";
                html += '<div style="display: flex; flex-wrap: wrap; gap: 10px;">';
                indexesAndKeys.indexes.forEach((index) => {
                    html += `<div style="background: #f0f8ff; padding: 5px 10px; border-radius: 4px; border: 1px solid #ddd;">
                        <code style="font-family: monospace; color: #333;">${index}</code>
                    </div>`;
                });
                html += "</div></div>";
            }

            // USE KEYS section
            if (indexesAndKeys.hasUseKeys) {
                html += '<div style="margin-bottom: 15px;">';

                if (indexesAndKeys.useKeys.length > 0) {
                    // Header with Copy All button
                    html +=
                        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">';
                    html += `<h3 style="margin: 0; color: #333; font-size: 16px;">${TEXT_CONSTANTS.USE_KEYS_HEADER}</h3>`;
                    const allKeys = indexesAndKeys.useKeys.join(", ");
                    html += `<button onclick="copyToClipboard('${allKeys.replace(
                        /'/g,
                        "\\'"
                    )}', event)" 
                            class="btn-standard" style="background: #ff9800;">${TEXT_CONSTANTS.COPY_ALL}</button>`;
                    html += "</div>";

                    const maxKeysToShow = 15;
                    const shouldTruncate =
                        indexesAndKeys.useKeys.length > maxKeysToShow;

                    // Keys display container
                    html +=
                        '<div id="keys-container" style="display: flex; flex-wrap: wrap; gap: 8px;">';

                    // Show initial set of keys
                    const keysToShow = shouldTruncate
                        ? indexesAndKeys.useKeys.slice(0, maxKeysToShow)
                        : indexesAndKeys.useKeys;
                    keysToShow.forEach((key) => {
                        html += `<div style="background: #fff3cd; padding: 4px 8px; border-radius: 4px; border: 1px solid #ffeaa7;">
                            <code class="font-size-12" style="font-family: monospace; color: #856404;">${key}</code>
                        </div>`;
                    });

                    // Hidden keys (if truncated)
                    if (shouldTruncate) {
                        const remainingKeys = indexesAndKeys.useKeys.slice(maxKeysToShow);
                        remainingKeys.forEach((key) => {
                            html += `<div class="hidden-key display-none" style="background: #fff3cd; padding: 4px 8px; border-radius: 4px; border: 1px solid #ffeaa7;">
                                <code class="font-size-12" style="font-family: monospace; color: #856404;">${key}</code>
                            </div>`;
                        });
                    }

                    html += "</div>";

                    // Show more/hide button
                    if (shouldTruncate) {
                        const remainingCount =
                            indexesAndKeys.useKeys.length - maxKeysToShow;
                        html += `<div style="margin-top: 10px;">`;
                        html += `<button id="toggle-keys-btn" onclick="toggleUseKeys()" 
                                style="padding: 6px 12px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;">
                                Show ${remainingCount} more keys
                            </button>`;
                        html += `</div>`;
                    }

                    // Summary info
                    html += `<div style="margin-top: 8px; font-size: 11px; color: #666; font-style: italic;">
                        Total: ${indexesAndKeys.useKeys.length} key${indexesAndKeys.useKeys.length !== 1 ? "s" : ""
                        }
                    </div>`;
                } else {
                    html += `<h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">${TEXT_CONSTANTS.USE_KEYS_HEADER}</h3>`;
                    html += `<div style="color: #666; font-style: italic;">${TEXT_CONSTANTS.KEYS_NOT_EXTRACTED}</div>`;
                }
                html += "</div>";
            }

            html += "</div>";

            // Execution plan section
            html += '<div style="border-top: 1px solid #ddd; padding-top: 15px;">';
            
            // Parse time above Execution Plan
            if (request && request.phaseTimes && request.phaseTimes.parse) {
                const parseTimeStr = request.phaseTimes.parse;
                const parseMs = parseTime(parseTimeStr);
                const parseColor = parseMs >= 1 ? '#dc3545' : '#333';
                
                html += `<div style="margin-bottom: 10px;">`;
                html += `<span style="color: #333; font-size: 14px;">Parse Statement: </span>`;
                html += `<span style="color: ${parseColor}; font-weight: bold; font-size: 14px;">${parseTimeStr}</span>`;
                html += `</div>`;
            }
            
            // Execution Plan header with Plan time
            let executionPlanHeader = TEXT_CONSTANTS.EXECUTION_PLAN_HEADER;
            if (request && request.phaseTimes && request.phaseTimes.plan) {
                const planTimeStr = request.phaseTimes.plan;
                const planMs = parseTime(planTimeStr);
                const planColor = planMs >= 1 ? '#dc3545' : '#333';
                
                html += `<h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">`;
                html += executionPlanHeader;
                html += ` <span style="color: ${planColor}; font-weight: bold;">${planTimeStr}</span>`;
                html += `</h3>`;
            } else {
                html += `<h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">${executionPlanHeader}</h3>`;
            }
            
            html += "<ul>" + buildPlanTree(plan) + "</ul>";
            html += "</div>";

            return html;
        }

// ============================================================
// toggleStatement
// ============================================================

        function toggleStatement(statementId, showFull) {
            const truncatedDiv = document.getElementById(
                statementId + "-truncated"
            );
            const fullDiv = document.getElementById(statementId + "-full");

            if (showFull) {
                truncatedDiv.style.display = "none";
                fullDiv.style.display = "block";
            } else {
                truncatedDiv.style.display = "block";
                fullDiv.style.display = "none";
            }
        }

// ============================================================
// toggleAnalysisStatement
// ============================================================

        function toggleAnalysisStatement(statementId, showFull) {
            const truncatedDiv = document.getElementById(
                statementId + "-truncated"
            );
            const fullDiv = document.getElementById(statementId + "-full");

            if (showFull) {
                truncatedDiv.style.display = "none";
                fullDiv.style.display = "block";
            } else {
                truncatedDiv.style.display = "block";
                fullDiv.style.display = "none";
            }
        }

// ============================================================
// toggleCollectionDataset
// ============================================================

        function toggleCollectionDataset(index) {
            const chart = window.collectionQueriesChart;
            if (!chart) return;
            
            const meta = chart.getDatasetMeta(index);
            meta.hidden = !meta.hidden;
            chart.update();
            
            // Update legend item styling
            const legendItem = document.getElementById(`collection-legend-item-${index}`);
            const legendLabel = document.getElementById(`collection-legend-label-${index}`);
            const legendCount = document.getElementById(`collection-legend-count-${index}`);
            
            if (meta.hidden) {
                // Apply strikethrough and reduce opacity
                if (legendLabel) legendLabel.style.textDecoration = 'line-through';
                if (legendCount) legendCount.style.textDecoration = 'line-through';
                if (legendItem) legendItem.style.opacity = '0.5';
            } else {
                // Remove strikethrough and restore opacity
                if (legendLabel) legendLabel.style.textDecoration = 'none';
                if (legendCount) legendCount.style.textDecoration = 'none';
                if (legendItem) legendItem.style.opacity = '1';
            }
        }

// ============================================================
// showAllCollections
// ============================================================

        function showAllCollections() {
            const chart = window.collectionQueriesChart;
            if (!chart) return;
            
            const datasets = window.collectionDatasetsForLegend;
            if (!datasets) return;
            
            // Show all datasets
            datasets.forEach((dataset, index) => {
                const meta = chart.getDatasetMeta(index);
                meta.hidden = false;
            });
            
            chart.update();
            
            // Get current sort order
            const sortSelect = document.getElementById('collection-sort-select');
            const currentSort = sortSelect ? sortSelect.value : 'queries';
            
            // Re-render legend to update styling
            renderCollectionLegend(currentSort);
        }

// ============================================================
// hideAllCollections
// ============================================================

        function hideAllCollections() {
            const chart = window.collectionQueriesChart;
            if (!chart) return;
            
            const datasets = window.collectionDatasetsForLegend;
            if (!datasets) return;
            
            // Hide all datasets
            datasets.forEach((dataset, index) => {
                const meta = chart.getDatasetMeta(index);
                meta.hidden = true;
            });
            
            chart.update();
            
            // Get current sort order
            const sortSelect = document.getElementById('collection-sort-select');
            const currentSort = sortSelect ? sortSelect.value : 'queries';
            
            // Re-render legend to update styling
            renderCollectionLegend(currentSort);
        }

// ============================================================
// toggleCategory
// ============================================================

        function toggleCategory(categoryId) {
            const title = document.querySelector(`#${categoryId} .category-title`);
            const content = document.getElementById(`${categoryId}-content`);

            if (title && content) {
                title.classList.toggle('collapsed');
                content.classList.toggle('collapsed');
            }
        }

// ============================================================
// showFilterReminder
// ============================================================

        function showFilterReminder() {
            // Clear any existing timeout
            if (filterReminderTimeout) {
                clearTimeout(filterReminderTimeout);
            }

            // Remove any existing filter reminder toasts
            const existingFilterToasts = document.querySelectorAll(".filter-reminder-toast");
            existingFilterToasts.forEach((toast) => toast.remove());

            // Create the toast
            const toast = document.createElement("div");
            toast.className = "filter-reminder-toast";
            toast.textContent = TEXT_CONSTANTS.FILTERS_CHANGED_REMINDER;
            toast.style.cssText = `
                position: fixed;
                top: -50px;
                left: 20px;
                padding: 12px 20px;
                border-radius: 6px;
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                font-size: 13px;
                font-weight: 500;
                z-index: 10001;
                max-width: 320px;
                word-wrap: break-word;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.4s ease-out;
                transform: translateY(0px);
            `;

            document.body.appendChild(toast);

            // Animate slide down from top
            setTimeout(() => {
                toast.style.top = "20px";
                toast.style.transform = "translateY(0px)";
            }, 10);

            // Auto-hide after 10 seconds
            filterReminderTimeout = setTimeout(() => {
                toast.style.opacity = "0";
                toast.style.transform = "translateY(-10px)";
                setTimeout(() => {
                    if (toast.parentNode) {
                        document.body.removeChild(toast);
                    }
                }, 400);
                filterReminderTimeout = null;
            }, 10000);
        }

// ============================================================
// hideFilterReminder
// ============================================================

        function hideFilterReminder() {
            // Clear timeout and remove any existing filter reminder toasts
            if (filterReminderTimeout) {
                clearTimeout(filterReminderTimeout);
                filterReminderTimeout = null;
            }
            const existingFilterToasts = document.querySelectorAll(".filter-reminder-toast");
            existingFilterToasts.forEach((toast) => {
                toast.style.opacity = "0";
                toast.style.transform = "translateY(-10px)";
                setTimeout(() => {
                    if (toast.parentNode) {
                        document.body.removeChild(toast);
                    }
                }, 400);
            });
        }

// ============================================================
// toggleInputSection
// ============================================================

            function toggleInputSection() {
                const input = document.getElementById('input-section');
                if (!input) return;
                // User manually toggled; disable future auto-hide for this session
                _inputAutoHideDisabled = true;
                if (_inputHideTimer) { clearTimeout(_inputHideTimer); _inputHideTimer = null; }
                const cs = window.getComputedStyle ? getComputedStyle(input) : null;
                const isHidden = (
                    (cs && (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse')) ||
                    input.style.display === 'none' ||
                    input.hidden === true
                );
                if (isHidden) showInputSection(); else hideInputSection();
            }

// ============================================================
// toggleSampleQueries
// ============================================================

        function toggleSampleQueries() {
            const container = document.getElementById('sample-queries-container');
            const btnText = document.getElementById('sample-queries-btn-text');
            
            sampleQueriesVisible = !sampleQueriesVisible;
            
            if (sampleQueriesVisible) {
                container.style.display = 'block';
                btnText.textContent = TEXT_CONSTANTS.HIDE_SAMPLE_QUERIES;
            } else {
                container.style.display = 'none';
                btnText.textContent = TEXT_CONSTANTS.SHOW_SAMPLE_QUERIES;
            }
        }

// ============================================================
// toggleSampleStatement
// ============================================================

        function toggleSampleStatement(statementId, showFull) {
            const truncatedDiv = document.getElementById(statementId + '-truncated');
            const fullDiv = document.getElementById(statementId + '-full');
            
            if (showFull) {
                truncatedDiv.style.display = 'none';
                fullDiv.style.display = 'block';
            } else {
                truncatedDiv.style.display = 'block';
                fullDiv.style.display = 'none';
            }
        }

// ============================================================
// toggleTimeoutQueriesTable
// ============================================================

        function toggleTimeoutQueriesTable() {
            const container = document.getElementById('timeout-prone-queries-sample-queries-container');
            const btnText = document.getElementById('timeout-prone-queries-sample-queries-btn-text');
            
            if (!container || !btnText) return;
            
            timeoutQueriesVisible = !timeoutQueriesVisible;
            
            if (timeoutQueriesVisible) {
                container.style.display = 'block';
                btnText.textContent = TEXT_CONSTANTS.HIDE_SAMPLE_QUERIES;
            } else {
                container.style.display = 'none';
                btnText.textContent = TEXT_CONSTANTS.SHOW_SAMPLE_QUERIES;
            }
        }

// ============================================================
// toggleQueryText
// ============================================================

        function toggleQueryText(id) {
            const element = document.getElementById(`query-text-${id}`);
            const button = element.nextElementSibling.firstElementChild;

            if (element.classList.contains("expanded")) {
                element.classList.remove("expanded");
                button.textContent = "Show More";
            } else {
                element.classList.add("expanded");
                button.textContent = "Hide";
            }
        }

// ============================================================
// toggleUseKeys
// ============================================================

        function toggleUseKeys() {
            const hiddenKeys = document.querySelectorAll(".hidden-key");
            const toggleBtn = document.getElementById("toggle-keys-btn");

            if (hiddenKeys.length > 0) {
                const isHidden = hiddenKeys[0].style.display === "none";

                if (isHidden) {
                    // Show hidden keys
                    hiddenKeys.forEach((key) => (key.style.display = "block"));
                    toggleBtn.textContent = "Hide Keys";
                } else {
                    // Hide keys
                    hiddenKeys.forEach((key) => (key.style.display = "none"));
                    toggleBtn.textContent = `Show ${hiddenKeys.length} More Keys`;
                }
            }
        }

// ============================================================
// toggleSectionsVisibility
// ============================================================

        function toggleSectionsVisibility(selections) {
            const panels = document.querySelectorAll('[data-report-section]');
            panels.forEach(p => p.classList.remove('report-visible'));
            Object.keys(selections.sections).forEach(key => {
                if (selections.sections[key]) {
                    const el = document.querySelector(`[data-report-section=\"${key}\"]`);
                    if (el) el.classList.add('report-visible');
                }
            });

            // Within timeline, hide unselected chart containers
            const tlSel = selections.timelineCharts || {};
            document.querySelectorAll('#timeline .chart-container').forEach(c => {
                const id = c.getAttribute('data-chart-id');
                if (!id) return;
                c.style.display = (tlSel[id] === false) ? 'none' : '';
            });
        }

// ============================================================
// EXPORTS
// ============================================================

export {
    buildEnhancedPlanModal,
    toggleStatement,
    toggleAnalysisStatement,
    toggleCollectionDataset,
    showAllCollections,
    hideAllCollections,
    toggleCategory,
    showFilterReminder,
    hideFilterReminder,
    toggleInputSection,
    toggleSampleQueries,
    toggleSampleStatement,
    toggleTimeoutQueriesTable,
    toggleQueryText,
    toggleUseKeys,
    toggleSectionsVisibility
};

// Expose globally
window.buildEnhancedPlanModal = buildEnhancedPlanModal;
window.toggleStatement = toggleStatement;
window.toggleAnalysisStatement = toggleAnalysisStatement;
window.toggleCollectionDataset = toggleCollectionDataset;
window.showAllCollections = showAllCollections;
window.hideAllCollections = hideAllCollections;
window.toggleCategory = toggleCategory;
window.showFilterReminder = showFilterReminder;
window.hideFilterReminder = hideFilterReminder;
window.toggleInputSection = toggleInputSection;
window.toggleSampleQueries = toggleSampleQueries;
window.toggleSampleStatement = toggleSampleStatement;
window.toggleTimeoutQueriesTable = toggleTimeoutQueriesTable;
window.toggleQueryText = toggleQueryText;
window.toggleUseKeys = toggleUseKeys;
window.toggleSectionsVisibility = toggleSectionsVisibility;

console.log('✅ modals.js module loaded');

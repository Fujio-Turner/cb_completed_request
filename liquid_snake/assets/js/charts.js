/**
 * charts.js - Chart Generation and Management Module
 * 
 * Extracted from main-legacy.js for better code organization.
 * This module handles all Chart.js chart generation, destruction, and synchronization.
 * 
 * Dependencies:
 * - Chart.js library (global)
 * - data-layer.js (for data access)
 * - base.js (for Logger and TEXT_CONSTANTS)
 * - ui-helpers.js (for formatting utilities)
 */

// ============================================================
// IMPORTS
// ============================================================

import { Logger, TEXT_CONSTANTS } from './base.js';
import { 
    originalRequests,
    parseTime,
    normalizeStatement,
    getOperators,
    deriveStatementType
} from './data-layer.js';
import { 
    formatNumber, 
    formatBytes, 
    formatDuration,
    showToast
} from './ui-helpers.js';
// - getOptimalTimeUnit
// - getTimeConfig
// - formatNumber
// - formatBytes
// - formatDuration


// ============================================================
// CHART.JS GLOBAL CONFIGURATION
// ============================================================

// Disable Chart.js animations globally for better performance
Chart.defaults.animation = false;
Chart.defaults.animations = false;
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;

// Register the zoom plugin
try {
    if (window.ChartZoom) {
        Chart.register(window.ChartZoom);
    } else if (window.chartjsPluginZoom) {
        Chart.register(window.chartjsPluginZoom);
    } else if (window.zoomPlugin) {
        Chart.register(window.zoomPlugin);
    }
} catch (error) {
    // Silent fallback
}


// ============================================================
// STATE VARIABLES
// ============================================================

// Global variables for time range tracking
export let originalTimeRange = { min: null, max: null };
export let currentTimeRange = { min: null, max: null };
let isZoomSyncing = false;

// Vertical stake line tracking
export let verticalStakePosition = null; // Timestamp where the blue dotted line is staked

// Array to store all timeline charts for synchronization
export const timelineCharts = [];

// Queue system for creating charts progressively to avoid UI blocking
const chartTasks = [];
let drainingCharts = false;
let totalCharts = 0;
let completedCharts = 0;


// ============================================================
// CHART ZOOM SYNCHRONIZATION
// ============================================================

/**
 * Sync zoom across all timeline charts
 */
export function syncChartZoom(sourceChart, xMin, xMax) {
    if (isZoomSyncing) return;
    isZoomSyncing = true;

    const charts = [
        window.filterChart,
        window.timelineChart,
        window.queryTypesChart,
        window.durationBucketsChart,
        window.memoryChart,
        window.resultCountChart,
        window.resultSizeChart,
        window.cpuTimeChart,
        window.indexScanThroughputChart,
        window.docFetchThroughputChart,
        window.docSizeBubbleChart,
        window.execVsKernelChart,
        window.execVsServChart,
        window.execVsElapsedChart,
        window.serviceTimeAnalysisLineChart,
        window.enhancedOperationsChart,
        window.collectionQueriesChart,
        window.parseDurationChart,
        window.planDurationChart,
    ];

    charts.forEach((chart) => {
        if (chart && chart !== sourceChart) {
            chart.zoomScale("x", { min: xMin, max: xMax }, "none");
        }
    });

    setTimeout(() => {
        isZoomSyncing = false;
    }, 100);
}


// ============================================================
// VERTICAL STAKE LINE (Issue #148)
// ============================================================

/**
 * Add vertical stake line to all timeline charts at a specific timestamp
 */
export function addVerticalStake(timestamp) {
    verticalStakePosition = timestamp;
    
    const charts = [
        window.filterChart,
        window.timelineChart,
        window.queryTypesChart,
        window.durationBucketsChart,
        window.memoryChart,
        window.resultCountChart,
        window.resultSizeChart,
        window.cpuTimeChart,
        window.indexScanThroughputChart,
        window.docFetchThroughputChart,
        window.docSizeBubbleChart,
        window.execVsKernelChart,
        window.execVsServChart,
        window.execVsElapsedChart,
        window.serviceTimeAnalysisLineChart,
        window.enhancedOperationsChart,
        window.collectionQueriesChart,
        window.parseDurationChart,
        window.planDurationChart,
    ];

    charts.forEach((chart) => {
        if (chart && chart.options.plugins) {
            if (!chart.options.plugins.annotation) {
                chart.options.plugins.annotation = { annotations: {} };
            }
            
            chart.options.plugins.annotation.annotations.verticalStake = {
                type: 'line',
                xMin: timestamp,
                xMax: timestamp,
                borderColor: '#007bff',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                    display: true,
                    content: 'Staked',
                    position: 'start',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    font: {
                        size: 10
                    }
                }
            };
            
            chart.update('none');
        }
    });
    
    // Show the floating unstake button
    const unstakeBtn = document.getElementById('floating-unstake-btn');
    if (unstakeBtn) {
        unstakeBtn.style.display = 'block';
    }
}

/**
 * Remove vertical stake line from all timeline charts
 */
export function removeVerticalStake() {
    verticalStakePosition = null;
    
    const charts = [
        window.filterChart,
        window.timelineChart,
        window.queryTypesChart,
        window.durationBucketsChart,
        window.memoryChart,
        window.resultCountChart,
        window.resultSizeChart,
        window.cpuTimeChart,
        window.indexScanThroughputChart,
        window.docFetchThroughputChart,
        window.docSizeBubbleChart,
        window.execVsKernelChart,
        window.execVsServChart,
        window.execVsElapsedChart,
        window.serviceTimeAnalysisLineChart,
        window.enhancedOperationsChart,
        window.collectionQueriesChart,
        window.parseDurationChart,
        window.planDurationChart,
    ];

    charts.forEach((chart) => {
        if (chart && chart.options.plugins && chart.options.plugins.annotation) {
            delete chart.options.plugins.annotation.annotations.verticalStake;
            chart.update('none');
        }
    });
    
    // Hide the floating unstake button
    const unstakeBtn = document.getElementById('floating-unstake-btn');
    if (unstakeBtn) {
        unstakeBtn.style.display = 'none';
    }
}

/**
 * Attach double-click handler for vertical stake line functionality
 */
export function attachDoubleClickHandler(chartInstance) {
    if (!chartInstance || !chartInstance.canvas) {
        return;
    }
    
    const canvasId = chartInstance.canvas.id;
    const canvasElement = chartInstance.canvas;
    
    // Check if handler already attached to avoid duplicates
    if (canvasElement._stakeHandlerAttached) {
        return;
    }
    
    // Store the handler function so we can reference the current chart
    const handleDoubleClick = (event) => {
        // Prevent default zoom behavior
        event.preventDefault();
        event.stopPropagation();
        
        // Get the current chart instance from window (in case it was recreated)
        const currentChartMap = {
            'filter-chart': window.filterChart,
            'timeline-chart': window.timelineChart,
            'query-types-chart': window.queryTypesChart,
            'duration-buckets-chart': window.durationBucketsChart,
            'memory-chart': window.memoryChart,
            'result-count-chart': window.resultCountChart,
            'result-size-chart': window.resultSizeChart,
            'cpu-time-chart': window.cpuTimeChart,
            'index-scan-throughput-chart': window.indexScanThroughputChart,
            'doc-fetch-throughput-chart': window.docFetchThroughputChart,
            'doc-size-bubble-chart': window.docSizeBubbleChart,
            'exec-vs-kernel-chart': window.execVsKernelChart,
            'exec-vs-serv-chart': window.execVsServChart,
            'exec-vs-elapsed-chart': window.execVsElapsedChart,
            'service-time-analysis-chart': window.serviceTimeAnalysisLineChart,
            'enhanced-operations-chart': window.enhancedOperationsChart,
            'collection-queries-chart': window.collectionQueriesChart,
            'parse-duration-chart': window.parseDurationChart,
            'plan-duration-chart': window.planDurationChart,
        };
        
        const currentChart = currentChartMap[canvasId];
        if (!currentChart || !currentChart.scales || !currentChart.scales.x) {
            return;
        }
        
        const rect = canvasElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Check if click is within chart area
        const chartArea = currentChart.chartArea;
        if (!chartArea || x < chartArea.left || x > chartArea.right || y < chartArea.top || y > chartArea.bottom) {
            return;
        }
        
        // Get the timestamp at the clicked x position
        const timestamp = currentChart.scales.x.getValueForPixel(x);
        
        // Add vertical stake line at this timestamp
        addVerticalStake(timestamp);
    };
    
    canvasElement.addEventListener('dblclick', handleDoubleClick);
    canvasElement._stakeHandlerAttached = true;
}


// ============================================================
// CHART DESTRUCTION & CLEANUP
// ============================================================

/**
 * Destroy all chart instances and clean up resources
 */
export function destroyAllCharts() {
    // Trace logging to see who called this function
    Logger.trace(`🔍 destroyAllCharts() called from:`, new Error().stack);
    
    const chartNames = [
        "operationsChart",
        "filterChart",
        "timelineChart",
        "queryTypesChart",
        "durationBucketsChart",
        "memoryChart",
        "resultCountChart",
        "resultSizeChart",
        "primaryScanChart",
        "stateChart",
        "statementTypeChart",
        "elapsedTimeChart",
        "queryPatternChart",
        "cpuTimeChart",
        "serviceTimeAnalysisChart",
        "execVsKernelChart",
        "execVsServChart",
        "execVsElapsedChart",
        "enhancedOperationsChart",
        "parseDurationChart",
        "planDurationChart",
        "collectionQueriesChart",
        "indexScanThroughputChart",
        "docFetchThroughputChart",
        "docSizeBubbleChart",
        "queryGroupPhaseTimesChart",
        "serviceTimeAnalysisLineChart"
    ];

    let destroyedCount = 0;
    chartNames.forEach((chartName) => {
        if (window[chartName]) {
            try {
                // Remove event listeners if they exist
                if (window[chartName]._crosshairHandlers && window[chartName].canvas) {
                    const canvas = window[chartName].canvas;
                    const handlers = window[chartName]._crosshairHandlers;
                    canvas.removeEventListener('mousemove', handlers.mousemove);
                    canvas.removeEventListener('mouseleave', handlers.mouseleave);
                }

                window[chartName].destroy();
                window[chartName] = null;
                destroyedCount++;
            } catch (e) {
                Logger.warn(`Failed to destroy chart: ${chartName}`, e);
            }
        }
    });

    // Clear timeline charts array
    timelineCharts.length = 0;
    
    Logger.debug(`🧹 Destroyed ${destroyedCount} chart instances`);
}

/**
 * Destroy only timeline-specific charts
 */
export function destroyTimelineCharts() {
    // Trace logging to see who called this function
    Logger.trace(`🔍 destroyTimelineCharts() called from:`, new Error().stack);
    
    const timelineChartNames = [
        "filterChart",
        "timelineChart",
        "memoryChart",
        "resultCountChart",
        "resultSizeChart",
        "cpuTimeChart",
        "serviceTimeAnalysisChart",
        "execVsKernelChart",
        "execVsServChart",
        "execVsElapsedChart",
        "enhancedOperationsChart",
        "parseDurationChart",
        "planDurationChart",
        "indexScanThroughputChart",
        "docFetchThroughputChart",
        "docSizeBubbleChart",
        "serviceTimeAnalysisLineChart"
    ];

    let destroyedCount = 0;
    timelineChartNames.forEach((chartName) => {
        if (window[chartName]) {
            try {
                // Remove event listeners if they exist
                if (window[chartName]._crosshairHandlers && window[chartName].canvas) {
                    const canvas = window[chartName].canvas;
                    const handlers = window[chartName]._crosshairHandlers;
                    canvas.removeEventListener('mousemove', handlers.mousemove);
                    canvas.removeEventListener('mouseleave', handlers.mouseleave);
                }

                window[chartName].destroy();
                window[chartName] = null;
                destroyedCount++;
            } catch (e) {
                Logger.warn(`Failed to destroy chart: ${chartName}`, e);
            }
        }
    });

    // Clear timeline charts array
    timelineCharts.length = 0;
    
    Logger.debug(`🧹 Destroyed ${destroyedCount} timeline chart instances`);
}


// ============================================================
// CROSSHAIR SYNCHRONIZATION (Issue #148)
// ============================================================

// Custom plugin to draw a vertical line on hover
export const verticalLinePlugin = {
    id: 'verticalLine',
    afterInit(chart) {
        chart.verticalLine = { draw: false, x: 0 };
    },
    afterEvent(chart, args) {
        const { inChartArea, event } = args;
        if (chart.verticalLine) {
            chart.verticalLine.draw = inChartArea;
            chart.verticalLine.x = event ? event.x : args.x;
            // Let Chart.js handle the redraw naturally, don't force it
        }
    },
    afterDatasetsDraw(chart) {
        if (!chart.verticalLine || !chart.verticalLine.draw || !chart.verticalLine.x) return;

        const { ctx, chartArea: { top, bottom } } = chart;
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#007bff';
        ctx.setLineDash([5, 5]);
        ctx.moveTo(chart.verticalLine.x, top);
        ctx.lineTo(chart.verticalLine.x, bottom);
        ctx.stroke();
        ctx.restore();
    }
};

/**
 * Sync crosshairs across all timeline charts
 */
export function syncTimelineCharts(sourceEvent, activeChart) {
    if (!activeChart || !activeChart.chartArea) return;

    const chartArea = activeChart.chartArea;
    const inChartArea = sourceEvent.x >= chartArea.left && sourceEvent.x <= chartArea.right &&
        sourceEvent.y >= chartArea.top && sourceEvent.y <= chartArea.bottom;

    // Filter out null/destroyed charts and exclude the active chart
    const validCharts = timelineCharts.filter(chart => {
        return chart &&
            chart !== activeChart &&  // Exclude active chart to prevent flicker
            chart.canvas &&
            chart.canvas.getContext &&
            chart.scales &&
            chart.scales.x &&
            chart.chartArea &&
            !chart.isDestroyed;
    });

    // Update active chart's crosshair state without redrawing
    if (activeChart.verticalLine) {
        activeChart.verticalLine.draw = inChartArea;
        if (inChartArea) {
            activeChart.verticalLine.x = sourceEvent.x;
        }
    }

    // Sync other charts
    validCharts.forEach(chart => {
        if (!inChartArea) {
            if (chart.verticalLine && chart.verticalLine.draw) {
                chart.verticalLine.draw = false;
                requestAnimationFrame(() => chart.draw());
            }
            return;
        }

        try {
            const xValue = activeChart.scales.x.getValueForPixel(sourceEvent.x);
            const targetX = chart.scales.x.getPixelForValue(xValue);

            if (chart.verticalLine && targetX >= chart.chartArea.left && targetX <= chart.chartArea.right) {
                const wasDrawn = chart.verticalLine.draw;
                const oldX = chart.verticalLine.x;

                chart.verticalLine.draw = true;
                chart.verticalLine.x = targetX;

                // Only redraw if position changed significantly or wasn't drawn before
                if (!wasDrawn || Math.abs(oldX - targetX) > 2) {
                    requestAnimationFrame(() => chart.draw());
                }
            }
        } catch (error) {
            // Silently handle errors
            if (chart.verticalLine) {
                chart.verticalLine.draw = false;
            }
        }
    });

    // Update the timelineCharts array to only contain valid charts (including active chart)
    const allValidCharts = timelineCharts.filter(chart => {
        return chart &&
            chart.canvas &&
            chart.canvas.getContext &&
            chart.scales &&
            chart.scales.x &&
            chart.chartArea &&
            !chart.isDestroyed;
    });

    if (allValidCharts.length !== timelineCharts.length) {
        timelineCharts.length = 0;
        timelineCharts.push(...allValidCharts);
    }
}

/**
 * Clear crosshairs on all timeline charts
 */
export function clearTimelineCrosshairs() {
    // Filter out null/destroyed charts
    const validCharts = timelineCharts.filter(chart => {
        return chart &&
            chart.canvas &&
            chart.canvas.getContext &&
            !chart.isDestroyed &&
            chart.verticalLine;
    });

    validCharts.forEach(chart => {
        if (chart.verticalLine && chart.verticalLine.draw) {
            chart.verticalLine.draw = false;
            requestAnimationFrame(() => chart.draw());
        }
    });

    // Update the timelineCharts array to only contain valid charts
    if (validCharts.length !== timelineCharts.length) {
        timelineCharts.length = 0;
        timelineCharts.push(...validCharts);
    }
}

/**
 * Helper function to register a chart for crosshair synchronization
 */
export function registerTimelineChart(chart, ctx) {
    if (!chart || !ctx || !ctx.canvas) return;

    // Add to timeline charts array for synchronization
    timelineCharts.push(chart);

    // Throttle mousemove events to prevent excessive redraws
    let mouseMoveTimeout;
    const mouseMoveHandler = (event) => {
        if (mouseMoveTimeout) return;

        mouseMoveTimeout = setTimeout(() => {
            mouseMoveTimeout = null;

            const rect = ctx.canvas.getBoundingClientRect();
            const canvasEvent = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
            syncTimelineCharts(canvasEvent, chart);
        }, 8); // Throttle to ~120fps
    };

    // Add mouseleave event listener to clear crosshairs
    const mouseLeaveHandler = () => {
        if (mouseMoveTimeout) {
            clearTimeout(mouseMoveTimeout);
            mouseMoveTimeout = null;
        }
        clearTimelineCrosshairs();
    };

    ctx.canvas.addEventListener('mousemove', mouseMoveHandler);
    ctx.canvas.addEventListener('mouseleave', mouseLeaveHandler);

    // Store handlers for cleanup if needed
    chart._crosshairHandlers = {
        mousemove: mouseMoveHandler,
        mouseleave: mouseLeaveHandler
    };
}


// ============================================================
// PROGRESSIVE CHART LOADING SYSTEM
// ============================================================

/**
 * Enqueue a chart creation task with priority
 */
export function enqueueChartTask(name, fn, priority = 0) {
    chartTasks.push({ name, fn, priority });
    totalCharts++;
    
    // Sort by priority (higher = sooner)
    chartTasks.sort((a, b) => b.priority - a.priority);
    
    if (!drainingCharts) {
        drainChartQueue();
    }
}

/**
 * Process chart queue progressively
 */
export function drainChartQueue() {
    if (chartTasks.length === 0) {
        drainingCharts = false;
        Logger.debug(`✅ Chart queue complete: ${completedCharts}/${totalCharts} charts created`);
        return;
    }
    
    drainingCharts = true;
    requestAnimationFrame(() => {
        // Double-check array isn't empty (race condition protection)
        if (chartTasks.length === 0) {
            drainingCharts = false;
            return;
        }
        
        const { name, fn } = chartTasks.shift();
        completedCharts++;
        
        const startTime = performance.now();
        try {
            fn();
            const duration = (performance.now() - startTime).toFixed(2);
            Logger.debug(`📊 Chart created [${completedCharts}/${totalCharts}]: ${name} (${duration}ms)`);
        } catch (e) {
            console.error(`❌ Chart creation failed: ${name}`, e);
        }
        
        drainChartQueue();
    });
}

/**
 * Lazy chart creation with IntersectionObserver and priority
 */
export function lazyCreateChart(canvasId, chartName, createFn, priority = 0) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.warn(`Canvas not found: ${canvasId}`);
        return;
    }
    
    const container = canvas.closest('.chart-container');
    if (!container) {
        // No container, create immediately with given priority
        enqueueChartTask(chartName, () => {
            createFn();
            attachHandlersToChart(canvasId);
        }, priority);
        return;
    }
    
    // Use IntersectionObserver for lazy loading
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            if (entries.some(e => e.isIntersecting)) {
                observer.disconnect();
                // Visible charts get higher priority (base priority + 10)
                enqueueChartTask(chartName, () => {
                    createFn();
                    attachHandlersToChart(canvasId);
                }, priority + 10);
            }
        }, { 
            root: null, 
            rootMargin: '200px', // Start loading 200px before visible
            threshold: 0.01 
        });
        observer.observe(container);
        
        // Also enqueue with lower priority for background loading
        // This ensures charts load even if user doesn't scroll
        setTimeout(() => {
            if (observer) {
                enqueueChartTask(chartName, () => {
                    observer.disconnect();
                    createFn();
                    attachHandlersToChart(canvasId);
                }, priority);
            }
        }, 5000); // Background load after 5 seconds
    } else {
        // Fallback: enqueue immediately if IntersectionObserver not supported
        enqueueChartTask(chartName, () => {
            createFn();
            attachHandlersToChart(canvasId);
        }, priority);
    }
}

/**
 * Attach double-click handler and other handlers to a chart after creation
 */
export function attachHandlersToChart(canvasId) {
    // Map canvas IDs to window chart objects
    const chartMap = {
        'filter-chart': window.filterChart,
        'timeline-chart': window.timelineChart,
        'query-types-chart': window.queryTypesChart,
        'duration-buckets-chart': window.durationBucketsChart,
        'memory-chart': window.memoryChart,
        'result-count-chart': window.resultCountChart,
        'result-size-chart': window.resultSizeChart,
        'cpu-time-chart': window.cpuTimeChart,
        'index-scan-throughput-chart': window.indexScanThroughputChart,
        'doc-fetch-throughput-chart': window.docFetchThroughputChart,
        'doc-size-bubble-chart': window.docSizeBubbleChart,
        'exec-vs-kernel-chart': window.execVsKernelChart,
        'exec-vs-serv-chart': window.execVsServChart,
        'exec-vs-elapsed-chart': window.execVsElapsedChart,
        'service-time-analysis-chart': window.serviceTimeAnalysisLineChart,
        'enhanced-operations-chart': window.enhancedOperationsChart,
        'collection-queries-chart': window.collectionQueriesChart,
        'parse-duration-chart': window.parseDurationChart,
        'plan-duration-chart': window.planDurationChart,
    };
    
    const chart = chartMap[canvasId];
    if (chart) {
        // Attach double-click handler
        if (typeof attachDoubleClickHandler === 'function') {
            attachDoubleClickHandler(chart);
        }
        
        // If a vertical stake is already active, apply it to this newly created chart
        if (verticalStakePosition !== null && chart.options.plugins) {
            if (!chart.options.plugins.annotation) {
                chart.options.plugins.annotation = { annotations: {} };
            }
            
            chart.options.plugins.annotation.annotations.verticalStake = {
                type: 'line',
                xMin: verticalStakePosition,
                xMax: verticalStakePosition,
                borderColor: '#007bff',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                    display: true,
                    content: 'Staked',
                    position: 'start',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    font: {
                        size: 10
                    }
                }
            };
            
            chart.update('none');
        }
    }
}

/**
 * Reset chart loading counters
 */
export function resetChartLoadingCounters() {
    chartTasks.length = 0;
    drainingCharts = false;
    totalCharts = 0;
    completedCharts = 0;
    Logger.debug('🔄 Chart queue reset');
}


// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get current time configuration for Chart.js time scale
 */
export function getCurrentTimeConfig(requests) {
    const grouping = window.getTimeGrouping ? window.getTimeGrouping() : 'optimizer';
    let actualUnit;
    if (grouping === "optimizer") {
        actualUnit = window.getOptimalTimeUnit ? window.getOptimalTimeUnit(requests) : 'minute';
    } else {
        actualUnit = grouping;
    }
    return window.getTimeConfig ? window.getTimeConfig(actualUnit, requests) : { unit: actualUnit };
}

/**
 * Helper function to update the optimizer label
 */
export function updateOptimizerLabel(requests) {
    const optimizedUnit = window.getOptimalTimeUnit ? window.getOptimalTimeUnit(requests) : 'minute';
    const dropdown = document.getElementById("time-grouping-select");
    if (dropdown) {
        // Update the first option text to show the actual optimized unit
        const optimizerOption = dropdown.querySelector('option[value="optimizer"]');
        if (optimizerOption) {
            optimizerOption.textContent = `By Optimizer (${optimizedUnit})`;
        }
    }
}

/**
 * Convert requestTime to Date object with timezone support
 */
export function getChartDate(requestTime) {
    // This function is used for timezone conversion (Issue #203)
    // Implementation is in main-legacy.js line ~13784
    // We'll call the window version for now
    return window.getChartDate ? window.getChartDate(requestTime) : new Date(requestTime);
}


// ============================================================
// BACKWARD COMPATIBILITY - Expose to window for legacy code
// ============================================================

window.destroyAllCharts = destroyAllCharts;
window.destroyTimelineCharts = destroyTimelineCharts;
window.syncChartZoom = syncChartZoom;
window.addVerticalStake = addVerticalStake;
window.removeVerticalStake = removeVerticalStake;
window.attachDoubleClickHandler = attachDoubleClickHandler;
window.syncTimelineCharts = syncTimelineCharts;
window.clearTimelineCrosshairs = clearTimelineCrosshairs;
window.registerTimelineChart = registerTimelineChart;
window.enqueueChartTask = enqueueChartTask;
window.drainChartQueue = drainChartQueue;
window.lazyCreateChart = lazyCreateChart;
window.attachHandlersToChart = attachHandlersToChart;
window.resetChartLoadingCounters = resetChartLoadingCounters;
window.getCurrentTimeConfig = getCurrentTimeConfig;
window.updateOptimizerLabel = updateOptimizerLabel;
window.getChartDate = getChartDate;
window.verticalLinePlugin = verticalLinePlugin;


// ============================================================
// CHART GENERATION FUNCTIONS
// ============================================================

// NOTE: The following chart generation functions (38+ functions) will be added
// in subsequent extraction phases:
//
// Dashboard Charts:
// - generateDashboardCharts
// - generatePrimaryScanChart
// - generateStateChart
// - generateStatementTypeChart
// - generateScanConsistencyChart
// - generateElapsedTimeChart
// - generateQueryPatternChart
//
// Timeline Charts:
// - generateEnhancedOperationsChart
// - generateFilterChart
// - generateTimelineChart
// - createQueryTypesChart
// - createDurationBucketsChart
// - createMemoryChart
// - createCollectionQueriesChart
// - createParseDurationChart
// - createPlanDurationChart
// - createResultCountChart
// - createResultSizeChart
// - createCpuTimeChart
// - createIndexScanThroughputChart
// - createDocFetchThroughputChart
// - createDocumentSizeBubbleChart
// - createExecVsKernelChart
// - createExecVsServChart
// - createExecVsElapsedChart
// - createServiceTimeAnalysisLineChart
//
// 3D/ECharts Charts:
// - createECharts3DCollectionTimeline
// - createECharts3DQueryTypes
// - createECharts3DAvgDocSize
// - createECharts3DServiceTime
// - generateECharts3DBar
//
// Other Charts:
// - renderQueryGroupPhaseTimesChart
// - setupChartDragAndDrop
// - setupLazyChartLoading
//
// These will be extracted in Phase 2 due to their large size and complexity.

Logger.info('✅ charts.js module loaded (Phase 1: Core infrastructure)');

// ============================================================

// CHART: generateDashboardCharts

// ============================================================


        function generateDashboardCharts(requests) {
            Logger.trace(`🔍 generateDashboardCharts() called from:`, new Error().stack);
            Logger.debug(`[generateDashboardCharts] Called with ${requests.length} requests, currentTimezone=${currentTimezone}`);
            
            generatePrimaryScanChart(requests);
            generateStateChart(requests);
            generateStatementTypeChart(requests);
            generateScanConsistencyChart(requests);
            generateElapsedTimeChart(requests);
            generateQueryPatternChart(requests);
            generateUserCountTable(requests);
            generateIndexCountTable(requests);
            
            Logger.debug(`[generateDashboardCharts] About to call updateInsights`);
            updateInsights(requests);
            Logger.debug(`[generateDashboardCharts] Completed updateInsights`);
        }



// ============================================================

// CHART: generatePrimaryScanChart

// ============================================================


        function generatePrimaryScanChart(requests) {
            const scanCounts = { 'Primary': 0, 'Sequential Scan': 0, 'GSI': 0 };

            requests.forEach((request) => {
                const indexType = getIndexType(request);
                scanCounts[indexType]++;
            });

            const total = scanCounts['Primary'] + scanCounts['Sequential Scan'] + scanCounts['GSI'];

            // Show/hide warning div based on whether primary scans are detected
            const warningDiv = document.getElementById("primary-scan-warning");
            if (scanCounts['Primary'] > 0) {
                warningDiv.style.display = "flex";
            } else {
                warningDiv.style.display = "none";
            }

            const ctx = document
                .getElementById("primary-scan-chart")
                .getContext("2d");
            if (window.primaryScanChart) {
                window.primaryScanChart.destroy();
            }

            window.primaryScanChart = new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: ["Primary", "Sequential Scan", "GSI"],
                    datasets: [
                        {
                            data: [scanCounts['Primary'], scanCounts['Sequential Scan'], scanCounts['GSI']],
                            backgroundColor: ["#dc3545", "#fd7e14", "#f8f9fa"],
                            borderColor: ["#dc3545", "#fd7e14", "#dee2e6"],
                            borderWidth: 2,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "60%",
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: {
                                generateLabels: function (chart) {
                                    const d = chart.data;
                                    return d.labels.map((label, index) => ({
                                        text: label + " (" + (typeof d.datasets[0].data[index] === 'number' ? d.datasets[0].data[index].toLocaleString() : d.datasets[0].data[index]) + ")",
                                        fillStyle: d.datasets[0].backgroundColor[index],
                                        strokeStyle: d.datasets[0].borderColor ? d.datasets[0].borderColor[index] : d.datasets[0].backgroundColor[index],
                                        lineWidth: 1,
                                        hidden: false,
                                        index: index,
                                    }));
                                },
                            },
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const percent =
                                        total > 0
                                            ? ((context.parsed / total) * 100).toFixed(1)
                                            : 0;
                                    return (
                                        context.label +
                                        ": " +
                                        context.parsed +
                                        " (" +
                                        percent +
                                        "%)"
                                    );
                                },
                            },
                        },
                        datalabels: {
                            display: true,
                            color: function (context) {
                                // White text for Primary (red) and Sequential Scan (orange), dark text for GSI (light gray)
                                return context.dataIndex <= 1 ? "white" : "#6c757d";
                            },
                            font: {
                                weight: "bold",
                                size: 14,
                            },
                            formatter: function (value, context) {
                                const percent =
                                    total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return percent + "%";
                            },
                        },
                    },
                },
                plugins: [
                    {
                        afterDatasetsDraw: function (chart) {
                            drawPieLabelsWithLeaders(chart, total, { insideThreshold: 10 });
                        },
                    },
                ],
            });
        }



// ============================================================

// CHART: generateStateChart

// ============================================================


function generateStateChart(requests) {
            const stateCounts = {};

            requests.forEach((request) => {
                const state = request.state || "Unknown";
                stateCounts[state] = (stateCounts[state] || 0) + 1;
            });

            const total = Object.values(stateCounts).reduce(
                (sum, count) => sum + count,
                0
            );
            const labels = Object.keys(stateCounts);
            const data = Object.values(stateCounts);

            // Semantic colors based on query state
            const colors = labels.map(state => {
                const lowerState = state.toLowerCase();
                switch (lowerState) {
                    case "completed":
                    case "success":
                        return "#28a745"; // Green - success
                    case "fatal":
                    case "errors":
                        return "#dc3545"; // Red - error
                    case "timeout":
                        return "#fd7e14"; // Orange - timeout
                    case "stopped":
                    case "cancelled":
                        return "#6c757d"; // Gray - stopped/cancelled
                    case "running":
                        return "#007bff"; // Blue - in progress
                    default:
                        return "#6f42c1"; // Purple - unknown/other
                }
            });

            const ctx = document.getElementById("state-chart").getContext("2d");
            if (window.stateChart) {
                window.stateChart.destroy();
            }

            window.stateChart = new Chart(ctx, {
                type: "pie",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            data: data,
                            backgroundColor: colors.slice(0, labels.length),
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: {
                                generateLabels: function (chart) {
                                    const data = chart.data;
                                    return data.labels.map((label, index) => ({
                                        text: label + " (" + (typeof data.datasets[0].data[index] === 'number' ? data.datasets[0].data[index].toLocaleString() : data.datasets[0].data[index]) + ")",
                                        fillStyle: data.datasets[0].backgroundColor[index],
                                        strokeStyle: data.datasets[0].backgroundColor[index],
                                        lineWidth: 1,
                                        hidden: false,
                                        index: index,
                                    }));
                                },
                            },
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const percent =
                                        total > 0
                                            ? ((context.parsed / total) * 100).toFixed(1)
                                            : 0;
                                    return (
                                        context.label +
                                        ": " +
                                        context.parsed +
                                        " (" +
                                        percent +
                                        "%)"
                                    );
                                },
                            },
                        },
                    },
                },
                plugins: [
                    {
                        afterDatasetsDraw: function (chart) {
                            drawPieLabelsWithLeaders(chart, total, { insideThreshold: 10 });
                        },
                    },
                ],
            });
        }



// ============================================================

// CHART: generateStatementTypeChart

// ============================================================


        function generateStatementTypeChart(requests) {
            const typeCounts = {};

            requests.forEach((request) => {
                // First try the statementType field, then derive from statement or preparedText
                const type = request.statementType || deriveStatementType(request.statement || request.preparedText) || "UNKNOWN";
                typeCounts[type] = (typeCounts[type] || 0) + 1;
            });

            const total = Object.values(typeCounts).reduce(
                (sum, count) => sum + count,
                0
            );
            const labels = Object.keys(typeCounts);
            const data = Object.values(typeCounts);
            const colors = [
                "#ff6384",
                "#36a2eb",
                "#ffce56",
                "#4bc0c0",
                "#9966ff",
                "#ff9f40",
                "#c9cbcf",
                "#4bc0c0",
            ];

            const ctx = document
                .getElementById("statement-type-chart")
                .getContext("2d");
            if (window.statementTypeChart) {
                window.statementTypeChart.destroy();
            }

            window.statementTypeChart = new Chart(ctx, {
                type: "pie",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            data: data,
                            backgroundColor: colors.slice(0, labels.length),
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: {
                                generateLabels: function (chart) {
                                    const data = chart.data;
                                    return data.labels.map((label, index) => ({
                                        text: label + " (" + (typeof data.datasets[0].data[index] === 'number' ? data.datasets[0].data[index].toLocaleString() : data.datasets[0].data[index]) + ")",
                                        fillStyle: data.datasets[0].backgroundColor[index],
                                        strokeStyle: data.datasets[0].backgroundColor[index],
                                        lineWidth: 1,
                                        hidden: false,
                                        index: index,
                                    }));
                                },
                            },
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const percent =
                                        total > 0
                                            ? ((context.parsed / total) * 100).toFixed(1)
                                            : 0;
                                    return (
                                        context.label +
                                        ": " +
                                        context.parsed +
                                        " (" +
                                        percent +
                                        "%)"
                                    );
                                },
                            },
                        },
                    },
                },
                plugins: [
                    {
                        afterDatasetsDraw: function (chart) {
                            drawPieLabelsWithLeaders(chart, total, { insideThreshold: 10 });
                        },
                    },
                ],
            });
        }



// ============================================================

// CHART: generateScanConsistencyChart

// ============================================================


        function generateScanConsistencyChart(requests) {
            const consistencyCounts = {};

            requests.forEach((request) => {
                const consistency = request.scanConsistency || "unbounded";
                consistencyCounts[consistency] = (consistencyCounts[consistency] || 0) + 1;
            });

            const total = Object.values(consistencyCounts).reduce(
                (sum, count) => sum + count,
                0
            );
            const labels = Object.keys(consistencyCounts);
            const data = Object.values(consistencyCounts);

            // Specific colors for scan consistency types
            const colors = labels.map(consistency => {
                const lowerConsistency = consistency.toLowerCase();
                switch (lowerConsistency) {
                    case "unbounded":
                        return "#007bff"; // Blue
                    case "scan_plus":
                        return "#28a745"; // Green
                    case "request_plus":
                        return "#fd7e14"; // Orange
                    default:
                        return "#6c757d"; // Gray for unknown
                }
            });

            const ctx = document
                .getElementById("scan-consistency-chart")
                .getContext("2d");
            if (window.scanConsistencyChart) {
                window.scanConsistencyChart.destroy();
            }

            window.scanConsistencyChart = new Chart(ctx, {
                type: "pie",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            data: data,
                            backgroundColor: colors,
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: {
                                generateLabels: function (chart) {
                                    const data = chart.data;
                                    return data.labels.map((label, index) => ({
                                        text: label + " (" + (typeof data.datasets[0].data[index] === 'number' ? data.datasets[0].data[index].toLocaleString() : data.datasets[0].data[index]) + ")",
                                        fillStyle: data.datasets[0].backgroundColor[index],
                                        strokeStyle: data.datasets[0].backgroundColor[index],
                                        lineWidth: 1,
                                        hidden: false,
                                        index: index,
                                    }));
                                },
                            },
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const percent =
                                        total > 0
                                            ? ((context.parsed / total) * 100).toFixed(1)
                                            : 0;
                                    return (
                                        context.label +
                                        ": " +
                                        context.parsed +
                                        " (" +
                                        percent +
                                        "%)"
                                    );
                                },
                            },
                        },
                    },
                },
                plugins: [
                    {
                        afterDatasetsDraw: function (chart) {
                            drawPieLabelsWithLeaders(chart, total, { insideThreshold: 10 });
                        },
                    },
                ],
            });
        }



// ============================================================

// CHART: generateElapsedTimeChart

// ============================================================


function generateElapsedTimeChart(requests) {
            const timeBuckets = {
                "0-1s": 0,
                "1-2s": 0,
                "2-5s": 0,
                "5-10s": 0,
                "10-20s": 0,
                "20-40s": 0,
                "40-60s": 0,
                "60-90s": 0,
                "90s-5m": 0,
                "5-15m": 0,
                "15-30m": 0,
                "30-60m": 0,
                ">60m": 0,
            };

            requests.forEach((request) => {
                const elapsed = (request.elapsedTimeMs || 0) / 1000; // Convert ms to seconds

                if (elapsed <= 1) timeBuckets["0-1s"]++;
                else if (elapsed <= 2) timeBuckets["1-2s"]++;
                else if (elapsed <= 5) timeBuckets["2-5s"]++;
                else if (elapsed <= 10) timeBuckets["5-10s"]++;
                else if (elapsed <= 20) timeBuckets["10-20s"]++;
                else if (elapsed <= 40) timeBuckets["20-40s"]++;
                else if (elapsed <= 60) timeBuckets["40-60s"]++;
                else if (elapsed <= 90) timeBuckets["60-90s"]++;
                else if (elapsed <= 300) timeBuckets["90s-5m"]++;
                else if (elapsed <= 900) timeBuckets["5-15m"]++;
                else if (elapsed <= 1800) timeBuckets["15-30m"]++;
                else if (elapsed <= 3600) timeBuckets["30-60m"]++;
                else timeBuckets[">60m"]++;
            });

            const ctx = document
                .getElementById("elapsed-time-chart")
                .getContext("2d");
            if (window.elapsedTimeChart) {
                window.elapsedTimeChart.destroy();
            }

            window.elapsedTimeChart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: Object.keys(timeBuckets),
                    datasets: [
                        {
                            label: "Query Count",
                            data: Object.values(timeBuckets),
                            backgroundColor: "#36a2eb",
                            borderColor: "#36a2eb",
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: { top: 16 }
                    },
                    plugins: {
                        legend: {
                            display: false,
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return "Queries: " + context.parsed.y;
                                },
                            },
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grace: '15%',
                            title: {
                                display: true,
                                text: "Number of Queries",
                            },
                        },
                        x: {
                            title: {
                                display: true,
                                text: "Elapsed Time Range",
                            },
                        },
                    },
                },
                    plugins: [
                            {
                                       afterDatasetsDraw: function (chart) {
                                    drawBarValueLabels(chart, { font: 'bold 14px Arial' });
                        },
                    },
                ],
            });
        }



// ============================================================

// CHART: generateQueryPatternChart

// ============================================================


        function generateQueryPatternChart(requests) {
            const patternCounts = {
                // Far left
                WITH: 0,
                EXECUTE: 0,
                "SELECT *": 0,
                COUNT: 0,
                DISTINCT: 0,
                // Left-center
                "USE INDEX": 0,
                "USE KEYS": 0,
                LET: 0,
                // Center
                "No WHERE": 0,
                // Center-right  
                JOIN: 0,
                NEST: 0,
                UNNEST: 0,
                SEARCH: 0,
                "ARRAY QUERY": 0,
                LIKE: 0,
                REGEX: 0,
                // Far right
                "GROUP BY": 0,
                "ORDER BY": 0,
                LIMIT: 0,
                OFFSET: 0,
                UNION: 0,
            };

            requests.forEach((request) => {
                const patterns = detectQueryPatterns(request);
                patterns.forEach(pattern => {
                    if (patternCounts.hasOwnProperty(pattern)) {
                        patternCounts[pattern]++;
                    }
                });
            });

            const ctx = document
                .getElementById("query-pattern-chart")
                .getContext("2d");
            if (window.queryPatternChart) {
                window.queryPatternChart.destroy();
            }

            // Generate colors based on pattern names
            const colors = Object.keys(patternCounts).map((pattern) => {
                if (pattern === "SELECT *") {
                    return "#dc3545"; // Red
                } else if (
                    pattern === "LIKE" ||
                    pattern === "No WHERE" ||
                    pattern === "REGEX"
                ) {
                    return "#fd7e14"; // Orange
                } else {
                    return "#28a745"; // Green
                }
            });

            window.queryPatternChart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: Object.keys(patternCounts),
                    datasets: [
                        {
                            label: "Query Count",
                            data: Object.values(patternCounts),
                            backgroundColor: colors,
                            borderColor: colors,
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: { top: 16 }
                    },
                    plugins: {
                        legend: {
                            display: false,
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return "Queries: " + context.parsed.y;
                                },
                            },
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grace: '15%',
                            title: {
                                display: true,
                                text: "Number of Queries",
                            },
                        },
                        x: {
                            title: {
                                display: true,
                                text: "Query Pattern Features",
                            },
                            ticks: {
                                maxRotation: 45,
                                minRotation: 45,
                            },
                        },
                    },
                },
                    plugins: [
                            {
                                       afterDatasetsDraw: function (chart) {
                                    drawBarValueLabels(chart, { font: 'bold 14px Arial' });
                        },
                    },
                ],
            });

            // Setup 3D button click handler
            const btn3D = document.getElementById('open-3d-pattern-chart-btn');
            if (btn3D) {
                // Show button only if we have data
                btn3D.style.display = requests && requests.length > 0 ? 'block' : 'none';
                
                // Remove old event listeners
                const newBtn = btn3D.cloneNode(true);
                btn3D.parentNode.replaceChild(newBtn, btn3D);
                
                // Add click handler
                newBtn.addEventListener('click', function() {
                    // Always regenerate data to ensure it's fresh
                    generateECharts3DBar(requests);
                    // Small delay to ensure data is set
                    setTimeout(() => {
                        if (window.echartsData) {
                            expandEChartsChart();
                        } else {
                            Logger.error('Failed to generate ECharts data');
                        }
                    }, 50);
                });
            }
        }



// ============================================================

// CHART: generateECharts3DBar

// ============================================================


        function generateECharts3DBar(requests) {
            if (!requests || requests.length === 0) {
                Logger.debug(TEXT_CONSTANTS.NO_DATA_AVAILABLE || "No data available");
                return;
            }

            // Reuse pattern detection logic
            const patterns = [
                'WITH', 'EXECUTE', 'SELECT *', 'COUNT', 'DISTINCT',
                'USE INDEX', 'USE KEYS', 'LET',
                'No WHERE',
                'JOIN', 'NEST', 'UNNEST', 'SEARCH', 'ARRAY QUERY', 'LIKE', 'REGEX',
                'GROUP BY', 'ORDER BY', 'LIMIT', 'OFFSET', 'UNION'
            ];

            // Build pattern-collection matrix
            const collectionPatternCounts = {}; // { collection: { pattern: count } }

            requests.forEach((request) => {
                // For EXECUTE statements, use preparedText (contains actual SQL), otherwise use statement
                const sql = request.statement || request.preparedText || "";
                
                // Extract collections from SQL
                const collections = extractCollectionsFromSQL(sql);
                
                // Detect patterns using shared helper function (Issue #202)
                const detectedPatterns = detectQueryPatterns(request);

                // Count patterns per collection
                collections.forEach(collection => {
                    if (!collectionPatternCounts[collection]) {
                        collectionPatternCounts[collection] = {};
                        patterns.forEach(p => collectionPatternCounts[collection][p] = 0);
                    }
                    
                    detectedPatterns.forEach(pattern => {
                        if (patterns.includes(pattern)) {
                            collectionPatternCounts[collection][pattern]++;
                        }
                    });
                });
            });

            // Get all unique collections sorted by total pattern count
            const collections = Object.keys(collectionPatternCounts).sort((a, b) => {
                const aTotal = Object.values(collectionPatternCounts[a]).reduce((sum, v) => sum + v, 0);
                const bTotal = Object.values(collectionPatternCounts[b]).reduce((sum, v) => sum + v, 0);
                return aTotal - bTotal; // Ascending
            });

            if (collections.length === 0) {
                Logger.info('No collection data available for ECharts 3D bar chart');
                return;
            }

            // Build data array for ECharts: [[patternIdx, collectionIdx, count, actualCount, color], ...]
            const data = [];
            const maxCount = Math.max(...Object.values(collectionPatternCounts).flatMap(obj => Object.values(obj)));

            // Helper function to get color based on count (Red=highest, Blue=lowest)
            function getColorForCount(count, max) {
                const intensity = count / max;
                // Red → Orange → Yellow → Green → Cyan → Blue
                if (intensity > 0.83) return '#dc143c'; // Crimson red (highest)
                if (intensity > 0.67) return '#ff4500'; // Orange-red
                if (intensity > 0.50) return '#ffa500'; // Orange
                if (intensity > 0.33) return '#ffd700'; // Gold
                if (intensity > 0.17) return '#32cd32'; // Lime green
                return '#1e90ff'; // Dodger blue (lowest)
            }

            collections.forEach((collection, cIdx) => {
                patterns.forEach((pattern, pIdx) => {
                    const count = collectionPatternCounts[collection][pattern] || 0;
                    if (count > 0) {
                        // Use log scale: log10(count + 1)
                        const logCount = Math.log10(count + 1);
                        const color = getColorForCount(count, maxCount);
                        data.push([pIdx, cIdx, logCount, count, color]); // Store log, raw count, and color
                    }
                });
            });

            // Store data globally for fullscreen mode
            window.echartsData = {
                collections,
                patterns,
                collectionPatternCounts,
                data,
                maxCount
            };

            Logger.info(`✅ ECharts 3D Bar data prepared: ${collections.length} collections x ${patterns.length} patterns (${data.length} bars)`);
        }



// ============================================================

// CHART: generateEnhancedOperationsChart

// ============================================================


        function generateEnhancedOperationsChart(requests) {
            // Destroy existing chart if it exists
            if (window.enhancedOperationsChart) {
                window.enhancedOperationsChart.destroy();
                window.enhancedOperationsChart = null;
            }

            const canvas = document.getElementById("enhanced-operations-chart");
            if (!canvas) return;
            const ctx = canvas.getContext("2d");

            // Group requests by selected time unit
            const timeGroups = {};
            const grouping = getTimeGrouping();

            requests.forEach((request) => {
                if (!request.requestTime || !request.plan) return;

                // Parse requestTime and round based on selected grouping
                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);

                const key = timeKey.toISOString();

                if (!timeGroups[key]) {
                    timeGroups[key] = {
                        timestamp: timeKey,
                        totalIndexIn: 0,
                        totalIndexOut: 0,
                        totalFetchIn: 0,
                        totalFetchOut: 0,
                        indexQueryCount: 0,
                        fetchQueryCount: 0,
                    };
                }

                // Extract detailed operator statistics from plan
                try {
                    const planObj = typeof request.plan === "string" ? JSON.parse(request.plan) : request.plan;
                    const operators = getOperators(planObj);

                    let hasIndexOps = false;
                    let hasFetchOps = false;

                    operators.forEach((operator) => {
                        const operatorType = operator["#operator"];
                        const stats = operator["#stats"] || {};
                        const itemsIn = stats["#itemsIn"] || 0;
                        const itemsOut = stats["#itemsOut"] || 0;

                        if (operatorType === "IndexScan" || operatorType === "IndexScan3" || 
                            operatorType === "PrimaryScan" || operatorType === "PrimaryScan3") {
                            timeGroups[key].totalIndexIn += itemsIn;
                            timeGroups[key].totalIndexOut += itemsOut;
                            hasIndexOps = true;
                        } else if (operatorType === "Fetch") {
                            timeGroups[key].totalFetchIn += itemsIn;
                            timeGroups[key].totalFetchOut += itemsOut;
                            hasFetchOps = true;
                        }
                    });

                    // Count queries that had these operations
                    if (hasIndexOps) {
                        timeGroups[key].indexQueryCount++;
                    }
                    if (hasFetchOps) {
                        timeGroups[key].fetchQueryCount++;
                    }
                } catch (e) {
                    console.warn("Error parsing plan for enhanced operations chart:", e);
                }
            });

            // Get all timeline buckets to ensure charts share same x-axis (Issue #148)
            const buckets = getTimelineBucketsFromRequests(requests, grouping);
            
            // Map data to all buckets (use default values for missing data points)
            const sortedData = buckets.map(ts => {
                const key = ts.toISOString();
                const group = timeGroups[key];
                if (group) {
                    return group;
                } else {
                    return {
                        timestamp: ts,
                        totalIndexIn: 0,
                        totalIndexOut: 0,
                        totalFetchIn: 0,
                        totalFetchOut: 0,
                        indexQueryCount: 0,
                        fetchQueryCount: 0,
                    };
                }
            });

            // Prepare chart data
            const labels = sortedData.map((item) => item.timestamp);
            const indexInData = sortedData.map((item) => item.totalIndexIn);
            const indexOutData = sortedData.map((item) => item.totalIndexOut);
            const fetchInData = sortedData.map((item) => item.totalFetchIn);
            const fetchOutData = sortedData.map((item) => item.totalFetchOut);
            
            // Calculate averages for line charts
            const avgIndexInData = sortedData.map((item) =>
                item.indexQueryCount > 0 ? item.totalIndexIn / item.indexQueryCount : null
            );
            const avgFetchOutData = sortedData.map((item) =>
                item.fetchQueryCount > 0 ? item.totalFetchOut / item.fetchQueryCount : null
            );

            // Create inefficiency fill data - only when Index In > Document Out
            const inefficiencyFillData = sortedData.map((item, index) => {
                const indexIn = avgIndexInData[index];
                const fetchOut = avgFetchOutData[index];
                
                // Only show fill area when Index In > Document Out (inefficient scanning)
                if (indexIn !== null && fetchOut !== null && indexIn > fetchOut) {
                    return indexIn; // Fill from Document Out up to Index In
                }
                return null; // No fill when efficient or no data
            });

            // Create enhanced operations chart
            window.enhancedOperationsChart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: "Avg Index In per Query (with inefficiency fill)",
                            data: avgIndexInData,
                            type: "line",
                            backgroundColor: "rgba(255, 165, 0, 0.25)", // Transparent Orange for fill
                            borderColor: "rgba(0, 123, 255, 1)", // Blue border
                            borderWidth: 2,
                            // No borderDash - solid line
                            fill: '+1', // Fill to next dataset (Document Out line)
                            yAxisID: "y1",
                            order: 0,
                            spanGaps: false,
                            tension: 0.3,
                            pointRadius: 3, // Show points
                            pointHoverRadius: 5,
                        },
                        {
                            label: "Avg Document Out per Query",
                            data: avgFetchOutData,
                            type: "line",
                            backgroundColor: "rgba(40, 167, 69, 0.8)", // Green
                            borderColor: "rgba(40, 167, 69, 1)",
                            borderWidth: 2,
                            borderDash: [5, 5], // Dotted line
                            fill: false,
                            yAxisID: "y1",
                            order: 1,
                            spanGaps: false,
                            tension: 0.3,
                            pointRadius: 3, // Show points
                            pointHoverRadius: 5,
                        },
                        {
                            label: "Index In",
                            data: indexInData,
                            backgroundColor: "rgba(173, 216, 230, 0.8)", // Light Blue
                            borderColor: "rgba(135, 206, 235, 1)",
                            borderWidth: 1,
                            yAxisID: "y",
                            order: 1, // First bar (leftmost)
                        },
                        {
                            label: "Index Out",
                            data: indexOutData,
                            backgroundColor: "#007bff", // Blue
                            borderColor: "#0056b3",
                            borderWidth: 1,
                            yAxisID: "y",
                            order: 2, // Second bar
                        },
                        {
                            label: "Document Fetch In",
                            data: fetchInData,
                            backgroundColor: "rgba(144, 238, 144, 0.8)", // Light Green
                            borderColor: "rgba(124, 252, 124, 1)",
                            borderWidth: 1,
                            yAxisID: "y",
                            order: 3, // Third bar
                        },
                        {
                            label: "Document Fetch Out",
                            data: fetchOutData,
                            backgroundColor: "#28a745", // Green
                            borderColor: "#1e7e34",
                            borderWidth: 1,
                            yAxisID: "y",
                            order: 4, // Fourth bar (rightmost)
                        },
                    ],
                },
                options: {
                    responsive: true,
                    plugins: {
                        decimation: {
                            enabled: true,
                            algorithm: 'lttb',
                            samples: 1000,
                            threshold: 1000
                        },
                        title: {
                            display: true,
                            text: "Detailed Index & Document Operations",
                            font: {
                                size: 12
                            }
                        },
                        legend: {
                            display: true,
                            position: "top",
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.dataset.label || '';
                                    const value = Math.round(context.parsed.y).toLocaleString();
                                    
                                    if (label.includes('Avg Index In per Query')) {
                                        return `Avg Index In: ${value}`;
                                    }
                                    if (label.includes('Avg Document Out per Query')) {
                                        return `Avg Doc Out: ${value}`;
                                    }
                                    if (label === 'Index In') {
                                        return `Index In: ${value}`;
                                    }
                                    if (label === 'Index Out') {
                                        return `Index Out: ${value}`;
                                    }
                                    if (label === 'Document Fetch In') {
                                        return `Doc Fetch In: ${value}`;
                                    }
                                    if (label === 'Document Fetch Out') {
                                        return `Doc Fetch Out: ${value}`;
                                    }
                                    return `${label}: ${value}`;
                                },
                                afterBody: function (tooltipItems) {
                                    const dataIndex = tooltipItems[0].dataIndex;
                                    const data = sortedData[dataIndex];
                                    const totalQueries = Math.max(data.indexQueryCount, data.fetchQueryCount);
                                    return [`Queries: ${totalQueries.toLocaleString()}`];
                                }
                            }
                        },
                        zoom: {
                            limits: {
                                x: { min: "original", max: "original" },
                                y: { min: "original", max: "original" },
                            },
                            pan: {
                                enabled: true,
                                mode: "xy",
                                onPan: function ({ chart }) {
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                },
                            },
                            zoom: {
                                wheel: { enabled: false },
                                pinch: { enabled: true },
                                drag: {
                                    enabled: true,
                                    backgroundColor: "rgba(100,100,100,0.4)",
                                    borderColor: "rgba(50,50,50,0.8)",
                                    borderWidth: 2,
                                },
                                mode: "xy",
                                onZoom: function ({ chart }) {
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            type: "time",
                            time: getCurrentTimeConfig(requests),
                            title: {
                                display: true,
                                text: "Request Time",
                            },
                        },
                        y: {
                            type: "linear",
                            position: "left",
                            title: {
                                display: true,
                                text: "Operation Count",
                            },
                            beginAtZero: true,
                        },
                        y1: {
                            type: "linear",
                            position: "right",
                            title: {
                                display: true,
                                text: "Avg Items per Query",
                            },
                            beginAtZero: true,
                            grid: {
                                drawOnChartArea: false,
                            },
                        },
                    },
                    interaction: {
                        mode: "index",
                        intersect: false,
                    },
                },
                plugins: [verticalLinePlugin]
            });

            registerTimelineChart(window.enhancedOperationsChart, ctx);
        }



// ============================================================

// CHART: generateFilterChart

// ============================================================


        function generateFilterChart(requests) {
            // Destroy existing chart if it exists - do this first
            if (window.filterChart) {
                window.filterChart.destroy();
                window.filterChart = null;
            }

            const canvas = document.getElementById("filter-chart");
            const ctx = canvas.getContext("2d");

            // Group requests by selected time unit
            const timeGroups = {};
            const grouping = getTimeGrouping();

            requests.forEach((request) => {
                if (!request.requestTime || !request.plan) return;

                // Parse requestTime and round based on selected grouping
                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);

                const key = timeKey.toISOString();

                if (!timeGroups[key]) {
                    timeGroups[key] = {
                        timestamp: timeKey,
                        filtersEqual: 0,
                        filtersNotEqual: 0,
                        queryCount: 0,
                    };
                }
                
                timeGroups[key].queryCount++;

                // Find all Filter operators in the plan
                const operators = getOperators(request.plan);
                operators.forEach((operator) => {
                    if (operator["#operator"] === "Filter") {
                        const stats = operator["#stats"] || {};
                        const itemsIn = stats["#itemsIn"];
                        const itemsOut = stats["#itemsOut"];

                        if (itemsIn !== undefined && itemsOut !== undefined) {
                            if (itemsIn === itemsOut) {
                                timeGroups[key].filtersEqual += itemsOut;
                            } else {
                                timeGroups[key].filtersNotEqual += itemsOut;
                            }
                        }
                    }
                });
            });

            // Get all timeline buckets to ensure charts share same x-axis (Issue #148)
            const buckets = getTimelineBucketsFromRequests(requests, grouping);
            
            // Map data to all buckets (use default values for missing data points)
            const sortedData = buckets.map(ts => {
                const key = ts.toISOString();
                const group = timeGroups[key];
                if (group) {
                    return group;
                } else {
                    return {
                        timestamp: ts,
                        filtersEqual: 0,
                        filtersNotEqual: 0,
                        queryCount: 0,
                    };
                }
            });

            // Prepare chart data
            const labels = sortedData.map((item) => item.timestamp);
            const filtersEqualData = sortedData.map((item) => item.filtersEqual);
            const filtersNotEqualData = sortedData.map(
                (item) => item.filtersNotEqual
            );
            const percentageData = sortedData.map((item) => {
                const total = item.filtersEqual + item.filtersNotEqual;
                return total > 0 ? (item.filtersNotEqual / total) * 100 : 0;
            });

            // Create new mixed chart with bars and line
            window.filterChart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: "Filters: IN = OUT",
                            data: filtersEqualData,
                            backgroundColor: "#007bff", // Blue
                            borderColor: "#0056b3",
                            borderWidth: 1,
                            yAxisID: "y",
                            stack: "stack1",
                            order: 2,
                        },
                        {
                            label: "Filters: IN ≠ OUT",
                            data: filtersNotEqualData,
                            backgroundColor: "#dc3545", // Red
                            borderColor: "#b02a37",
                            borderWidth: 1,
                            yAxisID: "y",
                            stack: "stack1",
                            order: 3,
                        },
                        {
                            label: "Efficiency %",
                            data: percentageData,
                            type: "line",
                            backgroundColor: "#fd7e14", // Orange
                            borderColor: "#fd7e14",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            yAxisID: "y1",
                            tension: 0.3,
                            order: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    plugins: {
                        decimation: {
                            enabled: true,
                            algorithm: 'lttb',
                            samples: 1000,
                            threshold: 1000
                        },
                        title: {
                            display: true,
                            text: "Filter Operations: Efficiency Analysis (IN vs OUT)",
                            font: {
                                size: 12
                            }
                        },
                        legend: {
                            display: true,
                            position: "top",
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.dataset.label || '';
                                    const value = Math.round(context.parsed.y).toLocaleString();
                                    return `${label}: ${value}`;
                                },
                                afterBody: function (tooltipItems) {
                                    const dataIndex = tooltipItems[0].dataIndex;
                                    const data = sortedData[dataIndex];
                                    return [`Queries: ${data.queryCount.toLocaleString()}`];
                                }
                            }
                        },
                        zoom: {
                            limits: {
                                x: { min: "original", max: "original" },
                                y: { min: "original", max: "original" },
                            },
                            pan: {
                                enabled: true,
                                mode: "xy",
                                onPan: function ({ chart }) {
                                    // Sync pan with other charts
                                    if (
                                        window.operationsChart &&
                                        chart !== window.operationsChart
                                    ) {
                                        window.operationsChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                    if (
                                        window.timelineChart &&
                                        chart !== window.timelineChart
                                    ) {
                                        window.timelineChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                    if (
                                        window.queryTypesChart &&
                                        chart !== window.queryTypesChart
                                    ) {
                                        window.queryTypesChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                    if (
                                        window.durationBucketsChart &&
                                        chart !== window.durationBucketsChart
                                    ) {
                                        window.durationBucketsChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                    if (window.memoryChart && chart !== window.memoryChart) {
                                        window.memoryChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                },
                            },
                            zoom: {
                                wheel: {
                                    enabled: false,
                                },
                                pinch: {
                                    enabled: true,
                                },
                                drag: {
                                    enabled: true,
                                    backgroundColor: "rgba(100,100,100,0.4)",
                                    borderColor: "rgba(50,50,50,0.8)",
                                    borderWidth: 2,
                                },
                                mode: "xy",
                                onZoom: function ({ chart }) {
                                    // Sync zoom with other charts
                                    syncChartZoom(
                                        chart,
                                        chart.scales.x.min,
                                        chart.scales.x.max
                                    );
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            type: "time",
                            time: getCurrentTimeConfig(requests),
                            title: {
                                display: true,
                                text: "Request Time",
                            },
                        },
                        y: {
                            type: "linear",
                            position: "left",
                            title: {
                                display: true,
                                text: "Filter Count",
                            },
                            beginAtZero: true,
                            stacked: true,
                        },
                        y1: {
                            type: "linear",
                            position: "right",
                            title: {
                                display: true,
                                text: "Efficiency %",
                            },
                            beginAtZero: true,
                            max: 100,
                            grid: {
                                drawOnChartArea: false,
                            },
                        },
                    },
                    interaction: {
                        mode: "index",
                        intersect: false,
                    },
                },
                plugins: [verticalLinePlugin]
            });

            // Register chart for crosshair synchronization
            registerTimelineChart(window.filterChart, ctx);

            // Attach double-click handler for vertical stake feature
            attachDoubleClickHandler(window.filterChart);
        }



// ============================================================

// CHART: generateTimelineChart

// ============================================================


        function generateTimelineChart(requests) {
            // Destroy existing chart if it exists - do this first
            if (window.timelineChart) {
                window.timelineChart.destroy();
                window.timelineChart = null;
            }

            const canvas = document.getElementById("timeline-chart");
            const ctx = canvas.getContext("2d");

            // Group requests by selected time unit
            const timeGroups = {};
            const grouping = getTimeGrouping();

            requests.forEach((request) => {
                if (!request.requestTime) return;

                // Parse requestTime and round based on selected grouping
                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);

                const key = timeKey.toISOString();

                if (!timeGroups[key]) {
                    timeGroups[key] = {
                        timestamp: timeKey,
                        percent0to10: 0,
                        percent10to20: 0,
                        percent20to30: 0,
                        percent30to40: 0,
                        percent40to50: 0,
                        percent50to60: 0,
                        percent60to70: 0,
                        percent70to80: 0,
                        percent80to90: 0,
                        percent90to100: 0,
                        percentOver100: 0,
                    };
                }

                // Use pre-calculated values
                const totalKernTimeMs = request.kernTimeMs || 0;
                const elapsedTimeMs = request.elapsedTimeMs || 0;

                // Calculate percentage of kernTime vs executionTime
                const kernTimePercentage =
                    elapsedTimeMs > 0 ? (totalKernTimeMs / elapsedTimeMs) * 100 : 0;

                // Group by percentage ranges
                if (kernTimePercentage < 10) {
                    timeGroups[key].percent0to10++;
                } else if (kernTimePercentage < 20) {
                    timeGroups[key].percent10to20++;
                } else if (kernTimePercentage < 30) {
                    timeGroups[key].percent20to30++;
                } else if (kernTimePercentage < 40) {
                    timeGroups[key].percent30to40++;
                } else if (kernTimePercentage < 50) {
                    timeGroups[key].percent40to50++;
                } else if (kernTimePercentage < 60) {
                    timeGroups[key].percent50to60++;
                } else if (kernTimePercentage < 70) {
                    timeGroups[key].percent60to70++;
                } else if (kernTimePercentage < 80) {
                    timeGroups[key].percent70to80++;
                } else if (kernTimePercentage < 90) {
                    timeGroups[key].percent80to90++;
                } else if (kernTimePercentage <= 100) {
                    timeGroups[key].percent90to100++;
                } else {
                    timeGroups[key].percentOver100++;
                }
            });

            // Convert to sorted array
            const sortedData = Object.values(timeGroups).sort(
                (a, b) => a.timestamp - b.timestamp
            );

            // Set original time range from data
            if (sortedData.length > 0) {
                originalTimeRange.min = sortedData[0].timestamp;
                originalTimeRange.max = sortedData[sortedData.length - 1].timestamp;
                currentTimeRange = { ...originalTimeRange };
                updateTimeRangeDisplay();
            }

            // Prepare chart data
            const labels = sortedData.map((item) => item.timestamp);
            const percent0to10Data = sortedData.map((item) => item.percent0to10);
            const percent10to20Data = sortedData.map((item) => item.percent10to20);
            const percent20to30Data = sortedData.map((item) => item.percent20to30);
            const percent30to40Data = sortedData.map((item) => item.percent30to40);
            const percent40to50Data = sortedData.map((item) => item.percent40to50);
            const percent50to60Data = sortedData.map((item) => item.percent50to60);
            const percent60to70Data = sortedData.map((item) => item.percent60to70);
            const percent70to80Data = sortedData.map((item) => item.percent70to80);
            const percent80to90Data = sortedData.map((item) => item.percent80to90);
            const percent90to100Data = sortedData.map(
                (item) => item.percent90to100
            );
            const percentOver100Data = sortedData.map(
                (item) => item.percentOver100
            );

            // Create new stacked bar chart
            window.timelineChart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: "0-10%",
                            data: percent0to10Data,
                            backgroundColor: "#28a745", // Green
                            borderColor: "#1e7e34",
                            borderWidth: 1,
                        },
                        {
                            label: "10-20%",
                            data: percent10to20Data,
                            backgroundColor: "#6cb2eb", // Light blue
                            borderColor: "#3490dc",
                            borderWidth: 1,
                        },
                        {
                            label: "20-30%",
                            data: percent20to30Data,
                            backgroundColor: "#a78bfa", // Light purple
                            borderColor: "#8b5cf6",
                            borderWidth: 1,
                        },
                        {
                            label: "30-40%",
                            data: percent30to40Data,
                            backgroundColor: "#34d399", // Light green
                            borderColor: "#10b981",
                            borderWidth: 1,
                        },
                        {
                            label: "40-50%",
                            data: percent40to50Data,
                            backgroundColor: "#fbbf24", // Yellow
                            borderColor: "#f59e0b",
                            borderWidth: 1,
                        },
                        {
                            label: "50-60%",
                            data: percent50to60Data,
                            backgroundColor: "#fb923c", // Orange
                            borderColor: "#ea580c",
                            borderWidth: 1,
                        },
                        {
                            label: "60-70%",
                            data: percent60to70Data,
                            backgroundColor: "#f472b6", // Pink
                            borderColor: "#ec4899",
                            borderWidth: 1,
                        },
                        {
                            label: "70-80%",
                            data: percent70to80Data,
                            backgroundColor: "#a855f7", // Purple
                            borderColor: "#9333ea",
                            borderWidth: 1,
                        },
                        {
                            label: "80-90%",
                            data: percent80to90Data,
                            backgroundColor: "#ef4444", // Red
                            borderColor: "#dc2626",
                            borderWidth: 1,
                        },
                        {
                            label: "90-100%",
                            data: percent90to100Data,
                            backgroundColor: "#991b1b", // Dark red
                            borderColor: "#7f1d1d",
                            borderWidth: 1,
                        },
                        {
                            label: "100%+",
                            data: percentOver100Data,
                            backgroundColor: "#450a0a", // Very dark red
                            borderColor: "#1c0a0a",
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    interaction: {
                        intersect: false,
                        mode: "index",
                    },
                    elements: {
                        point: {
                            radius: 0, // Hide points for better performance
                            hoverRadius: 4,
                        },
                    },
                    scales: {
                        x: {
                            stacked: true,
                            type: "time",
                            time: {
                                displayFormats: {
                                    minute: "HH:mm",
                                    hour: "MM-DD HH:mm",
                                },
                            },
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true,
                        },
                    },
                    plugins: {
                        decimation: {
                            enabled: true,
                            algorithm: 'lttb',
                            samples: 1000,
                            threshold: 1000
                        },
                        title: {
                            display: true,
                            text: "Query Performance: KernTime % of ExecutionTime",
                            font: {
size: 12
                            }
                        },
                        legend: {
                            display: true,
                            position: "top",
                        },
                        zoom: {
                            limits: {
                                x: { min: "original", max: "original" },
                                y: { min: "original", max: "original" },
                            },
                            pan: {
                                enabled: true,
                                mode: "xy",
                                onPan: function ({ chart }) {
                                    // Update current time range - convert chart scale values to Date objects
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();

                                    // Sync pan with other charts
                                    if (
                                        window.operationsChart &&
                                        chart !== window.operationsChart
                                    ) {
                                        window.operationsChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                    if (window.filterChart && chart !== window.filterChart) {
                                        window.filterChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                    if (
                                        window.queryTypesChart &&
                                        chart !== window.queryTypesChart
                                    ) {
                                        window.queryTypesChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                    if (window.memoryChart && chart !== window.memoryChart) {
                                        window.memoryChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                },
                            },
                            zoom: {
                                wheel: {
                                    enabled: false,
                                },
                                pinch: {
                                    enabled: true,
                                },
                                drag: {
                                    enabled: true,
                                    backgroundColor: "rgba(100,100,100,0.4)",
                                    borderColor: "rgba(50,50,50,0.8)",
                                    borderWidth: 2,
                                },
                                mode: "xy",
                                onZoom: function ({ chart }) {
                                    // Update current time range
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    // Sync zoom with other charts
                                    syncChartZoom(
                                        chart,
                                        chart.scales.x.min,
                                        chart.scales.x.max
                                    );
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            type: "time",
                            time: getCurrentTimeConfig(requests),
                            title: {
                                display: true,
                                text: "Request Time",
                            },
                            stacked: true,
                        },
                        y: {
                            title: {
                                display: true,
                                text: "Query Count",
                            },
                            stacked: true,
                            beginAtZero: true,
                        },
                    },
                    interaction: {
                        mode: "index",
                        intersect: false,
                    },
                },
                plugins: [verticalLinePlugin]
            });

            // Register chart for crosshair synchronization
            registerTimelineChart(window.timelineChart, ctx);

            // Attach double-click handler to timeline chart immediately
            attachDoubleClickHandler(window.timelineChart);

            // Reset chart loading counters for new batch
            resetChartLoadingCounters();

            // Create charts progressively using IntersectionObserver + RAF
            // This prevents UI blocking when loading many charts
            // Handlers (double-click, drag) are attached automatically after each chart creation
            lazyCreateChart('query-types-chart', 'Query Types', () => createQueryTypesChart(requests, grouping));
            lazyCreateChart('duration-buckets-chart', 'Duration Buckets', () => createDurationBucketsChart(requests, grouping));
            lazyCreateChart('memory-chart', 'Memory Usage', () => createMemoryChart(requests, grouping));
            lazyCreateChart('collection-queries-chart', 'Collection Queries', () => createCollectionQueriesChart(requests, grouping));
            lazyCreateChart('parse-duration-chart', 'Parse Duration', () => createParseDurationChart(requests, grouping));
            lazyCreateChart('plan-duration-chart', 'Plan Duration', () => createPlanDurationChart(requests, grouping));
            lazyCreateChart('result-count-chart', 'Result Count', () => createResultCountChart(requests, grouping));
            lazyCreateChart('result-size-chart', 'Result Size', () => createResultSizeChart(requests, grouping));
            lazyCreateChart('cpu-time-chart', 'CPU Time', () => createCpuTimeChart(requests, grouping));
            lazyCreateChart('index-scan-throughput-chart', 'Index Scan Throughput', () => createIndexScanThroughputChart(requests, grouping));
            lazyCreateChart('doc-fetch-throughput-chart', 'Doc Fetch Throughput', () => createDocFetchThroughputChart(requests, grouping));
            lazyCreateChart('doc-size-bubble-chart', 'Doc Size Bubble', () => createDocumentSizeBubbleChart(requests, grouping));
            lazyCreateChart('exec-vs-kernel-chart', 'Exec vs Kernel', () => createExecVsKernelChart(requests, grouping));
            lazyCreateChart('exec-vs-serv-chart', 'Exec vs Serv', () => createExecVsServChart(requests, grouping));
            lazyCreateChart('exec-vs-elapsed-chart', 'Exec vs Elapsed', () => createExecVsElapsedChart(requests, grouping));
            lazyCreateChart('service-time-analysis-chart', 'Service Time Analysis', () => createServiceTimeAnalysisLineChart(requests, grouping));
            lazyCreateChart('enhanced-operations-chart', 'Enhanced Operations', () => generateEnhancedOperationsChart(requests));

            // Initialize drag and drop after a brief delay to let first charts render
            setTimeout(() => setupChartDragAndDrop(), 100);
        }



// ============================================================

// CHART: createQueryTypesChart

// ============================================================


        function createQueryTypesChart(requests, grouping) {
            const canvas = document.getElementById("query-types-chart");
            if (!canvas) return;

            const ctx = canvas.getContext("2d");

            // Destroy existing chart if it exists
            if (window.queryTypesChart) {
                window.queryTypesChart.destroy();
            }

            // Group requests by time and statement type
            const timeGroups = {};

            requests.forEach((request) => {
                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);
                const key = timeKey.toISOString();

                if (!timeGroups[key]) {
                    timeGroups[key] = {
                        timestamp: timeKey,
                        statementTypes: {},
                        fatalCount: 0,
                    };
                }

                // Track fatal queries separately
                if (request.state && request.state.toLowerCase() === 'fatal') {
                    timeGroups[key].fatalCount++;
                    if (!timeGroups[key].fatalElapsedTimes) {
                        timeGroups[key].fatalElapsedTimes = [];
                    }
                    // Get duration in milliseconds and convert to seconds
                    const elapsedTimeMs = parseTime(request.elapsedTime);
                    const durationSeconds = elapsedTimeMs / 1000;
                    timeGroups[key].fatalElapsedTimes.push(durationSeconds);
                }

                // Use consistent statement type parsing
                let statementType = request.statementType || deriveStatementType(request.statement || request.preparedText) || "UNKNOWN";

                if (!timeGroups[key].statementTypes[statementType]) {
                    timeGroups[key].statementTypes[statementType] = {
                        count: 0,
                        durations: [],
                    };
                }

                timeGroups[key].statementTypes[statementType].count++;

                // Get duration in seconds
                const elapsedTimeMs = parseTime(request.elapsedTime);
                const durationSeconds = elapsedTimeMs / 1000;
                timeGroups[key].statementTypes[statementType].durations.push(
                    durationSeconds
                );
            });

            // Get all unique statement types
            const allStatementTypes = new Set();
            Object.values(timeGroups).forEach((group) => {
                Object.keys(group.statementTypes).forEach((type) => {
                    allStatementTypes.add(type);
                });
            });

            // Log all statement types found (removed for production)

            // Predefined colors for all statement types found
            const colorMap = {
                SELECT: "#007bff", // Blue
                INSERT: "#28a745", // Green
                UPDATE: "#17c671", // Light green
                DELETE: "#dc3545", // Red
                UPSERT: "#6f42c1", // Purple
                MERGE: "#9c27b0", // Deep purple
                CREATE: "#fd7e14", // Orange
                DROP: "#e83e8c", // Pink
                EXPLAIN: "#20c997", // Teal
                ADVISE: "#17a2b8", // Cyan
                INFER: "#ffc107", // Yellow
                WITH: "#6c757d", // Gray
                PREPARE: "#fd7e14", // Orange-red
                EXECUTE: "#6610f2", // Indigo
                "--": "#343a40", // Dark gray (comments)
                UNKNOWN: "#868e96", // Light gray
            };

            // Calculate min/max counts for circle sizing
            let minCount = Infinity;
            let maxCount = 0;
            Object.values(timeGroups).forEach((group) => {
                Object.values(group.statementTypes).forEach((typeData) => {
                    minCount = Math.min(minCount, typeData.count);
                    maxCount = Math.max(maxCount, typeData.count);
                });
            });

            // Generate datasets for each statement type with variable circle sizes
            const datasets = Array.from(allStatementTypes).map((statementType) => {
                const data = [];

                Object.values(timeGroups).forEach((group) => {
                    if (group.statementTypes[statementType]) {
                        const typeData = group.statementTypes[statementType];
                        // Calculate average duration for this time group and statement type
                        const avgDuration =
                            typeData.durations.reduce((sum, d) => sum + d, 0) /
                            typeData.durations.length;

                        // Calculate circle size based on count (3-15 pixel radius)
                        const sizeRatio =
                            maxCount > minCount
                                ? (typeData.count - minCount) / (maxCount - minCount)
                                : 0.5;
                        const circleSize = 3 + sizeRatio * 12; // Range from 3 to 15 pixels

                        data.push({
                            x: group.timestamp,
                            y: avgDuration,
                            r: circleSize,
                            count: typeData.count,
                            maxDuration: Math.max(...typeData.durations),
                            minDuration: Math.min(...typeData.durations),
                        });
                    }
                });

                return {
                    label: `${statementType} (${data.reduce(
                        (sum, point) => sum + point.count,
                        0
                    )} total)`,
                    data: data,
                    backgroundColor:
                        colorMap[statementType] ||
                        `hsl(${(Array.from(allStatementTypes).indexOf(statementType) * 137.5) %
                        360
                        }, 70%, 50%)`,
                    borderColor:
                        colorMap[statementType] ||
                        `hsl(${(Array.from(allStatementTypes).indexOf(statementType) * 137.5) %
                        360
                        }, 70%, 40%)`,
                    borderWidth: 1,
                };
            });

            // Add fatal queries dataset for right Y-axis
            const fatalData = [];
            let maxFatalCount = 0;

            Object.values(timeGroups).forEach((group) => {
                if (group.fatalCount > 0) {
                    maxFatalCount = Math.max(maxFatalCount, group.fatalCount);
                    // Calculate average elapsed time for fatal queries in this time period
                    const avgElapsedTime = group.fatalElapsedTimes && group.fatalElapsedTimes.length > 0
                        ? group.fatalElapsedTimes.reduce((sum, time) => sum + time, 0) / group.fatalElapsedTimes.length
                        : 0;
                    fatalData.push({
                        x: group.timestamp,
                        y: group.fatalCount,
                        count: group.fatalCount,
                        avgElapsedTime: avgElapsedTime,
                    });
                }
            });

            if (fatalData.length > 0) {
                datasets.push({
                    label: `Fatal Queries (${fatalData.reduce((sum, point) => sum + point.count, 0)} total)`,
                    data: fatalData.map(point => ({
                        x: point.x,
                        y: point.y,
                        count: point.count,
                        avgElapsedTime: point.avgElapsedTime
                    })),
                    type: 'scatter', // Use scatter instead of bubble for different point style
                    backgroundColor: '#FF0000', // Bright red
                    borderColor: '#FF0000', // Red outline to match fatal styling
                    borderWidth: 3,
                    pointRadius: fatalData.map(point => Math.min(20, Math.max(8, point.count * 3))), // Larger and more variable sizing
                    pointStyle: 'crossRot', // X shape instead of circle
                    yAxisID: 'y1', // Use right Y-axis
                    showLine: false, // Don't connect points with lines
                });
            }

            // Create bubble chart
            window.queryTypesChart = new Chart(ctx, {
                type: "bubble",
                data: {
                    datasets: datasets,
                },
                options: {
                    responsive: true,
                    plugins: {
                        decimation: {
                            enabled: true,
                            algorithm: 'lttb',
                            samples: 1000,
                            threshold: 1000
                        },
                        title: {
                            display: true,
                            text: TEXT_CONSTANTS.QUERY_DURATION_CHART_TITLE,
                            font: {
size: 12
                            }
                        },
                        legend: {
                            display: true,
                            position: "top",
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const dataPoint = context.raw;
                                    const datasetLabel = context.dataset.label;
                                    const statementType = datasetLabel.split(" (")[0];

                                    // Handle fatal queries dataset differently
                                    if (statementType === "Fatal Queries") {
                                        return [
                                            `${statementType}`,
                                            `${TEXT_CONSTANTS.FATAL_LABEL} ${dataPoint.count}`,
                                            `${TEXT_CONSTANTS.ELAPSED_LABEL} ${dataPoint.avgElapsedTime.toFixed(3)}s`,
                                        ];
                                    } else {
                                        // Handle regular statement type datasets
                                        return [
                                            `${statementType}`,
                                            `${TEXT_CONSTANTS.COUNT_LABEL} ${dataPoint.count}`,
                                            `${TEXT_CONSTANTS.AVG_LABEL} ${dataPoint.y.toFixed(3)}s`,
                                            `${TEXT_CONSTANTS.MIN_LABEL} ${dataPoint.minDuration.toFixed(3)}s`,
                                            `${TEXT_CONSTANTS.MAX_LABEL} ${dataPoint.maxDuration.toFixed(3)}s`,
                                        ];
                                    }
                                },
                            },
                        },
                        zoom: {
                            limits: {
                                x: { min: "original", max: "original" },
                                y: { min: "original", max: "original" },
                            },
                            pan: {
                                enabled: true,
                                mode: "xy",
                                onPan: function ({ chart }) {
                                    // Update current time range
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();

                                    // Sync pan with other charts
                                    if (
                                        window.operationsChart &&
                                        chart !== window.operationsChart
                                    ) {
                                        window.operationsChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                    if (window.filterChart && chart !== window.filterChart) {
                                        window.filterChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                    if (
                                        window.timelineChart &&
                                        chart !== window.timelineChart
                                    ) {
                                        window.timelineChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                    if (
                                        window.queryTypesChart &&
                                        chart !== window.queryTypesChart
                                    ) {
                                        window.queryTypesChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                    if (window.memoryChart && chart !== window.memoryChart) {
                                        window.memoryChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                },
                            },
                            zoom: {
                                wheel: {
                                    enabled: false,
                                },
                                pinch: {
                                    enabled: true,
                                },
                                drag: {
                                    enabled: true,
                                    backgroundColor: "rgba(100,100,100,0.4)",
                                    borderColor: "rgba(50,50,50,0.8)",
                                    borderWidth: 2,
                                },
                                mode: "xy",
                                onZoom: function ({ chart }) {
                                    // Update current time range
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    // Sync zoom with other charts
                                    syncChartZoom(
                                        chart,
                                        chart.scales.x.min,
                                        chart.scales.x.max
                                    );
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            type: "time",
                            time: getCurrentTimeConfig(requests),
                            title: {
                                display: true,
                                text: "Request Time",
                            },
                        },
                        y: {
                            title: {
                                display: true,
                                text: "Average Duration (seconds)",
                            },
                            beginAtZero: true,
                            position: "left",
                        },
                        y1: {
                            type: "linear",
                            position: "right",
                            title: {
                                display: true,
                                text: "Fatal Query Count",
                            },
                            beginAtZero: true,
                            grid: {
                                drawOnChartArea: false,
                            },
                        },
                    },
                    interaction: {
                        mode: "point",
                        intersect: false,
                    },
                },
                plugins: [verticalLinePlugin]
            });

            // Register chart for crosshair synchronization
            registerTimelineChart(window.queryTypesChart, ctx);

            // Setup 3D button click handler
            const btn3D = document.getElementById('open-3d-query-types-chart-btn');
            if (btn3D) {
                // Show button only if we have data
                btn3D.style.display = (requests && requests.length > 0) ? 'block' : 'none';
                
                // Remove old event listeners (prevents duplicate handlers)
                const newBtn = btn3D.cloneNode(true);
                btn3D.parentNode.replaceChild(newBtn, btn3D);
                
                // Add click handler
                newBtn.addEventListener('click', function() {
                    // Always regenerate 3D data to respect current filters
                    createECharts3DQueryTypes(requests, grouping);
                    // Open fullscreen modal
                    expandECharts3DQueryTypes();
                });
            }
        }



// ============================================================

// CHART: createDurationBucketsChart

// ============================================================


        function createDurationBucketsChart(requests, grouping) {
            const canvas = document.getElementById("duration-buckets-chart");
            if (!canvas) return;

            const ctx = canvas.getContext("2d");

            Logger.debug(`createDurationBucketsChart called with ${requests.length} requests, grouping: ${grouping}`);

            // Destroy existing chart if it exists
            if (window.durationBucketsChart) {
                window.durationBucketsChart.destroy();
            }

            // Group requests by time and duration buckets
            const timeGroups = {};



            requests.forEach((request) => {
                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);
                const key = timeKey.toISOString();

                if (!timeGroups[key]) {
                    timeGroups[key] = {
                        timestamp: timeKey,
                        durationBuckets: {
                            "0-1s": 0,
                            "1-2s": 0,
                            "2-3s": 0,
                            "3-4s": 0,
                            "4-5s": 0,
                            "5-10s": 0,
                            "10-30s": 0,
                            "30-60s": 0,
                            "60-120s": 0,
                            "120-240s": 0,
                            "240-500s": 0,
                            "500-900s": 0,
                            "900s+": 0,
                        },
                    };
                }

                // Get duration in seconds
                const durationMs = parseTime(request.elapsedTime);
                const durationSeconds = durationMs / 1000;

                // Categorize into duration buckets
                if (durationSeconds < 1) {
                    timeGroups[key].durationBuckets["0-1s"]++;
                } else if (durationSeconds < 2) {
                    timeGroups[key].durationBuckets["1-2s"]++;
                } else if (durationSeconds < 3) {
                    timeGroups[key].durationBuckets["2-3s"]++;
                } else if (durationSeconds < 4) {
                    timeGroups[key].durationBuckets["3-4s"]++;
                } else if (durationSeconds < 5) {
                    timeGroups[key].durationBuckets["4-5s"]++;
                } else if (durationSeconds < 10) {
                    timeGroups[key].durationBuckets["5-10s"]++;
                } else if (durationSeconds < 30) {
                    timeGroups[key].durationBuckets["10-30s"]++;
                } else if (durationSeconds < 60) {
                    timeGroups[key].durationBuckets["30-60s"]++;
                } else if (durationSeconds < 120) {
                    timeGroups[key].durationBuckets["60-120s"]++;
                } else if (durationSeconds < 240) {
                    timeGroups[key].durationBuckets["120-240s"]++;
                } else if (durationSeconds < 500) {
                    timeGroups[key].durationBuckets["240-500s"]++;
                } else if (durationSeconds < 900) {
                    timeGroups[key].durationBuckets["500-900s"]++;
                } else {
                    timeGroups[key].durationBuckets["900s+"]++;
                }
            });

            if (Object.keys(timeGroups).length > 0) {
            }

            // Calculate min/max counts for circle sizing
            let minCount = Infinity;
            let maxCount = 0;
            Object.values(timeGroups).forEach((group) => {
                Object.values(group.durationBuckets).forEach((count) => {
                    if (count > 0) {
                        minCount = Math.min(minCount, count);
                        maxCount = Math.max(maxCount, count);
                    }
                });
            });

            // Color mapping for duration buckets - progressive darkness
            const bucketColors = {
                "0-1s": "#28a745", // Green - fast
                "1-2s": "#6cb2eb", // Light blue
                "2-3s": "#ffc107", // Yellow
                "3-4s": "#fd7e14", // Orange
                "4-5s": "#dc3545", // Red
                "5-10s": "#6f42c1", // Purple
                "10-30s": "#495057", // Dark gray
                "30-60s": "#343a40", // Darker gray
                "60-120s": "#721c24", // Dark red
                "120-240s": "#5a1a1a", // Darker red
                "240-500s": "#450a0a", // Very dark red
                "500-900s": "#2d0a0a", // Extremely dark red
                "900s+": "#1a0404", // Nearly black red
            };

            // Generate datasets for each duration bucket
            const datasets = Object.keys(bucketColors).map((bucket) => {
                const data = [];

                Object.values(timeGroups).forEach((group) => {
                    const count = group.durationBuckets[bucket];
                    if (count > 0) {
                        // Calculate circle size based on count (5-20 pixel radius)
                        const sizeRatio =
                            maxCount > minCount
                                ? (count - minCount) / (maxCount - minCount)
                                : 0.5;
                        const circleSize = 5 + sizeRatio * 15; // Range from 5 to 20 pixels

                        // Use bucket midpoint for y-axis position
                        let yPosition;
                        switch (bucket) {
                            case "0-1s":
                                yPosition = 0.5;
                                break;
                            case "1-2s":
                                yPosition = 1.5;
                                break;
                            case "2-3s":
                                yPosition = 2.5;
                                break;
                            case "3-4s":
                                yPosition = 3.5;
                                break;
                            case "4-5s":
                                yPosition = 4.5;
                                break;
                            case "5-10s":
                                yPosition = 7.5;
                                break;
                            case "10-30s":
                                yPosition = 20;
                                break;
                            case "30-60s":
                                yPosition = 45;
                                break;
                            case "60-120s":
                                yPosition = 90;
                                break;
                            case "120-240s":
                                yPosition = 180;
                                break;
                            case "240-500s":
                                yPosition = 370;
                                break;
                            case "500-900s":
                                yPosition = 700;
                                break;
                            case "900s+":
                                yPosition = 1200;
                                break;
                        }

                        data.push({
                            x: group.timestamp,
                            y: yPosition,
                            r: circleSize,
                            count: count,
                        });
                    }
                });

                return {
                    label: `${bucket} (${data.reduce(
                        (sum, point) => sum + point.count,
                        0
                    )} total)`,
                    data: data,
                    backgroundColor: bucketColors[bucket],
                    borderColor: bucketColors[bucket],
                    borderWidth: 1,
                };
            });

            // Create bubble chart
            window.durationBucketsChart = new Chart(ctx, {
                type: "bubble",
                data: {
                    datasets: datasets,
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: "Query Duration Distrubution By Time Buckets (Bubble Size = Query Count)",
                            font: {
                                size: 12
                            }
                        },
                        legend: {
                            display: true,
                            position: "top",
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const dataPoint = context.raw;
                                    const bucket = context.dataset.label.split(" (")[0];
                                    return [
                                        `${bucket}`,
                                        `Count: ${dataPoint.count}`,
                                        `${new Date(dataPoint.x).toLocaleString()}`,
                                    ];
                                },
                            },
                        },
                        zoom: {
                            limits: {
                                x: { min: "original", max: "original" },
                                y: { min: "original", max: "original" },
                            },
                            pan: {
                                enabled: true,
                                mode: "xy",
                                onPan: function ({ chart }) {
                                    // Update current time range
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();

                                    // Sync pan with other charts
                                    if (
                                        window.timelineChart &&
                                        chart !== window.timelineChart
                                    ) {
                                        window.timelineChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                    if (
                                        window.operationsChart &&
                                        chart !== window.operationsChart
                                    ) {
                                        window.operationsChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                    if (window.filterChart && chart !== window.filterChart) {
                                        window.filterChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                    if (
                                        window.queryTypesChart &&
                                        chart !== window.queryTypesChart
                                    ) {
                                        window.queryTypesChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                    if (window.memoryChart && chart !== window.memoryChart) {
                                        window.memoryChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                },
                            },
                            zoom: {
                                wheel: {
                                    enabled: false,
                                },
                                pinch: {
                                    enabled: true,
                                },
                                drag: {
                                    enabled: true,
                                    backgroundColor: "rgba(100,100,100,0.4)",
                                    borderColor: "rgba(50,50,50,0.8)",
                                    borderWidth: 2,
                                },
                                mode: "xy",
                                onZoom: function ({ chart }) {
                                    // Update current time range
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    // Sync zoom with other charts
                                    syncChartZoom(
                                        chart,
                                        chart.scales.x.min,
                                        chart.scales.x.max
                                    );
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            type: "time",
                            time: getCurrentTimeConfig(requests),
                            title: {
                                display: true,
                                text: "Request Time",
                            },
                        },
                        y: {
                            title: {
                                display: true,
                                text: "Duration Range (seconds)",
                            },
                            beginAtZero: true,
                            type: "logarithmic",
                            ticks: {
                                callback: function (value) {
                                    if (value === 0.5) return "0-1s";
                                    if (value === 1.5) return "1-2s";
                                    if (value === 2.5) return "2-3s";
                                    if (value === 3.5) return "3-4s";
                                    if (value === 4.5) return "4-5s";
                                    if (value === 7.5) return "5-10s";
                                    if (value === 20) return "10-30s";
                                    if (value === 45) return "30-60s";
                                    if (value === 90) return "60-120s";
                                    if (value === 180) return "120-240s";
                                    if (value === 370) return "240-500s";
                                    if (value === 700) return "500-900s";
                                    if (value === 1200) return "900s+";
                                    return "";
                                },
                            },
                        },
                    },
                    interaction: {
                        mode: "point",
                        intersect: false,
                    },
                },
                plugins: [verticalLinePlugin]
            });

            // Register chart for crosshair synchronization
            registerTimelineChart(window.durationBucketsChart, ctx);

            // Setup 3D button click handler
            const btn3D = document.getElementById('open-3d-timeline-chart-btn');
            if (btn3D) {
                // Show button only if we have data
                btn3D.style.display = (requests && requests.length > 0) ? 'block' : 'none';
                
                // Remove old event listeners
                const newBtn = btn3D.cloneNode(true);
                btn3D.parentNode.replaceChild(newBtn, btn3D);
                
                // Add click handler
                newBtn.addEventListener('click', function() {
                // Always regenerate 3D data to respect current filters
                createECharts3DCollectionTimeline(requests, grouping);
                // Open fullscreen
                expandECharts3DTimeline();
                });
            }
        }



// ============================================================

// CHART: createMemoryChart

// ============================================================


        function createMemoryChart(requests, grouping) {
            const canvas = document.getElementById("memory-chart");
            if (!canvas) return;

            const ctx = canvas.getContext("2d");

            // Destroy existing chart if it exists
            if (window.memoryChart) {
                window.memoryChart.destroy();
            }

            // Group requests by time and sum memory usage
            const timeGroups = {};

            requests.forEach((request) => {
                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);
                const key = timeKey.toISOString();

                if (!timeGroups[key]) {
                    timeGroups[key] = {
                        timestamp: timeKey,
                        totalMemoryBytes: 0,
                        queryCount: 0,
                    };
                }

                // Use pre-calculated memory value
                const usedMemoryBytes = request.memoryBytes || 0;
                timeGroups[key].totalMemoryBytes += usedMemoryBytes;
                timeGroups[key].queryCount++;
            });

            // Convert to sorted array and convert bytes to MB
            const sortedData = Object.values(timeGroups)
                .sort((a, b) => a.timestamp - b.timestamp)
                .map((item) => ({
                    timestamp: item.timestamp,
                    totalMemoryMB: item.totalMemoryBytes / (1024 * 1024), // Convert bytes to MB
                    queryCount: item.queryCount,
                }));

            // Prepare chart data
            const labels = sortedData.map((item) => item.timestamp);
            const memoryData = sortedData.map((item) => item.totalMemoryMB);

            // Calculate average memory per query for line chart
            const avgMemoryData = sortedData.map(
                (item) => item.totalMemoryMB / item.queryCount
            );

            // Create memory usage bar chart with line overlay
            window.memoryChart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: "Memory Usage (MB)",
                            data: memoryData,
                            backgroundColor: "#17a2b8", // Info blue-cyan
                            borderColor: "#138496",
                            borderWidth: 1,
                            yAxisID: "y",
                            order: 2,
                        },
                        {
                            label: "Avg per Query (MB)",
                            data: avgMemoryData,
                            type: "line",
                            backgroundColor: "#fd7e14", // Orange
                            borderColor: "#fd7e14",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            yAxisID: "y1",
                            tension: 0.3,
                            order: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    plugins: {
                        decimation: {
                            enabled: true,
                            algorithm: 'lttb',
                            samples: 1000,
                            threshold: 1000
                        },
                        title: {
                            display: true,
                            text: "Total Query Process Memory Usage",
                            font: {
size: 12
                            }
                        },
                        legend: {
                            display: true,
                            position: "top",
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const label = context.dataset.label || '';
                                    const value = context.parsed.y;
                                    if (label.includes('Memory Usage')) {
                                        return `Memory Usage (MB): ${value.toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3})}`;
                                    }
                                    if (label.includes('Avg per Query')) {
                                        return `Avg per Query (MB): ${value.toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3})}`;
                                    }
                                    return `${label}: ${value.toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3})}`;
                                },
                                afterBody: function (tooltipItems) {
                                    const dataIndex = tooltipItems[0].dataIndex;
                                    const data = sortedData[dataIndex];
                                    return [`Queries: ${data.queryCount.toLocaleString()}`];
                                }
                            },
                        },
                        zoom: {
                            limits: {
                                x: { min: "original", max: "original" },
                                y: { min: "original", max: "original" },
                            },
                            pan: {
                                enabled: true,
                                mode: "xy",
                                onPan: function ({ chart }) {
                                    // Update current time range
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();

                                    // Sync pan with other charts
                                    if (
                                        window.operationsChart &&
                                        chart !== window.operationsChart
                                    ) {
                                        window.operationsChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                    if (window.filterChart && chart !== window.filterChart) {
                                        window.filterChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                    if (
                                        window.timelineChart &&
                                        chart !== window.timelineChart
                                    ) {
                                        window.timelineChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                    if (
                                        window.queryTypesChart &&
                                        chart !== window.queryTypesChart
                                    ) {
                                        window.queryTypesChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                    if (window.memoryChart && chart !== window.memoryChart) {
                                        window.memoryChart.zoomScale(
                                            "x",
                                            { min: chart.scales.x.min, max: chart.scales.x.max },
                                            "none"
                                        );
                                    }
                                },
                            },
                            zoom: {
                                wheel: {
                                    enabled: false,
                                },
                                pinch: {
                                    enabled: true,
                                },
                                drag: {
                                    enabled: true,
                                    backgroundColor: "rgba(100,100,100,0.4)",
                                    borderColor: "rgba(50,50,50,0.8)",
                                    borderWidth: 2,
                                },
                                mode: "xy",
                                onZoom: function ({ chart }) {
                                    // Update current time range
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    // Sync zoom with other charts
                                    syncChartZoom(
                                        chart,
                                        chart.scales.x.min,
                                        chart.scales.x.max
                                    );
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            type: "time",
                            time: getCurrentTimeConfig(requests),
                            title: {
                                display: true,
                                text: "Request Time",
                            },
                        },
                        y: {
                            type: "linear",
                            position: "left",
                            title: {
                                display: true,
                                text: "Memory Usage (MB)",
                            },
                            beginAtZero: true,
                        },
                        y1: {
                            type: "linear",
                            position: "right",
                            title: {
                                display: true,
                                text: "Avg per Query (MB)",
                            },
                            beginAtZero: true,
                            grid: {
                                drawOnChartArea: false,
                            },
                        },
                    },
                    interaction: {
                        mode: "index",
                        intersect: false,
                    },
                },
                plugins: [verticalLinePlugin]
            });

            // Register chart for crosshair synchronization
            registerTimelineChart(window.memoryChart, ctx);
        }



// ============================================================

// CHART: createCollectionQueriesChart

// ============================================================


        function createCollectionQueriesChart(requests, grouping) {
            const canvas = document.getElementById("collection-queries-chart");
            if (!canvas) return;

            const ctx = canvas.getContext("2d");

            if (window.collectionQueriesChart) {
                window.collectionQueriesChart.destroy();
            }

            if (!requests || requests.length === 0) {
                Logger.debug(TEXT_CONSTANTS.NO_DATA_AVAILABLE || "No data available");
                return;
            }

            // Get all timeline buckets
            const timeBuckets = getTimelineBucketsFromRequests(requests, grouping);
            const timeGroups = {};

            // Initialize time buckets
            timeBuckets.forEach(ts => {
                timeGroups[ts.toISOString()] = {};
            });

            // Count queries per collection per time bucket
            requests.forEach((request) => {
                const sql = request.statement || request.preparedText || "";
                const collections = extractCollectionsFromSQL(sql);
                
                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);
                const key = timeKey.toISOString();

                collections.forEach(collection => {
                    if (!timeGroups[key][collection]) {
                        timeGroups[key][collection] = 0;
                    }
                    timeGroups[key][collection]++;
                });
            });

            // Get all unique collections
            const allCollections = new Set();
            Object.values(timeGroups).forEach(group => {
                Object.keys(group).forEach(collection => allCollections.add(collection));
            });

            // Generate colors for each collection
            const colorPalette = [
                'rgba(75, 192, 192, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(199, 199, 199, 1)',
                'rgba(83, 102, 255, 1)',
                'rgba(255, 99, 255, 1)',
                'rgba(99, 255, 132, 1)'
            ];

            // Create datasets for each collection
            const datasets = Array.from(allCollections).map((collection, index) => {
                const data = timeBuckets.map(ts => {
                    const key = ts.toISOString();
                    return timeGroups[key][collection] || null;
                });

                const color = colorPalette[index % colorPalette.length];
                
                // Calculate total for this collection
                const total = data.reduce((sum, val) => sum + (val || 0), 0);

                return {
                    label: collection,
                    data: data,
                    borderColor: color,
                    backgroundColor: color.replace('1)', '0.1)'),
                    borderWidth: 2,
                    fill: false,
                    spanGaps: false,
                    tension: 0.3,
                    total: total  // Store total for legend
                };
            });

            window.collectionQueriesChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: timeBuckets,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: "Queries per Bucket.Scope.Collection",
                            font: { size: 12 }
                        },
                        subtitle: {
                            display: true,
                            text: "Note: Counts collections in JOINs and WITH (CTEs)",
                            font: { size: 10 }
                        },
                        legend: {
                            display: false  // Disable Chart.js legend, use custom HTML legend
                        },
                        tooltip: {
                            mode: "index",
                            intersect: false,
                            filter: function(tooltipItem) {
                                // Only show tooltip for visible datasets
                                const chart = window.collectionQueriesChart;
                                if (!chart) return true;
                                const meta = chart.getDatasetMeta(tooltipItem.datasetIndex);
                                return !meta.hidden;
                            }
                        },
                        zoom: {
                            limits: { x: { min: "original", max: "original" }, y: { min: "original", max: "original" } },
                            pan: {
                                enabled: true,
                                mode: "x",
                                modifierKey: "shift"
                            },
                            zoom: {
                                wheel: {
                                    enabled: false
                                },
                                pinch: {
                                    enabled: true
                                },
                                drag: {
                                    enabled: true,
                                    backgroundColor: "rgba(100,100,100,0.4)",
                                    borderColor: "rgba(50,50,50,0.8)",
                                    borderWidth: 2
                                },
                                mode: "xy",
                                onZoom: function ({ chart }) {
                                    // Update current time range
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    // Sync zoom with other charts
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: "time",
                            time: getCurrentTimeConfig(requests),
                            title: {
                                display: true,
                                text: "Request Time"
                            }
                        },
                        y: {
                            type: "linear",
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: "Query Count"
                            }
                        }
                    },
                    interaction: {
                        mode: "nearest",
                        axis: "x",
                        intersect: false
                    }
                },
                plugins: [verticalLinePlugin]
            });

            // Register chart for timeline zoom sync
            registerTimelineChart(window.collectionQueriesChart, ctx);

            // Store datasets globally for re-sorting
            window.collectionDatasetsForLegend = datasets;
            
            // Generate custom HTML legend with sort dropdown
            renderCollectionLegend('queries');
        }



// ============================================================

// CHART: createECharts3DCollectionTimeline

// ============================================================


        function createECharts3DCollectionTimeline(requests, grouping) {
            if (!requests || requests.length === 0) {
                Logger.debug(TEXT_CONSTANTS.NO_DATA_AVAILABLE || "No data available");
                return;
            }

            // Duration buckets and their numeric values for Z-axis (in seconds)
            const durationBucketDefinitions = [
                { label: "0-1s", min: 0, max: 1, value: 0 },
                { label: "1-2s", min: 1, max: 2, value: 1 },
                { label: "2-3s", min: 2, max: 3, value: 2 },
                { label: "3-4s", min: 3, max: 4, value: 3 },
                { label: "4-5s", min: 4, max: 5, value: 4 },
                { label: "5-10s", min: 5, max: 10, value: 5 },
                { label: "10-30s", min: 10, max: 30, value: 6 },
                { label: "30-60s", min: 30, max: 60, value: 7 },
                { label: "60-120s", min: 60, max: 120, value: 8 },
                { label: "120-240s", min: 120, max: 240, value: 9 },
                { label: "240-500s", min: 240, max: 500, value: 10 },
                { label: "500-900s", min: 500, max: 900, value: 11 },
                { label: "900s+", min: 900, max: Infinity, value: 12 }
            ];

            // Color palette for duration buckets (matching timeline charts)
            const durationColors = [
                'rgba(76, 175, 80, 0.7)',    // 0-1s: Green
                'rgba(33, 150, 243, 0.7)',   // 1-2s: Blue
                'rgba(255, 193, 7, 0.7)',    // 2-3s: Amber/Yellow
                'rgba(255, 152, 0, 0.7)',    // 3-4s: Orange
                'rgba(244, 67, 54, 0.7)',    // 4-5s: Red
                'rgba(156, 39, 176, 0.7)',   // 5-10s: Purple
                'rgba(96, 125, 139, 0.7)',   // 10-30s: Blue Grey
                'rgba(0, 0, 0, 0.7)',        // 30-60s: Black
                'rgba(121, 85, 72, 0.7)',    // 60-120s: Brown
                'rgba(139, 0, 0, 0.7)',      // 120-240s: Dark Red
                'rgba(75, 0, 130, 0.7)',     // 240-500s: Indigo
                'rgba(0, 0, 0, 0.8)',        // 500-900s: Black
                'rgba(0, 0, 0, 0.9)'         // 900s+: Black
            ];

            // Get duration bucket index from elapsed time in seconds
            function getDurationBucketIndex(durationSeconds) {
                if (durationSeconds < 1) return 0;
                else if (durationSeconds < 2) return 1;
                else if (durationSeconds < 3) return 2;
                else if (durationSeconds < 4) return 3;
                else if (durationSeconds < 5) return 4;
                else if (durationSeconds < 10) return 5;
                else if (durationSeconds < 30) return 6;
                else if (durationSeconds < 60) return 7;
                else if (durationSeconds < 120) return 8;
                else if (durationSeconds < 240) return 9;
                else if (durationSeconds < 500) return 10;
                else if (durationSeconds < 900) return 11;
                else return 12; // 900s+
            }

            // Get all timeline buckets
            const timeBuckets = getTimelineBucketsFromRequests(requests, grouping);
            const timeGroups = {};

            // Initialize time buckets with collection -> duration bucket -> count
            timeBuckets.forEach(ts => {
                timeGroups[ts.toISOString()] = {};
            });

            // Group queries by collection, time bucket, and duration bucket
            requests.forEach((request) => {
                const sql = request.statement || request.preparedText || "";
                const collections = extractCollectionsFromSQL(sql);
                
                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);
                const key = timeKey.toISOString();

                const elapsedMs = request.elapsedTime ? parseTime(request.elapsedTime) : 0;
                const durationSeconds = elapsedMs / 1000;  // Convert ms to seconds
                const durationBucketIdx = getDurationBucketIndex(durationSeconds);

                collections.forEach(collection => {
                    if (!timeGroups[key][collection]) {
                        timeGroups[key][collection] = {};
                    }
                    if (!timeGroups[key][collection][durationBucketIdx]) {
                        timeGroups[key][collection][durationBucketIdx] = 0;
                    }
                    timeGroups[key][collection][durationBucketIdx]++;
                });
            });

            // Get all unique collections and count total queries per collection
            const collectionQueryCounts = {};
            Object.values(timeGroups).forEach(group => {
                Object.entries(group).forEach(([collection, durationBuckets]) => {
                    if (!collectionQueryCounts[collection]) {
                        collectionQueryCounts[collection] = 0;
                    }
                    Object.values(durationBuckets).forEach(count => {
                        collectionQueryCounts[collection] += count;
                    });
                });
            });

            // Sort collections by query count (ascending) - fewest queries in front, most in back
            const allCollections = Object.keys(collectionQueryCounts).sort((a, b) => {
                return collectionQueryCounts[a] - collectionQueryCounts[b];
            });

            // Create a mapping of collection to index for y-axis (sorted by query count)
            const collectionToIndex = {};
            allCollections.forEach((collection, idx) => {
                collectionToIndex[collection] = idx;
            });

            // Build data points for ECharts scatter3D
            const data = [];
            timeBuckets.forEach((ts, timeIndex) => {
                const key = ts.toISOString();
                Object.entries(timeGroups[key]).forEach(([collection, durationBuckets]) => {
                    Object.entries(durationBuckets).forEach(([bucketIdx, count]) => {
                        if (count > 0) {
                            const formattedTime = ts.toLocaleString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            });
                            const bucketLabel = durationBucketDefinitions[parseInt(bucketIdx)].label;
                            
                            data.push({
                                value: [timeIndex, collectionToIndex[collection], parseInt(bucketIdx)],
                                itemStyle: { color: durationColors[parseInt(bucketIdx)] },
                                actualCount: count,
                                collection: collection,
                                time: formattedTime,
                                duration: bucketLabel
                            });
                        }
                    });
                });
            });

            // Store data globally for fullscreen
            window.echartsTimelineData = {
                data,
                timeBuckets,
                allCollections,
                durationBucketDefinitions,
                durationColors,
                collectionQueryCounts
            };

            Logger.info(`✅ ECharts 3D Timeline data prepared: ${data.length} data points, ${allCollections.length} collections`);
        }



// ============================================================

// CHART: createECharts3DQueryTypes

// ============================================================


        function createECharts3DQueryTypes(requests, grouping) {
            if (!requests || requests.length === 0) {
                Logger.debug(TEXT_CONSTANTS.NO_DATA_AVAILABLE || "No data available");
                return;
            }

            // Statement type colors (matching 2D chart)
            const colorMap = {
                SELECT: "#007bff", // Blue
                INSERT: "#28a745", // Green
                UPDATE: "#17c671", // Light green
                DELETE: "#dc3545", // Red
                UPSERT: "#6f42c1", // Purple
                MERGE: "#9c27b0", // Deep purple
                CREATE: "#fd7e14", // Orange
                DROP: "#e83e8c", // Pink
                EXPLAIN: "#20c997", // Teal
                ADVISE: "#17a2b8", // Cyan
                INFER: "#ffc107", // Yellow
                WITH: "#6c757d", // Gray
                PREPARE: "#fd7e14", // Orange-red
                EXECUTE: "#6610f2", // Indigo
                "--": "#343a40", // Dark gray (comments)
                UNKNOWN: "#868e96", // Light gray
            };

            // Get all timeline buckets
            const timeBuckets = getTimelineBucketsFromRequests(requests, grouping);
            
            // Data structure: timeGroups[timeKey][collection][statementType] = { count, durations }
            const timeGroups = {};
            const fatalQueriesData = {}; // Separate tracking for fatal queries

            // Initialize time buckets
            timeBuckets.forEach(ts => {
                timeGroups[ts.toISOString()] = {};
                fatalQueriesData[ts.toISOString()] = {}; // collection -> { count, durations }
            });

            // Group queries by time, collection, and statement type
            requests.forEach((request) => {
                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);
                const key = timeKey.toISOString();

                if (!timeGroups[key]) return;

                const sql = request.statement || request.preparedText || "";
                const collections = extractCollectionsFromSQL(sql);
                const statementType = request.statementType || deriveStatementType(sql) || "UNKNOWN";
                const elapsedMs = parseTime(request.elapsedTime);
                const durationSeconds = elapsedMs / 1000;
                const isFatal = request.state && request.state.toLowerCase() === 'fatal';

                // If no collections found, use "UNKNOWN_COLLECTION" to ensure all queries are counted
                const collectionsToProcess = collections.length > 0 ? collections : ["UNKNOWN_COLLECTION"];

                collectionsToProcess.forEach(collection => {
                    // Track fatal queries separately
                    if (isFatal) {
                        if (!fatalQueriesData[key][collection]) {
                            fatalQueriesData[key][collection] = {
                                count: 0,
                                durations: []
                            };
                        }
                        fatalQueriesData[key][collection].count++;
                        fatalQueriesData[key][collection].durations.push(durationSeconds);
                    }

                    // Track regular statement types
                    if (!timeGroups[key][collection]) {
                        timeGroups[key][collection] = {};
                    }
                    if (!timeGroups[key][collection][statementType]) {
                        timeGroups[key][collection][statementType] = {
                            count: 0,
                            durations: []
                        };
                    }
                    timeGroups[key][collection][statementType].count++;
                    timeGroups[key][collection][statementType].durations.push(durationSeconds);
                });
            });

            // Get all unique statement types
            const allStatementTypes = new Set();
            Object.values(timeGroups).forEach(timeGroup => {
                Object.values(timeGroup).forEach(collectionData => {
                    Object.keys(collectionData).forEach(type => {
                        allStatementTypes.add(type);
                    });
                });
            });

            // Get all unique collections
            const allCollections = new Set();
            Object.values(timeGroups).forEach(timeGroup => {
                Object.keys(timeGroup).forEach(collection => {
                    allCollections.add(collection);
                });
            });

            // Add collections from fatal queries
            Object.values(fatalQueriesData).forEach(fatalTimeData => {
                Object.keys(fatalTimeData).forEach(collection => {
                    allCollections.add(collection);
                });
            });

            // Count totals for sorting
            const statementTypeCounts = {};
            const collectionCounts = {};

            Object.values(timeGroups).forEach(timeGroup => {
                Object.entries(timeGroup).forEach(([collection, statementTypes]) => {
                    if (!collectionCounts[collection]) {
                        collectionCounts[collection] = 0;
                    }
                    Object.entries(statementTypes).forEach(([statementType, data]) => {
                        if (!statementTypeCounts[statementType]) {
                            statementTypeCounts[statementType] = 0;
                        }
                        statementTypeCounts[statementType] += data.count;
                        collectionCounts[collection] += data.count;
                    });
                });
            });

            // Sort by count (ascending - smallest in front)
            const sortedStatementTypes = Array.from(allStatementTypes).sort((a, b) => {
                return (statementTypeCounts[a] || 0) - (statementTypeCounts[b] || 0);
            });

            const sortedCollections = Array.from(allCollections).sort((a, b) => {
                return (collectionCounts[a] || 0) - (collectionCounts[b] || 0);
            });

            // Create index mappings
            const collectionToIndex = {};
            sortedCollections.forEach((collection, idx) => {
                collectionToIndex[collection] = idx;
            });

            // Build bubble data points (for statement types by collection)
            const bubbleData = [];
            timeBuckets.forEach((ts, timeIndex) => {
                const key = ts.toISOString();
                const formattedTime = ts.toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });

                Object.entries(timeGroups[key]).forEach(([collection, statementTypes]) => {
                    Object.entries(statementTypes).forEach(([statementType, data]) => {
                        if (data.count > 0) {
                            const avgDuration = data.durations.reduce((sum, d) => sum + d, 0) / data.durations.length;

                            bubbleData.push({
                                value: [timeIndex, collectionToIndex[collection], avgDuration],
                                itemStyle: { color: colorMap[statementType] || '#868e96' },
                                actualCount: data.count,
                                statementType: statementType,
                                collection: collection,
                                time: formattedTime,
                                avgDuration: avgDuration,
                                maxDuration: Math.max(...data.durations),
                                minDuration: Math.min(...data.durations)
                            });
                        }
                    });
                });
            });

            // Build fatal query data points (X markers)
            const fatalData = [];
            timeBuckets.forEach((ts, timeIndex) => {
                const key = ts.toISOString();
                const formattedTime = ts.toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });

                Object.entries(fatalQueriesData[key]).forEach(([collection, data]) => {
                    if (data.count > 0) {
                        const avgDuration = data.durations.reduce((sum, d) => sum + d, 0) / data.durations.length;
                        
                        fatalData.push({
                            value: [timeIndex, collectionToIndex[collection], avgDuration],
                            itemStyle: { color: '#FF0000' },
                            actualCount: data.count,
                            statementType: 'Fatal Query',
                            collection: collection,
                            time: formattedTime,
                            avgDuration: avgDuration,
                            maxDuration: Math.max(...data.durations),
                            minDuration: Math.min(...data.durations)
                        });
                    }
                });
            });

            // Store data globally for fullscreen
            window.echartsQueryTypesData = {
                bubbleData,
                fatalData,
                timeBuckets,
                sortedStatementTypes,
                sortedCollections,
                colorMap,
                statementTypeCounts,
                collectionCounts
            };

            Logger.info(`✅ ECharts 3D Query Types data prepared: ${bubbleData.length} bubbles, ${fatalData.length} fatal markers, ${sortedStatementTypes.length} statement types, ${sortedCollections.length} collections`);
        }



// ============================================================

// CHART: createParseDurationChart

// ============================================================


        function createParseDurationChart(requests, grouping) {
            const canvas = document.getElementById("parse-duration-chart");
            if (!canvas) return;

            const ctx = canvas.getContext("2d");

            if (window.parseDurationChart) {
                window.parseDurationChart.destroy();
            }

            // Get all timeline buckets to ensure charts share same x-axis (universal alignment)
            const timeBuckets = getTimelineBucketsFromRequests(requests, grouping);
            
            const timeGroups = {};
            const buckets = ["1-333µs", "333-666µs", "666µs-1ms", "1-1.3ms", "1.3-1.6ms", "1.6-2ms", "2-10ms", "10-100ms", "100-500ms", "500ms+"];
            const bucketColors = {
                "1-333µs": "rgba(144, 238, 144, 0.7)",      // Light green
                "333-666µs": "rgba(255, 223, 0, 0.7)",      // Yellow
                "666µs-1ms": "rgba(255, 165, 0, 0.7)",      // Orange
                "1-1.3ms": "rgba(255, 140, 0, 0.7)",        // Dark orange
                "1.3-1.6ms": "rgba(255, 99, 71, 0.7)",      // Tomato
                "1.6-2ms": "rgba(255, 69, 0, 0.7)",         // Orange red
                "2-10ms": "rgba(220, 20, 60, 0.7)",         // Crimson
                "10-100ms": "rgba(178, 34, 34, 0.7)",       // Firebrick
                "100-500ms": "rgba(139, 0, 0, 0.7)",        // Dark red
                "500ms+": "rgba(0, 0, 0, 0.8)"              // Black
            };

            // Initialize all time buckets with zero counts
            timeBuckets.forEach(ts => {
                const key = ts.toISOString();
                timeGroups[key] = { timestamp: ts };
                buckets.forEach(b => timeGroups[key][b] = 0);
            });

            requests.forEach((request) => {
                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);
                const key = timeKey.toISOString();

                const parseDurationMs = request.phaseTimes?.parse ? parseTime(request.phaseTimes.parse) : 0;
                
                if (parseDurationMs > 0.001 && parseDurationMs <= 0.333) timeGroups[key]["1-333µs"]++;
                else if (parseDurationMs > 0.333 && parseDurationMs <= 0.666) timeGroups[key]["333-666µs"]++;
                else if (parseDurationMs > 0.666 && parseDurationMs <= 1.0) timeGroups[key]["666µs-1ms"]++;
                else if (parseDurationMs > 1.0 && parseDurationMs <= 1.3) timeGroups[key]["1-1.3ms"]++;
                else if (parseDurationMs > 1.3 && parseDurationMs <= 1.6) timeGroups[key]["1.3-1.6ms"]++;
                else if (parseDurationMs > 1.6 && parseDurationMs <= 2.0) timeGroups[key]["1.6-2ms"]++;
                else if (parseDurationMs > 2.0 && parseDurationMs <= 10.0) timeGroups[key]["2-10ms"]++;
                else if (parseDurationMs > 10.0 && parseDurationMs <= 100.0) timeGroups[key]["10-100ms"]++;
                else if (parseDurationMs > 100.0 && parseDurationMs <= 500.0) timeGroups[key]["100-500ms"]++;
                else if (parseDurationMs > 500.0) timeGroups[key]["500ms+"]++;
            });

            const sortedGroups = timeBuckets.map(ts => timeGroups[ts.toISOString()]);

            const datasets = buckets.map((bucket) => {
                const data = [];
                const maxCount = Math.max(...sortedGroups.map(g => g[bucket] || 0));
                const minRadius = 3;
                const maxRadius = 15;

                sortedGroups.forEach((group) => {
                    const count = group[bucket] || 0;
                    if (count > 0) {
                        const circleSize = minRadius + ((count / (maxCount || 1)) * (maxRadius - minRadius));
                        
                        let yPosition = 0;
                        switch(bucket) {
                            case "1-333µs": yPosition = 0.5; break;
                            case "333-666µs": yPosition = 1.5; break;
                            case "666µs-1ms": yPosition = 2.5; break;
                            case "1-1.3ms": yPosition = 3.5; break;
                            case "1.3-1.6ms": yPosition = 4.5; break;
                            case "1.6-2ms": yPosition = 5.5; break;
                            case "2-10ms": yPosition = 6.5; break;
                            case "10-100ms": yPosition = 7.5; break;
                            case "100-500ms": yPosition = 8.5; break;
                            case "500ms+": yPosition = 9.5; break;
                        }

                        data.push({
                            x: group.timestamp,
                            y: yPosition,
                            r: circleSize,
                            count: count
                        });
                    }
                });

                return {
                    label: `${bucket} (${data.reduce((sum, point) => sum + point.count, 0)} total)`,
                    data: data,
                    backgroundColor: bucketColors[bucket],
                    borderColor: bucketColors[bucket],
                    borderWidth: 1
                };
            });

            window.parseDurationChart = new Chart(ctx, {
                type: "bubble",
                data: { datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { 
                            display: true, 
                            text: "Parse Duration Distribution by Time Buckets (Bubble Size = Query Count)",
                            font: {
                                size: 12
                            }
                        },
                        subtitle: {
                            display: true,
                            text: "(Note: Prepared statements skip parse/plan phases)",
                            font: {
                                size: 10
                            }
                        },
                        legend: { display: true, position: "top" },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const dataPoint = context.raw;
                                    const bucket = context.dataset.label.split(" (")[0];
                                    return [
                                        `${bucket}`,
                                        `Count: ${dataPoint.count}`,
                                        `${new Date(dataPoint.x).toLocaleString()}`
                                    ];
                                }
                            }
                        },
                        zoom: {
                            limits: { x: { min: "original", max: "original" }, y: { min: "original", max: "original" } },
                            pan: {
                                enabled: true,
                                mode: "xy",
                                onPan: function ({ chart }) {
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                }
                            },
                            zoom: {
                                wheel: { enabled: false },
                                pinch: { enabled: true },
                                drag: {
                                    enabled: true,
                                    backgroundColor: "rgba(100,100,100,0.4)",
                                    borderColor: "rgba(50,50,50,0.8)",
                                    borderWidth: 2
                                },
                                mode: "xy",
                                onZoom: function ({ chart }) {
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: "time",
                            time: getCurrentTimeConfig(requests),
                            title: { display: true, text: "Request Time" }
                        },
                        y: {
                            title: { display: true, text: "Duration Range" },
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    if (value === 0.5) return "1-333µs";
                                    if (value === 1.5) return "333-666µs";
                                    if (value === 2.5) return "666µs-1ms";
                                    if (value === 3.5) return "1-1.3ms";
                                    if (value === 4.5) return "1.3-1.6ms";
                                    if (value === 5.5) return "1.6-2ms";
                                    if (value === 6.5) return "2-10ms";
                                    if (value === 7.5) return "10-100ms";
                                    if (value === 8.5) return "100-500ms";
                                    if (value === 9.5) return "500ms+";
                                    return "";
                                }
                            }
                        }
                    },
                    interaction: { mode: "point", intersect: false }
                },
                plugins: [verticalLinePlugin, horizontalLinePlugin]
            });

            registerTimelineChart(window.parseDurationChart, ctx);
        }



// ============================================================

// CHART: createPlanDurationChart

// ============================================================


        function createPlanDurationChart(requests, grouping) {
            const canvas = document.getElementById("plan-duration-chart");
            if (!canvas) return;

            const ctx = canvas.getContext("2d");

            if (window.planDurationChart) {
                window.planDurationChart.destroy();
            }

            // Get all timeline buckets to ensure charts share same x-axis (universal alignment)
            const timeBuckets = getTimelineBucketsFromRequests(requests, grouping);
            
            const timeGroups = {};
            const buckets = ["1-333µs", "333-666µs", "666µs-1ms", "1-1.3ms", "1.3-1.6ms", "1.6-2ms", "2-10ms", "10-100ms", "100-500ms", "500ms+"];
            const bucketColors = {
                "1-333µs": "rgba(144, 238, 144, 0.7)",      // Light green
                "333-666µs": "rgba(255, 223, 0, 0.7)",      // Yellow
                "666µs-1ms": "rgba(255, 165, 0, 0.7)",      // Orange
                "1-1.3ms": "rgba(255, 140, 0, 0.7)",        // Dark orange
                "1.3-1.6ms": "rgba(255, 99, 71, 0.7)",      // Tomato
                "1.6-2ms": "rgba(255, 69, 0, 0.7)",         // Orange red
                "2-10ms": "rgba(220, 20, 60, 0.7)",         // Crimson
                "10-100ms": "rgba(178, 34, 34, 0.7)",       // Firebrick
                "100-500ms": "rgba(139, 0, 0, 0.7)",        // Dark red
                "500ms+": "rgba(0, 0, 0, 0.8)"              // Black
            };

            // Initialize all time buckets with zero counts
            timeBuckets.forEach(ts => {
                const key = ts.toISOString();
                timeGroups[key] = { timestamp: ts };
                buckets.forEach(b => timeGroups[key][b] = 0);
            });

            requests.forEach((request) => {
                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);
                const key = timeKey.toISOString();

                const planDurationMs = request.phaseTimes?.plan ? parseTime(request.phaseTimes.plan) : 0;
                
                if (planDurationMs > 0.001 && planDurationMs <= 0.333) timeGroups[key]["1-333µs"]++;
                else if (planDurationMs > 0.333 && planDurationMs <= 0.666) timeGroups[key]["333-666µs"]++;
                else if (planDurationMs > 0.666 && planDurationMs <= 1.0) timeGroups[key]["666µs-1ms"]++;
                else if (planDurationMs > 1.0 && planDurationMs <= 1.3) timeGroups[key]["1-1.3ms"]++;
                else if (planDurationMs > 1.3 && planDurationMs <= 1.6) timeGroups[key]["1.3-1.6ms"]++;
                else if (planDurationMs > 1.6 && planDurationMs <= 2.0) timeGroups[key]["1.6-2ms"]++;
                else if (planDurationMs > 2.0 && planDurationMs <= 10.0) timeGroups[key]["2-10ms"]++;
                else if (planDurationMs > 10.0 && planDurationMs <= 100.0) timeGroups[key]["10-100ms"]++;
                else if (planDurationMs > 100.0 && planDurationMs <= 500.0) timeGroups[key]["100-500ms"]++;
                else if (planDurationMs > 500.0) timeGroups[key]["500ms+"]++;
            });

            const sortedGroups = timeBuckets.map(ts => timeGroups[ts.toISOString()]);

            const datasets = buckets.map((bucket) => {
                const data = [];
                const maxCount = Math.max(...sortedGroups.map(g => g[bucket] || 0));
                const minRadius = 3;
                const maxRadius = 15;

                sortedGroups.forEach((group) => {
                    const count = group[bucket] || 0;
                    if (count > 0) {
                        const circleSize = minRadius + ((count / (maxCount || 1)) * (maxRadius - minRadius));
                        
                        let yPosition = 0;
                        switch(bucket) {
                            case "1-333µs": yPosition = 0.5; break;
                            case "333-666µs": yPosition = 1.5; break;
                            case "666µs-1ms": yPosition = 2.5; break;
                            case "1-1.3ms": yPosition = 3.5; break;
                            case "1.3-1.6ms": yPosition = 4.5; break;
                            case "1.6-2ms": yPosition = 5.5; break;
                            case "2-10ms": yPosition = 6.5; break;
                            case "10-100ms": yPosition = 7.5; break;
                            case "100-500ms": yPosition = 8.5; break;
                            case "500ms+": yPosition = 9.5; break;
                        }

                        data.push({
                            x: group.timestamp,
                            y: yPosition,
                            r: circleSize,
                            count: count
                        });
                    }
                });

                return {
                    label: `${bucket} (${data.reduce((sum, point) => sum + point.count, 0)} total)`,
                    data: data,
                    backgroundColor: bucketColors[bucket],
                    borderColor: bucketColors[bucket],
                    borderWidth: 1
                };
            });

            window.planDurationChart = new Chart(ctx, {
                type: "bubble",
                data: { datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { 
                            display: true, 
                            text: "Plan Duration Distribution by Time Buckets",
                            font: {
                                size: 12
                            }
                        },
                        subtitle: {
                            display: true,
                            text: "(Note: Prepared statements skip parse/plan phases)",
                            font: {
                                size: 10
                            }
                        },
                        legend: { display: true, position: "top" },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const dataPoint = context.raw;
                                    const bucket = context.dataset.label.split(" (")[0];
                                    return [
                                        `${bucket}`,
                                        `Count: ${dataPoint.count}`,
                                        `${new Date(dataPoint.x).toLocaleString()}`
                                    ];
                                }
                            }
                        },
                        zoom: {
                            limits: { x: { min: "original", max: "original" }, y: { min: "original", max: "original" } },
                            pan: {
                                enabled: true,
                                mode: "xy",
                                onPan: function ({ chart }) {
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                }
                            },
                            zoom: {
                                wheel: { enabled: false },
                                pinch: { enabled: true },
                                drag: {
                                    enabled: true,
                                    backgroundColor: "rgba(100,100,100,0.4)",
                                    borderColor: "rgba(50,50,50,0.8)",
                                    borderWidth: 2
                                },
                                mode: "xy",
                                onZoom: function ({ chart }) {
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: "time",
                            time: getCurrentTimeConfig(requests),
                            title: { display: true, text: "Request Time" }
                        },
                        y: {
                            title: { display: true, text: "Duration Range" },
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    if (value === 0.5) return "1-333µs";
                                    if (value === 1.5) return "333-666µs";
                                    if (value === 2.5) return "666µs-1ms";
                                    if (value === 3.5) return "1-1.3ms";
                                    if (value === 4.5) return "1.3-1.6ms";
                                    if (value === 5.5) return "1.6-2ms";
                                    if (value === 6.5) return "2-10ms";
                                    if (value === 7.5) return "10-100ms";
                                    if (value === 8.5) return "100-500ms";
                                    if (value === 9.5) return "500ms+";
                                    return "";
                                }
                            }
                        }
                    },
                    interaction: { mode: "point", intersect: false }
                },
                plugins: [verticalLinePlugin, horizontalLinePlugin]
            });

            registerTimelineChart(window.planDurationChart, ctx);
        }



// ============================================================

// CHART: createResultCountChart

// ============================================================


        function createResultCountChart(requests, grouping) {
            const canvas = document.getElementById("result-count-chart");
            if (!canvas) return;

            const ctx = canvas.getContext("2d");

            // Destroy existing chart if it exists
            if (window.resultCountChart) {
                window.resultCountChart.destroy();
            }

            // Group requests by time
            const timeGroups = {};

            requests.forEach((request) => {
                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);
                const key = timeKey.toISOString();

                if (!timeGroups[key]) {
                    timeGroups[key] = {
                        timestamp: timeKey,
                        totalResultCount: 0,
                        queryCount: 0,
                    };
                }

                const resultCount = request.resultCount || 0;
                timeGroups[key].totalResultCount += resultCount;
                timeGroups[key].queryCount++;
            });

            // Convert to sorted array
            const sortedData = Object.values(timeGroups).sort(
                (a, b) => a.timestamp - b.timestamp
            );

            // Prepare chart data
            const labels = sortedData.map((item) => item.timestamp);
            const resultCountData = sortedData.map((item) => item.totalResultCount);
            const avgResultCountData = sortedData.map((item) =>
                item.queryCount > 0 ? item.totalResultCount / item.queryCount : 0
            );

            window.resultCountChart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: "Total Result Count",
                            data: resultCountData,
                            backgroundColor: "rgba(144, 238, 144, 0.8)", // Light green
                            borderColor: "rgba(144, 238, 144, 1)",
                            borderWidth: 1,
                            yAxisID: "y",
                            order: 2,
                        },
                        {
                            label: "Avg Result Count per Query",
                            data: avgResultCountData,
                            type: "line",
                            backgroundColor: "rgba(255, 165, 0, 0.8)", // Orange
                            borderColor: "rgba(255, 165, 0, 1)",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            yAxisID: "y1",
                            order: 1,
                            tension: 0.3,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: "Result Count Analysis: Total vs Average per Query",
                            font: {
                                size: 12
                            }
                        },
                        legend: {
                            display: true,
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.dataset.label || '';
                                    const value = Math.round(context.parsed.y).toLocaleString();
                                    return `${label}: ${value}`;
                                },
                                afterBody: function (tooltipItems) {
                                    const dataIndex = tooltipItems[0].dataIndex;
                                    const data = sortedData[dataIndex];
                                    return [`Queries: ${data.queryCount.toLocaleString()}`];
                                }
                            }
                        },
                        zoom: {
                            limits: {
                                x: { min: "original", max: "original" },
                                y: { min: "original", max: "original" },
                            },
                            pan: {
                                enabled: true,
                                mode: "xy",
                                onPan: function ({ chart }) {
                                    // Update current time range
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    // Sync pan with other charts
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                },
                            },
                            zoom: {
                                wheel: {
                                    enabled: false,
                                },
                                pinch: {
                                    enabled: true,
                                },
                                drag: {
                                    enabled: true,
                                    backgroundColor: "rgba(100,100,100,0.4)",
                                    borderColor: "rgba(50,50,50,0.8)",
                                    borderWidth: 2,
                                },
                                mode: "xy",
                                onZoom: function ({ chart }) {
                                    // Update current time range
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    // Sync zoom with other charts
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            type: "time",
                            time: getCurrentTimeConfig(requests),
                            title: {
                                display: true,
                                text: "Request Time",
                            },
                        },
                        y: {
                            type: "linear",
                            position: "left",
                            title: {
                                display: true,
                                text: "Total Result Count",
                            },
                            beginAtZero: true,
                        },
                        y1: {
                            type: "linear",
                            position: "right",
                            title: {
                                display: true,
                                text: "Avg per Query",
                            },
                            beginAtZero: true,
                            grid: {
                                drawOnChartArea: false,
                            },
                        },
                    },
                    interaction: {
                        mode: "index",
                        intersect: false,
                    },
                },
                plugins: [verticalLinePlugin]
            });

            // Register chart for crosshair synchronization
            registerTimelineChart(window.resultCountChart, ctx);
        }



// ============================================================

// CHART: createResultSizeChart

// ============================================================


        function createResultSizeChart(requests, grouping) {
            const canvas = document.getElementById("result-size-chart");
            if (!canvas) return;

            const ctx = canvas.getContext("2d");

            // Destroy existing chart if it exists
            if (window.resultSizeChart) {
                window.resultSizeChart.destroy();
            }

            // Group requests by time
            const timeGroups = {};

            requests.forEach((request) => {
                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);
                const key = timeKey.toISOString();

                if (!timeGroups[key]) {
                    timeGroups[key] = {
                        timestamp: timeKey,
                        totalResultSize: 0,
                        queryCount: 0,
                    };
                }

                const resultSize = request.resultSize || 0;
                timeGroups[key].totalResultSize += resultSize;
                timeGroups[key].queryCount++;
            });

            // Convert to sorted array
            const sortedData = Object.values(timeGroups).sort(
                (a, b) => a.timestamp - b.timestamp
            );

            // Prepare chart data (convert bytes to MB)
            const labels = sortedData.map((item) => item.timestamp);
            const resultSizeData = sortedData.map((item) => item.totalResultSize / (1024 * 1024));
            const avgResultSizeData = sortedData.map((item) =>
                item.queryCount > 0 ? (item.totalResultSize / item.queryCount) / (1024 * 1024) : 0
            );

            window.resultSizeChart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: "Total Result Size (MB)",
                            data: resultSizeData,
                            backgroundColor: "rgba(0, 100, 0, 0.8)", // Dark green
                            borderColor: "rgba(0, 100, 0, 1)",
                            borderWidth: 1,
                            yAxisID: "y",
                            order: 2,
                        },
                        {
                            label: "Avg Result Size per Query (MB)",
                            data: avgResultSizeData,
                            type: "line",
                            backgroundColor: "rgba(255, 165, 0, 0.8)", // Orange
                            borderColor: "rgba(255, 165, 0, 1)",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            yAxisID: "y1",
                            order: 1,
                            tension: 0.3,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: "Result Size Analysis: Total vs Average per Query",
                            font: {
                                size: 12
                            }
                        },
                        legend: {
                            display: true,
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.dataset.label || '';
                                    const value = context.parsed.y;
                                    return `${label}: ${value.toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3})}`;
                                },
                                afterBody: function (tooltipItems) {
                                    const dataIndex = tooltipItems[0].dataIndex;
                                    const data = sortedData[dataIndex];
                                    return [`Queries: ${data.queryCount.toLocaleString()}`];
                                }
                            }
                        },
                        zoom: {
                            limits: {
                                x: { min: "original", max: "original" },
                                y: { min: "original", max: "original" },
                            },
                            pan: {
                                enabled: true,
                                mode: "xy",
                                onPan: function ({ chart }) {
                                    // Update current time range
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    // Sync pan with other charts
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                },
                            },
                            zoom: {
                                wheel: {
                                    enabled: false,
                                },
                                pinch: {
                                    enabled: true,
                                },
                                drag: {
                                    enabled: true,
                                    backgroundColor: "rgba(100,100,100,0.4)",
                                    borderColor: "rgba(50,50,50,0.8)",
                                    borderWidth: 2,
                                },
                                mode: "xy",
                                onZoom: function ({ chart }) {
                                    // Update current time range
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    // Sync zoom with other charts
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            type: "time",
                            time: getCurrentTimeConfig(requests),
                            title: {
                                display: true,
                                text: "Request Time",
                            },
                        },
                        y: {
                            type: "linear",
                            position: "left",
                            title: {
                                display: true,
                                text: "Total Result Size (MB)",
                            },
                            beginAtZero: true,
                        },
                        y1: {
                            type: "linear",
                            position: "right",
                            title: {
                                display: true,
                                text: "Avg per Query (MB)",
                            },
                            beginAtZero: true,
                            grid: {
                                drawOnChartArea: false,
                            },
                        },
                    },
                    interaction: {
                        mode: "index",
                        intersect: false,
                    },
                },
                plugins: [verticalLinePlugin]
            });

            // Register chart for crosshair synchronization
            registerTimelineChart(window.resultSizeChart, ctx);
        }



// ============================================================

// CHART: createECharts3DAvgDocSize

// ============================================================


        function createECharts3DAvgDocSize(requests, grouping) {
            if (!requests || requests.length === 0) {
                Logger.debug(TEXT_CONSTANTS.NO_DATA_AVAILABLE || "No data available");
                return;
            }

            // Define result size buckets (in bytes) - MUST match 2D chart exactly
            const resultSizeBucketDefinitions = [
                { label: "0 bytes", min: 0, max: 0, value: 0, color: "rgba(128, 128, 128, 0.7)" },                   // Gray
                { label: "1-10 bytes", min: 1, max: 10, value: 1, color: "rgba(255, 0, 255, 0.7)" },                 // Magenta
                { label: "10-100 bytes", min: 10, max: 100, value: 2, color: "rgba(128, 0, 255, 0.7)" },             // Purple
                { label: "100-1K bytes", min: 100, max: 1000, value: 3, color: "rgba(0, 0, 200, 0.7)" },             // Dark Blue
                { label: "1K-10K bytes", min: 1000, max: 10000, value: 4, color: "rgba(0, 200, 255, 0.7)" },         // Cyan
                { label: "10K-100K bytes", min: 10000, max: 100000, value: 5, color: "rgba(0, 180, 0, 0.7)" },       // Green
                { label: "100K-1MB", min: 100000, max: 1000000, value: 6, color: "rgba(150, 200, 0, 0.7)" },         // Yellow-Green
                { label: "1MB-5MB", min: 1000000, max: 5000000, value: 7, color: "rgba(255, 220, 0, 0.7)" },         // Bright Yellow
                { label: "5MB-10MB", min: 5000000, max: 10000000, value: 8, color: "rgba(255, 150, 0, 0.7)" },       // Orange
                { label: "10MB-15MB", min: 10000000, max: 15000000, value: 9, color: "rgba(255, 80, 0, 0.7)" },      // Red-Orange
                { label: "15MB-20MB", min: 15000000, max: 20000000, value: 10, color: "rgba(220, 0, 0, 0.7)" }       // Red
            ];

            // Extract colors array
            const resultSizeColors = resultSizeBucketDefinitions.map(b => b.color);

            // Get result size bucket index from avg doc size in bytes
            function getResultSizeBucketIndex(avgDocSizeBytes) {
                if (avgDocSizeBytes === 0) return 0;
                else if (avgDocSizeBytes < 10) return 1;
                else if (avgDocSizeBytes < 100) return 2;
                else if (avgDocSizeBytes < 1000) return 3;
                else if (avgDocSizeBytes < 10000) return 4;
                else if (avgDocSizeBytes < 100000) return 5;
                else if (avgDocSizeBytes < 1000000) return 6;
                else if (avgDocSizeBytes < 5000000) return 7;
                else if (avgDocSizeBytes < 10000000) return 8;
                else if (avgDocSizeBytes < 15000000) return 9;
                else return 10; // 15MB-20MB
            }

            // Get all timeline buckets
            const timeBuckets = getTimelineBucketsFromRequests(requests, grouping);
            const timeGroups = {};

            // Initialize time buckets with collection -> size bucket -> count
            timeBuckets.forEach(ts => {
                timeGroups[ts.toISOString()] = {};
            });

            // Group queries by collection, time bucket, and result size bucket
            requests.forEach((request) => {
                const sql = request.statement || request.preparedText || "";
                const collections = extractCollectionsFromSQL(sql);
                
                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);
                const key = timeKey.toISOString();

                // Calculate average document size in bytes (same as 2D chart)
                const resultCount = request.resultCount || 0;
                const resultSize = request.resultSize || 0;
                
                if (resultCount === 0 || resultSize === 0) return;
                
                const avgDocSize = resultSize / resultCount;
                const sizeBucketIdx = getResultSizeBucketIndex(avgDocSize);

                collections.forEach(collection => {
                    if (!timeGroups[key][collection]) {
                        timeGroups[key][collection] = {};
                    }
                    if (!timeGroups[key][collection][sizeBucketIdx]) {
                        timeGroups[key][collection][sizeBucketIdx] = 0;
                    }
                    timeGroups[key][collection][sizeBucketIdx]++;
                });
            });

            // Get all unique collections and count total queries per collection
            const collectionQueryCounts = {};
            Object.values(timeGroups).forEach(group => {
                Object.entries(group).forEach(([collection, sizeBuckets]) => {
                    if (!collectionQueryCounts[collection]) {
                        collectionQueryCounts[collection] = 0;
                    }
                    Object.values(sizeBuckets).forEach(count => {
                        collectionQueryCounts[collection] += count;
                    });
                });
            });

            // Sort collections by query count (ascending) - fewest queries in front, most in back
            const allCollections = Object.keys(collectionQueryCounts).sort((a, b) => {
                return collectionQueryCounts[a] - collectionQueryCounts[b];
            });

            // Create a mapping of collection to index for y-axis (sorted by query count)
            const collectionToIndex = {};
            allCollections.forEach((collection, idx) => {
                collectionToIndex[collection] = idx;
            });

            // Build data points for ECharts scatter3D
            const data = [];
            timeBuckets.forEach((ts, timeIndex) => {
                const key = ts.toISOString();
                Object.entries(timeGroups[key]).forEach(([collection, sizeBuckets]) => {
                    Object.entries(sizeBuckets).forEach(([bucketIdx, count]) => {
                        if (count > 0) {
                            const formattedTime = ts.toLocaleString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            });
                            const bucketLabel = resultSizeBucketDefinitions[parseInt(bucketIdx)].label;
                            
                            data.push({
                                value: [timeIndex, collectionToIndex[collection], parseInt(bucketIdx)],
                                itemStyle: { color: resultSizeColors[parseInt(bucketIdx)] },
                                actualCount: count,
                                collection: collection,
                                time: formattedTime,
                                sizeRange: bucketLabel
                            });
                        }
                    });
                });
            });

            // Store data globally for fullscreen
            window.echartsAvgDocSizeData = {
                data,
                timeBuckets,
                allCollections,
                resultSizeBucketDefinitions,
                resultSizeColors,
                collectionQueryCounts
            };

            Logger.info(`✅ ECharts 3D Avg Doc Size data prepared: ${data.length} data points, ${allCollections.length} collections`);
        }



// ============================================================

// CHART: createCpuTimeChart

// ============================================================


        function createCpuTimeChart(requests, grouping) {
            const canvas = document.getElementById("cpu-time-chart");
            if (!canvas) return;

            const ctx = canvas.getContext("2d");

            // Destroy existing chart if it exists
            if (window.cpuTimeChart) {
                window.cpuTimeChart.destroy();
            }

            // Group requests by time
            const timeGroups = {};

            requests.forEach((request) => {
                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);
                const key = timeKey.toISOString();

                if (!timeGroups[key]) {
                    timeGroups[key] = {
                        timestamp: timeKey,
                        cpuTimeSum: 0,
                        elapsedTimeSum: 0,
                        kernTimeSum: 0,
                        queryCount: 0,
                    };
                }

                // Parse time values - handle both string and number formats
                const cpuTimeMs = parseTime(request.cpuTime) || 0;
                const elapsedTimeMs = parseTime(request.elapsedTime) || 0;
                const kernTimeMs = calculateTotalKernTime(request.plan) || 0;

                timeGroups[key].cpuTimeSum += cpuTimeMs;
                timeGroups[key].elapsedTimeSum += elapsedTimeMs;
                timeGroups[key].kernTimeSum += kernTimeMs;
                timeGroups[key].queryCount++;
            });

            // Convert to sorted array and calculate averages
            const sortedData = Object.values(timeGroups)
                .sort((a, b) => a.timestamp - b.timestamp)
                .map(item => ({
                    ...item,
                    avgCpuTime: item.queryCount > 0 ? item.cpuTimeSum / item.queryCount : 0,
                    avgElapsedTime: item.queryCount > 0 ? item.elapsedTimeSum / item.queryCount : 0,
                    avgKernTime: item.queryCount > 0 ? item.kernTimeSum / item.queryCount : 0,
                }));

            // Prepare chart data
            const labels = sortedData.map((item) => item.timestamp);
            const avgCpuTimeData = sortedData.map((item) => item.avgCpuTime);
            const avgKernTimeData = sortedData.map((item) => item.avgKernTime);
            const avgElapsedTimeData = sortedData.map((item) => item.avgElapsedTime);

            // Calculate percentage data for line graphs
            const cpuKernPercentData = sortedData.map((item) => {
                return item.avgKernTime > 0 ? (item.avgCpuTime / item.avgKernTime) * 100 : 0;
            });

            const cpuElapsedPercentData = sortedData.map((item) => {
                return item.avgElapsedTime > 0 ? (item.avgCpuTime / item.avgElapsedTime) * 100 : 0;
            });

            window.cpuTimeChart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: "CPU as % of Elapsed (dotted)",
                            data: cpuElapsedPercentData,
                            type: "line",
                            backgroundColor: "rgba(0, 128, 128, 0.8)", // Dark Teal
                            borderColor: "rgba(0, 128, 128, 1)",
                            borderWidth: 2,
                            borderDash: [5, 5], // Dotted line
                            fill: false,
                            spanGaps: false,
                            yAxisID: "y1",
                            order: 5,
                            tension: 0.3,
                        },
                        {
                            label: "CPU as % of Kernel",
                            data: cpuKernPercentData,
                            type: "line",
                            backgroundColor: "rgba(139, 0, 0, 0.8)", // Dark Red
                            borderColor: "rgba(139, 0, 0, 1)",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            yAxisID: "y1",
                            order: 4,
                            tension: 0.3,
                        },
                        {
                            label: "Avg Elapsed Time (ms)",
                            data: avgElapsedTimeData,
                            backgroundColor: "rgba(75, 192, 192, 0.8)", // Teal
                            borderColor: "rgba(75, 192, 192, 1)",
                            borderWidth: 1,
                            yAxisID: "y",
                            order: 3,
                        },
                        {
                            label: "Avg Kernel Time (ms)",
                            data: avgKernTimeData,
                            backgroundColor: "rgba(255, 99, 132, 0.8)", // Red
                            borderColor: "rgba(255, 99, 132, 1)",
                            borderWidth: 1,
                            yAxisID: "y",
                            order: 2,
                        },
                        {
                            label: "Avg CPU Time (ms)",
                            data: avgCpuTimeData,
                            backgroundColor: "rgba(54, 162, 235, 0.8)", // Blue
                            borderColor: "rgba(54, 162, 235, 1)",
                            borderWidth: 1,
                            yAxisID: "y",
                            order: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: "CPU/Kernel/Elapsed Time Analysis",
                            font: {
                            size: 12
                            }
                        },
                        legend: {
                            display: true,
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const label = context.dataset.label || '';
                                    const value = context.parsed.y;
                                    
                                    if (label.includes('Avg CPU Time')) {
                                        return `Avg CPU (ms): ${Math.round(value).toLocaleString()}`;
                                    }
                                    if (label.includes('Avg Kernel Time')) {
                                        return `Avg Kernel (ms): ${Math.round(value).toLocaleString()}`;
                                    }
                                    if (label.includes('Avg Elapsed Time')) {
                                        return `Avg Elapsed (ms): ${Math.round(value).toLocaleString()}`;
                                    }
                                    if (label.includes('CPU as % of Kernel')) {
                                        return `CPU % of Kernel: ${Math.round(value).toLocaleString()}%`;
                                    }
                                    if (label.includes('CPU as % of Elapsed')) {
                                        return `CPU % of Elapsed: ${Math.round(value).toLocaleString()}%`;
                                    }
                                    return `${label}: ${Math.round(value).toLocaleString()}`;
                                },
                                afterBody: function (tooltipItems) {
                                    const dataIndex = tooltipItems[0].dataIndex;
                                    const data = sortedData[dataIndex];
                                    return [
                                        `Queries: ${data.queryCount.toLocaleString()}`
                                    ];
                                }
                            }
                        },
                        zoom: {
                            limits: {
                                x: { min: "original", max: "original" },
                                y: { min: "original", max: "original" },
                            },
                            pan: {
                                enabled: true,
                                mode: "xy",
                                onPan: function ({ chart }) {
                                    // Update current time range
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    // Sync pan with other charts
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                },
                            },
                            zoom: {
                                wheel: {
                                    enabled: false,
                                },
                                pinch: {
                                    enabled: true,
                                },
                                drag: {
                                    enabled: true,
                                    backgroundColor: "rgba(100,100,100,0.4)",
                                    borderColor: "rgba(50,50,50,0.8)",
                                    borderWidth: 2,
                                },
                                mode: "xy",
                                onZoom: function ({ chart }) {
                                    // Update current time range
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    // Sync zoom with other charts
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            type: "time",
                            time: getCurrentTimeConfig(requests),
                            title: {
                                display: true,
                                text: "Request Time",
                            },
                        },
                        y: {
                            type: "linear",
                            position: "left",
                            title: {
                                display: true,
                                text: "Time (ms)",
                            },
                            beginAtZero: true,
                        },
                        y1: {
                            type: "linear",
                            position: "right",
                            title: {
                                display: true,
                                text: "Percentage (%)",
                            },
                            beginAtZero: true,
                            suggestedMin: 0,
                            suggestedMax: 100, // Always show 0-100% range, scale higher if needed
                            grid: {
                                drawOnChartArea: false,
                            },
                        },
                    },
                    interaction: {
                        mode: "index",
                        intersect: false,
                    },
                },
                plugins: [verticalLinePlugin]
            });

            // Register chart for crosshair synchronization
            registerTimelineChart(window.cpuTimeChart, ctx);
        }



// ============================================================

// CHART: createIndexScanThroughputChart

// ============================================================


        function createIndexScanThroughputChart(requests, grouping) {
            const canvas = document.getElementById("index-scan-throughput-chart");
            if (!canvas) return;

            const ctx = canvas.getContext("2d");

            // Destroy existing chart if it exists
            if (window.indexScanThroughputChart) {
                window.indexScanThroughputChart.destroy();
            }

            // Group requests by time and collect throughput data (records/ms) for Index Scan operations
            const timeGroups = {};

            requests.forEach((request) => {
                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);
                const key = timeKey.toISOString();

                if (!timeGroups[key]) {
                    timeGroups[key] = {
                        timestamp: timeKey,
                        scanThroughputs: [],   // records/ms
                        scanItemCounts: [],    // item counts for average
                    };
                }

                // Extract servTime and item counts from plan operators
                if (request.plan) {
                    try {
                        const plan = typeof request.plan === 'string' ? JSON.parse(request.plan) : request.plan;
                        
                        // Recursive function to find Index Scan operators
                        const extractOperatorThroughput = (node) => {
                            if (!node) return;
                            
                            const operator = node['#operator'] || node.operator;
                            const stats = node['#stats'] || node.stats || {};
                            const servTime = stats.servTime;
                            const itemsIn = stats['#itemsIn'] || stats.itemsIn || 0;
                            
                            // Check for Index Scan operators - use itemsIn / servTime
                            if ((operator && (operator.includes('Scan') || operator.includes('scan'))) && servTime) {
                                const servTimeMs = parseTime(servTime);
                                if (!isNaN(servTimeMs) && servTimeMs > 0 && itemsIn > 0) {
                                    const throughput = itemsIn / servTimeMs; // records per ms
                                    timeGroups[key].scanThroughputs.push(throughput);
                                    timeGroups[key].scanItemCounts.push(itemsIn); // Track item count
                                }
                            }
                            
                            // Recursively search child nodes
                            if (node['~child']) extractOperatorThroughput(node['~child']);
                            if (node['~children']) {
                                node['~children'].forEach(child => extractOperatorThroughput(child));
                            }
                        };
                        
                        extractOperatorThroughput(plan);
                    } catch (e) {
                        // Skip parsing errors
                    }
                }
            });

            // Get all timeline buckets to ensure charts share same x-axis (Issue #148)
            const buckets = getTimelineBucketsFromRequests(requests, grouping);
            
            // Calculate percentiles and averages for each time bucket
            const sortedData = buckets.map(ts => {
                const key = ts.toISOString();
                const group = timeGroups[key] || { scanThroughputs: [], scanItemCounts: [], timestamp: ts };
                
                // Sort arrays for percentile calculation
                const scanSorted = [...group.scanThroughputs].sort((a, b) => a - b);
                
                // Calculate percentiles (90th = top 10%, 50th = median, 10th = bottom 10%)
                const getPercentile = (arr, percentile) => {
                    if (arr.length === 0) return null;
                    const index = Math.ceil((percentile / 100) * arr.length) - 1;
                    return arr[Math.max(0, index)];
                };
                
                // Calculate average item count
                const avgItemCount = group.scanItemCounts.length > 0
                    ? group.scanItemCounts.reduce((sum, val) => sum + val, 0) / group.scanItemCounts.length
                    : null;
                
                return {
                    timestamp: ts,
                    // Index Scan percentiles (throughput in records/ms)
                    scanP90: getPercentile(scanSorted, 90),
                    scanP50: getPercentile(scanSorted, 50),
                    scanP10: getPercentile(scanSorted, 10),
                    scanCount: scanSorted.length,
                    avgItemCount: avgItemCount,
                };
            });

            if (sortedData.length === 0) {
                Logger.debug("No index scan throughput data found for chart");
                return;
            }

            // Prepare chart data
            const labels = sortedData.map((item) => item.timestamp);

            window.indexScanThroughputChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [
                        // Index Scan throughput datasets (orange/yellow shades) - itemsIn/servTime
                        {
                            label: "Scan Throughput - top 10%",
                            data: sortedData.map((item) => item.scanP90),
                            borderColor: "rgba(255, 140, 0, 1)", // Dark orange
                            backgroundColor: "rgba(255, 140, 0, 0.1)",
                            borderWidth: 3,
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            yAxisID: 'y',
                            hidden: true,
                        },
                        {
                            label: "Scan Throughput - middle",
                            data: sortedData.map((item) => item.scanP50),
                            borderColor: "rgba(255, 193, 7, 1)", // Medium orange/yellow
                            backgroundColor: "rgba(255, 193, 7, 0.1)",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                            pointRadius: 3,
                            pointHoverRadius: 5,
                            yAxisID: 'y',
                        },
                        {
                            label: "Scan Throughput - bottom 10%",
                            data: sortedData.map((item) => item.scanP10),
                            borderColor: "rgba(204, 102, 0, 1)", // Dark orange
                            backgroundColor: "rgba(204, 102, 0, 0.1)",
                            borderWidth: 2,
                            borderDash: [5, 5],
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                            pointRadius: 2,
                            pointHoverRadius: 4,
                            yAxisID: 'y',
                            hidden: true,
                        },
                        // Average records scanned per query (2nd y-axis)
                        {
                            label: "Avg Records Scanned per Query",
                            data: sortedData.map((item) => item.avgItemCount),
                            borderColor: "rgba(0, 128, 0, 1)", // Dark Green
                            backgroundColor: "rgba(0, 128, 0, 0.1)",
                            borderWidth: 2,
                            borderDash: [20, 3, 3, 3, 3, 3, 3, 3],
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                            pointRadius: 3,
                            pointHoverRadius: 5,
                            pointStyle: 'rect',
                            yAxisID: 'y1', // Second y-axis
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: "Index Scan Throughput (records/ms) & Avg Records Scanned per Query",
                            font: {
size: 12
                            }
                        },
                        legend: {
                            display: true,
                            position: 'top',
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const label = context.dataset.label || '';
                                    const value = context.parsed.y;
                                    if (label.includes('Avg Records Scanned')) {
                                        return `Avg / Query: ${Math.round(value).toLocaleString()} records`;
                                    }
                                    if (label.includes('top 10%')) {
                                        return `top 10%: ${Math.round(value).toLocaleString()}/ms`;
                                    }
                                    if (label.includes('middle')) {
                                        return `middle: ${Math.round(value).toLocaleString()}/ms`;
                                    }
                                    if (label.includes('bottom 10%')) {
                                        return `bottom 10%: ${Math.round(value).toLocaleString()}/ms`;
                                    }
                                    return value !== null ? `${label}: ${Math.round(value).toLocaleString()}/ms` : label;
                                },
                                afterBody: function (tooltipItems) {
                                    const dataIndex = tooltipItems[0].dataIndex;
                                    const data = sortedData[dataIndex];
                                    return [`Queries: ${data.scanCount.toLocaleString()}`];
                                }
                            }
                        },
                        zoom: {
                            limits: {
                                x: { min: "original", max: "original" },
                                y: { min: "original", max: "original" },
                            },
                            pan: {
                                enabled: true,
                                mode: "xy",
                                onPan: function ({ chart }) {
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                },
                            },
                            zoom: {
                                wheel: {
                                    enabled: false,
                                },
                                pinch: {
                                    enabled: true,
                                },
                                drag: {
                                    enabled: true,
                                    backgroundColor: "rgba(100,100,100,0.4)",
                                    borderColor: "rgba(50,50,50,0.8)",
                                    borderWidth: 2,
                                },
                                mode: "xy",
                                onZoom: function ({ chart }) {
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            type: "time",
                            time: getCurrentTimeConfig(requests),
                            title: {
                                display: true,
                                text: "Request Time",
                            },
                        },
                        y: {
                            type: "linear",
                            position: "left",
                            title: {
                                display: true,
                                text: "Throughput (records/ms)",
                            },
                            beginAtZero: true,
                        },
                        y1: {
                            type: "linear",
                            position: "right",
                            title: {
                                display: true,
                                text: "Avg Records Scanned per Query",
                            },
                            beginAtZero: true,
                            grid: {
                                drawOnChartArea: false,
                            },
                        },
                    },
                    interaction: {
                        mode: "index",
                        intersect: false,
                    },
                },
                plugins: [
                    verticalLinePlugin,
                    {
                        id: 'indexScanThresholdLine',
                        afterDatasetsDraw(chart) {
                            const { ctx, chartArea: { left, right }, scales: { y } } = chart;
                            
                            if (!y) return;
                            
                            // Draw threshold line at 50 records/ms
                            const yPosition = y.getPixelForValue(50);
                            
                            // Only draw if the line is within the chart area
                            if (yPosition < chart.chartArea.top || yPosition > chart.chartArea.bottom) {
                                return;
                            }
                            
                            ctx.save();
                            ctx.beginPath();
                            ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
                            ctx.lineWidth = 2;
                            ctx.setLineDash([5, 5]);
                            ctx.moveTo(left, yPosition);
                            ctx.lineTo(right, yPosition);
                            ctx.stroke();
                            ctx.setLineDash([]);
                            
                            // Add label
                            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                            ctx.font = 'bold 11px Arial';
                            ctx.textAlign = 'right';
                            ctx.fillText('50/ms threshold', right - 5, yPosition - 5);
                            
                            ctx.restore();
                        }
                    }
                ]
            });

            // Register chart for crosshair synchronization
            registerTimelineChart(window.indexScanThroughputChart, ctx);
        }



// ============================================================

// CHART: createDocFetchThroughputChart

// ============================================================


        function createDocFetchThroughputChart(requests, grouping) {
            const canvas = document.getElementById("doc-fetch-throughput-chart");
            if (!canvas) return;

            const ctx = canvas.getContext("2d");

            // Destroy existing chart if it exists
            if (window.docFetchThroughputChart) {
                window.docFetchThroughputChart.destroy();
            }

            // Group requests by time and collect throughput data (records/ms) for Doc Fetch operations
            const timeGroups = {};

            requests.forEach((request) => {
                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);
                const key = timeKey.toISOString();

                if (!timeGroups[key]) {
                    timeGroups[key] = {
                        timestamp: timeKey,
                        fetchThroughputs: [],   // records/ms
                        fetchItemCounts: [],    // item counts for average
                    };
                }

                // Extract servTime and item counts from plan operators
                if (request.plan) {
                    try {
                        const plan = typeof request.plan === 'string' ? JSON.parse(request.plan) : request.plan;
                        
                        // Recursive function to find Fetch operators
                        const extractOperatorThroughput = (node) => {
                            if (!node) return;
                            
                            const operator = node['#operator'] || node.operator;
                            const stats = node['#stats'] || node.stats || {};
                            const servTime = stats.servTime;
                            const itemsOut = stats['#itemsOut'] || stats.itemsOut || 0;
                            
                            // Check for Fetch operator - use itemsOut / servTime
                            if (operator === 'Fetch' && servTime) {
                                const servTimeMs = parseTime(servTime);
                                if (!isNaN(servTimeMs) && servTimeMs > 0 && itemsOut > 0) {
                                    const throughput = itemsOut / servTimeMs; // records per ms
                                    timeGroups[key].fetchThroughputs.push(throughput);
                                    timeGroups[key].fetchItemCounts.push(itemsOut); // Track item count
                                }
                            }
                            
                            // Recursively search child nodes
                            if (node['~child']) extractOperatorThroughput(node['~child']);
                            if (node['~children']) {
                                node['~children'].forEach(child => extractOperatorThroughput(child));
                            }
                        };
                        
                        extractOperatorThroughput(plan);
                    } catch (e) {
                        // Skip parsing errors
                    }
                }
            });

            // Get all timeline buckets to ensure charts share same x-axis (Issue #148)
            const buckets = getTimelineBucketsFromRequests(requests, grouping);
            
            // Calculate percentiles and averages for each time bucket
            const sortedData = buckets.map(ts => {
                const key = ts.toISOString();
                const group = timeGroups[key] || { fetchThroughputs: [], fetchItemCounts: [], timestamp: ts };
                
                // Sort arrays for percentile calculation
                const fetchSorted = [...group.fetchThroughputs].sort((a, b) => a - b);
                
                // Calculate percentiles (90th = top 10%, 50th = median, 10th = bottom 10%)
                const getPercentile = (arr, percentile) => {
                    if (arr.length === 0) return null;
                    const index = Math.ceil((percentile / 100) * arr.length) - 1;
                    return arr[Math.max(0, index)];
                };
                
                // Calculate average item count
                const avgItemCount = group.fetchItemCounts.length > 0
                    ? group.fetchItemCounts.reduce((sum, val) => sum + val, 0) / group.fetchItemCounts.length
                    : null;
                
                return {
                    timestamp: ts,
                    // Doc Fetch percentiles (throughput in records/ms)
                    fetchP90: getPercentile(fetchSorted, 90),
                    fetchP50: getPercentile(fetchSorted, 50),
                    fetchP10: getPercentile(fetchSorted, 10),
                    fetchCount: fetchSorted.length,
                    avgItemCount: avgItemCount,
                };
            });

            if (sortedData.length === 0) {
                Logger.debug("No doc fetch throughput data found for chart");
                return;
            }

            // Prepare chart data
            const labels = sortedData.map((item) => item.timestamp);

            window.docFetchThroughputChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [
                        // Doc Fetch throughput datasets (purple shades) - itemsOut/servTime
                        {
                            label: "Fetch Throughput - top 10%",
                            data: sortedData.map((item) => item.fetchP90),
                            borderColor: "rgba(128, 0, 128, 1)", // Dark purple
                            backgroundColor: "rgba(128, 0, 128, 0.1)",
                            borderWidth: 3,
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            yAxisID: 'y',
                            hidden: true,
                        },
                        {
                            label: "Fetch Throughput - middle",
                            data: sortedData.map((item) => item.fetchP50),
                            borderColor: "rgba(153, 102, 255, 1)", // Medium purple
                            backgroundColor: "rgba(153, 102, 255, 0.1)",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                            pointRadius: 3,
                            pointHoverRadius: 5,
                            yAxisID: 'y',
                        },
                        {
                            label: "Fetch Throughput - bottom 10%",
                            data: sortedData.map((item) => item.fetchP10),
                            borderColor: "rgba(102, 51, 153, 1)", // Medium-dark purple
                            backgroundColor: "rgba(102, 51, 153, 0.1)",
                            borderWidth: 2,
                            borderDash: [5, 5],
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                            pointRadius: 2,
                            pointHoverRadius: 4,
                            yAxisID: 'y',
                            hidden: true,
                        },
                        // Average documents fetched per query (2nd y-axis)
                        {
                            label: "Avg Docs Fetched per Query",
                            data: sortedData.map((item) => item.avgItemCount),
                            borderColor: "rgba(0, 128, 0, 1)", // Dark Green
                            backgroundColor: "rgba(0, 128, 0, 0.1)",
                            borderWidth: 2,
                            borderDash: [20, 3, 3, 3, 3, 3, 3, 3],
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                            pointRadius: 3,
                            pointHoverRadius: 5,
                            pointStyle: 'rect',
                            yAxisID: 'y1', // Second y-axis
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: "Doc Fetch Throughput (records/ms) & Avg Docs Fetched per Query",
                            font: {
size: 12
                            }
                        },
                        legend: {
                            display: true,
                            position: 'top',
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const label = context.dataset.label || '';
                                    const value = context.parsed.y;
                                    if (label.includes('Avg Docs Fetched')) {
                                        return `Avg / Query: ${Math.round(value).toLocaleString()} docs`;
                                    }
                                    if (label.includes('top 10%')) {
                                        return `top 10%: ${Math.round(value).toLocaleString()}/ms`;
                                    }
                                    if (label.includes('middle')) {
                                        return `middle: ${Math.round(value).toLocaleString()}/ms`;
                                    }
                                    if (label.includes('bottom 10%')) {
                                        return `bottom 10%: ${Math.round(value).toLocaleString()}/ms`;
                                    }
                                    return value !== null ? `${label}: ${Math.round(value).toLocaleString()}/ms` : label;
                                },
                                afterBody: function (tooltipItems) {
                                    const dataIndex = tooltipItems[0].dataIndex;
                                    const data = sortedData[dataIndex];
                                    return [`Queries: ${data.fetchCount.toLocaleString()}`];
                                }
                            }
                        },
                        zoom: {
                            limits: {
                                x: { min: "original", max: "original" },
                                y: { min: "original", max: "original" },
                            },
                            pan: {
                                enabled: true,
                                mode: "xy",
                                onPan: function ({ chart }) {
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                },
                            },
                            zoom: {
                                wheel: {
                                    enabled: false,
                                },
                                pinch: {
                                    enabled: true,
                                },
                                drag: {
                                    enabled: true,
                                    backgroundColor: "rgba(100,100,100,0.4)",
                                    borderColor: "rgba(50,50,50,0.8)",
                                    borderWidth: 2,
                                },
                                mode: "xy",
                                onZoom: function ({ chart }) {
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            type: "time",
                            time: getCurrentTimeConfig(requests),
                            title: {
                                display: true,
                                text: "Request Time",
                            },
                        },
                        y: {
                            type: "linear",
                            position: "left",
                            title: {
                                display: true,
                                text: "Throughput (records/ms)",
                            },
                            beginAtZero: true,
                        },
                        y1: {
                            type: "linear",
                            position: "right",
                            title: {
                                display: true,
                                text: "Avg Docs Fetched per Query",
                            },
                            beginAtZero: true,
                            grid: {
                                drawOnChartArea: false,
                            },
                        },
                    },
                    interaction: {
                        mode: "index",
                        intersect: false,
                    },
                },
                plugins: [
                    verticalLinePlugin,
                    {
                        id: 'docFetchThresholdLine',
                        afterDatasetsDraw(chart) {
                            const { ctx, chartArea: { left, right }, scales: { y } } = chart;
                            
                            if (!y) return;
                            
                            // Draw threshold line at 5 records/ms
                            const yPosition = y.getPixelForValue(5);
                            
                            // Only draw if the line is within the chart area
                            if (yPosition < chart.chartArea.top || yPosition > chart.chartArea.bottom) {
                                return;
                            }
                            
                            ctx.save();
                            ctx.beginPath();
                            ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
                            ctx.lineWidth = 2;
                            ctx.setLineDash([5, 5]);
                            ctx.moveTo(left, yPosition);
                            ctx.lineTo(right, yPosition);
                            ctx.stroke();
                            ctx.setLineDash([]);
                            
                            // Add label
                            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                            ctx.font = 'bold 11px Arial';
                            ctx.textAlign = 'right';
                            ctx.fillText('5/ms threshold', right - 5, yPosition - 5);
                            
                            ctx.restore();
                        }
                    }
                ]
            });

            // Register chart for crosshair synchronization
            registerTimelineChart(window.docFetchThroughputChart, ctx);
        }



// ============================================================

// CHART: createECharts3DServiceTime

// ============================================================


        function createECharts3DServiceTime(requests, grouping) {
            if (!requests || requests.length === 0) {
                Logger.debug(TEXT_CONSTANTS.NO_DATA_AVAILABLE || "No data available");
                return;
            }

            Logger.info("Creating 3D Service Time data...");

            // Get all timeline buckets for consistent x-axis
            const timeBuckets = getTimelineBucketsFromRequests(requests, grouping);
            
            // Initialize data structures
            const collectionData = {}; // collection -> timeKey -> metrics

            // Process each request
            requests.forEach((request) => {
                const sql = request.statement || request.preparedText || "";
                const collections = extractCollectionsFromSQL(sql);
                
                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);
                const key = timeKey.toISOString();

                // Extract elapsed and kernel time
                const elapsedTimeMs = parseTime(request.elapsedTime) || 0;
                const kernTimeMs = calculateTotalKernTime(request.plan) || 0;
                
                // Initialize auth/index/fetch service times
                let authServTimeMs = 0;
                let indexServTimeMs = 0;
                let fetchServTimeMs = 0;

                // Extract service times from operators
                if (request.plan) {
                    try {
                        const planObj = typeof request.plan === "string" ? JSON.parse(request.plan) : request.plan;
                        const operators = getOperators(planObj);

                        operators.forEach((operator) => {
                            const operatorType = operator["#operator"];
                            const stats = operator["#stats"] || {};
                            const servTime = parseTime(stats.servTime) || 0;

                            if (servTime > 0) {
                                switch (operatorType) {
                                    case "Authorize":
                                        authServTimeMs += servTime;
                                        break;
                                    case "IndexScan3":
                                        indexServTimeMs += servTime;
                                        break;
                                    case "Fetch":
                                        fetchServTimeMs += servTime;
                                        break;
                                }
                            }
                        });
                    } catch (e) {
                        Logger.debug("Error parsing plan for service time 3D:", e);
                    }
                }

                collections.forEach(collection => {
                    if (!collectionData[collection]) {
                        collectionData[collection] = {};
                    }
                    if (!collectionData[collection][key]) {
                        collectionData[collection][key] = {
                            elapsedSum: 0,
                            kernSum: 0,
                            authSum: 0,
                            indexSum: 0,
                            fetchSum: 0,
                            count: 0
                        };
                    }
                    
                    collectionData[collection][key].elapsedSum += elapsedTimeMs;
                    collectionData[collection][key].kernSum += kernTimeMs;
                    collectionData[collection][key].authSum += authServTimeMs;
                    collectionData[collection][key].indexSum += indexServTimeMs;
                    collectionData[collection][key].fetchSum += fetchServTimeMs;
                    collectionData[collection][key].count++;
                });
            });

            // Sort collections by total query count
            const collectionCounts = {};
            Object.keys(collectionData).forEach(collection => {
                collectionCounts[collection] = Object.values(collectionData[collection])
                    .reduce((sum, bucket) => sum + bucket.count, 0);
            });

            const sortedCollections = Object.keys(collectionData).sort((a, b) => {
                return collectionCounts[b] - collectionCounts[a];
            });

            // Prepare series data for each metric (5 ribbons)
            const metricsConfig = [
                { name: "Avg Elapsed Time", key: "elapsedSum", color: "rgba(75, 192, 192, 0.8)" },
                { name: "Avg Kernel Time", key: "kernSum", color: "rgba(255, 0, 0, 0.8)" },
                { name: "Authorize ServTime", key: "authSum", color: "rgba(54, 162, 235, 0.8)" },
                { name: "IndexScan ServTime", key: "indexSum", color: "rgba(255, 206, 86, 0.8)" },
                { name: "Fetch ServTime", key: "fetchSum", color: "rgba(153, 102, 255, 0.8)" }
            ];

            const seriesData = metricsConfig.map(metric => {
                const lineData = [];
                
                sortedCollections.forEach((collection, collIdx) => {
                    timeBuckets.forEach((timestamp) => {
                        const key = timestamp.toISOString();
                        const bucket = collectionData[collection][key];
                        
                        if (bucket && bucket.count > 0) {
                            const avgValue = bucket[metric.key] / bucket.count;
                            lineData.push({
                                value: [timestamp.getTime(), collIdx, avgValue],
                                collection: collection,
                                time: timestamp.toISOString().substring(0, 19).replace('T', ' '),
                                actualValue: avgValue,
                                count: bucket.count
                            });
                        }
                    });
                });

                return {
                    name: metric.name,
                    data: lineData,
                    color: metric.color
                };
            });

            // Store data globally
            window.echartsServiceTimeData = {
                collections: sortedCollections,
                timeBuckets: timeBuckets,
                seriesData: seriesData,
                collectionCounts: collectionCounts
            };

            Logger.info(`✅ 3D Service Time data created: ${sortedCollections.length} collections, ${timeBuckets.length} time buckets`);
        }



// ============================================================

// CHART: createDocumentSizeBubbleChart

// ============================================================


        function createDocumentSizeBubbleChart(requests, grouping) {
            const canvas = document.getElementById("doc-size-bubble-chart");
            if (!canvas) return;

            const ctx = canvas.getContext("2d");

            if (window.docSizeBubbleChart) {
                window.docSizeBubbleChart.destroy();
            }

            // Store requests and grouping for checkbox toggle
            window.docSizeBubbleChartData = { requests, grouping };

            const sizeRanges = [
                { label: "0 bytes", min: 0, max: 0, color: "rgba(128, 128, 128, 0.7)" },                   // Gray
                { label: "1-10 bytes", min: 1, max: 10, color: "rgba(255, 0, 255, 0.7)" },                // Magenta
                { label: "10-100 bytes", min: 10, max: 100, color: "rgba(128, 0, 255, 0.7)" },            // Purple
                { label: "100-1K bytes", min: 100, max: 1000, color: "rgba(0, 0, 200, 0.7)" },            // Dark Blue
                { label: "1K-10K bytes", min: 1000, max: 10000, color: "rgba(0, 200, 255, 0.7)" },        // Cyan
                { label: "10K-100K bytes", min: 10000, max: 100000, color: "rgba(0, 180, 0, 0.7)" },      // Green
                { label: "100K-1MB", min: 100000, max: 1000000, color: "rgba(150, 200, 0, 0.7)" },        // Yellow-Green
                { label: "1MB-5MB", min: 1000000, max: 5000000, color: "rgba(255, 220, 0, 0.7)" },        // Bright Yellow
                { label: "5MB-10MB", min: 5000000, max: 10000000, color: "rgba(255, 150, 0, 0.7)" },      // Orange
                { label: "10MB-15MB", min: 10000000, max: 15000000, color: "rgba(255, 80, 0, 0.7)" },     // Red-Orange
                { label: "15MB-20MB", min: 15000000, max: 20000000, color: "rgba(220, 0, 0, 0.7)" },      // Red
            ];

            const timeGroups = {};

            requests.forEach((request) => {
                const resultCount = request.resultCount || 0;
                const resultSize = request.resultSize || 0;

                if (resultCount === 0 || resultSize === 0) return;

                const avgDocSize = resultSize / resultCount;

                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);
                const key = timeKey.toISOString();

                if (!timeGroups[key]) {
                    timeGroups[key] = {
                        timestamp: timeKey,
                        sizeRangeCounts: {},
                    };
                    sizeRanges.forEach(range => {
                        timeGroups[key].sizeRangeCounts[range.label] = 0;
                    });
                }

                for (const range of sizeRanges) {
                    if (avgDocSize >= range.min && avgDocSize < range.max) {
                        timeGroups[key].sizeRangeCounts[range.label]++;
                        break;
                    }
                    if (range.max === Infinity && avgDocSize >= range.min) {
                        timeGroups[key].sizeRangeCounts[range.label]++;
                        break;
                    }
                }
            });

            // Get all timeline buckets to ensure charts share same x-axis (Issue #148)
            const buckets = getTimelineBucketsFromRequests(requests, grouping);
            
            // Map data to all buckets (use default values for missing data points)
            const sortedTimeGroups = buckets.map(ts => {
                const key = ts.toISOString();
                const group = timeGroups[key];
                if (group) {
                    return group;
                } else {
                    const emptyGroup = {
                        timestamp: ts,
                        sizeRangeCounts: {},
                    };
                    sizeRanges.forEach(range => {
                        emptyGroup.sizeRangeCounts[range.label] = 0;
                    });
                    return emptyGroup;
                }
            });

            if (sortedTimeGroups.length === 0) {
                Logger.debug("No document size data for bubble chart");
                return;
            }

            // Function to calculate bubble radius using logarithmic scale
            const calculateBubbleRadius = (count) => {
                if (count === 0) return 0;
                // Logarithmic scale: log10(count + 1) * 8
                return Math.log10(count + 1) * 8;
            };

            const datasets = sizeRanges.map(range => {
                const data = sortedTimeGroups.map(group => ({
                    x: group.timestamp,
                    y: group.sizeRangeCounts[range.label],
                    r: calculateBubbleRadius(group.sizeRangeCounts[range.label]),
                }));
                
                // Calculate total count for this size range
                const totalCount = data.reduce((sum, point) => sum + point.y, 0);
                
                return {
                    label: `${range.label} (${totalCount} total)`,
                    data: data,
                    backgroundColor: range.color,
                    borderColor: range.color.replace('0.6', '1'),
                    borderWidth: 1,
                };
            });

            window.docSizeBubbleChart = new Chart(ctx, {
                type: "bubble",
                data: { datasets },
                plugins: [verticalLinePlugin],
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: "Query's Avg Returned Document Size (Bubble Size = Query Count)",
                            font: { size: 12 },
                        },
                        legend: {
                            display: true,
                            position: "top",
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const label = context.dataset.label || "";
                                    const count = context.parsed.y;
                                    return `${label}: ${count} queries`;
                                }
                            }
                        },
                        zoom: {
                            limits: {
                                x: { min: "original", max: "original" },
                                y: { min: "original", max: "original" },
                            },
                            pan: {
                                enabled: true,
                                mode: "xy",
                                onPan: function ({ chart }) {
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                },
                            },
                            zoom: {
                                wheel: { enabled: false },
                                pinch: { enabled: true },
                                drag: {
                                    enabled: true,
                                    backgroundColor: "rgba(100,100,100,0.4)",
                                    borderColor: "rgba(50,50,50,0.8)",
                                    borderWidth: 2,
                                },
                                mode: "xy",
                                onZoom: function ({ chart }) {
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            type: "time",
                            time: getCurrentTimeConfig(requests),
                            title: {
                                display: true,
                                text: "Request Time",
                            },
                        },
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: "Query Count",
                            },
                        },
                    },
                },
            });

            // Register chart for crosshair synchronization
            registerTimelineChart(window.docSizeBubbleChart, ctx);

            // Setup 3D button click handler
            const btn3D = document.getElementById('open-3d-avg-doc-size-chart-btn');
            if (btn3D) {
                // Show button only if we have data
                btn3D.style.display = (requests && requests.length > 0) ? 'block' : 'none';
                
                // Remove old event listeners (prevents duplicate handlers)
                const newBtn = btn3D.cloneNode(true);
                btn3D.parentNode.replaceChild(newBtn, btn3D);
                
                // Add click handler
                newBtn.addEventListener('click', function() {
                    // Always regenerate 3D data to respect current filters
                    createECharts3DAvgDocSize(requests, grouping);
                    // Open fullscreen modal
                    expandECharts3DAvgDocSize();
                });
            }
        }



// ============================================================

// CHART: createExecVsKernelChart

// ============================================================


        function createExecVsKernelChart(requests, grouping) {
            const canvas = document.getElementById("exec-vs-kernel-chart");
            if (!canvas) return;

            const ctx = canvas.getContext("2d");

            // Destroy existing chart if it exists
            if (window.execVsKernelChart) {
                window.execVsKernelChart.destroy();
            }

            // Group requests by time
            const timeGroups = {};

            requests.forEach((request) => {
                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);
                const key = timeKey.toISOString();

                if (!timeGroups[key]) {
                    timeGroups[key] = {
                        timestamp: timeKey,
                        authorizeData: [],
                        parseData: [],
                        planData: [],
                        indexScanData: [],
                        fetchData: [],
                        filterData: [],
                        streamData: [],
                        kernTimeData: [],
                        elapsedTimeData: [],
                        queryCount: 0,
                    };
                }

                timeGroups[key].queryCount++;

                // Extract data from phaseTimes and plan operators
                if (request.phaseTimes) {
                    const parseTimeMs = parseTime(request.phaseTimes.parse) || 0;
                    const planTimeMs = parseTime(request.phaseTimes.plan) || 0;
                    timeGroups[key].parseData.push(parseTimeMs);
                    timeGroups[key].planData.push(planTimeMs);
                }

                // Extract kernel time from plan
                const kernTimeMs = calculateTotalKernTime(request.plan) || 0;
                timeGroups[key].kernTimeData.push(kernTimeMs);

                // Extract elapsed time for ratio calculation
                const elapsedTimeMs = parseTime(request.elapsedTime) || 0;
                timeGroups[key].elapsedTimeData.push(elapsedTimeMs);

                // Extract operator-specific data from plan
                if (request.plan) {
                    try {
                        const planObj = typeof request.plan === "string" ? JSON.parse(request.plan) : request.plan;
                        const operators = getOperators(planObj);

                        operators.forEach((operator) => {
                            const operatorType = operator["#operator"];
                            const stats = operator["#stats"] || {};
                            const execTime = parseTime(stats.execTime) || 0;

                            switch (operatorType) {
                                case "Authorize":
                                    timeGroups[key].authorizeData.push({ execTime });
                                    break;
                                case "IndexScan3":
                                    timeGroups[key].indexScanData.push({ execTime });
                                    break;
                                case "Fetch":
                                    timeGroups[key].fetchData.push({ execTime });
                                    break;
                                case "Filter":
                                    timeGroups[key].filterData.push({ execTime });
                                    break;
                                case "Stream":
                                    timeGroups[key].streamData.push({ execTime });
                                    break;
                            }
                        });
                    } catch (e) {
                        console.warn("Error parsing plan for exec analysis:", e);
                    }
                }
            });

            // Convert to sorted array and calculate percentages vs kernel time
            const sortedData = Object.values(timeGroups)
                .sort((a, b) => a.timestamp - b.timestamp)
                .map(item => ({
                    ...item,
                    avgAuthorizeExecTime: item.authorizeData.length > 0 ? 
                        item.authorizeData.reduce((sum, d) => sum + d.execTime, 0) / item.authorizeData.length : 0,
                    avgParseTime: item.parseData.length > 0 ? 
                        item.parseData.reduce((sum, d) => sum + d, 0) / item.parseData.length : 0,
                    avgPlanTime: item.planData.length > 0 ? 
                        item.planData.reduce((sum, d) => sum + d, 0) / item.planData.length : 0,
                    avgIndexScanExecTime: item.indexScanData.length > 0 ? 
                        item.indexScanData.reduce((sum, d) => sum + d.execTime, 0) / item.indexScanData.length : 0,
                    avgFetchExecTime: item.fetchData.length > 0 ? 
                        item.fetchData.reduce((sum, d) => sum + d.execTime, 0) / item.fetchData.length : 0,
                    avgFilterExecTime: item.filterData.length > 0 ? 
                        item.filterData.reduce((sum, d) => sum + d.execTime, 0) / item.filterData.length : 0,
                    avgStreamExecTime: item.streamData.length > 0 ? 
                        item.streamData.reduce((sum, d) => sum + d.execTime, 0) / item.streamData.length : 0,
                    avgKernTime: item.kernTimeData.length > 0 ? 
                        item.kernTimeData.reduce((sum, d) => sum + d, 0) / item.kernTimeData.length : 0,
                }));

            const authorizeVsKernPercentData = sortedData.map((item) => {
                if (item.authorizeData.length === 0 || item.kernTimeData.length === 0) return 0;
                const avgAuthorizeExecTime = item.authorizeData.reduce((sum, d) => sum + d.execTime, 0) / item.authorizeData.length;
                const avgKernTime = item.kernTimeData.reduce((sum, d) => sum + d, 0) / item.kernTimeData.length;
                return avgKernTime > 0 ? (avgAuthorizeExecTime / avgKernTime) * 100 : 0;
            });

            const parseVsKernPercentData = sortedData.map((item) => {
                if (item.parseData.length === 0 || item.kernTimeData.length === 0) return 0;
                const avgParseTime = item.parseData.reduce((sum, d) => sum + d, 0) / item.parseData.length;
                const avgKernTime = item.kernTimeData.reduce((sum, d) => sum + d, 0) / item.kernTimeData.length;
                return avgKernTime > 0 ? (avgParseTime / avgKernTime) * 100 : 0;
            });

            const planVsKernPercentData = sortedData.map((item) => {
                if (item.planData.length === 0 || item.kernTimeData.length === 0) return 0;
                const avgPlanTime = item.planData.reduce((sum, d) => sum + d, 0) / item.planData.length;
                const avgKernTime = item.kernTimeData.reduce((sum, d) => sum + d, 0) / item.kernTimeData.length;
                return avgKernTime > 0 ? (avgPlanTime / avgKernTime) * 100 : 0;
            });

            const indexScanVsKernPercentData = sortedData.map((item) => {
                if (item.indexScanData.length === 0 || item.kernTimeData.length === 0) return 0;
                const avgIndexScanExecTime = item.indexScanData.reduce((sum, d) => sum + d.execTime, 0) / item.indexScanData.length;
                const avgKernTime = item.kernTimeData.reduce((sum, d) => sum + d, 0) / item.kernTimeData.length;
                return avgKernTime > 0 ? (avgIndexScanExecTime / avgKernTime) * 100 : 0;
            });

            const fetchVsKernPercentData = sortedData.map((item) => {
                if (item.fetchData.length === 0 || item.kernTimeData.length === 0) return 0;
                const avgFetchExecTime = item.fetchData.reduce((sum, d) => sum + d.execTime, 0) / item.fetchData.length;
                const avgKernTime = item.kernTimeData.reduce((sum, d) => sum + d, 0) / item.kernTimeData.length;
                return avgKernTime > 0 ? (avgFetchExecTime / avgKernTime) * 100 : 0;
            });

            const filterVsKernPercentData = sortedData.map((item) => {
                if (item.filterData.length === 0 || item.kernTimeData.length === 0) return 0;
                const avgFilterExecTime = item.filterData.reduce((sum, d) => sum + d.execTime, 0) / item.filterData.length;
                const avgKernTime = item.kernTimeData.reduce((sum, d) => sum + d, 0) / item.kernTimeData.length;
                return avgKernTime > 0 ? (avgFilterExecTime / avgKernTime) * 100 : 0;
            });

            const streamVsKernPercentData = sortedData.map((item) => {
                if (item.streamData.length === 0 || item.kernTimeData.length === 0) return 0;
                const avgStreamExecTime = item.streamData.reduce((sum, d) => sum + d.execTime, 0) / item.streamData.length;
                const avgKernTime = item.kernTimeData.reduce((sum, d) => sum + d, 0) / item.kernTimeData.length;
                return avgKernTime > 0 ? (avgStreamExecTime / avgKernTime) * 100 : 0;
            });

            // Calculate KernTime vs ElapsedTime percentage for new red dotted line
            const kernVsElapsedPercentData = sortedData.map((item) => {
                const avgKernTime = item.kernTimeData.length > 0 ? 
                    item.kernTimeData.reduce((sum, d) => sum + d, 0) / item.kernTimeData.length : 0;
                const avgElapsedTime = item.elapsedTimeData.length > 0 ? 
                    item.elapsedTimeData.reduce((sum, d) => sum + d, 0) / item.elapsedTimeData.length : 0;
                return avgElapsedTime > 0 ? (avgKernTime / avgElapsedTime) * 100 : 0;
            });

            const labels = sortedData.map((item) => item.timestamp);

            window.execVsKernelChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: "Authorize: ExecTime vs Kernel Time (%)",
                            data: authorizeVsKernPercentData,
                            backgroundColor: "rgba(54, 162, 235, 0.8)", // Blue (matches ServTime chart)
                            borderColor: "rgba(54, 162, 235, 1)",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                        },
                        {
                            label: "Parse vs Kernel Time (%)",
                            data: parseVsKernPercentData,
                            backgroundColor: "rgba(255, 99, 132, 0.8)", // Red
                            borderColor: "rgba(255, 99, 132, 1)",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                        },
                        {
                            label: "Plan vs Kernel Time (%)",
                            data: planVsKernPercentData,
                            backgroundColor: "rgba(75, 192, 192, 0.8)", // Teal
                            borderColor: "rgba(75, 192, 192, 1)",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                        },
                        {
                            label: "IndexScan: ExecTime vs Kernel Time (%)",
                            data: indexScanVsKernPercentData,
                            backgroundColor: "rgba(255, 206, 86, 0.8)", // Yellow (matches ServTime chart)
                            borderColor: "rgba(255, 206, 86, 1)",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                        },
                        {
                            label: "Fetch: ExecTime vs Kernel Time (%)",
                            data: fetchVsKernPercentData,
                            backgroundColor: "rgba(153, 102, 255, 0.8)", // Purple (matches ServTime chart)
                            borderColor: "rgba(153, 102, 255, 1)",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                        },
                        {
                            label: "Filter vs Kernel Time (%)",
                            data: filterVsKernPercentData,
                            backgroundColor: "rgba(255, 159, 64, 0.8)", // Orange
                            borderColor: "rgba(255, 159, 64, 1)",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                        },
                        {
                            label: "Stream vs Kernel Time (%)",
                            data: streamVsKernPercentData,
                            backgroundColor: "rgba(201, 203, 207, 0.8)", // Gray
                            borderColor: "rgba(201, 203, 207, 1)",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                        },
                        {
                            label: "Kernel vs Elapsed Time (%)",
                            data: kernVsElapsedPercentData,
                            backgroundColor: "rgba(255, 0, 0, 0.8)", // Bright Red
                            borderColor: "rgba(255, 0, 0, 1)",
                            borderWidth: 3,
                            borderDash: [20, 3, 3, 3, 3, 3, 3, 3], // Custom dash pattern
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                            pointRadius: 0, // No points
                            pointHoverRadius: 0, // No hover points
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: "ExecTime vs Highest Kernel Time (%) By Query Steps",
                            font: {
size: 12
                            }
                        },
                        legend: {
                            display: true,
                            position: "top",
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed.y;
                                    if (value === null || value === undefined) return null;
                                    // Extract just the operator name from various label formats
                                    let operatorName = context.dataset.label;
                                    if (operatorName.includes(':')) {
                                        operatorName = operatorName.split(':')[0];
                                    } else if (operatorName.includes(' vs ')) {
                                        operatorName = operatorName.split(' vs ')[0];
                                    }
                                    return `  ${operatorName}: ${value.toFixed(2)}%`;
                                },
                                afterBody: function(tooltipItems) {
                                    const dataIndex = tooltipItems[0].dataIndex;
                                    const data = sortedData[dataIndex];
                                    const avgElapsedTime = data.elapsedTimeData.length > 0 ? 
                                        data.elapsedTimeData.reduce((sum, d) => sum + d, 0) / data.elapsedTimeData.length : 0;
                                    const kernElapsedRatio = avgElapsedTime > 0 ? (data.avgKernTime / avgElapsedTime) * 100 : 0;
                                    return [
                                        '',
                                        `Kernel vs Elapsed: ${kernElapsedRatio.toFixed(1)}%`,
                                        `Queries: ${data.queryCount}`,
                                        `Kernel Time: ${data.avgKernTime.toFixed(1)}ms`
                                    ];
                                }
                            }
                        },
                        zoom: {
                            limits: {
                                x: { min: "original", max: "original" },
                                y: { min: "original", max: "original" },
                            },
                            pan: {
                                enabled: true,
                                mode: "xy",
                                onPan: function ({ chart }) {
                                    // Update current time range
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    // Sync pan with other charts
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                },
                            },
                            zoom: {
                                wheel: {
                                    enabled: false,
                                },
                                pinch: {
                                    enabled: true,
                                },
                                drag: {
                                    enabled: true,
                                    backgroundColor: "rgba(100,100,100,0.4)",
                                    borderColor: "rgba(50,50,50,0.8)",
                                    borderWidth: 2,
                                },
                                mode: "xy",
                                onZoom: function ({ chart }) {
                                    // Update current time range
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    // Sync zoom with other charts
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            type: "time",
                            time: getCurrentTimeConfig(requests),
                            title: {
                                display: true,
                                text: "Request Time",
                            },
                        },
                        y: {
                            type: "linear",
                            position: "left",
                            title: { display: true, text: "Percentage (%)" },
                            beginAtZero: true,
                            suggestedMin: 0,
                            suggestedMax: 100,
                        },
                    },
                    interaction: {
                        mode: "index",
                        intersect: false,
                    },
                },
                plugins: [verticalLinePlugin]
            });

            registerTimelineChart(window.execVsKernelChart, ctx);
        }



// ============================================================

// CHART: createExecVsServChart

// ============================================================


        function createExecVsServChart(requests, grouping) {
            const canvas = document.getElementById("exec-vs-serv-chart");
            if (!canvas) return;

            const ctx = canvas.getContext("2d");

            // Destroy existing chart if it exists
            if (window.execVsServChart) {
                window.execVsServChart.destroy();
            }

            // Group requests by time
            const timeGroups = {};

            requests.forEach((request) => {
                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);
                const key = timeKey.toISOString();

                if (!timeGroups[key]) {
                    timeGroups[key] = {
                        timestamp: timeKey,
                        authorizeData: [],
                        indexScanData: [],
                        fetchData: [],
                        kernTimeData: [],
                        elapsedTimeData: [],
                        queryCount: 0,
                    };
                }

                timeGroups[key].queryCount++;

                // Extract kernel and elapsed time for ratio calculation
                const kernTimeMs = calculateTotalKernTime(request.plan) || 0;
                const elapsedTimeMs = parseTime(request.elapsedTime) || 0;
                timeGroups[key].kernTimeData.push(kernTimeMs);
                timeGroups[key].elapsedTimeData.push(elapsedTimeMs);

                // Extract operator-specific data from plan
                if (request.plan) {
                    try {
                        const planObj = typeof request.plan === "string" ? JSON.parse(request.plan) : request.plan;
                        const operators = getOperators(planObj);

                        operators.forEach((operator) => {
                            const operatorType = operator["#operator"];
                            const stats = operator["#stats"] || {};
                            const execTime = parseTime(stats.execTime) || 0;
                            const servTime = parseTime(stats.servTime) || 0;

                            switch (operatorType) {
                                case "Authorize":
                                    timeGroups[key].authorizeData.push({ execTime, servTime });
                                    break;
                                case "IndexScan3":
                                    timeGroups[key].indexScanData.push({ execTime, servTime });
                                    break;
                                case "Fetch":
                                    timeGroups[key].fetchData.push({ execTime, servTime });
                                    break;
                            }
                        });
                    } catch (e) {
                        console.warn("Error parsing plan for exec vs serv analysis:", e);
                    }
                }
            });

            // Convert to sorted array and calculate percentages vs servTime
            const sortedData = Object.values(timeGroups)
                .sort((a, b) => a.timestamp - b.timestamp)
                .map(item => ({
                    ...item,
                    avgAuthorizeExecTime: item.authorizeData.length > 0 ? 
                        item.authorizeData.reduce((sum, d) => sum + d.execTime, 0) / item.authorizeData.length : 0,
                    avgAuthorizeServTime: item.authorizeData.length > 0 ? 
                        item.authorizeData.reduce((sum, d) => sum + d.servTime, 0) / item.authorizeData.length : 0,
                    avgIndexScanExecTime: item.indexScanData.length > 0 ? 
                        item.indexScanData.reduce((sum, d) => sum + d.execTime, 0) / item.indexScanData.length : 0,
                    avgIndexScanServTime: item.indexScanData.length > 0 ? 
                        item.indexScanData.reduce((sum, d) => sum + d.servTime, 0) / item.indexScanData.length : 0,
                    avgFetchExecTime: item.fetchData.length > 0 ? 
                        item.fetchData.reduce((sum, d) => sum + d.execTime, 0) / item.fetchData.length : 0,
                    avgFetchServTime: item.fetchData.length > 0 ? 
                        item.fetchData.reduce((sum, d) => sum + d.servTime, 0) / item.fetchData.length : 0,
                }));

            const authorizePercentData = sortedData.map((item) => {
                if (item.authorizeData.length === 0) return 0;
                const avgExecTime = item.authorizeData.reduce((sum, d) => sum + d.execTime, 0) / item.authorizeData.length;
                const avgServTime = item.authorizeData.reduce((sum, d) => sum + d.servTime, 0) / item.authorizeData.length;
                return avgServTime > 0 ? (avgExecTime / avgServTime) * 100 : 0;
            });

            const indexScanPercentData = sortedData.map((item) => {
                if (item.indexScanData.length === 0) return 0;
                const avgExecTime = item.indexScanData.reduce((sum, d) => sum + d.execTime, 0) / item.indexScanData.length;
                const avgServTime = item.indexScanData.reduce((sum, d) => sum + d.servTime, 0) / item.indexScanData.length;
                return avgServTime > 0 ? (avgExecTime / avgServTime) * 100 : 0;
            });

            const fetchPercentData = sortedData.map((item) => {
                if (item.fetchData.length === 0) return 0;
                const avgExecTime = item.fetchData.reduce((sum, d) => sum + d.execTime, 0) / item.fetchData.length;
                const avgServTime = item.fetchData.reduce((sum, d) => sum + d.servTime, 0) / item.fetchData.length;
                return avgServTime > 0 ? (avgExecTime / avgServTime) * 100 : 0;
            });

            // Calculate KernTime vs ElapsedTime percentage for new red dotted line
            const kernVsElapsedPercentData = sortedData.map((item) => {
                const avgKernTime = item.kernTimeData.length > 0 ? 
                    item.kernTimeData.reduce((sum, d) => sum + d, 0) / item.kernTimeData.length : 0;
                const avgElapsedTime = item.elapsedTimeData.length > 0 ? 
                    item.elapsedTimeData.reduce((sum, d) => sum + d, 0) / item.elapsedTimeData.length : 0;
                return avgElapsedTime > 0 ? (avgKernTime / avgElapsedTime) * 100 : 0;
            });

            const labels = sortedData.map((item) => item.timestamp);

            window.execVsServChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [
                    {
                    label: "Authorize: ExecTime vs ServTime (%)",
                    data: authorizePercentData,
                    backgroundColor: "rgba(54, 162, 235, 0.8)", // Blue
                    borderColor: "rgba(54, 162, 235, 1)",
                    borderWidth: 2,
                    fill: false,
                    spanGaps: false,
                    tension: 0.3,
                        yAxisID: 'y',
                        hidden: true
                    },
                    {
                    label: "IndexScan: ExecTime vs ServTime (%)",
                    data: indexScanPercentData,
                    backgroundColor: "rgba(255, 206, 86, 0.8)", // Yellow
                    borderColor: "rgba(255, 206, 86, 1)",
                    borderWidth: 2,
                    fill: false,
                    spanGaps: false,
                        tension: 0.3,
                        yAxisID: 'y',
                        hidden: true
                    },
                    {
                    label: "Fetch: ExecTime vs ServTime (%)",
                    data: fetchPercentData,
                    backgroundColor: "rgba(153, 102, 255, 0.8)", // Purple
                    borderColor: "rgba(153, 102, 255, 1)",
                    borderWidth: 2,
                        fill: false,
                        spanGaps: false,
                            tension: 0.3,
                            yAxisID: 'y',
                            hidden: true
                        },
                        {
                            label: "Authorize: Avg ServTime (ms)",
                            data: sortedData.map(item => item.avgAuthorizeServTime),
                            backgroundColor: "rgba(54, 162, 235, 0.8)", // Blue
                            borderColor: "rgba(54, 162, 235, 1)",
                            borderWidth: 2,
                            borderDash: [5, 5],
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                            yAxisID: 'y1'
                        },
                        {
                            label: "IndexScan: Avg ServTime (ms)",
                            data: sortedData.map(item => item.avgIndexScanServTime),
                            backgroundColor: "rgba(255, 206, 86, 0.8)", // Yellow
                            borderColor: "rgba(255, 206, 86, 1)",
                            borderWidth: 2,
                            borderDash: [5, 5],
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                            yAxisID: 'y1'
                        },
                        {
                            label: "Fetch: Avg ServTime (ms)",
                            data: sortedData.map(item => item.avgFetchServTime),
                            backgroundColor: "rgba(153, 102, 255, 0.8)", // Purple
                            borderColor: "rgba(153, 102, 255, 1)",
                            borderWidth: 2,
                            borderDash: [5, 5],
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                            yAxisID: 'y1'
                        },
                        {
                            label: "Kernel vs Elapsed Time (%)",
                            data: kernVsElapsedPercentData,
                            backgroundColor: "rgba(255, 0, 0, 0.8)", // Bright Red
                            borderColor: "rgba(255, 0, 0, 1)",
                            borderWidth: 3,
                            borderDash: [20, 3, 3, 3, 3, 3, 3, 3], // Custom dash pattern
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                            pointRadius: 0, // No points
                            pointHoverRadius: 0, // No hover points
                            yAxisID: 'y'
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: "ExecTime vs ServTime (%) by Services in Query Execution",
                            font: {
size: 12
                            }
                        },
                        legend: {
                            display: true,
                            position: "top",
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                const value = context.parsed.y;
                                if (value === null || value === undefined) return null;
                                    
                                    // Only show labels for percentage datasets, skip service time datasets
                                if (context.dataset.label.includes('Avg ServTime')) return null;
                                
                                const dataIndex = context.dataIndex;
                                const data = sortedData[dataIndex];
                                
                                // Extract just the operator name from various label formats
                                let operatorName = context.dataset.label;
                                if (operatorName.includes(':')) {
                                    operatorName = operatorName.split(':')[0];
                                } else if (operatorName.includes(' vs ')) {
                                operatorName = operatorName.split(' vs ')[0];
                                }
                                
                                    // Get the corresponding service time for this operator
                                    let servTime = 0;
                                    if (operatorName === 'Authorize') {
                                    servTime = data.avgAuthorizeServTime;
                                    } else if (operatorName === 'IndexScan') {
                                    servTime = data.avgIndexScanServTime;
                                    } else if (operatorName === 'Fetch') {
                                    servTime = data.avgFetchServTime;
                                    }
                                    
                                    return `  ${operatorName}: ${Math.round(value)}% | ${Math.round(servTime)}ms`;
                                    },
                                    afterBody: function(tooltipItems) {
                                    const dataIndex = tooltipItems[0].dataIndex;
                                    const data = sortedData[dataIndex];
                                    const avgKernTime = data.kernTimeData.length > 0 ? 
                                    data.kernTimeData.reduce((sum, d) => sum + d, 0) / data.kernTimeData.length : 0;
                                    const avgElapsedTime = data.elapsedTimeData.length > 0 ? 
                                    data.elapsedTimeData.reduce((sum, d) => sum + d, 0) / data.elapsedTimeData.length : 0;
                                    const kernElapsedRatio = avgElapsedTime > 0 ? (avgKernTime / avgElapsedTime) * 100 : 0;
                                    return [
                                    '',
                                    `Kernel vs Elapsed: ${Math.round(kernElapsedRatio)}%`,
                                    `Queries: ${data.queryCount}`
                                    ];
                                }
                            }
                        },
                        zoom: {
                            limits: {
                                x: { min: "original", max: "original" },
                                y: { min: "original", max: "original" },
                            },
                            pan: {
                                enabled: true,
                                mode: "xy",
                                onPan: function ({ chart }) {
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                },
                            },
                            zoom: {
                                wheel: { enabled: false },
                                pinch: { enabled: true },
                                drag: {
                                    enabled: true,
                                    backgroundColor: "rgba(100,100,100,0.4)",
                                    borderColor: "rgba(50,50,50,0.8)",
                                    borderWidth: 2,
                                },
                                mode: "xy",
                                onZoom: function ({ chart }) {
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                },
                            },
                        },
                    },
                    scales: {
                    x: {
                    type: "time",
                    time: getCurrentTimeConfig(requests),
                    title: { display: true, text: "Request Time" },
                    },
                    y: {
                    type: "linear",
                    position: "left",
                    title: { display: true, text: "Percentage (%)" },
                    beginAtZero: true,
                    suggestedMin: 0,
                    suggestedMax: 100,
                    },
                        y1: {
                             type: "linear",
                             position: "right",
                             title: { display: true, text: "Avg ServTime (ms)" },
                             beginAtZero: true,
                             grid: {
                                 drawOnChartArea: false,
                             },
                         },
                     },
                    interaction: { mode: "index", intersect: false },
                },
                plugins: [verticalLinePlugin]
            });

            registerTimelineChart(window.execVsServChart, ctx);
        }



// ============================================================

// CHART: createServiceTimeAnalysisLineChart

// ============================================================


        function createServiceTimeAnalysisLineChart(requests, grouping) {
            const canvas = document.getElementById("service-time-analysis-chart");
            if (!canvas) return;

            const ctx = canvas.getContext("2d");

            // Destroy existing chart if it exists
            if (window.serviceTimeAnalysisLineChart) {
                window.serviceTimeAnalysisLineChart.destroy();
            }

            // Group requests by time
            const timeGroups = {};

            requests.forEach((request) => {
                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);
                const key = timeKey.toISOString();

                if (!timeGroups[key]) {
                    timeGroups[key] = {
                        timestamp: timeKey,
                        elapsedTimeSum: 0,
                        kernTimeSum: 0,
                        authServTimeSum: 0,
                        authServTimeCount: 0,
                        indexServTimeSum: 0,
                        indexServTimeCount: 0,
                        fetchServTimeSum: 0,
                        fetchServTimeCount: 0,
                        queryCount: 0,
                    };
                }

                timeGroups[key].queryCount++;

                // Extract elapsed and kernel time
                const elapsedTimeMs = parseTime(request.elapsedTime) || 0;
                const kernTimeMs = calculateTotalKernTime(request.plan) || 0;
                timeGroups[key].elapsedTimeSum += elapsedTimeMs;
                timeGroups[key].kernTimeSum += kernTimeMs;

                // Extract service times from operators
                if (request.plan) {
                    try {
                        const planObj = typeof request.plan === "string" ? JSON.parse(request.plan) : request.plan;
                        const operators = getOperators(planObj);

                        operators.forEach((operator) => {
                            const operatorType = operator["#operator"];
                            const stats = operator["#stats"] || {};
                            const servTime = parseTime(stats.servTime) || 0;

                            if (servTime > 0) {
                                switch (operatorType) {
                                    case "Authorize":
                                        timeGroups[key].authServTimeSum += servTime;
                                        timeGroups[key].authServTimeCount++;
                                        break;
                                    case "IndexScan3":
                                        timeGroups[key].indexServTimeSum += servTime;
                                        timeGroups[key].indexServTimeCount++;
                                        break;
                                    case "Fetch":
                                        timeGroups[key].fetchServTimeSum += servTime;
                                        timeGroups[key].fetchServTimeCount++;
                                        break;
                                }
                            }
                        });
                    } catch (e) {
                        console.warn("Error parsing plan for service time analysis:", e);
                    }
                }
            });

            // Convert to sorted array and calculate averages per query
            const sortedData = Object.values(timeGroups)
                .sort((a, b) => a.timestamp - b.timestamp)
                .map(item => ({
                    timestamp: item.timestamp,
                    avgElapsedTime: item.queryCount > 0 ? item.elapsedTimeSum / item.queryCount : null,
                    avgKernTime: item.queryCount > 0 ? item.kernTimeSum / item.queryCount : null,
                    avgAuthServTime: item.queryCount > 0 ? item.authServTimeSum / item.queryCount : null,
                    avgIndexServTime: item.queryCount > 0 ? item.indexServTimeSum / item.queryCount : null,
                    avgFetchServTime: item.queryCount > 0 ? item.fetchServTimeSum / item.queryCount : null,
                }));

            const labels = sortedData.map((item) => item.timestamp);
            const elapsedTimeData = sortedData.map((item) => item.avgElapsedTime);
            const kernTimeData = sortedData.map((item) => item.avgKernTime);
            const authServTimeData = sortedData.map((item) => item.avgAuthServTime);
            const indexServTimeData = sortedData.map((item) => item.avgIndexServTime);
            const fetchServTimeData = sortedData.map((item) => item.avgFetchServTime);

            window.serviceTimeAnalysisLineChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: "Avg Elapsed Time (ms)",
                            data: elapsedTimeData,
                            backgroundColor: "rgba(75, 192, 192, 0.2)", // Teal with low opacity for fill
                            borderColor: "rgba(75, 192, 192, 1)",
                            borderWidth: 2,
                            fill: true,
                            spanGaps: false,
                            tension: 0.3,
                        },
                        {
                            label: "Avg Kernel Time (ms)",
                            data: kernTimeData,
                            backgroundColor: "rgba(255, 0, 0, 0.8)", // Bright Red
                            borderColor: "rgba(255, 0, 0, 1)",
                            borderWidth: 3,
                            borderDash: [20, 3, 3, 3, 3, 3, 3, 3], // Same dotted pattern
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                            pointRadius: 0,
                            pointHoverRadius: 0,
                        },
                        {
                            label: "Authorize: Avg ServTime (ms)",
                            data: authServTimeData,
                            backgroundColor: "rgba(54, 162, 235, 0.8)", // Blue
                            borderColor: "rgba(54, 162, 235, 1)",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                        },
                        {
                            label: "IndexScan: Avg ServTime (ms)",
                            data: indexServTimeData,
                            backgroundColor: "rgba(255, 206, 86, 0.8)", // Yellow/Orange
                            borderColor: "rgba(255, 206, 86, 1)",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                        },
                        {
                            label: "Fetch: Avg ServTime (ms)",
                            data: fetchServTimeData,
                            backgroundColor: "rgba(153, 102, 255, 0.8)", // Purple
                            borderColor: "rgba(153, 102, 255, 1)",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: "Service Time Analysis: ElapsedTime, KernTime & Service Times",
                            font: {
                                size: 12
                            }
                        },
                        legend: {
                            display: true,
                            position: "top",
                        },
                        tooltip: {
                            mode: "index",
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed.y;
                                    if (value === null || value === undefined) return null;
                                    
                                    // Shorten labels
                                    let label = context.dataset.label;
                                    if (label.includes("Elapsed")) label = "Elapsed (ms)";
                                    else if (label.includes("Kernel")) label = "Kernel (ms)";
                                    else if (label.includes("Authorize")) label = "Authorize (ms)";
                                    else if (label.includes("IndexScan")) label = "Index (ms)";
                                    else if (label.includes("Fetch")) label = "Fetch (ms)";
                                    
                                    // Format with thousand separators (whole numbers only)
                                    const formattedValue = Math.round(value).toLocaleString('en-US');
                                    return `  ${label}: ${formattedValue}`;
                                }
                            }
                        },
                        zoom: {
                            limits: {
                                x: { min: "original", max: "original" },
                                y: { min: "original", max: "original" },
                            },
                            pan: {
                                enabled: true,
                                mode: "xy",
                                onPan: function ({ chart }) {
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                },
                            },
                            zoom: {
                                wheel: { enabled: false },
                                pinch: { enabled: true },
                                drag: {
                                    enabled: true,
                                    backgroundColor: "rgba(100,100,100,0.4)",
                                    borderColor: "rgba(50,50,50,0.8)",
                                    borderWidth: 2,
                                },
                                mode: "xy",
                                onZoom: function ({ chart }) {
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            type: "time",
                            time: getCurrentTimeConfig(requests),
                            title: { display: true, text: "Request Time" },
                        },
                        y: {
                            type: "linear",
                            position: "left",
                            title: { display: true, text: "Time (ms)" },
                            beginAtZero: true,
                        },
                    },
                    interaction: { mode: "index", intersect: false },
                },
                plugins: [verticalLinePlugin]
            });

            registerTimelineChart(window.serviceTimeAnalysisLineChart, ctx);

            // Setup 3D button click handler (Issue #217) - Only show with ?dev=true
            const urlParams = new URLSearchParams(window.location.search);
            const devMode = urlParams.get('dev') === 'true';
            
            if (devMode) {
                const btn3D = document.getElementById('open-3d-service-time-btn');
                if (btn3D) {
                    // Show button only if we have data
                    btn3D.style.display = (requests && requests.length > 0) ? 'block' : 'none';
                    
                    // Remove old event listeners (prevents duplicate handlers)
                    const newBtn = btn3D.cloneNode(true);
                    btn3D.parentNode.replaceChild(newBtn, btn3D);
                    
                    // Add click handler
                    newBtn.addEventListener('click', function() {
                        // Always regenerate 3D data to respect current filters
                        createECharts3DServiceTime(requests, grouping);
                        // Open fullscreen modal
                        expandECharts3DServiceTime();
                    });
                }
            }
        }



// ============================================================

// CHART: createExecVsElapsedChart

// ============================================================


        function createExecVsElapsedChart(requests, grouping) {
            const canvas = document.getElementById("exec-vs-elapsed-chart");
            if (!canvas) return;

            const ctx = canvas.getContext("2d");

            // Destroy existing chart if it exists
            if (window.execVsElapsedChart) {
                window.execVsElapsedChart.destroy();
            }

            // Group requests by time
            const timeGroups = {};

            requests.forEach((request) => {
                const requestDate = getChartDate(request.requestTime);
                const timeKey = roundTimestamp(requestDate, grouping, requests);
                const key = timeKey.toISOString();

                if (!timeGroups[key]) {
                    timeGroups[key] = {
                        timestamp: timeKey,
                        authorizeData: [],
                        parseData: [],
                        planData: [],
                        indexScanData: [],
                        fetchData: [],
                        filterData: [],
                        streamData: [],
                        kernTimeData: [],
                        elapsedTimeData: [],
                        queryCount: 0,
                    };
                }

                timeGroups[key].queryCount++;

                // Extract data from phaseTimes
                if (request.phaseTimes) {
                    const parseTimeMs = parseTime(request.phaseTimes.parse) || 0;
                    const planTimeMs = parseTime(request.phaseTimes.plan) || 0;
                    timeGroups[key].parseData.push(parseTimeMs);
                    timeGroups[key].planData.push(planTimeMs);
                }

                // Extract kernel and elapsed time
                const kernTimeMs = calculateTotalKernTime(request.plan) || 0;
                const elapsedTimeMs = parseTime(request.elapsedTime) || 0;
                timeGroups[key].kernTimeData.push(kernTimeMs);
                timeGroups[key].elapsedTimeData.push(elapsedTimeMs);

                // Extract operator-specific data from plan
                if (request.plan) {
                    try {
                        const planObj = typeof request.plan === "string" ? JSON.parse(request.plan) : request.plan;
                        const operators = getOperators(planObj);

                        operators.forEach((operator) => {
                            const operatorType = operator["#operator"];
                            const stats = operator["#stats"] || {};
                            const execTime = parseTime(stats.execTime) || 0;

                            switch (operatorType) {
                                case "Authorize":
                                    timeGroups[key].authorizeData.push({ execTime });
                                    break;
                                case "IndexScan3":
                                    timeGroups[key].indexScanData.push({ execTime });
                                    break;
                                case "Fetch":
                                    timeGroups[key].fetchData.push({ execTime });
                                    break;
                                case "Filter":
                                    timeGroups[key].filterData.push({ execTime });
                                    break;
                                case "Stream":
                                    timeGroups[key].streamData.push({ execTime });
                                    break;
                            }
                        });
                    } catch (e) {
                        console.warn("Error parsing plan for exec vs elapsed analysis:", e);
                    }
                }
            });

            // Convert to sorted array and calculate percentages vs elapsed time
            const sortedData = Object.values(timeGroups)
                .sort((a, b) => a.timestamp - b.timestamp)
                .map(item => ({
                    ...item,
                    avgAuthorizeExecTime: item.authorizeData.length > 0 ? 
                        item.authorizeData.reduce((sum, d) => sum + d.execTime, 0) / item.authorizeData.length : 0,
                    avgParseTime: item.parseData.length > 0 ? 
                        item.parseData.reduce((sum, d) => sum + d, 0) / item.parseData.length : 0,
                    avgPlanTime: item.planData.length > 0 ? 
                        item.planData.reduce((sum, d) => sum + d, 0) / item.planData.length : 0,
                    avgIndexScanExecTime: item.indexScanData.length > 0 ? 
                        item.indexScanData.reduce((sum, d) => sum + d.execTime, 0) / item.indexScanData.length : 0,
                    avgFetchExecTime: item.fetchData.length > 0 ? 
                        item.fetchData.reduce((sum, d) => sum + d.execTime, 0) / item.fetchData.length : 0,
                    avgFilterExecTime: item.filterData.length > 0 ? 
                        item.filterData.reduce((sum, d) => sum + d.execTime, 0) / item.filterData.length : 0,
                    avgStreamExecTime: item.streamData.length > 0 ? 
                        item.streamData.reduce((sum, d) => sum + d.execTime, 0) / item.streamData.length : 0,
                    avgElapsedTime: item.elapsedTimeData.length > 0 ? 
                        item.elapsedTimeData.reduce((sum, d) => sum + d, 0) / item.elapsedTimeData.length : 0,
                }));

            const authorizeVsElapsedPercentData = sortedData.map((item) => {
                if (item.authorizeData.length === 0 || item.elapsedTimeData.length === 0) return 0;
                const avgAuthorizeExecTime = item.authorizeData.reduce((sum, d) => sum + d.execTime, 0) / item.authorizeData.length;
                const avgElapsedTime = item.elapsedTimeData.reduce((sum, d) => sum + d, 0) / item.elapsedTimeData.length;
                return avgElapsedTime > 0 ? (avgAuthorizeExecTime / avgElapsedTime) * 100 : 0;
            });

            const parseVsElapsedPercentData = sortedData.map((item) => {
                if (item.parseData.length === 0 || item.elapsedTimeData.length === 0) return 0;
                const avgParseTime = item.parseData.reduce((sum, d) => sum + d, 0) / item.parseData.length;
                const avgElapsedTime = item.elapsedTimeData.reduce((sum, d) => sum + d, 0) / item.elapsedTimeData.length;
                return avgElapsedTime > 0 ? (avgParseTime / avgElapsedTime) * 100 : 0;
            });

            const planVsElapsedPercentData = sortedData.map((item) => {
                if (item.planData.length === 0 || item.elapsedTimeData.length === 0) return 0;
                const avgPlanTime = item.planData.reduce((sum, d) => sum + d, 0) / item.planData.length;
                const avgElapsedTime = item.elapsedTimeData.reduce((sum, d) => sum + d, 0) / item.elapsedTimeData.length;
                return avgElapsedTime > 0 ? (avgPlanTime / avgElapsedTime) * 100 : 0;
            });

            const indexScanVsElapsedPercentData = sortedData.map((item) => {
                if (item.indexScanData.length === 0 || item.elapsedTimeData.length === 0) return 0;
                const avgIndexScanExecTime = item.indexScanData.reduce((sum, d) => sum + d.execTime, 0) / item.indexScanData.length;
                const avgElapsedTime = item.elapsedTimeData.reduce((sum, d) => sum + d, 0) / item.elapsedTimeData.length;
                return avgElapsedTime > 0 ? (avgIndexScanExecTime / avgElapsedTime) * 100 : 0;
            });

            const fetchVsElapsedPercentData = sortedData.map((item) => {
                if (item.fetchData.length === 0 || item.elapsedTimeData.length === 0) return 0;
                const avgFetchExecTime = item.fetchData.reduce((sum, d) => sum + d.execTime, 0) / item.fetchData.length;
                const avgElapsedTime = item.elapsedTimeData.reduce((sum, d) => sum + d, 0) / item.elapsedTimeData.length;
                return avgElapsedTime > 0 ? (avgFetchExecTime / avgElapsedTime) * 100 : 0;
            });

            const filterVsElapsedPercentData = sortedData.map((item) => {
                if (item.filterData.length === 0 || item.elapsedTimeData.length === 0) return 0;
                const avgFilterExecTime = item.filterData.reduce((sum, d) => sum + d.execTime, 0) / item.filterData.length;
                const avgElapsedTime = item.elapsedTimeData.reduce((sum, d) => sum + d, 0) / item.elapsedTimeData.length;
                return avgElapsedTime > 0 ? (avgFilterExecTime / avgElapsedTime) * 100 : 0;
            });

            const streamVsElapsedPercentData = sortedData.map((item) => {
                if (item.streamData.length === 0 || item.elapsedTimeData.length === 0) return 0;
                const avgStreamExecTime = item.streamData.reduce((sum, d) => sum + d.execTime, 0) / item.streamData.length;
                const avgElapsedTime = item.elapsedTimeData.reduce((sum, d) => sum + d, 0) / item.elapsedTimeData.length;
                return avgElapsedTime > 0 ? (avgStreamExecTime / avgElapsedTime) * 100 : 0;
            });

            // Calculate KernTime vs ElapsedTime percentage for new red dotted line
            const kernVsElapsedPercentData = sortedData.map((item) => {
                const avgKernTime = item.kernTimeData.length > 0 ? 
                    item.kernTimeData.reduce((sum, d) => sum + d, 0) / item.kernTimeData.length : 0;
                const avgElapsedTime = item.elapsedTimeData.length > 0 ? 
                    item.elapsedTimeData.reduce((sum, d) => sum + d, 0) / item.elapsedTimeData.length : 0;
                return avgElapsedTime > 0 ? (avgKernTime / avgElapsedTime) * 100 : 0;
            });

            const labels = sortedData.map((item) => item.timestamp);

            window.execVsElapsedChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: "Authorize: ExecTime vs Elapsed Time (%)",
                            data: authorizeVsElapsedPercentData,
                            backgroundColor: "rgba(54, 162, 235, 0.8)", // Blue (matches others)
                            borderColor: "rgba(54, 162, 235, 1)",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                        },
                        {
                            label: "Parse vs Elapsed Time (%)",
                            data: parseVsElapsedPercentData,
                            backgroundColor: "rgba(255, 99, 132, 0.8)", // Red
                            borderColor: "rgba(255, 99, 132, 1)",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                        },
                        {
                            label: "Plan vs Elapsed Time (%)",
                            data: planVsElapsedPercentData,
                            backgroundColor: "rgba(75, 192, 192, 0.8)", // Teal
                            borderColor: "rgba(75, 192, 192, 1)",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                        },
                        {
                            label: "IndexScan: ExecTime vs Elapsed Time (%)",
                            data: indexScanVsElapsedPercentData,
                            backgroundColor: "rgba(255, 206, 86, 0.8)", // Yellow (matches others)
                            borderColor: "rgba(255, 206, 86, 1)",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                        },
                        {
                            label: "Fetch: ExecTime vs Elapsed Time (%)",
                            data: fetchVsElapsedPercentData,
                            backgroundColor: "rgba(153, 102, 255, 0.8)", // Purple (matches others)
                            borderColor: "rgba(153, 102, 255, 1)",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                        },
                        {
                            label: "Filter vs Elapsed Time (%)",
                            data: filterVsElapsedPercentData,
                            backgroundColor: "rgba(255, 159, 64, 0.8)", // Orange
                            borderColor: "rgba(255, 159, 64, 1)",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                        },
                        {
                            label: "Stream vs Elapsed Time (%)",
                            data: streamVsElapsedPercentData,
                            backgroundColor: "rgba(201, 203, 207, 0.8)", // Gray
                            borderColor: "rgba(201, 203, 207, 1)",
                            borderWidth: 2,
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                        },
                        {
                            label: "Kernel vs Elapsed Time (%)",
                            data: kernVsElapsedPercentData,
                            backgroundColor: "rgba(255, 0, 0, 0.8)", // Bright Red
                            borderColor: "rgba(255, 0, 0, 1)",
                            borderWidth: 3,
                            borderDash: [20, 3, 3, 3, 3, 3, 3, 3], // Custom dash pattern
                            fill: false,
                            spanGaps: false,
                            tension: 0.3,
                            pointRadius: 0, // No points
                            pointHoverRadius: 0, // No hover points
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: "ExecTime vs Elapsed Time (%) By Query Steps",
                            font: {
size: 12
                            }
                        },
                        legend: {
                            display: true,
                            position: "top",
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed.y;
                                    if (value === null || value === undefined) return null;
                                    // Extract just the operator name from various label formats
                                    let operatorName = context.dataset.label;
                                    if (operatorName.includes(':')) {
                                        operatorName = operatorName.split(':')[0];
                                    } else if (operatorName.includes(' vs ')) {
                                        operatorName = operatorName.split(' vs ')[0];
                                    }
                                    return `  ${operatorName}: ${value.toFixed(2)}%`;
                                },
                                afterBody: function(tooltipItems) {
                                    const dataIndex = tooltipItems[0].dataIndex;
                                    const data = sortedData[dataIndex];
                                    const avgKernTime = data.kernTimeData.length > 0 ? 
                                        data.kernTimeData.reduce((sum, d) => sum + d, 0) / data.kernTimeData.length : 0;
                                    const kernElapsedRatio = data.avgElapsedTime > 0 ? (avgKernTime / data.avgElapsedTime) * 100 : 0;
                                    return [
                                        '',
                                        `Kernel vs Elapsed: ${kernElapsedRatio.toFixed(1)}%`,
                                        `Queries: ${data.queryCount}`,
                                        `Elapsed Time: ${data.avgElapsedTime.toFixed(1)}ms`
                                    ];
                                }
                            }
                        },
                        zoom: {
                            limits: {
                                x: { min: "original", max: "original" },
                                y: { min: "original", max: "original" },
                            },
                            pan: {
                                enabled: true,
                                mode: "xy",
                                onPan: function ({ chart }) {
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                },
                            },
                            zoom: {
                                wheel: { enabled: false },
                                pinch: { enabled: true },
                                drag: {
                                    enabled: true,
                                    backgroundColor: "rgba(100,100,100,0.4)",
                                    borderColor: "rgba(50,50,50,0.8)",
                                    borderWidth: 2,
                                },
                                mode: "xy",
                                onZoom: function ({ chart }) {
                                    currentTimeRange.min = new Date(chart.scales.x.min);
                                    currentTimeRange.max = new Date(chart.scales.x.max);
                                    updateTimeRangeDisplay();
                                    syncChartZoomThrottled(chart, chart.scales.x.min, chart.scales.x.max);
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            type: "time",
                            time: getCurrentTimeConfig(requests),
                            title: { display: true, text: "Request Time" },
                        },
                        y: {
                            type: "linear",
                            position: "left",
                            title: { display: true, text: "Percentage (%)" },
                            beginAtZero: true,
                            suggestedMin: 0,
                            suggestedMax: 100,
                        },
                    },
                    interaction: { mode: "index", intersect: false },
                },
                plugins: [verticalLinePlugin]
            });

            registerTimelineChart(window.execVsElapsedChart, ctx);
        }


// ============================================================
// EXPORTS - Chart Generation Functions
// ============================================================

export {
    generateDashboardCharts,
    generatePrimaryScanChart,
    generateStateChart,
    generateStatementTypeChart,
    generateScanConsistencyChart,
    generateElapsedTimeChart,
    generateQueryPatternChart,
    generateECharts3DBar,
    generateEnhancedOperationsChart,
    generateFilterChart,
    generateTimelineChart,
    createQueryTypesChart,
    createDurationBucketsChart,
    createMemoryChart,
    createCollectionQueriesChart,
    createECharts3DCollectionTimeline,
    createECharts3DQueryTypes,
    createParseDurationChart,
    createPlanDurationChart,
    createResultCountChart,
    createResultSizeChart,
    createECharts3DAvgDocSize,
    createCpuTimeChart,
    createIndexScanThroughputChart,
    createDocFetchThroughputChart,
    createECharts3DServiceTime,
    createDocumentSizeBubbleChart,
    createExecVsKernelChart,
    createExecVsServChart,
    createServiceTimeAnalysisLineChart,
    createExecVsElapsedChart
};

// Expose globally for backward compatibility
window.generateDashboardCharts = generateDashboardCharts;
window.generatePrimaryScanChart = generatePrimaryScanChart;
window.generateStateChart = generateStateChart;
window.generateStatementTypeChart = generateStatementTypeChart;
window.generateScanConsistencyChart = generateScanConsistencyChart;
window.generateElapsedTimeChart = generateElapsedTimeChart;
window.generateQueryPatternChart = generateQueryPatternChart;
window.generateECharts3DBar = generateECharts3DBar;
window.generateEnhancedOperationsChart = generateEnhancedOperationsChart;
window.generateFilterChart = generateFilterChart;
window.generateTimelineChart = generateTimelineChart;
window.createQueryTypesChart = createQueryTypesChart;
window.createDurationBucketsChart = createDurationBucketsChart;
window.createMemoryChart = createMemoryChart;
window.createCollectionQueriesChart = createCollectionQueriesChart;
window.createECharts3DCollectionTimeline = createECharts3DCollectionTimeline;
window.createECharts3DQueryTypes = createECharts3DQueryTypes;
window.createParseDurationChart = createParseDurationChart;
window.createPlanDurationChart = createPlanDurationChart;
window.createResultCountChart = createResultCountChart;
window.createResultSizeChart = createResultSizeChart;
window.createECharts3DAvgDocSize = createECharts3DAvgDocSize;
window.createCpuTimeChart = createCpuTimeChart;
window.createIndexScanThroughputChart = createIndexScanThroughputChart;
window.createDocFetchThroughputChart = createDocFetchThroughputChart;
window.createECharts3DServiceTime = createECharts3DServiceTime;
window.createDocumentSizeBubbleChart = createDocumentSizeBubbleChart;
window.createExecVsKernelChart = createExecVsKernelChart;
window.createExecVsServChart = createExecVsServChart;
window.createServiceTimeAnalysisLineChart = createServiceTimeAnalysisLineChart;
window.createExecVsElapsedChart = createExecVsElapsedChart;

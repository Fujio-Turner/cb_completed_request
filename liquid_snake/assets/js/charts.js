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

import { Logger } from './base.js';

// Import TEXT_CONSTANTS from window (defined in main-legacy.js)
const TEXT_CONSTANTS = window.TEXT_CONSTANTS;

// Note: Data layer imports will be added once data-layer.js is finalized
// For now, reference these from window global scope:
// - originalRequests
// - parseTime
// - normalizeStatement
// - getOperators
// - deriveStatementType
// - getTimeGrouping
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

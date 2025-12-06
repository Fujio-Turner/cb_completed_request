// ============================================================
// REPORT.JS - Report Maker Module
// ============================================================
// This module handles Report Maker functionality for generating
// printable/PDF reports from analysis data.
// ============================================================

import { Logger, TEXT_CONSTANTS, formatTimestamp } from './base.js';
import { originalRequests } from './data-layer.js';
import { formatNumber, formatDuration } from './ui-helpers.js';

// ============================================================
// REPORT MAKER FUNCTIONS
// ============================================================


// ============================================================
// getReportSelections
// ============================================================

        function getReportSelections() {
            const sectionChecks = document.querySelectorAll('#report-sections input[type="checkbox"]');
            const sections = {};
            sectionChecks.forEach(chk => { sections[chk.getAttribute('data-section')] = chk.checked; });

            // Timeline charts from dynamic list
            const chartChecks = document.querySelectorAll('#report-timeline-charts input[type="checkbox"]');
            const timelineChartsSel = {};
            chartChecks.forEach(chk => { timelineChartsSel[chk.getAttribute('data-chart-id')] = chk.checked; });

            return {
                sections,
                options: {
                    includeHeader: !!document.getElementById('opt-include-header')?.checked,
                    includeFilters: !!document.getElementById('opt-include-filters')?.checked,
                    flattenTables: !!document.getElementById('opt-flatten-tables')?.checked,
                    chartsAsImages: !!document.getElementById('opt-charts-as-images')?.checked,
                },
                timelineCharts: timelineChartsSel,
            };
        }

// ============================================================
// populateReportMakerTimelineCharts
// ============================================================

        function populateReportMakerTimelineCharts() {
            const container = document.getElementById('report-timeline-charts');
            if (!container) return;
            container.innerHTML = '';
            const mapNames = {
                'duration-buckets': 'Duration Buckets',
                'query-types': 'Query Types',
                'operations': 'Operations',
                'filter': 'Filter Efficiency',
                'result-count': 'Result Count',
                'result-size': 'Result Size',
                'timeline': 'Timeline',
                'memory': 'Memory',
                'exec-vs-kernel': 'Exec vs Kernel',
                'exec-vs-serv': 'Exec vs Service',
                'exec-vs-elapsed': 'Exec vs Elapsed',
                'enhanced-operations': 'Enhanced Operations',
                'cpu-time': 'CPU Time'
            };
            // Default OFF list
            const defaultOff = new Set(['timeline','memory','exec-vs-kernel','exec-vs-serv','exec-vs-elapsed','cpu-time','enhanced-operations']);
            const cards = document.querySelectorAll('#timeline .chart-container');
            cards.forEach(card => {
                const id = card.getAttribute('data-chart-id') || card.querySelector('canvas')?.id || '';
                if (!id) return;
                const lbl = mapNames[id] || id;
                const checkedAttr = defaultOff.has(id) ? '' : 'checked';
                const label = document.createElement('label');
                label.innerHTML = `<input type=\"checkbox\" data-chart-id=\"${id}\" ${checkedAttr}> ${lbl}`;
                container.appendChild(label);
            });
        }

// ============================================================
// addReportHeader
// ============================================================

        function addReportHeader(summaryText) {
            let header = document.getElementById('report-header');
            if (!header) {
                header = document.createElement('div');
                header.id = 'report-header';
                document.body.insertBefore(header, document.body.firstChild);
            }
            // preserve existing exit button
            const existingBtn = header.querySelector('#report-exit-btn');
            const ver = (typeof getVersionInfo === 'function' ? getVersionInfo().version : '');
            const now = formatTimestamp(new Date(), "locale");
            header.innerHTML = `
              <h1>Couchbase Query Analyzer ${ver ? 'v' + ver : ''}</h1>
              <div class=\"meta\">${TEXT_CONSTANTS.REPORT_GENERATED_AT || 'Generated at'}: ${now}${summaryText ? ' • ' + summaryText : ''}</div>
            `;
            // ensure header is printable when summary is included
            header.classList.add('print-visible');
            if (existingBtn) header.appendChild(existingBtn);
        }

// ============================================================
// buildReportCoverHTML
// ============================================================

        function buildReportCoverHTML(selections) {
            const t = (k, d) => (window.TEXT_CONSTANTS && TEXT_CONSTANTS[k]) ? TEXT_CONSTANTS[k] : d;
            const now = formatTimestamp(new Date(), "locale");
            const startDateInput = document.getElementById('start-date');
            const endDateInput = document.getElementById('end-date');
            const sqlFilter = document.getElementById('sql-statement-filter');
            const timeRange = (startDateInput?.value && endDateInput?.value) ? `${startDateInput.value} → ${endDateInput.value}` : '-';

            // Counts
            let total = 0, after = 0;
            try { total = Array.isArray(originalRequests) ? originalRequests.length : 0; } catch(e){}
            try { after = Array.isArray(filteredEveryQueryData) ? filteredEveryQueryData.length : (Array.isArray(everyQueryData) ? everyQueryData.length : 0); } catch(e){}

            return `
              <h1>${t('COVER_TITLE','Couchbase Query Analysis Report')}</h1>
              <div class="line">${t('REPORT_GENERATED_AT','Generated at')}: ${now}</div>
              <div class="line">${t('COVER_TIME_RANGE','Time range')}: ${timeRange}</div>
              <div class="line">${t('COVER_FILTERS_APPLIED','Filters applied')}: ${sqlFilter?.value || '-'}</div>
              <div class="line">${t('COVER_DATA_COUNTS','Data counts')}: ${after}${total ? ` ${t('OF_TOTAL','of')} ${total}` : ''}</div>
              ${buildCoverDetailedSections(selections)}
            `;
        }

// ============================================================
// buildReportSummary
// ============================================================

        function buildReportSummary() {
            const info = [];
            // Data counts if available
            try {
                if (Array.isArray(everyQueryData) && everyQueryData.length) {
                    info.push(`${TEXT_CONSTANTS.SHOWING_TOP || 'Showing top'} ${everyQueryData.length}`);
                }
            } catch (e) {}
            // Date range
            const startDateInput = document.getElementById('start-date');
            const endDateInput = document.getElementById('end-date');
            if (startDateInput?.value && endDateInput?.value) {
                info.push(`${TEXT_CONSTANTS.REPORT_TIME_RANGE || 'Range'}: ${startDateInput.value} → ${endDateInput.value}`);
            }
            // SQL++ statement filter
            const sqlFilter = document.getElementById('sql-statement-filter');
            if (sqlFilter?.value) {
                info.push(`${TEXT_CONSTANTS.REPORT_FILTERS_APPLIED || 'Filter'}: ${sqlFilter.value}`);
            }
            // Collection filter
            const collectionFilter = document.getElementById('collection-filter');
            if (collectionFilter?.value) {
                info.push(`${TEXT_CONSTANTS.REPORT_FILTERS_APPLIED || 'Filter'}: collection ${collectionFilter.value}`);
            }
            // Elapsed time filter
            const elapsedFilter = document.getElementById('elapsed-time-filter');
            if (elapsedFilter?.value) {
                info.push(`${TEXT_CONSTANTS.REPORT_FILTERS_APPLIED || 'Filter'}: elapsed ${elapsedFilter.value}`);
            }
            return info.join(' • ');
        }

// ============================================================
// enterReportMode
// ============================================================

        function enterReportMode() {
            populateReportMakerTimelineCharts();
            const selections = getReportSelections();
            document.body.classList.add('report-mode');
            reportModeActive = true;
            // Save original timeline chart container visibility
            savedTimelineDisplay = new Map();
            document.querySelectorAll('#timeline .chart-container').forEach(c => {
                savedTimelineDisplay.set(c, c.style.display);
            });
            // reset printable header state; will be enabled only if option selected
            const hdr = document.getElementById('report-header');
            if (hdr) hdr.classList.remove('print-visible');

            // Floating exit button
            let exitBtn = document.getElementById('report-exit-btn');
            if (!exitBtn) {
                exitBtn = document.createElement('button');
                exitBtn.id = 'report-exit-btn';
                exitBtn.className = 'report-exit-btn';
                exitBtn.textContent = (TEXT_CONSTANTS && TEXT_CONSTANTS.EXIT_REPORT_PREVIEW) || 'EXIT REPORT PREVIEW';
                exitBtn.addEventListener('click', exitReportMode);
                // append into report header (sticky)
                let header = document.getElementById('report-header');
                if (!header) {
                    header = document.createElement('div');
                    header.id = 'report-header';
                    document.body.insertBefore(header, document.body.firstChild);
                }
                header.appendChild(exitBtn);
            } else {
                exitBtn.style.display = 'inline-block';
            }

            // Cover page
            let cover = document.getElementById('report-cover');
            if (!cover) {
                cover = document.createElement('div');
                cover.id = 'report-cover';
                document.body.insertBefore(cover, document.body.firstChild);
            }
            cover.innerHTML = buildReportCoverHTML(selections);
            cover.style.display = 'block';

            // Cover already forces a page break in print via CSS (#report-cover { page-break-after: always })
            // Remove any legacy cover-break element to avoid blank page 2
            const legacyBrk = document.getElementById('report-cover-break');
            if (legacyBrk) legacyBrk.remove();

            toggleSectionsVisibility(selections);
            if (selections.options.includeHeader) addReportHeader(buildReportSummary());
            flattenScrollableAreas(selections.options.flattenTables);
            replaceChartsWithImages(selections.options.chartsAsImages);
        }

// ============================================================
// resetReportMakerDefaults
// ============================================================

        function resetReportMakerDefaults() {
        // Sections default states
        const defaultSections = {
        'dashboard': true,
        'insights': true,
        'timeline': true,
        'analysis': true,
        'every-query': false,
        'index-query-flow': false,
        'indexes': false
        };
        document.querySelectorAll('#report-sections input[type="checkbox"]').forEach(chk => {
            const k = chk.getAttribute('data-section');
            if (k in defaultSections) chk.checked = !!defaultSections[k];
            });
            // Options default states
            const opt = {
                'opt-include-header': true,
                'opt-include-filters': true,
                'opt-flatten-tables': true,
                'opt-charts-as-images': true
            };
            Object.keys(opt).forEach(id => {
                const el = document.getElementById(id);
                if (el) el.checked = !!opt[id];
            });
            // Timeline charts list regenerated with default ON/OFF
            populateReportMakerTimelineCharts();
        }

// ============================================================
// exitReportMode
// ============================================================

        function exitReportMode() {
            reportModeActive = false;
            document.body.classList.remove('report-mode');
            // Restore
            replaceChartsWithImages(false);
            flattenScrollableAreas(false);
            const header = document.getElementById('report-header');
            if (header) { header.style.display = 'none'; header.classList.remove('print-visible'); }
            const cover = document.getElementById('report-cover');
            if (cover) cover.style.display = 'none';
            const legacyBrk = document.getElementById('report-cover-break');
            if (legacyBrk) legacyBrk.remove();
            const exitBtn = document.getElementById('report-exit-btn');
            if (exitBtn) exitBtn.style.display = 'none';
            // Re-show timeline charts to original visibility state
            if (savedTimelineDisplay instanceof Map) {
                document.querySelectorAll('#timeline .chart-container').forEach(c => {
                    const val = savedTimelineDisplay.get(c);
                    c.style.display = (typeof val === 'string') ? val : '';
                });
                savedTimelineDisplay = null;
            }
            // Trigger resize so charts recompute layout
            setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
            // Reset checkboxes back to defaults
            resetReportMakerDefaults();
        }

// ============================================================
// printReport
// ============================================================

        function printReport() {
            const selections = getReportSelections();
            if (!reportModeActive) {
                // Enter preview with current selections
                enterReportMode();
            } else {
                // Re-apply current selections to preview before printing
                toggleSectionsVisibility(selections);
                if (selections.options.includeHeader) {
                    addReportHeader(buildReportSummary());
                } else {
                    const header = document.getElementById('report-header');
                    if (header) { header.style.display = 'none'; header.classList.remove('print-visible'); }
                }
                flattenScrollableAreas(selections.options.flattenTables);
                replaceChartsWithImages(selections.options.chartsAsImages);
                const cover = document.getElementById('report-cover');
                if (cover) cover.innerHTML = buildReportCoverHTML(selections);
            }
            // Insert page breaks so each selected tab starts on a new page (after cover)
            addPageBreaksForSelectedPanels();
            // Hide non-printable UI just in case the browser ignores CSS
            setSearchControlsVisibility(true);
            // Restore after printing
            const restore = () => setSearchControlsVisibility(false);
            window.addEventListener('afterprint', restore, { once: true });
            // Allow layout to settle before printing
            setTimeout(() => window.print(), 100);
        }

// ============================================================
// initializeReportMaker
// ============================================================

        function initializeReportMaker() {
            if (reportMakerInitialized) return;
            reportMakerInitialized = true;
            
            console.log('📄 Initializing Report Maker (lazy load)');
            
            const t = (k, d) => (window.TEXT_CONSTANTS && TEXT_CONSTANTS[k]) ? TEXT_CONSTANTS[k] : d;

            const btnPreview = document.getElementById('btn-preview-report');
            const btnPrint = document.getElementById('btn-print-report');
            const btnExit = document.getElementById('btn-exit-report');
            if (btnPreview) btnPreview.addEventListener('click', enterReportMode);
            if (btnPrint) btnPrint.addEventListener('click', printReport);
            if (btnExit) btnExit.addEventListener('click', exitReportMode);

            // Set localized labels
            if (btnPreview) btnPreview.textContent = t('PREVIEW_REPORT', 'Preview Report');
            if (btnPrint) btnPrint.textContent = t('PRINT_SAVE_PDF', 'Print / Save PDF');
            if (btnExit) btnExit.textContent = t('EXIT_REPORT_MODE', 'Exit Report Mode');

            const hSections = document.getElementById('rm-select-sections-title');
            const hTimeline = document.getElementById('rm-select-timeline-title');
            const hOptions = document.getElementById('rm-options-title');
            if (hSections) hSections.textContent = t('SELECT_SECTIONS', 'Select sections');
            if (hTimeline) hTimeline.textContent = t('SELECT_TIMELINE_CHARTS', 'Select Timeline charts');
            if (hOptions) hOptions.textContent = t('REPORT_OPTIONS', 'Options');

            const lIncHead = document.getElementById('rm-opt-include-header');
            const lIncFilt = document.getElementById('rm-opt-include-filters');
            const lFlatTbl = document.getElementById('rm-opt-flatten-tables');
            const lChartsImg = document.getElementById('rm-opt-charts-as-images');
            if (lIncHead) lIncHead.textContent = t('INCLUDE_HEADER_SUMMARY', 'Include header summary');
            if (lIncFilt) lIncFilt.textContent = t('INCLUDE_FILTERS', 'Include filters applied');
            if (lFlatTbl) lFlatTbl.textContent = t('FLATTEN_TABLES_FOR_PRINT', 'Flatten scrollable tables for print');
            if (lChartsImg) lChartsImg.textContent = t('CONVERT_CHARTS_TO_IMAGES', 'Convert charts to images for printing');

            populateReportMakerTimelineCharts();
        }

// ============================================================
// EXPORTS
// ============================================================

export {
    getReportSelections,
    populateReportMakerTimelineCharts,
    addReportHeader,
    buildReportCoverHTML,
    buildReportSummary,
    enterReportMode,
    resetReportMakerDefaults,
    exitReportMode,
    printReport,
    initializeReportMaker
};

// Expose globally
window.getReportSelections = getReportSelections;
window.populateReportMakerTimelineCharts = populateReportMakerTimelineCharts;
window.addReportHeader = addReportHeader;
window.buildReportCoverHTML = buildReportCoverHTML;
window.buildReportSummary = buildReportSummary;
window.enterReportMode = enterReportMode;
window.resetReportMakerDefaults = resetReportMakerDefaults;
window.exitReportMode = exitReportMode;
window.printReport = printReport;
window.initializeReportMaker = initializeReportMaker;

console.log('✅ report.js module loaded');

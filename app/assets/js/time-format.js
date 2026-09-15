/**
 * Pure duration formatters (issue #228).
 *
 * No imports, so Jest can `require()` this file and ES modules can import it
 * for side-effect (assigns globalThis.formatTime / formatTimeTooltip).
 * ui-helpers.js re-exports the same functions as the app-facing API.
 */
(function (root, factory) {
    var api = factory();
    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.formatTime = api.formatTime;
        root.formatTimeTooltip = api.formatTimeTooltip;
    }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    function formatTime(milliseconds) {
        if (!milliseconds || isNaN(milliseconds) || milliseconds <= 0) {
            return "00:00.000";
        }

        if (milliseconds < 1) {
            milliseconds = Math.max(0.001, Math.round(milliseconds * 1000) / 1000);
        }

        var totalSeconds = Math.floor(milliseconds / 1000);
        var remainingMs = milliseconds % 1000;
        var minutes = Math.floor(totalSeconds / 60);
        var seconds = totalSeconds % 60;

        var formattedMinutes = minutes.toString().padStart(2, "0");
        var formattedSeconds = seconds.toString().padStart(2, "0");
        var formattedMs = Math.round(remainingMs).toString().padStart(3, "0");

        return formattedMinutes + ":" + formattedSeconds + "." + formattedMs;
    }

    function formatTimeTooltip(timeStr, milliseconds) {
        if (!timeStr || timeStr === "N/A") {
            return "";
        }
        if (milliseconds < 1) {
            return "Original: " + timeStr;
        }
        var formatted = formatTime(milliseconds);
        if (timeStr !== formatted) {
            return "Original: " + timeStr;
        }
        return "";
    }

    return { formatTime: formatTime, formatTimeTooltip: formatTimeTooltip };
});

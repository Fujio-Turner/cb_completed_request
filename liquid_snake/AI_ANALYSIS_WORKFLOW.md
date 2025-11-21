# AI Analysis Workflow Documentation

This document details the end-to-end process of the "Analyze with AI" feature in the Couchbase Query Analyzer, covering both the frontend (JavaScript) and backend (Python/Flask) interactions.

## 1. User Initiation (Frontend)

**File:** `liquid_snake/assets/js/main-legacy.js`  
**Function:** `analyzeWithAI()`

1.  **Validation:**
    *   Checks if `everyQueryData` (parsed JSON) exists.
    *   Verifies an AI provider is selected and has a configured API key.
    *   Ensures a "Cluster Name" is provided.

2.  **Configuration Gathering:**
    *   Collects user selections (checkboxes for Dashboard, Insights, Query Groups, etc.).
    *   Reads options (obfuscation enabled/disabled, Query Groups limit).
    *   Gets the user prompt (or uses default).
    *   Retrieves the Couchbase configuration (`clusterConfig`) for saving results.

3.  **Payload Construction:**
    *   Constructs a `savePayload` object containing:
        *   `data`: Raw query data, insights, dashboard stats, etc.
        *   `prompt`: The user's analysis prompt.
        *   `selections` & `options`: Configuration flags.
        *   `couchbaseConfig`: Connection details for the backend to access Couchbase.
        *   `provider`: Selected AI provider ID.

4.  **UI Feedback (Loading State):**
    *   Disables the "Analyze with AI" button.
    *   Changes button text to "🤖 Processing..." with a spinning animation.
    *   Shows a toast notification: "🚀 AI Analyzer job has been submitted..."

5.  **API Request:**
    *   Sends a `POST` request to `/api/ai/analyze` with the `savePayload`.

---

## 2. Request Handling (Backend)

**File:** `liquid_snake/app.py`  
**Route:** `/api/ai/analyze`

1.  **Validation & Setup:**
    *   Validates request parameters and Couchbase configuration.
    *   Connects to the Couchbase cluster using provided credentials.
    *   Loads the specific AI provider's API key securely from the `user::config` document in Couchbase.

2.  **Payload Preparation:**
    *   Calls `ai_analyzer.payload_builder.build_payload_from_data()` to structure the data for the AI model.
    *   Applies data obfuscation (if enabled) using `ai_analyzer.DataObfuscator`.

3.  **Initial Document Creation:**
    *   Generates a unique `doc_id` (e.g., `ai_analysis_20251120_...`).
    *   Creates an initial document in Couchbase with `status: "pending"`.
    *   **Crucial Step:** This ensures a record exists immediately for the frontend to poll.

4.  **Background Task Launch:**
    *   Spawns a separate thread targeting `background_ai_task`.
    *   Passes all necessary context (API keys, payload, document ID, config) to the thread.

5.  **Immediate Response:**
    *   Returns a JSON response to the frontend *immediately* (without waiting for AI):
        ```json
        {
          "success": true,
          "status": "submitted",
          "document_id": "ai_analysis_...",
          "message": "Analysis job submitted for background processing"
        }
        ```

---

## 3. Background Processing (Backend)

**File:** `liquid_snake/app.py`  
**Function:** `background_ai_task()`

1.  **AI API Call:**
    *   Calls `ai_analyzer.call_ai_provider()` which handles the specific provider logic (OpenAI, Anthropic, etc.).
    *   Sends the structured prompt and data payload.

2.  **Response Handling:**
    *   **On Success:**
        *   Parses the JSON content from the AI response.
        *   De-obfuscates the response (if obfuscation was used) to restore original bucket/scope/collection names.
        *   Updates the Couchbase document (using `doc_id`):
            *   Sets `status: "completed"`.
            *   Stores the full `aiResponse`.
            *   Adds metadata (elapsed time, token usage).
    *   **On Failure:**
        *   Updates the Couchbase document:
            *   Sets `status: "failed"`.
            *   Records the error message and details.

---

## 4. Status Polling (Frontend)

**File:** `liquid_snake/assets/js/main-legacy.js`  
**Context:** Inside `analyzeWithAI()` after receiving the initial response.

1.  **Polling Loop:**
    *   Enters a loop checking the status every 3 seconds.
    *   Sends `POST` requests to `/api/ai/status/<document_id>`.

2.  **Status Check Endpoint (`/api/ai/status/<doc_id>`):**
    *   **Backend:** Uses Couchbase **Sub-Document API** (`lookup_in`) to efficiently fetch *only* the `status`, `error`, and `metadata.elapsed_ms` fields (avoiding the large payload).
    *   Returns the current status (`pending`, `completed`, or `failed`).

3.  **Completion Handling:**
    *   **If "completed":**
        *   Shows a success toast ("✅ Analysis complete!").
        *   Restores the "Analyze with AI" button state.
        *   Triggers `loadAIAnalysisHistory()` to refresh the history table with the new report.
    *   **If "failed":**
        *   Throws an error with the message returned from the backend.
        *   Shows an error toast.
        *   Restores the button state.
    *   **Timeout:** If polling exceeds ~10 minutes, it aborts and shows a timeout error.

---

## 5. Result Visualization

1.  **History Table:**
    *   The new analysis appears in the "Previous Analyses" table.
2.  **Viewing:**
    *   User clicks "View Report" in the history table.
    *   The application loads the full document from Couchbase.
    *   The `formatAIAnalysisHTML()` function renders the JSON response into the beautiful UI with:
        *   Highlighted critical issues.
        *   Copy-pasteable SQL recommendations.
        *   Formatted impact summaries.

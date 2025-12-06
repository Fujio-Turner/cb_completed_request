# Getting Started with Couchbase Query Analyzer

This guide will help you get the Couchbase Query Analyzer tool up and running, connected to your Couchbase cluster, and configured with AI analysis capabilities.

> **Note on Versions**: 
> *   **v3.x (Legacy)**: Can still run as a static HTML page. The online version can be found at: https://cb.fuj.io/en/.
> *   **v4.x+ (Current)**: Requires a Couchbase bucket (to store analysis history) and internet access (to call AI API endpoints). This guide covers the setup for these newer versions.

## 1. Get the Tool

You can run the tool using Docker or by downloading an executable.

- **Docker**: [Pull from Docker Hub](https://hub.docker.com/r/fujioturner/couchbase-query-analyzer/tags)
  ```bash
  docker pull fujioturner/couchbase-query-analyzer:latest
  docker run -p 5000:5000 fujioturner/couchbase-query-analyzer:latest
  ```

- **Executables (MacOS/Windows)**: [Download from GitHub Releases](https://github.com/Fujio-Turner/cb_completed_request/releases)
  
  **MacOS**:
  1. Download the `macos` executable.
  2. Open Terminal and navigate to the download location.
  3. Make it executable: `chmod +x couchbase-query-analyzer-macos`
  4. Run it: `./couchbase-query-analyzer-macos`
  5. *Note: If you see a security warning, go to System Settings > Privacy & Security and allow the app to run.*

  **Windows**:
  1. Download the `windows.exe` file.
  2. Double-click to run.
  3. *Note: If you see a "Windows protected your PC" warning, click "More info" and then "Run anyway".*

## 2. Connect to Couchbase

You need to connect the tool to a Couchbase cluster to save analysis data and user preferences. You can use a Self-Hosted cluster (Local/Remote) or Couchbase Capella (DBaaS).

### Option 1: Self-Hosted
- **Localhost**: Running on your laptop (e.g., Docker or local install).
- **Remote Cluster**: A cluster you have network access to.

### Option 2: Couchbase Capella (DBaaS)
- **Sign Up**: [Start a Free Trial](https://cloud.couchbase.com/sign-up)
- **Login**: [Sign In to Capella](https://cloud.couchbase.com/sign-in)

### Setup Guide: Self-Hosted vs. Capella

<table>
  <thead>
    <tr>
      <th width="20%">Step</th>
      <th width="40%">Self-Hosted (Local/Remote)</th>
      <th width="40%">Couchbase Capella</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>1. Create Bucket</strong></td>
      <td colspan="2" align="center">Create a bucket named <code>cb_tools</code> (Quota: 256 MB).</td>
    </tr>
    <tr>
      <td><strong>2. Create Scope/Collection</strong></td>
      <td colspan="2" align="center">In <code>cb_tools</code>, create scope <code>query</code> and collection <code>analyzer</code>.<br><em>(Ensure <code>_default</code> scope/collection exists for preferences)</em></td>
    </tr>
    <tr>
      <td><strong>3a. Create User</strong></td>
      <td>
        <a href="https://docs.couchbase.com/server/current/manage/manage-security/manage-users-and-roles.html#add-a-user">Create a Couchbase SDK (Application) User</a><br>
        <strong>Roles:</strong><br>
        - Data Reader/Writer (<code>cb_tools</code>)<br>
        - Query Select/Insert/Update
      </td>
      <td>
        <a href="https://docs.couchbase.com/cloud/clusters/manage-database-users.html">Create Database Credential (User)</a><br>
        <strong>Roles:</strong><br>
        - Read/Write access to <code>cb_tools</code> bucket (and all scopes/collections)
      </td>
    </tr>
    <tr>
      <td><strong>3b. Whitelist IP</strong></td>
      <td></td>
      <td>
        <a href="https://docs.couchbase.com/cloud/get-started/connect.html#prerequisites">Add your IP Address to Allowed List</a><br>
        <em>Required for Capella access</em>
      </td>
    </tr>
    <tr>
      <td><strong>4. Connection Details</strong></td>
      <td>
        <strong>URL:</strong> <code>http://localhost:8091</code> (or your cluster IP)<br>
        <strong>Username:</strong> <em>Your new user</em><br>
        <strong>Password:</strong> <em>Your password</em>
      </td>
      <td>
        <strong>URL:</strong> <em>Your Capella Connection String</em> (e.g., <code>couchbases://...</code>)<br>
        <strong>Username:</strong> <em>Your DB Credential</em><br>
        <strong>Password:</strong> <em>Your Password</em>
      </td>
    </tr>
  </tbody>
</table>

## 3. Configure the Tool

Once the tool is running and your Couchbase user is ready:

1.  Open your browser and go to **http://localhost:5000**.
2.  Click the **Settings (Gear Icon)** in the upper right corner.
3.  Enter your **Cluster URL**, **Username**, and **Password**.
4.  Click **Test Connection**.
    *   If successful, you will see a confirmation message.
5.  Click **Save Settings**.

## 4. Setup AI Analysis (Grok x.ai or OpenAI)

To enable the AI Review features for your slow queries, you need an API Key from a supported provider.

<table>
  <thead>
    <tr>
      <th width="50%">Grok x.ai <i>(recommended)</i></th>
      <th width="50%">OpenAI</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <strong>1. Sign Up</strong><br>
        <a href="https://x.ai/">Create an x.ai account</a>
      </td>
      <td>
        <strong>1. Sign Up</strong><br>
        <a href="https://platform.openai.com/signup">Create an OpenAI account</a>
      </td>
    </tr>
    <tr>
      <td>
        <strong>2. Get API Key</strong><br>
        <a href="https://console.x.ai/">Generate an API Key</a>
      </td>
      <td>
        <strong>2. Get API Key</strong><br>
        <a href="https://platform.openai.com/api-keys">Generate an API Key</a>
      </td>
    </tr>
    <tr>
      <td colspan="2">
        <strong>3. Configure Tool</strong><br>
        1. Go to the <strong>Settings</strong> menu in the Query Analyzer (<code>http://localhost:5000</code>).<br>
        2. Select your provider tab (<strong>Grok</strong> or <strong>OpenAI</strong>).<br>
        3. Paste your key into the <strong>API Key</strong> field.<br>
        4. Click <strong>Save Settings</strong>.
      </td>
    </tr>
  </tbody>
</table>

## Ready to Go!

You are now ready to perform your first AI Review of your slow queries.

# Couchbase's Slow Query Log Analyse Tool

### (Capella Compatible)

### Step 1. Download the HTML file: `index.html`
### Step 2. Open the `index.html` with your browser
### Step 3. Then do the below

```sql
SELECT *,meta().plan FROM system:completed_requests;
```
![alt text](copy_paste_json.png)

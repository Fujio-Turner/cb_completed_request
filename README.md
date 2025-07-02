# Couchbase's Slow Query Log Analyse Tool

### (Capella Compatible)

### Step 1. Download the HTML file: `index.html`
### Step 2. Open the `index.html` with your browser
### Step 3. Then do the below

```sql
SELECT * , meta().plan FROM system:completed_requests WHERE node = NODE_NAME();
```

-- NOTE: `WHERE node = NODE_NAME()` gets slow queries from a single node. remove it to get all the nodes.

![alt text](copy_paste_json.png)

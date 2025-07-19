
##### Retrieve Slow Query Logs from the Local Query Node
This query retrieves slow query logs from the Couchbase `system:completed_requests` system catalog, specifically for the query node where the query is executed. It includes query details and the query execution plan.

```sql
SELECT 
  *, 
  meta().plan
FROM 
  system:completed_requests
WHERE 
  node = NODE_NAME();
```

##### Retrieve Slow Queries from a Specific Query Node
This query fetches slow query logs from the `system:completed_requests` system catalog for a specific query node, identified by its IP address or hostname. Replace `10.132.133.165%` with the desired node's IP or hostname pattern.

```sql
SELECT 
  *, 
  meta().plan 
FROM 
  system:completed_requests 
WHERE 
  node LIKE '10.132.133.165%';
```

##### List All Indexes in the Couchbase Cluster
This query retrieves a list of all indexes in the Couchbase cluster from the `system:indexes` system catalog, including their names, metadata, and state. It also generates the corresponding `CREATE INDEX` statement for each index. The query filters for indexes using the Global Secondary Index (GSI) in the default namespace.

```sql
SELECT 
  s.name,
  s.id,
  s.metadata,
  s.state,
  s.num_replica,
  CONCAT('CREATE INDEX ', s.name, ' ON ', k, ks, p, w, ';') AS indexString
FROM system:indexes AS s
LET 
  bid = CONCAT('', s.bucket_id, ''),
  sid = CONCAT('', s.scope_id, ''),
  kid = CONCAT('', s.keyspace_id, ''),
  k = NVL2(bid, CONCAT2('.', bid, sid, kid), kid),
  ks = CASE WHEN s.is_primary THEN '' ELSE '(' || CONCAT2(',', s.index_key) || ') ' END,
  w = CASE WHEN s.condition IS NOT NULL THEN ' WHERE ' || REPLACE(s.condition, '"', '''') ELSE '' END,
  p = CASE WHEN s.`partition` IS NOT NULL THEN ' PARTITION BY ' || s.`partition` ELSE '' END
WHERE 
  s.namespace_id = 'default' 
  AND s.`using` = 'gsi';
```

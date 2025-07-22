#### Couchbase's Slow Query log , but only from random query machine
```sql
SELECT 
    *,
    meta().plan
FROM
    system:completed_requests
WHERE
    node = NODE_NAME();
```


#### If you want to get slow oueries from a specific Query Node

```sql
SELECT 
    *, 
    meta().plan
FROM 
    system:completed_requests 
WHERE 
    node LIKE "10.132.133.165%" 
```

#### To remove system level queries add the below to your query

```sql
SELECT
    *, 
    meta().plan
FROM 
    system:completed_requests 
WHERE  
    clientContextID NOT LIKE 'INTERNAL-%' AND 
    UPPER(IFMISSING(preparedText, statement)) NOT LIKE 'INFER %' AND 
    UPPER(IFMISSING(preparedText, statement)) NOT LIKE 'ADVISE %' AND 
    UPPER(IFMISSING(preparedText, statement)) NOT LIKE 'CREATE %' AND 
    UPPER(IFMISSING(preparedText, statement)) NOT LIKE 'CREATE INDEX%' AND 
    UPPER(IFMISSING(preparedText, statement)) NOT LIKE 'ALTER INDEX%' AND 
    UPPER(IFMISSING(preparedText, statement)) NOT LIKE '% SYSTEM:%' 
```


#### GETS A LIST OF ALL THE INDEXES in the cluster with their names
```sql
SELECT  
 s.name,
 s.id,
 s.metadata,ß
 s.state,
 s.num_replica,
CONCAT("CREATE INDEX `", s.name, "` ON ", k, ks, p, w, ";") as indexString
FROM system:indexes AS s
LET bid = CONCAT("`",s.bucket_id, "`"),
    sid = CONCAT("`", s.scope_id, "`"),
    kid = CONCAT("`", s.keyspace_id, "`"),
    k = NVL2(bid, CONCAT2(".", bid, sid, kid), kid),
    ks = CASE WHEN s.`is_primary` THEN "" ELSE "(" || CONCAT2(",",s.`index_key`) || ") " END,
    w = CASE WHEN s.`condition` IS VALUED THEN " WHERE " || REPLACE(s.`condition`, "\"","'") ELSE "" END,
    p = CASE WHEN s.`partition` IS VALUED THEN " PARTITION BY " || s.`partition` ELSE "" END
WHERE s.`using` = "gsi";
```
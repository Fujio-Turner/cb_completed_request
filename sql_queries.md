#### Couchbase's Slow Query log , but only from a single random query machine.
```sql
SELECT 
    *,
    meta().plan
FROM
    system:completed_requests
WHERE
    node = NODE_NAME();
    LIMIT 2000;
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
    LIMIT 2000;
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
    LIMIT 2000 ;
```


#### Query to look for parts of SQL Strings Only

```sql
SELECT
    *, 
    meta().plan
FROM 
    system:completed_requests 
WHERE  
CONTAINS(`statement`,"SELECT *")
OR
CONTAINS(preparedText,"SELECT *");
```


#### Query to find records between two dates

```sql
SELECT
    *, 
    meta().plan
FROM 
    system:completed_requests 
WHERE  
requestTime BETWEEN "2025-06-01" AND "2025-08-02"
```

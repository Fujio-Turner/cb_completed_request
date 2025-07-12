--Couchbase's Slow Query log , but only from random query machine
SELECT *, meta().plan FROM system:completed_requests WHERE node = NODE_NAME();

---  If you want to get Slow Queries from a specific Query Node
SELECT *, meta().plan FROM system:completed_requests WHERE node LIKE "10.132.133.165%" 



--- GETS A LIST OF ALL THE INDEXES in the cluster with their names
SELECT  s.name ,CONCAT("CREATE INDEX `", s.name, "` ON ", k, ks, p, w, ";") as indexString
FROM system:indexes AS s
LET bid = CONCAT("`",s.bucket_id, "`"),
    sid = CONCAT("`", s.scope_id, "`"),
    kid = CONCAT("`", s.keyspace_id, "`"),
    k = NVL2(bid, CONCAT2(".", bid, sid, kid), kid),
    ks = CASE WHEN s.`is_primary` THEN "" ELSE "(" || CONCAT2(",",s.`index_key`) || ") " END,
    w = CASE WHEN s.`condition` IS VALUED THEN " WHERE " || REPLACE(s.`condition`, "\"","'") ELSE "" END,
    p = CASE WHEN s.`partition` IS VALUED THEN " PARTITION BY " || s.`partition` ELSE "" END
WHERE s.namespace_id = "default" AND s.`using` = "gsi";
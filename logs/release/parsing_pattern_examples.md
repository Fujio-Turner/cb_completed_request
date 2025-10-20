# FROM Clause Parsing - Pattern Matching Examples

## ✅ Supported Patterns (After Fix)

### Pattern 1: Individually Backticked Components (3-part)
**Regex**: `/FROM\s+`([^`]+)`\.`([^`]+)`\.`([^`]+)`/i`

```sql
FROM `account`.`profile`.`orders`
FROM `account`.`profile`.`orders` o
FROM `account`.`profile`.`orders` AS o
FROM `my-bucket`.`my_scope`.`my-collection`
FROM `bucket123`.`scope_456`.`collection-789`
```
**Parsed As**:
- `account.profile.orders`
- `account.profile.orders`
- `account.profile.orders`
- `my-bucket.my_scope.my-collection`
- `bucket123.scope_456.collection-789`

---

### Pattern 2: Individually Backticked Components (2-part)
**Regex**: `/FROM\s+`([^`]+)`\.`([^`]+)`/i`

```sql
FROM `account`.`profile`
FROM `account`.`profile` p
FROM `bucket`.`scope` AS b
FROM `my-bucket`.`my_scope`
```
**Parsed As**:
- `account.profile._default`
- `account.profile._default`
- `bucket.scope._default`
- `my-bucket.my_scope._default`

---

### Pattern 3: Single Backticked Identifier (1 backtick pair, may contain dots)
**Regex**: `/FROM\s+`([^`]+)`/i`

```sql
FROM `account.profile.orders`
FROM `account.profile.orders` o
FROM `bucket.scope.collection` AS b
FROM `products`
FROM `products` p
FROM `my-bucket`
```
**Parsed As**:
- `account.profile.orders` (splits internally)
- `account.profile.orders`
- `bucket.scope.collection`
- `products._default._default`
- `products._default._default`
- `my-bucket._default._default`

---

### Pattern 4: No Backticks (Multi-part only, requires dot)
**Regex**: `/FROM\s+([a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)+)(?:\s|$|,|WHERE|JOIN|USE|LET|NEST|UNNEST|GROUP|ORDER|LIMIT)/i`

```sql
FROM account.profile.orders
FROM account.profile.orders o
FROM bucket.scope.collection WHERE x = 1
FROM products.scope_name.col123
FROM bucket-name.scope_name.collection
```
**Parsed As**:
- `account.profile.orders`
- `account.profile.orders`
- `bucket.scope.collection`
- `products.scope_name.col123`
- `bucket-name.scope_name.collection`

---

## ❌ Intentionally NOT Matched (Aliases)

These are **correctly rejected** to avoid treating aliases as bucket names:

```sql
FROM products
FROM orders o
FROM items AS i
FROM data d
```
**Why**: Single words without backticks are assumed to be **aliases**, not bucket names. This prevents false positives in queries like:
```sql
FROM `real_bucket` AS products  -- "products" is alias, not bucket
```

---

## 🔍 Edge Cases Handled

### Aliases After Backticks
```sql
FROM `account`.`profile`.`orders` o
FROM `account`.`profile`.`orders` AS orders_alias
FROM `bucket.scope.collection` data
```
**Parsed As**:
- `account.profile.orders` (alias "o" ignored)
- `account.profile.orders` (alias "orders_alias" ignored)
- `bucket.scope.collection` (alias "data" ignored)

### Keywords After Collection Name
```sql
FROM `account`.`profile`.`orders` WHERE x = 1
FROM account.profile.orders JOIN other
FROM bucket.scope.collection USE KEYS ["key1"]
FROM data.scope.col LET x = 1
FROM a.b.c UNNEST items AS item
```
**All Correctly Parsed**: Stops at keyword, doesn't include it in bucket name

### Hyphens and Underscores
```sql
FROM `my-bucket`.`my_scope`.`my-collection`
FROM bucket-123.scope_456.collection-789
FROM `my_bucket`.`my-scope`.`collection_name`
```
**All Supported**: Hyphens and underscores are valid in bucket/scope/collection names

---

## 🛑 Still Not Supported (Complex Cases)

These patterns would require more complex parsing and are intentionally not supported:

### Subqueries in FROM
```sql
FROM (SELECT * FROM `bucket`) AS subquery
```

### Multiple Tables (JOIN)
```sql
FROM `bucket1`.`scope`.`col` JOIN `bucket2`.`scope`.`col`
```
**Note**: Only the first FROM clause is captured

### Collections with Special Characters (Not Standard)
```sql
FROM `bucket.with.dots`.`scope`.`collection`  -- Dots in bucket name itself
FROM `bucket@name`.`scope`.`collection`       -- @ symbol
```
**Note**: These would need escaped backticks or different parsing

---

## 📊 Pattern Matching Priority Order

The parsing tries patterns in this order:

```
1. ✅ `bucket`.`scope`.`collection` (individually backticked 3-part)
2. ✅ `bucket`.`scope` (individually backticked 2-part)
3. ✅ `bucket.scope.collection` (single backtick pair)
4. ✅ bucket.scope.collection (no backticks, multi-part)
5. ❌ bucket (single word, no backticks = alias)
```

This ensures the **most specific match wins** and avoids ambiguity.

---

## 🧪 Test Cases

### Before Fix (❌ Wrong)
```sql
FROM `account`.`profile`.`orders` o
```
**Old Parsing**: `account._default._default` ❌  
**New Parsing**: `account.profile.orders` ✅

### Before Fix (❌ Wrong)
```sql
FROM `bucket`.`scope`
```
**Old Parsing**: `bucket._default._default` ❌  
**New Parsing**: `bucket.scope._default` ✅

### Unchanged (Already Worked)
```sql
FROM `bucket.scope.collection`
FROM bucket.scope.collection
```
**Both Parse As**: `bucket.scope.collection` ✅

---

## 📝 Summary

The updated parsing logic now correctly handles:
- ✅ **Individually backticked components** (most common in production queries)
- ✅ **Two-part bucket.scope** formats
- ✅ **Single backtick pairs** with dots inside
- ✅ **No backticks** for multi-part identifiers
- ✅ **Aliases** after table names (ignored correctly)
- ✅ **Keywords** after collection names (stops correctly)
- ❌ **Single words without backticks** (correctly rejected as aliases)

This ensures both the **Dashboard table** and **Index/Query Flow tab** parse bucket.scope.collection correctly.

-- Couchbase Setup Script for Query Analyzer (Issue #231)
-- Run these commands in Couchbase Query Workbench or cbq shell

-- 1. Create bucket (if it doesn't exist)
-- Note: You may need to create this via UI or REST API
-- CREATE BUCKET cb_tools WITH {"ramQuota": 256};

-- 2. Create scope for analyzer data
CREATE SCOPE `cb_tools`.`query` IF NOT EXISTS;

-- 3. Create collection for analyzer data
CREATE COLLECTION `cb_tools`.`query`.`analyzer` IF NOT EXISTS;

-- 4. The _default scope and collection already exist, no need to create

-- 5. Create index for analyzer data (optional, for better query performance)
CREATE PRIMARY INDEX ON `cb_tools`.`query`.`analyzer` IF NOT EXISTS;

-- 6. Create index for user preferences (optional)
CREATE PRIMARY INDEX ON `cb_tools`.`_default`.`_default` IF NOT EXISTS;

-- 7. Verify setup
SELECT * FROM system:keyspaces WHERE name = 'cb_tools';

-- You should see:
-- - cb_tools.query.analyzer
-- - cb_tools._default._default

-- 8. Test user config document (after using the app)
-- Simple K/V lookup - no query needed!
SELECT * FROM `cb_tools`.`_default`.`_default` USE KEYS 'user_config';

-- Or via N1QL
SELECT * FROM `cb_tools`.`_default`.`_default` WHERE META().id = 'user_config';

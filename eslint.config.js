module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'app/assets/js/*.min.js',
      'app/assets/js/*.umd.js',
      'app/assets/js/*bundle*.js',
      // main-legacy.js was migrated to Logger.* by LOGGING_4_0_0, but
      // contains pre-existing parser issues (duplicate function decls)
      // that are out of scope here. The credential-leak / no-console
      // gate for this file lives in
      // tests/python/test_no_unredacted_logging.py instead.
      'app/assets/js/main-legacy.js',
      'app/assets/js/main-legacy-cleaned.js',
    ],
  },
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        // Logger is exposed on window by base.js and used by the
        // non-module main-legacy.js script. See LOGGING_4_0_0.
        Logger: 'readonly',
      },
    },
    rules: {
      'no-console': 'error',
    },
  },
  {
    // Exceptions: base.js (Logger internals) and tests
    files: ['app/assets/js/base.js', 'playwright/**/*.js', 'tests/**/*.js'],
    rules: {
      'no-console': 'off',
    },
  },
];

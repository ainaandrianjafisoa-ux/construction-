// ============================================================
// SECTION 15 — INIT & BOOTSTRAP
// ============================================================

function initApplication() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const dbInfo = ensureSheets_();
    seedBaseData_();
    ensurePresenceTrigger_();
    return {
      ok: true,
      appName:     APP_CONFIG.APP_NAME,
      version:     APP_CONFIG.VERSION,
      databaseUrl: dbInfo.spreadsheetUrl,
      defaultAdmin: {
        login:    APP_CONFIG.DEFAULT_ADMIN_LOGIN,
        password: APP_CONFIG.DEFAULT_ADMIN_PASSWORD
      }
    };
  } finally {
    lock.releaseLock();
  }
}

function generateAllSheetsAndSeed() {
  const dbInfo = generateSheetsStructure();
  seedBaseData_();
  ensurePresenceTrigger_();
  return { ok: true, spreadsheetUrl: dbInfo.spreadsheetUrl, defaultAdminLogin: APP_CONFIG.DEFAULT_ADMIN_LOGIN };
}

function doGet() {
  initApplication();
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(APP_CONFIG.APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getBootstrapData(token) {
  const session = requireSession_(token);
  return {
    session:   buildSessionPayload_(session),
    lookups:   getLookups(token),
    dashboard: getDashboardData(token)
  };
}

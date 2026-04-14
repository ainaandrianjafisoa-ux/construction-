// ============================================================
// SECTION 3 — BASE DE DONNÉES (GOOGLE SHEETS)
// ============================================================

function getDatabase_() {
  const props = PropertiesService.getScriptProperties();
  let dbId = props.getProperty('DB_ID');
  let ss = dbId ? SpreadsheetApp.openById(dbId) : null;
  if (!ss) {
    ss = SpreadsheetApp.create(APP_CONFIG.APP_NAME + ' - Data');
    props.setProperty('DB_ID', ss.getId());
  }
  return ss;
}

function styleHeader_(sheet, cols) {
  sheet.getRange(1, 1, 1, cols)
    .setFontWeight('bold')
    .setBackground('#16324F')
    .setFontColor('#FFFFFF');
}

function ensureSheets_() {
  const ss = getDatabase_();

  Object.keys(SCHEMA).forEach(function(name) {
    const headers = SCHEMA[name];
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      styleHeader_(sheet, headers.length);
      return;
    }

    const currentHeaders = sheet
      .getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()))
      .getValues()[0]
      .map(String);

    const missing = headers.filter(function(h) {
      return currentHeaders.indexOf(h) === -1;
    });
    if (missing.length) {
      sheet.insertColumnsAfter(sheet.getLastColumn(), missing.length);
      sheet.getRange(1, currentHeaders.length + 1, 1, missing.length).setValues([missing]);
      styleHeader_(sheet, currentHeaders.length + missing.length);
    }
  });

  return { spreadsheetId: ss.getId(), spreadsheetUrl: ss.getUrl() };
}

function readTable_(name) {
  const ss    = getDatabase_();
  const sheet = ss.getSheetByName(name);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const values  = sheet.getDataRange().getValues();
  const headers = values[0].map(function(h) { return String(h || '').trim(); });

  return values.slice(1)
    .filter(function(row) {
      return row.some(function(cell) { return cell !== '' && cell !== null; });
    })
    .map(function(row) {
      const obj = {};
      headers.forEach(function(header, i) {
        obj[header] = normalizeCell_(row[i]);
      });
      return obj;
    });
}

function upsertRow_(name, keyField, rowObj) {
  const ss      = getDatabase_();
  const sheet   = ss.getSheetByName(name);
  const headers = SCHEMA[name];
  const values  = sheet.getDataRange().getValues();
  const keyIndex = headers.indexOf(keyField);
  if (keyIndex === -1) throw new Error('Clé primaire introuvable : ' + keyField);

  const rowValues = headers.map(function(h) {
    return rowObj[h] !== undefined ? rowObj[h] : '';
  });

  let foundRow = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][keyIndex] || '') === String(rowObj[keyField] || '')) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow === -1) sheet.appendRow(rowValues);
  else sheet.getRange(foundRow, 1, 1, headers.length).setValues([rowValues]);
}

function setSetting_(key, value) {
  upsertRow_('SETTINGS', 'key', { key: key, value: value, updated_at: nowIso_() });
}

function getSetting_(key, defaultValue) {
  const row = readTable_('SETTINGS').find(function(r) { return r.key === key; });
  return row ? row.value : (defaultValue !== undefined ? defaultValue : null);
}

function setSettingIfEmpty_(key, value) {
  const row = readTable_('SETTINGS').find(function(r) { return r.key === key; });
  if (!row) setSetting_(key, value);
}

/**
 * Lit une liste paramétrable depuis SETTINGS (JSON).
 * Si absente ou invalide, retourne le tableau de défaut.
 */
function getParametrableList_(settingKey, defaults) {
  const stored = getSetting_('PARAM_' + settingKey, null);
  if (stored) {
    const parsed = safeParseJson_(stored, null);
    if (Array.isArray(parsed) && parsed.length) return parsed;
  }
  return defaults || [];
}

function generateSheetsStructure() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return ensureSheets_();
  } finally {
    lock.releaseLock();
  }
}

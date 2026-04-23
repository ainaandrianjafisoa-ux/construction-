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

// ── Lecture des entêtes réelles du sheet ─────────────────────
function getSheetHeaders_(sheet) {
  if (sheet.getLastColumn() < 1) return [];
  return sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(function(h) { return String(h || '').trim(); });
}

// ── Création / ajout de colonnes manquantes ──────────────────
function ensureSheets_() {
  const ss = getDatabase_();

  Object.keys(SCHEMA).forEach(function(name) {
    const schemaHeaders = SCHEMA[name];
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, schemaHeaders.length).setValues([schemaHeaders]);
      styleHeader_(sheet, schemaHeaders.length);
      return;
    }

    const currentHeaders = getSheetHeaders_(sheet);
    const missing = schemaHeaders.filter(function(h) {
      return currentHeaders.indexOf(h) === -1;
    });
    if (missing.length) {
      const startCol = sheet.getLastColumn() + 1;
      sheet.insertColumnsAfter(sheet.getLastColumn(), missing.length);
      sheet.getRange(1, startCol, 1, missing.length).setValues([missing]);
      styleHeader_(sheet, startCol - 1 + missing.length);
    }
  });

  return { spreadsheetId: ss.getId(), spreadsheetUrl: ss.getUrl() };
}

// ── Lecture ───────────────────────────────────────────────────
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

// ── Écriture (utilise les entêtes RÉELLES du sheet) ──────────
function upsertRow_(name, keyField, rowObj) {
  const ss    = getDatabase_();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Sheet introuvable : ' + name);

  // Utiliser les entêtes réelles (pas SCHEMA) pour l'ordre des colonnes
  const headers  = getSheetHeaders_(sheet);
  if (!headers.length) throw new Error('Sheet sans entêtes : ' + name);

  const keyIndex = headers.indexOf(keyField);
  if (keyIndex === -1) throw new Error('Clé primaire introuvable dans ' + name + ' : ' + keyField);

  const rowValues = headers.map(function(h) {
    return rowObj[h] !== undefined ? rowObj[h] : '';
  });

  const values = sheet.getDataRange().getValues();
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

// ── Paramètres ────────────────────────────────────────────────
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

// ── Réparation et alignement complet des sheets ──────────────
/**
 * Réaligne TOUTES les feuilles sur le SCHEMA :
 *  - Crée les feuilles manquantes
 *  - Réordonne les colonnes selon SCHEMA (sans perte de données)
 *  - Supprime les colonnes orphelines (absentes du SCHEMA)
 *  - Retourne un rapport ligne par ligne
 *
 * À appeler depuis l'éditeur GAS : repairAndRealignSheets()
 */
function repairAndRealignSheets() {
  const lock = LockService.getScriptLock();
  lock.waitLock(60000);
  try {
    const ss     = getDatabase_();
    const report = [];

    Object.keys(SCHEMA).forEach(function(name) {
      const schemaHeaders = SCHEMA[name];
      let sheet = ss.getSheetByName(name);

      // ── Feuille inexistante : créer ──────────────────────────
      if (!sheet) {
        sheet = ss.insertSheet(name);
        sheet.getRange(1, 1, 1, schemaHeaders.length).setValues([schemaHeaders]);
        styleHeader_(sheet, schemaHeaders.length);
        report.push('[CRÉÉE] ' + name + ' — ' + schemaHeaders.length + ' colonnes');
        return;
      }

      const lastRow = sheet.getLastRow();

      // ── Feuille vide : écrire les entêtes ───────────────────
      if (lastRow === 0) {
        sheet.getRange(1, 1, 1, schemaHeaders.length).setValues([schemaHeaders]);
        styleHeader_(sheet, schemaHeaders.length);
        report.push('[ENTÊTES] ' + name + ' — entêtes initialisées');
        return;
      }

      // ── Lire les données actuelles ──────────────────────────
      const allValues     = sheet.getDataRange().getValues();
      const currentHeaders = allValues[0].map(function(h) { return String(h || '').trim(); });

      // Vérifier si déjà parfaitement aligné
      const aligned = schemaHeaders.length === currentHeaders.length &&
        schemaHeaders.every(function(h, i) { return currentHeaders[i] === h; });
      if (aligned) {
        report.push('[OK]    ' + name + ' — déjà aligné (' + schemaHeaders.length + ' col.)');
        return;
      }

      // ── Remap les données selon SCHEMA ──────────────────────
      const dataRows = allValues.slice(1).filter(function(row) {
        return row.some(function(cell) { return cell !== '' && cell !== null; });
      });

      const newData = dataRows.map(function(row) {
        return schemaHeaders.map(function(h) {
          const oldIdx = currentHeaders.indexOf(h);
          return oldIdx > -1 ? row[oldIdx] : '';
        });
      });

      // Colonnes présentes dans sheet mais absentes du SCHEMA
      const orphans = currentHeaders.filter(function(h) {
        return h && schemaHeaders.indexOf(h) === -1;
      });

      // ── Réécrire le sheet ────────────────────────────────────
      sheet.clearContents();
      sheet.getRange(1, 1, 1, schemaHeaders.length).setValues([schemaHeaders]);
      styleHeader_(sheet, schemaHeaders.length);

      if (newData.length > 0) {
        sheet.getRange(2, 1, newData.length, schemaHeaders.length).setValues(newData);
      }

      // Supprimer les colonnes en trop
      const totalCols = sheet.getMaxColumns();
      if (totalCols > schemaHeaders.length) {
        sheet.deleteColumns(schemaHeaders.length + 1, totalCols - schemaHeaders.length);
      }

      const orphanMsg = orphans.length ? ' | colonnes supprimées: ' + orphans.join(', ') : '';
      report.push('[RÉALIGNÉ] ' + name +
        ' — ' + currentHeaders.length + ' → ' + schemaHeaders.length + ' col.' +
        ' | ' + newData.length + ' lignes' + orphanMsg);
    });

    Logger.log(report.join('\n'));
    return report;
  } finally {
    lock.releaseLock();
  }
}

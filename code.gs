// ============================================================
// SECTION 1 — CONFIG, RÔLES, ENUMS, SCHEMA
// ============================================================

const APP_CONFIG = {
  APP_NAME: 'Syndic Ledger High-End',
  VERSION: '4.0.0',
  TIMEZONE: Session.getScriptTimeZone() || 'Indian/Antananarivo',
  HEARTBEAT_SECONDS: 45,
  SESSION_STALE_MINUTES: 2,
  SESSION_CACHE_TTL: 21600,
  DEFAULT_ADMIN_LOGIN: 'superadmin',
  DEFAULT_ADMIN_PASSWORD: 'ChangeMe123!'
};

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  TEAM_LEADER: 'team_leader',
  AMBASSADOR:  'ambassador'
};

// Valeurs par défaut (fallback si les paramètres n'ont pas encore été personnalisés)
const ENUMS = {
  USER_STATUS: ['Actif', 'Inactif', 'Suspendu'],

  // Module Agrément — valeurs par défaut (surchargées par SETTINGS si personnalisées)
  AGREMENT_TYPES:          ['GLI', 'IMMEUBLE'],
  TYPE_CLIENT:             ['Locataire', 'Garant'],
  PRIORITIES:              ['Basse', 'Normale', 'Haute', 'Urgente'],
  AGREMENT_STATUS:         ['Initié', 'En attente de traitement', 'En cours de traitement', 'Validé', 'Refusé', 'Clos'],
  MOTIF_VALIDATION:        ['Solvable', 'Non solvable'],

  // Nouveaux enums v4 — Module Agrément
  STATUTS_PRO:             ['CDI', 'Fonctionnaire titulaire', 'CDD', 'Retraité', 'Étudiant', 'TNS'],
  COMPAGNIES:              ['AXA', 'ALLIANZ'],
  STATUTS_FIN_TRAITEMENT:  ['Accepté', 'Refus', 'Attente de document', 'Sans suite', 'Faux dossier', 'PS'],

  // Module Sinistre
  SINISTRE_SITUATIONS:     ['Nouvelle déclaration', 'Complément', 'En attente'],
  SINISTRE_STATUTS:        ['Complet', 'Relance', 'Traité'],
  SINISTRE_COMPLETUDE:     ['OK', 'KO'],

  // Module Facture — workflow étendu v4
  FACTURE_STATUTS:         ['En cours', 'Remonté', 'Vérifié', 'Traité'],

  // Module Résiliation
  RESILIATION_ORIGINES:    ['Mail', 'BO'],
  RESILIATION_COMPLETUDE:  ['OK', 'KO'],
  RESILIATION_RESIL:       ['Résil OK', 'Résil KO'],
  RESILIATION_STATUTS:     ['En cours', 'Relance', 'Traité']
};

const SCHEMA = {
  USERS: [
    'id', 'login', 'password_hash', 'role', 'full_name', 'email',
    'team_id', 'team_leader_id', 'status', 'created_at', 'updated_at', 'last_login_at'
  ],
  TEAMS: [
    'id', 'name', 'team_leader_id', 'status', 'created_at', 'updated_at'
  ],

  // Module Agrément v4 — multi-profils, solvabilité overridable
  AGREMENTS: [
    'id', 'reference',
    // Infos dossier
    'type_dossier', 'no_dossier', 'priorite', 'client', 'adresse',
    'type_client', 'compagnie',
    // Assignation
    'ambassadeur_assigne', 'gestionnaire_plus', 'equipe_id',
    // Statuts
    'statut', 'motif_validation', 'statut_fin_traitement',
    // Multi-profils
    'nombre_profils', 'profils_json', 'plafond_final',
    // Solvabilité mono-profil (rétro-compatibilité)
    'net_a_payer_1', 'net_a_payer_2', 'net_a_payer_3',
    'net_avant_impot_1', 'net_avant_impot_2', 'net_avant_impot_3',
    'brut_1', 'brut_2', 'brut_3',
    'loyer',
    'moyenne_net_a_payer', 'moyenne_net_avant_impot', 'moyenne_brut',
    'ratio_max', 'plafond_loyer', 'resultat_solvabilite',
    // Override manuel solvabilité
    'solvabilite_override', 'solvabilite_commentaire',
    'solvabilite_override_by', 'solvabilite_override_at',
    // Audit
    'created_by', 'updated_by', 'created_at', 'updated_at', 'closed_at'
  ],

  // Cohérences type_dossier → équipe (lecture seule, non bloquant depuis v4)
  AGREMENT_TYPE_TEAM_MAP: [
    'id', 'type_dossier', 'team_id', 'team_name', 'active', 'updated_at'
  ],

  // Module Sinistre v4 — commentaire + historique des mises à jour
  SINISTRES: [
    'id', 'reference', 'no_sinistre', 'no_contrat', 'date_reception',
    'gestionnaire', 'commentaire', 'completude', 'situation', 'statut',
    'historique_json',
    'created_by', 'created_at', 'updated_at', 'traite_at', 'delai_secondes',
    'delai_traitement_start'
  ],

  // Module Facture v4 — workflow Remonté / Vérifié
  FACTURES: [
    'id', 'reference', 'no_sinistre',
    'etape_verification', 'etape_calcul', 'etape_reglement',
    'commentaire_traitement', 'commentaire_verification',
    'statut',
    'verifie_badge', 'verifie_at', 'verifie_par',
    'remonte_at',
    'created_by', 'created_at', 'updated_at', 'traite_at', 'delai_secondes',
    'delai_traitement_start'
  ],

  // Module Résiliation
  RESILIATIONS: [
    'id', 'reference', 'origine', 'mail', 'no_contrat',
    'completude', 'resil', 'commentaire', 'statut',
    'created_by', 'created_at', 'updated_at',
    'soumis_at', 'delai_ouverture_soumission_secondes',
    'delai_traitement_start'
  ],

  // Versions d'entités (historique immuable)
  ENTITY_VERSIONS: [
    'id', 'entity_type', 'entity_id', 'version_num',
    'snapshot_json', 'commentaire', 'action_type',
    'user_id', 'user_name', 'created_at'
  ],

  SESSIONS: [
    'session_id', 'token', 'user_id', 'login', 'role', 'team_id',
    'started_at', 'last_seen_at', 'closed_at', 'status', 'disconnect_reason', 'user_agent'
  ],
  PRESENCE_DAILY: [
    'id', 'date_key', 'user_id', 'login', 'full_name', 'role', 'team_id',
    'first_login_at', 'last_seen_at', 'last_disconnect_at',
    'connection_count', 'disconnection_count', 'online_seconds', 'is_online', 'updated_at'
  ],
  LOGIN_LOG: [
    'id', 'user_id', 'login', 'success', 'timestamp', 'user_agent', 'session_id', 'message'
  ],
  AUDIT_LOG: [
    'id', 'timestamp', 'user_id', 'login', 'role',
    'action_type', 'entity_type', 'entity_id', 'summary',
    'old_value_json', 'new_value_json'
  ],
  SETTINGS: ['key', 'value', 'updated_at']
};
// ============================================================
// SECTION 2 — FONCTIONS UTILITAIRES
// ============================================================

function nowIso_() {
  return Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
}

function todayKey_() {
  return Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyy-MM-dd');
}

function normalizeCell_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, APP_CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
  }
  // GAS lit TRUE/FALSE depuis Sheets comme booléens natifs — normaliser en chaîne
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return (value === null || value === undefined) ? '' : value;
}

function parseDateMs_(value) {
  if (!value) return 0;
  const d = new Date(value);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function nextId_(prefix) {
  return prefix + '_' + Utilities.getUuid().split('-')[0].toUpperCase();
}

function nextReference_(prefix) {
  const props = PropertiesService.getScriptProperties();
  const key   = 'SEQ_' + prefix;
  const current = Number(props.getProperty(key) || '0') + 1;
  props.setProperty(key, String(current));
  const datePart = Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyyMMdd');
  return prefix + '-' + datePart + '-' + ('0000' + current).slice(-4);
}

function safeJson_(value) {
  try { return JSON.stringify(value); } catch (e) { return String(value); }
}

function safeParseJson_(str, fallback) {
  if (!str) return fallback !== undefined ? fallback : [];
  try { return JSON.parse(str); } catch(e) { return fallback !== undefined ? fallback : []; }
}

function indexBy_(rows, key) {
  return rows.reduce(function(acc, row) {
    acc[row[key]] = row;
    return acc;
  }, {});
}

function sortDescBy_(field) {
  return function(a, b) {
    return String(b[field] || '').localeCompare(String(a[field] || ''));
  };
}

function secondsToHHMM_(seconds) {
  const total = Number(seconds || 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2);
}

/**
 * Calcule la moyenne d'un tableau de nombres.
 * Ignore les valeurs nulles/vides si ignoreZero=true.
 */
function average_(values, ignoreZero) {
  const safe = (values || []).map(function(v) { return Number(v) || 0; });
  if (ignoreZero) {
    const nonZero = safe.filter(function(v) { return v > 0; });
    return nonZero.length ? nonZero.reduce(function(a, b) { return a + b; }, 0) / nonZero.length : 0;
  }
  return safe.length ? safe.reduce(function(a, b) { return a + b; }, 0) / safe.length : 0;
}

/** Formate un délai en secondes → "Xj Yh Zmin" */
function formatDelai_(seconds) {
  const s = Number(seconds || 0);
  if (!s || s < 0) return '—';
  const days    = Math.floor(s / 86400);
  const hours   = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (days > 0)  return days + 'j ' + hours + 'h ' + minutes + 'min';
  if (hours > 0) return hours + 'h ' + minutes + 'min';
  return minutes + 'min';
}

/** Normalise une valeur en booléen stocké 'TRUE'/'FALSE' */
function toBool_(value) {
  const s = String(value || '').toLowerCase().trim();
  return (s === 'true' || s === '1' || s === 'yes' || s === 'oui') ? 'TRUE' : 'FALSE';
}

function hashPassword_(plain) {
  const props = PropertiesService.getScriptProperties();
  let salt = props.getProperty('PASSWORD_SALT');
  if (!salt) {
    salt = Utilities.getUuid().replace(/-/g, '');
    props.setProperty('PASSWORD_SALT', salt);
  }
  const raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(plain) + salt
  );
  return raw.map(function(byte) {
    const v = (byte < 0 ? byte + 256 : byte).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function publicUser_(row) {
  return {
    id:             row.id             || '',
    login:          row.login          || '',
    role:           row.role           || '',
    full_name:      row.full_name      || '',
    email:          row.email          || '',
    team_id:        row.team_id        || '',
    team_leader_id: row.team_leader_id || '',
    status:         row.status         || '',
    created_at:     row.created_at     || '',
    updated_at:     row.updated_at     || '',
    last_login_at:  row.last_login_at  || ''
  };
}

function publicTeam_(row) {
  return {
    id:             row.id             || '',
    name:           row.name           || '',
    team_leader_id: row.team_leader_id || '',
    status:         row.status         || '',
    created_at:     row.created_at     || '',
    updated_at:     row.updated_at     || ''
  };
}

function roleCanManage_(actorRole, targetRole) {
  if (actorRole === ROLES.SUPER_ADMIN) return true;
  if (actorRole === ROLES.TEAM_LEADER) return targetRole === ROLES.AMBASSADOR;
  return false;
}

function normalizeDossierType_(value) {
  return String(value || '').trim().toUpperCase();
}

function isActiveRule_(value) {
  const v = String(value || '').toLowerCase();
  return v === 'true' || v === '1' || v === 'oui' || v === 'actif';
}
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
// ============================================================
// SECTION 4 — SEED, AUDIT, LOGS
// ============================================================

function seedBaseData_() {
  const teams = readTable_('TEAMS');
  const users = readTable_('USERS');
  const rules = readTable_('AGREMENT_TYPE_TEAM_MAP');

  if (!teams.some(function(t) { return t.id === 'TEAM_GLI'; })) {
    upsertRow_('TEAMS', 'id', {
      id: 'TEAM_GLI', name: 'Équipe GLI', team_leader_id: '',
      status: 'Actif', created_at: nowIso_(), updated_at: nowIso_()
    });
  }
  if (!teams.some(function(t) { return t.id === 'TEAM_IMMEUBLE'; })) {
    upsertRow_('TEAMS', 'id', {
      id: 'TEAM_IMMEUBLE', name: 'Équipe Immeuble', team_leader_id: '',
      status: 'Actif', created_at: nowIso_(), updated_at: nowIso_()
    });
  }

  if (!users.length) {
    upsertRow_('USERS', 'id', {
      id: nextId_('USR'),
      login: APP_CONFIG.DEFAULT_ADMIN_LOGIN,
      password_hash: hashPassword_(APP_CONFIG.DEFAULT_ADMIN_PASSWORD),
      role: ROLES.SUPER_ADMIN,
      full_name: 'Super Administrateur',
      email: '', team_id: '', team_leader_id: '',
      status: 'Actif',
      created_at: nowIso_(), updated_at: nowIso_(), last_login_at: ''
    });
  }

  // Cohérences type_dossier → équipe (optionnelles, non bloquantes depuis v4)
  if (!rules.some(function(r) {
    return String(r.type_dossier || '').toUpperCase() === 'GLI';
  })) {
    upsertRow_('AGREMENT_TYPE_TEAM_MAP', 'id', {
      id: nextId_('MAP'), type_dossier: 'GLI',
      team_id: 'TEAM_GLI', team_name: 'Équipe GLI',
      active: 'TRUE', updated_at: nowIso_()
    });
  }
  if (!rules.some(function(r) {
    return String(r.type_dossier || '').toUpperCase() === 'IMMEUBLE';
  })) {
    upsertRow_('AGREMENT_TYPE_TEAM_MAP', 'id', {
      id: nextId_('MAP'), type_dossier: 'IMMEUBLE',
      team_id: 'TEAM_IMMEUBLE', team_name: 'Équipe Immeuble',
      active: 'TRUE', updated_at: nowIso_()
    });
  }

  setSettingIfEmpty_('SESSION_STALE_MINUTES', String(APP_CONFIG.SESSION_STALE_MINUTES));
  setSettingIfEmpty_('APP_VERSION', APP_CONFIG.VERSION);

  // Seed paramètres par défaut si absents
  setSettingIfEmpty_('PARAM_STATUTS_PRO',            JSON.stringify(ENUMS.STATUTS_PRO));
  setSettingIfEmpty_('PARAM_COMPAGNIES',             JSON.stringify(ENUMS.COMPAGNIES));
  setSettingIfEmpty_('PARAM_STATUTS_FIN_TRAITEMENT', JSON.stringify(ENUMS.STATUTS_FIN_TRAITEMENT));
  setSettingIfEmpty_('PARAM_AGREMENT_STATUS',        JSON.stringify(ENUMS.AGREMENT_STATUS));
  setSettingIfEmpty_('PARAM_PRIORITIES',             JSON.stringify(ENUMS.PRIORITIES));
  setSettingIfEmpty_('PARAM_AGREMENT_TYPES',         JSON.stringify(ENUMS.AGREMENT_TYPES));
  setSettingIfEmpty_('PARAM_TYPE_CLIENT',            JSON.stringify(ENUMS.TYPE_CLIENT));
  setSettingIfEmpty_('PARAM_MOTIF_VALIDATION',       JSON.stringify(ENUMS.MOTIF_VALIDATION));
  // Module Sinistre
  setSettingIfEmpty_('PARAM_SINISTRE_SITUATIONS',    JSON.stringify(ENUMS.SINISTRE_SITUATIONS));
  setSettingIfEmpty_('PARAM_SINISTRE_STATUTS',       JSON.stringify(ENUMS.SINISTRE_STATUTS));
  setSettingIfEmpty_('PARAM_SINISTRE_COMPLETUDE',    JSON.stringify(ENUMS.SINISTRE_COMPLETUDE));
  // Module Facture
  setSettingIfEmpty_('PARAM_FACTURE_STATUTS',        JSON.stringify(ENUMS.FACTURE_STATUTS));
  // Module Résiliation
  setSettingIfEmpty_('PARAM_RESILIATION_ORIGINES',   JSON.stringify(ENUMS.RESILIATION_ORIGINES));
  setSettingIfEmpty_('PARAM_RESILIATION_COMPLETUDE', JSON.stringify(ENUMS.RESILIATION_COMPLETUDE));
  setSettingIfEmpty_('PARAM_RESILIATION_RESIL',      JSON.stringify(ENUMS.RESILIATION_RESIL));
  setSettingIfEmpty_('PARAM_RESILIATION_STATUTS',    JSON.stringify(ENUMS.RESILIATION_STATUTS));
}

// ── Audit log ────────────────────────────────────────────────
function addAuditLog_(actor, actionType, entityType, entityId, summary, oldValue, newValue) {
  upsertRow_('AUDIT_LOG', 'id', {
    id: nextId_('AUD'),
    timestamp:   nowIso_(),
    user_id:  actor && (actor.user_id || actor.id || (actor.user && actor.user.id))  || '',
    login:    actor && (actor.login   || (actor.user && actor.user.login))            || '',
    role:     actor && (actor.role    || (actor.user && actor.user.role))             || '',
    action_type:    actionType  || '',
    entity_type:    entityType  || '',
    entity_id:      entityId    || '',
    summary:        summary     || '',
    old_value_json: oldValue  ? safeJson_(oldValue)  : '',
    new_value_json: newValue  ? safeJson_(newValue)  : ''
  });
}

function addLoginLog_(userId, login, success, userAgent, sessionId, message) {
  upsertRow_('LOGIN_LOG', 'id', {
    id: nextId_('LGN'),
    user_id: userId || '', login: login || '',
    success: success ? 'TRUE' : 'FALSE',
    timestamp: nowIso_(),
    user_agent: userAgent || '', session_id: sessionId || '', message: message || ''
  });
}

// ── Logs publics ─────────────────────────────────────────────
function getActivityLogs(token, limit) {
  const session   = requireSession_(token);
  const max       = Number(limit || 100);
  const visibleIds = scopeUsers_(session, readTable_('USERS')).map(function(u) { return u.id; });
  return readTable_('AUDIT_LOG')
    .filter(function(row) {
      return session.role === ROLES.SUPER_ADMIN || visibleIds.indexOf(row.user_id) > -1;
    })
    .sort(sortDescBy_('timestamp'))
    .slice(0, max);
}

function listLoginLogs(token, limit) {
  const session   = requireSession_(token);
  const max       = Number(limit || 100);
  const visibleIds = scopeUsers_(session, readTable_('USERS')).map(function(u) { return u.id; });
  return readTable_('LOGIN_LOG')
    .filter(function(row) {
      return session.role === ROLES.SUPER_ADMIN || visibleIds.indexOf(row.user_id) > -1;
    })
    .sort(sortDescBy_('timestamp'))
    .slice(0, max);
}
// ============================================================
// SECTION 5 — SCOPE (PÉRIMÈTRE PAR RÔLE)
// ============================================================

function scopeUsers_(session, users) {
  if (session.role === ROLES.SUPER_ADMIN) return users;
  if (session.role === ROLES.TEAM_LEADER) {
    return users.filter(function(u) {
      return u.team_id === session.user.team_id || u.id === session.user.id;
    });
  }
  return users.filter(function(u) { return u.id === session.user.id; });
}

function scopeTeams_(session, teams) {
  if (session.role === ROLES.SUPER_ADMIN) return teams;
  return teams.filter(function(t) { return t.id === session.user.team_id; });
}

function visibleUserIds_(session) {
  return scopeUsers_(session, readTable_('USERS')).map(function(u) { return u.id; });
}

// Agrément — v4 : l'ambassadeur voit ses dossiers assignés OU créés par lui
function scopeAgrements_(session, rows) {
  if (session.role === ROLES.SUPER_ADMIN) return rows;
  if (session.role === ROLES.TEAM_LEADER) {
    return rows.filter(function(r) {
      return String(r.equipe_id || '') === String(session.user.team_id || '');
    });
  }
  return rows.filter(function(r) {
    return String(r.ambassadeur_assigne || '') === String(session.user.id || '') ||
           String(r.created_by         || '') === String(session.user.id || '');
  });
}

function scopeSinistres_(session, rows) {
  if (session.role === ROLES.SUPER_ADMIN) return rows;
  if (session.role === ROLES.TEAM_LEADER) {
    const ids = visibleUserIds_(session);
    return rows.filter(function(r) { return ids.indexOf(r.created_by) > -1; });
  }
  return rows.filter(function(r) { return r.created_by === session.user.id; });
}

function scopeFactures_(session, rows) {
  if (session.role === ROLES.SUPER_ADMIN) return rows;
  if (session.role === ROLES.TEAM_LEADER) {
    const ids = visibleUserIds_(session);
    return rows.filter(function(r) { return ids.indexOf(r.created_by) > -1; });
  }
  return rows.filter(function(r) { return r.created_by === session.user.id; });
}

function scopeResiliations_(session, rows) {
  if (session.role === ROLES.SUPER_ADMIN) return rows;
  if (session.role === ROLES.TEAM_LEADER) {
    const ids = visibleUserIds_(session);
    return rows.filter(function(r) { return ids.indexOf(r.created_by) > -1; });
  }
  return rows.filter(function(r) { return r.created_by === session.user.id; });
}
// ============================================================
// SECTION 6 — PRÉSENCE (POINTAGE)
// ============================================================

function getOrCreatePresenceDay_(user, dateKey) {
  const existing = readTable_('PRESENCE_DAILY').find(function(r) {
    return r.user_id === user.id && r.date_key === dateKey;
  });
  if (existing) return existing;

  const row = {
    id: nextId_('PRS'), date_key: dateKey,
    user_id: user.id, login: user.login, full_name: user.full_name,
    role: user.role, team_id: user.team_id || '',
    first_login_at: '', last_seen_at: '', last_disconnect_at: '',
    connection_count: 0, disconnection_count: 0, online_seconds: 0,
    is_online: 'FALSE', updated_at: nowIso_()
  };
  upsertRow_('PRESENCE_DAILY', 'id', row);
  return row;
}

function hasAnyOtherActiveSession_(userId) {
  return readTable_('SESSIONS').some(function(s) {
    return s.user_id === userId && s.status === 'ACTIVE';
  });
}

function markPresenceLogin_(user, session) {
  const record = getOrCreatePresenceDay_(user, todayKey_());
  record.first_login_at   = record.first_login_at || session.started_at;
  record.last_seen_at     = session.last_seen_at;
  record.connection_count = Number(record.connection_count || 0) + 1;
  record.is_online        = 'TRUE';
  record.updated_at       = nowIso_();
  upsertRow_('PRESENCE_DAILY', 'id', record);
}

function markPresenceHeartbeat_(user, session) {
  const record = getOrCreatePresenceDay_(user, todayKey_());
  record.last_seen_at = session.last_seen_at;
  record.is_online    = 'TRUE';
  record.updated_at   = nowIso_();
  upsertRow_('PRESENCE_DAILY', 'id', record);
}

function markPresenceDisconnect_(user, session, onlineSeconds) {
  const dateKey = session.started_at
    ? Utilities.formatDate(new Date(session.started_at), APP_CONFIG.TIMEZONE, 'yyyy-MM-dd')
    : todayKey_();
  const record = getOrCreatePresenceDay_(user, dateKey);
  record.last_disconnect_at  = session.closed_at || nowIso_();
  record.last_seen_at        = session.last_seen_at || nowIso_();
  record.disconnection_count = Number(record.disconnection_count || 0) + 1;
  record.online_seconds      = Number(record.online_seconds || 0) + Number(onlineSeconds || 0);
  record.is_online   = hasAnyOtherActiveSession_(user.id) ? 'TRUE' : 'FALSE';
  record.updated_at  = nowIso_();
  upsertRow_('PRESENCE_DAILY', 'id', record);
}

function finalizeSession_(row, reason) {
  const user = requireActiveUser_(row.user_id);
  row.closed_at         = nowIso_();
  row.last_seen_at      = row.last_seen_at || row.closed_at;
  row.status            = 'CLOSED';
  row.disconnect_reason = reason || 'closed';
  upsertRow_('SESSIONS', 'session_id', row);

  const startedMs     = parseDateMs_(row.started_at);
  const endMs         = parseDateMs_(row.closed_at);
  const onlineSeconds = Math.max(0, Math.round((endMs - startedMs) / 1000));

  markPresenceDisconnect_(user, row, onlineSeconds);
  addAuditLog_(user, 'LOGOUT', 'SESSION', row.session_id,
    'Session fermée (' + row.disconnect_reason + ')', null, row);
}

function closeStaleSessions() {
  const staleMinutes = Number(getSetting_('SESSION_STALE_MINUTES', APP_CONFIG.SESSION_STALE_MINUTES));
  const threshold    = Date.now() - staleMinutes * 60 * 1000;

  readTable_('SESSIONS')
    .filter(function(s) { return s.status === 'ACTIVE'; })
    .forEach(function(row) {
      const lastSeen = parseDateMs_(row.last_seen_at || row.started_at);
      if (!lastSeen || lastSeen > threshold) return;
      finalizeSession_(row, 'connection_lost');
      clearSessionCache_(row.token);
    });
}

function ensurePresenceTrigger_() {
  const exists = ScriptApp.getProjectTriggers().some(function(t) {
    return t.getHandlerFunction() === 'closeStaleSessions';
  });
  if (!exists) {
    ScriptApp.newTrigger('closeStaleSessions').timeBased().everyMinutes(1).create();
  }
}

function installOrRepairTriggers() {
  ensurePresenceTrigger_();
  return {
    ok: true,
    triggers: ScriptApp.getProjectTriggers().map(function(t) { return t.getHandlerFunction(); })
  };
}

function listPresence(token, dateKey) {
  const session    = requireSession_(token);
  const day        = dateKey || todayKey_();
  const visibleIds = scopeUsers_(session, readTable_('USERS')).map(function(u) { return u.id; });
  const teamById   = indexBy_(readTable_('TEAMS'), 'id');
  const activeSessions = readTable_('SESSIONS').filter(function(s) { return s.status === 'ACTIVE'; });

  return readTable_('PRESENCE_DAILY')
    .filter(function(row) {
      return row.date_key === day && visibleIds.indexOf(row.user_id) > -1;
    })
    .map(function(row) {
      row.team_name = teamById[row.team_id] ? teamById[row.team_id].name : '';
      row.currently_online = activeSessions.some(function(s) {
        return s.user_id === row.user_id && s.status === 'ACTIVE';
      }) ? 'TRUE' : row.is_online;
      row.online_hhmm = secondsToHHMM_(Number(row.online_seconds || 0));
      return row;
    })
    .sort(function(a, b) {
      return String(a.full_name || '').localeCompare(String(b.full_name || ''), 'fr');
    });
}

function getPresenceSummary(token, dateKey) {
  const rows = listPresence(token, dateKey);
  return {
    date_key:              dateKey || todayKey_(),
    total_users:           rows.length,
    online_now:            rows.filter(function(r) { return String(r.currently_online) === 'TRUE'; }).length,
    total_connections:     rows.reduce(function(n, r) { return n + Number(r.connection_count     || 0); }, 0),
    total_disconnections:  rows.reduce(function(n, r) { return n + Number(r.disconnection_count  || 0); }, 0),
    total_online_seconds:  rows.reduce(function(n, r) { return n + Number(r.online_seconds       || 0); }, 0),
    rows: rows
  };
}
// ============================================================
// SECTION 7 — SESSIONS & AUTHENTIFICATION
// ============================================================

function sessionCacheKey_(token) { return 'SES_' + token; }

function cacheSession_(token, session) {
  CacheService.getScriptCache().put(
    sessionCacheKey_(token), JSON.stringify(session), APP_CONFIG.SESSION_CACHE_TTL
  );
}

function getCachedSession_(token) {
  const raw = CacheService.getScriptCache().get(sessionCacheKey_(token));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function clearSessionCache_(token) {
  CacheService.getScriptCache().remove(sessionCacheKey_(token));
}

function getActiveSessionByToken_(token) {
  return readTable_('SESSIONS').find(function(s) {
    return s.token === token && s.status === 'ACTIVE';
  }) || null;
}

function requireActiveUser_(userId) {
  const user = readTable_('USERS').find(function(u) { return u.id === userId; });
  if (!user || String(user.status || 'Actif') !== 'Actif') {
    throw new Error('Utilisateur inactif ou introuvable.');
  }
  return user;
}

function requireSession_(tokenOrSession) {
  const token = typeof tokenOrSession === 'string'
    ? tokenOrSession
    : (tokenOrSession && tokenOrSession.token);
  if (!token) throw new Error('Session invalide.');

  const session = getCachedSession_(token) || getActiveSessionByToken_(token);
  if (!session) throw new Error('Votre session a expiré. Veuillez vous reconnecter.');

  const user    = requireActiveUser_(session.user_id);
  session.user  = publicUser_(user);
  session.role  = user.role;
  cacheSession_(token, session);
  return session;
}

function buildSessionPayload_(session) {
  const fresh = requireSession_(session.token || session);
  return {
    token:             fresh.token,
    user:              publicUser_(fresh.user),
    role:              fresh.role,
    menu:              buildMenu_(fresh.role),
    permissions:       buildPermissions_(fresh.role),
    appName:           APP_CONFIG.APP_NAME,
    heartbeatSeconds:  APP_CONFIG.HEARTBEAT_SECONDS
  };
}

function closeActiveSessionsForUser_(userId, reason) {
  readTable_('SESSIONS')
    .filter(function(s) { return s.user_id === userId && s.status === 'ACTIVE'; })
    .forEach(function(s) { finalizeSession_(s, reason || 'relogin'); });
}

function authenticateUser(login, password, userAgent) {
  initApplication();

  const normalizedLogin    = String(login    || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');

  if (!normalizedLogin || !normalizedPassword) {
    throw new Error('Veuillez renseigner votre identifiant et votre mot de passe.');
  }

  const users = readTable_('USERS');
  const user  = users.find(function(u) {
    return String(u.login || '').toLowerCase() === normalizedLogin;
  });

  if (!user) {
    addLoginLog_('', normalizedLogin, false, userAgent, '', 'Utilisateur introuvable');
    throw new Error('Identifiants invalides.');
  }
  if (String(user.status || 'Actif') !== 'Actif') {
    addLoginLog_(user.id, normalizedLogin, false, userAgent, '', 'Compte inactif ou suspendu');
    throw new Error('Compte inactif ou suspendu.');
  }
  if (user.password_hash !== hashPassword_(normalizedPassword)) {
    addLoginLog_(user.id, normalizedLogin, false, userAgent, '', 'Mot de passe invalide');
    throw new Error('Identifiants invalides.');
  }

  closeActiveSessionsForUser_(user.id, 'relogin');

  const token   = Utilities.getUuid().replace(/-/g, '') + '_' + new Date().getTime();
  const session = {
    session_id:        nextId_('SES'),
    token:             token,
    user_id:           user.id,
    login:             user.login,
    role:              user.role,
    team_id:           user.team_id || '',
    started_at:        nowIso_(),
    last_seen_at:      nowIso_(),
    closed_at:         '',
    status:            'ACTIVE',
    disconnect_reason: '',
    user_agent:        String(userAgent || '')
  };

  upsertRow_('SESSIONS', 'session_id', session);
  cacheSession_(token, session);

  user.last_login_at = nowIso_();
  user.updated_at    = nowIso_();
  upsertRow_('USERS', 'id', user);

  markPresenceLogin_(user, session);
  addLoginLog_(user.id, user.login, true, userAgent, session.session_id, 'Connexion réussie');
  addAuditLog_(user, 'LOGIN', 'SESSION', session.session_id, 'Connexion à la plateforme', null, session);

  return buildSessionPayload_(session);
}

/**
 * Point d'entrée appelé par le front-end lors de la connexion.
 * Retourne { token, session, lookups } pour hydrater l'app.
 */
function loginUser(login, password) {
  const sessionPayload = authenticateUser(login, password, '');
  const token          = sessionPayload.token;
  return {
    token:   token,
    session: sessionPayload,
    lookups: getLookups(token)
  };
}

function heartbeatSession(token, meta) {
  const session = requireSession_(token);
  const row     = readTable_('SESSIONS').find(function(s) { return s.session_id === session.session_id; });
  if (!row || row.status !== 'ACTIVE') throw new Error('Session introuvable ou fermée.');

  row.last_seen_at = nowIso_();
  if (meta && meta.user_agent) row.user_agent = meta.user_agent;
  upsertRow_('SESSIONS', 'session_id', row);
  cacheSession_(token, row);

  const user = requireActiveUser_(session.user_id);
  markPresenceHeartbeat_(user, row);

  return { ok: true, serverTime: nowIso_() };
}

function logoutUser(token, reason) {
  const session = requireSession_(token);
  const row     = readTable_('SESSIONS').find(function(s) { return s.session_id === session.session_id; });
  if (row && row.status === 'ACTIVE') finalizeSession_(row, reason || 'manual_logout');
  clearSessionCache_(token);
  return { ok: true };
}

function registerOfflineSignal(token) {
  try { return logoutUser(token, 'client_offline'); }
  catch (e) { return { ok: false, message: e.message }; }
}

/** Alias front-end pour le heartbeat périodique. */
function heartbeat(token) {
  return heartbeatSession(token, {});
}

/** Changement de mot de passe par l'utilisateur connecté. */
function changePassword(token, payload) {
  const session = requireSession_(token);
  const data    = payload || {};
  const current = String(data.current_password || '');
  const newPwd  = String(data.new_password     || '');

  if (!current || !newPwd) throw new Error('Les deux mots de passe sont requis.');
  if (newPwd.length < 6)   throw new Error('Le nouveau mot de passe doit comporter au moins 6 caractères.');

  const users = readTable_('USERS');
  const user  = users.find(function(u) { return u.id === session.user_id; });
  if (!user) throw new Error('Utilisateur introuvable.');
  if (user.password_hash !== hashPassword_(current)) throw new Error('Mot de passe actuel incorrect.');

  const now = nowIso_();
  const updated = Object.assign({}, user, {
    password_hash: hashPassword_(newPwd),
    updated_at:    now
  });
  upsertRow_('USERS', 'id', updated);
  addAuditLog_(session, 'CHANGE_PASSWORD', 'USER', user.id, 'Changement de mot de passe', null, null);
  return { ok: true };
}

/** Liste l'historique des actions (audit log) visible par le rôle. */
function listAuditLogs(token, filters) {
  const session    = requireSession_(token);
  const max        = Number((filters || {}).limit || 200);
  const usersById  = indexBy_(readTable_('USERS'), 'id');
  const visibleIds = scopeUsers_(session, readTable_('USERS')).map(function(u) { return u.id; });

  return readTable_('AUDIT_LOG')
    .filter(function(r) {
      return session.role === ROLES.SUPER_ADMIN || visibleIds.indexOf(r.user_id) > -1;
    })
    .sort(sortDescBy_('timestamp'))
    .slice(0, max)
    .map(function(r) {
      const u = usersById[r.user_id];
      return {
        id:          r.id,
        timestamp:   r.timestamp,
        user_id:     r.user_id,
        user_name:   u ? (u.full_name || u.login) : (r.login || r.user_id || ''),
        action:      r.action_type,
        entity_type: r.entity_type,
        entity_id:   r.entity_id,
        description: r.summary
      };
    });
}

/** Liste les sessions de connexion visibles par le rôle. */
function listSessions(token, filters) {
  const session    = requireSession_(token);
  const max        = Number((filters || {}).limit || 150);
  const usersById  = indexBy_(readTable_('USERS'), 'id');
  const visibleIds = scopeUsers_(session, readTable_('USERS')).map(function(u) { return u.id; });

  return readTable_('SESSIONS')
    .filter(function(r) {
      return session.role === ROLES.SUPER_ADMIN || visibleIds.indexOf(r.user_id) > -1;
    })
    .sort(sortDescBy_('started_at'))
    .slice(0, max)
    .map(function(r) {
      const u = usersById[r.user_id];
      return {
        session_id:      r.session_id,
        user_id:         r.user_id,
        user_name:       u ? (u.full_name || u.login) : (r.login || r.user_id || ''),
        role:            r.role,
        status:          r.status,
        connected_at:    r.started_at,
        disconnected_at: r.closed_at || '',
        user_agent:      r.user_agent || ''
      };
    });
}
// ============================================================
// SECTION 8 — MENU, PERMISSIONS, LOOKUPS, PARAMÈTRES
// ============================================================

function buildMenu_(role) {
  const common = [
    { key: 'dashboard',    label: 'Dashboard'    },
    { key: 'agrements',    label: 'Agrément'     },
    { key: 'sinistres',    label: 'Sinistre'     },
    { key: 'factures',     label: 'Facture'      },
    { key: 'resiliations', label: 'Résiliation'  },
    { key: 'presence',     label: 'Pointage'     },
    { key: 'history',      label: 'Historique'   },
    { key: 'connections',  label: 'Connexions'   }
  ];

  if (role === ROLES.SUPER_ADMIN) {
    return [
      { key: 'users',      label: 'Utilisateurs' },
      { key: 'teams',      label: 'Équipes'      },
      { key: 'coherences', label: 'Cohérences'   },
      { key: 'parametres', label: 'Paramètres'   }
    ].concat(common);
  }
  if (role === ROLES.TEAM_LEADER) {
    return [
      { key: 'users',              label: 'Mon équipe'       },
      { key: 'factures_remontees', label: 'Dossiers remontés'},
      { key: 'parametres',         label: 'Paramètres'       }
    ].concat(common);
  }
  return common;
}

function buildPermissions_(role) {
  return {
    canManageUsers:       role === ROLES.SUPER_ADMIN || role === ROLES.TEAM_LEADER,
    canManageTeams:       role === ROLES.SUPER_ADMIN,
    canViewCoherences:    role === ROLES.SUPER_ADMIN,
    canManageSettings:    role === ROLES.SUPER_ADMIN || role === ROLES.TEAM_LEADER,
    canVerifierFactures:  role === ROLES.SUPER_ADMIN || role === ROLES.TEAM_LEADER,
    canReassigner:        role === ROLES.SUPER_ADMIN || role === ROLES.TEAM_LEADER,
    canValidateAgrement:  role === ROLES.SUPER_ADMIN || role === ROLES.TEAM_LEADER,
    canOverrideSolvabilite: role === ROLES.SUPER_ADMIN || role === ROLES.TEAM_LEADER,
    canCreateAgrement:    true,
    canCreateSinistre:    true,
    canCreateFacture:     true,
    canCreateResiliation: true
  };
}

function getLookups(token) {
  const session = requireSession_(token);
  const teams   = scopeTeams_(session, readTable_('TEAMS'));
  const users   = scopeUsers_(session, readTable_('USERS'));

  return {
    // Communs
    userStatuses:           ENUMS.USER_STATUS,
    // Agrément
    agrementStatuts:        getParametrableList_('AGREMENT_STATUS',        ENUMS.AGREMENT_STATUS),
    // alias rétrocompat
    agrementStatuses:       getParametrableList_('AGREMENT_STATUS',        ENUMS.AGREMENT_STATUS),
    typesDossier:           getParametrableList_('AGREMENT_TYPES',         ENUMS.AGREMENT_TYPES),
    // alias rétrocompat
    agrementTypes:          getParametrableList_('AGREMENT_TYPES',         ENUMS.AGREMENT_TYPES),
    typeClientOptions:      getParametrableList_('TYPE_CLIENT',            ENUMS.TYPE_CLIENT),
    priorities:             getParametrableList_('PRIORITIES',             ENUMS.PRIORITIES),
    motifValidationOptions: getParametrableList_('MOTIF_VALIDATION',       ENUMS.MOTIF_VALIDATION),
    // Agrément v4
    statutsPro:             getParametrableList_('STATUTS_PRO',            ENUMS.STATUTS_PRO),
    compagnies:             getParametrableList_('COMPAGNIES',             ENUMS.COMPAGNIES),
    statutsFinTraitement:   getParametrableList_('STATUTS_FIN_TRAITEMENT', ENUMS.STATUTS_FIN_TRAITEMENT),
    // Sinistre
    sinistreSituations:     getParametrableList_('SINISTRE_SITUATIONS',    ENUMS.SINISTRE_SITUATIONS),
    sinistreStatuts:        getParametrableList_('SINISTRE_STATUTS',       ENUMS.SINISTRE_STATUTS),
    sinistreCompletude:     getParametrableList_('SINISTRE_COMPLETUDE',    ENUMS.SINISTRE_COMPLETUDE),
    // Facture
    factureStatuts:         getParametrableList_('FACTURE_STATUTS',        ENUMS.FACTURE_STATUTS),
    // Résiliation
    resiliationOrigines:    getParametrableList_('RESILIATION_ORIGINES',   ENUMS.RESILIATION_ORIGINES),
    resiliationCompletude:  getParametrableList_('RESILIATION_COMPLETUDE', ENUMS.RESILIATION_COMPLETUDE),
    resiliationResil:       getParametrableList_('RESILIATION_RESIL',      ENUMS.RESILIATION_RESIL),
    resiliationStatuts:     getParametrableList_('RESILIATION_STATUTS',    ENUMS.RESILIATION_STATUTS),
    // Entités
    teams:       teams.map(publicTeam_),
    users:       users.map(publicUser_),
    teamLeaders: users.filter(function(u) { return u.role === ROLES.TEAM_LEADER; }).map(publicUser_),
    ambassadors: users.filter(function(u) { return u.role === ROLES.AMBASSADOR;  }).map(publicUser_)
  };
}

// ── Paramètres personnalisables ───────────────────────────────

/** Retourne tous les paramètres personnalisables */
function getParametres(token) {
  const session = requireSession_(token);
  if (session.role === ROLES.AMBASSADOR) throw new Error('Accès non autorisé.');
  return {
    // Agrément
    AGREMENT_TYPES:         getParametrableList_('AGREMENT_TYPES',         ENUMS.AGREMENT_TYPES),
    TYPE_CLIENT:            getParametrableList_('TYPE_CLIENT',            ENUMS.TYPE_CLIENT),
    STATUTS_PRO:            getParametrableList_('STATUTS_PRO',            ENUMS.STATUTS_PRO),
    COMPAGNIES:             getParametrableList_('COMPAGNIES',             ENUMS.COMPAGNIES),
    STATUTS_FIN_TRAITEMENT: getParametrableList_('STATUTS_FIN_TRAITEMENT', ENUMS.STATUTS_FIN_TRAITEMENT),
    AGREMENT_STATUS:        getParametrableList_('AGREMENT_STATUS',        ENUMS.AGREMENT_STATUS),
    PRIORITIES:             getParametrableList_('PRIORITIES',             ENUMS.PRIORITIES),
    MOTIF_VALIDATION:       getParametrableList_('MOTIF_VALIDATION',       ENUMS.MOTIF_VALIDATION),
    // Sinistre
    SINISTRE_SITUATIONS:    getParametrableList_('SINISTRE_SITUATIONS',    ENUMS.SINISTRE_SITUATIONS),
    SINISTRE_STATUTS:       getParametrableList_('SINISTRE_STATUTS',       ENUMS.SINISTRE_STATUTS),
    SINISTRE_COMPLETUDE:    getParametrableList_('SINISTRE_COMPLETUDE',    ENUMS.SINISTRE_COMPLETUDE),
    // Facture
    FACTURE_STATUTS:        getParametrableList_('FACTURE_STATUTS',        ENUMS.FACTURE_STATUTS),
    // Résiliation
    RESILIATION_ORIGINES:   getParametrableList_('RESILIATION_ORIGINES',   ENUMS.RESILIATION_ORIGINES),
    RESILIATION_COMPLETUDE: getParametrableList_('RESILIATION_COMPLETUDE', ENUMS.RESILIATION_COMPLETUDE),
    RESILIATION_RESIL:      getParametrableList_('RESILIATION_RESIL',      ENUMS.RESILIATION_RESIL),
    RESILIATION_STATUTS:    getParametrableList_('RESILIATION_STATUTS',    ENUMS.RESILIATION_STATUTS)
  };
}

/**
 * Sauvegarde les paramètres personnalisables.
 * Seules les clés autorisées sont acceptées.
 */
function saveParametres(token, payload) {
  const session = requireSession_(token);
  if (session.role === ROLES.AMBASSADOR) throw new Error('Accès non autorisé.');

  const data    = payload || {};
  const allowed = [
    'AGREMENT_TYPES', 'TYPE_CLIENT', 'STATUTS_PRO', 'COMPAGNIES',
    'STATUTS_FIN_TRAITEMENT', 'AGREMENT_STATUS', 'PRIORITIES', 'MOTIF_VALIDATION',
    'SINISTRE_SITUATIONS', 'SINISTRE_STATUTS', 'SINISTRE_COMPLETUDE',
    'FACTURE_STATUTS',
    'RESILIATION_ORIGINES', 'RESILIATION_COMPLETUDE', 'RESILIATION_RESIL', 'RESILIATION_STATUTS'
  ];

  allowed.forEach(function(key) {
    if (data[key] && Array.isArray(data[key]) && data[key].length > 0) {
      setSetting_('PARAM_' + key, JSON.stringify(data[key]));
      addAuditLog_(session, 'UPDATE_SETTINGS', 'SETTINGS', key,
        'Mise à jour paramètre : ' + key, null, data[key]);
    }
  });

  return getParametres(token);
}
// ============================================================
// SECTION 9 — UTILISATEURS & ÉQUIPES
// ============================================================

function listUsers(token) {
  const session   = requireSession_(token);
  const users     = scopeUsers_(session, readTable_('USERS'));
  const teamsById = indexBy_(readTable_('TEAMS'), 'id');
  const usersById = indexBy_(readTable_('USERS'), 'id');

  return users.map(function(user) {
    const row             = publicUser_(user);
    row.team_name         = teamsById[row.team_id]        ? teamsById[row.team_id].name              : '';
    row.team_leader_name  = usersById[row.team_leader_id] ? usersById[row.team_leader_id].full_name  : '';
    return row;
  }).sort(function(a, b) {
    return String(a.full_name || '').localeCompare(String(b.full_name || ''), 'fr');
  });
}

function saveUser(token, payload) {
  const session = requireSession_(token);
  if (!buildPermissions_(session.role).canManageUsers) {
    throw new Error('Vous n\'avez pas les droits pour gérer les utilisateurs.');
  }

  const data       = payload || {};
  const users      = readTable_('USERS');
  const existing   = data.id ? users.find(function(u) { return u.id === data.id; }) : null;
  const targetRole = String(data.role || (existing && existing.role) || '').trim();

  if (!targetRole) throw new Error('Le rôle est obligatoire.');
  if (!roleCanManage_(session.role, targetRole)) throw new Error('Vous ne pouvez pas gérer ce rôle.');
  if (existing && !roleCanManage_(session.role, existing.role)) {
    throw new Error('Vous ne pouvez pas modifier cet utilisateur.');
  }

  const login    = String(data.login    || (existing && existing.login)    || '').trim().toLowerCase();
  const fullName = String(data.full_name|| (existing && existing.full_name)|| '').trim();
  if (!login || !fullName) throw new Error('Le login et le nom complet sont obligatoires.');

  const duplicate = users.find(function(u) {
    return String(u.login || '').toLowerCase() === login && u.id !== (existing ? existing.id : '');
  });
  if (duplicate) throw new Error('Ce login existe déjà.');

  let teamId       = String(data.team_id        || (existing && existing.team_id)        || '').trim();
  let teamLeaderId = String(data.team_leader_id  || (existing && existing.team_leader_id) || '').trim();

  if (session.role === ROLES.TEAM_LEADER) {
    teamId       = session.user.team_id || '';
    teamLeaderId = session.user.id;
  } else if (targetRole === ROLES.TEAM_LEADER) {
    teamLeaderId = '';
  }

  if (targetRole === ROLES.AMBASSADOR && !teamLeaderId) {
    throw new Error('Un ambassadeur doit être rattaché à un Team Leader.');
  }

  const now = nowIso_();
  const row = Object.assign({}, existing || {}, {
    id:            existing ? existing.id : nextId_('USR'),
    login:         login,
    password_hash: String(data.password || '').trim()
      ? hashPassword_(String(data.password).trim())
      : (existing ? existing.password_hash : ''),
    role:          targetRole,
    full_name:     fullName,
    email:         String(data.email || (existing && existing.email) || '').trim(),
    team_id:       teamId,
    team_leader_id: teamLeaderId,
    status:        String(data.status || (existing && existing.status) || 'Actif').trim(),
    created_at:    existing ? existing.created_at : now,
    updated_at:    now,
    last_login_at: existing ? existing.last_login_at : ''
  });

  if (!row.password_hash) throw new Error('Le mot de passe est obligatoire à la création.');

  upsertRow_('USERS', 'id', row);
  addAuditLog_(session, existing ? 'UPDATE' : 'CREATE', 'USER', row.id,
    'Enregistrement utilisateur', existing, row);
  return publicUser_(row);
}

// ── Équipes ───────────────────────────────────────────────────
function listTeams(token) {
  const session   = requireSession_(token);
  const teams     = scopeTeams_(session, readTable_('TEAMS'));
  const users     = readTable_('USERS');
  const agrements = readTable_('AGREMENTS');

  return teams.map(function(team) {
    return {
      id:               team.id,
      name:             team.name,
      team_leader_id:   team.team_leader_id,
      team_leader_name: (users.find(function(u) { return u.id === team.team_leader_id; }) || {}).full_name || '',
      status:           team.status,
      created_at:       team.created_at,
      updated_at:       team.updated_at,
      ambassadors_count: users.filter(function(u) {
        return u.team_id === team.id && u.role === ROLES.AMBASSADOR;
      }).length,
      agrements_count: agrements.filter(function(d) { return d.equipe_id === team.id; }).length
    };
  }).sort(function(a, b) {
    return String(a.name || '').localeCompare(String(b.name || ''), 'fr');
  });
}

function saveTeam(token, payload) {
  const session = requireSession_(token);
  if (session.role !== ROLES.SUPER_ADMIN) throw new Error('Seul le Super Admin peut gérer les équipes.');

  const data     = payload || {};
  const teams    = readTable_('TEAMS');
  const existing = data.id ? teams.find(function(t) { return t.id === data.id; }) : null;
  const name     = String(data.name || (existing && existing.name) || '').trim();
  if (!name) throw new Error('Le nom de l\'équipe est obligatoire.');

  const now = nowIso_();
  const row = Object.assign({}, existing || {}, {
    id:             existing ? existing.id : nextId_('TEAM'),
    name:           name,
    team_leader_id: String(data.team_leader_id || (existing && existing.team_leader_id) || '').trim(),
    status:         String(data.status || (existing && existing.status) || 'Actif').trim(),
    created_at:     existing ? existing.created_at : now,
    updated_at:     now
  });

  upsertRow_('TEAMS', 'id', row);
  addAuditLog_(session, existing ? 'UPDATE' : 'CREATE', 'TEAM', row.id,
    'Enregistrement équipe', existing, row);
  return publicTeam_(row);
}
// ============================================================
// SECTION 10 — MODULE AGRÉMENT v4
// Multi-profils · Solvabilité overridable · Réassignation
// ============================================================

// ── Cohérences (lecture seule depuis v4) ─────────────────────

function listAgrementTypeTeamRules(token) {
  const session = requireSession_(token);
  if (!buildPermissions_(session.role).canViewCoherences) {
    throw new Error('Vous n\'avez pas accès aux cohérences.');
  }
  const teamsById = indexBy_(readTable_('TEAMS'), 'id');
  return readTable_('AGREMENT_TYPE_TEAM_MAP')
    .map(function(row) {
      return {
        id:           row.id,
        type_dossier: row.type_dossier,
        team_id:      row.team_id,
        team_name:    teamsById[row.team_id] ? teamsById[row.team_id].name : (row.team_name || ''),
        active:       row.active,
        updated_at:   row.updated_at
      };
    })
    .sort(function(a, b) {
      return String(a.type_dossier || '').localeCompare(String(b.type_dossier || ''), 'fr');
    });
}

/**
 * Version NON BLOQUANTE de la résolution équipe par type de dossier.
 * Retourne '' si aucune règle n'est trouvée (ne lève pas d'erreur).
 * Conservée pour info / fallback optionnel — la règle n'est plus imposée.
 */
function assignTeamByTypeDossierOptional_(typeDossier) {
  const dossierType = normalizeDossierType_(typeDossier);
  const rule = readTable_('AGREMENT_TYPE_TEAM_MAP').find(function(r) {
    return normalizeDossierType_(r.type_dossier) === dossierType && isActiveRule_(r.active);
  });
  if (!rule) return '';
  return String(rule.team_id || '').trim();
}

// ── Calculs solvabilité ───────────────────────────────────────

/**
 * Calcule le plafond de loyer pour UN SEUL profil — VERSION LEGACY (switch/case).
 * Conservée pour la rétro-compatibilité des profils sans taux_plafond.
 *
 * @param {Object} profile
 * @returns {{ plafond, revenu_complementaire, plafond_avec_revenu, avg_net_imposable, ratio_used, details }}
 */
function calculateProfilePlafond_Legacy_(profile) {
  const statutPro  = String(profile.statut_pro  || '').trim();
  const typeClient = String(profile.type_client || 'Locataire').trim();
  const compagnie  = String(profile.compagnie   || '').trim();

  const sourceNI = Array.isArray(profile.net_imposable)
    ? profile.net_imposable
    : (Array.isArray(profile.salaires) ? profile.salaires : []);
  const ni = [
    Number(profile.net_imposable_1 !== undefined ? profile.net_imposable_1 : (sourceNI[0] || 0)),
    Number(profile.net_imposable_2 !== undefined ? profile.net_imposable_2 : (sourceNI[1] || 0)),
    Number(profile.net_imposable_3 !== undefined ? profile.net_imposable_3 : (sourceNI[2] || 0))
  ];
  const avgNI = average_(ni);

  let plafond   = 0;
  let ratioUsed = 0;
  let details   = '';

  switch (statutPro) {
    case 'CDI':
    case 'Fonctionnaire titulaire':
      ratioUsed = typeClient === 'Garant' ? 0.33 : 0.37;
      plafond   = avgNI * ratioUsed;
      details   = statutPro + ' · ratio ' + (ratioUsed * 100).toFixed(0) + '% · base ' + avgNI.toFixed(2);
      break;
    case 'CDD':
      if (compagnie === 'AXA') {
        ratioUsed = 0.25; plafond = avgNI * 0.25;
        details = 'CDD AXA · 25% de ' + avgNI.toFixed(2);
      } else if (compagnie === 'ALLIANZ') {
        if (profile.cdd_moins_12_mois === true || String(profile.cdd_moins_12_mois) === 'true') {
          ratioUsed = 0.37; plafond = (avgNI / 2) * 0.37;
          details = 'CDD ALLIANZ <12 mois · 37% de (net/2)';
        } else {
          ratioUsed = 0.37; plafond = avgNI * 0.37;
          details = 'CDD ALLIANZ ≥12 mois · 37%';
        }
      } else {
        ratioUsed = 0.37; plafond = avgNI * 0.37;
        details = 'CDD (défaut) · 37% de ' + avgNI.toFixed(2);
      }
      break;
    case 'Étudiant':
      ratioUsed = 0.33; plafond = avgNI * 0.33;
      details = 'Étudiant · Garant · 33% de ' + avgNI.toFixed(2);
      break;
    case 'Retraité':
      plafond = 0; details = 'Retraité · règle en attente';
      break;
    case 'TNS':
      plafond = 0; details = 'TNS · règle en attente';
      break;
    default:
      plafond = 0; details = 'Statut pro inconnu : ' + statutPro;
  }

  const revCompMontant = profile.revenu_complementaire_montant !== undefined
    ? profile.revenu_complementaire_montant
    : (profile.montant_complementaire !== undefined ? profile.montant_complementaire : 0);
  const revComp = (profile.revenu_complementaire === true || String(profile.revenu_complementaire) === 'true')
    ? Number(revCompMontant || 0) : 0;

  return {
    plafond:              plafond,
    revenu_complementaire: revComp,
    plafond_avec_revenu:  plafond + revComp,
    avg_net_imposable:    avgNI,
    ratio_used:           ratioUsed,
    details:              details
  };
}

/**
 * Calcule le plafond de loyer pour UN SEUL profil.
 * Nouvelle logique : utilise taux_plafond manuel si présent, sinon fallback legacy.
 *
 * @param {Object} profile
 * @returns {{ plafond, revenu_complementaire, plafond_avec_revenu, avg_net_imposable, ratio_used, details }}
 */
function calculateProfilePlafond_(profile) {
  // ── Fallback legacy si pas de taux_plafond manuel ─────────────
  const tauxRaw = String(profile.taux_plafond || '').trim();
  if (!tauxRaw) {
    return calculateProfilePlafond_Legacy_(profile);
  }

  // ── Taux manuel ───────────────────────────────────────────────
  const sourceNI = Array.isArray(profile.net_imposable)
    ? profile.net_imposable
    : (Array.isArray(profile.salaires) ? profile.salaires : []);
  const ni = [
    Number(profile.net_imposable_1 !== undefined ? profile.net_imposable_1 : (sourceNI[0] || 0)),
    Number(profile.net_imposable_2 !== undefined ? profile.net_imposable_2 : (sourceNI[1] || 0)),
    Number(profile.net_imposable_3 !== undefined ? profile.net_imposable_3 : (sourceNI[2] || 0))
  ];
  const avgNI = average_(ni);

  // Résoudre le taux : 'autre' → taux_plafond_autre ; sinon la valeur directe
  let tauxPct;
  if (tauxRaw === 'autre') {
    tauxPct = Number(profile.taux_plafond_autre || 0);
  } else {
    tauxPct = Number(tauxRaw);
  }
  const ratio   = tauxPct / 100;
  const plafond = avgNI * ratio;

  const revCompMontant = profile.revenu_complementaire_montant !== undefined
    ? profile.revenu_complementaire_montant
    : (profile.montant_complementaire !== undefined ? profile.montant_complementaire : 0);
  const revComp = (profile.revenu_complementaire === true || String(profile.revenu_complementaire) === 'true')
    ? Number(revCompMontant || 0) : 0;

  return {
    plafond:              plafond,
    revenu_complementaire: revComp,
    plafond_avec_revenu:  plafond + revComp,
    avg_net_imposable:    avgNI,
    ratio_used:           ratio,
    details:              'Taux manuel ' + tauxPct + '% · base ' + avgNI.toFixed(2)
  };
}

/**
 * Calcul multi-profils.
 * Appelable depuis le front via rpc('calculateMultiProfileSolvabiliteServer', payload).
 *
 * @param {Object} payload
 * @param {string} payload.type_client
 * @param {string} payload.compagnie
 * @param {number} payload.loyer
 * @param {Array}  payload.profils
 */
function calculateMultiProfileSolvabiliteServer(payload) {
  const typeClient = String(payload.type_client || 'Locataire').trim();
  const compagnie  = String(payload.compagnie   || '').trim();
  const loyer      = Number(payload.loyer        || 0);
  const profils    = Array.isArray(payload.profils) ? payload.profils : [];

  // Si un profil est Étudiant → tout le dossier passe en Garant
  const forceGarant = profils.some(function(p) { return p.statut_pro === 'Étudiant'; });
  const effectifTypeClient = forceGarant ? 'Garant' : typeClient;

  const profileResults = profils.map(function(profil, idx) {
    // Each profil may have its own type_client (Change 1). Fall back to global if not set.
    const profilTypeClient = String(profil.type_client || effectifTypeClient).trim();
    const p = Object.assign({}, profil, {
      type_client: forceGarant ? 'Garant' : profilTypeClient,
      compagnie:   String(profil.compagnie || compagnie).trim()
    });
    const result = calculateProfilePlafond_(p);
    return Object.assign({ profil_index: idx + 1, statut_pro: profil.statut_pro || '' }, result);
  });

  const plafondTotal = profileResults.reduce(function(sum, r) {
    return sum + r.plafond_avec_revenu;
  }, 0);

  return {
    profils_calculs:      profileResults,
    // Alias de compat pour les clients qui lisent encore `result.profils`
    profils:              profileResults,
    plafond_total:        plafondTotal,
    loyer:                loyer,
    type_client_effectif: effectifTypeClient,
    compagnie:            compagnie,
    resultat:             loyer <= plafondTotal ? 'Solvable' : 'Non solvable'
  };
}

/**
 * Calcul mono-profil — rétro-compatibilité avec l'ancien formulaire.
 * Le "net imposable" = brut dans l'ancien modèle.
 */
function calculateSolvabiliteServer(payload) {
  const typeClient    = String(payload.type_client || '');
  const netAPayer     = payload.net_a_payer     || [0, 0, 0];
  const netAvantImpot = payload.net_avant_impot || [0, 0, 0];
  const brut          = payload.brut            || [0, 0, 0];
  const loyer         = Number(payload.loyer    || 0);

  const moyenneNetAPayer     = average_(netAPayer);
  const moyenneNetAvantImpot = average_(netAvantImpot);
  const moyenneBrut          = average_(brut);
  const ratioMax             = typeClient === 'Garant' ? 0.33 : 0.37;
  const plafondLoyer         = moyenneNetAPayer * ratioMax;
  const resultat             = loyer <= plafondLoyer ? 'Solvable' : 'Non solvable';

  return {
    net_a_payer: netAPayer, net_avant_impot: netAvantImpot, brut: brut,
    loyer: loyer,
    moyenne_net_a_payer:     moyenneNetAPayer,
    moyenne_net_avant_impot: moyenneNetAvantImpot,
    moyenne_brut:            moyenneBrut,
    ratio_max:               ratioMax,
    plafond_loyer:           plafondLoyer,
    resultat:                resultat
  };
}

// ── Hydratation ───────────────────────────────────────────────

function hydrateAgrementRow_(row, usersById, teamsById) {
  const netAPayer     = [Number(row.net_a_payer_1 || 0),     Number(row.net_a_payer_2 || 0),     Number(row.net_a_payer_3 || 0)];
  const netAvantImpot = [Number(row.net_avant_impot_1 || 0), Number(row.net_avant_impot_2 || 0), Number(row.net_avant_impot_3 || 0)];
  const brut          = [Number(row.brut_1 || 0),            Number(row.brut_2 || 0),            Number(row.brut_3 || 0)];
  const hasSolvabilite = netAPayer.some(function(v) { return v !== 0; })
    || Number(row.loyer || 0) !== 0
    || Number(row.plafond_final || 0) !== 0;

  row.ambassadeur_assigne_name    = usersById[row.ambassadeur_assigne]    ? usersById[row.ambassadeur_assigne].full_name    : '';
  row.gestionnaire_plus_name      = usersById[row.gestionnaire_plus]      ? usersById[row.gestionnaire_plus].full_name      : '';
  row.equipe_name                 = teamsById[row.equipe_id]              ? teamsById[row.equipe_id].name                  : '';
  row.solvabilite_override_by_name = usersById[row.solvabilite_override_by]
    ? usersById[row.solvabilite_override_by].full_name : '';

  row.solvabilite = hasSolvabilite ? {
    net_a_payer:             netAPayer,
    net_avant_impot:         netAvantImpot,
    brut:                    brut,
    loyer:                   Number(row.loyer                   || 0),
    moyenne_net_a_payer:     Number(row.moyenne_net_a_payer     || 0),
    moyenne_net_avant_impot: Number(row.moyenne_net_avant_impot || 0),
    moyenne_brut:            Number(row.moyenne_brut            || 0),
    ratio_max:               Number(row.ratio_max               || 0),
    plafond_loyer:           Number(row.plafond_loyer           || 0),
    plafond_final:           Number(row.plafond_final           || 0),
    resultat:                row.resultat_solvabilite           || '',
    override:                String(row.solvabilite_override)   === 'TRUE',
    override_commentaire:    row.solvabilite_commentaire        || '',
    override_by_name:        row.solvabilite_override_by_name   || '',
    override_at:             row.solvabilite_override_at        || ''
  } : null;

  // Profils JSON
  row.profils = safeParseJson_(row.profils_json, []);

  return row;
}

// ── Lecture ───────────────────────────────────────────────────

function listAgrements(token, filters) {
  const session   = requireSession_(token);
  const f         = filters || {};
  const usersById = indexBy_(readTable_('USERS'), 'id');
  const teamsById = indexBy_(readTable_('TEAMS'), 'id');

  return scopeAgrements_(session, readTable_('AGREMENTS'))
    .filter(function(r) { return !f.statut       || r.statut       === f.statut;       })
    .filter(function(r) { return !f.type_dossier || normalizeDossierType_(r.type_dossier) === normalizeDossierType_(f.type_dossier); })
    .filter(function(r) { return !f.search       || JSON.stringify(r).toLowerCase().indexOf(String(f.search).toLowerCase()) > -1; })
    .map(function(r) {
      try { return hydrateAgrementRow_(Object.assign({}, r), usersById, teamsById); }
      catch(e) { Logger.log('hydrateAgrementRow_ err ' + r.id + ': ' + e.message); return r; }
    })
    .sort(sortDescBy_('updated_at'));
}

// ── Validation ────────────────────────────────────────────────

function validateAgrementPayload_(row) {
  if (!row.type_dossier) throw new Error('Le type de dossier est obligatoire.');
  if (!row.priorite)     throw new Error('La priorité est obligatoire.');
  if (!row.statut)       throw new Error('Le statut est obligatoire.');
  if (row.statut === 'Validé' && !row.motif_validation) {
    throw new Error('Le motif de validation (Solvable / Non solvable) est obligatoire lorsque le statut est Validé.');
  }
}

// ── Sauvegarde ────────────────────────────────────────────────

function saveAgrement(token, payload) {
  const session  = requireSession_(token);
  const data     = payload || {};
  const rows     = readTable_('AGREMENTS');
  const existing = data.id ? rows.find(function(r) { return r.id === data.id; }) : null;

  if (existing && !scopeAgrements_(session, [existing]).length) {
    throw new Error('Accès refusé à cet agrément.');
  }

  const users = readTable_('USERS');

  // ── Assignation ambassadeur ────────────────────────────────
  // Règle : ambassadeur auto-assigné à lui-même à la création
  let ambassadeurAssigne = String(data.ambassadeur_assigne || (existing && existing.ambassadeur_assigne) || '').trim();

  if (session.role === ROLES.AMBASSADOR) {
    // L'ambassadeur ne peut pas se réassigner à quelqu'un d'autre
    ambassadeurAssigne = existing ? existing.ambassadeur_assigne : session.user.id;
  } else if (session.role === ROLES.TEAM_LEADER) {
    // TL : peut assigner à n'importe quel ambassadeur de son équipe
    if (ambassadeurAssigne) {
      const target = users.find(function(u) { return u.id === ambassadeurAssigne; });
      if (!target || target.team_id !== session.user.team_id) {
        throw new Error('L\'ambassadeur sélectionné n\'appartient pas à votre équipe.');
      }
    }
  }
  // Super Admin : assignation libre

  // ── Équipe déterminée par l'ambassadeur (règle v4) ─────────
  // RÈGLE : La cohérence type_dossier → équipe N'EST PLUS BLOQUANTE.
  // L'équipe = équipe de l'ambassadeur assigné.
  let equipeId = existing ? (existing.equipe_id || '') : '';
  if (ambassadeurAssigne) {
    const amb = users.find(function(u) { return u.id === ambassadeurAssigne; });
    if (amb && amb.team_id) equipeId = amb.team_id;
  }
  // Fallback non bloquant : si toujours vide, essayer la règle AGREMENT_TYPE_TEAM_MAP
  if (!equipeId) {
    equipeId = assignTeamByTypeDossierOptional_(
      data.type_dossier || (existing && existing.type_dossier) || ''
    );
  }

  // ── Profils : migration backward-compat ───────────────────
  const profils  = Array.isArray(data.profils)
    ? data.profils
    : safeParseJson_(data.profils_json, []);

  // Migration : profils sans type_client héritent de 'Locataire'
  profils.forEach(function(p) {
    if (!p.type_client) p.type_client = 'Locataire';
  });

  // ── Type client : dérivé du premier profil (ou 'Garant' si un profil est Étudiant) ──
  const forceGarant = profils.some(function(p) { return String(p.statut_pro || '') === 'Étudiant'; });
  let typeClient;
  if (forceGarant) {
    typeClient = 'Garant';
  } else if (profils.length > 0 && profils[0].type_client) {
    typeClient = String(profils[0].type_client).trim();
  } else {
    // Fallback rétro-compat : lire le champ global si présent
    typeClient = String(data.type_client || (existing && existing.type_client) || 'Locataire').trim();
  }

  // ── Statut / motif ─────────────────────────────────────────
  const statut          = String(data.statut || (existing && existing.statut) || 'Initié').trim();
  const motifValidation = statut === 'Validé'
    ? String(
        data.motif_validation ||
        (existing && existing.motif_validation) ||
        (solv && solv.resultat) ||
        (existing && existing.resultat_solvabilite) ||
        ''
      ).trim()
    : '';

  const solv    = data.solvabilite || null;
  const now     = nowIso_();

  const row = Object.assign({}, existing || {}, {
    id:          existing ? existing.id        : nextId_('AGR'),
    reference:   existing ? existing.reference : nextReference_('AGR'),
    // Infos dossier
    type_dossier:        normalizeDossierType_(data.type_dossier || (existing && existing.type_dossier) || ''),
    no_dossier:          String(data.no_dossier || (existing && existing.no_dossier) || '').trim(),
    priorite:            String(data.priorite   || (existing && existing.priorite)   || 'Normale').trim(),
    client:              String(data.client     || (existing && existing.client)     || '').trim(),
    adresse:             String(data.adresse    || (existing && existing.adresse)    || '').trim(),
    type_client:         typeClient,
    compagnie:           String(data.compagnie  || (existing && existing.compagnie)  || '').trim(),
    // Assignation
    ambassadeur_assigne: ambassadeurAssigne,
    gestionnaire_plus:   String(data.gestionnaire_plus || (existing && existing.gestionnaire_plus) || '').trim(),
    equipe_id:           equipeId,
    // Statuts
    statut:                   statut,
    motif_validation:         motifValidation,
    statut_fin_traitement:    String(data.statut_fin_traitement || (existing && existing.statut_fin_traitement) || '').trim(),
    // Multi-profils
    nombre_profils:   Number(data.nombre_profils || (existing && existing.nombre_profils) || 1),
    profils_json:     profils.length ? JSON.stringify(profils) : (existing ? (existing.profils_json || '') : ''),
    plafond_final:    Number(data.plafond_final  || (existing && existing.plafond_final)  || 0),
    // Solvabilité legacy (mono-profil rétro-compat)
    net_a_payer_1:    solv ? Number(solv.net_a_payer && solv.net_a_payer[0] || 0)     : Number((existing && existing.net_a_payer_1)    || 0),
    net_a_payer_2:    solv ? Number(solv.net_a_payer && solv.net_a_payer[1] || 0)     : Number((existing && existing.net_a_payer_2)    || 0),
    net_a_payer_3:    solv ? Number(solv.net_a_payer && solv.net_a_payer[2] || 0)     : Number((existing && existing.net_a_payer_3)    || 0),
    net_avant_impot_1: solv ? Number(solv.net_avant_impot && solv.net_avant_impot[0] || 0) : Number((existing && existing.net_avant_impot_1) || 0),
    net_avant_impot_2: solv ? Number(solv.net_avant_impot && solv.net_avant_impot[1] || 0) : Number((existing && existing.net_avant_impot_2) || 0),
    net_avant_impot_3: solv ? Number(solv.net_avant_impot && solv.net_avant_impot[2] || 0) : Number((existing && existing.net_avant_impot_3) || 0),
    brut_1: solv ? Number(solv.brut && solv.brut[0] || 0) : Number((existing && existing.brut_1) || 0),
    brut_2: solv ? Number(solv.brut && solv.brut[1] || 0) : Number((existing && existing.brut_2) || 0),
    brut_3: solv ? Number(solv.brut && solv.brut[2] || 0) : Number((existing && existing.brut_3) || 0),
    loyer:                   solv
      ? Number(solv.loyer || 0)
      : Number((data.loyer !== undefined ? data.loyer : ((existing && existing.loyer) || 0)) || 0),
    moyenne_net_a_payer:     solv ? Number(solv.moyenne_net_a_payer || 0)     : Number((existing && existing.moyenne_net_a_payer)     || 0),
    moyenne_net_avant_impot: solv ? Number(solv.moyenne_net_avant_impot || 0) : Number((existing && existing.moyenne_net_avant_impot) || 0),
    moyenne_brut:            solv ? Number(solv.moyenne_brut || 0)            : Number((existing && existing.moyenne_brut)            || 0),
    ratio_max:               solv ? Number(solv.ratio_max || 0)               : Number((existing && existing.ratio_max)               || 0),
    plafond_loyer:           solv ? Number(solv.plafond_loyer || 0)           : Number((existing && existing.plafond_loyer)           || 0),
    resultat_solvabilite:    solv ? String(solv.resultat || '')               : String((existing && existing.resultat_solvabilite)    || ''),
    // Override solvabilité (non réinitialisé lors d'un simple save)
    solvabilite_override:    String((existing && existing.solvabilite_override)    || 'FALSE'),
    solvabilite_commentaire: String((existing && existing.solvabilite_commentaire) || ''),
    solvabilite_override_by: String((existing && existing.solvabilite_override_by) || ''),
    solvabilite_override_at: String((existing && existing.solvabilite_override_at) || ''),
    // Audit
    created_by:  existing ? existing.created_by : session.user.id,
    updated_by:  session.user.id,
    created_at:  existing ? existing.created_at : now,
    updated_at:  now,
    closed_at:   statut === 'Clos' ? ((existing && existing.closed_at) || now) : ''
  });

  validateAgrementPayload_(row);
  upsertRow_('AGREMENTS', 'id', row);
  addAuditLog_(session, existing ? 'UPDATE' : 'CREATE', 'AGREMENT', row.id,
    'Enregistrement agrément', existing, row);

  // Historique de versions
  saveEntityVersion_(session, 'AGREMENT', row.id, row,
    String(data.commentaire_mise_a_jour || '').trim(),
    existing ? 'UPDATE' : 'CREATE');

  const usersById = indexBy_(readTable_('USERS'), 'id');
  const teamsById = indexBy_(readTable_('TEAMS'), 'id');
  return hydrateAgrementRow_(Object.assign({}, row), usersById, teamsById);
}

/**
 * Marque un agrément comme traité (nouveau concept v4.1).
 */
function traiterAgrement(token, id, commentaire) {
  const session  = requireSession_(token);
  const rows     = readTable_('AGREMENTS');
  const existing = rows.find(function(r) { return r.id === id; });

  if (!existing)                                    throw new Error('Agrément introuvable.');
  if (!scopeAgrements_(session, [existing]).length) throw new Error('Accès refusé.');

  const now = nowIso_();
  const row = Object.assign({}, existing, {
    statut:     'Clos',
    closed_at:  now,
    updated_by: session.user.id,
    updated_at: now
  });

  upsertRow_('AGREMENTS', 'id', row);
  addAuditLog_(session, 'TRAITE', 'AGREMENT', row.id, 'Agrément traité', existing, row);
  saveEntityVersion_(session, 'AGREMENT', row.id, row, String(commentaire || '').trim(), 'TRAITE');

  const usersById = indexBy_(readTable_('USERS'), 'id');
  const teamsById = indexBy_(readTable_('TEAMS'), 'id');
  return hydrateAgrementRow_(Object.assign({}, row), usersById, teamsById);
}

// ── Override solvabilité ──────────────────────────────────────

/**
 * Permet à l'ambassadeur (et au-dessus) de rectifier manuellement
 * le statut de solvabilité avec commentaire obligatoire.
 * Audit enregistré.
 */
function overrideSolvabilite(token, agrementId, newResultat, commentaire) {
  const session  = requireSession_(token);
  const rows     = readTable_('AGREMENTS');
  const existing = rows.find(function(r) { return r.id === agrementId; });

  if (!existing)                                    throw new Error('Agrément introuvable.');
  if (!scopeAgrements_(session, [existing]).length) throw new Error('Accès refusé.');

  const valid = ['Solvable', 'Non solvable'];
  if (!valid.includes(newResultat))            throw new Error('Résultat de solvabilité invalide.');
  if (!String(commentaire || '').trim())       throw new Error('Le commentaire est obligatoire pour modifier le statut de solvabilité.');

  const oldResultat = existing.resultat_solvabilite;
  const now         = nowIso_();

  const row = Object.assign({}, existing, {
    resultat_solvabilite:    newResultat,
    solvabilite_override:    'TRUE',
    solvabilite_commentaire: String(commentaire).trim(),
    solvabilite_override_by: session.user.id,
    solvabilite_override_at: now,
    updated_by:              session.user.id,
    updated_at:              now
  });

  upsertRow_('AGREMENTS', 'id', row);
  addAuditLog_(session, 'OVERRIDE_SOLVABILITE', 'AGREMENT', agrementId,
    'Solvabilité modifiée manuellement : ' + oldResultat + ' → ' + newResultat + ' | ' + commentaire,
    { resultat_solvabilite: oldResultat },
    { resultat_solvabilite: newResultat, commentaire: String(commentaire).trim() }
  );

  const usersById = indexBy_(readTable_('USERS'), 'id');
  const teamsById = indexBy_(readTable_('TEAMS'), 'id');
  return hydrateAgrementRow_(Object.assign({}, row), usersById, teamsById);
}

// ── Réassignation ─────────────────────────────────────────────

/**
 * Team Leader ou Admin peut réassigner un dossier à un autre ambassadeur.
 * L'ambassadeur ne peut pas réassigner.
 */
function reassignerAgrement(token, agrementId, newAmbassadeurId) {
  const session  = requireSession_(token);

  if (session.role === ROLES.AMBASSADOR) {
    throw new Error('Les ambassadeurs ne peuvent pas réassigner les dossiers.');
  }

  const rows     = readTable_('AGREMENTS');
  const existing = rows.find(function(r) { return r.id === agrementId; });

  if (!existing)                                    throw new Error('Agrément introuvable.');
  if (!scopeAgrements_(session, [existing]).length) throw new Error('Accès refusé.');

  const users  = readTable_('USERS');
  const newAmb = users.find(function(u) { return u.id === newAmbassadeurId; });
  if (!newAmb || newAmb.role !== ROLES.AMBASSADOR)  throw new Error('Ambassadeur introuvable.');

  if (session.role === ROLES.TEAM_LEADER && newAmb.team_id !== session.user.team_id) {
    throw new Error('L\'ambassadeur sélectionné n\'appartient pas à votre équipe.');
  }

  const oldAmb = existing.ambassadeur_assigne;
  const now    = nowIso_();

  // Équipe mise à jour selon le nouvel ambassadeur
  const newEquipeId = newAmb.team_id || existing.equipe_id;

  const row = Object.assign({}, existing, {
    ambassadeur_assigne: newAmbassadeurId,
    equipe_id:           newEquipeId,
    updated_by:          session.user.id,
    updated_at:          now
  });

  upsertRow_('AGREMENTS', 'id', row);
  addAuditLog_(session, 'REASSIGN', 'AGREMENT', agrementId,
    'Réassignation : ' + oldAmb + ' → ' + newAmbassadeurId,
    { ambassadeur_assigne: oldAmb, equipe_id: existing.equipe_id },
    { ambassadeur_assigne: newAmbassadeurId, equipe_id: newEquipeId }
  );

  const usersById = indexBy_(readTable_('USERS'), 'id');
  const teamsById = indexBy_(readTable_('TEAMS'), 'id');
  return hydrateAgrementRow_(Object.assign({}, row), usersById, teamsById);
}
// ============================================================
// SECTION 11 — MODULE SINISTRE v4
// Commentaire · Historique · Re-traitement après mise à jour
// ============================================================

function listSinistres(token, filters) {
  const session   = requireSession_(token);
  const f         = filters || {};
  const usersById = indexBy_(readTable_('USERS'), 'id');

  return scopeSinistres_(session, readTable_('SINISTRES'))
    .filter(function(r) { return !f.statut    || r.statut    === f.statut;    })
    .filter(function(r) { return !f.situation || r.situation === f.situation; })
    .filter(function(r) {
      return !f.search || JSON.stringify(r).toLowerCase().indexOf(String(f.search).toLowerCase()) > -1;
    })
    .map(function(r) {
      r.created_by_name = usersById[r.created_by] ? usersById[r.created_by].full_name : '';
      r.delai_formate   = formatDelai_(r.delai_secondes);
      r.historique      = safeParseJson_(r.historique_json, []);
      return r;
    })
    .sort(sortDescBy_('updated_at'));
}

function saveSinistre(token, payload) {
  const session  = requireSession_(token);
  const data     = payload || {};
  const rows     = readTable_('SINISTRES');
  const existing = data.id ? rows.find(function(r) { return r.id === data.id; }) : null;

  if (existing && !scopeSinistres_(session, [existing]).length) {
    throw new Error('Accès refusé à ce sinistre.');
  }

  const wasTraite = existing && existing.statut === 'Traité';

  // Règle : mise à jour d'un dossier traité → commentaire obligatoire
  if (wasTraite && !String(data.commentaire || '').trim()) {
    throw new Error('Un commentaire est obligatoire pour modifier un sinistre déjà traité.');
  }

  const noSinistre    = String(data.no_sinistre || (existing && existing.no_sinistre) || '').trim();
  const noContrat     = String(data.no_contrat  || (existing && existing.no_contrat)  || '').trim();
  const commentaire   = String(data.commentaire || (existing && existing.commentaire) || '').trim();
  if (!noSinistre) throw new Error('Le N° de sinistre est obligatoire.');
  if (!noContrat)  throw new Error('Le N° de contrat est obligatoire.');

  const completude = String(data.completude || (existing && existing.completude) || '').trim();
  const isNew      = !existing;

  // ── Règles métier situation & statut ──────────────────────
  let situation, statut;

  if (wasTraite) {
    // Dossier traité remis à jour → repasse en traitement
    statut    = completude === 'OK' ? 'Complet' : 'Relance';
    situation = 'Complément';
  } else if (completude === 'OK') {
    statut    = 'Complet';
    situation = isNew ? 'Nouvelle déclaration' : 'Complément';
  } else if (completude === 'KO') {
    statut    = 'Relance';
    situation = 'En attente';
  } else {
    statut    = existing ? (existing.statut    || 'Relance') : 'Relance';
    situation = isNew    ? 'Nouvelle déclaration' : (existing.situation || 'Complément');
  }

  // ── Historique des mises à jour ───────────────────────────
  const historique = safeParseJson_(existing && existing.historique_json, []);
  if (existing) {
    historique.push({
      timestamp:   nowIso_(),
      user_id:     session.user.id,
      user_name:   session.user.full_name,
      action:      wasTraite ? 'MISE_A_JOUR_APRES_TRAITEMENT' : 'MISE_A_JOUR',
      commentaire: commentaire,
      old_statut:  existing.statut,
      new_statut:  statut
    });
  }

  const now = nowIso_();
  const row = Object.assign({}, existing || {}, {
    id:            existing ? existing.id        : nextId_('SIN'),
    reference:     existing ? existing.reference : nextReference_('SIN'),
    no_sinistre:   noSinistre,
    no_contrat:    noContrat,
    date_reception: String(data.date_reception || (existing && existing.date_reception) || '').trim(),
    gestionnaire:   String(data.gestionnaire   || (existing && existing.gestionnaire)   || '').trim(),
    commentaire:    commentaire,
    completude:     completude,
    situation:      situation,
    statut:         statut,
    historique_json: JSON.stringify(historique),
    created_by:    existing ? existing.created_by : session.user.id,
    created_at:    existing ? existing.created_at : now,
    updated_at:    now,
    // Réinitialisation du traitement si remise en travail
    traite_at:      wasTraite ? '' : (existing ? (existing.traite_at || '') : ''),
    delai_secondes: wasTraite ? 0  : (existing ? (existing.delai_secondes || 0) : 0),
    // Horodatage de début de traitement : mis à jour à chaque mise à jour
    delai_traitement_start: existing ? now : now
  });

  upsertRow_('SINISTRES', 'id', row);
  const actionType = existing ? (wasTraite ? 'UPDATE_AFTER_TREATMENT' : 'UPDATE') : 'CREATE';
  addAuditLog_(session, actionType, 'SINISTRE', row.id,
    wasTraite ? 'Sinistre remis en traitement après mise à jour' : 'Enregistrement sinistre',
    existing, row);
  saveEntityVersion_(session, 'SINISTRE', row.id, row,
    String(data.commentaire_mise_a_jour || '').trim(), actionType);
  return row;
}

/**
 * Clôture un sinistre et calcule le délai de traitement.
 * Fonctionne aussi pour les dossiers remis en traitement après une mise à jour.
 */
function traiterSinistre(token, id) {
  const session  = requireSession_(token);
  const rows     = readTable_('SINISTRES');
  const existing = rows.find(function(r) { return r.id === id; });

  if (!existing)                                    throw new Error('Sinistre introuvable.');
  if (!scopeSinistres_(session, [existing]).length) throw new Error('Accès refusé.');
  if (existing.statut === 'Traité')                 throw new Error('Ce sinistre est déjà traité. Faites une mise à jour avant de re-traiter.');

  const now       = nowIso_();
  // Délai calculé depuis delai_traitement_start si disponible, sinon created_at
  const startMs   = parseDateMs_(existing.delai_traitement_start || existing.created_at);
  const nowMs     = parseDateMs_(now);
  const delai     = Math.max(0, Math.round((nowMs - startMs) / 1000));

  // Historique : enregistre l'action Traité
  const historique = safeParseJson_(existing.historique_json, []);
  historique.push({
    timestamp:   now,
    user_id:     session.user.id,
    user_name:   session.user.full_name,
    action:      'TRAITE',
    commentaire: '',
    old_statut:  existing.statut,
    new_statut:  'Traité'
  });

  const row = Object.assign({}, existing, {
    statut:          'Traité',
    traite_at:       now,
    delai_secondes:  delai,
    updated_at:      now,
    historique_json: JSON.stringify(historique)
  });

  upsertRow_('SINISTRES', 'id', row);
  addAuditLog_(session, 'TRAITE', 'SINISTRE', row.id, 'Sinistre traité', existing, row);
  saveEntityVersion_(session, 'SINISTRE', row.id, row, '', 'TRAITE');

  const usersById = indexBy_(readTable_('USERS'), 'id');
  row.created_by_name = usersById[row.created_by] ? usersById[row.created_by].full_name : '';
  row.delai_formate   = formatDelai_(row.delai_secondes);
  row.historique      = safeParseJson_(row.historique_json, []);
  return row;
}
// ============================================================
// SECTION 12 — MODULE FACTURE v4
// Étapes partielles · Workflow Remonté / Vérifié
// ============================================================

function listFactures(token, filters) {
  const session   = requireSession_(token);
  const f         = filters || {};
  const usersById = indexBy_(readTable_('USERS'), 'id');

  return scopeFactures_(session, readTable_('FACTURES'))
    .filter(function(r) { return !f.statut || r.statut === f.statut; })
    .filter(function(r) {
      return !f.search || JSON.stringify(r).toLowerCase().indexOf(String(f.search).toLowerCase()) > -1;
    })
    .map(function(r) {
      r.created_by_name = usersById[r.created_by] ? usersById[r.created_by].full_name : '';
      r.verifie_par_name = usersById[r.verifie_par] ? usersById[r.verifie_par].full_name : '';
      r.delai_formate   = formatDelai_(r.delai_secondes);
      r.progression     = [r.etape_verification, r.etape_calcul, r.etape_reglement]
        .filter(function(v) { return v === true || String(v).toUpperCase() === 'TRUE'; }).length;
      return r;
    })
    // Dossiers Vérifié remontent en tête de liste
    .sort(function(a, b) {
      const av = (a.verifie_badge === true || String(a.verifie_badge).toUpperCase() === 'TRUE') ? 1 : 0;
      const bv = (b.verifie_badge === true || String(b.verifie_badge).toUpperCase() === 'TRUE') ? 1 : 0;
      if (bv !== av) return bv - av;
      return String(b.updated_at || '').localeCompare(String(a.updated_at || ''));
    });
}

/** Liste uniquement les dossiers en statut "Remonté" (pour Team Leaders / Admin) */
function listFacturesRemontees(token) {
  const session   = requireSession_(token);
  if (session.role === ROLES.AMBASSADOR) throw new Error('Accès non autorisé.');

  const usersById = indexBy_(readTable_('USERS'), 'id');

  return scopeFactures_(session, readTable_('FACTURES'))
    .filter(function(r) { return r.statut === 'Remonté'; })
    .map(function(r) {
      r.created_by_name = usersById[r.created_by] ? usersById[r.created_by].full_name : '';
      r.delai_formate   = formatDelai_(r.delai_secondes);
      r.progression     = [r.etape_verification, r.etape_calcul, r.etape_reglement]
        .filter(function(v) { return v === true || String(v).toUpperCase() === 'TRUE'; }).length;
      return r;
    })
    .sort(sortDescBy_('remonte_at'));
}

function saveFacture(token, payload) {
  const session  = requireSession_(token);
  const data     = payload || {};
  const rows     = readTable_('FACTURES');
  const existing = data.id ? rows.find(function(r) { return r.id === data.id; }) : null;

  if (existing && !scopeFactures_(session, [existing]).length) {
    throw new Error('Accès refusé à cette facture.');
  }

  const noSinistre = String(data.no_sinistre || (existing && existing.no_sinistre) || '').trim();
  if (!noSinistre) throw new Error('Le N° de sinistre est obligatoire.');

  const now = nowIso_();
  const row = Object.assign({}, existing || {}, {
    id:        existing ? existing.id        : nextId_('FAC'),
    reference: existing ? existing.reference : nextReference_('FAC'),
    no_sinistre: noSinistre,
    etape_verification: data.etape_verification !== undefined
      ? toBool_(data.etape_verification)
      : (existing ? (existing.etape_verification || 'FALSE') : 'FALSE'),
    etape_calcul: data.etape_calcul !== undefined
      ? toBool_(data.etape_calcul)
      : (existing ? (existing.etape_calcul || 'FALSE') : 'FALSE'),
    etape_reglement: data.etape_reglement !== undefined
      ? toBool_(data.etape_reglement)
      : (existing ? (existing.etape_reglement || 'FALSE') : 'FALSE'),
    commentaire_traitement: String(data.commentaire_traitement || (existing && existing.commentaire_traitement) || '').trim(),
    statut:        existing ? (existing.statut || 'En cours') : 'En cours',
    verifie_badge: existing ? (existing.verifie_badge || 'FALSE') : 'FALSE',
    verifie_at:    existing ? (existing.verifie_at    || '')      : '',
    verifie_par:   existing ? (existing.verifie_par   || '')      : '',
    remonte_at:    existing ? (existing.remonte_at    || '')      : '',
    created_by:    existing ? existing.created_by : session.user.id,
    created_at:    existing ? existing.created_at : now,
    updated_at:    now,
    traite_at:      existing ? (existing.traite_at     || '') : '',
    delai_secondes: existing ? (existing.delai_secondes || 0) : 0,
    // Horodatage de début de traitement : mis à jour à chaque save
    delai_traitement_start: existing ? now : now
  });

  upsertRow_('FACTURES', 'id', row);
  const actionType = existing ? 'UPDATE' : 'CREATE';
  addAuditLog_(session, actionType, 'FACTURE', row.id, 'Enregistrement facture', existing, row);
  saveEntityVersion_(session, 'FACTURE', row.id, row,
    String(data.commentaire_mise_a_jour || '').trim(), actionType);
  return row;
}

/**
 * Traite ou remonte une facture.
 *
 * Logique :
 *  1. Toutes les étapes cochées → traitement direct (statut = Traité)
 *  2. Dossier Vérifié par TL → traitement autorisé même si étapes incomplètes
 *  3. Étapes incomplètes sans vérification → commentaire obligatoire → statut = Remonté
 *
 * @param {string}  token
 * @param {string}  id
 * @param {Object}  options         - { commentaire }
 */
function traiterFacture(token, id, options) {
  const session  = requireSession_(token);
  const rows     = readTable_('FACTURES');
  const existing = rows.find(function(r) { return r.id === id; });
  const opts     = options || {};

  if (!existing)                                    throw new Error('Facture introuvable.');
  if (!scopeFactures_(session, [existing]).length)  throw new Error('Accès refusé.');
  if (existing.statut === 'Traité')                 throw new Error('Cette facture est déjà traitée.');

  // Utiliser les étapes depuis opts si fournies (clic direct sur Traiter),
  // sinon fallback sur les valeurs enregistrées dans le sheet.
  const curVeri = opts.etape_verification !== undefined ? toBool_(opts.etape_verification) : (existing.etape_verification || 'FALSE');
  const curCalc = opts.etape_calcul       !== undefined ? toBool_(opts.etape_calcul)       : (existing.etape_calcul       || 'FALSE');
  const curRegl = opts.etape_reglement    !== undefined ? toBool_(opts.etape_reglement)    : (existing.etape_reglement    || 'FALSE');

  const veri      = curVeri === true || String(curVeri).toUpperCase() === 'TRUE';
  const calc      = curCalc === true || String(curCalc).toUpperCase() === 'TRUE';
  const regl      = curRegl === true || String(curRegl).toUpperCase() === 'TRUE';
  const allDone   = veri && calc && regl;
  const isVerifie = existing.verifie_badge === true || String(existing.verifie_badge).toUpperCase() === 'TRUE';
  const commentaire = String(opts.commentaire || '').trim();

  // Cas 3 : étapes incomplètes, pas encore vérifiée → Remonté
  if (!allDone && !isVerifie) {
    if (!commentaire) {
      throw new Error('Un commentaire est obligatoire pour justifier les étapes non complétées.');
    }
    const now_r = nowIso_();
    const row_r = Object.assign({}, existing, {
      etape_verification:     curVeri,
      etape_calcul:           curCalc,
      etape_reglement:        curRegl,
      commentaire_traitement: commentaire,
      statut:     'Remonté',
      remonte_at: now_r,
      updated_at: now_r
    });
    upsertRow_('FACTURES', 'id', row_r);
    addAuditLog_(session, 'REMONTE', 'FACTURE', row_r.id,
      'Facture remontée pour vérification TL. Commentaire : ' + commentaire, existing, row_r);
    saveEntityVersion_(session, 'FACTURE', row_r.id, row_r, commentaire, 'REMONTE');
    const uid_r = indexBy_(readTable_('USERS'), 'id');
    row_r.created_by_name = uid_r[row_r.created_by] ? uid_r[row_r.created_by].full_name : '';
    row_r.delai_formate   = formatDelai_(row_r.delai_secondes);
    row_r.progression     = [row_r.etape_verification, row_r.etape_calcul, row_r.etape_reglement]
      .filter(function(v) { return String(v) === 'TRUE'; }).length;
    return Object.assign(row_r, { is_remonte: true });
  }

  // Cas 1 & 2 : traitement final
  const now       = nowIso_();
  const startMs   = parseDateMs_(existing.delai_traitement_start || existing.created_at);
  const nowMs     = parseDateMs_(now);
  const delai     = Math.max(0, Math.round((nowMs - startMs) / 1000));

  const row = Object.assign({}, existing, {
    etape_verification:     curVeri,
    etape_calcul:           curCalc,
    etape_reglement:        curRegl,
    commentaire_traitement: commentaire || (existing.commentaire_traitement || ''),
    statut:         'Traité',
    traite_at:      now,
    delai_secondes: delai,
    updated_at:     now
  });

  upsertRow_('FACTURES', 'id', row);
  addAuditLog_(session, 'TRAITE', 'FACTURE', row.id,
    isVerifie ? 'Facture traitée (après vérification TL)' : 'Facture traitée',
    existing, row);
  saveEntityVersion_(session, 'FACTURE', row.id, row, commentaire, 'TRAITE');

  const usersById = indexBy_(readTable_('USERS'), 'id');
  row.created_by_name  = usersById[row.created_by]  ? usersById[row.created_by].full_name  : '';
  row.verifie_par_name = usersById[row.verifie_par] ? usersById[row.verifie_par].full_name : '';
  row.delai_formate    = formatDelai_(row.delai_secondes);
  row.progression      = 3;
  return row;
}

/**
 * Vérification d'un dossier remonté par un Team Leader ou Admin.
 * Après vérification : statut = 'Vérifié', verifie_badge = 'TRUE'.
 * Le dossier revient dans la liste Factures et remonte en tête.
 */
function verifierFacture(token, id) {
  const session  = requireSession_(token);

  if (session.role === ROLES.AMBASSADOR) {
    throw new Error('Seuls les Team Leaders et Admins peuvent vérifier les factures.');
  }

  const rows     = readTable_('FACTURES');
  const existing = rows.find(function(r) { return r.id === id; });

  if (!existing)                                    throw new Error('Facture introuvable.');
  if (!scopeFactures_(session, [existing]).length)  throw new Error('Accès refusé.');
  if (existing.statut !== 'Remonté')                throw new Error('Cette facture n\'est pas en statut "Remonté".');

  const now = nowIso_();
  const row = Object.assign({}, existing, {
    statut:       'Vérifié',
    verifie_badge: 'TRUE',
    verifie_at:   now,
    verifie_par:  session.user.id,
    updated_at:   now
  });

  upsertRow_('FACTURES', 'id', row);
  addAuditLog_(session, 'VERIFIE', 'FACTURE', row.id,
    'Facture vérifiée par ' + session.user.full_name, existing, row);
  saveEntityVersion_(session, 'FACTURE', row.id, row, '', 'VERIFIE');

  const usersById = indexBy_(readTable_('USERS'), 'id');
  row.created_by_name  = usersById[row.created_by]  ? usersById[row.created_by].full_name  : '';
  row.verifie_par_name = usersById[row.verifie_par] ? usersById[row.verifie_par].full_name : '';
  row.delai_formate    = formatDelai_(row.delai_secondes);
  row.progression      = [row.etape_verification, row.etape_calcul, row.etape_reglement]
    .filter(function(v) { return String(v) === 'TRUE'; }).length;
  return row;
}
// ============================================================
// SECTION 13 — MODULE RÉSILIATION (inchangé)
// ============================================================

function listResiliations(token, filters) {
  const session   = requireSession_(token);
  const f         = filters || {};
  const usersById = indexBy_(readTable_('USERS'), 'id');

  return scopeResiliations_(session, readTable_('RESILIATIONS'))
    .filter(function(r) { return !f.statut || r.statut === f.statut; })
    .filter(function(r) {
      return !f.search || JSON.stringify(r).toLowerCase().indexOf(String(f.search).toLowerCase()) > -1;
    })
    .map(function(r) {
      r.created_by_name = usersById[r.created_by] ? usersById[r.created_by].full_name : '';
      r.delai_formate   = formatDelai_(r.delai_ouverture_soumission_secondes);
      return r;
    })
    .sort(sortDescBy_('updated_at'));
}

function saveResiliation(token, payload) {
  const session  = requireSession_(token);
  const data     = payload || {};
  const rows     = readTable_('RESILIATIONS');
  const existing = data.id ? rows.find(function(r) { return r.id === data.id; }) : null;

  if (existing && !scopeResiliations_(session, [existing]).length) {
    throw new Error('Accès refusé à cette résiliation.');
  }

  const noContrat = String(data.no_contrat || (existing && existing.no_contrat) || '').trim();
  if (!noContrat) throw new Error('Le N° de contrat est obligatoire.');

  const origine = String(data.origine || (existing && existing.origine) || '').trim();
  if (!existing && !origine) throw new Error('L\'origine est obligatoire.');

  const now = nowIso_();
  const row = Object.assign({}, existing || {}, {
    id:        existing ? existing.id        : nextId_('RES'),
    reference: existing ? existing.reference : nextReference_('RES'),
    origine:    origine,
    mail:       String(data.mail        || (existing && existing.mail)       || '').trim(),
    no_contrat: noContrat,
    completude: String(data.completude  || (existing && existing.completude) || '').trim(),
    resil:      String(data.resil       || (existing && existing.resil)      || '').trim(),
    commentaire: String(data.commentaire|| (existing && existing.commentaire)|| '').trim(),
    statut:     existing ? (existing.statut || 'En cours') : 'En cours',
    created_by: existing ? existing.created_by : session.user.id,
    created_at: existing ? existing.created_at : now,
    updated_at: now,
    soumis_at:  existing ? (existing.soumis_at || '') : '',
    delai_ouverture_soumission_secondes: existing
      ? (existing.delai_ouverture_soumission_secondes || 0) : 0,
    // Horodatage de début de traitement : mis à jour à chaque save
    delai_traitement_start: existing ? now : now
  });

  upsertRow_('RESILIATIONS', 'id', row);
  const actionType = existing ? 'UPDATE' : 'CREATE';
  addAuditLog_(session, actionType, 'RESILIATION', row.id, 'Enregistrement résiliation', existing, row);
  saveEntityVersion_(session, 'RESILIATION', row.id, row,
    String(data.commentaire_mise_a_jour || '').trim(), actionType);
  return row;
}

function soumettreResiliation(token, id, payload) {
  const session  = requireSession_(token);
  const rows     = readTable_('RESILIATIONS');
  const existing = rows.find(function(r) { return r.id === id; });

  if (!existing)                                        throw new Error('Résiliation introuvable.');
  if (!scopeResiliations_(session, [existing]).length)  throw new Error('Accès refusé.');

  const data        = payload || {};
  const completude  = String(data.completude  || existing.completude  || '').trim();
  const resil       = String(data.resil       || existing.resil       || '').trim();
  const commentaire = String(data.commentaire || existing.commentaire || '').trim();

  if (!completude)                                     throw new Error('La complétude est obligatoire.');
  if (completude === 'OK' && !resil)                   throw new Error('Le résultat Résil est obligatoire.');
  if (completude === 'OK' && resil === 'Résil KO' && !commentaire) {
    throw new Error('Le commentaire est obligatoire quand Résil = KO.');
  }

  let statut;
  if (completude === 'KO')              statut = 'Relance';
  else if (completude === 'OK' && resil) statut = 'Traité';
  else                                   statut = 'En cours';

  const now       = nowIso_();
  const startMs   = parseDateMs_(existing.delai_traitement_start || existing.created_at);
  const delai     = Math.max(0, Math.round((parseDateMs_(now) - startMs) / 1000));

  const row = Object.assign({}, existing, {
    completude:   completude,
    resil:        resil,
    commentaire:  commentaire,
    statut:       statut,
    soumis_at:    now,
    delai_ouverture_soumission_secondes: delai,
    updated_at:   now
  });

  upsertRow_('RESILIATIONS', 'id', row);
  addAuditLog_(session, 'UPDATE', 'RESILIATION', row.id, 'Soumission résiliation', existing, row);
  saveEntityVersion_(session, 'RESILIATION', row.id, row, String(commentaire || ''), 'SOUMIS');

  const usersById = indexBy_(readTable_('USERS'), 'id');
  row.created_by_name = usersById[row.created_by] ? usersById[row.created_by].full_name : '';
  row.delai_formate   = formatDelai_(row.delai_ouverture_soumission_secondes);
  return row;
}
// ============================================================
// SECTION 14 — DASHBOARD
// ============================================================

function buildStatusBreakdown_(rows, field) {
  const map = {};
  rows.forEach(function(r) {
    const key = r[field] || 'Sans statut';
    map[key] = (map[key] || 0) + 1;
  });
  return Object.keys(map).map(function(key) {
    return { label: key, value: map[key] };
  }).sort(function(a, b) { return b.value - a.value; });
}

function buildTeamPerformance_() {
  const teams    = readTable_('TEAMS');
  const users    = readTable_('USERS');
  const agrements = readTable_('AGREMENTS');

  return teams.map(function(team) {
    return {
      equipe:              team.name,
      ambassadeurs:        users.filter(function(u) { return u.team_id === team.id && u.role === ROLES.AMBASSADOR; }).length,
      'agréments_ouverts': agrements.filter(function(d) { return d.equipe_id === team.id && d.statut !== 'Clos'; }).length
    };
  }).sort(function(a, b) { return b['agréments_ouverts'] - a['agréments_ouverts']; });
}

function buildAmbassadorPerformance_(session) {
  const users    = scopeUsers_(session, readTable_('USERS')).filter(function(u) { return u.role === ROLES.AMBASSADOR; });
  const agrements = scopeAgrements_(session, readTable_('AGREMENTS'));

  return users.map(function(user) {
    return {
      nom:                 user.full_name,
      'agréments_ouverts': agrements.filter(function(d) { return d.ambassadeur_assigne === user.id && d.statut !== 'Clos'; }).length,
      validés:             agrements.filter(function(d) { return d.ambassadeur_assigne === user.id && d.statut === 'Validé'; }).length
    };
  }).sort(function(a, b) { return b['agréments_ouverts'] - a['agréments_ouverts']; });
}

function buildModuleStats_(session) {
  const sinistres    = scopeSinistres_(session,    readTable_('SINISTRES'));
  const factures     = scopeFactures_(session,     readTable_('FACTURES'));
  const resiliations = scopeResiliations_(session, readTable_('RESILIATIONS'));

  return {
    sinistre: {
      total:    sinistres.length,
      complets: sinistres.filter(function(r) { return r.statut === 'Complet';  }).length,
      relances: sinistres.filter(function(r) { return r.statut === 'Relance';  }).length,
      traites:  sinistres.filter(function(r) { return r.statut === 'Traité';   }).length
    },
    facture: {
      total:     factures.length,
      en_cours:  factures.filter(function(r) { return r.statut === 'En cours';  }).length,
      remontees: factures.filter(function(r) { return r.statut === 'Remonté';   }).length,
      verifiees: factures.filter(function(r) { return r.statut === 'Vérifié';   }).length,
      traites:   factures.filter(function(r) { return r.statut === 'Traité';    }).length
    },
    resiliation: {
      total:    resiliations.length,
      en_cours: resiliations.filter(function(r) { return r.statut === 'En cours'; }).length,
      relances: resiliations.filter(function(r) { return r.statut === 'Relance';  }).length,
      traites:  resiliations.filter(function(r) { return r.statut === 'Traité';   }).length
    }
  };
}

function getDashboardData(token) {
  const session  = requireSession_(token);
  const presence = getPresenceSummary(token, todayKey_());
  const ambassadorPresence = presence.rows.filter(function(r) { return r.role === ROLES.AMBASSADOR; });
  const moduleStats        = buildModuleStats_(session);

  if (session.role === ROLES.SUPER_ADMIN) {
    const users    = readTable_('USERS');
    const teams    = readTable_('TEAMS');
    const agrements = readTable_('AGREMENTS');

    return {
      scopeLabel: 'Vision globale',
      kpis: [
        { label: 'Utilisateurs actifs',    value: users.filter(function(u) { return u.status === 'Actif'; }).length,         tone: 'primary' },
        { label: 'Équipes',                value: teams.length,                                                               tone: 'neutral' },
        { label: 'Agréments ouverts',      value: agrements.filter(function(d) { return d.statut !== 'Clos'; }).length,      tone: 'warning' },
        { label: 'Agréments validés',      value: agrements.filter(function(d) { return d.statut === 'Validé'; }).length,    tone: 'success' },
        { label: 'Sinistres actifs',       value: moduleStats.sinistre.total - moduleStats.sinistre.traites,                  tone: 'warning' },
        { label: 'Factures remontées',     value: moduleStats.facture.remontees,                                              tone: 'danger'  },
        { label: 'Connexions du jour',     value: presence.total_connections,                                                 tone: 'primary' },
        { label: 'Déconnexions du jour',   value: presence.total_disconnections,                                              tone: 'danger'  }
      ],
      statusBreakdown:    buildStatusBreakdown_(agrements, 'statut'),
      performance:        buildTeamPerformance_(),
      moduleStats:        moduleStats,
      ambassadorPresence: ambassadorPresence,
      presenceSummary:    { total_users: presence.total_users, online_now: presence.online_now, total_online_seconds: presence.total_online_seconds }
    };
  }

  if (session.role === ROLES.TEAM_LEADER) {
    const users    = scopeUsers_(session, readTable_('USERS'));
    const agrements = scopeAgrements_(session, readTable_('AGREMENTS'));

    return {
      scopeLabel: 'Mon équipe',
      kpis: [
        { label: 'Ambassadeurs actifs', value: users.filter(function(u) { return u.role === ROLES.AMBASSADOR && u.status === 'Actif'; }).length, tone: 'primary' },
        { label: 'En attente',          value: agrements.filter(function(d) { return d.statut === 'En attente de traitement'; }).length,         tone: 'warning' },
        { label: 'En cours',            value: agrements.filter(function(d) { return d.statut === 'En cours de traitement'; }).length,           tone: 'warning' },
        { label: 'Validés',             value: agrements.filter(function(d) { return d.statut === 'Validé'; }).length,                           tone: 'success' },
        { label: 'Factures remontées',  value: moduleStats.facture.remontees,                                                                    tone: 'danger'  },
        { label: 'Connexions du jour',  value: presence.total_connections,                                                                       tone: 'primary' }
      ],
      statusBreakdown:    buildStatusBreakdown_(agrements, 'statut'),
      performance:        buildAmbassadorPerformance_(session),
      moduleStats:        moduleStats,
      ambassadorPresence: ambassadorPresence,
      presenceSummary:    { total_users: presence.total_users, online_now: presence.online_now, total_online_seconds: presence.total_online_seconds }
    };
  }

  // Ambassador
  const agrements = scopeAgrements_(session, readTable_('AGREMENTS'));
  return {
    scopeLabel: 'Mon activité',
    kpis: [
      { label: 'Mes agréments ouverts', value: agrements.filter(function(d) { return d.statut !== 'Clos'; }).length,                    tone: 'primary' },
      { label: 'En attente',            value: agrements.filter(function(d) { return d.statut === 'En attente de traitement'; }).length,  tone: 'warning' },
      { label: 'En cours',              value: agrements.filter(function(d) { return d.statut === 'En cours de traitement'; }).length,    tone: 'warning' },
      { label: 'Validés',               value: agrements.filter(function(d) { return d.statut === 'Validé'; }).length,                    tone: 'success' },
      { label: 'Mes connexions',        value: presence.total_connections,                                                                tone: 'primary' }
    ],
    statusBreakdown:    buildStatusBreakdown_(agrements, 'statut'),
    performance:        [],
    moduleStats:        moduleStats,
    ambassadorPresence: [],
    presenceSummary:    { total_users: 1, online_now: 1, total_online_seconds: presence.total_online_seconds }
  };
}
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
// ============================================================
// SECTION 16 — VERSIONS D'ENTITÉS + RECHERCHE GLOBALE
// ============================================================

// ── Historique immuable des entités ──────────────────────────

/**
 * Sauvegarde un snapshot de version pour une entité.
 * Appelé depuis saveAgrement, saveSinistre, saveFacture,
 * saveResiliation, traiterSinistre, traiterFacture,
 * verifierFacture, soumettreResiliation.
 *
 * @param {Object} session       - session courante
 * @param {string} entityType    - 'AGREMENT' | 'SINISTRE' | 'FACTURE' | 'RESILIATION'
 * @param {string} entityId
 * @param {Object} snapshot      - objet row complet
 * @param {string} commentaire   - commentaire de mise à jour (optionnel)
 * @param {string} actionType    - 'CREATE' | 'UPDATE' | 'TRAITE' | etc.
 */
function saveEntityVersion_(session, entityType, entityId, snapshot, commentaire, actionType) {
  try {
    const existing = readTable_('ENTITY_VERSIONS')
      .filter(function(v) {
        return v.entity_type === entityType && v.entity_id === entityId;
      });
    const versionNum = existing.length + 1;

    upsertRow_('ENTITY_VERSIONS', 'id', {
      id:            nextId_('VER'),
      entity_type:   entityType,
      entity_id:     entityId,
      version_num:   versionNum,
      snapshot_json: safeJson_(snapshot),
      commentaire:   String(commentaire || ''),
      action_type:   String(actionType || 'UPDATE'),
      user_id:       session && session.user ? (session.user.id || '') : '',
      user_name:     session && session.user ? (session.user.full_name || '') : '',
      created_at:    nowIso_()
    });
  } catch(e) {
    // Non bloquant — ne pas empêcher la sauvegarde principale
    Logger.log('saveEntityVersion_ error: ' + e.message);
  }
}

/**
 * Retourne les versions d'une entité, triées desc par version_num.
 */
function getEntityVersions(token, entityType, entityId) {
  const session = requireSession_(token);
  // Vérifier que l'entité est visible par l'utilisateur
  if (!entityType || !entityId) throw new Error('entityType et entityId sont requis.');

  return readTable_('ENTITY_VERSIONS')
    .filter(function(v) {
      return v.entity_type === entityType && v.entity_id === entityId;
    })
    .sort(function(a, b) {
      return Number(b.version_num || 0) - Number(a.version_num || 0);
    });
}

// ── Recherche globale ─────────────────────────────────────────

/**
 * Recherche transversale sur tous les modules.
 *
 * @param {string} token
 * @param {string} query   - terme de recherche
 * @param {Array}  modules - ['agrement','sinistre','facture','resiliation'] (tous si vide)
 */
function globalSearch(token, query, modules) {
  const session    = requireSession_(token);
  const q          = String(query || '').trim().toLowerCase();
  if (q.length < 2) return [];

  const mods       = Array.isArray(modules) && modules.length
    ? modules.map(function(m) { return String(m).toLowerCase(); })
    : ['agrement', 'sinistre', 'facture', 'resiliation'];

  const usersById  = indexBy_(readTable_('USERS'), 'id');
  const results    = [];

  if (mods.indexOf('agrement') > -1) {
    scopeAgrements_(session, readTable_('AGREMENTS'))
      .filter(function(r) {
        return (r.reference || '').toLowerCase().indexOf(q) > -1 ||
               (r.no_dossier || '').toLowerCase().indexOf(q) > -1 ||
               (r.client || '').toLowerCase().indexOf(q) > -1 ||
               (r.ambassadeur_assigne || '').toLowerCase().indexOf(q) > -1 ||
               ((usersById[r.ambassadeur_assigne] || {}).full_name || '').toLowerCase().indexOf(q) > -1 ||
               JSON.stringify(r).toLowerCase().indexOf(q) > -1;
      })
      .slice(0, 20)
      .forEach(function(r) {
        results.push({
          module:    'agrement',
          id:        r.id,
          reference: r.reference || '',
          label:     (r.client || r.no_dossier || r.reference || ''),
          statut:    r.statut || '',
          date:      r.updated_at || r.created_at || ''
        });
      });
  }

  if (mods.indexOf('sinistre') > -1) {
    scopeSinistres_(session, readTable_('SINISTRES'))
      .filter(function(r) {
        return (r.reference || '').toLowerCase().indexOf(q) > -1 ||
               (r.no_sinistre || '').toLowerCase().indexOf(q) > -1 ||
               (r.no_contrat || '').toLowerCase().indexOf(q) > -1 ||
               (r.gestionnaire || '').toLowerCase().indexOf(q) > -1 ||
               JSON.stringify(r).toLowerCase().indexOf(q) > -1;
      })
      .slice(0, 20)
      .forEach(function(r) {
        results.push({
          module:    'sinistre',
          id:        r.id,
          reference: r.reference || '',
          label:     (r.no_sinistre || r.no_contrat || r.reference || ''),
          statut:    r.statut || '',
          date:      r.updated_at || r.created_at || ''
        });
      });
  }

  if (mods.indexOf('facture') > -1) {
    scopeFactures_(session, readTable_('FACTURES'))
      .filter(function(r) {
        return (r.reference || '').toLowerCase().indexOf(q) > -1 ||
               (r.no_sinistre || '').toLowerCase().indexOf(q) > -1 ||
               JSON.stringify(r).toLowerCase().indexOf(q) > -1;
      })
      .slice(0, 20)
      .forEach(function(r) {
        results.push({
          module:    'facture',
          id:        r.id,
          reference: r.reference || '',
          label:     (r.no_sinistre || r.reference || ''),
          statut:    r.statut || '',
          date:      r.updated_at || r.created_at || ''
        });
      });
  }

  if (mods.indexOf('resiliation') > -1) {
    scopeResiliations_(session, readTable_('RESILIATIONS'))
      .filter(function(r) {
        return (r.reference || '').toLowerCase().indexOf(q) > -1 ||
               (r.no_contrat || '').toLowerCase().indexOf(q) > -1 ||
               (r.mail || '').toLowerCase().indexOf(q) > -1 ||
               JSON.stringify(r).toLowerCase().indexOf(q) > -1;
      })
      .slice(0, 20)
      .forEach(function(r) {
        results.push({
          module:    'resiliation',
          id:        r.id,
          reference: r.reference || '',
          label:     (r.no_contrat || r.reference || ''),
          statut:    r.statut || '',
          date:      r.updated_at || r.created_at || ''
        });
      });
  }

  // Sort by date desc
  results.sort(function(a, b) {
    return String(b.date || '').localeCompare(String(a.date || ''));
  });

  return results.slice(0, 50);
}

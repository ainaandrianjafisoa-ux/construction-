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

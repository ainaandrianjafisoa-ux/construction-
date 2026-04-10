const APP_CONFIG = {
  APP_NAME: 'Syndic Ledger High-End',
  VERSION: '2.2.0',
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
  AMBASSADOR: 'ambassador'
};

const ENUMS = {
  USER_STATUS: ['Actif', 'Inactif', 'Suspendu'],
  EN_ETUDE_TYPES: ['GLI', 'IMMEUBLE'],
  TYPE_CLIENT: ['Locataire', 'Garant'],
  PRIORITIES: ['Basse', 'Normale', 'Haute', 'Urgente'],
  EN_ETUDE_STATUS: ['Initié', 'En attente de traitement', 'En cours de traitement', 'Validé', 'Refusé', 'Clos'],
  MOTIF_VALIDATION: ['Solvable', 'Non solvable']
};

const SCHEMA = {
  USERS: ['id', 'login', 'password_hash', 'role', 'full_name', 'email', 'team_id', 'team_leader_id', 'status', 'created_at', 'updated_at', 'last_login_at'],
  TEAMS: ['id', 'name', 'team_leader_id', 'status', 'created_at', 'updated_at'],
  EN_ETUDES: [
    'id', 'reference', 'type_dossier', 'priorite', 'client', 'adresse', 'type_client', 'ambassadeur_assigne',
    'equipe_id', 'statut', 'motif_validation',
    'net_a_payer_1', 'net_a_payer_2', 'net_a_payer_3',
    'net_avant_impot_1', 'net_avant_impot_2', 'net_avant_impot_3',
    'brut_1', 'brut_2', 'brut_3',
    'loyer', 'moyenne_net_a_payer', 'moyenne_net_avant_impot', 'moyenne_brut',
    'ratio_max', 'plafond_loyer', 'resultat_solvabilite',
    'created_by', 'updated_by', 'created_at', 'updated_at', 'closed_at'
  ],
  EN_ETUDE_TYPE_TEAM_MAP: ['id', 'type_dossier', 'team_id', 'team_name', 'active', 'updated_at'],
  SESSIONS: ['session_id', 'token', 'user_id', 'login', 'role', 'team_id', 'started_at', 'last_seen_at', 'closed_at', 'status', 'disconnect_reason', 'user_agent'],
  PRESENCE_DAILY: ['id', 'date_key', 'user_id', 'login', 'full_name', 'role', 'team_id', 'first_login_at', 'last_seen_at', 'last_disconnect_at', 'connection_count', 'disconnection_count', 'online_seconds', 'is_online', 'updated_at'],
  LOGIN_LOG: ['id', 'user_id', 'login', 'success', 'timestamp', 'user_agent', 'session_id', 'message'],
  AUDIT_LOG: ['id', 'timestamp', 'user_id', 'login', 'role', 'action_type', 'entity_type', 'entity_id', 'summary', 'old_value_json', 'new_value_json'],
  SETTINGS: ['key', 'value', 'updated_at']
};
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
  return value === null || value === undefined ? '' : value;
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
  const key = 'SEQ_' + prefix;
  const current = Number(props.getProperty(key) || '0') + 1;
  props.setProperty(key, String(current));
  const datePart = Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyyMMdd');
  return prefix + '-' + datePart + '-' + ('0000' + current).slice(-4);
}

function safeJson_(value) {
  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
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

function average_(values) {
  const safe = values.map(function(v) { return Number(v) || 0; });
  return safe.length ? safe.reduce(function(a, b) { return a + b; }, 0) / safe.length : 0;
}

function hashPassword_(plain) {
  const props = PropertiesService.getScriptProperties();
  let salt = props.getProperty('PASSWORD_SALT');
  if (!salt) {
    salt = Utilities.getUuid().replace(/-/g, '');
    props.setProperty('PASSWORD_SALT', salt);
  }
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(plain) + salt);
  return raw.map(function(byte) {
    const value = (byte < 0 ? byte + 256 : byte).toString(16);
    return value.length === 1 ? '0' + value : value;
  }).join('');
}

function publicUser_(row) {
  return {
    id: row.id || '',
    login: row.login || '',
    role: row.role || '',
    full_name: row.full_name || '',
    email: row.email || '',
    team_id: row.team_id || '',
    team_leader_id: row.team_leader_id || '',
    status: row.status || '',
    created_at: row.created_at || '',
    updated_at: row.updated_at || '',
    last_login_at: row.last_login_at || ''
  };
}

function publicTeam_(row) {
  return {
    id: row.id || '',
    name: row.name || '',
    team_leader_id: row.team_leader_id || '',
    status: row.status || '',
    created_at: row.created_at || '',
    updated_at: row.updated_at || ''
  };
}

function roleCanManage_(actorRole, targetRole) {
  if (actorRole === ROLES.SUPER_ADMIN) return true;
  if (actorRole === ROLES.TEAM_LEADER) return targetRole === ROLES.AMBASSADOR;
  return false;
}
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

    const currentHeaders = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0].map(String);
    const missing = headers.filter(function(h) { return currentHeaders.indexOf(h) === -1; });
    if (missing.length) {
      sheet.insertColumnsAfter(sheet.getLastColumn(), missing.length);
      sheet.getRange(1, currentHeaders.length + 1, 1, missing.length).setValues([missing]);
      styleHeader_(sheet, currentHeaders.length + missing.length);
    }
  });

  return {
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl()
  };
}

function readTable_(name) {
  const ss = getDatabase_();
  const sheet = ss.getSheetByName(name);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const values = sheet.getDataRange().getValues();
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
  const ss = getDatabase_();
  const sheet = ss.getSheetByName(name);
  const headers = SCHEMA[name];
  const values = sheet.getDataRange().getValues();
  const keyIndex = headers.indexOf(keyField);
  if (keyIndex === -1) throw new Error('Clé primaire introuvable : ' + keyField);

  const rowValues = headers.map(function(h) {
    return rowObj[h] !== undefined ? rowObj[h] : '';
  });

  let foundRow = -1;
  for (let i = 1; i < values.length; i += 1) {
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
  return row ? row.value : defaultValue;
}

function setSettingIfEmpty_(key, value) {
  const row = readTable_('SETTINGS').find(function(r) { return r.key === key; });
  if (!row) setSetting_(key, value);
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
function seedBaseData_() {
  const teams = readTable_('TEAMS');
  const users = readTable_('USERS');
  const rules = readTable_('EN_ETUDE_TYPE_TEAM_MAP');

  if (!teams.some(function(t) { return t.id === 'TEAM_GLI'; })) {
    upsertRow_('TEAMS', 'id', {
      id: 'TEAM_GLI',
      name: 'Équipe GLI',
      team_leader_id: '',
      status: 'Actif',
      created_at: nowIso_(),
      updated_at: nowIso_()
    });
  }

  if (!teams.some(function(t) { return t.id === 'TEAM_IMMEUBLE'; })) {
    upsertRow_('TEAMS', 'id', {
      id: 'TEAM_IMMEUBLE',
      name: 'Équipe Immeuble',
      team_leader_id: '',
      status: 'Actif',
      created_at: nowIso_(),
      updated_at: nowIso_()
    });
  }

  if (!users.length) {
    upsertRow_('USERS', 'id', {
      id: nextId_('USR'),
      login: APP_CONFIG.DEFAULT_ADMIN_LOGIN,
      password_hash: hashPassword_(APP_CONFIG.DEFAULT_ADMIN_PASSWORD),
      role: ROLES.SUPER_ADMIN,
      full_name: 'Super Administrateur',
      email: '',
      team_id: '',
      team_leader_id: '',
      status: 'Actif',
      created_at: nowIso_(),
      updated_at: nowIso_(),
      last_login_at: ''
    });
  }

  if (!rules.some(function(r) { return String(r.type_dossier || '').toUpperCase() === 'GLI'; })) {
    upsertRow_('EN_ETUDE_TYPE_TEAM_MAP', 'id', {
      id: nextId_('MAP'),
      type_dossier: 'GLI',
      team_id: 'TEAM_GLI',
      team_name: 'Équipe GLI',
      active: 'TRUE',
      updated_at: nowIso_()
    });
  }

  if (!rules.some(function(r) { return String(r.type_dossier || '').toUpperCase() === 'IMMEUBLE'; })) {
    upsertRow_('EN_ETUDE_TYPE_TEAM_MAP', 'id', {
      id: nextId_('MAP'),
      type_dossier: 'IMMEUBLE',
      team_id: 'TEAM_IMMEUBLE',
      team_name: 'Équipe Immeuble',
      active: 'TRUE',
      updated_at: nowIso_()
    });
  }

  setSettingIfEmpty_('SESSION_STALE_MINUTES', String(APP_CONFIG.SESSION_STALE_MINUTES));
  setSettingIfEmpty_('APP_VERSION', APP_CONFIG.VERSION);
}
function addAuditLog_(actor, actionType, entityType, entityId, summary, oldValue, newValue) {
  upsertRow_('AUDIT_LOG', 'id', {
    id: nextId_('AUD'),
    timestamp: nowIso_(),
    user_id: actor && (actor.user_id || actor.id || actor.user && actor.user.id) || '',
    login: actor && (actor.login || actor.user && actor.user.login) || '',
    role: actor && (actor.role || actor.user && actor.user.role) || '',
    action_type: actionType || '',
    entity_type: entityType || '',
    entity_id: entityId || '',
    summary: summary || '',
    old_value_json: oldValue ? safeJson_(oldValue) : '',
    new_value_json: newValue ? safeJson_(newValue) : ''
  });
}

function addLoginLog_(userId, login, success, userAgent, sessionId, message) {
  upsertRow_('LOGIN_LOG', 'id', {
    id: nextId_('LGN'),
    user_id: userId || '',
    login: login || '',
    success: success ? 'TRUE' : 'FALSE',
    timestamp: nowIso_(),
    user_agent: userAgent || '',
    session_id: sessionId || '',
    message: message || ''
  });
}

function getActivityLogs(token, limit) {
  const session = requireSession_(token);
  const max = Number(limit || 100);
  const visibleIds = scopeUsers_(session, readTable_('USERS')).map(function(u) { return u.id; });

  return readTable_('AUDIT_LOG')
    .filter(function(row) {
      return session.role === ROLES.SUPER_ADMIN || visibleIds.indexOf(row.user_id) > -1;
    })
    .sort(sortDescBy_('timestamp'))
    .slice(0, max);
}

function listLoginLogs(token, limit) {
  const session = requireSession_(token);
  const max = Number(limit || 100);
  const visibleIds = scopeUsers_(session, readTable_('USERS')).map(function(u) { return u.id; });

  return readTable_('LOGIN_LOG')
    .filter(function(row) {
      return session.role === ROLES.SUPER_ADMIN || visibleIds.indexOf(row.user_id) > -1;
    })
    .sort(sortDescBy_('timestamp'))
    .slice(0, max);
}
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

function scopeEnEtudes_(session, rows) {
  if (session.role === ROLES.SUPER_ADMIN) return rows;
  if (session.role === ROLES.TEAM_LEADER) {
    return rows.filter(function(r) { return r.equipe_id === session.user.team_id; });
  }
  return rows.filter(function(r) {
    return r.ambassadeur_assigne === session.user.id || r.created_by === session.user.id;
  });
}
function getOrCreatePresenceDay_(user, dateKey) {
  const existing = readTable_('PRESENCE_DAILY').find(function(r) {
    return r.user_id === user.id && r.date_key === dateKey;
  });
  if (existing) return existing;

  const row = {
    id: nextId_('PRS'),
    date_key: dateKey,
    user_id: user.id,
    login: user.login,
    full_name: user.full_name,
    role: user.role,
    team_id: user.team_id || '',
    first_login_at: '',
    last_seen_at: '',
    last_disconnect_at: '',
    connection_count: 0,
    disconnection_count: 0,
    online_seconds: 0,
    is_online: 'FALSE',
    updated_at: nowIso_()
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
  record.first_login_at = record.first_login_at || session.started_at;
  record.last_seen_at = session.last_seen_at;
  record.connection_count = Number(record.connection_count || 0) + 1;
  record.is_online = 'TRUE';
  record.updated_at = nowIso_();
  upsertRow_('PRESENCE_DAILY', 'id', record);
}

function markPresenceHeartbeat_(user, session) {
  const record = getOrCreatePresenceDay_(user, todayKey_());
  record.last_seen_at = session.last_seen_at;
  record.is_online = 'TRUE';
  record.updated_at = nowIso_();
  upsertRow_('PRESENCE_DAILY', 'id', record);
}

function markPresenceDisconnect_(user, session, onlineSeconds) {
  const dateKey = session.started_at ? Utilities.formatDate(new Date(session.started_at), APP_CONFIG.TIMEZONE, 'yyyy-MM-dd') : todayKey_();
  const record = getOrCreatePresenceDay_(user, dateKey);
  record.last_disconnect_at = session.closed_at || nowIso_();
  record.last_seen_at = session.last_seen_at || nowIso_();
  record.disconnection_count = Number(record.disconnection_count || 0) + 1;
  record.online_seconds = Number(record.online_seconds || 0) + Number(onlineSeconds || 0);
  record.is_online = hasAnyOtherActiveSession_(user.id) ? 'TRUE' : 'FALSE';
  record.updated_at = nowIso_();
  upsertRow_('PRESENCE_DAILY', 'id', record);
}

function finalizeSession_(row, reason) {
  const user = requireActiveUser_(row.user_id);
  row.closed_at = nowIso_();
  row.last_seen_at = row.last_seen_at || row.closed_at;
  row.status = 'CLOSED';
  row.disconnect_reason = reason || 'closed';
  upsertRow_('SESSIONS', 'session_id', row);

  const startedMs = parseDateMs_(row.started_at);
  const endMs = parseDateMs_(row.closed_at);
  const onlineSeconds = Math.max(0, Math.round((endMs - startedMs) / 1000));

  markPresenceDisconnect_(user, row, onlineSeconds);
  addAuditLog_(user, 'LOGOUT', 'SESSION', row.session_id, 'Session fermée (' + row.disconnect_reason + ')', null, row);
}

function closeStaleSessions() {
  const staleMinutes = Number(getSetting_('SESSION_STALE_MINUTES', APP_CONFIG.SESSION_STALE_MINUTES));
  const threshold = Date.now() - staleMinutes * 60 * 1000;

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
  const session = requireSession_(token);
  const day = dateKey || todayKey_();
  const visibleIds = scopeUsers_(session, readTable_('USERS')).map(function(u) { return u.id; });
  const teamById = indexBy_(readTable_('TEAMS'), 'id');
  const activeSessions = readTable_('SESSIONS').filter(function(s) { return s.status === 'ACTIVE'; });

  return readTable_('PRESENCE_DAILY')
    .filter(function(row) {
      return row.date_key === day && visibleIds.indexOf(row.user_id) > -1;
    })
    .map(function(row) {
      row.team_name = teamById[row.team_id] ? teamById[row.team_id].name : '';
      row.currently_online = activeSessions.some(function(s) { return s.user_id === row.user_id && s.status === 'ACTIVE'; }) ? 'TRUE' : row.is_online;
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
    date_key: dateKey || todayKey_(),
    total_users: rows.length,
    online_now: rows.filter(function(r) { return String(r.currently_online) === 'TRUE'; }).length,
    total_connections: rows.reduce(function(n, r) { return n + Number(r.connection_count || 0); }, 0),
    total_disconnections: rows.reduce(function(n, r) { return n + Number(r.disconnection_count || 0); }, 0),
    total_online_seconds: rows.reduce(function(n, r) { return n + Number(r.online_seconds || 0); }, 0),
    rows: rows
  };
}
function sessionCacheKey_(token) {
  return 'SES_' + token;
}

function cacheSession_(token, session) {
  CacheService.getScriptCache().put(sessionCacheKey_(token), JSON.stringify(session), APP_CONFIG.SESSION_CACHE_TTL);
}

function getCachedSession_(token) {
  const raw = CacheService.getScriptCache().get(sessionCacheKey_(token));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
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
  const token = typeof tokenOrSession === 'string' ? tokenOrSession : tokenOrSession && tokenOrSession.token;
  if (!token) throw new Error('Session invalide.');

  const session = getCachedSession_(token) || getActiveSessionByToken_(token);
  if (!session) throw new Error('Votre session a expiré. Veuillez vous reconnecter.');

  const user = requireActiveUser_(session.user_id);
  session.user = publicUser_(user);
  session.role = user.role;
  cacheSession_(token, session);
  return session;
}

function buildMenu_(role) {
  const common = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'en_etudes', label: 'En étude' },
    { key: 'presence', label: 'Pointage' },
    { key: 'history', label: 'Historique' },
    { key: 'connections', label: 'Connexions' }
  ];

  if (role === ROLES.SUPER_ADMIN) {
    return [
      { key: 'users', label: 'Utilisateurs' },
      { key: 'teams', label: 'Équipes' },
      { key: 'coherences', label: 'Cohérences' }
    ].concat(common);
  }

  if (role === ROLES.TEAM_LEADER) {
    return [{ key: 'users', label: 'Mon équipe' }].concat(common);
  }

  return common;
}

function buildPermissions_(role) {
  return {
    canManageUsers: role === ROLES.SUPER_ADMIN || role === ROLES.TEAM_LEADER,
    canManageTeams: role === ROLES.SUPER_ADMIN,
    canViewCoherences: role === ROLES.SUPER_ADMIN,
    canCreateEnEtude: true
  };
}

function buildSessionPayload_(session) {
  const fresh = requireSession_(session.token || session);
  return {
    token: fresh.token,
    user: publicUser_(fresh.user),
    role: fresh.role,
    menu: buildMenu_(fresh.role),
    permissions: buildPermissions_(fresh.role),
    appName: APP_CONFIG.APP_NAME,
    heartbeatSeconds: APP_CONFIG.HEARTBEAT_SECONDS
  };
}

function closeActiveSessionsForUser_(userId, reason) {
  readTable_('SESSIONS')
    .filter(function(s) { return s.user_id === userId && s.status === 'ACTIVE'; })
    .forEach(function(s) { finalizeSession_(s, reason || 'relogin'); });
}

function authenticateUser(login, password, userAgent) {
  initApplication();

  const normalizedLogin = String(login || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');

  if (!normalizedLogin || !normalizedPassword) {
    throw new Error('Veuillez renseigner votre identifiant et votre mot de passe.');
  }

  const users = readTable_('USERS');
  const user = users.find(function(u) {
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

  const token = Utilities.getUuid().replace(/-/g, '') + '_' + new Date().getTime();
  const session = {
    session_id: nextId_('SES'),
    token: token,
    user_id: user.id,
    login: user.login,
    role: user.role,
    team_id: user.team_id || '',
    started_at: nowIso_(),
    last_seen_at: nowIso_(),
    closed_at: '',
    status: 'ACTIVE',
    disconnect_reason: '',
    user_agent: String(userAgent || '')
  };

  upsertRow_('SESSIONS', 'session_id', session);
  cacheSession_(token, session);

  user.last_login_at = nowIso_();
  user.updated_at = nowIso_();
  upsertRow_('USERS', 'id', user);

  markPresenceLogin_(user, session);
  addLoginLog_(user.id, user.login, true, userAgent, session.session_id, 'Connexion réussie');
  addAuditLog_(user, 'LOGIN', 'SESSION', session.session_id, 'Connexion à la plateforme', null, session);

  return buildSessionPayload_(session);
}

function heartbeatSession(token, meta) {
  const session = requireSession_(token);
  const row = readTable_('SESSIONS').find(function(s) { return s.session_id === session.session_id; });
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
  const row = readTable_('SESSIONS').find(function(s) { return s.session_id === session.session_id; });
  if (row && row.status === 'ACTIVE') finalizeSession_(row, reason || 'manual_logout');
  clearSessionCache_(token);
  return { ok: true };
}

function registerOfflineSignal(token) {
  try {
    return logoutUser(token, 'client_offline');
  } catch (error) {
    return { ok: false, message: error.message };
  }
}
function getLookups(token) {
  const session = requireSession_(token);
  const teams = scopeTeams_(session, readTable_('TEAMS'));
  const users = scopeUsers_(session, readTable_('USERS'));

  return {
    userStatuses: ENUMS.USER_STATUS,
    enEtudeStatuses: ENUMS.EN_ETUDE_STATUS,
    enEtudeTypes: ENUMS.EN_ETUDE_TYPES,
    typeClientOptions: ENUMS.TYPE_CLIENT,
    priorities: ENUMS.PRIORITIES,
    motifValidationOptions: ENUMS.MOTIF_VALIDATION,
    teams: teams.map(publicTeam_),
    users: users.map(publicUser_),
    teamLeaders: users.filter(function(u) { return u.role === ROLES.TEAM_LEADER; }).map(publicUser_),
    ambassadors: users.filter(function(u) { return u.role === ROLES.AMBASSADOR; }).map(publicUser_)
  };
}

function listUsers(token) {
  const session = requireSession_(token);
  const users = scopeUsers_(session, readTable_('USERS'));
  const teamsById = indexBy_(readTable_('TEAMS'), 'id');
  const usersById = indexBy_(readTable_('USERS'), 'id');

  return users.map(function(user) {
    const row = publicUser_(user);
    row.team_name = teamsById[row.team_id] ? teamsById[row.team_id].name : '';
    row.team_leader_name = usersById[row.team_leader_id] ? usersById[row.team_leader_id].full_name : '';
    return row;
  }).sort(function(a, b) {
    return String(a.full_name || '').localeCompare(String(b.full_name || ''), 'fr');
  });
}

function saveUser(token, payload) {
  const session = requireSession_(token);
  if (!buildPermissions_(session.role).canManageUsers) {
    throw new Error('Vous n’avez pas les droits pour gérer les utilisateurs.');
  }

  const data = payload || {};
  const users = readTable_('USERS');
  const existing = data.id ? users.find(function(u) { return u.id === data.id; }) : null;
  const targetRole = String(data.role || existing && existing.role || '').trim();

  if (!targetRole) throw new Error('Le rôle est obligatoire.');
  if (!roleCanManage_(session.role, targetRole)) throw new Error('Vous ne pouvez pas gérer ce rôle.');
  if (existing && !roleCanManage_(session.role, existing.role)) throw new Error('Vous ne pouvez pas modifier cet utilisateur.');

  const login = String(data.login || existing && existing.login || '').trim().toLowerCase();
  const fullName = String(data.full_name || existing && existing.full_name || '').trim();
  if (!login || !fullName) throw new Error('Le login et le nom complet sont obligatoires.');

  const duplicate = users.find(function(u) {
    return String(u.login || '').toLowerCase() === login && u.id !== (existing ? existing.id : '');
  });
  if (duplicate) throw new Error('Ce login existe déjà.');

  let teamId = String(data.team_id || existing && existing.team_id || '').trim();
  let teamLeaderId = String(data.team_leader_id || existing && existing.team_leader_id || '').trim();

  if (session.role === ROLES.TEAM_LEADER) {
    teamId = session.user.team_id || '';
    teamLeaderId = session.user.id;
  } else if (targetRole === ROLES.TEAM_LEADER) {
    teamLeaderId = '';
  }

  if (targetRole === ROLES.AMBASSADOR && !teamLeaderId) {
    throw new Error('Un ambassadeur doit être rattaché à un Team Leader.');
  }

  const now = nowIso_();
  const row = Object.assign({}, existing || {}, {
    id: existing ? existing.id : nextId_('USR'),
    login: login,
    password_hash: String(data.password || '').trim() ? hashPassword_(String(data.password).trim()) : (existing ? existing.password_hash : ''),
    role: targetRole,
    full_name: fullName,
    email: String(data.email || existing && existing.email || '').trim(),
    team_id: teamId,
    team_leader_id: teamLeaderId,
    status: String(data.status || existing && existing.status || 'Actif').trim(),
    created_at: existing ? existing.created_at : now,
    updated_at: now,
    last_login_at: existing ? existing.last_login_at : ''
  });

  if (!row.password_hash) throw new Error('Le mot de passe est obligatoire à la création.');

  upsertRow_('USERS', 'id', row);
  addAuditLog_(session, existing ? 'UPDATE' : 'CREATE', 'USER', row.id, 'Enregistrement utilisateur', existing, row);
  return publicUser_(row);
}
function listTeams(token) {
  const session = requireSession_(token);
  const teams = scopeTeams_(session, readTable_('TEAMS'));
  const users = readTable_('USERS');
  const enEtudes = readTable_('EN_ETUDES');

  return teams.map(function(team) {
    return {
      id: team.id,
      name: team.name,
      team_leader_id: team.team_leader_id,
      team_leader_name: (users.find(function(u) { return u.id === team.team_leader_id; }) || {}).full_name || '',
      status: team.status,
      created_at: team.created_at,
      updated_at: team.updated_at,
      ambassadors_count: users.filter(function(u) { return u.team_id === team.id && u.role === ROLES.AMBASSADOR; }).length,
      en_etudes_count: enEtudes.filter(function(d) { return d.equipe_id === team.id; }).length
    };
  }).sort(function(a, b) {
    return String(a.name || '').localeCompare(String(b.name || ''), 'fr');
  });
}

function saveTeam(token, payload) {
  const session = requireSession_(token);
  if (session.role !== ROLES.SUPER_ADMIN) throw new Error('Seul le Super Admin peut gérer les équipes.');

  const data = payload || {};
  const teams = readTable_('TEAMS');
  const existing = data.id ? teams.find(function(t) { return t.id === data.id; }) : null;
  const name = String(data.name || existing && existing.name || '').trim();
  if (!name) throw new Error('Le nom de l’équipe est obligatoire.');

  const now = nowIso_();
  const row = Object.assign({}, existing || {}, {
    id: existing ? existing.id : nextId_('TEAM'),
    name: name,
    team_leader_id: String(data.team_leader_id || existing && existing.team_leader_id || '').trim(),
    status: String(data.status || existing && existing.status || 'Actif').trim(),
    created_at: existing ? existing.created_at : now,
    updated_at: now
  });

  upsertRow_('TEAMS', 'id', row);
  addAuditLog_(session, existing ? 'UPDATE' : 'CREATE', 'TEAM', row.id, 'Enregistrement équipe', existing, row);
  return publicTeam_(row);
}
function normalizeDossierType_(value) {
  return String(value || '').trim().toUpperCase();
}

function isActiveRule_(value) {
  const v = String(value || '').toLowerCase();
  return v === 'true' || v === '1' || v === 'oui' || v === 'actif';
}

function listEnEtudeTypeTeamRules(token) {
  const session = requireSession_(token);
  if (!buildPermissions_(session.role).canViewCoherences) {
    throw new Error('Vous n’avez pas accès aux cohérences.');
  }

  const teamsById = indexBy_(readTable_('TEAMS'), 'id');
  return readTable_('EN_ETUDE_TYPE_TEAM_MAP')
    .map(function(row) {
      return {
        id: row.id,
        type_dossier: row.type_dossier,
        team_id: row.team_id,
        team_name: teamsById[row.team_id] ? teamsById[row.team_id].name : (row.team_name || ''),
        active: row.active,
        updated_at: row.updated_at
      };
    })
    .sort(function(a, b) {
      return String(a.type_dossier || '').localeCompare(String(b.type_dossier || ''), 'fr');
    });
}

function assignTeamByTypeDossier_(typeDossier) {
  const dossierType = normalizeDossierType_(typeDossier);
  const rule = readTable_('EN_ETUDE_TYPE_TEAM_MAP').find(function(r) {
    return normalizeDossierType_(r.type_dossier) === dossierType && isActiveRule_(r.active);
  });

  if (!rule) {
    throw new Error('Aucune cohérence type de dossier / équipe trouvée dans la feuille EN_ETUDE_TYPE_TEAM_MAP pour : ' + dossierType);
  }

  const teamId = String(rule.team_id || '').trim();
  if (!teamId) {
    throw new Error('La règle ' + dossierType + ' ne contient pas de team_id.');
  }

  const team = readTable_('TEAMS').find(function(t) { return t.id === teamId; });
  if (!team) {
    throw new Error('Équipe introuvable pour team_id = ' + teamId);
  }

  return teamId;
}

function calculateSolvabiliteServer(payload) {
  const typeClient = String(payload.type_client || '');
  const netAPayer = payload.net_a_payer || [0, 0, 0];
  const netAvantImpot = payload.net_avant_impot || [0, 0, 0];
  const brut = payload.brut || [0, 0, 0];
  const loyer = Number(payload.loyer || 0);

  const moyenneNetAPayer = average_(netAPayer);
  const moyenneNetAvantImpot = average_(netAvantImpot);
  const moyenneBrut = average_(brut);
  const ratioMax = typeClient === 'Garant' ? 0.33 : 0.37;
  const plafondLoyer = moyenneNetAPayer * ratioMax;
  const resultat = loyer <= plafondLoyer ? 'Solvable' : 'Non solvable';

  return {
    net_a_payer: netAPayer,
    net_avant_impot: netAvantImpot,
    brut: brut,
    loyer: loyer,
    moyenne_net_a_payer: moyenneNetAPayer,
    moyenne_net_avant_impot: moyenneNetAvantImpot,
    moyenne_brut: moyenneBrut,
    ratio_max: ratioMax,
    plafond_loyer: plafondLoyer,
    resultat: resultat
  };
}

function hydrateEnEtudeRow_(row, usersById, teamsById) {
  const netAPayer = [
    Number(row.net_a_payer_1 || 0),
    Number(row.net_a_payer_2 || 0),
    Number(row.net_a_payer_3 || 0)
  ];
  const netAvantImpot = [
    Number(row.net_avant_impot_1 || 0),
    Number(row.net_avant_impot_2 || 0),
    Number(row.net_avant_impot_3 || 0)
  ];
  const brut = [
    Number(row.brut_1 || 0),
    Number(row.brut_2 || 0),
    Number(row.brut_3 || 0)
  ];
  const hasSolvabilite = netAPayer.some(function(v) { return v !== 0; }) || Number(row.loyer || 0) !== 0;

  row.ambassadeur_assigne_name = usersById[row.ambassadeur_assigne] ? usersById[row.ambassadeur_assigne].full_name : '';
  row.equipe_name = teamsById[row.equipe_id] ? teamsById[row.equipe_id].name : '';
  row.solvabilite = hasSolvabilite ? {
    net_a_payer: netAPayer,
    net_avant_impot: netAvantImpot,
    brut: brut,
    loyer: Number(row.loyer || 0),
    moyenne_net_a_payer: Number(row.moyenne_net_a_payer || 0),
    moyenne_net_avant_impot: Number(row.moyenne_net_avant_impot || 0),
    moyenne_brut: Number(row.moyenne_brut || 0),
    ratio_max: Number(row.ratio_max || 0),
    plafond_loyer: Number(row.plafond_loyer || 0),
    resultat: row.resultat_solvabilite || ''
  } : null;
  return row;
}

function listEnEtudes(token, filters) {
  const session = requireSession_(token);
  const f = filters || {};
  const usersById = indexBy_(readTable_('USERS'), 'id');
  const teamsById = indexBy_(readTable_('TEAMS'), 'id');

  return scopeEnEtudes_(session, readTable_('EN_ETUDES'))
    .filter(function(r) { return !f.statut || r.statut === f.statut; })
    .filter(function(r) { return !f.type_dossier || normalizeDossierType_(r.type_dossier) === normalizeDossierType_(f.type_dossier); })
    .filter(function(r) { return !f.search || JSON.stringify(r).toLowerCase().indexOf(String(f.search).toLowerCase()) > -1; })
    .map(function(r) { return hydrateEnEtudeRow_(Object.assign({}, r), usersById, teamsById); })
    .sort(sortDescBy_('updated_at'));
}

function validateEnEtudePayload_(row) {
  if (!row.type_dossier) throw new Error('Le type de dossier est obligatoire.');
  if (!row.priorite) throw new Error('La priorité est obligatoire.');
  if (!row.client) throw new Error('Le client est obligatoire.');
  if (!row.adresse) throw new Error('L’adresse est obligatoire.');
  if (!row.type_client) throw new Error('Le type de client est obligatoire.');
  if (!row.ambassadeur_assigne) throw new Error('L’ambassadeur assigné est obligatoire.');
  if (!row.statut) throw new Error('Le statut est obligatoire.');
  if (row.statut === 'Validé' && !row.motif_validation) {
    throw new Error('Le motif Solvable / Non solvable est obligatoire lorsque le statut est Validé.');
  }
}

function saveEnEtude(token, payload) {
  const session = requireSession_(token);
  const data = payload || {};
  const rows = readTable_('EN_ETUDES');
  const existing = data.id ? rows.find(function(r) { return r.id === data.id; }) : null;

  if (existing && !scopeEnEtudes_(session, [existing]).length) {
    throw new Error('Accès refusé à cette étude.');
  }

  let ambassadeurAssigne = String(data.ambassadeur_assigne || existing && existing.ambassadeur_assigne || '').trim();
  const users = readTable_('USERS');

  if (session.role === ROLES.TEAM_LEADER) {
    const target = users.find(function(u) { return u.id === ambassadeurAssigne; });
    if (ambassadeurAssigne && (!target || target.team_id !== session.user.team_id)) {
      throw new Error('L’ambassadeur sélectionné n’appartient pas à votre équipe.');
    }
  }

  if (session.role === ROLES.AMBASSADOR) {
    ambassadeurAssigne = session.user.id;
  }

  const equipeId = assignTeamByTypeDossier_(data.type_dossier || existing && existing.type_dossier || '');
  const statut = String(data.statut || existing && existing.statut || 'Initié').trim();
  const motifValidation = statut === 'Validé' ? String(data.motif_validation || existing && existing.motif_validation || '').trim() : '';

  const solv = data.solvabilite || null;
  const now = nowIso_();

  const row = Object.assign({}, existing || {}, {
    id: existing ? existing.id : nextId_('ETD'),
    reference: existing ? existing.reference : nextReference_('ETU'),
    type_dossier: normalizeDossierType_(data.type_dossier || existing && existing.type_dossier || ''),
    priorite: String(data.priorite || existing && existing.priorite || 'Normale').trim(),
    client: String(data.client || existing && existing.client || '').trim(),
    adresse: String(data.adresse || existing && existing.adresse || '').trim(),
    type_client: String(data.type_client || existing && existing.type_client || '').trim(),
    ambassadeur_assigne: ambassadeurAssigne,
    equipe_id: equipeId,
    statut: statut,
    motif_validation: motifValidation,
    net_a_payer_1: solv ? Number(solv.net_a_payer[0] || 0) : Number(existing && existing.net_a_payer_1 || 0),
    net_a_payer_2: solv ? Number(solv.net_a_payer[1] || 0) : Number(existing && existing.net_a_payer_2 || 0),
    net_a_payer_3: solv ? Number(solv.net_a_payer[2] || 0) : Number(existing && existing.net_a_payer_3 || 0),
    net_avant_impot_1: solv ? Number(solv.net_avant_impot[0] || 0) : Number(existing && existing.net_avant_impot_1 || 0),
    net_avant_impot_2: solv ? Number(solv.net_avant_impot[1] || 0) : Number(existing && existing.net_avant_impot_2 || 0),
    net_avant_impot_3: solv ? Number(solv.net_avant_impot[2] || 0) : Number(existing && existing.net_avant_impot_3 || 0),
    brut_1: solv ? Number(solv.brut[0] || 0) : Number(existing && existing.brut_1 || 0),
    brut_2: solv ? Number(solv.brut[1] || 0) : Number(existing && existing.brut_2 || 0),
    brut_3: solv ? Number(solv.brut[2] || 0) : Number(existing && existing.brut_3 || 0),
    loyer: solv ? Number(solv.loyer || 0) : Number(existing && existing.loyer || 0),
    moyenne_net_a_payer: solv ? Number(solv.moyenne_net_a_payer || 0) : Number(existing && existing.moyenne_net_a_payer || 0),
    moyenne_net_avant_impot: solv ? Number(solv.moyenne_net_avant_impot || 0) : Number(existing && existing.moyenne_net_avant_impot || 0),
    moyenne_brut: solv ? Number(solv.moyenne_brut || 0) : Number(existing && existing.moyenne_brut || 0),
    ratio_max: solv ? Number(solv.ratio_max || 0) : Number(existing && existing.ratio_max || 0),
    plafond_loyer: solv ? Number(solv.plafond_loyer || 0) : Number(existing && existing.plafond_loyer || 0),
    resultat_solvabilite: solv ? String(solv.resultat || '') : String(existing && existing.resultat_solvabilite || ''),
    created_by: existing ? existing.created_by : session.user.id,
    updated_by: session.user.id,
    created_at: existing ? existing.created_at : now,
    updated_at: now,
    closed_at: statut === 'Clos' ? (existing && existing.closed_at ? existing.closed_at : now) : ''
  });

  validateEnEtudePayload_(row);
  upsertRow_('EN_ETUDES', 'id', row);
  addAuditLog_(session, existing ? 'UPDATE' : 'CREATE', 'EN_ETUDE', row.id, 'Enregistrement En étude', existing, row);

  const usersById = indexBy_(readTable_('USERS'), 'id');
  const teamsById = indexBy_(readTable_('TEAMS'), 'id');
  return hydrateEnEtudeRow_(Object.assign({}, row), usersById, teamsById);
}
function buildStatusBreakdown_(rows, field) {
  const map = {};
  rows.forEach(function(r) {
    const key = r[field] || 'Sans statut';
    map[key] = (map[key] || 0) + 1;
  });
  return Object.keys(map).map(function(key) {
    return { label: key, value: map[key] };
  }).sort(function(a, b) {
    return b.value - a.value;
  });
}

function buildTeamPerformance_() {
  const teams = readTable_('TEAMS');
  const users = readTable_('USERS');
  const enEtudes = readTable_('EN_ETUDES');

  return teams.map(function(team) {
    return {
      name: team.name,
      ambassadors: users.filter(function(u) { return u.team_id === team.id && u.role === ROLES.AMBASSADOR; }).length,
      en_etudes_ouvertes: enEtudes.filter(function(d) { return d.equipe_id === team.id && d.statut !== 'Clos'; }).length
    };
  }).sort(function(a, b) {
    return b.en_etudes_ouvertes - a.en_etudes_ouvertes;
  });
}

function buildAmbassadorPerformance_(session) {
  const users = scopeUsers_(session, readTable_('USERS')).filter(function(u) { return u.role === ROLES.AMBASSADOR; });
  const enEtudes = scopeEnEtudes_(session, readTable_('EN_ETUDES'));

  return users.map(function(user) {
    return {
      name: user.full_name,
      en_etudes_ouvertes: enEtudes.filter(function(d) { return d.ambassadeur_assigne === user.id && d.statut !== 'Clos'; }).length,
      valides: enEtudes.filter(function(d) { return d.ambassadeur_assigne === user.id && d.statut === 'Validé'; }).length
    };
  }).sort(function(a, b) {
    return b.en_etudes_ouvertes - a.en_etudes_ouvertes;
  });
}

function getDashboardData(token) {
  const session = requireSession_(token);
  const presence = getPresenceSummary(token, todayKey_());

  if (session.role === ROLES.SUPER_ADMIN) {
    const users = readTable_('USERS');
    const teams = readTable_('TEAMS');
    const enEtudes = readTable_('EN_ETUDES');

    return {
      scopeLabel: 'Vision globale',
      kpis: [
        { label: 'Utilisateurs actifs', value: users.filter(function(u) { return u.status === 'Actif'; }).length, tone: 'primary' },
        { label: 'Équipes', value: teams.length, tone: 'neutral' },
        { label: 'En étude ouvertes', value: enEtudes.filter(function(d) { return d.statut !== 'Clos'; }).length, tone: 'warning' },
        { label: 'Validées', value: enEtudes.filter(function(d) { return d.statut === 'Validé'; }).length, tone: 'success' },
        { label: 'Connexions du jour', value: presence.total_connections, tone: 'primary' },
        { label: 'Déconnexions du jour', value: presence.total_disconnections, tone: 'danger' }
      ],
      statusBreakdown: buildStatusBreakdown_(enEtudes, 'statut'),
      performance: buildTeamPerformance_(),
      recentRows: enEtudes.sort(sortDescBy_('updated_at')).slice(0, 8),
      recentActivity: readTable_('AUDIT_LOG').sort(sortDescBy_('timestamp')).slice(0, 12)
    };
  }

  if (session.role === ROLES.TEAM_LEADER) {
    const users = scopeUsers_(session, readTable_('USERS'));
    const enEtudes = scopeEnEtudes_(session, readTable_('EN_ETUDES'));

    return {
      scopeLabel: 'Mon équipe',
      kpis: [
        { label: 'Ambassadeurs actifs', value: users.filter(function(u) { return u.role === ROLES.AMBASSADOR && u.status === 'Actif'; }).length, tone: 'primary' },
        { label: 'En attente', value: enEtudes.filter(function(d) { return d.statut === 'En attente de traitement'; }).length, tone: 'warning' },
        { label: 'En cours', value: enEtudes.filter(function(d) { return d.statut === 'En cours de traitement'; }).length, tone: 'warning' },
        { label: 'Validées', value: enEtudes.filter(function(d) { return d.statut === 'Validé'; }).length, tone: 'success' },
        { label: 'Connexions du jour', value: presence.total_connections, tone: 'primary' }
      ],
      statusBreakdown: buildStatusBreakdown_(enEtudes, 'statut'),
      performance: buildAmbassadorPerformance_(session),
      recentRows: enEtudes.sort(sortDescBy_('updated_at')).slice(0, 8),
      recentActivity: getActivityLogs(token, 12)
    };
  }

  const enEtudes = scopeEnEtudes_(session, readTable_('EN_ETUDES'));
  return {
    scopeLabel: 'Mon activité',
    kpis: [
      { label: 'Mes En étude ouvertes', value: enEtudes.filter(function(d) { return d.statut !== 'Clos'; }).length, tone: 'primary' },
      { label: 'En attente', value: enEtudes.filter(function(d) { return d.statut === 'En attente de traitement'; }).length, tone: 'warning' },
      { label: 'En cours', value: enEtudes.filter(function(d) { return d.statut === 'En cours de traitement'; }).length, tone: 'warning' },
      { label: 'Validées', value: enEtudes.filter(function(d) { return d.statut === 'Validé'; }).length, tone: 'success' },
      { label: 'Mes connexions du jour', value: presence.total_connections, tone: 'primary' }
    ],
    statusBreakdown: buildStatusBreakdown_(enEtudes, 'statut'),
    performance: [],
    recentRows: enEtudes.sort(sortDescBy_('updated_at')).slice(0, 8),
    recentActivity: getActivityLogs(token, 12)
  };
}
function initApplication() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const dbInfo = ensureSheets_();
    seedBaseData_();
    ensurePresenceTrigger_();

    return {
      ok: true,
      appName: APP_CONFIG.APP_NAME,
      version: APP_CONFIG.VERSION,
      databaseUrl: dbInfo.spreadsheetUrl,
      defaultAdmin: {
        login: APP_CONFIG.DEFAULT_ADMIN_LOGIN,
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
  return {
    ok: true,
    spreadsheetUrl: dbInfo.spreadsheetUrl,
    defaultAdminLogin: APP_CONFIG.DEFAULT_ADMIN_LOGIN
  };
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
    session: buildSessionPayload_(session),
    lookups: getLookups(token),
    dashboard: getDashboardData(token)
  };
}



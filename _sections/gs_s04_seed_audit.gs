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
  setSettingIfEmpty_('PARAM_STATUTS_PRO', JSON.stringify(ENUMS.STATUTS_PRO));
  setSettingIfEmpty_('PARAM_COMPAGNIES', JSON.stringify(ENUMS.COMPAGNIES));
  setSettingIfEmpty_('PARAM_STATUTS_FIN_TRAITEMENT', JSON.stringify(ENUMS.STATUTS_FIN_TRAITEMENT));
  setSettingIfEmpty_('PARAM_AGREMENT_STATUS', JSON.stringify(ENUMS.AGREMENT_STATUS));
  setSettingIfEmpty_('PARAM_PRIORITIES', JSON.stringify(ENUMS.PRIORITIES));
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

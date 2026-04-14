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

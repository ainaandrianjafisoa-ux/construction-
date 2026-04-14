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

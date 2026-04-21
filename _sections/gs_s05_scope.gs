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

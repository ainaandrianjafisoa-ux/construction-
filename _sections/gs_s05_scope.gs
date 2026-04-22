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

// Agrément — tous les utilisateurs voient tous les dossiers
function scopeAgrements_(session, rows) {
  return rows;
}

function scopeSinistres_(session, rows) {
  return rows;
}

function scopeFactures_(session, rows) {
  return rows;
}

function scopeResiliations_(session, rows) {
  return rows;
}

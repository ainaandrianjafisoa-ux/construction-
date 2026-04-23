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

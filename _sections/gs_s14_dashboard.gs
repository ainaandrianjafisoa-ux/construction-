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

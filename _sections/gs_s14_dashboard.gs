// ============================================================
// SECTION 14 — DASHBOARD v2
// KPIs étendus · Traitements/agent · Tendance 30j · Alertes
// ============================================================

// ── Helpers internes ─────────────────────────────────────────

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
    const ambassadeurs = users.filter(function(u) { return u.team_id === team.id && u.role === ROLES.AMBASSADOR; });
    const teamAgr      = agrements.filter(function(d) { return d.equipe_id === team.id; });
    return {
      equipe:        team.name,
      ambassadeurs:  ambassadeurs.length,
      ouverts:       teamAgr.filter(function(d) { return d.statut !== 'Clos'; }).length,
      valides:       teamAgr.filter(function(d) { return d.statut === 'Validé'; }).length,
      traites_total: teamAgr.filter(function(d) { return d.statut === 'Clos' || d.statut === 'Validé'; }).length
    };
  }).sort(function(a, b) { return b.traites_total - a.traites_total; });
}

function buildAmbassadorPerformance_(session) {
  const users    = scopeUsers_(session, readTable_('USERS')).filter(function(u) { return u.role === ROLES.AMBASSADOR; });
  const agrements = scopeAgrements_(session, readTable_('AGREMENTS'));
  return users.map(function(user) {
    const mine = agrements.filter(function(d) { return d.ambassadeur_assigne === user.id; });
    return {
      nom:     user.full_name,
      ouverts: mine.filter(function(d) { return d.statut !== 'Clos'; }).length,
      valides: mine.filter(function(d) { return d.statut === 'Validé'; }).length,
      traites: mine.filter(function(d) { return d.statut === 'Clos' || d.statut === 'Validé'; }).length
    };
  }).sort(function(a, b) { return b.traites - a.traites; });
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

// ── Traitements par agent (événements bruts pour filtrage côté client) ──

function buildTreatmentEvents_(session) {
  const usersById = indexBy_(readTable_('USERS'), 'id');
  const teamsById = indexBy_(readTable_('TEAMS'), 'id');
  const events    = [];

  // Agréments validés ou clos
  scopeAgrements_(session, readTable_('AGREMENTS'))
    .filter(function(r) { return r.statut === 'Validé' || r.statut === 'Clos'; })
    .forEach(function(r) {
      const agentId = r.ambassadeur_assigne || r.created_by || '';
      const u = usersById[agentId];
      events.push({
        module:     'agrement',
        agent_id:   agentId,
        agent_name: u ? u.full_name : agentId,
        team_name:  teamsById[r.equipe_id] ? teamsById[r.equipe_id].name : '—',
        date:       String(r.closed_at || r.updated_at || r.created_at || '').slice(0, 10)
      });
    });

  // Sinistres traités
  scopeSinistres_(session, readTable_('SINISTRES'))
    .filter(function(r) { return r.statut === 'Traité'; })
    .forEach(function(r) {
      const u = usersById[r.created_by];
      const team = u && u.team_id ? (teamsById[u.team_id] ? teamsById[u.team_id].name : '—') : '—';
      events.push({
        module:     'sinistre',
        agent_id:   r.created_by || '',
        agent_name: u ? u.full_name : (r.created_by || ''),
        team_name:  team,
        date:       String(r.updated_at || r.created_at || '').slice(0, 10)
      });
    });

  // Factures traitées
  scopeFactures_(session, readTable_('FACTURES'))
    .filter(function(r) { return r.statut === 'Traité'; })
    .forEach(function(r) {
      const u = usersById[r.created_by];
      const team = u && u.team_id ? (teamsById[u.team_id] ? teamsById[u.team_id].name : '—') : '—';
      events.push({
        module:     'facture',
        agent_id:   r.created_by || '',
        agent_name: u ? u.full_name : (r.created_by || ''),
        team_name:  team,
        date:       String(r.traite_at || r.updated_at || r.created_at || '').slice(0, 10)
      });
    });

  // Résiliations traitées
  scopeResiliations_(session, readTable_('RESILIATIONS'))
    .filter(function(r) { return r.statut === 'Traité'; })
    .forEach(function(r) {
      const u = usersById[r.created_by];
      const team = u && u.team_id ? (teamsById[u.team_id] ? teamsById[u.team_id].name : '—') : '—';
      events.push({
        module:     'resiliation',
        agent_id:   r.created_by || '',
        agent_name: u ? u.full_name : (r.created_by || ''),
        team_name:  team,
        date:       String(r.updated_at || r.created_at || '').slice(0, 10)
      });
    });

  return events;
}

// ── Tendance 30j : nb de traitements par jour ─────────────────

function buildTrend30j_(events) {
  const days = [];
  const now  = new Date();
  for (var i = 29; i >= 0; i--) {
    var d = new Date(now.getTime() - i * 24 * 3600 * 1000);
    days.push(Utilities.formatDate(d, APP_CONFIG.TIMEZONE, 'yyyy-MM-dd'));
  }
  const countByDay = {};
  events.forEach(function(e) {
    if (e.date) countByDay[e.date] = (countByDay[e.date] || 0) + 1;
  });
  return days.map(function(d) { return { date: d, count: countByDay[d] || 0 }; });
}

// ── Délai moyen (factures traitées avec delai_secondes) ───────

function buildDelaiMoyen_(session) {
  const traites = scopeFactures_(session, readTable_('FACTURES'))
    .filter(function(r) { return r.statut === 'Traité' && Number(r.delai_secondes) > 0; });
  if (!traites.length) return 0;
  return Math.round(traites.reduce(function(s, r) { return s + Number(r.delai_secondes || 0); }, 0) / traites.length);
}

// ── Taux de solvabilité ───────────────────────────────────────

function buildSolvabiliteStats_(session) {
  const agr = scopeAgrements_(session, readTable_('AGREMENTS'))
    .filter(function(r) { return r.resultat_solvabilite; });
  const solvable    = agr.filter(function(r) { return r.resultat_solvabilite === 'Solvable'; }).length;
  const nonSolvable = agr.filter(function(r) { return r.resultat_solvabilite === 'Non solvable'; }).length;
  return { solvable: solvable, non_solvable: nonSolvable, total: agr.length };
}

// ── Dossiers sans mise à jour depuis >7j ─────────────────────

function buildDossiersEnAlerte_(session) {
  const cutoff = new Date(new Date().getTime() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  var count = 0;
  function isStale(r) { return String(r.updated_at || r.created_at || '').slice(0, 10) < cutoff; }

  scopeAgrements_(session, readTable_('AGREMENTS'))
    .filter(function(r) { return r.statut !== 'Validé' && r.statut !== 'Clos'; })
    .forEach(function(r) { if (isStale(r)) count++; });
  scopeFactures_(session, readTable_('FACTURES'))
    .filter(function(r) { return r.statut !== 'Traité'; })
    .forEach(function(r) { if (isStale(r)) count++; });
  scopeResiliations_(session, readTable_('RESILIATIONS'))
    .filter(function(r) { return r.statut !== 'Traité'; })
    .forEach(function(r) { if (isStale(r)) count++; });
  scopeSinistres_(session, readTable_('SINISTRES'))
    .filter(function(r) { return r.statut !== 'Traité'; })
    .forEach(function(r) { if (isStale(r)) count++; });
  return count;
}

// ── Point d'entrée principal ──────────────────────────────────

function getDashboardData(token) {
  const session        = requireSession_(token);
  const allUsers       = readTable_('USERS');
  const allTeams       = readTable_('TEAMS');
  const presence       = getPresenceSummary(token, todayKey_());
  const ambassPresence = presence.rows.filter(function(r) { return r.role === ROLES.AMBASSADOR; });
  const moduleStats    = buildModuleStats_(session);
  const allEvents      = buildTreatmentEvents_(session); // already all rows (scope funcs return all)
  const solvStats      = buildSolvabiliteStats_(session);
  const dossiersAlerte = buildDossiersEnAlerte_(session);
  const delaiMoyen     = buildDelaiMoyen_(session);

  // Scope events by role
  var treatEvents;
  if (session.role === ROLES.AMBASSADOR) {
    treatEvents = allEvents.filter(function(e) { return e.agent_id === session.user.id; });
  } else if (session.role === ROLES.TEAM_LEADER) {
    const myTeamUserIds = allUsers
      .filter(function(u) { return u.team_id === session.user.team_id; })
      .map(function(u) { return u.id; });
    treatEvents = allEvents.filter(function(e) { return myTeamUserIds.indexOf(e.agent_id) > -1; });
  } else {
    treatEvents = allEvents; // admin : tous
  }

  const trend30j = buildTrend30j_(treatEvents);

  // Listes pour les filtres du tableau de bord (admin/TL seulement)
  var filterTeams = [];
  var filterAmbassadors = [];
  if (session.role === ROLES.SUPER_ADMIN) {
    filterTeams       = allTeams.map(function(t) { return { id: t.id, name: t.name }; });
    filterAmbassadors = allUsers
      .filter(function(u) { return u.role === ROLES.AMBASSADOR; })
      .map(function(u) { return { id: u.id, name: u.full_name, team_id: u.team_id }; });
  } else if (session.role === ROLES.TEAM_LEADER) {
    filterAmbassadors = allUsers
      .filter(function(u) { return u.role === ROLES.AMBASSADOR && u.team_id === session.user.team_id; })
      .map(function(u) { return { id: u.id, name: u.full_name, team_id: u.team_id }; });
  }

  const base = {
    role:            session.role,
    trend30j:        trend30j,
    treatmentEvents: treatEvents,
    solvabilite:     solvStats,
    dossiersAlerte:  dossiersAlerte,
    delaiMoyen:      delaiMoyen,
    moduleStats:     moduleStats,
    filterTeams:     filterTeams,
    filterAmbassadors: filterAmbassadors,
    ambassadorPresence: ambassPresence,
    presenceSummary: {
      total_users:          presence.total_users,
      online_now:           presence.online_now,
      total_connections:    presence.total_connections,
      total_online_seconds: presence.total_online_seconds
    }
  };

  if (session.role === ROLES.SUPER_ADMIN) {
    const agrements = readTable_('AGREMENTS');
    const taux      = agrements.filter(function(d) { return d.statut === 'Validé'; }).length;

    return Object.assign(base, {
      scopeLabel: 'Vision globale',
      kpis: [
        { label: 'Utilisateurs actifs', value: allUsers.filter(function(u) { return u.status === 'Actif'; }).length, tone: 'primary' },
        { label: 'Agréments en cours',  value: agrements.filter(function(d) { return d.statut !== 'Clos'; }).length, tone: 'warning' },
        { label: 'Agréments validés',   value: taux,                                                                  tone: 'success' },
        { label: 'Factures remontées',  value: moduleStats.facture.remontees,                                         tone: 'danger'  },
        { label: 'Dossiers en alerte',  value: dossiersAlerte, tone: dossiersAlerte > 0 ? 'danger' : 'success'               },
        { label: 'Délai moy. facture',  value: delaiMoyen > 0 ? formatDelai_(delaiMoyen) : '—',                      tone: 'neutral' },
        { label: 'Solvabilité',         value: solvStats.total > 0 ? Math.round(solvStats.solvable / solvStats.total * 100) + ' %' : '—', tone: 'primary' },
        { label: 'Connexions du jour',  value: presence.total_connections,                                            tone: 'primary' }
      ],
      statusBreakdown: buildStatusBreakdown_(agrements, 'statut'),
      performance:     buildTeamPerformance_()
    });
  }

  if (session.role === ROLES.TEAM_LEADER) {
    const myUsers    = allUsers.filter(function(u) { return u.team_id === session.user.team_id; });
    const agrements  = readTable_('AGREMENTS').filter(function(d) { return d.equipe_id === session.user.team_id; });

    return Object.assign(base, {
      scopeLabel: 'Mon équipe',
      kpis: [
        { label: 'Ambassadeurs actifs', value: myUsers.filter(function(u) { return u.role === ROLES.AMBASSADOR && u.status === 'Actif'; }).length, tone: 'primary' },
        { label: 'Agréments ouverts',   value: agrements.filter(function(d) { return d.statut !== 'Clos'; }).length,   tone: 'warning' },
        { label: 'Validés',             value: agrements.filter(function(d) { return d.statut === 'Validé'; }).length,  tone: 'success' },
        { label: 'Factures remontées',  value: moduleStats.facture.remontees,                                           tone: 'danger'  },
        { label: 'Dossiers en alerte',  value: dossiersAlerte, tone: dossiersAlerte > 0 ? 'danger' : 'success'                 },
        { label: 'Délai moy. facture',  value: delaiMoyen > 0 ? formatDelai_(delaiMoyen) : '—',                        tone: 'neutral' },
        { label: 'Connexions du jour',  value: presence.total_connections,                                              tone: 'primary' }
      ],
      statusBreakdown: buildStatusBreakdown_(agrements, 'statut'),
      performance:     buildAmbassadorPerformance_(session)
    });
  }

  // Ambassador — uniquement ses propres données
  const myAgrements = readTable_('AGREMENTS').filter(function(d) { return d.ambassadeur_assigne === session.user.id; });
  const now30d      = new Date(new Date().getTime() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const traites30   = treatEvents.filter(function(e) { return e.date >= now30d; }).length;

  return Object.assign(base, {
    scopeLabel: 'Mon activité',
    kpis: [
      { label: 'Mes agréments ouverts', value: myAgrements.filter(function(d) { return d.statut !== 'Clos'; }).length,   tone: 'primary' },
      { label: 'Validés',               value: myAgrements.filter(function(d) { return d.statut === 'Validé'; }).length,  tone: 'success' },
      { label: 'Dossiers en alerte',    value: dossiersAlerte, tone: dossiersAlerte > 0 ? 'danger' : 'success'                    },
      { label: 'Mes traitements 30j',   value: traites30,                                                                  tone: 'primary' },
      { label: 'Délai moy. facture',    value: delaiMoyen > 0 ? formatDelai_(delaiMoyen) : '—',                           tone: 'neutral' }
    ],
    statusBreakdown: buildStatusBreakdown_(myAgrements, 'statut'),
    performance:     []
  });
}

// ============================================================
// SECTION 8 — MENU, PERMISSIONS, LOOKUPS, PARAMÈTRES
// ============================================================

function buildMenu_(role) {
  const common = [
    { key: 'dashboard',    label: 'Dashboard'    },
    { key: 'agrements',    label: 'Agrément'     },
    { key: 'sinistres',    label: 'Sinistre'     },
    { key: 'factures',     label: 'Facture'      },
    { key: 'resiliations', label: 'Résiliation'  },
    { key: 'presence',     label: 'Pointage'     },
    { key: 'history',      label: 'Historique'   },
    { key: 'connections',  label: 'Connexions'   }
  ];

  if (role === ROLES.SUPER_ADMIN) {
    return [
      { key: 'users',      label: 'Utilisateurs' },
      { key: 'teams',      label: 'Équipes'      },
      { key: 'coherences', label: 'Cohérences'   },
      { key: 'parametres', label: 'Paramètres'   }
    ].concat(common);
  }
  if (role === ROLES.TEAM_LEADER) {
    return [
      { key: 'users',              label: 'Mon équipe'       },
      { key: 'factures_remontees', label: 'Dossiers remontés'},
      { key: 'parametres',         label: 'Paramètres'       }
    ].concat(common);
  }
  return common;
}

function buildPermissions_(role) {
  return {
    canManageUsers:       role === ROLES.SUPER_ADMIN || role === ROLES.TEAM_LEADER,
    canManageTeams:       role === ROLES.SUPER_ADMIN,
    canViewCoherences:    role === ROLES.SUPER_ADMIN,
    canManageSettings:    role === ROLES.SUPER_ADMIN || role === ROLES.TEAM_LEADER,
    canVerifierFactures:  role === ROLES.SUPER_ADMIN || role === ROLES.TEAM_LEADER,
    canReassigner:        role === ROLES.SUPER_ADMIN || role === ROLES.TEAM_LEADER,
    canValidateAgrement:  role === ROLES.SUPER_ADMIN || role === ROLES.TEAM_LEADER,
    canOverrideSolvabilite: role === ROLES.SUPER_ADMIN || role === ROLES.TEAM_LEADER,
    canCreateAgrement:    true,
    canCreateSinistre:    true,
    canCreateFacture:     true,
    canCreateResiliation: true
  };
}

function getLookups(token) {
  const session = requireSession_(token);
  const teams   = scopeTeams_(session, readTable_('TEAMS'));
  const users   = scopeUsers_(session, readTable_('USERS'));

  return {
    // Communs
    userStatuses:           ENUMS.USER_STATUS,
    // Agrément
    agrementStatuts:        getParametrableList_('AGREMENT_STATUS',        ENUMS.AGREMENT_STATUS),
    // alias rétrocompat
    agrementStatuses:       getParametrableList_('AGREMENT_STATUS',        ENUMS.AGREMENT_STATUS),
    typesDossier:           getParametrableList_('AGREMENT_TYPES',         ENUMS.AGREMENT_TYPES),
    // alias rétrocompat
    agrementTypes:          getParametrableList_('AGREMENT_TYPES',         ENUMS.AGREMENT_TYPES),
    typeClientOptions:      getParametrableList_('TYPE_CLIENT',            ENUMS.TYPE_CLIENT),
    priorities:             getParametrableList_('PRIORITIES',             ENUMS.PRIORITIES),
    motifValidationOptions: getParametrableList_('MOTIF_VALIDATION',       ENUMS.MOTIF_VALIDATION),
    // Agrément v4
    statutsPro:             getParametrableList_('STATUTS_PRO',            ENUMS.STATUTS_PRO),
    compagnies:             getParametrableList_('COMPAGNIES',             ENUMS.COMPAGNIES),
    statutsFinTraitement:   getParametrableList_('STATUTS_FIN_TRAITEMENT', ENUMS.STATUTS_FIN_TRAITEMENT),
    // Sinistre
    sinistreSituations:     getParametrableList_('SINISTRE_SITUATIONS',    ENUMS.SINISTRE_SITUATIONS),
    sinistreStatuts:        getParametrableList_('SINISTRE_STATUTS',       ENUMS.SINISTRE_STATUTS),
    sinistreCompletude:     getParametrableList_('SINISTRE_COMPLETUDE',    ENUMS.SINISTRE_COMPLETUDE),
    // Facture
    factureStatuts:         getParametrableList_('FACTURE_STATUTS',        ENUMS.FACTURE_STATUTS),
    // Résiliation
    resiliationOrigines:    getParametrableList_('RESILIATION_ORIGINES',   ENUMS.RESILIATION_ORIGINES),
    resiliationCompletude:  getParametrableList_('RESILIATION_COMPLETUDE', ENUMS.RESILIATION_COMPLETUDE),
    resiliationResil:       getParametrableList_('RESILIATION_RESIL',      ENUMS.RESILIATION_RESIL),
    resiliationStatuts:     getParametrableList_('RESILIATION_STATUTS',    ENUMS.RESILIATION_STATUTS),
    // Entités
    teams:       teams.map(publicTeam_),
    users:       users.map(publicUser_),
    teamLeaders: users.filter(function(u) { return u.role === ROLES.TEAM_LEADER; }).map(publicUser_),
    ambassadors: users.filter(function(u) { return u.role === ROLES.AMBASSADOR;  }).map(publicUser_)
  };
}

// ── Paramètres personnalisables ───────────────────────────────

/** Retourne tous les paramètres personnalisables */
function getParametres(token) {
  const session = requireSession_(token);
  if (session.role === ROLES.AMBASSADOR) throw new Error('Accès non autorisé.');
  return {
    STATUTS_PRO:            getParametrableList_('STATUTS_PRO',            ENUMS.STATUTS_PRO),
    COMPAGNIES:             getParametrableList_('COMPAGNIES',             ENUMS.COMPAGNIES),
    STATUTS_FIN_TRAITEMENT: getParametrableList_('STATUTS_FIN_TRAITEMENT', ENUMS.STATUTS_FIN_TRAITEMENT),
    AGREMENT_STATUS:        getParametrableList_('AGREMENT_STATUS',        ENUMS.AGREMENT_STATUS),
    PRIORITIES:             getParametrableList_('PRIORITIES',             ENUMS.PRIORITIES)
  };
}

/**
 * Sauvegarde les paramètres personnalisables.
 * Seules les clés autorisées sont acceptées.
 */
function saveParametres(token, payload) {
  const session = requireSession_(token);
  if (session.role === ROLES.AMBASSADOR) throw new Error('Accès non autorisé.');

  const data    = payload || {};
  const allowed = ['STATUTS_PRO', 'COMPAGNIES', 'STATUTS_FIN_TRAITEMENT', 'AGREMENT_STATUS', 'PRIORITIES'];

  allowed.forEach(function(key) {
    if (data[key] && Array.isArray(data[key]) && data[key].length > 0) {
      setSetting_('PARAM_' + key, JSON.stringify(data[key]));
      addAuditLog_(session, 'UPDATE_SETTINGS', 'SETTINGS', key,
        'Mise à jour paramètre : ' + key, null, data[key]);
    }
  });

  return getParametres(token);
}

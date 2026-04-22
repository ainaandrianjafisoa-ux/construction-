// ============================================================
// SECTION 10 — MODULE AGRÉMENT v4
// Multi-profils · Solvabilité overridable · Réassignation
// ============================================================

// ── Cohérences (lecture seule depuis v4) ─────────────────────

function listAgrementTypeTeamRules(token) {
  const session = requireSession_(token);
  if (!buildPermissions_(session.role).canViewCoherences) {
    throw new Error('Vous n\'avez pas accès aux cohérences.');
  }
  const teamsById = indexBy_(readTable_('TEAMS'), 'id');
  return readTable_('AGREMENT_TYPE_TEAM_MAP')
    .map(function(row) {
      return {
        id:           row.id,
        type_dossier: row.type_dossier,
        team_id:      row.team_id,
        team_name:    teamsById[row.team_id] ? teamsById[row.team_id].name : (row.team_name || ''),
        active:       row.active,
        updated_at:   row.updated_at
      };
    })
    .sort(function(a, b) {
      return String(a.type_dossier || '').localeCompare(String(b.type_dossier || ''), 'fr');
    });
}

/**
 * Version NON BLOQUANTE de la résolution équipe par type de dossier.
 * Retourne '' si aucune règle n'est trouvée (ne lève pas d'erreur).
 * Conservée pour info / fallback optionnel — la règle n'est plus imposée.
 */
function assignTeamByTypeDossierOptional_(typeDossier) {
  const dossierType = normalizeDossierType_(typeDossier);
  const rule = readTable_('AGREMENT_TYPE_TEAM_MAP').find(function(r) {
    return normalizeDossierType_(r.type_dossier) === dossierType && isActiveRule_(r.active);
  });
  if (!rule) return '';
  return String(rule.team_id || '').trim();
}

// ── Calculs solvabilité ───────────────────────────────────────

/**
 * Calcule le plafond de loyer pour UN SEUL profil — VERSION LEGACY (switch/case).
 * Conservée pour la rétro-compatibilité des profils sans taux_plafond.
 *
 * @param {Object} profile
 * @returns {{ plafond, revenu_complementaire, plafond_avec_revenu, avg_net_imposable, ratio_used, details }}
 */
function calculateProfilePlafond_Legacy_(profile) {
  const statutPro  = String(profile.statut_pro  || '').trim();
  const typeClient = String(profile.type_client || 'Locataire').trim();
  const compagnie  = String(profile.compagnie   || '').trim();

  const sourceNI = Array.isArray(profile.net_imposable)
    ? profile.net_imposable
    : (Array.isArray(profile.salaires) ? profile.salaires : []);
  const ni = [
    Number(profile.net_imposable_1 !== undefined ? profile.net_imposable_1 : (sourceNI[0] || 0)),
    Number(profile.net_imposable_2 !== undefined ? profile.net_imposable_2 : (sourceNI[1] || 0)),
    Number(profile.net_imposable_3 !== undefined ? profile.net_imposable_3 : (sourceNI[2] || 0))
  ];
  const avgNI = average_(ni);

  let plafond   = 0;
  let ratioUsed = 0;
  let details   = '';

  switch (statutPro) {
    case 'CDI':
    case 'Fonctionnaire titulaire':
      ratioUsed = typeClient === 'Garant' ? 0.33 : 0.37;
      plafond   = avgNI * ratioUsed;
      details   = statutPro + ' · ratio ' + (ratioUsed * 100).toFixed(0) + '% · base ' + avgNI.toFixed(2);
      break;
    case 'CDD':
      if (compagnie === 'AXA') {
        ratioUsed = 0.25; plafond = avgNI * 0.25;
        details = 'CDD AXA · 25% de ' + avgNI.toFixed(2);
      } else if (compagnie === 'ALLIANZ') {
        if (profile.cdd_moins_12_mois === true || String(profile.cdd_moins_12_mois) === 'true') {
          ratioUsed = 0.37; plafond = (avgNI / 2) * 0.37;
          details = 'CDD ALLIANZ <12 mois · 37% de (net/2)';
        } else {
          ratioUsed = 0.37; plafond = avgNI * 0.37;
          details = 'CDD ALLIANZ ≥12 mois · 37%';
        }
      } else {
        ratioUsed = 0.37; plafond = avgNI * 0.37;
        details = 'CDD (défaut) · 37% de ' + avgNI.toFixed(2);
      }
      break;
    case 'Étudiant':
      ratioUsed = 0.33; plafond = avgNI * 0.33;
      details = 'Étudiant · Garant · 33% de ' + avgNI.toFixed(2);
      break;
    case 'Retraité':
      plafond = 0; details = 'Retraité · règle en attente';
      break;
    case 'TNS':
      plafond = 0; details = 'TNS · règle en attente';
      break;
    default:
      plafond = 0; details = 'Statut pro inconnu : ' + statutPro;
  }

  const revCompMontant = profile.revenu_complementaire_montant !== undefined
    ? profile.revenu_complementaire_montant
    : (profile.montant_complementaire !== undefined ? profile.montant_complementaire : 0);
  const revComp = (profile.revenu_complementaire === true || String(profile.revenu_complementaire) === 'true')
    ? Number(revCompMontant || 0) : 0;

  return {
    plafond:              plafond,
    revenu_complementaire: revComp,
    plafond_avec_revenu:  plafond + revComp,
    avg_net_imposable:    avgNI,
    ratio_used:           ratioUsed,
    details:              details
  };
}

/**
 * Calcule le plafond de loyer pour UN SEUL profil.
 * Nouvelle logique : utilise taux_plafond manuel si présent, sinon fallback legacy.
 *
 * @param {Object} profile
 * @returns {{ plafond, revenu_complementaire, plafond_avec_revenu, avg_net_imposable, ratio_used, details }}
 */
function calculateProfilePlafond_(profile) {
  // ── Fallback legacy si pas de taux_plafond manuel ─────────────
  const tauxRaw = String(profile.taux_plafond || '').trim();
  if (!tauxRaw) {
    return calculateProfilePlafond_Legacy_(profile);
  }

  // ── Taux manuel ───────────────────────────────────────────────
  const sourceNI = Array.isArray(profile.net_imposable)
    ? profile.net_imposable
    : (Array.isArray(profile.salaires) ? profile.salaires : []);
  const ni = [
    Number(profile.net_imposable_1 !== undefined ? profile.net_imposable_1 : (sourceNI[0] || 0)),
    Number(profile.net_imposable_2 !== undefined ? profile.net_imposable_2 : (sourceNI[1] || 0)),
    Number(profile.net_imposable_3 !== undefined ? profile.net_imposable_3 : (sourceNI[2] || 0))
  ];
  const avgNI = average_(ni);

  // Résoudre le taux : 'autre' → taux_plafond_autre ; sinon la valeur directe
  let tauxPct;
  if (tauxRaw === 'autre') {
    tauxPct = Number(profile.taux_plafond_autre || 0);
  } else {
    tauxPct = Number(tauxRaw);
  }
  const ratio   = tauxPct / 100;
  const plafond = avgNI * ratio;

  const revCompMontant = profile.revenu_complementaire_montant !== undefined
    ? profile.revenu_complementaire_montant
    : (profile.montant_complementaire !== undefined ? profile.montant_complementaire : 0);
  const revComp = (profile.revenu_complementaire === true || String(profile.revenu_complementaire) === 'true')
    ? Number(revCompMontant || 0) : 0;

  return {
    plafond:              plafond,
    revenu_complementaire: revComp,
    plafond_avec_revenu:  plafond + revComp,
    avg_net_imposable:    avgNI,
    ratio_used:           ratio,
    details:              'Taux manuel ' + tauxPct + '% · base ' + avgNI.toFixed(2)
  };
}

/**
 * Calcul multi-profils.
 * Appelable depuis le front via rpc('calculateMultiProfileSolvabiliteServer', payload).
 *
 * @param {Object} payload
 * @param {string} payload.type_client
 * @param {string} payload.compagnie
 * @param {number} payload.loyer
 * @param {Array}  payload.profils
 */
function calculateMultiProfileSolvabiliteServer(payload) {
  const typeClient = String(payload.type_client || 'Locataire').trim();
  const compagnie  = String(payload.compagnie   || '').trim();
  const loyer      = Number(payload.loyer        || 0);
  const profils    = Array.isArray(payload.profils) ? payload.profils : [];

  // Si un profil est Étudiant → tout le dossier passe en Garant
  const forceGarant = profils.some(function(p) { return p.statut_pro === 'Étudiant'; });
  const effectifTypeClient = forceGarant ? 'Garant' : typeClient;

  const profileResults = profils.map(function(profil, idx) {
    // Each profil may have its own type_client (Change 1). Fall back to global if not set.
    const profilTypeClient = String(profil.type_client || effectifTypeClient).trim();
    const p = Object.assign({}, profil, {
      type_client: forceGarant ? 'Garant' : profilTypeClient,
      compagnie:   String(profil.compagnie || compagnie).trim()
    });
    const result = calculateProfilePlafond_(p);
    return Object.assign({ profil_index: idx + 1, statut_pro: profil.statut_pro || '' }, result);
  });

  const plafondTotal = profileResults.reduce(function(sum, r) {
    return sum + r.plafond_avec_revenu;
  }, 0);

  return {
    profils_calculs:      profileResults,
    // Alias de compat pour les clients qui lisent encore `result.profils`
    profils:              profileResults,
    plafond_total:        plafondTotal,
    loyer:                loyer,
    type_client_effectif: effectifTypeClient,
    compagnie:            compagnie,
    resultat:             loyer <= plafondTotal ? 'Solvable' : 'Non solvable'
  };
}

/**
 * Calcul mono-profil — rétro-compatibilité avec l'ancien formulaire.
 * Le "net imposable" = brut dans l'ancien modèle.
 */
function calculateSolvabiliteServer(payload) {
  const typeClient    = String(payload.type_client || '');
  const netAPayer     = payload.net_a_payer     || [0, 0, 0];
  const netAvantImpot = payload.net_avant_impot || [0, 0, 0];
  const brut          = payload.brut            || [0, 0, 0];
  const loyer         = Number(payload.loyer    || 0);

  const moyenneNetAPayer     = average_(netAPayer);
  const moyenneNetAvantImpot = average_(netAvantImpot);
  const moyenneBrut          = average_(brut);
  const ratioMax             = typeClient === 'Garant' ? 0.33 : 0.37;
  const plafondLoyer         = moyenneNetAPayer * ratioMax;
  const resultat             = loyer <= plafondLoyer ? 'Solvable' : 'Non solvable';

  return {
    net_a_payer: netAPayer, net_avant_impot: netAvantImpot, brut: brut,
    loyer: loyer,
    moyenne_net_a_payer:     moyenneNetAPayer,
    moyenne_net_avant_impot: moyenneNetAvantImpot,
    moyenne_brut:            moyenneBrut,
    ratio_max:               ratioMax,
    plafond_loyer:           plafondLoyer,
    resultat:                resultat
  };
}

// ── Hydratation ───────────────────────────────────────────────

function hydrateAgrementRow_(row, usersById, teamsById) {
  const netAPayer     = [Number(row.net_a_payer_1 || 0),     Number(row.net_a_payer_2 || 0),     Number(row.net_a_payer_3 || 0)];
  const netAvantImpot = [Number(row.net_avant_impot_1 || 0), Number(row.net_avant_impot_2 || 0), Number(row.net_avant_impot_3 || 0)];
  const brut          = [Number(row.brut_1 || 0),            Number(row.brut_2 || 0),            Number(row.brut_3 || 0)];
  const hasSolvabilite = netAPayer.some(function(v) { return v !== 0; })
    || Number(row.loyer || 0) !== 0
    || Number(row.plafond_final || 0) !== 0;

  row.ambassadeur_assigne_name    = usersById[row.ambassadeur_assigne]    ? usersById[row.ambassadeur_assigne].full_name    : '';
  row.gestionnaire_plus_name      = usersById[row.gestionnaire_plus]      ? usersById[row.gestionnaire_plus].full_name      : '';
  row.equipe_name                 = teamsById[row.equipe_id]              ? teamsById[row.equipe_id].name                  : '';
  row.solvabilite_override_by_name = usersById[row.solvabilite_override_by]
    ? usersById[row.solvabilite_override_by].full_name : '';

  row.solvabilite = hasSolvabilite ? {
    net_a_payer:             netAPayer,
    net_avant_impot:         netAvantImpot,
    brut:                    brut,
    loyer:                   Number(row.loyer                   || 0),
    moyenne_net_a_payer:     Number(row.moyenne_net_a_payer     || 0),
    moyenne_net_avant_impot: Number(row.moyenne_net_avant_impot || 0),
    moyenne_brut:            Number(row.moyenne_brut            || 0),
    ratio_max:               Number(row.ratio_max               || 0),
    plafond_loyer:           Number(row.plafond_loyer           || 0),
    plafond_final:           Number(row.plafond_final           || 0),
    resultat:                row.resultat_solvabilite           || '',
    override:                String(row.solvabilite_override)   === 'TRUE',
    override_commentaire:    row.solvabilite_commentaire        || '',
    override_by_name:        row.solvabilite_override_by_name   || '',
    override_at:             row.solvabilite_override_at        || ''
  } : null;

  // Profils JSON
  row.profils = safeParseJson_(row.profils_json, []);

  return row;
}

// ── Lecture ───────────────────────────────────────────────────

function listAgrements(token, filters) {
  const session   = requireSession_(token);
  const f         = filters || {};
  const usersById = indexBy_(readTable_('USERS'), 'id');
  const teamsById = indexBy_(readTable_('TEAMS'), 'id');

  return scopeAgrements_(session, readTable_('AGREMENTS'))
    .filter(function(r) { return !f.statut       || r.statut       === f.statut;       })
    .filter(function(r) { return !f.type_dossier || normalizeDossierType_(r.type_dossier) === normalizeDossierType_(f.type_dossier); })
    .filter(function(r) { return !f.search       || JSON.stringify(r).toLowerCase().indexOf(String(f.search).toLowerCase()) > -1; })
    .map(function(r) {
      try { return hydrateAgrementRow_(Object.assign({}, r), usersById, teamsById); }
      catch(e) { Logger.log('hydrateAgrementRow_ err ' + r.id + ': ' + e.message); return r; }
    })
    .sort(sortDescBy_('updated_at'));
}

// ── Validation ────────────────────────────────────────────────

function validateAgrementPayload_(row) {
  if (!row.type_dossier) throw new Error('Le type de dossier est obligatoire.');
  if (!row.priorite)     throw new Error('La priorité est obligatoire.');
  if (!row.statut)       throw new Error('Le statut est obligatoire.');
  if (row.statut === 'Validé' && !row.motif_validation) {
    throw new Error('Le motif de validation (Solvable / Non solvable) est obligatoire lorsque le statut est Validé.');
  }
}

// ── Sauvegarde ────────────────────────────────────────────────

function saveAgrement(token, payload) {
  const session  = requireSession_(token);
  const data     = payload || {};
  const rows     = readTable_('AGREMENTS');
  const existing = data.id ? rows.find(function(r) { return r.id === data.id; }) : null;

  const users = readTable_('USERS');

  // ── Assignation ambassadeur ────────────────────────────────
  // Règle : ambassadeur auto-assigné à lui-même à la création
  let ambassadeurAssigne = String(data.ambassadeur_assigne || (existing && existing.ambassadeur_assigne) || '').trim();

  if (session.role === ROLES.AMBASSADOR) {
    // L'ambassadeur ne peut pas se réassigner à quelqu'un d'autre
    ambassadeurAssigne = existing ? existing.ambassadeur_assigne : session.user.id;
  } else if (session.role === ROLES.TEAM_LEADER) {
    // TL : peut assigner à n'importe quel ambassadeur de son équipe
    if (ambassadeurAssigne) {
      const target = users.find(function(u) { return u.id === ambassadeurAssigne; });
      if (!target || target.team_id !== session.user.team_id) {
        throw new Error('L\'ambassadeur sélectionné n\'appartient pas à votre équipe.');
      }
    }
  }
  // Super Admin : assignation libre

  // ── Équipe déterminée par l'ambassadeur (règle v4) ─────────
  // RÈGLE : La cohérence type_dossier → équipe N'EST PLUS BLOQUANTE.
  // L'équipe = équipe de l'ambassadeur assigné.
  let equipeId = existing ? (existing.equipe_id || '') : '';
  if (ambassadeurAssigne) {
    const amb = users.find(function(u) { return u.id === ambassadeurAssigne; });
    if (amb && amb.team_id) equipeId = amb.team_id;
  }
  // Fallback non bloquant : si toujours vide, essayer la règle AGREMENT_TYPE_TEAM_MAP
  if (!equipeId) {
    equipeId = assignTeamByTypeDossierOptional_(
      data.type_dossier || (existing && existing.type_dossier) || ''
    );
  }

  // ── Profils : migration backward-compat ───────────────────
  const profils  = Array.isArray(data.profils)
    ? data.profils
    : safeParseJson_(data.profils_json, []);

  // Migration : profils sans type_client héritent de 'Locataire'
  profils.forEach(function(p) {
    if (!p.type_client) p.type_client = 'Locataire';
  });

  // ── Type client : dérivé du premier profil (ou 'Garant' si un profil est Étudiant) ──
  const forceGarant = profils.some(function(p) { return String(p.statut_pro || '') === 'Étudiant'; });
  let typeClient;
  if (forceGarant) {
    typeClient = 'Garant';
  } else if (profils.length > 0 && profils[0].type_client) {
    typeClient = String(profils[0].type_client).trim();
  } else {
    // Fallback rétro-compat : lire le champ global si présent
    typeClient = String(data.type_client || (existing && existing.type_client) || 'Locataire').trim();
  }

  // ── Statut / motif ─────────────────────────────────────────
  const solv            = data.solvabilite || null;
  const statut          = String(data.statut || (existing && existing.statut) || 'Initié').trim();
  const motifValidation = statut === 'Validé'
    ? String(
        data.motif_validation ||
        (existing && existing.motif_validation) ||
        (solv && solv.resultat) ||
        (existing && existing.resultat_solvabilite) ||
        ''
      ).trim()
    : '';
  const now     = nowIso_();

  const row = Object.assign({}, existing || {}, {
    id:          existing ? existing.id        : nextId_('AGR'),
    reference:   existing ? existing.reference : nextReference_('AGR'),
    // Infos dossier
    type_dossier:        normalizeDossierType_(data.type_dossier || (existing && existing.type_dossier) || ''),
    no_dossier:          String(data.no_dossier || (existing && existing.no_dossier) || '').trim(),
    priorite:            String(data.priorite   || (existing && existing.priorite)   || 'Normale').trim(),
    client:              String(data.client     || (existing && existing.client)     || '').trim(),
    adresse:             String(data.adresse    || (existing && existing.adresse)    || '').trim(),
    type_client:         typeClient,
    compagnie:           String(data.compagnie  || (existing && existing.compagnie)  || '').trim(),
    // Assignation
    ambassadeur_assigne: ambassadeurAssigne,
    gestionnaire_plus:   String(data.gestionnaire_plus || (existing && existing.gestionnaire_plus) || '').trim(),
    equipe_id:           equipeId,
    // Statuts
    statut:                   statut,
    motif_validation:         motifValidation,
    statut_fin_traitement:    String(data.statut_fin_traitement || (existing && existing.statut_fin_traitement) || '').trim(),
    // Multi-profils
    nombre_profils:   Number(data.nombre_profils || (existing && existing.nombre_profils) || 1),
    profils_json:     profils.length ? JSON.stringify(profils) : (existing ? (existing.profils_json || '') : ''),
    plafond_final:    Number(data.plafond_final  || (existing && existing.plafond_final)  || 0),
    // Solvabilité legacy (mono-profil rétro-compat)
    net_a_payer_1:    solv ? Number(solv.net_a_payer && solv.net_a_payer[0] || 0)     : Number((existing && existing.net_a_payer_1)    || 0),
    net_a_payer_2:    solv ? Number(solv.net_a_payer && solv.net_a_payer[1] || 0)     : Number((existing && existing.net_a_payer_2)    || 0),
    net_a_payer_3:    solv ? Number(solv.net_a_payer && solv.net_a_payer[2] || 0)     : Number((existing && existing.net_a_payer_3)    || 0),
    net_avant_impot_1: solv ? Number(solv.net_avant_impot && solv.net_avant_impot[0] || 0) : Number((existing && existing.net_avant_impot_1) || 0),
    net_avant_impot_2: solv ? Number(solv.net_avant_impot && solv.net_avant_impot[1] || 0) : Number((existing && existing.net_avant_impot_2) || 0),
    net_avant_impot_3: solv ? Number(solv.net_avant_impot && solv.net_avant_impot[2] || 0) : Number((existing && existing.net_avant_impot_3) || 0),
    brut_1: solv ? Number(solv.brut && solv.brut[0] || 0) : Number((existing && existing.brut_1) || 0),
    brut_2: solv ? Number(solv.brut && solv.brut[1] || 0) : Number((existing && existing.brut_2) || 0),
    brut_3: solv ? Number(solv.brut && solv.brut[2] || 0) : Number((existing && existing.brut_3) || 0),
    loyer:                   solv
      ? Number(solv.loyer || 0)
      : Number((data.loyer !== undefined ? data.loyer : ((existing && existing.loyer) || 0)) || 0),
    moyenne_net_a_payer:     solv ? Number(solv.moyenne_net_a_payer || 0)     : Number((existing && existing.moyenne_net_a_payer)     || 0),
    moyenne_net_avant_impot: solv ? Number(solv.moyenne_net_avant_impot || 0) : Number((existing && existing.moyenne_net_avant_impot) || 0),
    moyenne_brut:            solv ? Number(solv.moyenne_brut || 0)            : Number((existing && existing.moyenne_brut)            || 0),
    ratio_max:               solv ? Number(solv.ratio_max || 0)               : Number((existing && existing.ratio_max)               || 0),
    plafond_loyer:           solv ? Number(solv.plafond_loyer || 0)           : Number((existing && existing.plafond_loyer)           || 0),
    resultat_solvabilite:    solv ? String(solv.resultat || '')               : String((existing && existing.resultat_solvabilite)    || ''),
    // Override solvabilité (non réinitialisé lors d'un simple save)
    solvabilite_override:    String((existing && existing.solvabilite_override)    || 'FALSE'),
    solvabilite_commentaire: String((existing && existing.solvabilite_commentaire) || ''),
    solvabilite_override_by: String((existing && existing.solvabilite_override_by) || ''),
    solvabilite_override_at: String((existing && existing.solvabilite_override_at) || ''),
    // Audit
    created_by:  existing ? existing.created_by : session.user.id,
    updated_by:  session.user.id,
    created_at:  existing ? existing.created_at : now,
    updated_at:  now,
    closed_at:   statut === 'Clos' ? ((existing && existing.closed_at) || now) : ''
  });

  validateAgrementPayload_(row);
  upsertRow_('AGREMENTS', 'id', row);
  addAuditLog_(session, existing ? 'UPDATE' : 'CREATE', 'AGREMENT', row.id,
    'Enregistrement agrément', existing, row);

  // Historique de versions
  saveEntityVersion_(session, 'AGREMENT', row.id, row,
    String(data.commentaire_mise_a_jour || '').trim(),
    existing ? 'UPDATE' : 'CREATE');

  const usersById = indexBy_(readTable_('USERS'), 'id');
  const teamsById = indexBy_(readTable_('TEAMS'), 'id');
  return hydrateAgrementRow_(Object.assign({}, row), usersById, teamsById);
}

/**
 * Marque un agrément comme traité (nouveau concept v4.1).
 */
function traiterAgrement(token, id, commentaire) {
  const session  = requireSession_(token);
  const rows     = readTable_('AGREMENTS');
  const existing = rows.find(function(r) { return r.id === id; });

  if (!existing) throw new Error('Agrément introuvable.');

  const now = nowIso_();
  const row = Object.assign({}, existing, {
    statut:     'Clos',
    closed_at:  now,
    updated_by: session.user.id,
    updated_at: now
  });

  upsertRow_('AGREMENTS', 'id', row);
  addAuditLog_(session, 'TRAITE', 'AGREMENT', row.id, 'Agrément traité', existing, row);
  saveEntityVersion_(session, 'AGREMENT', row.id, row, String(commentaire || '').trim(), 'TRAITE');

  const usersById = indexBy_(readTable_('USERS'), 'id');
  const teamsById = indexBy_(readTable_('TEAMS'), 'id');
  return hydrateAgrementRow_(Object.assign({}, row), usersById, teamsById);
}

// ── Override solvabilité ──────────────────────────────────────

/**
 * Permet à l'ambassadeur (et au-dessus) de rectifier manuellement
 * le statut de solvabilité avec commentaire obligatoire.
 * Audit enregistré.
 */
function overrideSolvabilite(token, agrementId, newResultat, commentaire) {
  const session  = requireSession_(token);
  const rows     = readTable_('AGREMENTS');
  const existing = rows.find(function(r) { return r.id === agrementId; });

  if (!existing) throw new Error('Agrément introuvable.');

  const valid = ['Solvable', 'Non solvable'];
  if (!valid.includes(newResultat))            throw new Error('Résultat de solvabilité invalide.');
  if (!String(commentaire || '').trim())       throw new Error('Le commentaire est obligatoire pour modifier le statut de solvabilité.');

  const oldResultat = existing.resultat_solvabilite;
  const now         = nowIso_();

  const row = Object.assign({}, existing, {
    resultat_solvabilite:    newResultat,
    solvabilite_override:    'TRUE',
    solvabilite_commentaire: String(commentaire).trim(),
    solvabilite_override_by: session.user.id,
    solvabilite_override_at: now,
    updated_by:              session.user.id,
    updated_at:              now
  });

  upsertRow_('AGREMENTS', 'id', row);
  addAuditLog_(session, 'OVERRIDE_SOLVABILITE', 'AGREMENT', agrementId,
    'Solvabilité modifiée manuellement : ' + oldResultat + ' → ' + newResultat + ' | ' + commentaire,
    { resultat_solvabilite: oldResultat },
    { resultat_solvabilite: newResultat, commentaire: String(commentaire).trim() }
  );

  const usersById = indexBy_(readTable_('USERS'), 'id');
  const teamsById = indexBy_(readTable_('TEAMS'), 'id');
  return hydrateAgrementRow_(Object.assign({}, row), usersById, teamsById);
}

// ── Réassignation ─────────────────────────────────────────────

/**
 * Team Leader ou Admin peut réassigner un dossier à un autre ambassadeur.
 * L'ambassadeur ne peut pas réassigner.
 */
function reassignerAgrement(token, agrementId, newAmbassadeurId) {
  const session  = requireSession_(token);

  if (session.role === ROLES.AMBASSADOR) {
    throw new Error('Les ambassadeurs ne peuvent pas réassigner les dossiers.');
  }

  const rows     = readTable_('AGREMENTS');
  const existing = rows.find(function(r) { return r.id === agrementId; });

  if (!existing) throw new Error('Agrément introuvable.');

  const users  = readTable_('USERS');
  const newAmb = users.find(function(u) { return u.id === newAmbassadeurId; });
  if (!newAmb || newAmb.role !== ROLES.AMBASSADOR)  throw new Error('Ambassadeur introuvable.');

  if (session.role === ROLES.TEAM_LEADER && newAmb.team_id !== session.user.team_id) {
    throw new Error('L\'ambassadeur sélectionné n\'appartient pas à votre équipe.');
  }

  const oldAmb = existing.ambassadeur_assigne;
  const now    = nowIso_();

  // Équipe mise à jour selon le nouvel ambassadeur
  const newEquipeId = newAmb.team_id || existing.equipe_id;

  const row = Object.assign({}, existing, {
    ambassadeur_assigne: newAmbassadeurId,
    equipe_id:           newEquipeId,
    updated_by:          session.user.id,
    updated_at:          now
  });

  upsertRow_('AGREMENTS', 'id', row);
  addAuditLog_(session, 'REASSIGN', 'AGREMENT', agrementId,
    'Réassignation : ' + oldAmb + ' → ' + newAmbassadeurId,
    { ambassadeur_assigne: oldAmb, equipe_id: existing.equipe_id },
    { ambassadeur_assigne: newAmbassadeurId, equipe_id: newEquipeId }
  );

  const usersById = indexBy_(readTable_('USERS'), 'id');
  const teamsById = indexBy_(readTable_('TEAMS'), 'id');
  return hydrateAgrementRow_(Object.assign({}, row), usersById, teamsById);
}

// ============================================================
// SECTION 11 — MODULE SINISTRE v4
// Commentaire · Historique · Re-traitement après mise à jour
// ============================================================

function listSinistres(token, filters) {
  const session   = requireSession_(token);
  const f         = filters || {};
  const usersById = indexBy_(readTable_('USERS'), 'id');

  return scopeSinistres_(session, readTable_('SINISTRES'))
    .filter(function(r) { return !f.statut    || r.statut    === f.statut;    })
    .filter(function(r) { return !f.situation || r.situation === f.situation; })
    .filter(function(r) {
      return !f.search || JSON.stringify(r).toLowerCase().indexOf(String(f.search).toLowerCase()) > -1;
    })
    .map(function(r) {
      r.created_by_name = usersById[r.created_by] ? usersById[r.created_by].full_name : '';
      r.delai_formate   = formatDelai_(r.delai_secondes);
      r.historique      = safeParseJson_(r.historique_json, []);
      return r;
    })
    .sort(sortDescBy_('updated_at'));
}

function saveSinistre(token, payload) {
  const session  = requireSession_(token);
  const data     = payload || {};
  const rows     = readTable_('SINISTRES');
  const existing = data.id ? rows.find(function(r) { return r.id === data.id; }) : null;

  const wasTraite = existing && existing.statut === 'Traité';

  // Règle : mise à jour d'un dossier traité → commentaire obligatoire
  if (wasTraite && !String(data.commentaire || '').trim()) {
    throw new Error('Un commentaire est obligatoire pour modifier un sinistre déjà traité.');
  }

  const noSinistre    = String(data.no_sinistre || (existing && existing.no_sinistre) || '').trim();
  const noContrat     = String(data.no_contrat  || (existing && existing.no_contrat)  || '').trim();
  const commentaire   = String(data.commentaire || (existing && existing.commentaire) || '').trim();
  if (!noSinistre) throw new Error('Le N° de sinistre est obligatoire.');
  if (!noContrat)  throw new Error('Le N° de contrat est obligatoire.');

  const completude = String(data.completude || (existing && existing.completude) || '').trim();
  const isNew      = !existing;

  // ── Règles métier situation & statut ──────────────────────
  let situation, statut;

  if (wasTraite) {
    // Dossier traité remis à jour → repasse en traitement
    statut    = completude === 'OK' ? 'Complet' : 'Relance';
    situation = 'Complément';
  } else if (completude === 'OK') {
    statut    = 'Complet';
    situation = isNew ? 'Nouvelle déclaration' : 'Complément';
  } else if (completude === 'KO') {
    statut    = 'Relance';
    situation = 'En attente';
  } else {
    statut    = existing ? (existing.statut    || 'Relance') : 'Relance';
    situation = isNew    ? 'Nouvelle déclaration' : (existing.situation || 'Complément');
  }

  // ── Historique des mises à jour ───────────────────────────
  const historique = safeParseJson_(existing && existing.historique_json, []);
  if (existing) {
    historique.push({
      timestamp:   nowIso_(),
      user_id:     session.user.id,
      user_name:   session.user.full_name,
      action:      wasTraite ? 'MISE_A_JOUR_APRES_TRAITEMENT' : 'MISE_A_JOUR',
      commentaire: commentaire,
      old_statut:  existing.statut,
      new_statut:  statut
    });
  }

  const now = nowIso_();
  const row = Object.assign({}, existing || {}, {
    id:            existing ? existing.id        : nextId_('SIN'),
    reference:     existing ? existing.reference : nextReference_('SIN'),
    no_sinistre:   noSinistre,
    no_contrat:    noContrat,
    date_reception: String(data.date_reception || (existing && existing.date_reception) || '').trim(),
    gestionnaire:   String(data.gestionnaire   || (existing && existing.gestionnaire)   || '').trim(),
    commentaire:    commentaire,
    completude:     completude,
    situation:      situation,
    statut:         statut,
    historique_json: JSON.stringify(historique),
    created_by:    existing ? existing.created_by : session.user.id,
    created_at:    existing ? existing.created_at : now,
    updated_at:    now,
    // Réinitialisation du traitement si remise en travail
    traite_at:      wasTraite ? '' : (existing ? (existing.traite_at || '') : ''),
    delai_secondes: wasTraite ? 0  : (existing ? (existing.delai_secondes || 0) : 0),
    // Horodatage de début de traitement : mis à jour à chaque mise à jour
    delai_traitement_start: existing ? now : now
  });

  upsertRow_('SINISTRES', 'id', row);
  const actionType = existing ? (wasTraite ? 'UPDATE_AFTER_TREATMENT' : 'UPDATE') : 'CREATE';
  addAuditLog_(session, actionType, 'SINISTRE', row.id,
    wasTraite ? 'Sinistre remis en traitement après mise à jour' : 'Enregistrement sinistre',
    existing, row);
  saveEntityVersion_(session, 'SINISTRE', row.id, row,
    String(data.commentaire_mise_a_jour || '').trim(), actionType);
  return row;
}

/**
 * Clôture un sinistre et calcule le délai de traitement.
 * Fonctionne aussi pour les dossiers remis en traitement après une mise à jour.
 */
function traiterSinistre(token, id) {
  const session  = requireSession_(token);
  const rows     = readTable_('SINISTRES');
  const existing = rows.find(function(r) { return r.id === id; });

  if (!existing) throw new Error('Sinistre introuvable.');
  if (existing.statut === 'Traité')                 throw new Error('Ce sinistre est déjà traité. Faites une mise à jour avant de re-traiter.');

  const now       = nowIso_();
  // Délai calculé depuis delai_traitement_start si disponible, sinon created_at
  const startMs   = parseDateMs_(existing.delai_traitement_start || existing.created_at);
  const nowMs     = parseDateMs_(now);
  const delai     = Math.max(0, Math.round((nowMs - startMs) / 1000));

  // Historique : enregistre l'action Traité
  const historique = safeParseJson_(existing.historique_json, []);
  historique.push({
    timestamp:   now,
    user_id:     session.user.id,
    user_name:   session.user.full_name,
    action:      'TRAITE',
    commentaire: '',
    old_statut:  existing.statut,
    new_statut:  'Traité'
  });

  const row = Object.assign({}, existing, {
    statut:          'Traité',
    traite_at:       now,
    delai_secondes:  delai,
    updated_at:      now,
    historique_json: JSON.stringify(historique)
  });

  upsertRow_('SINISTRES', 'id', row);
  addAuditLog_(session, 'TRAITE', 'SINISTRE', row.id, 'Sinistre traité', existing, row);
  saveEntityVersion_(session, 'SINISTRE', row.id, row, '', 'TRAITE');

  const usersById = indexBy_(readTable_('USERS'), 'id');
  row.created_by_name = usersById[row.created_by] ? usersById[row.created_by].full_name : '';
  row.delai_formate   = formatDelai_(row.delai_secondes);
  row.historique      = safeParseJson_(row.historique_json, []);
  return row;
}

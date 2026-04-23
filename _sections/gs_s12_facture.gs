// ============================================================
// SECTION 12 — MODULE FACTURE v4
// Étapes partielles · Workflow Remonté / Vérifié
// ============================================================

function listFactures(token, filters) {
  const session   = requireSession_(token);
  const f         = filters || {};
  const usersById = indexBy_(readTable_('USERS'), 'id');

  return scopeFactures_(session, readTable_('FACTURES'))
    .filter(function(r) { return !f.statut || r.statut === f.statut; })
    .filter(function(r) {
      return !f.search || JSON.stringify(r).toLowerCase().indexOf(String(f.search).toLowerCase()) > -1;
    })
    .map(function(r) {
      r.created_by_name = usersById[r.created_by] ? usersById[r.created_by].full_name : '';
      r.verifie_par_name = usersById[r.verifie_par] ? usersById[r.verifie_par].full_name : '';
      r.delai_formate   = formatDelai_(r.delai_secondes);
      r.progression     = [r.etape_verification, r.etape_calcul, r.etape_reglement]
        .filter(function(v) { return v === true || String(v).toUpperCase() === 'TRUE'; }).length;
      return r;
    })
    // Dossiers Vérifié remontent en tête de liste
    .sort(function(a, b) {
      const av = (a.verifie_badge === true || String(a.verifie_badge).toUpperCase() === 'TRUE') ? 1 : 0;
      const bv = (b.verifie_badge === true || String(b.verifie_badge).toUpperCase() === 'TRUE') ? 1 : 0;
      if (bv !== av) return bv - av;
      return String(b.updated_at || '').localeCompare(String(a.updated_at || ''));
    });
}

/** Liste uniquement les dossiers en statut "Remonté" (pour Team Leaders / Admin) */
function listFacturesRemontees(token) {
  const session   = requireSession_(token);
  const usersById = indexBy_(readTable_('USERS'), 'id');

  return scopeFactures_(session, readTable_('FACTURES'))
    .filter(function(r) { return r.statut === 'Remonté'; })
    .map(function(r) {
      r.created_by_name = usersById[r.created_by] ? usersById[r.created_by].full_name : '';
      r.delai_formate   = formatDelai_(r.delai_secondes);
      r.progression     = [r.etape_verification, r.etape_calcul, r.etape_reglement]
        .filter(function(v) { return v === true || String(v).toUpperCase() === 'TRUE'; }).length;
      return r;
    })
    .sort(sortDescBy_('remonte_at'));
}

function saveFacture(token, payload) {
  const session  = requireSession_(token);
  const data     = payload || {};
  const rows     = readTable_('FACTURES');
  const existing = data.id ? rows.find(function(r) { return r.id === data.id; }) : null;

  const noSinistre = String(data.no_sinistre || (existing && existing.no_sinistre) || '').trim();
  if (!noSinistre) throw new Error('Le N° de sinistre est obligatoire.');

  const now = nowIso_();
  const row = Object.assign({}, existing || {}, {
    id:        existing ? existing.id        : nextId_('FAC'),
    reference: existing ? existing.reference : nextReference_('FAC'),
    no_sinistre: noSinistre,
    etape_verification: data.etape_verification !== undefined
      ? toBool_(data.etape_verification)
      : (existing ? (existing.etape_verification || 'FALSE') : 'FALSE'),
    etape_calcul: data.etape_calcul !== undefined
      ? toBool_(data.etape_calcul)
      : (existing ? (existing.etape_calcul || 'FALSE') : 'FALSE'),
    etape_reglement: data.etape_reglement !== undefined
      ? toBool_(data.etape_reglement)
      : (existing ? (existing.etape_reglement || 'FALSE') : 'FALSE'),
    commentaire_traitement: String(data.commentaire_traitement || (existing && existing.commentaire_traitement) || '').trim(),
    statut:        existing ? (existing.statut || 'En cours') : 'En cours',
    verifie_badge: existing ? (existing.verifie_badge || 'FALSE') : 'FALSE',
    verifie_at:    existing ? (existing.verifie_at    || '')      : '',
    verifie_par:   existing ? (existing.verifie_par   || '')      : '',
    remonte_at:    existing ? (existing.remonte_at    || '')      : '',
    created_by:    existing ? existing.created_by : session.user.id,
    created_at:    existing ? existing.created_at : now,
    updated_at:    now,
    traite_at:      existing ? (existing.traite_at     || '') : '',
    delai_secondes: existing ? (existing.delai_secondes || 0) : 0,
    // Horodatage de début de traitement : mis à jour à chaque save
    delai_traitement_start: existing ? now : now
  });

  upsertRow_('FACTURES', 'id', row);
  const actionType = existing ? 'UPDATE' : 'CREATE';
  addAuditLog_(session, actionType, 'FACTURE', row.id, 'Enregistrement facture', existing, row);
  saveEntityVersion_(session, 'FACTURE', row.id, row,
    String(data.commentaire_mise_a_jour || '').trim(), actionType);
  return row;
}

/**
 * Traite ou remonte une facture.
 *
 * Logique :
 *  1. Toutes les étapes cochées → traitement direct (statut = Traité)
 *  2. Dossier Vérifié par TL → traitement autorisé même si étapes incomplètes
 *  3. Étapes incomplètes sans vérification → commentaire obligatoire → statut = Remonté
 *
 * @param {string}  token
 * @param {string}  id
 * @param {Object}  options         - { commentaire }
 */
function traiterFacture(token, id, options) {
  const session  = requireSession_(token);
  const rows     = readTable_('FACTURES');
  const existing = rows.find(function(r) { return r.id === id; });
  const opts     = options || {};

  if (!existing)                    throw new Error('Facture introuvable.');
  if (existing.statut === 'Traité') throw new Error('Cette facture est déjà traitée.');

  // Utiliser les étapes depuis opts si fournies (clic direct sur Traiter),
  // sinon fallback sur les valeurs enregistrées dans le sheet.
  const curVeri = opts.etape_verification !== undefined ? toBool_(opts.etape_verification) : (existing.etape_verification || 'FALSE');
  const curCalc = opts.etape_calcul       !== undefined ? toBool_(opts.etape_calcul)       : (existing.etape_calcul       || 'FALSE');
  const curRegl = opts.etape_reglement    !== undefined ? toBool_(opts.etape_reglement)    : (existing.etape_reglement    || 'FALSE');

  const veri      = curVeri === true || String(curVeri).toUpperCase() === 'TRUE';
  const calc      = curCalc === true || String(curCalc).toUpperCase() === 'TRUE';
  const regl      = curRegl === true || String(curRegl).toUpperCase() === 'TRUE';
  const allDone   = veri && calc && regl;
  const isVerifie = existing.verifie_badge === true || String(existing.verifie_badge).toUpperCase() === 'TRUE';
  const commentaire = String(opts.commentaire || '').trim();

  // Cas 3 : étapes incomplètes, pas encore vérifiée → Remonté
  if (!allDone && !isVerifie) {
    if (!commentaire) {
      throw new Error('Un commentaire est obligatoire pour justifier les étapes non complétées.');
    }
    const now_r = nowIso_();
    const row_r = Object.assign({}, existing, {
      etape_verification:     curVeri,
      etape_calcul:           curCalc,
      etape_reglement:        curRegl,
      commentaire_traitement: commentaire,
      statut:     'Remonté',
      remonte_at: now_r,
      updated_at: now_r
    });
    upsertRow_('FACTURES', 'id', row_r);
    addAuditLog_(session, 'REMONTE', 'FACTURE', row_r.id,
      'Facture remontée pour vérification TL. Commentaire : ' + commentaire, existing, row_r);
    saveEntityVersion_(session, 'FACTURE', row_r.id, row_r, commentaire, 'REMONTE');
    const uid_r = indexBy_(readTable_('USERS'), 'id');
    row_r.created_by_name = uid_r[row_r.created_by] ? uid_r[row_r.created_by].full_name : '';
    row_r.delai_formate   = formatDelai_(row_r.delai_secondes);
    row_r.progression     = [row_r.etape_verification, row_r.etape_calcul, row_r.etape_reglement]
      .filter(function(v) { return String(v) === 'TRUE'; }).length;
    return Object.assign(row_r, { is_remonte: true });
  }

  // Cas 1 & 2 : traitement final
  const now       = nowIso_();
  const startMs   = parseDateMs_(existing.delai_traitement_start || existing.created_at);
  const nowMs     = parseDateMs_(now);
  const delai     = Math.max(0, Math.round((nowMs - startMs) / 1000));

  const row = Object.assign({}, existing, {
    etape_verification:     curVeri,
    etape_calcul:           curCalc,
    etape_reglement:        curRegl,
    commentaire_traitement: commentaire || (existing.commentaire_traitement || ''),
    statut:         'Traité',
    traite_at:      now,
    delai_secondes: delai,
    updated_at:     now
  });

  upsertRow_('FACTURES', 'id', row);
  addAuditLog_(session, 'TRAITE', 'FACTURE', row.id,
    isVerifie ? 'Facture traitée (après vérification TL)' : 'Facture traitée',
    existing, row);
  saveEntityVersion_(session, 'FACTURE', row.id, row, commentaire, 'TRAITE');

  const usersById = indexBy_(readTable_('USERS'), 'id');
  row.created_by_name  = usersById[row.created_by]  ? usersById[row.created_by].full_name  : '';
  row.verifie_par_name = usersById[row.verifie_par] ? usersById[row.verifie_par].full_name : '';
  row.delai_formate    = formatDelai_(row.delai_secondes);
  row.progression      = 3;
  return row;
}

/**
 * Vérification d'un dossier remonté par un Team Leader ou Admin.
 * Après vérification : statut = 'Vérifié', verifie_badge = 'TRUE'.
 * Le dossier revient dans la liste Factures et remonte en tête.
 */
function verifierFacture(token, id) {
  const session  = requireSession_(token);

  const rows     = readTable_('FACTURES');
  const existing = rows.find(function(r) { return r.id === id; });

  if (!existing)                     throw new Error('Facture introuvable.');
  if (existing.statut !== 'Remonté') throw new Error('Cette facture n\'est pas en statut "Remonté".');

  const now = nowIso_();
  const row = Object.assign({}, existing, {
    statut:       'Vérifié',
    verifie_badge: 'TRUE',
    verifie_at:   now,
    verifie_par:  session.user.id,
    updated_at:   now
  });

  upsertRow_('FACTURES', 'id', row);
  addAuditLog_(session, 'VERIFIE', 'FACTURE', row.id,
    'Facture vérifiée par ' + session.user.full_name, existing, row);
  saveEntityVersion_(session, 'FACTURE', row.id, row, '', 'VERIFIE');

  const usersById = indexBy_(readTable_('USERS'), 'id');
  row.created_by_name  = usersById[row.created_by]  ? usersById[row.created_by].full_name  : '';
  row.verifie_par_name = usersById[row.verifie_par] ? usersById[row.verifie_par].full_name : '';
  row.delai_formate    = formatDelai_(row.delai_secondes);
  row.progression      = [row.etape_verification, row.etape_calcul, row.etape_reglement]
    .filter(function(v) { return String(v) === 'TRUE'; }).length;
  return row;
}

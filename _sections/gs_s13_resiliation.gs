// ============================================================
// SECTION 13 — MODULE RÉSILIATION (inchangé)
// ============================================================

function listResiliations(token, filters) {
  const session   = requireSession_(token);
  const f         = filters || {};
  const usersById = indexBy_(readTable_('USERS'), 'id');

  return scopeResiliations_(session, readTable_('RESILIATIONS'))
    .filter(function(r) { return !f.statut || r.statut === f.statut; })
    .filter(function(r) {
      return !f.search || JSON.stringify(r).toLowerCase().indexOf(String(f.search).toLowerCase()) > -1;
    })
    .map(function(r) {
      r.created_by_name = usersById[r.created_by] ? usersById[r.created_by].full_name : '';
      r.delai_formate   = formatDelai_(r.delai_ouverture_soumission_secondes);
      return r;
    })
    .sort(sortDescBy_('updated_at'));
}

function saveResiliation(token, payload) {
  const session  = requireSession_(token);
  const data     = payload || {};
  const rows     = readTable_('RESILIATIONS');
  const existing = data.id ? rows.find(function(r) { return r.id === data.id; }) : null;

  if (existing && !scopeResiliations_(session, [existing]).length) {
    throw new Error('Accès refusé à cette résiliation.');
  }

  const noContrat = String(data.no_contrat || (existing && existing.no_contrat) || '').trim();
  if (!noContrat) throw new Error('Le N° de contrat est obligatoire.');

  const origine = String(data.origine || (existing && existing.origine) || '').trim();
  if (!existing && !origine) throw new Error('L\'origine est obligatoire.');

  const now = nowIso_();
  const row = Object.assign({}, existing || {}, {
    id:        existing ? existing.id        : nextId_('RES'),
    reference: existing ? existing.reference : nextReference_('RES'),
    origine:    origine,
    mail:       String(data.mail        || (existing && existing.mail)       || '').trim(),
    no_contrat: noContrat,
    completude: String(data.completude  || (existing && existing.completude) || '').trim(),
    resil:      String(data.resil       || (existing && existing.resil)      || '').trim(),
    commentaire: String(data.commentaire|| (existing && existing.commentaire)|| '').trim(),
    statut:     existing ? (existing.statut || 'En cours') : 'En cours',
    created_by: existing ? existing.created_by : session.user.id,
    created_at: existing ? existing.created_at : now,
    updated_at: now,
    soumis_at:  existing ? (existing.soumis_at || '') : '',
    delai_ouverture_soumission_secondes: existing
      ? (existing.delai_ouverture_soumission_secondes || 0) : 0
  });

  upsertRow_('RESILIATIONS', 'id', row);
  addAuditLog_(session, existing ? 'UPDATE' : 'CREATE', 'RESILIATION', row.id,
    'Enregistrement résiliation', existing, row);
  return row;
}

function soumettreResiliation(token, id, payload) {
  const session  = requireSession_(token);
  const rows     = readTable_('RESILIATIONS');
  const existing = rows.find(function(r) { return r.id === id; });

  if (!existing)                                        throw new Error('Résiliation introuvable.');
  if (!scopeResiliations_(session, [existing]).length)  throw new Error('Accès refusé.');
  if (existing.statut === 'Traité')                     throw new Error('Cette résiliation est déjà traitée.');

  const data        = payload || {};
  const completude  = String(data.completude  || existing.completude  || '').trim();
  const resil       = String(data.resil       || existing.resil       || '').trim();
  const commentaire = String(data.commentaire || existing.commentaire || '').trim();

  if (!completude)                                     throw new Error('La complétude est obligatoire.');
  if (completude === 'OK' && !resil)                   throw new Error('Le résultat Résil est obligatoire.');
  if (completude === 'OK' && resil === 'Résil KO' && !commentaire) {
    throw new Error('Le commentaire est obligatoire quand Résil = KO.');
  }

  let statut;
  if (completude === 'KO')              statut = 'Relance';
  else if (completude === 'OK' && resil) statut = 'Traité';
  else                                   statut = 'En cours';

  const now       = nowIso_();
  const createdMs = parseDateMs_(existing.created_at);
  const delai     = Math.max(0, Math.round((parseDateMs_(now) - createdMs) / 1000));

  const row = Object.assign({}, existing, {
    completude:   completude,
    resil:        resil,
    commentaire:  commentaire,
    statut:       statut,
    soumis_at:    now,
    delai_ouverture_soumission_secondes: delai,
    updated_at:   now
  });

  upsertRow_('RESILIATIONS', 'id', row);
  addAuditLog_(session, 'UPDATE', 'RESILIATION', row.id, 'Soumission résiliation', existing, row);

  const usersById = indexBy_(readTable_('USERS'), 'id');
  row.created_by_name = usersById[row.created_by] ? usersById[row.created_by].full_name : '';
  row.delai_formate   = formatDelai_(row.delai_ouverture_soumission_secondes);
  return row;
}

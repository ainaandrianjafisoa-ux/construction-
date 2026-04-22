// ============================================================
// SECTION 16 — VERSIONS D'ENTITÉS + RECHERCHE GLOBALE
// ============================================================

// ── Historique immuable des entités ──────────────────────────

/**
 * Sauvegarde un snapshot de version pour une entité.
 * Appelé depuis saveAgrement, saveSinistre, saveFacture,
 * saveResiliation, traiterSinistre, traiterFacture,
 * verifierFacture, soumettreResiliation.
 *
 * @param {Object} session       - session courante
 * @param {string} entityType    - 'AGREMENT' | 'SINISTRE' | 'FACTURE' | 'RESILIATION'
 * @param {string} entityId
 * @param {Object} snapshot      - objet row complet
 * @param {string} commentaire   - commentaire de mise à jour (optionnel)
 * @param {string} actionType    - 'CREATE' | 'UPDATE' | 'TRAITE' | etc.
 */
function saveEntityVersion_(session, entityType, entityId, snapshot, commentaire, actionType) {
  try {
    const existing = readTable_('ENTITY_VERSIONS')
      .filter(function(v) {
        return v.entity_type === entityType && v.entity_id === entityId;
      });
    const versionNum = existing.length + 1;

    upsertRow_('ENTITY_VERSIONS', 'id', {
      id:            nextId_('VER'),
      entity_type:   entityType,
      entity_id:     entityId,
      version_num:   versionNum,
      snapshot_json: safeJson_(snapshot),
      commentaire:   String(commentaire || ''),
      action_type:   String(actionType || 'UPDATE'),
      user_id:       session && session.user ? (session.user.id || '') : '',
      user_name:     session && session.user ? (session.user.full_name || '') : '',
      created_at:    nowIso_()
    });
  } catch(e) {
    // Non bloquant — ne pas empêcher la sauvegarde principale
    Logger.log('saveEntityVersion_ error: ' + e.message);
  }
}

/**
 * Retourne les versions d'une entité, triées desc par version_num.
 */
function getEntityVersions(token, entityType, entityId) {
  const session = requireSession_(token);
  // Vérifier que l'entité est visible par l'utilisateur
  if (!entityType || !entityId) throw new Error('entityType et entityId sont requis.');

  return readTable_('ENTITY_VERSIONS')
    .filter(function(v) {
      return v.entity_type === entityType && v.entity_id === entityId;
    })
    .sort(function(a, b) {
      return Number(b.version_num || 0) - Number(a.version_num || 0);
    });
}

// ── Recherche globale ─────────────────────────────────────────

/**
 * Recherche transversale sur tous les modules.
 *
 * @param {string} token
 * @param {string} query   - terme de recherche
 * @param {Array}  modules - ['agrement','sinistre','facture','resiliation'] (tous si vide)
 */
function globalSearch(token, query, modules) {
  const session    = requireSession_(token);
  const q          = String(query || '').trim().toLowerCase();
  if (q.length < 2) return [];

  const mods       = Array.isArray(modules) && modules.length
    ? modules.map(function(m) { return String(m).toLowerCase(); })
    : ['agrement', 'sinistre', 'facture', 'resiliation'];

  const usersById  = indexBy_(readTable_('USERS'), 'id');
  const results    = [];

  if (mods.indexOf('agrement') > -1) {
    scopeAgrements_(session, readTable_('AGREMENTS'))
      .filter(function(r) {
        return JSON.stringify(r).toLowerCase().indexOf(q) > -1 ||
               String(r.reference    || '').toLowerCase().indexOf(q) > -1 ||
               String(r.no_dossier   || '').toLowerCase().indexOf(q) > -1 ||
               String(r.client       || '').toLowerCase().indexOf(q) > -1 ||
               ((usersById[r.ambassadeur_assigne] || {}).full_name || '').toLowerCase().indexOf(q) > -1;
      })
      .slice(0, 20)
      .forEach(function(r) {
        results.push({
          module:    'agrement',
          id:        r.id,
          reference: r.reference || '',
          label:     (r.client || r.no_dossier || r.reference || ''),
          statut:    r.statut || '',
          date:      r.updated_at || r.created_at || ''
        });
      });
  }

  if (mods.indexOf('sinistre') > -1) {
    scopeSinistres_(session, readTable_('SINISTRES'))
      .filter(function(r) {
        return JSON.stringify(r).toLowerCase().indexOf(q) > -1 ||
               String(r.reference   || '').toLowerCase().indexOf(q) > -1 ||
               String(r.no_sinistre || '').toLowerCase().indexOf(q) > -1 ||
               String(r.no_contrat  || '').toLowerCase().indexOf(q) > -1 ||
               String(r.gestionnaire|| '').toLowerCase().indexOf(q) > -1;
      })
      .slice(0, 20)
      .forEach(function(r) {
        results.push({
          module:    'sinistre',
          id:        r.id,
          reference: r.reference || '',
          label:     (r.no_sinistre || r.no_contrat || r.reference || ''),
          statut:    r.statut || '',
          date:      r.updated_at || r.created_at || ''
        });
      });
  }

  if (mods.indexOf('facture') > -1) {
    scopeFactures_(session, readTable_('FACTURES'))
      .filter(function(r) {
        return JSON.stringify(r).toLowerCase().indexOf(q) > -1 ||
               String(r.reference   || '').toLowerCase().indexOf(q) > -1 ||
               String(r.no_sinistre || '').toLowerCase().indexOf(q) > -1;
      })
      .slice(0, 20)
      .forEach(function(r) {
        results.push({
          module:    'facture',
          id:        r.id,
          reference: r.reference || '',
          label:     (r.no_sinistre || r.reference || ''),
          statut:    r.statut || '',
          date:      r.updated_at || r.created_at || ''
        });
      });
  }

  if (mods.indexOf('resiliation') > -1) {
    scopeResiliations_(session, readTable_('RESILIATIONS'))
      .filter(function(r) {
        return JSON.stringify(r).toLowerCase().indexOf(q) > -1 ||
               String(r.reference  || '').toLowerCase().indexOf(q) > -1 ||
               String(r.no_contrat || '').toLowerCase().indexOf(q) > -1 ||
               String(r.mail       || '').toLowerCase().indexOf(q) > -1;
      })
      .slice(0, 20)
      .forEach(function(r) {
        results.push({
          module:    'resiliation',
          id:        r.id,
          reference: r.reference || '',
          label:     (r.no_contrat || r.reference || ''),
          statut:    r.statut || '',
          date:      r.updated_at || r.created_at || ''
        });
      });
  }

  // Sort by date desc
  results.sort(function(a, b) {
    return String(b.date || '').localeCompare(String(a.date || ''));
  });

  return results.slice(0, 50);
}

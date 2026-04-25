// ============================================================
// SECTION 1 — CONFIG, RÔLES, ENUMS, SCHEMA
// ============================================================

const APP_CONFIG = {
  APP_NAME: 'Syndic Ledger High-End',
  VERSION: '4.0.0',
  TIMEZONE: Session.getScriptTimeZone() || 'Indian/Antananarivo',
  HEARTBEAT_SECONDS: 45,
  SESSION_STALE_MINUTES: 2,
  SESSION_CACHE_TTL: 21600,
  DEFAULT_ADMIN_LOGIN: 'superadmin',
  DEFAULT_ADMIN_PASSWORD: 'ChangeMe123!'
};

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  TEAM_LEADER: 'team_leader',
  AMBASSADOR:  'ambassador'
};

// Valeurs par défaut (fallback si les paramètres n'ont pas encore été personnalisés)
const ENUMS = {
  USER_STATUS: ['Actif', 'Inactif', 'Suspendu'],

  // Module Agrément — valeurs par défaut (surchargées par SETTINGS si personnalisées)
  AGREMENT_TYPES:          ['GLI', 'IMMEUBLE'],
  TYPE_CLIENT:             ['Locataire', 'Garant'],
  PRIORITIES:              ['Basse', 'Normale', 'Haute', 'Urgente'],
  AGREMENT_STATUS:         ['Initié', 'En attente de traitement', 'En cours de traitement', 'Validé', 'Refusé', 'Clos'],
  MOTIF_VALIDATION:        ['Solvable', 'Non solvable'],

  // Nouveaux enums v4 — Module Agrément
  STATUTS_PRO:             ['CDI', 'Fonctionnaire titulaire', 'CDD', 'Retraité', 'Étudiant', 'TNS'],
  COMPAGNIES:              ['AXA', 'ALLIANZ'],
  STATUTS_FIN_TRAITEMENT:  ['Accepté', 'Refus', 'Attente de document', 'Sans suite', 'Faux dossier', 'PS'],

  // Module Sinistre
  SINISTRE_SITUATIONS:     ['Nouvelle déclaration', 'Complément', 'En attente'],
  SINISTRE_STATUTS:        ['Complet', 'Relance', 'Traité'],
  SINISTRE_COMPLETUDE:     ['OK', 'KO'],

  // Module Facture — workflow étendu v4
  FACTURE_STATUTS:         ['En cours', 'Remonté', 'Vérifié', 'Traité'],

  // Module Résiliation
  RESILIATION_ORIGINES:    ['Mail', 'BO' , 'Courrier'],
  RESILIATION_COMPLETUDE:  ['OK', 'KO'],
  RESILIATION_RESIL:       ['Résil OK', 'Résil KO'],
  RESILIATION_STATUTS:     ['En cours', 'Relance', 'Traité']
};

const SCHEMA = {
  USERS: [
    'id', 'login', 'password_hash', 'role', 'full_name', 'email',
    'team_id', 'team_leader_id', 'status', 'created_at', 'updated_at', 'last_login_at'
  ],
  TEAMS: [
    'id', 'name', 'team_leader_id', 'status', 'created_at', 'updated_at'
  ],

  // Module Agrément v4 — multi-profils, solvabilité overridable
  AGREMENTS: [
    'id', 'reference',
    // Infos dossier
    'type_dossier', 'no_dossier', 'priorite', 'client', 'adresse', 'date_reception',
    'type_client', 'compagnie',
    // Assignation
    'ambassadeur_assigne', 'gestionnaire_plus', 'equipe_id',
    // Statuts
    'statut', 'motif_validation', 'statut_fin_traitement',
    // Multi-profils
    'nombre_profils', 'profils_json', 'plafond_final',
    // Solvabilité mono-profil (rétro-compatibilité)
    'net_a_payer_1', 'net_a_payer_2', 'net_a_payer_3',
    'net_avant_impot_1', 'net_avant_impot_2', 'net_avant_impot_3',
    'brut_1', 'brut_2', 'brut_3',
    'loyer',
    'moyenne_net_a_payer', 'moyenne_net_avant_impot', 'moyenne_brut',
    'ratio_max', 'plafond_loyer', 'resultat_solvabilite',
    // Override manuel solvabilité
    'solvabilite_override', 'solvabilite_commentaire',
    'solvabilite_override_by', 'solvabilite_override_at',
    // Audit
    'created_by', 'updated_by', 'created_at', 'updated_at', 'closed_at',
    // Suivi temps de traitement (création / mise à jour)
    'traitement_session_active', 'traitement_session_type', 'traitement_session_started_at',
    'traitement_session_closed_at', 'dernier_traitement_secondes'
  ],

  // Cohérences type_dossier → équipe (lecture seule, non bloquant depuis v4)
  AGREMENT_TYPE_TEAM_MAP: [
    'id', 'type_dossier', 'team_id', 'team_name', 'active', 'updated_at'
  ],

  // Module Sinistre v4 — commentaire + historique des mises à jour
  SINISTRES: [
    'id', 'reference', 'no_sinistre', 'no_contrat', 'date_reception',
    'gestionnaire', 'commentaire', 'completude', 'situation', 'statut',
    'historique_json', 'transfer_origin', 'workflow_pending', 'workflow_pending_actions', 'workflow_last_action',
    'created_by', 'created_at', 'updated_at', 'traite_at', 'delai_secondes',
    'delai_traitement_start',
    'traitement_session_active', 'traitement_session_type', 'traitement_session_started_at',
    'traitement_session_closed_at', 'dernier_traitement_secondes'
  ],

  // Module Facture v4 — workflow Remonté / Vérifié
  FACTURES: [
    'id', 'reference', 'no_sinistre', 'date_reception',
    'etape_verification', 'etape_calcul', 'etape_reglement',
    'commentaire_traitement', 'commentaire_verification',
    'statut',
    'verifie_badge', 'verifie_at', 'verifie_par',
    'remonte_at',
    'created_by', 'created_at', 'updated_at', 'traite_at', 'delai_secondes',
    'delai_traitement_start',
    'traitement_session_active', 'traitement_session_type', 'traitement_session_started_at',
    'traitement_session_closed_at', 'dernier_traitement_secondes'
  ],

  // Module Résiliation
  RESILIATIONS: [
    'id', 'reference', 'origine', 'mail', 'no_contrat',
    'date_reception', 'date_sortie', 'motif_resiliation',
    'completude', 'resil', 'commentaire', 'statut',
    'created_by', 'created_at', 'updated_at',
    'soumis_at', 'delai_ouverture_soumission_secondes',
    'delai_traitement_start',
    'traitement_session_active', 'traitement_session_type', 'traitement_session_started_at',
    'traitement_session_closed_at', 'dernier_traitement_secondes'
  ],

  // Versions d'entités (historique immuable)
  ENTITY_VERSIONS: [
    'id', 'entity_type', 'entity_id', 'version_num',
    'snapshot_json', 'commentaire', 'action_type',
    'user_id', 'user_name', 'created_at'
  ],

  SESSIONS: [
    'session_id', 'token', 'user_id', 'login', 'role', 'team_id',
    'started_at', 'last_seen_at', 'closed_at', 'status', 'disconnect_reason', 'user_agent'
  ],
  PRESENCE_DAILY: [
    'id', 'date_key', 'user_id', 'login', 'full_name', 'role', 'team_id',
    'first_login_at', 'last_seen_at', 'last_disconnect_at',
    'connection_count', 'disconnection_count', 'online_seconds', 'is_online', 'updated_at'
  ],
  PLANNING_SHIFTS: [
    'id', 'date_key', 'user_id', 'login', 'full_name', 'role', 'team_id',
    'shift_start', 'shift_end', 'notes',
    'created_by', 'created_at', 'updated_by', 'updated_at'
  ],
  LOGIN_LOG: [
    'id', 'user_id', 'login', 'success', 'timestamp', 'user_agent', 'session_id', 'message'
  ],
  AUDIT_LOG: [
    'id', 'timestamp', 'user_id', 'login', 'role',
    'action_type', 'entity_type', 'entity_id', 'summary',
    'old_value_json', 'new_value_json'
  ],
  SETTINGS: ['key', 'value', 'updated_at']
};
// ============================================================
// SECTION 2 — FONCTIONS UTILITAIRES
// ============================================================

function nowIso_() {
  return Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
}

function todayKey_() {
  return Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyy-MM-dd');
}

function normalizeCell_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, APP_CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
  }
  // GAS lit TRUE/FALSE depuis Sheets comme booléens natifs — normaliser en chaîne
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return (value === null || value === undefined) ? '' : value;
}

function parseDateMs_(value) {
  if (!value) return 0;
  const d = new Date(value);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function nextId_(prefix) {
  return prefix + '_' + Utilities.getUuid().split('-')[0].toUpperCase();
}

function nextReference_(prefix) {
  const props = PropertiesService.getScriptProperties();
  const key   = 'SEQ_' + prefix;
  const current = Number(props.getProperty(key) || '0') + 1;
  props.setProperty(key, String(current));
  const datePart = Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyyMMdd');
  return prefix + '-' + datePart + '-' + ('0000' + current).slice(-4);
}

function safeJson_(value) {
  try { return JSON.stringify(value); } catch (e) { return String(value); }
}

function safeParseJson_(str, fallback) {
  if (!str) return fallback !== undefined ? fallback : [];
  try { return JSON.parse(str); } catch(e) { return fallback !== undefined ? fallback : []; }
}

function indexBy_(rows, key) {
  return rows.reduce(function(acc, row) {
    acc[row[key]] = row;
    return acc;
  }, {});
}

function sortDescBy_(field) {
  return function(a, b) {
    return String(b[field] || '').localeCompare(String(a[field] || ''));
  };
}

function secondsToHHMM_(seconds) {
  const total = Number(seconds || 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2);
}

/**
 * Calcule la moyenne d'un tableau de nombres.
 * Ignore les valeurs nulles/vides si ignoreZero=true.
 */
function average_(values, ignoreZero) {
  const safe = (values || []).map(function(v) { return Number(v) || 0; });
  if (ignoreZero) {
    const nonZero = safe.filter(function(v) { return v > 0; });
    return nonZero.length ? nonZero.reduce(function(a, b) { return a + b; }, 0) / nonZero.length : 0;
  }
  return safe.length ? safe.reduce(function(a, b) { return a + b; }, 0) / safe.length : 0;
}

/** Formate un délai en secondes → "Xj Yh Zmin" */
function formatDelai_(seconds) {
  const s = Number(seconds || 0);
  if (!s || s < 0) return '—';
  const days    = Math.floor(s / 86400);
  const hours   = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (days > 0)  return days + 'j ' + hours + 'h ' + minutes + 'min';
  if (hours > 0) return hours + 'h ' + minutes + 'min';
  return minutes + 'min';
}

/** Normalise une valeur en booléen stocké 'TRUE'/'FALSE' */
function toBool_(value) {
  const s = String(value || '').toLowerCase().trim();
  return (s === 'true' || s === '1' || s === 'yes' || s === 'oui') ? 'TRUE' : 'FALSE';
}

function isTrue_(value) {
  const s = String(value || '').toLowerCase().trim();
  return s === 'true' || s === '1' || s === 'yes' || s === 'oui';
}

function normalizeTimestampInput_(value, fallbackValue) {
  const raw = String(value || '').trim();
  if (!raw) return fallbackValue || nowIso_();
  const d = new Date(raw);
  if (isNaN(d.getTime())) return fallbackValue || nowIso_();
  return Utilities.formatDate(d, APP_CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
}

function buildTraitementSessionFields_(existing, payload, defaultType) {
  const data          = payload || {};
  const fallbackNow   = nowIso_();
  const providedStart = String(data.traitement_session_started_at || '').trim();
  const sessionType   = String(data.traitement_session_type || '').trim()
    || defaultType
    || (existing ? 'UPDATE' : 'CREATE');

  if (providedStart) {
    return {
      traitement_session_active:      'TRUE',
      traitement_session_type:        sessionType,
      traitement_session_started_at:  normalizeTimestampInput_(providedStart, fallbackNow),
      traitement_session_closed_at:   '',
      dernier_traitement_secondes:    existing ? Number(existing.dernier_traitement_secondes || 0) : 0
    };
  }

  if (existing) {
    return {
      traitement_session_active:      String(existing.traitement_session_active || 'FALSE'),
      traitement_session_type:        String(existing.traitement_session_type || ''),
      traitement_session_started_at:  String(existing.traitement_session_started_at || ''),
      traitement_session_closed_at:   String(existing.traitement_session_closed_at || ''),
      dernier_traitement_secondes:    Number(existing.dernier_traitement_secondes || 0)
    };
  }

  return {
    traitement_session_active:      'TRUE',
    traitement_session_type:        sessionType || 'CREATE',
    traitement_session_started_at:  fallbackNow,
    traitement_session_closed_at:   '',
    dernier_traitement_secondes:    0
  };
}

function getTraitementEntityConfig_(entityType) {
  const key = String(entityType || '').toUpperCase().trim();
  switch (key) {
    case 'AGREMENT':
    case 'AGREMENTS':
      return { entity_type: 'AGREMENT', table: 'AGREMENTS' };
    case 'SINISTRE':
    case 'SINISTRES':
      return { entity_type: 'SINISTRE', table: 'SINISTRES' };
    case 'FACTURE':
    case 'FACTURES':
      return { entity_type: 'FACTURE', table: 'FACTURES' };
    case 'RESILIATION':
    case 'RESILIATIONS':
      return { entity_type: 'RESILIATION', table: 'RESILIATIONS' };
    default:
      return null;
  }
}


function getSinistrePostClosureActions_(row) {
  const situation = String((row && row.situation) || '').trim();
  if (situation === 'Nouvelle déclaration') return ['TO_ATTENTE', 'TO_COMPLEMENT', 'COMPLETE'];
  if (situation === 'Complément')           return ['TO_ATTENTE', 'COMPLETE'];
  if (situation === 'En attente')           return ['TO_COMPLEMENT', 'RELANCE'];
  return [];
}

function hydrateSinistreRow_(row, usersById) {
  const users = usersById || indexBy_(readTable_('USERS'), 'id');
  const out   = Object.assign({}, row || {});
  out.created_by_name             = users[out.created_by] ? users[out.created_by].full_name : '';
  out.delai_formate               = formatDelai_(out.delai_secondes);
  out.dernier_traitement_formate  = formatDelai_(out.dernier_traitement_secondes);
  out.historique                  = safeParseJson_(out.historique_json, []);
  out.pending_actions             = safeParseJson_(out.workflow_pending_actions, []);
  return out;
}

function applySinistreWorkflowAction(token, id, action, commentaire) {
  const session  = requireSession_(token);
  const rows     = readTable_('SINISTRES');
  const existing = rows.find(function(r) { return r.id === id; });
  if (!existing) throw new Error('Sinistre introuvable.');

  const pending = isTrue_(existing.workflow_pending);
  const allowed = safeParseJson_(existing.workflow_pending_actions, []);
  const act     = String(action || '').trim();
  const note    = String(commentaire || '').trim();

  if (!pending || allowed.indexOf(act) === -1) {
    throw new Error('Aucune action de workflow disponible pour ce sinistre.');
  }

  let newSituation    = String(existing.situation || '').trim();
  let newStatut       = String(existing.statut || '').trim();
  let transferOrigin  = String(existing.transfer_origin || '').trim();
  let actionLabel     = '';

  switch (act) {
    case 'TO_ATTENTE':
      transferOrigin = String(existing.situation || '').trim();
      newSituation   = 'En attente';
      newStatut      = 'Relance';
      actionLabel    = 'Transfert vers En attente';
      break;
    case 'TO_COMPLEMENT':
      transferOrigin = String(existing.situation || '').trim();
      newSituation   = 'Complément';
      newStatut      = 'Complet';
      actionLabel    = 'Transfert vers Complément';
      break;
    case 'COMPLETE':
      newStatut   = 'Complet';
      actionLabel = 'Dossier complet';
      break;
    case 'RELANCE':
      if (!note) throw new Error('Un commentaire est obligatoire pour enregistrer une relance.');
      newStatut   = 'Relance';
      actionLabel = 'Relance';
      break;
    default:
      throw new Error('Action de workflow inconnue.');
  }

  const now        = nowIso_();
  const historique = safeParseJson_(existing.historique_json, []);
  historique.push({
    timestamp:     now,
    user_id:       session.user.id,
    user_name:     session.user.full_name,
    action:        'WORKFLOW_' + act,
    commentaire:   note,
    old_statut:    existing.statut || '',
    new_statut:    newStatut,
    old_situation: existing.situation || '',
    new_situation: newSituation,
    origin:        transferOrigin
  });

  const row = Object.assign({}, existing, {
    situation:                 newSituation,
    statut:                    newStatut,
    transfer_origin:           transferOrigin,
    workflow_pending:          'FALSE',
    workflow_pending_actions:  '[]',
    workflow_last_action:      act,
    updated_at:                now,
    historique_json:           JSON.stringify(historique)
  });

  upsertRow_('SINISTRES', 'id', row);
  addAuditLog_(session, 'SINISTRE_WORKFLOW_' + act, 'SINISTRE', row.id, actionLabel, existing, row);
  saveEntityVersion_(session, 'SINISTRE', row.id, row, note || actionLabel, 'WORKFLOW_' + act);
  return hydrateSinistreRow_(row, indexBy_(readTable_('USERS'), 'id'));
}

function cloturerTraitementSession(token, entityType, id) {
  const session = requireSession_(token);
  const cfg     = getTraitementEntityConfig_(entityType);
  if (!cfg) throw new Error('Module de traitement inconnu.');

  const rows     = readTable_(cfg.table);
  const existing = rows.find(function(r) { return r.id === id; });
  if (!existing) throw new Error('Dossier introuvable.');

  if (!isTrue_(existing.traitement_session_active)) {
    throw new Error('Aucun traitement en cours à clôturer pour ce dossier.');
  }

  const now       = nowIso_();
  const startAt   = String(existing.traitement_session_started_at || existing.updated_at || existing.created_at || now);
  const startMs   = parseDateMs_(startAt);
  const delai     = Math.max(0, Math.round((parseDateMs_(now) - startMs) / 1000));
  let row       = Object.assign({}, existing, {
    traitement_session_active:     'FALSE',
    traitement_session_closed_at:  now,
    dernier_traitement_secondes:   delai,
    updated_at:                    now
  });

  if (cfg.entity_type === 'SINISTRE') {
    const actions = getSinistrePostClosureActions_(row);
    row.workflow_pending         = actions.length ? 'TRUE' : 'FALSE';
    row.workflow_pending_actions = JSON.stringify(actions);
  }

  if (row.updated_by !== undefined) row.updated_by = session.user.id;

  upsertRow_(cfg.table, 'id', row);
  addAuditLog_(session, 'CLOSE_TREATMENT_SESSION', cfg.entity_type, row.id,
    'Clôture traitement ' + String(existing.traitement_session_type || '').trim() + ' (' + formatDelai_(delai) + ')',
    existing, row);
  saveEntityVersion_(session, cfg.entity_type, row.id, row, 'Traitement clôturé en ' + formatDelai_(delai), 'CLOSE_TREATMENT');

  if (cfg.entity_type === 'AGREMENT') {
    const usersById = indexBy_(readTable_('USERS'), 'id');
    const teamsById = indexBy_(readTable_('TEAMS'), 'id');
    const hydrated  = hydrateAgrementRow_(Object.assign({}, row), usersById, teamsById);
    hydrated.dernier_traitement_formate = formatDelai_(delai);
    return hydrated;
  }

  const usersById = indexBy_(readTable_('USERS'), 'id');
  row.created_by_name = usersById[row.created_by] ? usersById[row.created_by].full_name : '';
  row.dernier_traitement_formate = formatDelai_(delai);

  if (cfg.entity_type === 'SINISTRE') {
    row.delai_formate  = formatDelai_(row.delai_secondes);
    row.historique     = safeParseJson_(row.historique_json, []);
    row.pending_actions = safeParseJson_(row.workflow_pending_actions, []);
  } else if (cfg.entity_type === 'FACTURE') {
    row.verifie_par_name = usersById[row.verifie_par] ? usersById[row.verifie_par].full_name : '';
    row.delai_formate    = formatDelai_(row.delai_secondes);
    row.progression      = [row.etape_verification, row.etape_calcul, row.etape_reglement]
      .filter(function(v) { return v === true || String(v).toUpperCase() === 'TRUE'; }).length;
  } else if (cfg.entity_type === 'RESILIATION') {
    row.delai_formate = formatDelai_(row.delai_ouverture_soumission_secondes);
  }

  return row;
}

function hashPassword_(plain) {
  const props = PropertiesService.getScriptProperties();
  let salt = props.getProperty('PASSWORD_SALT');
  if (!salt) {
    salt = Utilities.getUuid().replace(/-/g, '');
    props.setProperty('PASSWORD_SALT', salt);
  }
  const raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(plain) + salt
  );
  return raw.map(function(byte) {
    const v = (byte < 0 ? byte + 256 : byte).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function publicUser_(row) {
  return {
    id:             row.id             || '',
    login:          row.login          || '',
    role:           row.role           || '',
    full_name:      row.full_name      || '',
    email:          row.email          || '',
    team_id:        row.team_id        || '',
    team_leader_id: row.team_leader_id || '',
    status:         row.status         || '',
    created_at:     row.created_at     || '',
    updated_at:     row.updated_at     || '',
    last_login_at:  row.last_login_at  || ''
  };
}

function publicTeam_(row) {
  return {
    id:             row.id             || '',
    name:           row.name           || '',
    team_leader_id: row.team_leader_id || '',
    status:         row.status         || '',
    created_at:     row.created_at     || '',
    updated_at:     row.updated_at     || ''
  };
}

function roleCanManage_(actorRole, targetRole) {
  if (actorRole === ROLES.SUPER_ADMIN) return true;
  if (actorRole === ROLES.TEAM_LEADER) return targetRole === ROLES.AMBASSADOR;
  return false;
}

function normalizeDossierType_(value) {
  return String(value || '').trim().toUpperCase();
}

function isActiveRule_(value) {
  const v = String(value || '').toLowerCase();
  return v === 'true' || v === '1' || v === 'oui' || v === 'actif';
}
// ============================================================
// SECTION 3 — BASE DE DONNÉES (GOOGLE SHEETS)
// ============================================================

function getDatabase_() {
  const props = PropertiesService.getScriptProperties();
  const dbId = props.getProperty('DB_ID');

  // 1) Si un DB_ID valide existe déjà, on l'utilise
  if (dbId) {
    try {
      return SpreadsheetApp.openById(dbId);
    } catch (e) {
      Logger.log('DB_ID invalide ou inaccessible, fallback sur le classeur courant : ' + e.message);
    }
  }

  // 2) En priorité, utiliser le classeur courant si le script est lié à une Sheet
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) {
      props.setProperty('DB_ID', active.getId());
      return active;
    }
  } catch (e) {
    Logger.log('Aucun classeur actif disponible : ' + e.message);
  }

  // 3) Fallback : créer un nouveau classeur de données si le script n'est pas lié à une Sheet
  const ss = SpreadsheetApp.create(APP_CONFIG.APP_NAME + ' - Data');
  props.setProperty('DB_ID', ss.getId());
  return ss;
}

function useActiveSpreadsheetAsDatabase() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('Aucun classeur actif trouvé.');

  PropertiesService.getScriptProperties().setProperty('DB_ID', active.getId());
  const dbInfo = ensureSheets_();
  seedBaseData_();
  ensurePresenceTrigger_();

  return {
    ok: true,
    spreadsheetId: active.getId(),
    spreadsheetUrl: dbInfo.spreadsheetUrl,
    message: 'Le classeur courant est maintenant utilisé comme base de données.'
  };
}

function styleHeader_(sheet, cols) {
  sheet.getRange(1, 1, 1, cols)
    .setFontWeight('bold')
    .setBackground('#16324F')
    .setFontColor('#FFFFFF');
}

// ── Lecture des entêtes réelles du sheet ─────────────────────
function getSheetHeaders_(sheet) {
  if (sheet.getLastColumn() < 1) return [];
  return sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(function(h) { return String(h || '').trim(); });
}

/**
 * Génère les entêtes de toutes les feuilles du SCHEMA.
 * À lancer une fois dans une nouvelle Google Sheet.
 */
function generateAllHeaders() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = getDatabase_();
    const report = [];

    Object.keys(SCHEMA).forEach(function(name) {
      const headers = SCHEMA[name] || [];
      let sheet = ss.getSheetByName(name);
      if (!sheet) sheet = ss.insertSheet(name);

      sheet.clearContents();
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      styleHeader_(sheet, headers.length);
      report.push(name + ' : ' + headers.length + ' entêtes générées');
    });

    return {
      ok: true,
      spreadsheetId: ss.getId(),
      spreadsheetUrl: ss.getUrl(),
      report: report
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Génère ou régénère les entêtes d'une seule feuille.
 * Exemple : generateSheetHeadersByName('AGREMENTS')
 */
function generateSheetHeadersByName(sheetName) {
  const name = String(sheetName || '').trim();
  if (!name) throw new Error('Le nom de la feuille est obligatoire.');
  if (!SCHEMA[name]) throw new Error('Aucun schéma trouvé pour la feuille : ' + name);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = getDatabase_();
    const headers = SCHEMA[name];
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);

    sheet.clearContents();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    styleHeader_(sheet, headers.length);

    return {
      ok: true,
      sheet: name,
      headersCount: headers.length,
      spreadsheetId: ss.getId(),
      spreadsheetUrl: ss.getUrl()
    };
  } finally {
    lock.releaseLock();
  }
}

// ── Création / ajout de colonnes manquantes ──────────────────
function ensureSheets_() {
  const ss = getDatabase_();

  Object.keys(SCHEMA).forEach(function(name) {
    const schemaHeaders = SCHEMA[name];
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, schemaHeaders.length).setValues([schemaHeaders]);
      styleHeader_(sheet, schemaHeaders.length);
      return;
    }

    const currentHeaders = getSheetHeaders_(sheet);
    const missing = schemaHeaders.filter(function(h) {
      return currentHeaders.indexOf(h) === -1;
    });
    if (missing.length) {
      const startCol = sheet.getLastColumn() + 1;
      sheet.insertColumnsAfter(sheet.getLastColumn(), missing.length);
      sheet.getRange(1, startCol, 1, missing.length).setValues([missing]);
      styleHeader_(sheet, startCol - 1 + missing.length);
    }
  });

  return { spreadsheetId: ss.getId(), spreadsheetUrl: ss.getUrl() };
}

// ── Lecture ───────────────────────────────────────────────────
function readTable_(name) {
  const ss    = getDatabase_();
  const sheet = ss.getSheetByName(name);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const values  = sheet.getDataRange().getValues();
  const headers = values[0].map(function(h) { return String(h || '').trim(); });

  return values.slice(1)
    .filter(function(row) {
      return row.some(function(cell) { return cell !== '' && cell !== null; });
    })
    .map(function(row) {
      const obj = {};
      headers.forEach(function(header, i) {
        obj[header] = normalizeCell_(row[i]);
      });
      return obj;
    });
}

// ── Écriture (utilise les entêtes RÉELLES du sheet) ──────────
function upsertRow_(name, keyField, rowObj) {
  const ss    = getDatabase_();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Sheet introuvable : ' + name);

  // Utiliser les entêtes réelles (pas SCHEMA) pour l'ordre des colonnes
  const headers  = getSheetHeaders_(sheet);
  if (!headers.length) throw new Error('Sheet sans entêtes : ' + name);

  const keyIndex = headers.indexOf(keyField);
  if (keyIndex === -1) throw new Error('Clé primaire introuvable dans ' + name + ' : ' + keyField);

  const rowValues = headers.map(function(h) {
    return rowObj[h] !== undefined ? rowObj[h] : '';
  });

  const values = sheet.getDataRange().getValues();
  let foundRow = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][keyIndex] || '') === String(rowObj[keyField] || '')) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow === -1) sheet.appendRow(rowValues);
  else sheet.getRange(foundRow, 1, 1, headers.length).setValues([rowValues]);
}

// ── Paramètres ────────────────────────────────────────────────
function setSetting_(key, value) {
  upsertRow_('SETTINGS', 'key', { key: key, value: value, updated_at: nowIso_() });
}

function getSetting_(key, defaultValue) {
  const row = readTable_('SETTINGS').find(function(r) { return r.key === key; });
  return row ? row.value : (defaultValue !== undefined ? defaultValue : null);
}

function setSettingIfEmpty_(key, value) {
  const row = readTable_('SETTINGS').find(function(r) { return r.key === key; });
  if (!row) setSetting_(key, value);
}

function getParametrableList_(settingKey, defaults) {
  const stored = getSetting_('PARAM_' + settingKey, null);
  if (stored) {
    const parsed = safeParseJson_(stored, null);
    if (Array.isArray(parsed) && parsed.length) return parsed;
  }
  return defaults || [];
}

function generateSheetsStructure() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return ensureSheets_();
  } finally {
    lock.releaseLock();
  }
}

// ── Réparation et alignement complet des sheets ──────────────
/**
 * Réaligne TOUTES les feuilles sur le SCHEMA :
 *  - Crée les feuilles manquantes
 *  - Réordonne les colonnes selon SCHEMA (sans perte de données)
 *  - Supprime les colonnes orphelines (absentes du SCHEMA)
 *  - Retourne un rapport ligne par ligne
 *
 * À appeler depuis l'éditeur GAS : repairAndRealignSheets()
 */
function repairAndRealignSheets() {
  const lock = LockService.getScriptLock();
  lock.waitLock(60000);
  try {
    const ss     = getDatabase_();
    const report = [];

    Object.keys(SCHEMA).forEach(function(name) {
      const schemaHeaders = SCHEMA[name];
      let sheet = ss.getSheetByName(name);

      // ── Feuille inexistante : créer ──────────────────────────
      if (!sheet) {
        sheet = ss.insertSheet(name);
        sheet.getRange(1, 1, 1, schemaHeaders.length).setValues([schemaHeaders]);
        styleHeader_(sheet, schemaHeaders.length);
        report.push('[CRÉÉE] ' + name + ' — ' + schemaHeaders.length + ' colonnes');
        return;
      }

      const lastRow = sheet.getLastRow();

      // ── Feuille vide : écrire les entêtes ───────────────────
      if (lastRow === 0) {
        sheet.getRange(1, 1, 1, schemaHeaders.length).setValues([schemaHeaders]);
        styleHeader_(sheet, schemaHeaders.length);
        report.push('[ENTÊTES] ' + name + ' — entêtes initialisées');
        return;
      }

      // ── Lire les données actuelles ──────────────────────────
      const allValues     = sheet.getDataRange().getValues();
      const currentHeaders = allValues[0].map(function(h) { return String(h || '').trim(); });

      // Vérifier si déjà parfaitement aligné
      const aligned = schemaHeaders.length === currentHeaders.length &&
        schemaHeaders.every(function(h, i) { return currentHeaders[i] === h; });
      if (aligned) {
        report.push('[OK]    ' + name + ' — déjà aligné (' + schemaHeaders.length + ' col.)');
        return;
      }

      // ── Remap les données selon SCHEMA ──────────────────────
      const dataRows = allValues.slice(1).filter(function(row) {
        return row.some(function(cell) { return cell !== '' && cell !== null; });
      });

      const newData = dataRows.map(function(row) {
        return schemaHeaders.map(function(h) {
          const oldIdx = currentHeaders.indexOf(h);
          return oldIdx > -1 ? row[oldIdx] : '';
        });
      });

      // Colonnes présentes dans sheet mais absentes du SCHEMA
      const orphans = currentHeaders.filter(function(h) {
        return h && schemaHeaders.indexOf(h) === -1;
      });

      // ── Réécrire le sheet ────────────────────────────────────
      sheet.clearContents();
      sheet.getRange(1, 1, 1, schemaHeaders.length).setValues([schemaHeaders]);
      styleHeader_(sheet, schemaHeaders.length);

      if (newData.length > 0) {
        sheet.getRange(2, 1, newData.length, schemaHeaders.length).setValues(newData);
      }

      // Supprimer les colonnes en trop
      const totalCols = sheet.getMaxColumns();
      if (totalCols > schemaHeaders.length) {
        sheet.deleteColumns(schemaHeaders.length + 1, totalCols - schemaHeaders.length);
      }

      const orphanMsg = orphans.length ? ' | colonnes supprimées: ' + orphans.join(', ') : '';
      report.push('[RÉALIGNÉ] ' + name +
        ' — ' + currentHeaders.length + ' → ' + schemaHeaders.length + ' col.' +
        ' | ' + newData.length + ' lignes' + orphanMsg);
    });

    Logger.log(report.join('\n'));
    return report;
  } finally {
    lock.releaseLock();
  }
}
// ============================================================
// SECTION 4 — SEED, AUDIT, LOGS
// ============================================================

function seedBaseData_() {
  const teams = readTable_('TEAMS');
  const users = readTable_('USERS');
  const rules = readTable_('AGREMENT_TYPE_TEAM_MAP');

  if (!teams.some(function(t) { return t.id === 'TEAM_GLI'; })) {
    upsertRow_('TEAMS', 'id', {
      id: 'TEAM_GLI', name: 'Équipe GLI', team_leader_id: '',
      status: 'Actif', created_at: nowIso_(), updated_at: nowIso_()
    });
  }
  if (!teams.some(function(t) { return t.id === 'TEAM_IMMEUBLE'; })) {
    upsertRow_('TEAMS', 'id', {
      id: 'TEAM_IMMEUBLE', name: 'Équipe Immeuble', team_leader_id: '',
      status: 'Actif', created_at: nowIso_(), updated_at: nowIso_()
    });
  }

  if (!users.length) {
    upsertRow_('USERS', 'id', {
      id: nextId_('USR'),
      login: APP_CONFIG.DEFAULT_ADMIN_LOGIN,
      password_hash: hashPassword_(APP_CONFIG.DEFAULT_ADMIN_PASSWORD),
      role: ROLES.SUPER_ADMIN,
      full_name: 'Super Administrateur',
      email: '', team_id: '', team_leader_id: '',
      status: 'Actif',
      created_at: nowIso_(), updated_at: nowIso_(), last_login_at: ''
    });
  }

  // Cohérences type_dossier → équipe (optionnelles, non bloquantes depuis v4)
  if (!rules.some(function(r) {
    return String(r.type_dossier || '').toUpperCase() === 'GLI';
  })) {
    upsertRow_('AGREMENT_TYPE_TEAM_MAP', 'id', {
      id: nextId_('MAP'), type_dossier: 'GLI',
      team_id: 'TEAM_GLI', team_name: 'Équipe GLI',
      active: 'TRUE', updated_at: nowIso_()
    });
  }
  if (!rules.some(function(r) {
    return String(r.type_dossier || '').toUpperCase() === 'IMMEUBLE';
  })) {
    upsertRow_('AGREMENT_TYPE_TEAM_MAP', 'id', {
      id: nextId_('MAP'), type_dossier: 'IMMEUBLE',
      team_id: 'TEAM_IMMEUBLE', team_name: 'Équipe Immeuble',
      active: 'TRUE', updated_at: nowIso_()
    });
  }

  setSettingIfEmpty_('SESSION_STALE_MINUTES', String(APP_CONFIG.SESSION_STALE_MINUTES));
  setSettingIfEmpty_('APP_VERSION', APP_CONFIG.VERSION);

  // Seed paramètres par défaut si absents
  setSettingIfEmpty_('PARAM_STATUTS_PRO',            JSON.stringify(ENUMS.STATUTS_PRO));
  setSettingIfEmpty_('PARAM_COMPAGNIES',             JSON.stringify(ENUMS.COMPAGNIES));
  setSettingIfEmpty_('PARAM_STATUTS_FIN_TRAITEMENT', JSON.stringify(ENUMS.STATUTS_FIN_TRAITEMENT));
  setSettingIfEmpty_('PARAM_AGREMENT_STATUS',        JSON.stringify(ENUMS.AGREMENT_STATUS));
  setSettingIfEmpty_('PARAM_PRIORITIES',             JSON.stringify(ENUMS.PRIORITIES));
  setSettingIfEmpty_('PARAM_AGREMENT_TYPES',         JSON.stringify(ENUMS.AGREMENT_TYPES));
  setSettingIfEmpty_('PARAM_TYPE_CLIENT',            JSON.stringify(ENUMS.TYPE_CLIENT));
  setSettingIfEmpty_('PARAM_MOTIF_VALIDATION',       JSON.stringify(ENUMS.MOTIF_VALIDATION));
  // Module Sinistre
  setSettingIfEmpty_('PARAM_SINISTRE_SITUATIONS',    JSON.stringify(ENUMS.SINISTRE_SITUATIONS));
  setSettingIfEmpty_('PARAM_SINISTRE_STATUTS',       JSON.stringify(ENUMS.SINISTRE_STATUTS));
  setSettingIfEmpty_('PARAM_SINISTRE_COMPLETUDE',    JSON.stringify(ENUMS.SINISTRE_COMPLETUDE));
  // Module Facture
  setSettingIfEmpty_('PARAM_FACTURE_STATUTS',        JSON.stringify(ENUMS.FACTURE_STATUTS));
  // Module Résiliation
  setSettingIfEmpty_('PARAM_RESILIATION_ORIGINES',   JSON.stringify(ENUMS.RESILIATION_ORIGINES));
  setSettingIfEmpty_('PARAM_RESILIATION_COMPLETUDE', JSON.stringify(ENUMS.RESILIATION_COMPLETUDE));
  setSettingIfEmpty_('PARAM_RESILIATION_RESIL',      JSON.stringify(ENUMS.RESILIATION_RESIL));
  setSettingIfEmpty_('PARAM_RESILIATION_STATUTS',    JSON.stringify(ENUMS.RESILIATION_STATUTS));
}

// ── Audit log ────────────────────────────────────────────────
function addAuditLog_(actor, actionType, entityType, entityId, summary, oldValue, newValue) {
  upsertRow_('AUDIT_LOG', 'id', {
    id: nextId_('AUD'),
    timestamp:   nowIso_(),
    user_id:  actor && (actor.user_id || actor.id || (actor.user && actor.user.id))  || '',
    login:    actor && (actor.login   || (actor.user && actor.user.login))            || '',
    role:     actor && (actor.role    || (actor.user && actor.user.role))             || '',
    action_type:    actionType  || '',
    entity_type:    entityType  || '',
    entity_id:      entityId    || '',
    summary:        summary     || '',
    old_value_json: oldValue  ? safeJson_(oldValue)  : '',
    new_value_json: newValue  ? safeJson_(newValue)  : ''
  });
}

function addLoginLog_(userId, login, success, userAgent, sessionId, message) {
  upsertRow_('LOGIN_LOG', 'id', {
    id: nextId_('LGN'),
    user_id: userId || '', login: login || '',
    success: success ? 'TRUE' : 'FALSE',
    timestamp: nowIso_(),
    user_agent: userAgent || '', session_id: sessionId || '', message: message || ''
  });
}

// ── Logs publics ─────────────────────────────────────────────
function getActivityLogs(token, limit) {
  const session   = requireSession_(token);
  const max       = Number(limit || 100);
  const visibleIds = scopeUsers_(session, readTable_('USERS')).map(function(u) { return u.id; });
  return readTable_('AUDIT_LOG')
    .filter(function(row) {
      return session.role === ROLES.SUPER_ADMIN || visibleIds.indexOf(row.user_id) > -1;
    })
    .sort(sortDescBy_('timestamp'))
    .slice(0, max);
}

function listLoginLogs(token, limit) {
  const session   = requireSession_(token);
  const max       = Number(limit || 100);
  const visibleIds = scopeUsers_(session, readTable_('USERS')).map(function(u) { return u.id; });
  return readTable_('LOGIN_LOG')
    .filter(function(row) {
      return session.role === ROLES.SUPER_ADMIN || visibleIds.indexOf(row.user_id) > -1;
    })
    .sort(sortDescBy_('timestamp'))
    .slice(0, max);
}
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
  return rows || [];
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
// ============================================================
// SECTION 6 — PRÉSENCE (POINTAGE)
// ============================================================

function getOrCreatePresenceDay_(user, dateKey) {
  const existing = readTable_('PRESENCE_DAILY').find(function(r) {
    return r.user_id === user.id && r.date_key === dateKey;
  });
  if (existing) return existing;

  const row = {
    id: nextId_('PRS'), date_key: dateKey,
    user_id: user.id, login: user.login, full_name: user.full_name,
    role: user.role, team_id: user.team_id || '',
    first_login_at: '', last_seen_at: '', last_disconnect_at: '',
    connection_count: 0, disconnection_count: 0, online_seconds: 0,
    is_online: 'FALSE', updated_at: nowIso_()
  };
  upsertRow_('PRESENCE_DAILY', 'id', row);
  return row;
}

function hasAnyOtherActiveSession_(userId) {
  return readTable_('SESSIONS').some(function(s) {
    return s.user_id === userId && s.status === 'ACTIVE';
  });
}

function markPresenceLogin_(user, session) {
  const record = getOrCreatePresenceDay_(user, todayKey_());
  record.first_login_at   = record.first_login_at || session.started_at;
  record.last_seen_at     = session.last_seen_at;
  record.connection_count = Number(record.connection_count || 0) + 1;
  record.is_online        = 'TRUE';
  record.updated_at       = nowIso_();
  upsertRow_('PRESENCE_DAILY', 'id', record);
}

function markPresenceHeartbeat_(user, session) {
  const record = getOrCreatePresenceDay_(user, todayKey_());
  record.last_seen_at = session.last_seen_at;
  record.is_online    = 'TRUE';
  record.updated_at   = nowIso_();
  upsertRow_('PRESENCE_DAILY', 'id', record);
}

function markPresenceDisconnect_(user, session, onlineSeconds) {
  const dateKey = session.started_at
    ? Utilities.formatDate(new Date(session.started_at), APP_CONFIG.TIMEZONE, 'yyyy-MM-dd')
    : todayKey_();
  const record = getOrCreatePresenceDay_(user, dateKey);
  record.last_disconnect_at  = session.closed_at || nowIso_();
  record.last_seen_at        = session.last_seen_at || nowIso_();
  record.disconnection_count = Number(record.disconnection_count || 0) + 1;
  record.online_seconds      = Number(record.online_seconds || 0) + Number(onlineSeconds || 0);
  record.is_online   = hasAnyOtherActiveSession_(user.id) ? 'TRUE' : 'FALSE';
  record.updated_at  = nowIso_();
  upsertRow_('PRESENCE_DAILY', 'id', record);
}

function finalizeSession_(row, reason) {
  const user = requireActiveUser_(row.user_id);
  row.closed_at         = nowIso_();
  row.last_seen_at      = row.last_seen_at || row.closed_at;
  row.status            = 'CLOSED';
  row.disconnect_reason = reason || 'closed';
  upsertRow_('SESSIONS', 'session_id', row);

  const startedMs     = parseDateMs_(row.started_at);
  const endMs         = parseDateMs_(row.closed_at);
  const onlineSeconds = Math.max(0, Math.round((endMs - startedMs) / 1000));

  markPresenceDisconnect_(user, row, onlineSeconds);
  addAuditLog_(user, 'LOGOUT', 'SESSION', row.session_id,
    'Session fermée (' + row.disconnect_reason + ')', null, row);
}

function closeStaleSessions() {
  const staleMinutes = Number(getSetting_('SESSION_STALE_MINUTES', APP_CONFIG.SESSION_STALE_MINUTES));
  const threshold    = Date.now() - staleMinutes * 60 * 1000;

  readTable_('SESSIONS')
    .filter(function(s) { return s.status === 'ACTIVE'; })
    .forEach(function(row) {
      const lastSeen = parseDateMs_(row.last_seen_at || row.started_at);
      if (!lastSeen || lastSeen > threshold) return;
      finalizeSession_(row, 'connection_lost');
      clearSessionCache_(row.token);
    });
}

function ensurePresenceTrigger_() {
  const exists = ScriptApp.getProjectTriggers().some(function(t) {
    return t.getHandlerFunction() === 'closeStaleSessions';
  });
  if (!exists) {
    ScriptApp.newTrigger('closeStaleSessions').timeBased().everyMinutes(1).create();
  }
}

function installOrRepairTriggers() {
  ensurePresenceTrigger_();
  return {
    ok: true,
    triggers: ScriptApp.getProjectTriggers().map(function(t) { return t.getHandlerFunction(); })
  };
}

function presenceDateBounds_(dateKey) {
  const day = String(dateKey || todayKey_()).slice(0, 10);
  const start = new Date(day + 'T00:00:00');
  const end = new Date(day + 'T23:59:59');
  return { day: day, startMs: start.getTime(), endMs: end.getTime() };
}

function presenceIsoToHHMM_(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return Utilities.formatDate(d, APP_CONFIG.TIMEZONE, 'HH:mm');
}

function normalizePlanningTime_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, APP_CONFIG.TIMEZONE, 'HH:mm');
  }

  const raw = String(value || '').trim();
  if (!raw) return '';

  // Cas normal attendu côté formulaire : 09:00 ou 09:00:00
  const direct = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (direct) {
    const h = Number(direct[1]);
    const min = Number(direct[2]);
    if (h < 0 || h > 23 || min < 0 || min > 59) return '';
    return ('0' + h).slice(-2) + ':' + ('0' + min).slice(-2);
  }

  // Google Sheets peut convertir 09:00 en date technique 1899-12-30T09:00:00
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw) || /^\d{4}-\d{2}-\d{2} /.test(raw)) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return Utilities.formatDate(d, APP_CONFIG.TIMEZONE, 'HH:mm');
  }

  // Google Sheets peut aussi stocker l'heure comme fraction de journée : 0.375 = 09:00
  const n = Number(raw.replace(',', '.'));
  if (!isNaN(n) && n >= 0 && n < 1) {
    const total = Math.round(n * 24 * 60);
    const h = Math.floor(total / 60) % 24;
    const min = total % 60;
    return ('0' + h).slice(-2) + ':' + ('0' + min).slice(-2);
  }

  return '';
}

function timeToMinutes_(value) {
  const t = normalizePlanningTime_(value);
  if (!t) return 0;
  const p = t.split(':');
  return Number(p[0]) * 60 + Number(p[1]);
}

function normalizePlanningDateKey_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, APP_CONFIG.TIMEZONE, 'yyyy-MM-dd');
  }
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return Utilities.formatDate(d, APP_CONFIG.TIMEZONE, 'yyyy-MM-dd');
  return raw.slice(0, 10);
}

function normalizePlanningShiftRow_(row) {
  const r = Object.assign({}, row || {});
  r.date_key    = normalizePlanningDateKey_(r.date_key);
  r.shift_start = normalizePlanningTime_(r.shift_start);
  r.shift_end   = normalizePlanningTime_(r.shift_end);
  return r;
}

function applyPlanningSheetFormats_() {
  const ss = getDatabase_();
  const sheet = ss.getSheetByName('PLANNING_SHIFTS');
  if (!sheet) return;
  const headers = getSheetHeaders_(sheet);
  ['date_key', 'shift_start', 'shift_end'].forEach(function(name) {
    const idx = headers.indexOf(name);
    if (idx !== -1) {
      sheet.getRange(1, idx + 1, Math.max(1, sheet.getMaxRows()), 1).setNumberFormat('@');
    }
  });
}

function ensurePresencePlanningSheets_() {
  ensureSheets_();
  applyPlanningSheetFormats_();
  return true;
}

function repairPlanningSheet() {
  ensurePresencePlanningSheets_();
  const ss = getDatabase_();
  const sheet = ss.getSheetByName('PLANNING_SHIFTS');
  let fixed = 0;

  if (sheet && sheet.getLastRow() > 1) {
    const values  = sheet.getDataRange().getValues();
    const headers = values[0].map(function(h) { return String(h || '').trim(); });
    const dateCol = headers.indexOf('date_key');
    const startCol = headers.indexOf('shift_start');
    const endCol = headers.indexOf('shift_end');

    for (let i = 1; i < values.length; i++) {
      let changed = false;
      if (dateCol !== -1) {
        const newDate = normalizePlanningDateKey_(values[i][dateCol]);
        if (String(values[i][dateCol] || '') !== newDate) { values[i][dateCol] = newDate; changed = true; }
      }
      if (startCol !== -1) {
        const newStart = normalizePlanningTime_(values[i][startCol]);
        if (String(values[i][startCol] || '') !== newStart) { values[i][startCol] = newStart; changed = true; }
      }
      if (endCol !== -1) {
        const newEnd = normalizePlanningTime_(values[i][endCol]);
        if (String(values[i][endCol] || '') !== newEnd) { values[i][endCol] = newEnd; changed = true; }
      }
      if (changed) fixed++;
    }

    if (fixed) {
      sheet.getRange(1, 1, values.length, headers.length).setValues(values);
      applyPlanningSheetFormats_();
    }
  }

  return {
    ok: true,
    sheet: 'PLANNING_SHIFTS',
    rows: sheet ? Math.max(0, sheet.getLastRow() - 1) : 0,
    fixedRows: fixed,
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl()
  };
}

function getPlanningShiftMap_(dateKey) {
  ensurePresencePlanningSheets_();
  const day = normalizePlanningDateKey_(dateKey || todayKey_());
  const map = {};
  readTable_('PLANNING_SHIFTS')
    .map(function(r) { return normalizePlanningShiftRow_(r); })
    .filter(function(r) { return r.date_key === day; })
    .forEach(function(r) {
      const prev = map[r.user_id];
      if (!prev || String(r.updated_at || r.created_at || '') > String(prev.updated_at || prev.created_at || '')) {
        map[r.user_id] = r;
      }
    });
  return map;
}

function buildPresenceSessionSegments_(userId, dateKey) {
  const bounds = presenceDateBounds_(dateKey);
  const nowMs = parseDateMs_(nowIso_());

  return readTable_('SESSIONS')
    .filter(function(s) {
      if (s.user_id !== userId) return false;
      const startMs = parseDateMs_(s.started_at);
      const rawEndMs = parseDateMs_(s.closed_at || s.last_seen_at) || nowMs;
      const endMs = Math.max(rawEndMs, startMs || rawEndMs);
      return startMs && startMs <= bounds.endMs && endMs >= bounds.startMs;
    })
    .map(function(s) {
      const startMs = Math.max(parseDateMs_(s.started_at), bounds.startMs);
      const rawEndMs = parseDateMs_(s.closed_at || s.last_seen_at) || nowMs;
      const endMs = Math.min(Math.max(rawEndMs, startMs), bounds.endMs);
      const startIso = Utilities.formatDate(new Date(startMs), APP_CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
      const endIso = Utilities.formatDate(new Date(endMs), APP_CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
      return {
        session_id: s.session_id || '',
        start_at: startIso,
        end_at: endIso,
        start_hhmm: presenceIsoToHHMM_(startIso),
        end_hhmm: presenceIsoToHHMM_(endIso),
        status: s.status || '',
        disconnect_reason: s.disconnect_reason || '',
        seconds: Math.max(0, Math.round((endMs - startMs) / 1000))
      };
    })
    .sort(function(a, b) { return String(a.start_at).localeCompare(String(b.start_at)); });
}

function normalizeRoleKey_(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')
    .trim();
}

function isAmbassadorUser_(user) {
  const role = normalizeRoleKey_(user && user.role);
  return role === ROLES.AMBASSADOR || role === 'ambassadeur' || role === 'ambassador';
}

function isActiveUserForPlanning_(user) {
  const status = String((user && user.status) || 'Actif')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim();
  return !status || status === 'actif' || status === 'active' || status === 'true' || status === '1';
}

function isPlanningUserVisibleForSession_(session, user) {
  if (!session || !user || !isAmbassadorUser_(user) || !isActiveUserForPlanning_(user)) return false;
  if (session.role === ROLES.SUPER_ADMIN) return true;
  if (session.role === ROLES.TEAM_LEADER) {
    const sameTeam = String(user.team_id || '') && String(user.team_id || '') === String(session.user.team_id || '');
    const assignedToTl = String(user.team_leader_id || '') && String(user.team_leader_id || '') === String(session.user.id || '');
    return sameTeam || assignedToTl;
  }
  return String(user.id || '') === String(session.user.id || '');
}

function canPlanUser_(session, user) {
  if (!session || !user) return false;
  return isPlanningUserVisibleForSession_(session, user);
}

function getVisiblePlanningUsers_(session) {
  return readTable_('USERS')
    .filter(function(u) { return isPlanningUserVisibleForSession_(session, u); })
    .sort(function(a, b) { return String(a.full_name || a.login || '').localeCompare(String(b.full_name || b.login || ''), 'fr'); });
}

function listPresence(token, dateKey) {
  const session    = requireSession_(token);
  const day        = normalizePlanningDateKey_(dateKey || todayKey_());
  const users      = getVisiblePlanningUsers_(session);
  const teamsById  = indexBy_(readTable_('TEAMS'), 'id');
  const presenceByUser = indexBy_(readTable_('PRESENCE_DAILY').filter(function(row) {
    return row.date_key === day;
  }), 'user_id');
  const activeSessions = readTable_('SESSIONS').filter(function(s) { return s.status === 'ACTIVE'; });
  const shiftByUser = getPlanningShiftMap_(day);

  return users.map(function(user) {
    const record   = presenceByUser[user.id] || {};
    const shift    = shiftByUser[user.id] || {};
    const segments = buildPresenceSessionSegments_(user.id, day);
    const computedOnlineSeconds = segments.reduce(function(n, seg) { return n + Number(seg.seconds || 0); }, 0);
    const firstLogin = record.first_login_at || (segments[0] ? segments[0].start_at : '');
    const lastClosedSegs = segments.filter(function(seg) { return String(seg.status || '').toUpperCase() !== 'ACTIVE'; });
    const lastDisconnect = record.last_disconnect_at || (lastClosedSegs.length ? lastClosedSegs[lastClosedSegs.length - 1].end_at : '');
    const currentlyOnline = activeSessions.some(function(s) { return s.user_id === user.id && s.status === 'ACTIVE'; });
    const connectionCount = Math.max(Number(record.connection_count || 0), segments.length);
    const closedCount = segments.filter(function(seg) { return String(seg.status || '').toUpperCase() !== 'ACTIVE'; }).length;
    const disconnectionCount = Math.max(Number(record.disconnection_count || 0), closedCount);
    const totalSeconds = computedOnlineSeconds || Number(record.online_seconds || 0);

    return {
      id: record.id || '',
      date_key: day,
      user_id: user.id,
      login: user.login || '',
      full_name: user.full_name || user.login || user.id,
      role: user.role || '',
      team_id: user.team_id || '',
      team_name: teamsById[user.team_id] ? teamsById[user.team_id].name : '',
      first_login_at: firstLogin,
      last_seen_at: record.last_seen_at || (segments.length ? segments[segments.length - 1].end_at : ''),
      last_disconnect_at: lastDisconnect,
      arrival_hhmm: presenceIsoToHHMM_(firstLogin),
      departure_hhmm: presenceIsoToHHMM_(lastDisconnect),
      connection_count: connectionCount,
      disconnection_count: disconnectionCount,
      online_seconds: totalSeconds,
      online_hhmm: secondsToHHMM_(totalSeconds),
      is_online: currentlyOnline ? 'TRUE' : 'FALSE',
      currently_online: currentlyOnline ? 'TRUE' : 'FALSE',
      planning_id: shift.id || '',
      shift_start: shift.shift_start || '',
      shift_end: shift.shift_end || '',
      shift_label: (shift.shift_start && shift.shift_end) ? (shift.shift_start + ' – ' + shift.shift_end) : 'Non planifié',
      shift_notes: shift.notes || '',
      session_segments: segments,
      presence_events: segments.reduce(function(acc, seg) {
        acc.push({ type: 'login', at: seg.start_at, hhmm: seg.start_hhmm, label: 'Connexion ' + seg.start_hhmm });
        if (String(seg.status || '').toUpperCase() !== 'ACTIVE') {
          acc.push({ type: 'logout', at: seg.end_at, hhmm: seg.end_hhmm, label: 'Déconnexion ' + seg.end_hhmm });
        }
        return acc;
      }, [])
    };
  });
}

function getPresenceSummary(token, dateKey) {
  const rows = listPresence(token, dateKey);
  return {
    date_key:              normalizePlanningDateKey_(dateKey || todayKey_()),
    total_users:           rows.length,
    online_now:            rows.filter(function(r) { return isTrue_(r.currently_online); }).length,
    total_connections:     rows.reduce(function(n, r) { return n + Number(r.connection_count     || 0); }, 0),
    total_disconnections:  rows.reduce(function(n, r) { return n + Number(r.disconnection_count  || 0); }, 0),
    total_online_seconds:  rows.reduce(function(n, r) { return n + Number(r.online_seconds       || 0); }, 0),
    rows: rows
  };
}

function listPlanningShifts(token, filters) {
  const session   = requireSession_(token);
  if (session.role !== ROLES.SUPER_ADMIN && session.role !== ROLES.TEAM_LEADER) {
    throw new Error('Accès planning non autorisé.');
  }
  const f         = filters || {};
  const day       = normalizePlanningDateKey_(f.date_key || todayKey_());
  const users     = getVisiblePlanningUsers_(session);
  const teamsById = indexBy_(readTable_('TEAMS'), 'id');
  const shiftByUser = getPlanningShiftMap_(day);

  return {
    date_key: day,
    users: users.map(function(u) {
      const s = shiftByUser[u.id] || {};
      return {
        user_id: u.id,
        login: u.login || '',
        full_name: u.full_name || u.login || u.id,
        role: u.role || '',
        team_id: u.team_id || '',
        team_name: teamsById[u.team_id] ? teamsById[u.team_id].name : '',
        planning_id: s.id || '',
        shift_start: s.shift_start || '',
        shift_end: s.shift_end || '',
        shift_label: (s.shift_start && s.shift_end) ? (s.shift_start + ' – ' + s.shift_end) : 'Non planifié',
        notes: s.notes || ''
      };
    })
  };
}

function savePlanningShift(token, payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const session = requireSession_(token);
    const data    = payload || {};
    const day     = normalizePlanningDateKey_(data.date_key || todayKey_());
    const userId  = String(data.user_id || '').trim();
    const start   = normalizePlanningTime_(data.shift_start);
    const end     = normalizePlanningTime_(data.shift_end);
    const notes   = String(data.notes || '').trim();

    if (!userId) throw new Error('Ambassadeur obligatoire.');
    if (!start || !end) throw new Error('Heure de début et heure de fin obligatoires au format HH:mm.');
    if (timeToMinutes_(end) <= timeToMinutes_(start)) throw new Error('L’heure de fin doit être après l’heure de début.');

    ensurePresencePlanningSheets_();

    const user = readTable_('USERS').find(function(u) {
      return String(u.id || '') === userId || String(u.login || '') === userId;
    });
    if (!user) throw new Error('Ambassadeur introuvable dans la feuille USERS.');
    if (!canPlanUser_(session, user)) throw new Error('Vous ne pouvez pas planifier cet utilisateur.');

    const existing = readTable_('PLANNING_SHIFTS').find(function(r) {
      return String(r.user_id || '') === String(user.id || '') && normalizePlanningDateKey_(r.date_key) === day;
    });
    const now = nowIso_();
    const row = Object.assign({}, existing || {}, {
      id: existing ? existing.id : nextId_('PLN'),
      date_key: day,
      user_id: user.id,
      login: user.login || '',
      full_name: user.full_name || user.login || user.id,
      role: user.role || ROLES.AMBASSADOR,
      team_id: user.team_id || '',
      shift_start: start,
      shift_end: end,
      notes: notes,
      created_by: existing ? existing.created_by : session.user.id,
      created_at: existing ? existing.created_at : now,
      updated_by: session.user.id,
      updated_at: now
    });

    upsertRow_('PLANNING_SHIFTS', 'id', row);
    applyPlanningSheetFormats_();
    addAuditLog_(session, existing ? 'UPDATE_PLANNING_SHIFT' : 'CREATE_PLANNING_SHIFT', 'PLANNING', row.id,
      'Planning ' + row.full_name + ' le ' + day + ' : ' + start + ' – ' + end,
      existing || null, row);

    return { ok: true, row: row, planning: listPlanningShifts(token, { date_key: day }) };
  } finally {
    lock.releaseLock();
  }
}

function deletePlanningShift(token, planningId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const session = requireSession_(token);
    const id = String(planningId || '').trim();
    if (!id) throw new Error('Planning introuvable.');
    ensurePresencePlanningSheets_();
    const row = readTable_('PLANNING_SHIFTS').find(function(r) { return String(r.id || '') === id; });
    if (!row) return { ok: true };
    const user = readTable_('USERS').find(function(u) { return String(u.id || '') === String(row.user_id || ''); });
    if (!canPlanUser_(session, user)) throw new Error('Vous ne pouvez pas supprimer ce planning.');

    const ss = getDatabase_();
    const sheet = ss.getSheetByName('PLANNING_SHIFTS');
    const values = sheet.getDataRange().getValues();
    const headers = values[0].map(function(h) { return String(h || '').trim(); });
    const idCol = headers.indexOf('id');
    if (idCol === -1) throw new Error('Colonne id introuvable dans PLANNING_SHIFTS.');
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idCol] || '') === id) {
        sheet.deleteRow(i + 1);
        addAuditLog_(session, 'DELETE_PLANNING_SHIFT', 'PLANNING', id,
          'Suppression planning ' + (row.full_name || row.user_id) + ' le ' + row.date_key,
          row, null);
        break;
      }
    }
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function listAuditLogsPaged(token, filters) {
  const session    = requireSession_(token);
  const f          = filters || {};
  const page       = Math.max(1, Number(f.page || 1));
  const pageSize   = Math.max(1, Math.min(100, Number(f.pageSize || 15)));
  const action     = String(f.action || '').trim();
  const usersById  = indexBy_(readTable_('USERS'), 'id');
  const visibleIds = scopeUsers_(session, readTable_('USERS')).map(function(u) { return u.id; });

  let rows = readTable_('AUDIT_LOG')
    .filter(function(r) {
      return session.role === ROLES.SUPER_ADMIN || visibleIds.indexOf(r.user_id) > -1;
    })
    .sort(sortDescBy_('timestamp'));

  const actions = rows.map(function(r) { return r.action_type || ''; })
    .filter(function(v, idx, arr) { return v && arr.indexOf(v) === idx; })
    .sort(function(a, b) { return a.localeCompare(b, 'fr'); });

  if (action) rows = rows.filter(function(r) { return String(r.action_type || '') === action; });

  const total = rows.length;
  const startIndex = (page - 1) * pageSize;
  const paged = rows.slice(startIndex, startIndex + pageSize).map(function(r) {
    const u = usersById[r.user_id];
    return {
      id:          r.id,
      timestamp:   r.timestamp,
      user_id:     r.user_id,
      user_name:   u ? (u.full_name || u.login) : (r.login || r.user_id || ''),
      action:      r.action_type,
      entity_type: r.entity_type,
      entity_id:   r.entity_id,
      description: r.summary
    };
  });

  return { rows: paged, total: total, page: page, pageSize: pageSize, actions: actions };
}
// ============================================================
// SECTION 7 — SESSIONS & AUTHENTIFICATION
// ============================================================

function sessionCacheKey_(token) { return 'SES_' + token; }

function cacheSession_(token, session) {
  CacheService.getScriptCache().put(
    sessionCacheKey_(token), JSON.stringify(session), APP_CONFIG.SESSION_CACHE_TTL
  );
}

function getCachedSession_(token) {
  const raw = CacheService.getScriptCache().get(sessionCacheKey_(token));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function clearSessionCache_(token) {
  CacheService.getScriptCache().remove(sessionCacheKey_(token));
}

function getActiveSessionByToken_(token) {
  return readTable_('SESSIONS').find(function(s) {
    return s.token === token && s.status === 'ACTIVE';
  }) || null;
}

function requireActiveUser_(userId) {
  const user = readTable_('USERS').find(function(u) { return u.id === userId; });
  if (!user || String(user.status || 'Actif') !== 'Actif') {
    throw new Error('Utilisateur inactif ou introuvable.');
  }
  return user;
}

function requireSession_(tokenOrSession) {
  const token = typeof tokenOrSession === 'string'
    ? tokenOrSession
    : (tokenOrSession && tokenOrSession.token);
  if (!token) throw new Error('Session invalide.');

  const session = getCachedSession_(token) || getActiveSessionByToken_(token);
  if (!session) throw new Error('Votre session a expiré. Veuillez vous reconnecter.');

  const user    = requireActiveUser_(session.user_id);
  session.user  = publicUser_(user);
  session.role  = user.role;
  cacheSession_(token, session);
  return session;
}

function buildSessionPayload_(session) {
  const fresh = requireSession_(session.token || session);
  return {
    token:             fresh.token,
    user:              publicUser_(fresh.user),
    role:              fresh.role,
    menu:              buildMenu_(fresh.role),
    permissions:       buildPermissions_(fresh.role),
    appName:           APP_CONFIG.APP_NAME,
    heartbeatSeconds:  APP_CONFIG.HEARTBEAT_SECONDS
  };
}

function closeActiveSessionsForUser_(userId, reason) {
  readTable_('SESSIONS')
    .filter(function(s) { return s.user_id === userId && s.status === 'ACTIVE'; })
    .forEach(function(s) { finalizeSession_(s, reason || 'relogin'); });
}

function authenticateUser(login, password, userAgent) {
  initApplication();

  const normalizedLogin    = String(login    || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');

  if (!normalizedLogin || !normalizedPassword) {
    throw new Error('Veuillez renseigner votre identifiant et votre mot de passe.');
  }

  const users = readTable_('USERS');
  const user  = users.find(function(u) {
    return String(u.login || '').toLowerCase() === normalizedLogin;
  });

  if (!user) {
    addLoginLog_('', normalizedLogin, false, userAgent, '', 'Utilisateur introuvable');
    throw new Error('Identifiants invalides.');
  }
  if (String(user.status || 'Actif') !== 'Actif') {
    addLoginLog_(user.id, normalizedLogin, false, userAgent, '', 'Compte inactif ou suspendu');
    throw new Error('Compte inactif ou suspendu.');
  }
  if (user.password_hash !== hashPassword_(normalizedPassword)) {
    addLoginLog_(user.id, normalizedLogin, false, userAgent, '', 'Mot de passe invalide');
    throw new Error('Identifiants invalides.');
  }

  closeActiveSessionsForUser_(user.id, 'relogin');

  const token   = Utilities.getUuid().replace(/-/g, '') + '_' + new Date().getTime();
  const session = {
    session_id:        nextId_('SES'),
    token:             token,
    user_id:           user.id,
    login:             user.login,
    role:              user.role,
    team_id:           user.team_id || '',
    started_at:        nowIso_(),
    last_seen_at:      nowIso_(),
    closed_at:         '',
    status:            'ACTIVE',
    disconnect_reason: '',
    user_agent:        String(userAgent || '')
  };

  upsertRow_('SESSIONS', 'session_id', session);
  cacheSession_(token, session);

  user.last_login_at = nowIso_();
  user.updated_at    = nowIso_();
  upsertRow_('USERS', 'id', user);

  markPresenceLogin_(user, session);
  addLoginLog_(user.id, user.login, true, userAgent, session.session_id, 'Connexion réussie');
  addAuditLog_(user, 'LOGIN', 'SESSION', session.session_id, 'Connexion à la plateforme', null, session);

  return buildSessionPayload_(session);
}

/**
 * Point d'entrée appelé par le front-end lors de la connexion.
 * Retourne { token, session, lookups } pour hydrater l'app.
 */
function loginUser(login, password) {
  const sessionPayload = authenticateUser(login, password, '');
  const token          = sessionPayload.token;
  return {
    token:   token,
    session: sessionPayload,
    lookups: getLookups(token)
  };
}

function heartbeatSession(token, meta) {
  const session = requireSession_(token);
  const row     = readTable_('SESSIONS').find(function(s) { return s.session_id === session.session_id; });
  if (!row || row.status !== 'ACTIVE') throw new Error('Session introuvable ou fermée.');

  row.last_seen_at = nowIso_();
  if (meta && meta.user_agent) row.user_agent = meta.user_agent;
  upsertRow_('SESSIONS', 'session_id', row);
  cacheSession_(token, row);

  const user = requireActiveUser_(session.user_id);
  markPresenceHeartbeat_(user, row);

  return { ok: true, serverTime: nowIso_() };
}

function logoutUser(token, reason) {
  const session = requireSession_(token);
  const row     = readTable_('SESSIONS').find(function(s) { return s.session_id === session.session_id; });
  if (row && row.status === 'ACTIVE') finalizeSession_(row, reason || 'manual_logout');
  clearSessionCache_(token);
  return { ok: true };
}

function registerOfflineSignal(token) {
  try { return logoutUser(token, 'client_offline'); }
  catch (e) { return { ok: false, message: e.message }; }
}

/** Alias front-end pour le heartbeat périodique. */
function heartbeat(token) {
  return heartbeatSession(token, {});
}

/** Changement de mot de passe par l'utilisateur connecté. */
function changePassword(token, payload) {
  const session = requireSession_(token);
  const data    = payload || {};
  const current = String(data.current_password || '');
  const newPwd  = String(data.new_password     || '');

  if (!current || !newPwd) throw new Error('Les deux mots de passe sont requis.');
  if (newPwd.length < 6)   throw new Error('Le nouveau mot de passe doit comporter au moins 6 caractères.');

  const users = readTable_('USERS');
  const user  = users.find(function(u) { return u.id === session.user_id; });
  if (!user) throw new Error('Utilisateur introuvable.');
  if (user.password_hash !== hashPassword_(current)) throw new Error('Mot de passe actuel incorrect.');

  const now = nowIso_();
  const updated = Object.assign({}, user, {
    password_hash: hashPassword_(newPwd),
    updated_at:    now
  });
  upsertRow_('USERS', 'id', updated);
  addAuditLog_(session, 'CHANGE_PASSWORD', 'USER', user.id, 'Changement de mot de passe', null, null);
  return { ok: true };
}

/** Liste l'historique des actions (audit log) visible par le rôle. */
function listAuditLogs(token, filters) {
  const session    = requireSession_(token);
  const max        = Number((filters || {}).limit || 200);
  const usersById  = indexBy_(readTable_('USERS'), 'id');
  const visibleIds = scopeUsers_(session, readTable_('USERS')).map(function(u) { return u.id; });

  return readTable_('AUDIT_LOG')
    .filter(function(r) {
      return session.role === ROLES.SUPER_ADMIN || visibleIds.indexOf(r.user_id) > -1;
    })
    .sort(sortDescBy_('timestamp'))
    .slice(0, max)
    .map(function(r) {
      const u = usersById[r.user_id];
      return {
        id:          r.id,
        timestamp:   r.timestamp,
        user_id:     r.user_id,
        user_name:   u ? (u.full_name || u.login) : (r.login || r.user_id || ''),
        action:      r.action_type,
        entity_type: r.entity_type,
        entity_id:   r.entity_id,
        description: r.summary
      };
    });
}


/** Normalise les filtres période de l'onglet Connexions. */
function normalizeConnexionPeriod_(filters) {
  filters = filters || {};
  const today = todayKey_();
  let from = String(filters.date_from || today).trim().slice(0, 10);
  let to   = String(filters.date_to   || from).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) from = today;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(to))   to   = from;

  let fromMs = parseDateMs_(from + 'T00:00:00');
  let toMs   = parseDateMs_(to   + 'T23:59:59');
  if (toMs < fromMs) {
    const tmp = from; from = to; to = tmp;
    fromMs = parseDateMs_(from + 'T00:00:00');
    toMs   = parseDateMs_(to   + 'T23:59:59');
  }
  return { from: from, to: to, startMs: fromMs, endMs: toMs };
}

function connexionLogVisible_(session, row, visibleIds) {
  if (session.role === ROLES.SUPER_ADMIN) return true;
  return visibleIds.indexOf(row.user_id) > -1;
}

function connexionSessionVisible_(session, row, visibleIds) {
  if (session.role === ROLES.SUPER_ADMIN) return true;
  return visibleIds.indexOf(row.user_id) > -1;
}

function sessionOverlapsPeriod_(row, bounds) {
  const startMs = parseDateMs_(row.started_at);
  if (!startMs) return false;
  const endMs = parseDateMs_(row.closed_at) || parseDateMs_(row.last_seen_at) || parseDateMs_(nowIso_());
  return startMs <= bounds.endMs && endMs >= bounds.startMs;
}

function sessionSecondsInPeriod_(row, bounds) {
  const startMs = parseDateMs_(row.started_at);
  if (!startMs) return 0;
  const endMs = parseDateMs_(row.closed_at) || parseDateMs_(row.last_seen_at) || parseDateMs_(nowIso_());
  const a = Math.max(startMs, bounds.startMs);
  const b = Math.min(endMs, bounds.endMs);
  return Math.max(0, Math.round((b - a) / 1000));
}

function dateKeyFromMs_(ms) {
  if (!ms) return '';
  return Utilities.formatDate(new Date(ms), APP_CONFIG.TIMEZONE, 'yyyy-MM-dd');
}

function buildConnexionDays_(bounds) {
  const out = [];
  const start = new Date(bounds.from + 'T00:00:00');
  const end   = new Date(bounds.to   + 'T00:00:00');
  for (let d = new Date(start); d.getTime() <= end.getTime(); d.setDate(d.getDate() + 1)) {
    const key = Utilities.formatDate(d, APP_CONFIG.TIMEZONE, 'yyyy-MM-dd');
    out.push({
      date_key: key,
      label: Utilities.formatDate(d, APP_CONFIG.TIMEZONE, 'dd/MM'),
      connections: 0,
      disconnections: 0,
      failed: 0,
      online_seconds: 0
    });
  }
  return out;
}

function safeUserLabel_(user, fallback) {
  if (!user) return fallback || '';
  return user.full_name || user.login || user.id || fallback || '';
}

/**
 * Dashboard visuel de l'onglet Connexions : KPI, période, courbe simple, sessions et tentatives.
 * Filtres supportés : date_from, date_to, user_id, status.
 */
function getConnexionDashboard(token, filters) {
  const session = requireSession_(token);
  filters = filters || {};
  const bounds = normalizeConnexionPeriod_(filters);
  const statusFilter = String(filters.status || '').trim().toUpperCase();
  const userFilter = String(filters.user_id || '').trim();

  const users = readTable_('USERS');
  const usersById = indexBy_(users, 'id');
  const visibleUsers = scopeUsers_(session, users);
  const visibleIds = visibleUsers.map(function(u) { return u.id; });

  if (userFilter && visibleIds.indexOf(userFilter) === -1 && session.role !== ROLES.SUPER_ADMIN) {
    throw new Error('Utilisateur hors périmètre.');
  }

  const scopedUsers = visibleUsers
    .filter(function(u) { return !userFilter || u.id === userFilter; })
    .map(function(u) {
      return {
        id: u.id,
        login: u.login,
        full_name: u.full_name || u.login || u.id,
        role: u.role,
        team_id: u.team_id || ''
      };
    })
    .sort(function(a, b) { return String(a.full_name).localeCompare(String(b.full_name)); });

  let sessions = readTable_('SESSIONS')
    .filter(function(r) { return connexionSessionVisible_(session, r, visibleIds); })
    .filter(function(r) { return !userFilter || r.user_id === userFilter; })
    .filter(function(r) { return sessionOverlapsPeriod_(r, bounds); });

  if (statusFilter === 'ACTIVE') {
    sessions = sessions.filter(function(r) { return String(r.status || '').toUpperCase() === 'ACTIVE'; });
  } else if (statusFilter === 'CLOSED') {
    sessions = sessions.filter(function(r) { return String(r.status || '').toUpperCase() !== 'ACTIVE'; });
  }

  let loginLogs = readTable_('LOGIN_LOG')
    .filter(function(r) { return connexionLogVisible_(session, r, visibleIds); })
    .filter(function(r) { return !userFilter || r.user_id === userFilter; })
    .filter(function(r) {
      const t = parseDateMs_(r.timestamp);
      return t >= bounds.startMs && t <= bounds.endMs;
    });

  const successLogs = loginLogs.filter(function(r) { return isTrue_(r.success); });
  const failedLogs  = loginLogs.filter(function(r) { return !isTrue_(r.success); });
  const activeSessionsNow = readTable_('SESSIONS')
    .filter(function(r) { return String(r.status || '').toUpperCase() === 'ACTIVE'; })
    .filter(function(r) { return connexionSessionVisible_(session, r, visibleIds); })
    .filter(function(r) { return !userFilter || r.user_id === userFilter; });

  const connectedUserMap = {};
  successLogs.forEach(function(r) { if (r.user_id) connectedUserMap[r.user_id] = true; });
  sessions.forEach(function(r) { if (r.user_id) connectedUserMap[r.user_id] = true; });

  const totalOnlineSeconds = sessions.reduce(function(sum, r) {
    return sum + sessionSecondsInPeriod_(r, bounds);
  }, 0);
  const closedInPeriod = sessions.filter(function(r) {
    const t = parseDateMs_(r.closed_at);
    return t >= bounds.startMs && t <= bounds.endMs;
  });

  const days = buildConnexionDays_(bounds);
  const dayByKey = indexBy_(days, 'date_key');
  successLogs.forEach(function(r) {
    const key = dateKeyFromMs_(parseDateMs_(r.timestamp));
    if (dayByKey[key]) dayByKey[key].connections += 1;
  });
  failedLogs.forEach(function(r) {
    const key = dateKeyFromMs_(parseDateMs_(r.timestamp));
    if (dayByKey[key]) dayByKey[key].failed += 1;
  });
  closedInPeriod.forEach(function(r) {
    const key = dateKeyFromMs_(parseDateMs_(r.closed_at));
    if (dayByKey[key]) dayByKey[key].disconnections += 1;
  });
  sessions.forEach(function(r) {
    const key = dateKeyFromMs_(Math.max(parseDateMs_(r.started_at), bounds.startMs));
    if (dayByKey[key]) dayByKey[key].online_seconds += sessionSecondsInPeriod_(r, bounds);
  });

  const sessionRows = sessions
    .sort(sortDescBy_('started_at'))
    .slice(0, Number(filters.limit || 250))
    .map(function(r) {
      const u = usersById[r.user_id];
      const seconds = sessionSecondsInPeriod_(r, bounds);
      return {
        session_id: r.session_id,
        user_id: r.user_id,
        user_name: safeUserLabel_(u, r.login || r.user_id || ''),
        login: r.login || (u && u.login) || '',
        role: r.role || (u && u.role) || '',
        team_id: r.team_id || (u && u.team_id) || '',
        connected_at: r.started_at || '',
        last_seen_at: r.last_seen_at || '',
        disconnected_at: r.closed_at || '',
        status: r.status || '',
        disconnect_reason: r.disconnect_reason || '',
        duration_seconds: seconds,
        user_agent: r.user_agent || ''
      };
    });

  const logRows = loginLogs
    .sort(sortDescBy_('timestamp'))
    .slice(0, Number(filters.log_limit || 200))
    .map(function(r) {
      const u = usersById[r.user_id];
      return {
        id: r.id,
        user_id: r.user_id,
        user_name: safeUserLabel_(u, r.login || r.user_id || ''),
        login: r.login || '',
        success: isTrue_(r.success) ? 'TRUE' : 'FALSE',
        timestamp: r.timestamp || '',
        message: r.message || '',
        session_id: r.session_id || '',
        user_agent: r.user_agent || ''
      };
    });

  return {
    filters: {
      date_from: bounds.from,
      date_to: bounds.to,
      user_id: userFilter,
      status: statusFilter
    },
    users: scopedUsers,
    kpis: {
      total_users: scopedUsers.length,
      active_users: Object.keys(connectedUserMap).length,
      online_now: activeSessionsNow.length,
      connections: successLogs.length || sessions.length,
      failed_connections: failedLogs.length,
      disconnections: closedInPeriod.length,
      total_online_seconds: totalOnlineSeconds,
      avg_session_seconds: sessions.length ? Math.round(totalOnlineSeconds / sessions.length) : 0,
      sessions: sessions.length
    },
    days: days,
    sessions: sessionRows,
    logs: logRows
  };
}

function htmlEscape_(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function secondsToHuman_(seconds) {
  const s = Number(seconds || 0);
  if (!s) return '0min';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? (h + 'h ' + m + 'min') : (m + 'min');
}

function buildConnexionPdfHtml_(data, actor) {
  const k = data.kpis || {};
  const f = data.filters || {};
  const generatedAt = Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm');
  const period = htmlEscape_(f.date_from || '') + ' → ' + htmlEscape_(f.date_to || '');
  const rows = (data.sessions || []).slice(0, 500);
  let html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
    'body{font-family:Arial,sans-serif;color:#182033;margin:28px;font-size:12px}' +
    'h1{font-size:22px;margin:0 0 4px;color:#16324F}.sub{color:#667085;margin-bottom:18px}' +
    '.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0 20px}' +
    '.kpi{border:1px solid #d9dee8;border-radius:10px;padding:10px;background:#f7f8fb}.kpi small{display:block;color:#667085;text-transform:uppercase;font-size:9px;letter-spacing:.05em}.kpi strong{font-size:18px;color:#16324F}' +
    'table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border-bottom:1px solid #e3e7ef;padding:7px 6px;text-align:left;vertical-align:top}th{background:#16324F;color:#fff;font-size:10px;text-transform:uppercase}.footer{margin-top:18px;color:#667085;font-size:10px}' +
    '</style></head><body>';
  html += '<h1>Journal de connexion</h1>';
  html += '<div class="sub">Période : ' + period + ' · Généré le ' + htmlEscape_(generatedAt) + ' par ' + htmlEscape_(actor && actor.full_name || actor && actor.login || '') + '</div>';
  html += '<div class="kpis">' +
    '<div class="kpi"><small>Utilisateurs</small><strong>' + Number(k.total_users || 0) + '</strong></div>' +
    '<div class="kpi"><small>En ligne</small><strong>' + Number(k.online_now || 0) + '</strong></div>' +
    '<div class="kpi"><small>Connexions</small><strong>' + Number(k.connections || 0) + '</strong></div>' +
    '<div class="kpi"><small>Déconnexions</small><strong>' + Number(k.disconnections || 0) + '</strong></div>' +
    '<div class="kpi"><small>Échecs</small><strong>' + Number(k.failed_connections || 0) + '</strong></div>' +
    '<div class="kpi"><small>Sessions</small><strong>' + Number(k.sessions || 0) + '</strong></div>' +
    '<div class="kpi"><small>Temps total</small><strong>' + htmlEscape_(secondsToHuman_(k.total_online_seconds)) + '</strong></div>' +
    '<div class="kpi"><small>Durée moyenne</small><strong>' + htmlEscape_(secondsToHuman_(k.avg_session_seconds)) + '</strong></div>' +
    '</div>';
  html += '<h2 style="font-size:15px;margin-top:18px;">Sessions visibles</h2>';
  html += '<table><thead><tr><th>Utilisateur</th><th>Rôle</th><th>Connexion</th><th>Déconnexion</th><th>Durée</th><th>Statut</th></tr></thead><tbody>';
  if (!rows.length) {
    html += '<tr><td colspan="6">Aucune session sur cette période.</td></tr>';
  } else {
    rows.forEach(function(r) {
      html += '<tr>' +
        '<td>' + htmlEscape_(r.user_name || r.login || '—') + '</td>' +
        '<td>' + htmlEscape_(r.role || '—') + '</td>' +
        '<td>' + htmlEscape_(r.connected_at || '—') + '</td>' +
        '<td>' + htmlEscape_(r.disconnected_at || 'Actif') + '</td>' +
        '<td>' + htmlEscape_(secondsToHuman_(r.duration_seconds)) + '</td>' +
        '<td>' + htmlEscape_(r.status || '—') + '</td>' +
      '</tr>';
    });
  }
  html += '</tbody></table>';
  html += '<div class="footer">Export automatique depuis ' + htmlEscape_(APP_CONFIG.APP_NAME) + '.</div>';
  html += '</body></html>';
  return html;
}

/** Crée un PDF Drive du journal de connexion avec les filtres courants. */
function exportConnexionPdf(token, filters) {
  const session = requireSession_(token);
  const data = getConnexionDashboard(token, filters || {});
  const html = buildConnexionPdfHtml_(data, session.user);
  const f = data.filters || {};
  const filename = 'Journal-connexions-' + (f.date_from || todayKey_()) + '-' + (f.date_to || todayKey_()) + '.pdf';
  const blob = Utilities.newBlob(html, 'text/html', filename.replace(/\.pdf$/, '.html'))
    .getAs(MimeType.PDF)
    .setName(filename);
  const file = DriveApp.createFile(blob);
  addAuditLog_(session, 'EXPORT_CONNEXION_PDF', 'CONNEXIONS', file.getId(), 'Export PDF journal connexions ' + (f.date_from || '') + ' → ' + (f.date_to || ''), null, { file_id: file.getId(), url: file.getUrl() });
  return { ok: true, name: file.getName(), url: file.getUrl(), id: file.getId() };
}

/** Liste les sessions de connexion visibles par le rôle. */
function listSessions(token, filters) {
  const session    = requireSession_(token);
  const max        = Number((filters || {}).limit || 150);
  const usersById  = indexBy_(readTable_('USERS'), 'id');
  const visibleIds = scopeUsers_(session, readTable_('USERS')).map(function(u) { return u.id; });

  return readTable_('SESSIONS')
    .filter(function(r) {
      return session.role === ROLES.SUPER_ADMIN || visibleIds.indexOf(r.user_id) > -1;
    })
    .sort(sortDescBy_('started_at'))
    .slice(0, max)
    .map(function(r) {
      const u = usersById[r.user_id];
      return {
        session_id:      r.session_id,
        user_id:         r.user_id,
        user_name:       u ? (u.full_name || u.login) : (r.login || r.user_id || ''),
        role:            r.role,
        status:          r.status,
        connected_at:    r.started_at,
        disconnected_at: r.closed_at || '',
        user_agent:      r.user_agent || ''
      };
    });
}
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
    { key: 'presence',     label: 'Présence'     },
    { key: 'planning',     label: 'Planning'     },
    { key: 'historique',   label: 'Historique'   },
    { key: 'connexions',   label: 'Connexions'   }
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
      { key: 'factures-remontees', label: 'Dossiers remontés'},
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
    canPlanUsers:         role === ROLES.SUPER_ADMIN || role === ROLES.TEAM_LEADER,
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
    // Agrément
    AGREMENT_TYPES:         getParametrableList_('AGREMENT_TYPES',         ENUMS.AGREMENT_TYPES),
    TYPE_CLIENT:            getParametrableList_('TYPE_CLIENT',            ENUMS.TYPE_CLIENT),
    STATUTS_PRO:            getParametrableList_('STATUTS_PRO',            ENUMS.STATUTS_PRO),
    COMPAGNIES:             getParametrableList_('COMPAGNIES',             ENUMS.COMPAGNIES),
    STATUTS_FIN_TRAITEMENT: getParametrableList_('STATUTS_FIN_TRAITEMENT', ENUMS.STATUTS_FIN_TRAITEMENT),
    AGREMENT_STATUS:        getParametrableList_('AGREMENT_STATUS',        ENUMS.AGREMENT_STATUS),
    PRIORITIES:             getParametrableList_('PRIORITIES',             ENUMS.PRIORITIES),
    MOTIF_VALIDATION:       getParametrableList_('MOTIF_VALIDATION',       ENUMS.MOTIF_VALIDATION),
    // Sinistre
    SINISTRE_SITUATIONS:    getParametrableList_('SINISTRE_SITUATIONS',    ENUMS.SINISTRE_SITUATIONS),
    SINISTRE_STATUTS:       getParametrableList_('SINISTRE_STATUTS',       ENUMS.SINISTRE_STATUTS),
    SINISTRE_COMPLETUDE:    getParametrableList_('SINISTRE_COMPLETUDE',    ENUMS.SINISTRE_COMPLETUDE),
    // Facture
    FACTURE_STATUTS:        getParametrableList_('FACTURE_STATUTS',        ENUMS.FACTURE_STATUTS),
    // Résiliation
    RESILIATION_ORIGINES:   getParametrableList_('RESILIATION_ORIGINES',   ENUMS.RESILIATION_ORIGINES),
    RESILIATION_COMPLETUDE: getParametrableList_('RESILIATION_COMPLETUDE', ENUMS.RESILIATION_COMPLETUDE),
    RESILIATION_RESIL:      getParametrableList_('RESILIATION_RESIL',      ENUMS.RESILIATION_RESIL),
    RESILIATION_STATUTS:    getParametrableList_('RESILIATION_STATUTS',    ENUMS.RESILIATION_STATUTS)
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
  const allowed = [
    'AGREMENT_TYPES', 'TYPE_CLIENT', 'STATUTS_PRO', 'COMPAGNIES',
    'STATUTS_FIN_TRAITEMENT', 'AGREMENT_STATUS', 'PRIORITIES', 'MOTIF_VALIDATION',
    'SINISTRE_SITUATIONS', 'SINISTRE_STATUTS', 'SINISTRE_COMPLETUDE',
    'FACTURE_STATUTS',
    'RESILIATION_ORIGINES', 'RESILIATION_COMPLETUDE', 'RESILIATION_RESIL', 'RESILIATION_STATUTS'
  ];

  allowed.forEach(function(key) {
    if (data[key] && Array.isArray(data[key]) && data[key].length > 0) {
      setSetting_('PARAM_' + key, JSON.stringify(data[key]));
      addAuditLog_(session, 'UPDATE_SETTINGS', 'SETTINGS', key,
        'Mise à jour paramètre : ' + key, null, data[key]);
    }
  });

  return getParametres(token);
}
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
    .map(function(r) {
      var row;
      try {
        row = hydrateAgrementRow_(Object.assign({}, r), usersById, teamsById);
      } catch (e) {
        Logger.log('hydrateAgrementRow_ err ' + (r && r.id ? r.id : 'unknown') + ': ' + e.message);
        row = Object.assign({}, r);
      }

      row.created_by_name = usersById[row.created_by] ? usersById[row.created_by].full_name : '';
      row.updated_by_name = usersById[row.updated_by] ? usersById[row.updated_by].full_name : '';
      row.ambassadeur_assigne_name = row.ambassadeur_assigne_name || (usersById[row.ambassadeur_assigne] ? usersById[row.ambassadeur_assigne].full_name : '');
      row.gestionnaire_plus_name   = row.gestionnaire_plus_name   || (usersById[row.gestionnaire_plus] ? usersById[row.gestionnaire_plus].full_name : '');
      row.equipe_name              = row.equipe_name              || (teamsById[row.equipe_id] ? teamsById[row.equipe_id].name : '');
      row.dernier_traitement_formate = formatDelai_(row.dernier_traitement_secondes);
      row.profils = Array.isArray(row.profils) ? row.profils : safeParseJson_(row.profils_json, []);
      return row;
    })
    .filter(function(r) { return !f.statut       || r.statut === f.statut; })
    .filter(function(r) { return !f.type_dossier || normalizeDossierType_(r.type_dossier) === normalizeDossierType_(f.type_dossier); })
    .filter(function(r) { return !f.search       || JSON.stringify(r).toLowerCase().indexOf(String(f.search).toLowerCase()) > -1; })
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
  const isNew    = !existing;

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
  const traitementSessionFields = buildTraitementSessionFields_(existing, data, isNew ? 'CREATE' : 'UPDATE');

  const row = Object.assign({}, existing || {}, {
    id:          existing ? existing.id        : nextId_('AGR'),
    reference:   existing ? existing.reference : nextReference_('AGR'),
    // Infos dossier
    type_dossier:        normalizeDossierType_(data.type_dossier || (existing && existing.type_dossier) || ''),
    no_dossier:          String(data.no_dossier || (existing && existing.no_dossier) || '').trim(),
    priorite:            String(data.priorite   || (existing && existing.priorite)   || 'Normale').trim(),
    client:              String(data.client     || (existing && existing.client)     || '').trim(),
    adresse:             String(data.adresse    || (existing && existing.adresse)    || '').trim(),
    date_reception:      String(data.date_reception || (existing && existing.date_reception) || '').trim(),
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
  }, traitementSessionFields);

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
      r.created_by_name            = usersById[r.created_by] ? usersById[r.created_by].full_name : '';
      r.delai_formate              = formatDelai_(r.delai_secondes);
      r.dernier_traitement_formate = formatDelai_(r.dernier_traitement_secondes);
      r.historique                 = safeParseJson_(r.historique_json, []);
      r.pending_actions            = safeParseJson_(r.workflow_pending_actions, []);
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

  const noSinistre  = String(data.no_sinistre || (existing && existing.no_sinistre) || '').trim();
  const noContrat   = String(data.no_contrat  || (existing && existing.no_contrat)  || '').trim();
  const commentaire = String(data.commentaire || (existing && existing.commentaire) || '').trim();
  if (!noSinistre) throw new Error('Le N° de sinistre est obligatoire.');
  if (!noContrat)  throw new Error('Le N° de contrat est obligatoire.');

  const completude       = String(data.completude || (existing && existing.completude) || '').trim();
  const isNew            = !existing;
  const isAdmin          = session.role === ROLES.SUPER_ADMIN;
  const rawSituation     = String(data.situation || '').trim();
  const allowedCreate    = ['Nouvelle déclaration', 'Complément', 'En attente'];
  const allowedUpdate    = ['Complément', 'En attente'];

  // ── Règles métier situation & statut ──────────────────────
  let situation = '';
  let statut    = '';

  if (isNew) {
    // À la création : situation fixée à "Nouvelle déclaration", sauf admin
    if (isAdmin && allowedCreate.indexOf(rawSituation) > -1) {
      situation = rawSituation;
    } else {
      situation = 'Nouvelle déclaration';
    }

    if (completude === 'KO') {
      statut = 'Relance';
    } else if (completude === 'OK') {
      statut = 'Complet';
    } else {
      statut = 'Relance';
    }
  } else {
    // À la mise à jour : choix uniquement entre Complément / En attente
    if (completude === 'KO') {
      situation = 'En attente';
    } else if (allowedUpdate.indexOf(rawSituation) > -1) {
      situation = rawSituation;
    } else if (allowedUpdate.indexOf(String(existing.situation || '').trim()) > -1) {
      situation = existing.situation;
    } else {
      situation = 'Complément';
    }

    if (situation === 'En attente' || completude === 'KO') {
      statut = 'Relance';
    } else if (wasTraite || completude === 'OK' || situation === 'Complément') {
      statut = 'Complet';
    } else {
      statut = existing.statut || 'Relance';
    }
  }

  // ── Historique des mises à jour ───────────────────────────
  const historique = safeParseJson_(existing && existing.historique_json, []);
  if (existing) {
    historique.push({
      timestamp:     nowIso_(),
      user_id:       session.user.id,
      user_name:     session.user.full_name,
      action:        wasTraite ? 'MISE_A_JOUR_APRES_TRAITEMENT' : 'MISE_A_JOUR',
      commentaire:   commentaire,
      old_statut:    existing.statut,
      new_statut:    statut,
      old_situation: existing.situation || '',
      new_situation: situation
    });
  }

  const now = nowIso_();
  const traitementSessionFields = buildTraitementSessionFields_(existing, data, isNew ? 'CREATE' : 'UPDATE');
  const row = Object.assign({}, existing || {}, {
    id:             existing ? existing.id        : nextId_('SIN'),
    reference:      existing ? existing.reference : nextReference_('SIN'),
    no_sinistre:    noSinistre,
    no_contrat:     noContrat,
    date_reception: String(data.date_reception || (existing && existing.date_reception) || '').trim(),
    gestionnaire:   String(data.gestionnaire   || (existing && existing.gestionnaire)   || '').trim(),
    commentaire:    commentaire,
    completude:     completude,
    situation:       situation,
    statut:          statut,
    historique_json: JSON.stringify(historique),
    transfer_origin: String((existing && existing.transfer_origin) || '').trim(),
    workflow_pending: 'FALSE',
    workflow_pending_actions: '[]',
    workflow_last_action: String((existing && existing.workflow_last_action) || '').trim(),
    created_by:      existing ? existing.created_by : session.user.id,
    created_at:     existing ? existing.created_at : now,
    updated_at:     now,
    // Réinitialisation du traitement si remise en travail
    traite_at:      wasTraite ? '' : (existing ? (existing.traite_at || '') : ''),
    delai_secondes: wasTraite ? 0  : (existing ? (existing.delai_secondes || 0) : 0),
    // Horodatage de début de traitement : mis à jour à chaque mise à jour
    delai_traitement_start: existing ? now : now
  }, traitementSessionFields);

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
      r.dernier_traitement_formate = formatDelai_(r.dernier_traitement_secondes);
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
      r.dernier_traitement_formate = formatDelai_(r.dernier_traitement_secondes);
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
  const traitementSessionFields = buildTraitementSessionFields_(existing, data, existing ? 'UPDATE' : 'CREATE');
  const row = Object.assign({}, existing || {}, {
    id:        existing ? existing.id        : nextId_('FAC'),
    reference: existing ? existing.reference : nextReference_('FAC'),
    no_sinistre: noSinistre,
    date_reception: String(data.date_reception || (existing && existing.date_reception) || '').trim(),
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
  }, traitementSessionFields);

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
      r.dernier_traitement_formate = formatDelai_(r.dernier_traitement_secondes);
      return r;
    })
    .sort(sortDescBy_('updated_at'));
}

function saveResiliation(token, payload) {
  const session  = requireSession_(token);
  const data     = payload || {};
  const rows     = readTable_('RESILIATIONS');
  const existing = data.id ? rows.find(function(r) { return r.id === data.id; }) : null;

  const noContrat = String(data.no_contrat || (existing && existing.no_contrat) || '').trim();
  if (!noContrat) throw new Error('Le N° de contrat est obligatoire.');

  const origine = String(data.origine || (existing && existing.origine) || '').trim();
  if (!existing && !origine) throw new Error('L\'origine est obligatoire.');

  const now = nowIso_();
  const traitementSessionFields = buildTraitementSessionFields_(existing, data, existing ? 'UPDATE' : 'CREATE');
  const row = Object.assign({}, existing || {}, {
    id:        existing ? existing.id        : nextId_('RES'),
    reference: existing ? existing.reference : nextReference_('RES'),
    origine:    origine,
    mail:       String(data.mail        || (existing && existing.mail)       || '').trim(),
    no_contrat: noContrat,
    date_reception:    String(data.date_reception    || (existing && existing.date_reception)    || '').trim(),
    date_sortie:       String(data.date_sortie       || (existing && existing.date_sortie)       || '').trim(),
    motif_resiliation: String(data.motif_resiliation || (existing && existing.motif_resiliation) || '').trim(),
    completude: String(data.completude  || (existing && existing.completude) || '').trim(),
    resil:      String(data.resil       || (existing && existing.resil)      || '').trim(),
    commentaire: String(data.commentaire|| (existing && existing.commentaire)|| '').trim(),
    statut:     existing ? (existing.statut || 'En cours') : 'En cours',
    created_by: existing ? existing.created_by : session.user.id,
    created_at: existing ? existing.created_at : now,
    updated_at: now,
    soumis_at:  existing ? (existing.soumis_at || '') : '',
    delai_ouverture_soumission_secondes: existing
      ? (existing.delai_ouverture_soumission_secondes || 0) : 0,
    // Horodatage de début de traitement : mis à jour à chaque save
    delai_traitement_start: existing ? now : now
  }, traitementSessionFields);

  upsertRow_('RESILIATIONS', 'id', row);
  const actionType = existing ? 'UPDATE' : 'CREATE';
  addAuditLog_(session, actionType, 'RESILIATION', row.id, 'Enregistrement résiliation', existing, row);
  saveEntityVersion_(session, 'RESILIATION', row.id, row,
    String(data.commentaire_mise_a_jour || '').trim(), actionType);
  return row;
}

function soumettreResiliation(token, id, payload) {
  const session  = requireSession_(token);
  const rows     = readTable_('RESILIATIONS');
  const existing = rows.find(function(r) { return r.id === id; });

  if (!existing) throw new Error('Résiliation introuvable.');

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
  const startMs   = parseDateMs_(existing.delai_traitement_start || existing.created_at);
  const delai     = Math.max(0, Math.round((parseDateMs_(now) - startMs) / 1000));

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
  saveEntityVersion_(session, 'RESILIATION', row.id, row, String(commentaire || ''), 'SOUMIS');

  const usersById = indexBy_(readTable_('USERS'), 'id');
  row.created_by_name = usersById[row.created_by] ? usersById[row.created_by].full_name : '';
  row.delai_formate   = formatDelai_(row.delai_ouverture_soumission_secondes);
  return row;
}
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

// ── Jeu de données dashboard : tous les statuts / états par dossier ──

function buildDashboardRecords_(session) {
  const users     = readTable_('USERS');
  const teamsById = indexBy_(readTable_('TEAMS'), 'id');
  const usersById = indexBy_(users, 'id');

  function resolveTeamId_(agentId, fallbackTeamId) {
    const user = agentId && usersById[agentId] ? usersById[agentId] : null;
    return String((user && user.team_id) || fallbackTeamId || '').trim();
  }

  const records = [];

  scopeAgrements_(session, readTable_('AGREMENTS')).forEach(function(r) {
    const agentId = String(r.ambassadeur_assigne || r.created_by || r.updated_by || '').trim();
    const teamId  = resolveTeamId_(agentId, r.equipe_id);
    records.push({
      module:                'agrement',
      entity_id:             String(r.id || ''),
      reference:             String(r.reference || ''),
      agent_id:              agentId,
      agent_name:            String((usersById[agentId] && usersById[agentId].full_name) || agentId || '—'),
      team_id:               teamId,
      team_name:             String((teamsById[teamId] && teamsById[teamId].name) || '—'),
      date_ref:              String(r.updated_at || r.created_at || '').slice(0, 10),
      created_at:            String(r.created_at || ''),
      updated_at:            String(r.updated_at || ''),
      statut:                String(r.statut || ''),
      resultat_solvabilite:  String(r.resultat_solvabilite || ''),
      motif_validation:      String(r.motif_validation || ''),
      statut_fin_traitement: String(r.statut_fin_traitement || '')
    });
  });

  scopeSinistres_(session, readTable_('SINISTRES')).forEach(function(r) {
    const agentId = String(r.created_by || '').trim();
    const teamId  = resolveTeamId_(agentId, '');
    records.push({
      module:       'sinistre',
      entity_id:    String(r.id || ''),
      reference:    String(r.reference || ''),
      agent_id:     agentId,
      agent_name:   String((usersById[agentId] && usersById[agentId].full_name) || agentId || '—'),
      team_id:      teamId,
      team_name:    String((teamsById[teamId] && teamsById[teamId].name) || '—'),
      date_ref:     String(r.updated_at || r.created_at || '').slice(0, 10),
      created_at:   String(r.created_at || ''),
      updated_at:   String(r.updated_at || ''),
      statut:       String(r.statut || ''),
      situation:    String(r.situation || ''),
      completude:   String(r.completude || '')
    });
  });

  scopeFactures_(session, readTable_('FACTURES')).forEach(function(r) {
    const agentId = String(r.created_by || '').trim();
    const teamId  = resolveTeamId_(agentId, '');
    records.push({
      module:             'facture',
      entity_id:          String(r.id || ''),
      reference:          String(r.reference || ''),
      agent_id:           agentId,
      agent_name:         String((usersById[agentId] && usersById[agentId].full_name) || agentId || '—'),
      team_id:            teamId,
      team_name:          String((teamsById[teamId] && teamsById[teamId].name) || '—'),
      date_ref:           String(r.updated_at || r.created_at || '').slice(0, 10),
      created_at:         String(r.created_at || ''),
      updated_at:         String(r.updated_at || ''),
      statut:             String(r.statut || ''),
      etape_verification: String(r.etape_verification || ''),
      etape_calcul:       String(r.etape_calcul || ''),
      etape_reglement:    String(r.etape_reglement || '')
    });
  });

  scopeResiliations_(session, readTable_('RESILIATIONS')).forEach(function(r) {
    const agentId = String(r.created_by || '').trim();
    const teamId  = resolveTeamId_(agentId, '');
    records.push({
      module:       'resiliation',
      entity_id:    String(r.id || ''),
      reference:    String(r.reference || ''),
      agent_id:     agentId,
      agent_name:   String((usersById[agentId] && usersById[agentId].full_name) || agentId || '—'),
      team_id:      teamId,
      team_name:    String((teamsById[teamId] && teamsById[teamId].name) || '—'),
      date_ref:     String(r.updated_at || r.created_at || '').slice(0, 10),
      created_at:   String(r.created_at || ''),
      updated_at:   String(r.updated_at || ''),
      statut:       String(r.statut || ''),
      completude:   String(r.completude || ''),
      resil:        String(r.resil || '')
    });
  });

  if (session.role === ROLES.AMBASSADOR) {
    return records.filter(function(r) { return r.agent_id === session.user.id; });
  }

  if (session.role === ROLES.TEAM_LEADER) {
    const myTeamUserIds = users
      .filter(function(u) { return u.team_id === session.user.team_id; })
      .map(function(u) { return u.id; });
    return records.filter(function(r) {
      return r.team_id === session.user.team_id || myTeamUserIds.indexOf(r.agent_id) > -1;
    });
  }

  return records;
}

// ── Traitements par agent (événements bruts pour filtrage côté client) ──

function buildTreatmentEvents_(session) {
  const usersById = indexBy_(readTable_('USERS'), 'id');
  const teamsById = indexBy_(readTable_('TEAMS'), 'id');
  const versions  = readTable_('ENTITY_VERSIONS')
    .filter(function(v) { return v.action_type === 'CLOSE_TREATMENT'; });

  // Priorité aux clôtures de traitement historisées (création / mise à jour)
  if (versions.length) {
    return versions
      .map(function(v) {
        const snap = safeParseJson_(v.snapshot_json, {}) || {};
        const module = {
          AGREMENT:    'agrement',
          SINISTRE:    'sinistre',
          FACTURE:     'facture',
          RESILIATION: 'resiliation'
        }[String(v.entity_type || '').toUpperCase()] || '';

        const agentId = String(v.user_id || snap.updated_by || snap.created_by || snap.ambassadeur_assigne || '').trim();
        const user    = usersById[agentId];
        const teamId  = String((user && user.team_id) || snap.equipe_id || '').trim();

        return {
          module:        module,
          agent_id:      agentId,
          agent_name:    String(v.user_name || (user ? user.full_name : '') || agentId || '—'),
          team_id:       teamId,
          team_name:     teamId && teamsById[teamId] ? teamsById[teamId].name : '—',
          date:          String(v.created_at || snap.updated_at || snap.created_at || '').slice(0, 10),
          session_type:  String(snap.traitement_session_type || 'UPDATE').toUpperCase(),
          delay_seconds: Number(snap.dernier_traitement_secondes || 0),
          entity_type:   String(v.entity_type || ''),
          entity_id:     String(v.entity_id || ''),
          reference:     String(snap.reference || '')
        };
      })
      .filter(function(e) { return !!e.module; });
  }

  // Fallback historique : conservation de l'ancien comportement si aucune clôture n'est encore historisée
  const events = [];

  scopeAgrements_(session, readTable_('AGREMENTS'))
    .filter(function(r) { return r.statut === 'Validé' || r.statut === 'Clos'; })
    .forEach(function(r) {
      const agentId = r.ambassadeur_assigne || r.created_by || '';
      const u = usersById[agentId];
      events.push({
        module:        'agrement',
        agent_id:      agentId,
        agent_name:    u ? u.full_name : agentId,
        team_id:       r.equipe_id || '',
        team_name:     teamsById[r.equipe_id] ? teamsById[r.equipe_id].name : '—',
        date:          String(r.closed_at || r.updated_at || r.created_at || '').slice(0, 10),
        session_type:  'UPDATE',
        delay_seconds: Number(r.dernier_traitement_secondes || 0)
      });
    });

  scopeSinistres_(session, readTable_('SINISTRES'))
    .filter(function(r) { return r.statut === 'Traité'; })
    .forEach(function(r) {
      const u = usersById[r.created_by];
      const teamId = u && u.team_id ? u.team_id : '';
      events.push({
        module:        'sinistre',
        agent_id:      r.created_by || '',
        agent_name:    u ? u.full_name : (r.created_by || ''),
        team_id:       teamId,
        team_name:     teamId && teamsById[teamId] ? teamsById[teamId].name : '—',
        date:          String(r.updated_at || r.created_at || '').slice(0, 10),
        session_type:  'UPDATE',
        delay_seconds: Number(r.dernier_traitement_secondes || r.delai_secondes || 0)
      });
    });

  scopeFactures_(session, readTable_('FACTURES'))
    .filter(function(r) { return r.statut === 'Traité'; })
    .forEach(function(r) {
      const u = usersById[r.created_by];
      const teamId = u && u.team_id ? u.team_id : '';
      events.push({
        module:        'facture',
        agent_id:      r.created_by || '',
        agent_name:    u ? u.full_name : (r.created_by || ''),
        team_id:       teamId,
        team_name:     teamId && teamsById[teamId] ? teamsById[teamId].name : '—',
        date:          String(r.traite_at || r.updated_at || r.created_at || '').slice(0, 10),
        session_type:  'UPDATE',
        delay_seconds: Number(r.dernier_traitement_secondes || r.delai_secondes || 0)
      });
    });

  scopeResiliations_(session, readTable_('RESILIATIONS'))
    .filter(function(r) { return r.statut === 'Traité'; })
    .forEach(function(r) {
      const u = usersById[r.created_by];
      const teamId = u && u.team_id ? u.team_id : '';
      events.push({
        module:        'resiliation',
        agent_id:      r.created_by || '',
        agent_name:    u ? u.full_name : (r.created_by || ''),
        team_id:       teamId,
        team_name:     teamId && teamsById[teamId] ? teamsById[teamId].name : '—',
        date:          String(r.updated_at || r.created_at || '').slice(0, 10),
        session_type:  'UPDATE',
        delay_seconds: Number(r.dernier_traitement_secondes || r.delai_ouverture_soumission_secondes || 0)
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

  const trend30j         = buildTrend30j_(treatEvents);
  const dashboardRecords = buildDashboardRecords_(session);

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
    dashboardRecords: dashboardRecords,
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
// ============================================================
// SECTION 15 — INIT & BOOTSTRAP
// ============================================================

function initApplication() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const dbInfo = ensureSheets_();
    seedBaseData_();
    ensurePresenceTrigger_();
    return {
      ok: true,
      appName:     APP_CONFIG.APP_NAME,
      version:     APP_CONFIG.VERSION,
      databaseUrl: dbInfo.spreadsheetUrl,
      defaultAdmin: {
        login:    APP_CONFIG.DEFAULT_ADMIN_LOGIN,
        password: APP_CONFIG.DEFAULT_ADMIN_PASSWORD
      }
    };
  } finally {
    lock.releaseLock();
  }
}

function generateAllSheetsAndSeed() {
  const dbInfo = generateSheetsStructure();
  seedBaseData_();
  ensurePresenceTrigger_();
  return { ok: true, spreadsheetUrl: dbInfo.spreadsheetUrl, defaultAdminLogin: APP_CONFIG.DEFAULT_ADMIN_LOGIN };
}

function doGet() {
  initApplication();
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(APP_CONFIG.APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getBootstrapData(token) {
  const session = requireSession_(token);
  return {
    session:   buildSessionPayload_(session),
    lookups:   getLookups(token),
    dashboard: getDashboardData(token)
  };
}
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

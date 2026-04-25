// ============================================================
// SECTION 1 — CONFIG, RÔLES, ENUMS, SCHEMA
// ============================================================

const APP_CONFIG = {
  APP_NAME: 'Suivi Rambaud',
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
  RESILIATION_ORIGINES:    ['Mail', 'BO'],
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
    'type_dossier', 'no_dossier', 'priorite', 'client', 'adresse',
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
    'created_by', 'updated_by', 'created_at', 'updated_at', 'closed_at'
  ],

  // Cohérences type_dossier → équipe (lecture seule, non bloquant depuis v4)
  AGREMENT_TYPE_TEAM_MAP: [
    'id', 'type_dossier', 'team_id', 'team_name', 'active', 'updated_at'
  ],

  // Module Sinistre v4 — commentaire + historique des mises à jour
  SINISTRES: [
    'id', 'reference', 'no_sinistre', 'no_contrat', 'date_reception',
    'gestionnaire', 'commentaire', 'completude', 'situation', 'statut',
    'historique_json',
    'created_by', 'created_at', 'updated_at', 'traite_at', 'delai_secondes',
    'delai_traitement_start'
  ],

  // Module Facture v4 — workflow Remonté / Vérifié
  FACTURES: [
    'id', 'reference', 'no_sinistre',
    'etape_verification', 'etape_calcul', 'etape_reglement',
    'commentaire_traitement', 'commentaire_verification',
    'statut',
    'verifie_badge', 'verifie_at', 'verifie_par',
    'remonte_at',
    'created_by', 'created_at', 'updated_at', 'traite_at', 'delai_secondes',
    'delai_traitement_start'
  ],

  // Module Résiliation
  RESILIATIONS: [
    'id', 'reference', 'origine', 'mail', 'no_contrat',
    'completude', 'resil', 'commentaire', 'statut',
    'created_by', 'created_at', 'updated_at',
    'soumis_at', 'delai_ouverture_soumission_secondes',
    'delai_traitement_start'
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

# Syndic Ledger High-End

Application interne de gestion opérationnelle développée avec **Google Apps Script**, **Google Sheets** et une interface web **HTML / CSS / JavaScript**.

Le projet centralise plusieurs modules métier dans un seul outil : agréments, sinistres, factures, résiliations, utilisateurs, équipes, présences, planning, connexions, historique et pilotage de l’activité.

---

## Sommaire

- [Objectif du projet](#objectif-du-projet)
- [Fonctionnalités principales](#fonctionnalités-principales)
- [Modules disponibles](#modules-disponibles)
- [Rôles utilisateurs](#rôles-utilisateurs)
- [Structure Google Sheets](#structure-google-sheets)
- [Installation](#installation)
- [Déploiement](#déploiement)
- [Fonctions utiles Apps Script](#fonctions-utiles-apps-script)
- [Présence et planning](#présence-et-planning)
- [Journal des connexions](#journal-des-connexions)
- [Dashboard et pilotage](#dashboard-et-pilotage)
- [Historique et audit](#historique-et-audit)
- [Design et interface](#design-et-interface)
- [Points d’attention](#points-dattention)
- [Roadmap possible](#roadmap-possible)
- [Technologies utilisées](#technologies-utilisées)

---

## Objectif du projet

**Syndic Ledger High-End** est un outil web interne destiné à suivre, traiter et piloter différents dossiers métier depuis une interface unique.

L’application utilise :

- **Google Sheets** comme base de données ;
- **Google Apps Script** comme backend ;
- **HTML / CSS / JavaScript** comme interface front-end.

Objectifs principaux :

- centraliser les dossiers par module ;
- suivre l’activité des utilisateurs ;
- gérer les présences et les temps de connexion ;
- planifier les shifts des ambassadeurs ;
- suivre le journal des connexions avec KPI et export PDF ;
- conserver un historique complet des actions ;
- proposer une interface moderne, fluide et responsive.

---

## Fonctionnalités principales

- Connexion par identifiant et mot de passe.
- Gestion des rôles : **Super Admin**, **Team Leader**, **Ambassadeur**.
- Gestion des utilisateurs et des équipes.
- Modules métier : agréments, sinistres, factures, résiliations.
- Dashboard global avec KPI et suivi détaillé des traitements.
- Filtres spécifiques dans la carte **Traitements détaillés** : ambassadeur et module.
- Recherche globale avec affichage des résultats au premier plan.
- Suivi des sessions utilisateurs.
- Suivi des présences journalières.
- Planning des shifts par utilisateur.
- Journal des connexions avec KPI, filtres de période, tableaux et export PDF.
- Historique des actions avec pagination et filtre par action.
- Interface responsive avec thème clair / sombre.
- Animations sur les boutons pour confirmer la prise en compte des actions.

---

## Modules disponibles

### 1. Agréments

Module de suivi des dossiers d’agrément avec :

- numéro de dossier ;
- compagnie ;
- type client ;
- statut professionnel ;
- calculs de solvabilité ;
- gestion multi-profils ;
- affectation ambassadeur / gestionnaire ;
- statut personnalisable ;
- historique des versions.

### 2. Sinistres

Module de gestion des sinistres avec workflow :

- **Nouvelle déclaration** ;
- **Complément** ;
- **En attente** ;
- statut complet / relance / traité ;
- gestion des commentaires ;
- suivi des relances ;
- actions de transfert après clôture du traitement.

### 3. Factures

Module de suivi des factures avec :

- étapes de vérification ;
- calcul ;
- règlement ;
- statut remonté / vérifié / traité ;
- commentaires de traitement et de vérification ;
- badges de vérification.

### 4. Résiliations

Module de gestion des résiliations avec :

- origine ;
- contrat ;
- date de réception ;
- date de sortie ;
- motif ;
- complétude ;
- statut de traitement.

### 5. Présence

Module de suivi de présence avec :

- nombre total d’utilisateurs ;
- nombre d’utilisateurs en ligne ;
- nombre de connexions ;
- nombre de déconnexions ;
- temps total de connexion en heures ;
- heure d’arrivée ;
- heure de sortie ;
- shift planifié ;
- timeline horaire de **06h à 23h** ;
- timeline réelle des sessions de connexion ;
- événements de connexion / déconnexion dans la journée.

### 6. Planning

Module permettant aux responsables de planifier les shifts :

- **Super Admin** : planification de tous les ambassadeurs ;
- **Team Leader** : planification des ambassadeurs assignés à son équipe ;
- saisie de date, utilisateur, heure de début et heure de fin ;
- affichage sous forme de timeline de **06h à 23h** ;
- reprise automatique du shift dans l’onglet Présence.

### 7. Connexions

Module de consultation et pilotage du journal des connexions avec :

- KPI visuels sur la période sélectionnée ;
- filtres rapides : aujourd’hui, hier, 7 derniers jours, mois en cours ;
- période personnalisée ;
- filtre utilisateur ;
- filtre statut de session ;
- graphique simple par jour ;
- tableau des sessions ;
- tableau des tentatives de connexion ;
- distinction connexions réussies / échecs ;
- export PDF du journal de connexion.

### 8. Historique

Module d’audit avec :

- affichage des actions ;
- filtre par type d’action ;
- pagination de 15 lignes ;
- informations utilisateur, rôle, entité et résumé.

---

## Rôles utilisateurs

### Super Admin

Le Super Admin peut :

- voir tous les utilisateurs ;
- gérer toutes les équipes ;
- gérer les paramètres ;
- voir tous les modules ;
- consulter tout l’historique ;
- planifier tous les ambassadeurs ;
- exporter le journal des connexions.

### Team Leader

Le Team Leader peut :

- voir son équipe ;
- gérer les ambassadeurs assignés ;
- consulter les dossiers de son périmètre ;
- planifier les ambassadeurs de son équipe ;
- suivre les présences de son équipe ;
- consulter les connexions de son périmètre.

### Ambassadeur

L’Ambassadeur peut :

- consulter les dossiers qui lui sont affectés ;
- traiter les dossiers selon ses droits ;
- apparaître dans les suivis de présence et planning ;
- être suivi dans les sessions et journaux de connexion.

---

## Structure Google Sheets

L’application repose sur plusieurs feuilles Google Sheets utilisées comme tables de données.

| Feuille | Description |
|---|---|
| `USERS` | Utilisateurs de l’application |
| `TEAMS` | Équipes et rattachements |
| `AGREMENTS` | Dossiers d’agrément |
| `AGREMENT_TYPE_TEAM_MAP` | Cohérence type de dossier / équipe |
| `SINISTRES` | Dossiers sinistres |
| `FACTURES` | Dossiers factures |
| `RESILIATIONS` | Dossiers résiliation |
| `SESSIONS` | Sessions utilisateurs ouvertes ou fermées |
| `PRESENCE_DAILY` | Présence journalière cumulée |
| `LOGIN_LOG` | Journal des tentatives de connexion |
| `AUDIT_LOG` | Historique global des actions |
| `ENTITY_VERSIONS` | Versions détaillées des entités |
| `SETTINGS` | Paramètres personnalisables |
| `PLANNING_SHIFTS` | Shifts planifiés des ambassadeurs |

---

## Installation

### 1. Créer le classeur Google Sheets

Créer un nouveau Google Sheets qui servira de base de données.

### 2. Ouvrir Apps Script

Depuis le classeur :

```text
Extensions > Apps Script
```

### 3. Ajouter les fichiers

Créer ou remplacer les fichiers suivants :

```text
Code.gs
index.html
```

Puis coller le contenu correspondant du projet.

### 4. Lier le classeur comme base de données

Dans Apps Script, lancer :

```js
useActiveSpreadsheetAsDatabase();
```

Cette fonction permet d’utiliser le classeur courant comme base de données.

### 5. Initialiser l’application

Lancer ensuite :

```js
initApplication();
```

Cette fonction crée ou complète les feuilles nécessaires, initialise les données de base et prépare l’application.

---

## Déploiement

Dans Apps Script :

```text
Déployer > Nouveau déploiement > Application web
```

Paramètres recommandés :

```text
Exécuter en tant que : Moi
Qui a accès : Toute personne disposant du lien
```

Après chaque modification importante du code, créer une nouvelle version de déploiement.

Après redéploiement, faire un rechargement complet du navigateur :

```text
Ctrl + F5
```

---

## Fonctions utiles Apps Script

### Initialisation complète

```js
initApplication();
```

À utiliser après installation ou mise à jour.

### Utiliser le classeur courant comme base

```js
useActiveSpreadsheetAsDatabase();
```

À utiliser si le script doit être relié au classeur ouvert.

### Réparer la feuille planning

```js
repairPlanningSheet();
```

À utiliser si la feuille `PLANNING_SHIFTS` n’existe pas ou si les horaires sont mal formatés.

### Export PDF du journal des connexions

```js
exportConnexionPdf(token, filters);
```

Fonction appelée depuis le front pour générer un PDF Drive du journal de connexion selon les filtres courants.

### Créer ou réparer les feuilles sans supprimer les données

```js
ensureSheets_();
```

Cette fonction ajoute les feuilles ou colonnes manquantes sans vider les données.

### Générer tous les headers

```js
generateAllHeaders();
```

⚠️ À utiliser uniquement sur une base vierge, car cette fonction peut vider les feuilles existantes.

---

## Présence et planning

Le module Présence s’appuie sur :

- `SESSIONS` pour les sessions ouvertes ou fermées ;
- `PRESENCE_DAILY` pour les cumuls journaliers ;
- `PLANNING_SHIFTS` pour les shifts planifiés.

La timeline affiche les plages horaires de :

```text
06h à 23h
```

Chaque ambassadeur affiche :

- son nom ;
- son équipe ;
- son shift planifié ;
- sa première connexion de la journée ;
- sa dernière déconnexion ;
- ses sessions reconstituées sur la timeline ;
- les événements de connexion et déconnexion.

Les horaires de planning doivent être conservés en format texte :

```text
HH:mm
```

Cela évite la conversion automatique de Google Sheets en date technique du type `1899-12-30T09:00:00`.

---

## Journal des connexions

L’onglet Connexions s’appuie sur :

- `SESSIONS` pour les sessions ;
- `LOGIN_LOG` pour les tentatives de connexion ;
- `USERS` pour enrichir les informations utilisateur.

L’interface affiche :

- utilisateurs visibles ;
- utilisateurs en ligne ;
- connexions ;
- déconnexions ;
- échecs de connexion ;
- temps total de connexion ;
- durée moyenne ;
- nombre de sessions.

Filtres disponibles :

- période rapide ;
- période personnalisée ;
- utilisateur ;
- statut de session.

Un bouton permet de générer un PDF du journal des connexions dans Google Drive. L’action est enregistrée dans l’historique avec le type :

```text
EXPORT_CONNEXION_PDF
```

---

## Dashboard et pilotage

Le dashboard centralise les indicateurs clés de l’activité.

La carte **Traitements détaillés** dispose de filtres locaux qui n’impactent pas le reste du dashboard :

- filtre par ambassadeur ;
- filtre par module ;
- bouton de réinitialisation.

La recherche globale affiche ses résultats au premier plan afin d’éviter qu’ils soient masqués par les cartes ou les tableaux de l’interface.

---

## Historique et audit

L’historique s’appuie principalement sur :

- `AUDIT_LOG` ;
- `ENTITY_VERSIONS`.

L’interface affiche les actions avec :

- pagination de 15 lignes ;
- filtre par action ;
- date ;
- utilisateur ;
- rôle ;
- type d’entité ;
- résumé de l’action.

---

## Design et interface

Le front utilise un thème premium de type **Aether Glass Morphism** avec :

- thème clair et sombre ;
- cartes glassmorphism ;
- boutons animés ;
- badges colorés ;
- timelines visuelles ;
- modales ;
- toasts de confirmation ;
- résultats de recherche au premier plan ;
- layout responsive.

L’objectif est de garder une interface professionnelle, moderne et lisible.

---

## Points d’attention

- Ne pas lancer `generateAllHeaders()` sur une base contenant déjà des données.
- Toujours redéployer l’application après modification de `Code.gs` ou `index.html`.
- Après redéploiement, faire un rechargement complet du navigateur avec `Ctrl + F5`.
- Les horaires de planning doivent rester au format texte `HH:mm`.
- L’export PDF des connexions utilise Google Drive et peut demander une autorisation au premier usage.
- Les droits d’affichage dépendent du rôle utilisateur.
- Les Team Leaders voient uniquement leur périmètre.
- Les Super Admins voient tout le périmètre.

---

## Roadmap possible

Améliorations possibles pour les prochaines versions :

- export PDF des présences ;
- export Excel des présences et plannings ;
- filtre planning par équipe ;
- vue semaine / mois du planning ;
- gestion des absences ;
- alertes en cas d’absence ou retard ;
- notifications internes ;
- statistiques détaillées par équipe ;
- système de commentaires par dossier ;
- sauvegarde automatique des paramètres d’affichage ;
- amélioration des graphiques du journal de connexion.

---

## Technologies utilisées

- Google Apps Script
- Google Sheets
- HTML
- CSS
- JavaScript
- Services Apps Script :
  - `SpreadsheetApp`
  - `PropertiesService`
  - `CacheService`
  - `LockService`
  - `Utilities`
  - `HtmlService`
  - `DriveApp`

---

## Licence

Projet interne. À adapter selon l’usage de l’organisation.

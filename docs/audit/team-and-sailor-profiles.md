# Audit UX — fiches équipage et navigateur

## Objectif

Corriger les deux destinations ouvertes depuis le rail du championnat : la fiche d’un équipage et la fiche d’un navigateur. Les pages doivent conserver l’identité visuelle SailBoard sans couper les noms, superposer les données ni laisser la carte satellitaire écraser le contenu sportif.

## Étape 1 — fiche équipage en production

**État initial : bloqué.**

Capture : `docs/audit/01-team-profile-current.png`

- La grille en trois colonnes comprime le nom de l’équipage jusqu’à le couper.
- La carte occupe le centre de l’écran sans apporter de donnée sportive prioritaire.
- Le score, les membres et l’étape sont dispersés dans trois zones concurrentes.
- Des métriques non disponibles sont représentées par des tirets.
- Le rail conserve plusieurs sections ouvertes alors que l’utilisateur vient d’entrer dans un dossier précis.

## Étape 2 — fiche navigateur en production

**État initial : bloqué.**

Capture : `docs/audit/02-sailor-profile-current.png`

- Le nom du navigateur est coupé par la colonne cartographique.
- La carte crée une grande zone vide et reporte l’historique sous la ligne de flottaison.
- L’attribution individuelle manque de lien visuel avec l’équipage concerné.
- Les colonnes « rôle » et « points » entrent en collision lorsque leur largeur diminue.

## Étape 3 — architecture commune corrigée

**État final : sain.**

Captures desktop :

- `docs/audit/02-team-profile-redesign-desktop.png`
- `docs/audit/03-sailor-profile-redesign-desktop.png`

Captures mobile :

- `docs/audit/04-team-profile-redesign-mobile.png`
- `docs/audit/05-sailor-profile-redesign-mobile.png`

Corrections appliquées :

- Grille principale ramenée à deux zones utiles : identité et données de l’étape.
- Carte déplacée sous ces données et limitée à une bande panoramique de contexte.
- Noms complets rendus visibles avec une échelle typographique responsive.
- Score, rang et état de publication regroupés sans décor numérique géant.
- Membres de l’équipage immédiatement visibles et cliquables depuis la fiche bateau.
- Équipage de l’étape immédiatement accessible depuis la fiche navigateur.
- Métriques de temps absentes entièrement masquées au lieu d’afficher un tiret.
- Historique navigateur doté d’une grille spécifique : rôle sous l’équipage sur mobile, points isolés à droite.
- Rail contextuel : Équipages ouvert sur une fiche équipage, Navigateurs ouvert sur une fiche navigateur.

## Vérifications

- Desktop : 1440 × 800, sans coupe ni chevauchement.
- Mobile : 390 × 844, `scrollWidth === clientWidth` sur les deux profils.
- Parcours vérifié : Centre de Médiation → Cahierc Pierre.
- Les noms des membres restent des liens et le bouton d’étape reste accessible.
- Les cartes IGN chargent après leur délai réseau normal et ne bloquent aucun contenu.

## Accessibilité et limites de preuve

- La hiérarchie de titres, les liens natifs et les libellés des disclosures sont conservés.
- Aucun texte essentiel n’est porté uniquement par la couleur.
- L’audit couvre la structure, le responsive, le clic principal et les erreurs navigateur ; il ne constitue pas un audit WCAG exhaustif au lecteur d’écran.

final result: passed

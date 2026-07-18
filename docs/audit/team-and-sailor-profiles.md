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

## Étape 3 — première correction, encore trop haute

**État : rejeté après mise en production.**

Capture : `docs/audit/06-sailor-profile-too-tall.png`

- Les coupes et chevauchements ont disparu, mais la carte reste envahissante.
- La zone profil + carte mesure 541 px et l’historique ne commence qu’à 649 px sur un viewport de 720 px.
- La structure est plus propre, mais le volume affiché ne correspond pas à la faible quantité de données.

## Étape 4 — version compacte

**État final : sain.**

Captures :

- `docs/audit/08-sailor-profile-compact-final.png`
- `docs/audit/09-team-profile-compact-final.png`

Corrections appliquées :

- Grille principale limitée à deux zones utiles : identité et données de l’étape.
- Carte supprimée des deux profils ; les parcours restent consultables sur les pages de course.
- Zone haute ramenée de 541 à 176 px, soit 67 % de réduction.
- Noms complets rendus visibles avec une échelle typographique responsive.
- Score, rang et état de publication regroupés sans décor numérique géant.
- Membres de l’équipage immédiatement visibles et cliquables depuis la fiche bateau.
- Équipage de l’étape immédiatement accessible depuis la fiche navigateur.
- Métriques de temps absentes entièrement masquées au lieu d’afficher un tiret.
- Historique navigateur doté d’une grille spécifique : rôle sous l’équipage sur mobile, points isolés à droite.
- Rail contextuel : Équipages ouvert sur une fiche équipage, Navigateurs ouvert sur une fiche navigateur.

## Vérifications

- Desktop : 1280 × 720, sans coupe ni chevauchement.
- Les quatre entrées d’historique sont visibles sans défilement.
- Parcours vérifié : Centre de Médiation → Cahierc Pierre.
- Les noms des membres restent des liens et le bouton d’étape reste accessible.

## Accessibilité et limites de preuve

- La hiérarchie de titres, les liens natifs et les libellés des disclosures sont conservés.
- Aucun texte essentiel n’est porté uniquement par la couleur.
- Cette passe de densification a été recapturée et mesurée sur le viewport desktop 1280 × 720 ; aucune nouvelle capture mobile n’a été acceptée, l’override du navigateur n’ayant pas modifié son viewport dans cette session.
- L’audit couvre la structure desktop, le clic principal et les erreurs navigateur ; il ne constitue pas un audit WCAG exhaustif au lecteur d’écran.

final result: passed

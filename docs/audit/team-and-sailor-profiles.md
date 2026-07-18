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

**État : rejeté.**

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

La hauteur a bien été réduite, mais le résultat reste un grand hero de 1 072 px de large. Le nom est dupliqué et le profil continue d’être mis en scène comme une page fullscreen.

## Étape 5 — barre de données

**État : rejeté.**

Captures :

- itération locale abandonnée, non conservée

Corrections appliquées :

- Suppression totale du hero, de l’identité dupliquée et des styles associés.
- Barre fonctionnelle de 88 px contenant uniquement statut, rang, score, dernière étape et équipage.
- Suppression du bouton « Voir l’étape » dupliqué ; l’action globale du bandeau suffit.
- Historique remonté à 188 px depuis le haut du viewport.
- Trois membres d’équipage conservés comme liens directs vers leurs fiches.
- Même structure dense sur les profils équipage et navigateur.

Cette version réduisait la hauteur mais restait une surface pleine largeur. Elle corrigeait la taille sans corriger le modèle d’interaction.

## Étape 6 — HUD contextuel

**État final : sain.**

Captures :

- `docs/audit/14-team-ranking-hud-final.png`
- `docs/audit/15-sailor-ranking-hud-final.png`
- `docs/audit/16-sailor-ranking-hud-mobile-final.png`

Corrections appliquées :

- Suppression de la page profil et de son composant plein écran.
- Ouverture des équipages et navigateurs dans le rail droit du classement, sur le modèle du dossier de course.
- HUD absent par défaut, ouvert par deep-link ou clic sur une ligne, et réellement repliable.
- Score compact, membres ou affectation immédiatement accessibles, quatre étapes courues uniquement.
- Suppression des blocs redondants « meilleure étape », « nombre d’étapes » et des étapes futures vides.
- Liens croisés dans le HUD : équipage vers navigateur puis navigateur vers équipage.
- Redirection des anciennes URL de profil vers le nouveau HUD pour préserver tous les liens existants.

## Vérifications

- Desktop : 1280 × 720, rail de 358 px, sans coupe ni chevauchement.
- Mobile : 390 × 844, HUD navigateur de 423 px et HUD équipage de 500 px ; le classement reste visible derrière.
- Aucun débordement horizontal sur les deux HUD mobiles.
- Parcours vérifié : Centre de Médiation → Cahierc Pierre → Centre de Médiation.
- Le bouton de fermeture retire le rail et rend les 1 070 px au classement desktop.

## Accessibilité et limites de preuve

- La hiérarchie de titres, les liens natifs et les libellés des disclosures sont conservés.
- Aucun texte essentiel n’est porté uniquement par la couleur.
- Les états desktop et mobile ont été recapturés avec la même implémentation locale.
- L’audit couvre la structure, les liens croisés, le repli, les redirections et les erreurs navigateur ; il ne constitue pas un audit WCAG exhaustif au lecteur d’écran.

final result: passed

# Design QA — carte tactique SAR desktop

## Périmètre

- Vérité visuelle source : `/tmp/sailboard-map-ideation/sar-reconnaissance.png` — option 2 Seedream 5.0 Pro explicitement sélectionnée.
- Implémentation finale : `docs/qa/tactical-map-desktop-16x9.png` — viewport 1440 × 810, mode `Tactical`, vue initiale du circuit.
- Comparaison plein écran normalisée : `docs/qa/tactical-map-option2-comparison.png` — source à gauche, implémentation à droite, deux surfaces 1440 × 810.
- Vérification responsive : `docs/qa/tactical-map-mobile-natural.png` — viewport 390 × 844, mode naturel forcé, aucune couche tactique chargée.
- Route : `http://localhost:3000/`.
- État : aucune étape sélectionnée ; HUD cartographique, nuages, chronologie et timeline visibles ; ADS-B live et AIS simulé faute de clé serveur.

## Comparaison finale

| Surface | Source | Implémentation finale | Verdict |
|---|---|---|---|
| Typographie | Typographie SailBoard compacte, contrôle `Natural / Tactical` | Familles, graisses et densité produit existantes conservées ; switch accessible en capitales visuelles | Conforme |
| Espacement et rythme | Carte héro plein écran, switch compact en haut à droite | Même hiérarchie ; le rail produit actuel plus riche reste intact et la carte conserve toute la surface utile restante | Conforme, contrainte produit assumée |
| Couleurs et tokens | Terre argentée noir et blanc, mer bleu nuit, cyan et jaune pour la télémétrie | Raster IGN désaturé à contraste renforcé, fond `#001827`, courbes blanches, tokens `--hud`, `--race`, `--past-race` inchangés | Conforme |
| Image et cartographie | Satellite SAR stylisé, relief et isobathes | Orthophoto IGN réelle, relief calculé depuis DEM Terrarium, isobathes EMODnet, routes OpenStreetMap/OpenFreeMap | Amélioré en fidélité géographique |
| HUD et copie | Grille, coordonnées, contrôle de mode | HUD DOM existant conservé au-dessus des nuages ; états honnêtes `ADS-B LIVE` et `AIS MODEL` | Conforme à la demande |
| Mouvement | Mouvement seulement suggéré par le mock | Chronologie existante intacte ; villes scintillantes, trafic routier, navires et avions interpolés ; nuages à trois passes volumétriques | Conforme à la demande étendue |
| Mobile | Non spécifié dans le mock | Switch absent, sources tactiques absentes de l’attribution, fond naturel seul à 390 × 844 | Validé |

## Comparaison focalisée

La comparaison plein écran normalisée suffit pour le style de carte car la cible et l’implémentation sont toutes deux des surfaces cartographiques plein cadre. Les zones critiques — switch, HUD de coordonnées, littoral, courbes, marqueurs et timeline — restent lisibles dans `docs/qa/tactical-map-option2-comparison.png`. La capture mobile séparée sert de preuve ciblée pour la coupure des couches lourdes.

## Historique QA

### Passage 1 — bloqué

- [P2] La terre de l’implémentation était sensiblement plus sombre et moins argentée que la cible Seedream, ce qui réduisait la lecture SAR du relief.
- [P2] Le comportement mobile n’était pas encore prouvé visuellement, alors que l’absence totale des couches lourdes est une exigence explicite.

### Corrections

- Contraste raster tactique porté à `0.62`, plafond de luminosité à `0.92`, opacité à `0.82` et fond marin renforcé en bleu nuit `#001827`.
- Capture dédiée à 390 × 844 : aucun contrôle `Map appearance`, aucune attribution EMODnet/OpenFreeMap et aucune télémétrie live, ce qui prouve que le chemin tactique n’est pas monté sur mobile.

### Passage final — validé

- Le bouton `Natural` active `aria-pressed=true` en un clic et masque la télémétrie ; `Tactical` la réactive sans appel à `map.setStyle`.
- La chronologie reste rendue après les deux bascules et `useSeasonChronologyAnimation.ts` n’a pas été modifié.
- Le HUD de coordonnées et le bouton de recentrage restent au-dessus des nuages et des couches cartographiques.
- Le navigateur affiche `ADS-B LIVE`; l’absence de `AISSTREAM_API_KEY` est rendue honnêtement par `AIS MODEL` et les voies commerciales simulées.
- Aucune erreur ni aucun avertissement de console sur desktop et mobile.

## Contrôles techniques

- `npm test` : 27 tests réussis.
- `npm run lint` : réussi.
- `npm run build` : réussi.
- Interactions navigateur : `Natural`, `Tactical`, statut de source et responsive mobile vérifiés.

final result: passed

---

# Design QA — HUD contextuel depuis le rail

## Périmètre

- État rejeté : `docs/audit/nav-profile-hud/02-wrong-full-ranking.png` — cliquer un nom du podium quittait la saison pour ouvrir le classement complet et son grand panneau latéral.
- Vérités visuelles utilisateur : `/var/folders/vc/3dmscl8d4rd_t9gqggky7m9r0000gn/T/codex-clipboard-fe27055d-5942-4ecb-b6ff-1b7f65033b3c.png` et `/var/folders/vc/3dmscl8d4rd_t9gqggky7m9r0000gn/T/codex-clipboard-8861e061-5bb2-414f-9f04-3231b6497636.png`.
- Implémentation finale : `docs/audit/nav-profile-hud/03-sailor-hud-local.png` et `docs/audit/nav-profile-hud/04-team-hud-local.png` — viewport 1280 × 720.
- Parcours vérifié : ligne « Vincent Bouvier » du rail → HUD navigateur → « Opteamwork » → HUD équipage → fermeture.

## Comparaison finale

| Surface | État défaillant | Implémentation finale | Verdict |
|---|---|---|---|
| Navigation | Une ligne de podium était un lien vers `/classements?...&selection=...` | Une ligne de podium est un bouton local ; l’URL et la page courante restent inchangées | Corrigé |
| Hiérarchie | Le clic sur une personne et le clic sur « Navigateurs » produisaient la même page complète | Les titres « Équipages » et « Navigateurs » gardent le classement complet ; les noms ouvrent seulement un HUD | Validé |
| Encombrement | Panneau d’environ 720 px de haut, avec de grands vides | HUD navigateur 330 × 175 px ; HUD équipage 330 × 220 px, soit environ 70 à 76 % de hauteur en moins | Corrigé |
| Contenu | Résumé étalé, répétitions et grands blocs | Rang, nom, total, relation métier et quatre scores d’étape ; aucun bloc décoratif | Corrigé |
| Interaction | Changement de contexte et retour nécessaire | Bascule directe navigateur ↔ équipage, fermeture par croix ou Échap | Validé |
| Couleurs et tokens | Palette SailBoard cohérente mais surface massive | Même palette, couleur de rang conservée, surface opaque et compacte type HUD de course | Conforme |

## Historique QA

### Passage 1 — bloqué

- [P1] Le clic sur une ligne du podium ouvre la page complète de classement.
- [P1] Le premier HUD est rendu dans le `side-nav`, dont l’overflow masque tout ce qui dépasse du rail.
- [P2] Le premier format compact mesure encore 370 × 213 px pour un navigateur et 370 × 270 px pour un équipage.

### Corrections

- Les lignes de podium sont devenues des boutons sans changement d’URL ; seuls les libellés de section restent des liens vers les classements complets.
- L’état de sélection et le HUD ont été remontés dans `AppShell`, hors de l’élément `aside`, afin d’éviter toute coupe par le rail.
- Largeur réduite à 330 px ; en-tête, identité, lignes d’équipage et scores d’étape resserrés sans supprimer de donnée utile.
- Les relations dans le HUD restent cliquables : Opteamwork ouvre son équipage ; chaque membre rouvre son HUD navigateur.

### Passage final — validé

- Clic sur Vincent Bouvier : URL inchangée, HUD `330 × 175 px`.
- Bascule vers Opteamwork : URL inchangée, HUD `330 × 220 px` avec ses trois navigateurs.
- Fermeture : le HUD disparaît sans modifier la page sous-jacente.
- Clic sur le titre « Navigateurs » : classement individuel complet affiché.
- Aucun avertissement ni erreur applicative pendant le parcours.

## Contrôles techniques

- `npm run lint` : réussi.
- `npm test` : 15 tests réussis.
- `npm run build` : réussi.

final result: passed

---

# Design QA — rail championnat compact en hauteur

## Périmètre

- Vérité visuelle source : `/var/folders/vc/3dmscl8d4rd_t9gqggky7m9r0000gn/T/codex-clipboard-6f12a2b3-639b-443f-8395-af3ae803ea39.png` — rail ouvert qui nécessite un défilement vertical.
- Implémentation navigateur : `docs/qa/sidebar-compact-176x594.png` — recadrage du rail à sa largeur produit de 176 px.
- Route : `http://localhost:4173/`.
- Viewport vérifié : 1440 × 632, ainsi qu’un écran court de 1200 × 556.
- État : Saison, prochaine course, podium Équipages et podium Navigateurs dépliés ; Admin visible.

## Comparaison finale

| Surface | Source | Implémentation finale | Verdict |
|---|---|---|---|
| Typographie | Hiérarchie lisible mais très espacée | Familles, tailles, graisses et casse inchangées ; seule la respiration verticale est réduite | Conforme |
| Espacement et rythme | Bloc marque de 92 px et sections ouvertes plus hautes que le viewport | Marque à 64 px sur écran court, course à 58 px, lignes de podium à 25 px | Corrigé |
| Couleurs et tokens | Bleu nuit, jaune actif et cyan classement | Palette et états existants strictement conservés | Conforme |
| Images et actifs | Logo typographique et icônes existantes | Aucun actif modifié ou remplacé | Conforme |
| Copie et contenu | Prochaine course et deux podiums complets | Même contenu, mêmes liens et mêmes scores | Conforme |
| Interaction | Sections dépliables | Repli et réouverture du podium Équipages validés avec mise à jour de `aria-expanded` | Validé |

## Historique QA

### Passage 1 — bloqué

- [P2] Après une première densification, le rail conservait 14 px de débordement sur un viewport réellement court de 1200 × 556 (`scrollHeight: 500`, `clientHeight: 486`).

### Corrections

- Réduction adaptative du bloc marque de 92 à 64 px uniquement sous 780 px de hauteur.
- Course suivante ramenée à 58 px sans réduire les tailles de texte.
- Lignes de podium ramenées à 25 px et liens « Classement » à 24 px.
- Titres et disclosures rapprochés tout en conservant leurs interactions natives.

### Passage final — validé

- Sur 1200 × 556, le rail ne défile plus : `scrollHeight === clientHeight === 492`.
- Les trois sections ouvertes et Admin restent visibles dans le même viewport.
- La comparaison source / implémentation a été réalisée dans une même entrée visuelle ; le contenu, les couleurs, les icônes et la hiérarchie restent identiques.
- Le recadrage du composant entier suffit comme comparaison focalisée : aucune image métier ni zone de détail supplémentaire n’est concernée.
- Aucun message d’application en console ; les deux erreurs observées proviennent exclusivement d’une extension Chrome et non de SailBoard.

## Contrôles techniques

- `npm run lint` : réussi.
- `npm test` : 14 tests réussis.
- `npm run build` : réussi.

final result: passed

---

# Design QA — dossier équipage d’une étape

## Périmètre

- Vérité visuelle source : `/var/folders/vc/3dmscl8d4rd_t9gqggky7m9r0000gn/T/codex-clipboard-2206ca26-7be9-4436-b7c3-79d6186663a1.png` — 2586 × 1382, dossier ouvert sur Centre de Mediation.
- Capture production desktop : `docs/qa/race-crew-desktop-final.png` — 1280 × 720.
- Capture production mobile : `docs/qa/race-crew-mobile-final.png` — 390 × 844.
- Comparaison ciblée source / production : `docs/qa/race-crew-comparison.png` — 600 × 720.
- Route : `https://sailboard-three.vercel.app/courses/spi-ouest-france`.
- État : Centre de Mediation sélectionné, rail ouvert, résultats validés.

## Comparaison finale

| Surface | Source | Implémentation finale | Verdict |
|---|---|---|---|
| Typographie | Identité du bateau forte, mais aucun navigateur visible | Identité conservée ; trois noms complets sur une ligne, rôle et points tabulaires | Corrigé |
| Espacement et rythme | Deux grandes cases de chronométrage vides puis un grand vide | Un bloc points compact suivi immédiatement de l’équipage | Corrigé |
| Couleurs et tokens | Bleu nuit, jaune acide, séparateurs techniques | Tokens SailBoard et couleur de sélection conservés | Conforme |
| Images et actifs | Carte satellite IGN | Carte et actifs inchangés ; aucun substitut graphique ajouté | Conforme |
| Copie et contenu | « Temps » et « Écart 1er » affichés sans données | Champs absents lorsqu’aucun chrono officiel n’existe ; libellé « Équipage de l’étape » explicite | Corrigé |
| Responsive | État source desktop uniquement | Rail lisible à 1280 px et 390 px, sans débordement horizontal | Validé |

## Historique QA

### Passage 1 — bloqué

- [P1] Le clic ouvrait un dossier sans membres alors que les affectations WDT déductibles sans ambiguïté existaient déjà dans la base et dans la logique d’import.
- [P2] « Temps » et « Écart 1er » affichaient des tirets alors que le classeur WDT ne fournit aucun chrono.
- [P2] Le rail répétait les noms dans un résumé vide de fonction avant la liste individuelle.

### Corrections

- Branchement des affectations d’étape connues selon la même règle conservatrice que l’import PostgreSQL : une association n’est affichée que lorsque la correspondance de score est unique.
- Suppression conditionnelle complète des métriques de temps absentes.
- Remplacement du résumé dupliqué par trois lignes de navigateurs cliquables avec rôle et points individuels.
- État explicite « Composition non publiée » pour les associations ambiguës, sans inventer d’équipage.

### Passage 2 — bloqué sur mobile

- [P2] À 390 px, le pied de page conservait une grille prévue pour le bouton d’animation absent et créait un débordement horizontal après ouverture du rail.

### Correction et passage final — validé

- La grille du pied de page dépend maintenant de la présence réelle du bouton d’animation.
- À 390 × 844, `document.scrollWidth === innerWidth`, le rail et le résumé d’étape restent entièrement accessibles.
- À 1280 × 720, le clic sélectionne Centre de Mediation et affiche CHAMPANHAC Benoît, BOIS François et BOURGES Laurent ; « Temps » et « Écart 1er » sont absents.
- La comparaison ciblée côte à côte confirme la conservation de la hiérarchie visuelle et la suppression de l’espace mort.
- Aucun avertissement ni erreur de console sur les scénarios desktop et mobile.

## Contrôles techniques

- `npm run lint` : réussi.
- `npm test` : 13 tests réussis.
- `npm run build` : réussi.
- Base WDT : 69 affectations d’équipage inférées de manière non ambiguë et vérifiées.

final result: passed

---

# Design QA — navigation enrichie du championnat

## Périmètre

- Vérité visuelle source : `/var/folders/vc/3dmscl8d4rd_t9gqggky7m9r0000gn/T/codex-clipboard-4acecf62-2cff-4e5a-b8d5-2e4a08212d5d.png` — option explicitement sélectionnée par l’utilisateur.
- Implémentation desktop : `docs/qa/sidebar-championship-desktop.jpg` — 1440 × 1011, accueil de saison, trois sections dépliées.
- Implémentation tablette : `docs/qa/sidebar-championship-tablet.jpg` — 900 × 1011, rail compact.
- Implémentation mobile : `docs/qa/sidebar-championship-mobile.jpg` — 390 × 844, navigation basse persistante.
- Recadrage desktop : `docs/qa/sidebar-championship-rail.jpg` — 176 × 1010.
- Comparaison ciblée source / implémentation : `docs/qa/sidebar-championship-comparison.jpg` — 695 × 1010.
- Route vérifiée : `http://localhost:4173/`.
- État : Saison active ; prochaine course, podium équipages et podium navigateurs dépliés.

Le visuel source est une cible de structure et de hiérarchie produite sur un rail isolé plus large. L’implémentation conserve le rail produit à 176 px afin de ne modifier ni la carte héro ni la timeline horizontale, conformément à la demande.

## Comparaison finale

| Surface | Source | Implémentation finale | Verdict |
|---|---|---|---|
| Typographie | Titres condensés, noms sur une ligne, points discrets | Familles SailBoard existantes ; `Trophée YCCA` et les six noms tiennent sur une ligne sans troncature | Conforme |
| Espacement et rythme | Trois informations rattachées directement à leur entrée de navigation | Même arbre : prochaine course sous Saison, podiums sous Équipages et Navigateurs ; Admin ancré en bas | Conforme, adapté au rail 176 px |
| Couleurs et tokens | Bleu nuit, jaune actif, cyan classement | Tokens `--race`, `--past-race`, `--text` et séparateurs existants réutilisés | Conforme |
| Images et actifs | Aucun actif raster métier ; pictogrammes de navigation | Icônes Lucide déjà utilisées par SailBoard ; aucune image factice, aucun SVG artisanal | Conforme |
| Copie et contenu | Trophée YCCA, Arzon, podiums WDT | Données réelles des instantanés WDT 2026 et de `SEASON_RACES` ; accents et ordre prénom/nom corrigés à l’affichage | Conforme |
| Interaction | Sections dépliables et lignes cliquables suggérées | Trois disclosures accessibles, course cliquable, six profils cliquables et deux liens vers le classement complet | Validé |
| Responsive | Source desktop uniquement | Contenu contextuel masqué dans le rail 82 px tablette ; quatre destinations équitablement réparties dans la barre mobile | Validé |

## Historique QA

### Passage 1 — bloqué

- [P2] Le premier rendu desktop tronquait `Trophée YCCA`, `Centre de Médiation`, `Benoît Champanhac` et `Xavier Pierre Dubos`.
- [P2] À 390 px, les icônes Équipages et Navigateurs se chevauchaient car leurs conteneurs enrichis conservaient leur largeur intrinsèque.
- [P2] Sur écran haut, le classement finissait trop tôt et recréait un espace mort excessif avant Admin.

### Corrections

- Réallocation de la grille interne des lignes pour donner 95 px aux noms et conserver les points tabulaires.
- Passage des wrappers enrichis en `display: contents` sur mobile et base flex nulle pour quatre cibles de 97,5 px.
- Rythme vertical adaptatif au-dessus de 900 px : prochaine course, titres et lignes de podium gagnent de l’air sans faire défiler un laptop plus court.
- Admin reste ancré en bas pour former une destination utilitaire distincte et supprimer le vide terminal du rail d’origine.

### Passage final — validé

- La comparaison côte à côte confirme la même hiérarchie, les mêmes trois groupes, les guides verticaux, les accents jaune/cyan et la priorité donnée aux noms.
- Les sept libellés sensibles ont `scrollWidth <= clientWidth` à 1440 px.
- Le bouton Équipages replie et redéplie son podium avec `aria-expanded` et un libellé accessible mis à jour.
- Le clic sur Centre de Médiation ouvre bien `/bateaux/centre-de-mediation`.
- À 900 px, le rail mesure 82 px, masque les aperçus et ne crée aucun débordement horizontal.
- À 390 px, la barre reste fixée en bas ; Saison, Équipages, Navigateurs et Admin occupent chacun 97,5 px.
- Aucune erreur ni aucun avertissement de console pendant le scénario final.

## Contrôles techniques

- `npm run lint` : réussi.
- `npm test` : 14 tests réussis.
- `npm run build` : réussi.
- Capture navigateur desktop, tablette et mobile : réussie.
- Comparaison plein écran : `docs/qa/sidebar-championship-desktop.jpg` face à la source.
- Comparaison focalisée : `docs/qa/sidebar-championship-comparison.jpg` ; aucun autre recadrage n’est nécessaire car le composant entier y reste lisible.

final result: passed

---

# Design QA — roadbook de saison SailBoard

## Périmètre

- Source : `docs/reference-world-diam-tour-2026.png`
- Implémentation desktop : `docs/qa/season-circuit-desktop.png` — 1440 × 1024
- Implémentation mobile ouverte : `docs/qa/season-circuit-mobile.png` — 390 × 844
- Implémentation mobile fermée : `docs/qa/season-circuit-mobile-closed.png` — 390 × 844
- Écrans : accueil Season Ocean, carte de saison, roadbook dépliable, timeline et navigation mobile.

La source est une référence d’architecture de l’information, pas une cible esthétique. La comparaison conserve ses apports — territoire, six étapes, dates, lieux et ralliements — dans le langage visuel déjà validé de SailBoard.

## Comparaison visuelle

| Surface | Référence | Implémentation SailBoard | Verdict |
|---|---|---|---|
| Territoire | Silhouette simplifiée de la façade Atlantique | Fond satellite IGN, limites géographiques et six positions réelles | Amélioré |
| Chronologie | Bulles et flèches imprimées | Ligne cartographique, rail numéroté et timeline synchronisée | Conforme à l’intention |
| Étapes | Liste statique séparée de la carte | Sélection interactive avec états arrivé, course du jour et à venir | Amélioré |
| Hiérarchie | Informations dispersées entre carte et liste | Carte héro, dossier de course, roadbook compact et météo | Amélioré |
| Mobile | Affiche portrait statique | Panneau plein écran au-dessus de l’expérience, refermable et sans débordement | Conforme |

## Vérifications fonctionnelles

- Le rail s’ouvre et se ferme avec `aria-expanded` et un libellé accessible.
- La sélection « Tour des Glénan » a synchronisé le titre, l’étape pressée et le compteur `04 / 06`.
- La fermeture mobile rend immédiatement la carte et la timeline accessibles.
- Les six étapes restent présentes sur desktop comme sur mobile.
- Aucun débordement horizontal : `scrollWidth === clientWidth` à 390 px et 1440 px.
- Aucun avertissement ni erreur de console pendant les scénarios testés.
- Les cibles principales utilisent des boutons ou liens natifs et restent accessibles au clavier.

## Corrections réalisées pendant la QA

1. Le premier rail desktop était trop haut pour afficher les six étapes. Les lignes et ralliements ont été densifiés sans réduire la lisibilité.
2. Le titre du dossier de course était tronqué lorsque le rail était ouvert. Sa taille responsive a été ajustée.
3. Le panneau mobile était limité à la hauteur de la carte. Il couvre maintenant tout l’espace jusqu’à la navigation persistante.
4. Le bouton cartographique mobile perdait son nom accessible lorsque son texte était masqué. Un `aria-label` dynamique a été ajouté.

## Contrôles techniques

- `npm run lint` : réussi
- `npm test` : 7 tests réussis
- `npm run build` : réussi

final result: passed

---

# Design QA — rail compact des classements

## Périmètre

- Source visuelle : `docs/reference-rankings-rail-before.png` et recadrage `docs/reference-rankings-calculation-card-before.png`.
- Implémentation desktop : `docs/qa/rankings-compact-boats.jpg` — 1440 × 1011, classement des équipages, premier rang sélectionné.
- Implémentation navigateurs : `docs/qa/rankings-compact-individuals.jpg` — 1440 × 1011, premier navigateur sélectionné.
- Implémentation tablette : `docs/qa/rankings-compact-tablet.jpg` — 900 × 900.
- Implémentation mobile détaillée : `docs/qa/rankings-compact-mobile-detail.jpg` — 390 × 844.
- Route : `/classements`, variantes `vue=bateaux` et `vue=individuel`.

La source représente l'état à corriger. La cible conserve le langage SailBoard mais réduit le poids du rail, respecte la casse des noms de personnes et retire les informations redondantes.

## Comparaison visuelle finale

| Surface | État initial | Implémentation finale | Verdict |
|---|---|---|---|
| Typographie | Nom et score du rail surdimensionnés ; prénom forcé en capitales | Nom ramené à 22–30 px, total à 36 px, casse individuelle conservée (`CHAMPANHAC Benoît`) | Corrigé |
| Espacement et grille | Rail jusqu'à 38 % de la zone utile ; blocs verticaux très hauts | Rail borné à 330–430 px ; score sur une ligne ; métriques sur deux colonnes | Corrigé |
| Contenu | Statut « provisoire » répété et carte « Calcul officiel » sans action | Statut exprimé une seule fois dans l'en-tête ; carte supprimée ; détail par étape prioritaire | Corrigé |
| Tablette | Six colonnes d'étapes débordaient de la liste | Les quatre étapes courues restent visibles dans la matrice ; les deux étapes futures restent disponibles dans le rail | Corrigé |
| Mobile | Détail très vertical mais utilisable | Total, métriques et six étapes tiennent dans un tiroir lisible et refermable | Validé |
| Couleurs et actifs | Charte SailBoard bleu nuit / jaune acide | Tokens, icônes Lucide et états de rang conservés sans nouvel actif décoratif | Conforme |

## Comparaison et historique QA

### Passage 1 — bloqué

- [P1] Le rail occupait une part excessive de la largeur et créait trois niveaux de titre concurrents.
- [P2] Le total dominait visuellement le nom et le détail par étape.
- [P2] La carte « Calcul officiel » répétait les KPIs sans apporter d'action ni d'information décisive.
- [P2] À 900 px, les colonnes des étapes futures poussaient le total hors de la zone visible.
- [P2] La transformation CSS en capitales détruisait la casse correcte des prénoms.

### Corrections

- Rail ramené à `clamp(330px, 28vw, 430px)` et à 320 px sous 1050 px.
- Total réorganisé en ligne compacte et réduit à 36 px.
- Suppression du statut dupliqué et de la carte de calcul.
- Matrice tablette limitée visuellement aux étapes courues, sans retirer les étapes futures du détail.
- Casse source conservée pour les noms des navigateurs dans le KPI, la liste et le rail.

### Passage 2 — validé

- La comparaison plein écran confirme que la liste récupère l'espace libéré et que le rail forme un résumé secondaire cohérent.
- La comparaison ciblée de la zone droite confirme la disparition complète de la carte de calcul et la priorité donnée aux six étapes.
- Les captures tablette et mobile ne montrent ni collision, ni contrôle masqué, ni score envahissant.
- Les vues équipes et navigateurs ont été testées, ainsi que l'ouverture du détail mobile.
- Aucun avertissement ni erreur console pendant les scénarios finaux.

## Contrôles

- Typographie : hiérarchie et casse validées sur équipes et navigateurs.
- Espacement : desktop, tablette 900 px et mobile 390 px validés.
- Couleurs : tokens existants conservés.
- Images : aucune image requise sur cette vue ; aucun substitut ou actif factice ajouté.
- Copie : bloc non pertinent supprimé, libellés métier restants inchangés.
- Interaction : recherche, sélection de ligne et fermeture du détail mobile conservées.

final result: passed

---

# Design QA — classement individuel WDT 2026

## Périmètre

- Source visuelle : `docs/reference-wdt-2026-individual-standings.png`
- Implémentation desktop : `docs/qa/wdt-individual-standings-desktop.png` — 1440 × 1024
- Implémentation mobile : `docs/qa/wdt-individual-standings-mobile.png` — 390 × 844
- État mobile détaillé : `docs/qa/wdt-individual-standings-mobile-detail.png` — 390 × 844
- Route : `/classements?vue=individuel`

La source est ici une vérité de contenu et de hiérarchie, pas une demande de reproduction de l'affiche WDT. L'interface reprend les rangs, noms, points, quatre courses et le total annoncé de 43 classés dans le langage compétition déjà établi de SailBoard.

## Comparaison visuelle finale

| Surface | Référence | Implémentation SailBoard | Verdict |
|---|---|---|---|
| Typographie | Sans-serif d'affiche, titre massif, rangs jaunes | Famille condensée SailBoard pour le scan sportif, monospace tabulaire pour les points | Conforme à l'intention produit |
| Espacement et rythme | Deux tableaux imprimés très denses | Liste unique continue, KPIs compacts et rail de détail fixe sur desktop | Amélioré pour l'interaction |
| Couleurs et tokens | Bleu WDT, blanc, jaune | Bleu nuit maritime, blanc, jaune acide et accents de rang cohérents avec SailBoard | Adaptation de marque assumée |
| Images et actifs | Logos WDT et Diam 24OD intégrés à l'affiche | Aucun logo tiers reconstruit ; la capture source est conservée dans la documentation | Conforme au périmètre |
| Copie et données | 43 classés annoncés, 42 lignes nominatives visibles | 43 classés annoncés, 42 scores nominatifs, 232 points et quatre courses explicités | Fidèle et transparent |
| Responsive | Affiche portrait statique | Liste tactile, navigation persistante et tiroir de détail refermable | Amélioré |

## Interactions et accessibilité testées

- Filtre par nom : la saisie `Darnaude` réduit le plateau à deux entrées et synchronise le détail.
- Sélection d'un concurrent : le clic sur BOUVIER Vincent ouvre son détail avec son rang et ses 16 points.
- État vide : une recherche sans correspondance affiche un message actionnable.
- Mobile : le détail s'ouvre dans un tiroir au-dessus de la navigation persistante et se ferme avec un bouton nommé `Fermer le détail`.
- Desktop et mobile : aucun débordement horizontal (`scrollWidth === innerWidth`).
- Console : aucun avertissement ni erreur sur le scénario final.

## Historique des itérations QA

### Passage 1 — bloqué

- [P1] Le détail sélectionné se trouvait après la liste complète sur mobile et n'était pas réellement accessible dans le parcours principal.
- [P2] À 390 px, le titre, les deux actions du bandeau et le nom du leader entraient en collision ou étaient tronqués.

### Corrections

- Ajout d'un tiroir mobile dédié, ouvert uniquement après sélection, scrollable et refermable.
- Passage du bandeau mobile sur deux rangées : titre complet puis deux actions de largeur égale.
- Ajustement optique du nom du leader dans la grille KPI.
- Correction de la sélection filtrée et ajout d'un état vide explicite.

### Passage 2 — validé

- La capture `wdt-individual-standings-mobile.png` montre le titre complet, les actions lisibles, les KPIs sans collision et la liste utilisable.
- La capture ciblée `wdt-individual-standings-mobile-detail.png` montre le tiroir de BOUVIER Vincent, son bouton de fermeture, les métriques et la provenance des données.
- La capture desktop conserve la densité, le rail contextuel et la lecture simultanée rang / concurrent / score.
- Aucun P0, P1 ou P2 restant. Aucun recadrage ciblé supplémentaire n'est nécessaire : la capture mobile de détail constitue la preuve focalisée sur l'interaction la plus dense.

## Contrôles techniques

- `npm run lint` : réussi
- `npm test` : 8 tests réussis
- `npm run build` : réussi

final result: passed

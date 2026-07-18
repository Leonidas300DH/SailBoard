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

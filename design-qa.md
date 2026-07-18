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

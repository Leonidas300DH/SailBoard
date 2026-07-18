# Audit — HUD contextuel du rail

1. `01-season-before-click.png` — saison avant interaction.
2. `02-wrong-full-ranking.png` — comportement rejeté : navigation vers le classement complet.
3. `03-sailor-hud-local.png` — HUD navigateur final, 330 × 175 px.
4. `04-team-hud-local.png` — HUD équipage final, 330 × 220 px.

Parcours validé à 1280 × 720 :

1. cliquer « Vincent Bouvier » dans le podium du rail ;
2. vérifier que l’URL ne change pas et que seul son HUD apparaît ;
3. cliquer « Opteamwork » dans ce HUD ;
4. vérifier la bascule vers le HUD équipage et ses trois navigateurs ;
5. fermer le HUD ;
6. cliquer sur le titre « Navigateurs » et vérifier l’ouverture du classement complet.

Résultat : aucun avertissement ou erreur applicative, lint réussi, 15 tests réussis et build Next.js réussi.

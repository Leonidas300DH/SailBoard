# Sprint 1 — Fondations design system & responsive réel

**Statut : modifications non commitées.** 16 fichiers touchés, +131/−114 lignes.
Vérifications au moment de l'écriture : `npm run lint` OK, `npm test` 14/14, `npm run build` OK.

Ce document liste tous les changements apportés lors du sprint 1 du plan d'amélioration
UX/UI (fondations + responsive), sans changer la direction graphique « cockpit tactique
nuit » (bleu nuit `#030d14`, jaune course `#e8ff29`, Jost en capitales).

---

## 1. Palette unifiée

Avant : trois jaunes (`#e8ff29`, `#d8ff00`, `#d9ff00`), trois rouges (`#ff1e1e`,
`#ff4050`, `#ff1f26`) et un vert menthe (`rgba(85,230,196,…)`, `#55e6c4`) coexistaient.
Après : un seul jaune, un seul rouge, le HUD entièrement en cyan `#009cde`.

- Tous les `rgba(216,255,0,…)` → `rgba(232,255,41,…)` :
  `shell.css`, `content.css`, `admin.css`.
- Tous les `rgba(255,64,80,…)` et `rgba(255,31,38,…)` → `rgba(255,30,30,…)` (le rouge
  du token `--danger`) : `shell.css`, `content.css` (via `admin.css`), `race.css`,
  `season.css`, `map-hud.css`, `timeline.css`.
- Vert menthe → cyan HUD `rgba(0,156,222,…)` : réticule, étiquette, readout et bouton
  recentrer dans `map-hud.css`, pastille « aujourd'hui » dans `timeline.css`, et la
  grille de la carte dans `lib/map/graticule.ts` (`#55e6c4` → `#009cde`).
- `components/CourseEditor.tsx` : couleurs de la carte d'édition alignées
  (`#d8ff00` → `#e8ff29`, `#ff4050` → `#ff1e1e`).

**Volontairement conservé** : les couleurs d'identité des bateaux (`#d8ff00`, `#d9ff00`
dans `lib/demo-data.ts`, `lib/database.ts`, `lib/wdt-2026.ts`, `AdminConsole.tsx`,
`app/api/admin/manage/route.ts`) — ce sont des données métier, pas du thème.

## 2. Tokens nettoyés (`app/styles/tokens.css`)

- Suppression de 18 tokens morts (0 occurrence dans le code) : `--panel-soft`,
  `--wdt-blue/red/pale/olive/black`, `--blue`, `--violet`, `--acid-deep`, `--race-deep`,
  `--glow-race`, `--glow-hud`, et l'échelle typographique inutilisée
  `--text-xs/sm/base/lg/xl/hero`.
- Suppression des alias trompeurs (`--orange` qui était un jaune, `--violet` un bleu) ;
  l'unique usage de `var(--orange)` (`admin.css`, `.status-tag.pending`) pointe
  maintenant sur `var(--race)`.
- `--acid` reste comme alias de `--race` (34 usages) ; le renommage complet est
  reporté pour ne pas gonfler ce diff.
- `--radius: 2px` → `--radius: 3px`.

## 3. Fondations visuelles

- **Rayon unique de 3px** sur toutes les surfaces chrome via une règle groupée dans
  `base.css` (boutons, chips carte, panneaux, champs, HUD, tiroirs, notices…).
  `.view-switch` reçoit en plus `overflow: hidden` pour que l'onglet actif respecte
  l'arrondi (`content.css`).
- **Focus visible global** : `:focus-visible { outline: 2px solid var(--race) }` dans
  `base.css` — avant, seul l'outline bleu par défaut du navigateur (invisible sur fond
  nuit) existait. Le style custom de la timeline est préservé (spécificité supérieure).
- Anneau de focus des champs admin renforcé : opacité `.08` → `.3` (`admin.css`).
- `color-scheme: dark` sur `html` (`base.css`) — les contrôles natifs (selects admin)
  se rendent en thème sombre.
- `app/layout.tsx` : nouvel export `viewport` avec `viewportFit: "cover"` et
  `themeColor: "#030d14"` (vérifié dans le HTML généré).
- **Contrastes** remontés au token `--muted` (≈7:1) là où ils étaient sous le seuil AA :
  `#55707c` (scores à venir), `#4d656f` (mois timeline), `#5f7883` (dates timeline),
  `#708994` (en-têtes standings/ledger), `#718894` (en-tête classement).

## 4. Responsive — safe-area iOS et hauteurs dynamiques

- `viewport-fit=cover` posé (voir §3), puis compensation des encoches :
  - Barre de navigation mobile : hauteur `calc(68px + env(safe-area-inset-bottom))`
    + padding interne, et `padding-bottom` du shell ajusté (`responsive.css`).
  - Idem pour la barre admin (`admin.css`) et le bouton d'enregistrement de
    l'éditeur de parcours (`admin.css`).
  - Tiroir mobile de détail classement : `inset` bas ajusté (`responsive.css`).
  - Barre d'onglets saison mobile (`season.css`) et haut de la topbar classements
    (`safe-area-inset-top`, `responsive.css`).
- `100dvh` (avec fallback `100vh` conservé juste avant) sur tous les shells plein
  écran : `shell.css` (public-shell, side-nav, race-stage), `season.css`
  (season-ocean-shell/stage), `admin.css` (admin-shell/sidebar, access-gate,
  course-map-panel), `content.css` (content-page, control-stage), `responsive.css`
  (race-stage, map-wrap, control-stage, entity-map-panel).
  Effet : le contenu n'est plus rogné sous la barre d'URL Safari iOS.

## 5. Cibles tactiles (≥ 44px ou zone de hit équivalente)

- Marqueurs de la carte saison : halo tactile invisible `::before` à `inset: -10px`
  (44px de zone sans grossir le point visuel de 24px) — `map-hud.css`.
- Chips carte et lien retour : 34 → 40px sur mobile (`responsive.css`) ; bouton
  recentrer 36 → 40px, et 44×44 en mode icône seule mobile (`map-hud.css`).
- Boutons fermer : rail équipage 34 → 40px (`race.css`), tiroir classement 36 → 44px
  (`content.css`), dossier d'étape 30 → 40px (`season.css`).
- `.button.small` 36 → 40px, `.nav-sublink` 36 → 44px, `.nav-roadbook-toggle`
  34 → 44px (`shell.css`).
- Play/pause : footer course 42 → 44px (`race.css`), HUD étape 38 → 44px (`season.css`).
- Divers : `.view-switch` 37 → 40px, `.control-search` 38 → 40px (`content.css`),
  actions topbar mobile 40 → 44px, action primaire saison mobile 40 → 44px
  (`responsive.css`, `season.css`), boutons de marques admin 28 → 34px (`admin.css`),
  liens `ContentNav` min-height 44px (`content.css`).

## 6. Breakpoints et orientation

- Admin aligné sur l'axe public : 950 → 1050px (rail icônes) et 620 → 760px (barre
  basse), y compris l'éditeur de parcours (`admin.css`).
- Media queries vides supprimées (`season.css`, blocs 1120px et 960–761px).
- Nouvelle media query paysage : `@media (max-height: 500px) and (orientation: landscape)`
  qui libère le shell saison (hauteur auto, défilement possible) au lieu de rogner le
  contenu — `responsive.css`.

## 7. JavaScript réactif

- `components/map/WindParticles.tsx` : la décision « petit écran » était figée au
  montage (`window.innerWidth < 760` unique). Le champ de particules écoute maintenant
  `matchMedia("(max-width: 760px)")` : mise en pause sous 760px (le champ CSS statique
  prend le relais) et reprise si la fenêtre repasse au-dessus (rotation, redimensionnement).
- **Volontairement inchangé** : `SeasonMap` (cadrage initial seulement — recalculer à
  la rotation serait plus perturbant qu'utile) et `CloudLayer` (densité de nuages fixée
  au montage, impact invisible).

## 8. Nettoyage

- `app/styles/weather.css` supprimé : ses deux règles ciblaient
  `.race-dossier-weather--pending`, une classe absente du markup (le composant utilise
  `.race-hud-weather--pending`, stylé dans `season.css`). Import retiré de
  `app/globals.css`.
- `ContentNav` mobile : les liens ne disparaissent plus sans remplacement — le header
  passe sur deux lignes (marque + bouton Administration, puis les liens en défilement
  horizontal) — `responsive.css`.

## 9. Vérifications

- `npm run lint` : OK.
- `npm test` : 14/14.
- `npm run build` : OK, viewport et theme-color confirmés dans le HTML généré.
- Grep de non-régression : aucune occurrence résiduelle des anciennes valeurs
  (`216,255,0`, `255,64,80`, `255,31,38`, `85,230,196`, `#55e6c4`) hors couleurs de
  bateaux (données).

## 10. Pour relire ou revenir en arrière

- Diff complet : `git diff`.
- Tout annuler : `git checkout -- . && git status` (le fichier `weather.css` supprimé
  est restauré par le checkout).
- Point d'attention pour la recette : à tester sur iPhone réel (safe-area, `100dvh`)
  et en paysage mobile — c'est là que ces changements se jugent.

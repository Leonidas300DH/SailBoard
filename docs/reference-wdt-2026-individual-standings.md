# Référence — classement individuel WDT 2026 France

## Source

Instantané fourni le 18 juillet 2026 :

![Classement individuel WDT 2026 France après quatre courses](./reference-wdt-2026-individual-standings.png)

Le visuel annonce 43 coureurs classés après quatre courses. Il affiche 42 lignes nominatives avec un score supérieur ou égal à un point.

## Intégration MVP

Les données sont conservées dans `data/wdt-2026-individual-standings.json`. Ce fichier constitue un instantané importé, pas un barème calculé par SailBoard :

- les rangs et les points visibles sont conservés tels qu’affichés ;
- les égalités ne sont pas recalculées ;
- le nombre officiel annoncé reste 43 ;
- l’interface indique que 42 scores nominatifs sont disponibles ;
- aucune affectation à un bateau ou participation par course n’est inventée ;
- le futur moteur de points pourra remplacer cet instantané sans modifier les composants de classement.

## Normalisation des noms

La ligne peu lisible du rang 10 a été normalisée en `GIRARDOT Simon`. La graphie `ELY Bastien` est également utilisée. Ces deux identités apparaissent dans les résultats Diam 24 du Spi Ouest-France 2026 publiés par la Société Nautique de La Trinité-sur-Mer :

- https://snt-voile.org/wp-content/uploads/2026/03/2026_spi-ouest-france-banque-populaire-grand-ouest_resultat_apres_course_13_apres_jury_DI24_288276.pdf

## Anomalies conservées

- le visuel annonce 43 classés mais ne nomme que 42 personnes ;
- aucun rang 8 n’est visible ;
- huit lignes sont marquées rang 28, puis le groupe suivant est marqué rang 35.

Ces incohérences sont documentées et non corrigées arbitrairement. Le fichier source reste la base MVP jusqu’à réception d’un export officiel structuré.

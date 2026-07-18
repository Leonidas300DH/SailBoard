# SailBoard — modèle de données pour le replay

## Objectif

Conserver une trajectoire d’évolution claire entre le replay illustratif de la V1 et un replay GPS fidèle. Le modèle doit permettre d’améliorer progressivement la précision sans invalider les courses historiques.

## Trois niveaux de replay

### Niveau 1 — simulation simple

Données nécessaires :

- parcours GeoJSON avec départ, marques, portes et arrivée ;
- heure de départ ;
- engagement de chaque bateau ;
- temps final, position finale, statut et pénalités ;
- couleur et équipage du bateau.

Le bateau progresse le long du parcours proportionnellement à son temps final. Les trajectoires et dépassements restent illustratifs. L’interface doit toujours l’indiquer explicitement.

### Niveau 2 — replay crédible sans GPS

Pour chaque bateau, enregistrer l’heure de passage à chaque marque :

| Bateau | Départ | Marque 1 | Porte 2 | Marque 3 | Arrivée |
|---|---:|---:|---:|---:|---:|
| Kaz a Barh | 13:00:00 | 13:22:14 | 13:48:31 | 14:17:02 | 14:51:18 |
| Ar Mor | 13:00:00 | 13:21:48 | 13:49:20 | 14:16:44 | 14:52:33 |

Ces données permettent de reconstituer :

- le classement à chaque marque ;
- les écarts réels ;
- les changements de position ;
- les abandons et pénalités au bon moment ;
- la vitesse moyenne sur chaque bord.

Entre deux marques, la position est interpolée. La géométrie exacte des virements reste simulée.

### Niveau 3 — replay GPS

Importer ou recevoir un point toutes les 2 à 10 secondes :

```text
race_entry_id
recorded_at UTC
latitude
longitude
speed_knots
heading_deg
accuracy_m
source
```

Ce niveau permet d’afficher les trajectoires, virements, croisements, dépassements, vitesses, caps, sillages et distances réellement parcourues.

Pour une course de deux heures avec six bateaux et un point toutes les cinq secondes, le volume est d’environ 8 600 points. PostgreSQL/Neon peut gérer ce volume sans difficulté particulière avec les bons index.

## Tables prévues

### `mark_passages`

```text
id
race_entry_id
course_mark_id
passed_at
rank_at_mark
source            manual | gps
validated_by
validated_at
created_at
```

Index : `(race_entry_id, passed_at)` et `(course_mark_id, passed_at)`.

### `track_points`

```text
id
race_entry_id
recorded_at
latitude
longitude
speed_knots
heading_deg
accuracy_m
source            gpx | csv | tracker | manual
created_at
```

Index principal : `(race_entry_id, recorded_at)`.

### `race_events`

```text
id
race_id
occurred_at
type              start | mark | overtake | penalty | retirement | finish
entry_id
related_entry_id
metadata_json
created_by
created_at
```

### `weather_snapshots`

```text
id
race_id
observed_at
latitude
longitude
wind_speed_knots
wind_direction_deg
gust_speed_knots
wave_height_m
wave_period_s
wave_direction_deg
current_speed_knots
current_direction_deg
sea_temperature_c
source
model
created_at
```

## Algorithme d’interpolation du niveau 2

Pour un instant `t` compris entre les passages aux marques `i` et `i + 1` :

```text
progression = (t - passage_i) / (passage_i+1 - passage_i)
position = interpolation_du_bord(parcours_i, progression)
```

Le classement est calculé à partir du nombre de marques franchies puis de la progression sur le bord courant. Les écarts doivent être exprimés en temps lorsque les passages sont connus et en distance estimée dans les autres cas.

## Recommandation V1.5

Commencer par `mark_passages` : cinq à dix horaires par bateau suffisent pour produire un replay crédible, sans acheter de matériel ni imposer une application GPS. Ajouter ensuite l’import GPX/CSV dans `track_points`. Les passages aux marques resteront les points de contrôle officiels du replay GPS.

## Règles d’intégrité

- Ne jamais présenter une interpolation comme une trace GPS réelle.
- Conserver la source et le niveau de précision de chaque donnée.
- Ne pas modifier silencieusement un replay publié : créer une nouvelle version ou tracer la correction dans l’audit.
- Synchroniser tous les horodatages en UTC et afficher l’heure locale de la course dans l’interface.
- Rejeter ou isoler les points GPS impossibles, hors parcours ou chronologiquement incohérents.


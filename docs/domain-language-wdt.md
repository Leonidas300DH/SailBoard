# Langage métier — World Diam Tour

Ce document fixe le vocabulaire à employer dans SailBoard. Il reprend les termes transmis par le client et sert de référence aux contenus, à l’administration et au modèle de données.

## Le circuit

Le World Diam Tour est le championnat de référence des trimarans monotypes Diam24od. La saison française comporte actuellement six **étapes**, organisées par des clubs nautiques différents.

Tous les équipages naviguent sur le même modèle de bateau, le **Diam24od**. La performance dépend donc essentiellement des navigateurs et non du matériel.

## Termes canoniques

| Terme | Sens dans SailBoard | À ne pas confondre avec |
|---|---|---|
| Saison | Édition annuelle du championnat | Une étape |
| Étape | Épreuve du circuit organisée sur environ trois jours | Une course ou une manche |
| Course / manche | Course disputée au sein d’une étape | Le classement final de l’étape |
| Parcours construit | Course de type « stadium racing » | Un raid ou parcours côtier |
| Bateau | Diam24od engagé sous le nom d’un équipage | Le modèle Diam24od, identique pour tous |
| Équipage | Identité engagée et ensemble des navigateurs associés à un bateau pour une étape | Le bateau lui-même |
| Navigateur | Personne composant un équipage et figurant au classement individuel | Le bateau ou l’équipage collectif |

## Classements

À l’issue des différentes manches d’une étape, un **classement final de l’étape** est établi. Ses résultats sont convertis en **points de championnat**.

Le championnat publie :

- le **classement général des équipages** ;
- le **classement individuel des navigateurs**.

Chaque navigateur marque des points selon le résultat obtenu avec son équipage lors de chaque étape. La composition d’un équipage peut varier d’une étape à l’autre.

## Correspondance avec le modèle technique

- `seasons` représente les saisons ;
- `events` représente les étapes ;
- `races` représente les courses ou manches disputées dans une étape ;
- `boats` représente les bateaux engagés sous le nom de leur équipage ;
- `participants` représente les navigateurs ;
- `stage_team_results` conserve les points de championnat des bateaux pour chaque étape ;
- `stage_crew_assignments` conserve la composition d’équipage propre à chaque étape ;
- `stage_individual_scores` conserve les points individuels des navigateurs pour chaque étape.

Le classeur 2026 fournit les points par étape, mais pas le détail de chaque manche ni toutes les positions finales d’étape. Ces informations restent donc absentes de la base tant qu’une source officielle ne les fournit pas.

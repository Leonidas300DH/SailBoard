# Langage métier — World Diam Tour

Ce document fixe le vocabulaire à employer dans SailBoard. Il reprend les termes transmis par le client et sert de référence aux contenus, à l’administration et au modèle de données.

## Le circuit

Le World Diam Tour est le championnat de référence des trimarans monotypes Diam24od. La saison française comporte actuellement six **étapes**, organisées par des clubs nautiques différents.

Toutes les équipes naviguent sur le même modèle de bateau, le **Diam24od**. La performance dépend donc essentiellement de l’équipage et non du matériel.

## Termes canoniques

| Terme | Sens dans SailBoard | À ne pas confondre avec |
|---|---|---|
| Saison | Édition annuelle du championnat | Une étape |
| Étape | Épreuve du circuit organisée sur environ trois jours | Une course ou une manche |
| Course / manche | Course disputée au sein d’une étape | Le classement final de l’étape |
| Parcours construit | Course de type « stadium racing » | Un raid ou parcours côtier |
| Équipe | Identité engagée dans le championnat, associée à un bateau | La composition ponctuelle de l’équipage |
| Bateau | Diam24od engagé sous le nom d’une équipe | Le modèle, identique pour toutes les équipes |
| Équipage | Ensemble des navigateurs d’une équipe pour une étape donnée | L’équipe sur toute la saison |
| Navigateur | Personne composant un équipage | Le bateau ou l’équipe |
| Coureur | Terme officiel utilisé dans le classement individuel | L’équipage collectif |

## Classements

À l’issue des différentes manches d’une étape, un **classement final de l’étape** est établi. Ses résultats sont convertis en **points de championnat**.

Le championnat publie :

- le **classement général des bateaux (équipes)** ;
- le **classement individuel des coureurs**.

Chaque navigateur marque des points selon le résultat obtenu avec son équipage lors de chaque étape. La composition d’un équipage peut donc varier d’une étape à l’autre.

## Correspondance avec le modèle technique

- `seasons` représente les saisons ;
- `events` représente les étapes ;
- `races` représente les courses ou manches disputées dans une étape ;
- `boats` représente les bateaux engagés sous le nom de leur équipe ;
- `participants` représente les navigateurs/coureurs ;
- `stage_team_results` conserve les points de championnat des bateaux pour chaque étape ;
- `stage_crew_assignments` conserve la composition d’équipage propre à chaque étape ;
- `stage_individual_scores` conserve les points individuels des coureurs pour chaque étape.

Le classeur 2026 fournit les points par étape, mais pas le détail de chaque manche ni toutes les positions finales d’étape. Ces informations restent donc absentes de la base tant qu’une source officielle ne les fournit pas.

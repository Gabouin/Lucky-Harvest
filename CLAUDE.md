# Lucky Harvest — Cozy Farm Spinner  (titre de travail)

## Projet
Jeu web pour la game jam "The Very Serious Juniper Dev" (thème : spin to win, deadline 26 juin 2026).
Spinner de synergies cozy-ferme : on remplit une grille de symboles de ferme, les adjacences
créent des combos, on gagne des pièces pour payer un quota croissant, on drafte de nouveaux
symboles entre les manches (roguelike). Inspiration mécanique : Luck Be a Landlord, thème ferme cozy.

## Stack
- Phaser 3 + TypeScript + Vite
- Cible : build web HTML5 (`vite build` → dist/), jouable dans le navigateur sur itch.io
- Assets : pack pixel "Cozy Valley" (16x16, CC BY 4.0) dans src/assets/

## Architecture — RÈGLE D'OR
Séparer strictement DONNÉES et LOGIQUE.
- Les symboles sont des données pures dans src/data/symbols.ts (id, nom, sprite, rareté, valeur, tags, effets déclaratifs).
- Le moteur de résolution (src/engine/) est générique : il lit les données et calcule. Il ne contient AUCUN symbole en dur.
- Ajouter un symbole = ajouter une entrée de données, jamais modifier le moteur.
- Le moteur est pur et testable sans rendu (aucune dépendance Phaser dans src/engine/).
- Le moteur renvoie une liste d'ÉVÉNEMENTS ordonnés (gain, destruction, production…) pour que le rendu les anime un par un.

## Structure des dossiers
- src/data/    → définitions des symboles, config (quotas, raretés)
- src/engine/  → moteur de résolution (pur, headless, testable)
- src/scenes/  → scènes Phaser (jeu, boutique, titre, game over)
- src/ui/      → affichage (grille, compteur, tooltips)
- src/assets/  → spritesheets Cozy Valley + audio
- tests/       → tests du moteur

## Boucle de jeu
Spin (placer des symboles de la réserve sur une grille 4x4) → résolution (gains + événements)
→ afficher les gains symbole par symbole → payer le quota → si OK : boutique (drafter 1 parmi 3
ou retirer un symbole) → le quota augmente → manche suivante. Game over si le quota n'est pas payé.

## Conventions
- TypeScript strict. Types explicites : Symbol, Effect, GridState, ResolutionResult.
- Commits Git fréquents, messages courts en français.
- Le jeu doit RESTER JOUABLE à la fin de chaque session. Ne jamais committer un build cassé.

## Contraintes jam
- Pas d'art ni d'audio génératif (IA). Assets et sons libres/licenciés, crédités dans la description itch.
- Tourne sur Windows, navigateur, clavier/souris uniquement.
- Aucun backend ni dépendance réseau pour jouer (tout tourne côté client).

## État d'avancement  (à mettre à jour à chaque session)
- [ ] Setup projet + rendu pixel + grille vide 4x4
- [ ] Moteur de résolution + 12 symboles starter (testé headless)
- [ ] Boucle jouable de bout en bout (MVP)
- [ ] Contenu (≈35 symboles, raretés, effets temporels, retrait en boutique)
- [ ] Juice + écrans (titre, game over)
- [ ] Audio + mini-tutoriel + équilibrage
- [ ] Build + page itch + soumission

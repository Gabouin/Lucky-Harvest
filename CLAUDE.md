# Lucky Harvest — Cozy Farm Spinner (titre de travail)

## Projet

Jeu web pour la game jam "The Very Serious Juniper Dev" (thème : spin to win, deadline 26 juin 2026).
Spinner de synergies cozy-ferme : on remplit une grille de symboles de ferme, les adjacences
créent des combos, on gagne des pièces pour payer un quota croissant, on drafte de nouveaux
symboles entre les manches (roguelike). Inspiration mécanique : Luck Be a Landlord, thème ferme cozy.

## Stack

- Phaser 3.88 + TypeScript strict + Vite 8
- Canvas 960×540, `image-rendering: pixelated`
- Cible : build web HTML5 (`vite build` → dist/), jouable dans le navigateur sur itch.io
- Assets : pack pixel "Cozy Valley Premium 1.3" + "CozyTowns v1" dans src/assets/
- Police : Silkscreen (Google Fonts)

## Architecture — RÈGLE D'OR

Séparer strictement DONNÉES et LOGIQUE.

- Les symboles sont des données pures dans src/data/symbols.ts (id, nom, sprite, rareté, valeur, tags, effets déclaratifs).
- Le moteur de résolution (src/engine/) est générique : il lit les données et calcule. Il ne contient AUCUN symbole en dur.
- Ajouter un symbole = ajouter une entrée de données, jamais modifier le moteur.
- Le moteur est pur et testable sans rendu (aucune dépendance Phaser dans src/engine/).
- Le moteur renvoie une liste d'ÉVÉNEMENTS ordonnés (gain, destruction, production…) pour que le rendu les anime un par un.

## Structure des dossiers

- src/data/ → définitions des symboles, config (quotas, raretés)
- src/engine/ → moteur de résolution (pur, headless, testable)
- src/scenes/ → TitleScene, GameScene, HowToPlayScene (+ GameOver à venir)
- src/ui/ → removeWhiteBackground.ts (BFS flood-fill depuis les bords)
- src/assets/ → spritesheets Cozy Valley + CozyTowns + ui/ (boutons dessinés à la main)
- tests/ → tests du moteur

## Boucle de jeu

Spin (placer des symboles de la réserve sur une grille 4x4) → résolution (gains + événements)
→ afficher les gains symbole par symbole → payer le quota → si OK : boutique (drafter 1 parmi 3
ou retirer un symbole) → le quota augmente → manche suivante. Game over si le quota n'est pas payé.

## Conventions

- TypeScript strict. Types explicites : GameSymbol, Effect, GridState, ResolutionResult.
- Commits Git fréquents, messages courts en français.
- Le jeu doit RESTER JOUABLE à la fin de chaque session. Ne jamais committer un build cassé.

## Contraintes jam

- Pas d'art ni d'audio génératif (IA). Assets et sons libres/licenciés, crédités dans la description itch.
- Tourne sur Windows, navigateur, clavier/souris uniquement.
- Aucun backend ni dépendance réseau pour jouer (tout tourne côté client).

## Système de coordonnées grille (GameScene)

- `CELL = 96`, `GRID_PX = GRID_SIZE * CELL` (384px), `GRID_IMG_PX = GRID_PX + 176` (560px)
- `gridContainer` positionné au **centre** de la grille (pivot correct pour le spin)
- `gridOriginX/Y` = `-GRID_PX/2 + offset` en LOCAL au container
- `GRID_IMG_DY = 22` : décale l'image de grille vers le bas sans bouger les cases
- `GRID_CELLS_DX = 12` : décale les cases vers la droite sans bouger l'image
- `flashCell` ajoute ses rects au container (coords locales)
- `emitCoinParticles` convertit en world via `gridContainer.x + gridOriginX + ...`
- `setCrop` Phaser 3 : l'origine est calculée sur le **frame complet**, pas sur le crop

## Assets UI

- Boutons dessinés à la main, fond blanc supprimé via `removeWhiteBackground()` (BFS flood-fill)
- Appelé dans `create()` de chaque scène avant tout rendu
- Clés : `btn-spin`, `btn-play`, `btn-buy`, `btn-htp`, `grid-full`, `grid-shop`, `btn-continue`

## Arbres (toutes les scènes)

- `setCrop(0, 0, 32, 48)` — coupe le bas du sprite (supprime le bout de tronc)
- `setScale(4).setOrigin(0.5, 1)`
- Positions calibrées avec `#debug` overlay (sliders X/Y + "Copy coords")
- Chênes : (151,331), (238,308), (295,366) — Cerises : (791,421), (870,439), (960,390)

## Debug overlay (#debug)

- TitleScene : sliders pour barn + tous les arbres (`BgRefs`)
- GameScene : sliders pour les arbres uniquement (`TreeRefs`)
- Accès : ajouter `#debug` à l'URL, bouton "Copy coords" pour exporter JSON

## État d'avancement (à mettre à jour à chaque session)

- [x] Setup projet + rendu pixel + grille vide 4x4
- [x] Moteur de résolution + 12 symboles starter (testé headless)
- [x] Boucle jouable de bout en bout (MVP + boutique + victoire)
- [x] TitleScene + HowToPlayScene avec décors complets
- [x] Spin de grille (container Phaser, pivot centré)
- [x] Assets UI dessinés à la main, fond blanc supprimé
- [x] Arbres avec troncs, positions calibrées
- [ ] Contenu (≈35 symboles, raretés, effets temporels, retrait en boutique)
- [ ] Écran Game Over
- [ ] Audio + équilibrage
- [ ] Build + page itch + soumission

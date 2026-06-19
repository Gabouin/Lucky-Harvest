import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // Sert src/assets/ à la racine : Phaser charge les sprites via XHR depuis ce dossier
  publicDir: 'src/assets',
  server: {
    port: 3000,
  },
});

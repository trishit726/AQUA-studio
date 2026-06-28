# public/

Static assets live here and are referenced with `staticFile("...")`.

Suggested layout:

- `public/fonts/` — local font files (if not using `@remotion/google-fonts`)
- `public/images/` — logos, backgrounds, textures
- `public/sfx/` — sound effects and music (trim leading silence first)

Example: `staticFile("images/logo.png")` resolves to `public/images/logo.png`.

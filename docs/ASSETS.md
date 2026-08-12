# Asset organization

Keep new public assets in the section that owns them. Existing Life filenames stay compatible; the checker enforces references without forcing a large migration.

| Content | Directory | Naming |
| --- | --- | --- |
| Profile and shared images | `public/images/` | descriptive lowercase names |
| Institution logos | `public/logos/` | short institution name |
| Publication figures | `public/publications/` | `<year>-<paper-id>.<ext>` |
| Baking photos | `public/life/baking/` | `<post-slug>-<number>.jpg`, square crop `<post-slug>-sq.jpg` |
| Craft photos | `public/life/craft/` | `<post-slug>-<number>.jpg`, square crop `<post-slug>-sq.jpg` |
| Life covers | `public/life/` | `<section>-editorial-cover.png` |
| Route data | `public/routes/` | `index.json` plus `<city-id>.json` |
| Project artifacts | `public/projects/<project-id>/` | preserve the project’s internal structure |

Before publishing, run `npm run check`. Missing references and invalid route/content data fail the check. Orphaned, duplicate, and unusually large assets are reported as warnings so they can be reviewed deliberately.


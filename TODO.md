[x] Handle gitignore

[ ] Collect arguments from the templates
[ ] Add clack/prompts
[ ] Add commander
[ ] Create a `bondi.config.json`

[ ] Add a shadcn template
[ ] Change package-json update to just a generic JSON update so that we can use it on the tsconfig

[ ] Handle post setup case (adding Tailwind to an existing app)
[ ] Handle overwrites only when applying to an existing build
[ ] Show visual diffs

# Questions?

Do we need to support symbolically named locations for file copies? ShadCN needs/does this because NextJS can be homed in `pages` or `app` or `src/pages` or `src/app` so they need relative positioning. Strictly speaking, Start doesn't need it, but if we want to be a superset of ShadCN, then we do.

Should we handle CSS stuff?

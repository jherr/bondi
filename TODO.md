- [ ] Allow the ability to select a template with clack

- [ ] Add commander

- [ ] Create a `bondi.config.json`
- [ ] Handle post setup case (adding Tailwind to an existing app)
- [ ] Handle overwrites only when applying to an existing build
- [ ] Show visual diffs

- [ ] Add a shadcn template
- [ ] Use a command action to install shadcn after the tailwind setup

# Questions?

Do we need to support symbolically named locations for file copies? ShadCN needs/does this because NextJS can be homed in `pages` or `app` or `src/pages` or `src/app` so they need relative positioning. Strictly speaking, Start doesn't need it, but if we want to be a superset of ShadCN, then we do.

Should we handle CSS stuff?

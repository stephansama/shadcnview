# shadcnview

Browse every [shadcn](https://ui.shadcn.com) registry in one table: React, Svelte and Vue. Search ~29k components, filter by framework, type, registry or zero dependencies (all kept in the url, so filtered views are shareable), see each one's type, description and dependencies, copy its add command, and open its docs page in a side pane.

Built with TanStack Start (static), TanStack Table, TanStack Virtual, TanStack Hotkeys and shadcn/ui.

## Supported registries

The list of registries lives in code in [`src/registries.ts`](src/registries.ts). Each entry says where the registry's index is, how to install from it, and how to find an item's docs page:

```ts
{
	description: "8-bit retro components",
	framework: "react",
	homepage: "https://www.8bitcn.com",
	index: "https://www.8bitcn.com/r/registry.json",
	name: "8bitcn",
	namespace: "@8bitcn",
	// blocks live under their index category, `docs/blocks/hero/hero3`
	page: (item) => ...,
},
```

<!-- registries:start -->

125 registries (118 react, 2 svelte, 2 vue, 2 react-native, 1 templ), all defined in [`src/registries.ts`](src/registries.ts).

| registry                                                                | framework    | description                                                                       | add                   |
| ----------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------- | --------------------- |
| [shadcn](https://ui.shadcn.com)                                         | react        | the original, radix primitives                                                    | built in              |
| [shadcn-svelte](https://shadcn-svelte.com)                              | svelte       | the svelte port of shadcn/ui                                                      | built in              |
| [shadcn-vue](https://www.shadcn-vue.com)                                | vue          | the vue port of shadcn/ui                                                         | built in              |
| [magic ui](https://magicui.design)                                      | react        | animated components and effects                                                   | `@magicui`            |
| [coss ui](https://coss.com/ui)                                          | react        | origin ui's successor, components and blocks                                      | `@coss`               |
| [aceternity](https://ui.aceternity.com)                                 | react        | motion heavy components and sections                                              | `@aceternity`         |
| [animate ui](https://animate-ui.com)                                    | react        | animated radix and base ui primitives                                             | `@animate-ui`         |
| [cult ui](https://www.cult-ui.com)                                      | react        | design engineer components                                                        | `@cult-ui`            |
| [motion primitives](https://motion-primitives.com)                      | react        | small motion building blocks                                                      | `@motion-primitives`  |
| [8bitcn](https://www.8bitcn.com)                                        | react        | 8-bit retro components                                                            | `@8bitcn`             |
| [eldora ui](https://eldoraui.site)                                      | react        | animated landing page components                                                  | `@eldoraui`           |
| [kokonut ui](https://kokonutui.com)                                     | react        | components and blocks for app ui                                                  | `@kokonutui`          |
| [more shadcn](https://more-shadcn.noair.fun)                            | svelte       | copy-paste components for svelte 5                                                | by url                |
| [jolly ui](https://jollyui.dev)                                         | react        | react aria components in the shadcn style                                         | by url                |
| [tetra ui](https://tetra-ui.com)                                        | react-native | react native components in the shadcn style                                       | `@tetra-ui`           |
| [react native reusables](https://reactnativereusables.com)              | react-native | the react native port of shadcn/ui                                                | built in              |
| [shadcn-templ](https://shadcn-templ.com)                                | templ        | the go and templ port of shadcn/ui                                                | built in              |
| [000h](https://cojeev.com/ui)                                           | react        | organic shapes and adjustable motion                                              | by url                |
| [1st pouf](https://1st-pouf.worksonmy.dev)                              | react        | claymorphism components and blocks                                                | `@1st-pouf`           |
| [21st dev agent elements](https://agent-elements.21st.dev)              | react        | registry of agent ui primitives                                                   | by url                |
| [7ovr](https://7ovr.com)                                                | react        | blocks and page templates on base ui                                              | `@7ovr`               |
| [8starlabs ui](https://ui.8starlabs.com)                                | react        | niche, high-utility components                                                    | `@8starlabs-ui`       |
| [agentcn](https://agentcn.vercel.app)                                   | react        | production-ready agents, made simple                                              | `@agentcn`            |
| [agents ui](https://livekit.io/ui)                                      | react        | livekit's voice and video agent components                                        | by url                |
| [aicanvas](https://aicanvas.me)                                         | react        | animated react and tailwind components and blocks                                 | `@aicanvas`           |
| [approvals ui](https://approvals-ui.vercel.app)                         | react        | approval workflows for react flow                                                 | `@approvals-ui`       |
| [arc ui](https://uiarc.dev)                                             | react        | components and blocks with motion built in                                        | `@uiarc`              |
| [audiocn](https://audiocn.dev)                                          | react        | audio components for react                                                        | `@audiocn`            |
| [aureform ui](https://aureformui.com)                                   | react        | dashboard components and saas blocks                                              | by url                |
| [babelize elements](https://elements.babelize.co)                       | react        | localization components                                                           | `@babelize`           |
| [beste ui](https://ui.beste.co)                                         | react        | blocks, pieces and components                                                     | `@beste-ui`           |
| [beui](https://beui.dev)                                                | react        | copy-paste animated components                                                    | `@beui`               |
| [billingsdk](https://billingsdk.com)                                    | react        | billing and subscription components                                               | `@billingsdk`         |
| [blode ui](https://blode.co/ui)                                         | react        | registry of accessible react components                                           | `@blode`              |
| [bundui](https://bundui.io)                                             | react        | collection of reusable animated components                                        | `@bundui`             |
| [chanhdai components](https://chanhdai.com/components)                  | react        | collection of reusable components                                                 | `@ncdai`              |
| [chewypixel](https://chewypixel.io/components)                          | react        | animated components for shadcn/ui                                                 | `@chewypixel`         |
| [clerk elements](https://clerk.com/docs/elements/examples/shadcn-ui)    | react        | auth components on clerk's apis                                                   | `@clerk`              |
| [colorshot](https://orshot.com/open-source/colorshot)                   | react        | color and gradient picker                                                         | `@colorshot`          |
| [crafterui](https://crafterui.com)                                      | react        | motion and interaction components for react and tailwind                          | `@crafterui`          |
| [creance](https://creance.pages.dev)                                    | react        | components for supervising ai agents                                              | `@creance`            |
| [date time range picker](https://date-time-range-picker.vercel.app)     | react        | date-time range picker with timezones and presets                                 | by url                |
| [datetime picker](https://shadcn-datetime-picker-xi.vercel.app)         | react        | datetime picker with timezone support                                             | by url                |
| [diarmuradi](https://www.diarmuradi.com)                                | react        | ui blocks and templates                                                           | `@diarmuradi`         |
| [dominik ui](https://dominikkoch.dev/ui)                                | react        | opinionated components and tools for building modern websites and ai interfaces   | `@dominik-ui`         |
| [dotmatrix](https://dotmatrix.zzzzshawn.cloud)                          | react        | dot matrix loaders                                                                | `@dotmatrix`          |
| [eased](https://eased.dev)                                              | react        | motion-first react components and page blocks for shadcn                          | `@eased`              |
| [efferd](http://efferd.com)                                             | react        | ready-to-use shadcn blocks that just work                                         | `@efferd`             |
| [facade ui](https://facadeui.dev)                                       | react        | registry of accessible sections and page templates for marketing websites         | `@facade`             |
| [flightcn](https://flightcn.yencheng.dev)                               | react        | flight route visualizations for mapcn                                             | `@flightcn`           |
| [fluid functionalism](https://fluid-functionalism.vercel.app)           | react        | spring physics components                                                         | by url                |
| [glassy ui](https://glassyui.com)                                       | react        | glass components                                                                  | `@glassyui`           |
| [goey toast](https://goey-toast.vercel.app)                             | react        | morphing toast notifications for react                                            | by url                |
| [hextaui](https://hextaui.com)                                          | react        | react components, hooks and ai blocks for shadcn/ui on base ui                    | `@hextaui`            |
| [illos](https://illos.dev)                                              | react        | animated svg illustrations                                                        | by url                |
| [interlace ui](https://ds.interlace.tools)                              | react        | design system for docs sites                                                      | by url                |
| [kanban board](https://shadcn-kanban-board.com)                         | react        | kanban board                                                                      | by url                |
| [kibo ui](https://www.kibo-ui.com/overview)                             | react        | comprehensive components for complex apps                                         | `@kibo-ui`            |
| [launch ui](https://www.launchuicomponents.com)                         | react        | landing page components with react, shadcn/ui and tailwind                        | `@launchui`           |
| [liquikit](https://liquikit.dev)                                        | react        | liquid glass components                                                           | `@liquikit`           |
| [loading ui](https://loading-ui.com)                                    | react        | spinners, loaders and loading states                                              | `@loading-ui`         |
| [localmode](https://localmode.ai)                                       | react        | local-first ai ui primitives and blocks                                           | `@localmode`          |
| [manifest ui](https://ui.manifest.build)                                | react        | components for chatgpt and mcp apps                                               | `@manifest`           |
| [microkit](https://microkit.co)                                         | react        | copy-paste microinteractions                                                      | `@microkit`           |
| [mischief ui](https://ui.tinkererslabs.com)                             | react        | document viewers, agent chat and playful utilities                                | `@mischief`           |
| [mizzle](https://mizzle.saddy.me)                                       | react        | animated react components                                                         | `@mizzle`             |
| [motion lexicon](https://motion-lexicon.pages.dev/en)                   | react        | animated components, blocks and motion primitives                                 | `@motion-lexicon`     |
| [movin design](https://movin.design/components)                         | react        | animated ui components                                                            | `@movin`              |
| [mynaui](https://mynaui.com)                                            | react        | ui kit for react                                                                  | by url                |
| [nexus ui](https://nexus-ui.dev)                                        | react        | component library of composable, copy-paste primitives for building ai interfaces | `@nexus-ui`           |
| [niko table](https://niko-table.com)                                    | react        | composable data table for shadcn/ui                                               | `@niko-table`         |
| [ns ui](https://design.helpmarq.com)                                    | react        | single-interaction components                                                     | `@ns-ui`              |
| [nxui](https://nxui.geoql.in/docs)                                      | vue          | animated vue 3 components for shadcn-vue projects                                 | by url                |
| [paceui](https://paceui.com)                                            | react        | blocks, motion components and templates                                           | `@paceui`             |
| [pastaui](https://pastaui.com)                                          | react        | ai and agent interface components                                                 | `@pastaui`            |
| [payload components](https://www.payload-components.xyz)                | react        | payload cms blocks                                                                | `@payload-components` |
| [pie menu](https://piemenu.jpmarqu.es)                                  | react        | radial pie menu component for shadcn/ui                                           | `@jpmarques`          |
| [planes](https://useplanes.com)                                         | react        | registry of animated react components                                             | by url                |
| [plate](https://platejs.org/docs/multi-select)                          | react        | rich multi-select editor                                                          | `@plate`              |
| [reui](https://reui.io)                                                 | react        | collection of ui components and animated effects                                  | `@reui`               |
| [reactframe](https://reactframe.com)                                    | react        | animated react components, blocks and page sections                               | `@reactframe`         |
| [remocn](https://www.remocn.dev)                                        | react        | remotion components for product videos                                            | `@remocn`             |
| [retroui](https://retroui.dev)                                          | react        | neo brutalism components                                                          | `@retroui`            |
| [shadcnblocks](https://www.shadcnblocks.com)                            | react        | huge library of blocks and component variants                                     | `@shadcnblocks`       |
| [shadcn chatbot kit](https://shadcn-chatbot-kit.vercel.app)             | react        | customizable chatbot components                                                   | by url                |
| [shadcn date picker](https://date-picker.luca-felix.com)                | react        | advanced date picker with various features                                        | by url                |
| [shadcn examples](https://shadcnexamples.com)                           | react        | dozens of advanced shadcn/ui examples                                             | by url                |
| [shadcn google maps](https://shadcn-google-maps.vercel.app)             | react        | google places address autocomplete                                                | by url                |
| [shadcn hooks](https://shadcn-hooks.com)                                | react        | comprehensive react hooks collection                                              | `@shadcnhooks`        |
| [shadcn map](https://shadcn-map.vercel.app)                             | react        | map component built for shadcn/ui using leaflet and react leaflet                 | `@shadcn-map`         |
| [shadcn rjsf form builder](https://shadcn-rjsf-form-builder.noowah.dev) | react        | json schema forms and a visual form builder                                       | by url                |
| [shadcn store](https://shadcnstore.com)                                 | react        | components, blocks and templates on base ui                                       | `@shadcnstore`        |
| [shadcn tanstack form](https://shadcn-tanstack-form.felipestanzani.com) | react        | seamless shadcn tanstack form component set                                       | by url                |
| [shadcn ui blocks](https://shadcn-ui-blocks.vercel.app)                 | react        | collection of responsive ui blocks                                                | by url                |
| [shadcncraft](https://shadcncraft.com/components?filter=free)           | react        | production-ready design system                                                    | `@shadcncraft`        |
| [signoff ui](https://signoff-ui.vercel.app)                             | react        | agent change review and approvals                                                 | by url                |
| [simple ai](https://simple-ai.dev)                                      | react        | components and blocks to easily build ai apps                                     | `@simple-ai`          |
| [skrewww](https://skrewww.com)                                          | react        | token-driven design system                                                        | `@skrewww`            |
| [smoothui](https://smoothui.dev)                                        | react        | customizable animated ui blocks                                                   | `@smoothui`           |
| [snapcn](https://snapcn.dev)                                            | react        | remotion video components that look like software                                 | `@snapcn`             |
| [soldevelo](https://registry.soldevelo.com)                             | react        | components and page templates from openlmis                                       | `@soldevelo`          |
| [sora ui](https://ui.soralabs.studio)                                   | react        | motion-first react component registry on the shadcn model                         | `@soralabs`           |
| [suiss ui](https://suiss.app/ui)                                        | react        | components, patterns and charts in nine styles                                    | `@esuiss`             |
| [sureui](https://sureui.com)                                            | react        | shadcn registry of confirmation components                                        | `@sureui`             |
| [tailark](https://tailark.com)                                          | react        | shadcn blocks for building modern marketing websites                              | `@tailark`            |
| [termcn](https://termcn.vercel.app)                                     | react        | beautiful terminal uis, made simple                                               | `@termcn`             |
| [tour](https://onboarding-tour.vercel.app)                              | react        | component for building onboarding tours                                           | `@tour`               |
| [trophy ui](https://ui.trophy.so)                                       | react        | gamification components                                                           | `@trophy-ui`          |
| [uai](https://uaiblocks.dev)                                            | react        | compound components and blocks with motion                                        | `@uai`                |
| [ui beats](https://uibeats.com)                                         | react        | animated react components                                                         | by url                |
| [flexnative ui](https://ui.flexnative.com)                              | react        | collection of customizable ui blocks with interactive live previews               | `@flx`                |
| [ui layouts](https://www.ui-layouts.com)                                | react        | layouts, components and effects                                                   | `@ui-layouts`         |
| [upfork](https://upfork.dev)                                            | react        | animated components and landing pages                                             | `@upfork`             |
| [uploadcn](https://uploadcn.dev)                                        | react        | file upload components and blocks                                                 | `@uploadcn`           |
| [uselayouts](https://uselayouts.com)                                    | react        | premium animated react components and micro-interactions                          | `@uselayouts`         |
| [usva](https://usva.build)                                              | react        | base ui components in three themes                                                | `@usva`               |
| [vengence ui](https://www.vengenceui.com)                               | react        | animated landing page components                                                  | by url                |
| [wa ui](https://ui.meta-cloud-api.site)                                 | react        | registry of whatsapp web chat components                                          | `@wa-ui`              |
| [warcraftcn](https://www.warcraftcn.com)                                | react        | set of components inspired by classic warcraft iii rts ui aesthetics              | by url                |
| [warren ui](https://warren.eduard3v.com)                                | react        | data-dense ops dashboard components                                               | by url                |
| [watermelon ui](https://ui.watermelon.sh)                               | react        | components, blocks and dashboards                                                 | `@watermelon`         |
| [wds registry](https://wds-shadcn-registry.netlify.app)                 | react        | collection of components that you can use to build your own component library     | `@wds`                |
| [we.inc components](https://we.inc/components)                          | react        | components and page sections in 35 categories                                     | by url                |
| [wensity](https://ui.wensity.com)                                       | react        | primitives, components and motion                                                 | `@wensity`            |
| [wick charts](https://wick-charts.eeff.io/integrations/shadcn)          | react        | realtime canvas charts                                                            | `@wick-charts`        |

<!-- registries:end -->

Most entries come from [awesome-shadcn-ui](https://github.com/birobirobiro/awesome-shadcn-ui).

### Not included

- **[Starwind UI](https://starwind.dev)**: it isn't a shadcn registry. It ships its own `starwind` CLI and registry schema.
- **Icon, logo and illustration sets** (keyline-icons, logoforge, undraw-cn, pqoqubbw, heroicons-animated, hugeicons-animated, and animate ui's icons): thousands of items each, which would swamp the table.
- **Ports without a registry index**: most [ports](https://github.com/birobirobiro/awesome-shadcn-ui#ports) copy shadcn's design but ship as packages or their own generators, with nothing for a viewer to read: spartan (angular), shadcn-solid, nativecn-ui, flutter shadcn-ui, forui, swiftcn-ui, shadcn-kotlin, shadcn-rails, salad_ui, shad-ui, ouroboros-ui, mkdocs-shadcn, basecoat, franken-ui and blazor simple-ui. The ports that do serve one (shadcn-svelte, shadcn-vue, jolly ui, tetra ui, shadcn-templ) are included, and so is react native reusables, which serves item json without an index (its index is built from the docs nav, see `discover`).

## Adding a registry

1. Add an object to `registries` in `src/registries.ts`:
   - `index`: the registry's `registry.json` or `index.json`.
   - `framework`: `react`, `svelte` or `vue`.
   - `namespace`: only if it's listed in the [official directory](https://ui.shadcn.com/r/registries.json). Without one, the add command uses the item's json url.
   - `page`: the docs page for an item, as a function of the item, for example `pageAt("https://example.com/components/{name}")`. Leave it out and `pnpm snapshot` looks for each item's page in the site's sitemap and docs navigation (`scripts/crawl-pages.ts`), falling back to the homepage. Only write one when the site follows a pattern the crawl can't find.
   - `embed: false`: if the site sends `X-Frame-Options` / `frame-ancestors`, so the pane offers a new tab instead.
   - `item`: only if an item's json isn't next to the index (jolly ui serves `r/styles/default/<name>.json`), so url installs point at the right file.
   - `discover`: only if the registry serves item json but no index. It returns the item names (`componentsInNav` reads them from a docs page) and the snapshot fetches each item, with `index` as the base url they resolve against.
   - `cli`: only if the registry installs through its own cli, e.g. `npx @react-native-reusables/cli@latest add`.
2. Run `pnpm snapshot --force && pnpm check-pages <name>`. This samples items and reports 404 pages, framing headers and missing item json.
3. Run `pnpm readme` to update the table above.

## Development

```sh
pnpm install
pnpm dev          # fetches the snapshot if there isn't one yet
pnpm snapshot     # fetch every registry index into public/data/registries.json, skipped when it exists
pnpm snapshot --force  # refetch it anyway
pnpm og          # render the open graph card into public/og.png (takumi)
pnpm check-pages  # check docs page urls, framing and item json
pnpm build        # fresh snapshot + static prerender into dist/client, deploy that folder
pnpm lint         # @stephansama/eslint-config
pnpm format       # prettier
```

The data is a build-time snapshot, because most registries don't send CORS headers. Rebuild or redeploy to refresh it.

The open graph card (`public/og.png`) is rendered from that snapshot by `scripts/og.tsx` with [takumi](https://takumi.kane.tw), so its counts match the site. Set `VITE_SITE_URL` to the deployed origin when building so `og:image` is an absolute url, which social cards need.

### Keys

| key     | action                           |
| ------- | -------------------------------- |
| `/`     | focus the filter                 |
| `j` `k` | move down / up                   |
| `enter` | open the row (or toggle a group) |
| `y`     | copy the add command             |
| `o`     | open the docs page in a tab      |
| `z`     | collapse / expand every group    |
| `esc`   | close the pane                   |

## License

[MIT](LICENSE) © Stephan Randle

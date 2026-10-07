# nature-remo-cli

An unofficial CLI and TypeScript client for the [Nature Remo API](https://developer.nature.global/).

## Installation

Requires Node.js 24.11.0 or newer. macOS and Linux are supported; Windows is not tested. mise, Bun, and Vite+ are development tools and are not required to use the npm package.

```sh
npm install --global nature-remo-cli
nature-remo --version
nature-remo --help
```

For the TypeScript client, install it in your application instead:

```sh
npm install nature-remo-cli
```

The client uses ESM imports. The CLI supports appliance discovery, air conditioners, learned infrared signals, TVs, lights, Remo names and sensor offsets, Homes, and the authenticated User. Other API operations are outside the supported command surface; [API coverage](openapi/coverage.json) records their status.

## Authentication

Create an access token at [home.nature.global](https://home.nature.global/), then enter it into the masked prompt to store it in the macOS Keychain:

```sh
nature-remo auth login
```

The environment takes precedence over Keychain, which keeps CI, non-interactive use, and one-off overrides explicit. Linux requires `NATURE_REMO_ACCESS_TOKEN`; `auth login` and `auth logout` manage macOS Keychain only. Do not pass access tokens as command arguments or store them in the repository. Keychain synchronization through iCloud is not enabled.

Inspect or remove the stored credential without printing it:

```sh
nature-remo auth status
nature-remo auth logout
```

## Usage

List appliances as a human-readable table:

```sh
nature-remo appliance list
```

Use JSON for scripts and coding agents:

```sh
nature-remo appliance list --format json
```

Inspect and configure Nature Remo controllers:

```sh
nature-remo remo list
nature-remo remo appliances
nature-remo remo rename --name "Living room Remo"
nature-remo remo set-temperature-offset --offset -0.5
nature-remo remo set-humidity-offset --offset 2
```

Remo reads require `basic.read`; rename and sensor-offset commands require `basic.read` and `basic.write` because `--remo` resolves an ID or name. TypeScript callers that already know the Remo ID can pass `{ id }` to write with `basic.write` alone.

Inspect or control an air conditioner. The appliance selector is optional when only one air conditioner is configured:

```sh
nature-remo aircon list
nature-remo aircon set --temperature 26.5 --mode cool
nature-remo aircon set --appliance "Living room" --volume auto --direction swing
nature-remo aircon off
```

Air conditioner reads report the latest settings recorded by Nature Remo. Successful control JSON includes `accepted: true`, `confirmed: false`, and the API's returned Appliance under `appliance`; infrared transmission does not provide confirmation from the air conditioner itself.

List and send learned infrared signals. Appliance and signal names use case-insensitive exact matching:

```sh
nature-remo signal list --appliance "Living room"
nature-remo signal send --appliance "Living room" --signal-name "Power"
nature-remo signal send --signal-id "signal-id"
```

A successful send means Nature Remo accepted the control request; the infrared appliance does not acknowledge it. JSON output includes `accepted`, `confirmed`, `signal_id`, and the resolved `signal_name` when available.
The [Cloud API rate limit](https://developer.nature.global/en/#rate-limits) is 30 requests per five minutes per account. The CLI reports excess requests as `RATE_LIMITED`.

Discover the buttons advertised by configured TVs and lights, then press one by its case-insensitive exact name:

```sh
nature-remo tv list
nature-remo tv press --appliance "Living room TV" --button power
nature-remo light list
nature-remo light press --button on
```

TV and light discovery and control require `basic.read` and `sendir` access. Control JSON includes `accepted`, `confirmed`, and `recorded_state`; the state is Nature Remo's record after the request, not acknowledgement from the physical appliance.

Inspect Homes, their Remos and Members, and the authenticated User:

```sh
nature-remo home list
nature-remo home remos --home "Home"
nature-remo home members --home "Home"
nature-remo user show
```

Home and authenticated-User reads require `basic.read` access.

Use the API from TypeScript:

```ts
import { createNatureRemo } from "nature-remo-cli";

const accessToken = process.env.NATURE_REMO_ACCESS_TOKEN;
if (!accessToken) throw new Error("NATURE_REMO_ACCESS_TOKEN is not set");

const remo = createNatureRemo({ accessToken });
const appliances = await remo.appliances.list();
await remo.aircons.set({ target: "Living room", temperature: "26.5", mode: "cool" });
```

## Output and failures

Data commands accept `--format table` (default) or `--format json`. Successful results go to stdout; errors go to stderr. Authentication commands return text. Use `--help` on each command to discover its arguments.

```sh
nature-remo appliance list --format json >appliances.json
```

JSON errors have this shape:

```json
{
  "error": {
    "code": "AUTH_REQUIRED",
    "exitCode": 2,
    "message": "No Nature Remo access token is configured.",
    "hint": "Set NATURE_REMO_ACCESS_TOKEN. On macOS, run nature-remo auth login to save it to Keychain."
  }
}
```

| Exit code | Meaning                                                           |
| --------- | ----------------------------------------------------------------- |
| 0         | Successful command, help, or cancelled interactive login          |
| 1         | API, response validation, credential store, or unexpected failure |
| 2         | Invalid arguments, missing authentication, or rejected token      |
| 3         | Insufficient token permissions                                    |
| 4         | API rate limit exceeded                                           |

Each API request has a 30-second timeout, including reading its response body. Requests are not automatically retried. A failed control request may already have affected the appliance, even if its response was lost or invalid. Inspect the appliance before repeating an operation, especially a toggle button. The API's recorded state does not confirm an infrared appliance's physical state.

The TypeScript client throws `NatureRemoError` with a `code` and an optional HTTP `status`. CLI exit codes and hints are separate from this client error contract. During 0.x, minor releases may change commands or client types; pin the version when depending on their exact shape.

## Agent skill

The [nature-remo-cli skill](skills/nature-remo-cli/SKILL.md) guides command discovery, authentication, target selection, and interpretation of control results. Install it for Codex with GitHub CLI's `gh skill` command:

```sh
gh skill install Hiro5409/nature-remo-cli nature-remo-cli --agent codex --scope user
```

Use `--agent claude-code` for Claude Code. The npm package also includes the skill under `skills/nature-remo-cli`.

## Development

Install and [activate mise](https://mise.jdx.dev/getting-started.html). `mise.toml` pins Node.js, Bun, Gitleaks, and Lefthook and exposes the locally installed Vite+ commands. Keep its Bun version aligned with the Vite+ package-manager declaration in `package.json`:

```sh
mise trust
mise install
bun install --frozen-lockfile
lefthook install
vp pack
bun link
```

[Lefthook](https://lefthook.dev/) runs the Git hooks defined in `lefthook.yml`. The pre-commit hook formats and checks staged files, then scans them for secrets with Gitleaks. The pre-push hook runs `bun audit --audit-level=high`, the same audit that the CI runs. CI uses the same Gitleaks version to scan Git history.

## API schema

The generated client and the MSW request handlers used by the tests are reproducible from the committed OpenAPI snapshot:

```sh
vp run generate-types
```

Every operation in the snapshot is classified as implemented, planned, or intentionally excluded:

```sh
vp run check:api-coverage
```

Check whether Nature's published schema changed, then explicitly update the snapshot:

```sh
vp run api-schema:check
vp run api-schema:update
vp run generate-types
```

## Quality checks

```sh
vp run check
```

The CI installs a packed artifact into clean macOS and Linux consumers on Node 24.11.0 and the latest Node 24 and Node 26 releases. Package checks exercise the CLI, JSON errors, client imports and requests, and an isolated macOS Keychain credential. They do not contact Nature Remo or control physical appliances.

To check a local artifact:

```sh
package_dir=$(mktemp -d)
bun pm pack --destination "$package_dir"
node scripts/check-package.ts "$package_dir"/nature-remo-cli-*.tgz
```

## Dependency updates

Dependabot proposes one grouped pull request a week for the Bun dependencies and one for the GitHub Actions, each limited to versions released at least seven days earlier. A maintainer reviews and merges them. Its Bun updater reads `bun.lock` lockfile version 1, so update the lockfile in place instead of regenerating it.

Dependency Review needs the repository's [dependency graph](https://docs.github.com/en/code-security/reference/supply-chain-security/dependency-graph-supported-package-ecosystems) to be enabled. It checks pull requests for vulnerable direct dependencies declared in `package.json` and for changed GitHub Actions. The dependency graph does not read `bun.lock`, so `bun audit` in the CI is the check that covers the locked dependency tree.

GitHub Actions pinned to commit SHAs can receive Dependabot version-update PRs, but not vulnerability alerts.

## Releases

A maintainer releases from `main`: commit the new `version` in `package.json`, push the commit to `main`, then push the annotated tag for that version:

```sh
git tag -a v1.2.3
git push origin v1.2.3
```

`git tag -a` opens an editor for the tag message; list there, as Markdown bullets, the changes a user will notice. The message becomes the GitHub Release notes.

The tag starts the Release workflow. The workflow verifies that the tag is annotated, matches `package.json`, and belongs to `main`, then runs the CI on the tagged commit. The CI packs the npm artifact once, and both publishing jobs download that tested artifact instead of building it again.

The first job publishes the artifact to npm through trusted publishing, with provenance. npm [scans a new version](https://github.blog/changelog/2026-07-28-npm-publish-time-malware-scanning-and-dual-use-metadata/) before serving it, so the job waits up to 30 minutes for the version to become visible. The second job creates the GitHub Release only when the version published on npm has the integrity of the tested artifact. It attaches the artifact while the release is still a draft and then publishes it, because an immutable release locks its assets once it is published.

Before publishing, configure three settings outside the repository:

- A GitHub environment `npm` whose deployment policy allows only `v*` tags.
- An npm [trusted publisher](https://docs.npmjs.com/trusted-publishers/) for user `Hiro5409`, repository `nature-remo-cli`, workflow filename `release.yml`, and environment `npm`, with `npm publish` allowed and `npm dist-tag` left unchecked.
- [Immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases) for the repository, so that the tag and the attached artifact of a published GitHub Release cannot change.

To retry a failed run, run the workflow again from its tag:

```sh
gh workflow run release.yml --ref v1.2.3
```

This run builds and tests the tagged commit again; the build is reproducible, so it tests the artifact an earlier run published. Every run acts on what it finds: it publishes the artifact while the version is not visible on npm, and creates the GitHub Release while no published release exists for the tag. A published release that carries the tested artifact is complete, and the run leaves it as it is.

A run stops when it cannot read npm or GitHub, when the published version differs from the tested artifact, and when a published release lacks the tested artifact or carries one with a different digest. The workflow does not repair such a release.

A run fails when npm does not serve the version within 30 minutes. Run the workflow again once the version is visible on npm; a run that starts earlier attempts to publish the version again.

GitHub CLI attempts to delete its draft when attaching the artifact or publishing the release fails. A failed cleanup or an interrupted run can leave a draft release behind; the workflow does not look for drafts, so a maintainer deletes it.

## License

[MIT](LICENSE). This project is not affiliated with Nature Inc.

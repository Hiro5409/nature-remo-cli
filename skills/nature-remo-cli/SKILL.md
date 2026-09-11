---
name: nature-remo-cli
description: Use when inspecting or controlling Nature Remo appliances through the nature-remo CLI, including air conditioners, TVs, lights, learned infrared signals, and Remo configuration.
license: MIT
metadata:
  source: https://github.com/Hiro5409/nature-remo-cli
---

# nature-remo-cli

Probe with `command -v nature-remo && nature-remo --version`.
If unavailable, install with `npm install --global nature-remo-cli`.

1. Use `nature-remo --help` as the supported command surface, rather than inferring CLI coverage from the upstream API or generated client.
   Read the selected command's `--help` before constructing unfamiliar arguments.
2. Before API operations, check `nature-remo auth status` for the configured credential source; it does not validate the token with the API.
   For a missing token, supply `NATURE_REMO_ACCESS_TOKEN` through the execution environment or use `nature-remo auth login` on macOS.
   Its masked prompt requires both stdin and stdout to be TTYs. If this session cannot provide a TTY, ask the user to run it in their own terminal.
   The environment overrides Keychain. Keep tokens out of command arguments, logs, and repository files.
3. Use `--format json` for data commands. Authentication commands return text; structured errors go to stderr.
4. Resolve the intended appliance, Remo, or Home using known IDs or read commands. Reuse resolved IDs for controls; ask when the target is ambiguous.
   Discover learned signal names and TV/light buttons from their list commands. A known `--signal-id` can be sent directly without read access.
5. Execute the requested controls only. `aircon set` also turns the air conditioner on; it is not a way to change an idle device's settings without powering it on.

Complete a read when the command succeeds and returns parseable JSON.
For Remo configuration writes, check the returned configuration against the requested values.
For infrared controls, report `accepted: true` as request acceptance. `confirmed: false` means the physical appliance has not acknowledged the operation; an API readback only shows recorded state.

Inspect a structured error's `hint` before deciding the next step. A failed or timed-out control may already have taken effect. Establish the appliance's actual state before resending, especially for power toggles; ask the user to check when that state cannot be observed.

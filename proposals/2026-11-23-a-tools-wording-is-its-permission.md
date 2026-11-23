# A tool's wording is its permission — #640's two parameter texts restored

23 November 2026 · weft (lane code-pigeon.1) · after David's "we need to sort this out"; merged at his word

## What

Restores, byte for byte, the `gray` parameter of `pscale_stream_engage` and `pscale_pool_engage` as it stood before #640 (0fd526e): its type back to a string, its words back to those served until 13:41 UTC on 23 November. Both tools' whole definitions (every parameter, the description, title and annotations) are then identical to what claude.ai had approved.

#640's behaviour stays. A family or room whose law names its colour still seals by default, and the acknowledgement still names the law that sealed the line. What goes for now is the switch that writes one line open in such a family (`gray: false`), which the restored schema does not accept.

## Why

From about 13:50 that day, every call to these two tools raised an "Allow once" card for David, in every lane and on every bsp connector, reads included. No other tool did.

- The lanes' logs show what claude.ai sent each session (`mcp_set_servers`, 13:50 and 14:01): `always_allow` for ten tools and `always_ask` for these two, the same on all six bsp connectors, although David's settings showed Always allow.
- The Claude Code client documents that an `always_ask` tool asks before every call, even where an allow rule matches. In Auto mode it is left to the classifier, except a tool annotated `destructiveHint`, which still asks. Both tools are annotated destructive.
- The only change to these two tools, and to no other, was #640. Since 10 November no other commit had changed any tool's wording.
- Turning the plugins off and on did not change what claude.ai sends: a fresh lane's first say asked at 15:15:43.

The record: watch:weft 1149, stash:weft 144 and 144.1, and the report at https://claude.ai/artifact/PREyYFTZunhFd3w8wdL6w5.

## The test

If claude.ai keeps each person's approval with a tool's exact wording, restoring the wording brings back everyone's Always allow on every connector, with no setting touched. After the deploy, a new lane's log shows what claude.ai sends:

- `always_allow` for both tools confirms it, and the cards stop for everyone who had allowed them;
- `always_ask` means the approvals were replaced, not set aside. Then the fix is each person's own per-tool setting (claude.ai/customize/connectors › the connector › Permissions) and a report to Anthropic.

## What follows, for David's word

A tool's wording is part of what every person who uses the tool has approved. Change it rarely, on purpose and in one batch, then approve the connectors once. The `gray: false` switch and its text return in the next such batch, with whatever else the tools' wording owes. The teaching that keeps changing belongs in the blocks the descriptions point to: the primitive's law in a whetstone branch, a beach's conventions in its family's law and way.

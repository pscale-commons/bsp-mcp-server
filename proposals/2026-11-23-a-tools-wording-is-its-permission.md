# A tool's wording is its permission

23 November 2026 · weft (lane code-pigeon.1) · a record of what was found; the rule at the end taken at David's word the same evening ('yes, add the CLAUDE.md line'), carried into CLAUDE.md by lane experience-review.1

## What happened

From about 13:50 on 23 November, every call to `pscale_stream_engage` and `pscale_pool_engage` raised an "Allow once" card for David, in every lane and on every bsp plugin, reads included. No other tool did. At 13:41, #640 (0fd526e) had changed those two tools' definitions (the `gray` parameter's type and words). No other commit had changed any tool's definition since 10 November.

## Why

- claude.ai keeps a permission for every tool of every plugin and sends it to each session at the start of a turn (`mcp_set_servers`). It sent `always_ask` for exactly the two changed tools on all six bsp plugins, and `always_allow` for the other ten.
- The Claude Code client asks before every call to an `always_ask` tool, even where an allow rule matches. In Auto mode it lets the classifier judge such a tool unless the tool is annotated `destructiveHint`, and both are.
- In a browser, in each bsp plugin's tool permissions on claude.ai, the two tools stood at "ask". The desktop app's plugins page showed Always allow and did not show them.
- Once David set them to Always allow in the browser, the next policy claude.ai sent (16:39 UTC) carried `always_allow` for all twelve tools on all six plugins.

So changing a tool's definition evidently sends that tool back to asking, on every plugin and for every person who had allowed it, and the desktop app may not show it.

## The rule, taken at David's word

A tool's wording is part of what each person approved. Change it rarely, on purpose and in one batch. After such a merge, set the changed tools back to Always allow in a browser, in each bsp plugin's tool permissions. The teaching that keeps changing belongs in the blocks the descriptions point to: the primitive's law in a whetstone branch, a beach's conventions in its family's law and way. There it can change without anyone being asked. One line saying this stands in CLAUDE.md's Deploy paragraph, beside "a redeploy ends every live MCP session".

A restore of #640's two parameters was prepared to test the cause and is withdrawn. With the current wording now allowed, changing it back would send both tools back to asking.

The record: watch:weft 1149, stash:weft 144, and the report at https://claude.ai/artifact/PREyYFTZunhFd3w8wdL6w5.

What claude.ai once called connectors it now calls plugins, so this record says plugins (David, 23 November 2026: 'THERE IS NO CONNECTORS ANY MORE').

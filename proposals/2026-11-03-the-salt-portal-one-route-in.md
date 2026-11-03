# The SALT portal: one route in

A member of SALT's beach invites someone with a link the String makes, and the newcomer gives a name, joins, and lands in the string a member, on SALT's own site.

**Date**: 3 November 2026
**Lane**: salt-portal (Claude Code, Fable 5.1, on the Mac, in auto mode), started by weft at David's word that evening: "start a session to create this process … the SALT app on the bringingtheflavour beach because it can go through that. And we just need one portal route through. Whichever is easiest."
**Status**: built and proved on local gated beaches; three PRs open, none merged: pscale-beach [#105](https://github.com/pscale-commons/pscale-beach/pull/105), happyseaurchin-home [#607](https://github.com/happyseaurchin/happyseaurchin-home/pull/607), bringingtheflavour [#1](https://github.com/happyseaurchin/bringingtheflavour/pull/1). The first real invitation on SALT's beach is David's run.

## The route

1. **A member taps Invite someone** on the SALT door of the String, keyed in. The page mints an invitation through the beach's voice under their pass (the gate of [2026-11-02-leros-on-the-commons-the-build-to-completion.md](2026-11-02-leros-on-the-commons-the-build-to-completion.md) §4.2: seven days, founding one passport) and shows one link with the invitation after `#`, which no server log sees, to send or copy.
2. **The newcomer opens the link** on the same door. The page reads who it is from, for and until from the invitation itself, takes it out of the address bar, and asks one thing: a name. **Join** founds `passport:<name>` through the voice with the invitation as the bearer, a one-line passport the page writes (*matt — joined SALT's beach on 3 November 2026 at ada's invitation.*), locked to a key made on their device as a newcomer's is on the open String and shown once; the voice proves it at once for their pass, and they land in the string a member. No question is asked of their browser.
3. **It lives on SALT's own site.** `www.bringingtheflavour.com/string` is the same page, served whole by rewrites in that site's `vercel.json` to `happyseaurchin.com/api/string?door=salt` (the page, its theme and icons; the install manifest is the site's own, opening at `/string`). The beach answers any origin and the voice keeps the pass by the beach's origin, so one codebase serves both doors; `happyseaurchin.com/salt` keeps working. The function stamps the door on the page as served (`data-door`), since served there the path says nothing of it, and the door's home is the community's site: a card passed on points at `www.bringingtheflavour.com/string/<address>`.

## The decision: an invite may name who it is for

The beach records no use of an invitation, so an open one founds a passport for whoever has the link until it runs out, and a link travels. A member who knows who they are inviting names them: the beach signs the name into the invitation (`for` on the mint, after `>` in the token, which no handle holds), and the founding write is matched to it, `passport:<that name>` or `401 members_only`. Optional, since a name is not always settled before the invitation; the page says which kind it made. A standing name, a name the guard refuses, a link run out and a link for another name are each said in the page's own words with the way on, and never the thing refused.

## What was proved

`smoke:gate` and `smoke:voice-gate` in pscale-beach; `check-string.mjs` in the site; and a walk of the exact path in headless Chromium against a local gated beach with the page served as both sites serve it, eleven screenshots: ada keys in and makes a link; matt opens it on his own device, joins, is shown his key once, shares, and is still a member after a reload; nina joins by the same open link; ada's name, a name that reads as a phone number and a link run out are refused; pearl's link founds pearl alone; no request to the site's function; no invitation in any URL to the beach; the open String unchanged.

## Merge order

The voice first (pscale-beach #105), mirrored into the SALT clone so beach.bringingtheflavour.com serves it; then the page (happyseaurchin-home #607); then the rewrites (bringingtheflavour #1). Each PR body says so.

## Not built

A router path in bsp-mcp for invitations, so a member could mint one from a session rather than the page.

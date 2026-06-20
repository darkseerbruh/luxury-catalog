# UTM conventions

Use these canonical values on **every inbound link you create** (social posts,
email, ads, partner links). Consistency here is what keeps acquisition reporting
clean — without a shared vocabulary a single source fragments into many spellings
within weeks, and that data cannot be cleaned retroactively.

UTMs are read from the URL at page load and attached to events as session
properties (see `registerSessionAttribution` in `src/lib/analytics/posthog.ts`).
They require no cookies.

## Parameters

| Parameter      | Required | Meaning                          |
| -------------- | -------- | -------------------------------- |
| `utm_source`   | yes      | Where the click came from        |
| `utm_medium`   | yes      | The marketing channel/type       |
| `utm_campaign` | yes      | The specific campaign or push    |
| `utm_content`  | optional | Variant/creative/link position   |
| `utm_term`     | optional | Paid keyword                     |

## Canonical vocabulary

Always lowercase, hyphen-separated, no spaces.

**`utm_source`**: `instagram`, `tiktok`, `pinterest`, `reddit`, `youtube`,
`newsletter`, `google`, `partner-<name>`

**`utm_medium`**: `social`, `email`, `cpc`, `referral`, `affiliate`, `organic-social`

**`utm_campaign`**: `<yyyy-mm>-<short-name>`, e.g. `2026-06-hermes-guide`

## Examples

```
https://luxurycatalog.example/styles/123?utm_source=instagram&utm_medium=social&utm_campaign=2026-06-hermes-guide
https://luxurycatalog.example/?utm_source=newsletter&utm_medium=email&utm_campaign=2026-06-weekly&utm_content=hero-cta
```

## Rules

- Never put UTMs on internal links — only on links that bring people **to** the site.
- Add new sources/mediums to the tables above before using them.

# Live data integration plan

Status: proposed implementation path; no connector, scheduler or cloud database is running in this release.

## Business contract

Confirmed: holiday decorations and home goods, exported to Europe and the US; management priorities are new product development and popular social content.

Initial proposed coverage: US, UK, Germany and France. Prioritize Pinterest (aesthetics, material and motif research), TikTok (content formats and fast-moving conversation), Instagram (lifestyle presentation). The current interface offers these research entry points but does not collect from them.

The user subsequently confirmed approximately three months from development to arrival; the interface now represents that as 13 weeks. The four-week shelf buffer remains adjustable.

Still to confirm: European country weighting, shelf timing, observation cadence, official API scopes, retailer partnerships, licensed feeds and budget.

The CSV extension already accepts primary platform, content format, hook, content mechanism, original post URL, raw plays/impressions and likes, product ideas and sampling tasks. Unknown raw metrics remain null. A future collector should populate this contract from evidence rather than turning sample values into live claims.

## Collection architecture

```text
Authorized source API / licensed feed / team CSV
  -> per-source collector
  -> raw observations with provenance
  -> taxonomy mapping and deduplication
  -> normalized daily snapshots
  -> transparent scoring + evidence coverage
  -> dashboard API
  -> reviewed design recommendations and quarterly plan
```

A practical next release can use PostgreSQL, a small Node service and a scheduler. Collectors execute on the server; credentials do not enter the browser. The existing frontend can consume the normalized API response in place of the demo dataset.

## Preserve observations before aggregating

Minimum raw record:

- Source platform, source item ID and canonical source URL.
- Market, category, keyword, language and content/product title.
- Observed timestamp and original published/listed timestamp if available.
- Metric name, unit and value: views, likes, saves, rank, review count, price, currency or listing status.
- Metric definition and access method.
- Collector run ID, retrieval status and original response reference.

Keep marketplace ranking separate from units sold. Do not add likes, views, saves and ranks together. Normalize within source, market, category and observation window, then disclose the transformation and evidence coverage. Missing evidence should remain unknown rather than silently become zero.

## Source-by-source evaluation

| Source | Initial research use | Integration requirement |
| --- | --- | --- |
| Pinterest | Design aesthetics, materials, visual themes | Verify regional Trends coverage and applicable account/API permissions. |
| TikTok | Hashtags, product discussions, engagement trajectories | Evaluate Creative Center and applicable approved APIs or licensed feed coverage. |
| Instagram | Visual style, creators and relevant content | Verify Meta account and API scopes; do not assume unrestricted hashtag history. |
| Target | New listings, merchandising styles and price bands | Official partnership, licensed provider or team observation; verify field availability. |
| Walmart | Listings, ranking indicators and product attributes | Applicable official/partner data or licensed service; sales is a separate field. |
| Amazon | Category ranking and review patterns | Verify eligibility and permitted fields of the selected API/provider. |
| IKEA | Seasonal home styling, series and materials across target markets | Localized official entry points; verify authorized acquisition method and fields. |
| Action | Seasonal and value-oriented decoration in Germany/France | Country-specific observation or licensed acquisition; do not infer sales. |

## Initial keyword research groups

These are search seeds, not verified current trends:

| Family | English | German / French examples |
| --- | --- | --- |
| Christmas decor | Christmas decor, velvet bows, paper village | Weihnachtsdeko / décoration de Noël |
| Easter decor | Easter tablescape, ceramic rabbit, egg vase | Osterdeko / décoration de Pâques |
| Halloween decor | fabric pumpkin, Halloween porch decor | Halloween Deko / décoration Halloween |
| Home goods | coffee station, organic ceramics, table linen | Wohnaccessoires / décoration maison |

Store the exact original query, language, source and observation window for reproducibility. Research hypotheses and proposed products should be separate from measured content observations.

Physical stores need their own evidence pipeline (team store visits, shelf photos and structured observations, or a retail data provider). Public ecommerce listings cannot establish offline store-level sales.

## Operational behavior

- Display last successful collection time separately from the latest metric timestamp.
- Mark each source as unconfigured, healthy, delayed, failed or permission-expired.
- Keep the last valid snapshot on failure, with visible freshness information.
- Preserve run logs and rate-limit retry state.
- Map multilingual keywords to a versioned taxonomy; deduplicate syndicated content.
- Show cross-source evidence coverage alongside scores.
- Generate suggestions from cited observations and have the design team review them.
- Save cloud-backed collections and plans only after a multi-user access model is defined.

## Suggested pilot acceptance

Use the user's confirmed product family and a small set of markets. A real source should produce timestamped, inspectable observations across at least two comparable time windows. Recalculate a trend from its underlying evidence, compare it against source pages, and review the proposed design direction with the business owner before using it for purchasing or development decisions.

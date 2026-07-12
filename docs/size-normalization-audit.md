# Size-normalization audit (generated 2026-07-11, READ-ONLY)

Where a bag's **size is baked into the style name** instead of held as a selectable size dimension. The fix is the reviewed per-family split pattern (`split-chanel-flaps.ts`), NOT a blind null-fill. Ranked by comp impact.

- Total styles: **981**
- Styles with a size token in the name: **72**
- Normalization-candidate clusters (>1 style sharing a base, or size-in-name): **102**
- Null-`size_label` variants that HAVE comps (surface in shop/deals): **2**

## Top 40 candidate clusters by comp impact

| Brand | Base model | # styles | comps | Styles (size-in-name) |
|---|---|--:|--:|---|
| Chanel | Classic Flap | 6 | 995 | Mini Square Flap Bag w/ Tags / Classic Flap ·(no size) / Mini Rectangular Flap / Mini Square Flap / Micro Mini Flap / Top Handle Rectangular Flap ·(no size) |
| Hermès | Jypsière | 2 | 274 | Clemence Jypsiere 28 / Jypsière ·(no size) |
| Saint Laurent | Cassandre Envelope | 3 | 217 | Envelope Bag ·(no size) / Envelope Clutch ·(no size) / Cassandre Envelope ·(no size) |
| Hermès | Birkin | 6 | 5 | Birkin ·(no size) / Togo Birkin 35 / Guilloche Tadelakt Birkin 35 / Clemence Birkin 35 / Niloticus Novillo Birkin Touch 30 / Ostrich Birkin 35 |
| Coach | Tabby | 3 | 0 | Tabby ·(no size) / Pillow Tabby ·(no size) / Tabby Shoulder Bag ·(no size) |
| Hermès | Kelly | 2 | 0 | Kelly ·(no size) / Kelly Pochette ·(no size) |
| Louis Vuitton | Speedy | 5 | 0 | Monogram Speedy 35 / Monogram Speedy 40 / Monogram Speedy 30 / Speedy ·(no size) / Speedy Soft ·(no size) |
| Louis Vuitton | Delightful | 2 | 0 | Monogram Delightful MM / Delightful ·(no size) |
| Louis Vuitton | Porte-Documents Voyage | 2 | 0 | Epi Porte-Documents Voyage ·(no size) / Porte-Documents Voyage ·(no size) |
| Louis Vuitton | Musette | 5 | 0 | Musette Tango ·(no size) / Musette Salsa ·(no size) / Monogram Musette Salsa ·(no size) / Monogram Musette Tango ·(no size) / Musette ·(no size) |
| Louis Vuitton | Soufflot | 2 | 0 | Epi Soufflot Pochette ·(no size) / Soufflot ·(no size) |
| Louis Vuitton | Neverfull | 3 | 0 | x Urs Fischer Neverfull Pochette ·(no size) / Neverfull ·(no size) / Monogram Neverfull GM |
| Louis Vuitton | Passy | 2 | 0 | Epi Passy GM / Passy ·(no size) |
| Hermès | Fourre-Tout | 3 | 0 | Toile Fourre-Tout Messenger ·(no size) / Toile Fourre-Tout PM / Fourre-Tout ·(no size) |
| Hermès | Herbag | 4 | 0 | Toile Herbag MM / Toile Herbag Zip 31 / Toile Herbag 31 / Herbag ·(no size) |
| Hermès | Kaba | 1 | 0 | Clemence Kaba 35 |
| Hermès | Lindy | 3 | 0 | Evercolor Lindy 30 / Clemence Lindy 30 / Lindy ·(no size) |
| Saint Laurent | Loulou | 2 | 0 | Loulou ·(no size) / Loulou Puffer ·(no size) |
| Bottega Veneta | Andiamo | 2 | 0 | Andiamo ·(no size) / Long Andiamo Clutch ·(no size) |
| Saint Laurent | Icare | 2 | 0 | Icare Tote ·(no size) / Icare ·(no size) |
| Louis Vuitton | Totally | 2 | 0 | Monogram Totally MM / Totally ·(no size) |
| Burberry | Lola | 2 | 0 | Lola ·(no size) / Lola Camera Bag ·(no size) |
| Gucci | GG Marmont | 4 | 0 | GG Marmont ·(no size) / GG Marmont Chain ·(no size) / GG Marmont Top Handle ·(no size) / GG Marmont Bucket ·(no size) |
| Celine | Triomphe | 4 | 0 | Triomphe ·(no size) / Triomphe Oval ·(no size) / Triomphe Boston ·(no size) / Triomphe Shoulder ·(no size) |
| Celine | Luggage | 2 | 0 | Luggage ·(no size) / Luggage Tote ·(no size) |
| Dior | Saddle | 2 | 0 | Saddle ·(no size) / Saddle Pochette ·(no size) |
| Bottega Veneta | Cassette | 3 | 0 | Cassette ·(no size) / Padded Cassette ·(no size) / Chain Cassette ·(no size) |
| Burberry | Knight | 2 | 0 | The Knight Bag ·(no size) / Knight ·(no size) |
| Louis Vuitton | City Steamer | 2 | 0 | City Steamer MM / City Steamer ·(no size) |
| Chanel | Medallion Tote | 2 | 0 | Caviar Medallion Tote ·(no size) / Medallion Tote ·(no size) |
| Chanel | Cerf Tote | 2 | 0 | Small Executive Cerf Tote / Cerf Tote ·(no size) |
| Louis Vuitton | Tivoli | 3 | 0 | Monogram Tivoli GM / Monogram Tivoli PM / Tivoli ·(no size) |
| Louis Vuitton | Bucket | 3 | 0 | Epi Petit Bucket ·(no size) / Petit Bucket ·(no size) / Bucket ·(no size) |
| Saint Laurent | Bea | 2 | 0 | Bea ·(no size) / Bea Tote ·(no size) |
| Loewe | Hammock | 2 | 0 | Hammock ·(no size) / Hammock Flip ·(no size) |
| Louis Vuitton | Papillon | 2 | 0 | Monogram Papillon Pochette ·(no size) / Papillon ·(no size) |
| Hermès | Garden Party | 4 | 0 | Toile & Negonda Garden Party 36 / Toile Garden Party 50 / Garden Party ·(no size) / Neo Garden ·(no size) |
| Chanel | Business Affinity | 2 | 0 | Large Business Affinity Tote / Business Affinity ·(no size) |
| Chanel | Gabrielle | 3 | 0 | Medium Gabrielle Hobo / Gabrielle ·(no size) / Gabrielle Backpack ·(no size) |
| Hermès | Picotin Lock | 3 | 0 | Clemence Picotin 22 / Picotin Lock ·(no size) / Picotin ·(no size) |

## Method + next step
Each cluster = one house model whose sizes are currently separate style rows. Normalize by merging the size-bearing siblings into the base model and moving each to a `size_label` variant (dry-run-first, reversible), exactly as the Chanel flap split did. Do the highest-comp families first, archivist-verified so distinct sub-models (e.g. Hermès Birkin vs Birkin Touch vs Sellier) are NOT merged. Owner-gated per family.
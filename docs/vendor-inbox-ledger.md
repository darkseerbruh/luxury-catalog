# Vendor inbox engine — ledger

*Memory for the `vendor-inbox-scan` engine (see [vendor-inbox-engine.md](vendor-inbox-engine.md)).
Every run appends one dated block; the next run reads this first and skips mail already
logged. One line per email: `date · sender · bucket · action`.*

<!-- runs append below, newest first -->

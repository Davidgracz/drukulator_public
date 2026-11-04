# Drukulator 0.23.10v

I updated the order form, shipping options, and selected product calculators without changing the underlying price tables.

- Removed the duplicate production technology selection from checkout.
- Marked files and additional details as optional.
- Added local Szczecin delivery for PLN 20, free from PLN 300 of merchandise, calculated again on the server. Added an address field for local deliveries.
- Added courier shipping as a request requiring an individually confirmed fee; no unverified courier cost is added to the total.
- Fixed business-card duplex selection after switching to offset printing.
- Added a visual large-format poster quantity selector with a default of 30 and the existing 30-piece limit. All quantities from 1 to 30 remain available.
- Renamed digital printing's sheet-count label to "Liczba kartek".
- Set banner and film defaults to 100 × 100 cm. Shorter-side limits are validated in the price calculator and order endpoint (160 cm normally, 135 cm with laminate), regardless of orientation.
- Improved PVC/foam layout, made price previews more prominent, collapsed price tables by default, and made custom 50 × 50 cm the initial size.
- Updated frontend asset versions to avoid stale cached files.

## Deployment and verification

Back up the existing website and WordPress database before replacing files in `/drukulator/`. Clear browser and WordPress caches. Test an order without files, an order with attachments, the three delivery choices, the PLN 300 delivery threshold, and admin notification e-mails. A local browser integration run was blocked by the test environment; successful static checks do not replace production testing.

The courier price is intentionally excluded from the displayed subtotal until confirmed by the print shop. Checkout is a request requiring print-shop confirmation, not a completed sale.

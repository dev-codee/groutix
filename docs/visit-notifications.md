# Visit notifications and ETA

The On The Way / Arrived confirmation now opens a persistent result dialog. Each SMS/email channel has its own accepted, failed or unconfirmed result. Accepted means the provider accepted the message for delivery; it does not mean the customer received or read it.

Failed channels explain the fix and can be retried after correcting the customer contact or messaging account. Retry skips channels already accepted. Requests use a database-backed atomic attempt lock in `visit_notification_attempts`; the browser preserves the attempt ID across reloads in the same tab. If a connection drops, checking the same attempt cannot submit accepted messages again. A send with an ambiguous outcome stays blocked from automatic resending: check provider records before intentionally starting a new attempt. Attempts left processing by a server interruption also remain blocked rather than risking a duplicate.

Only accepted messages are added to the customer conversation. Logging errors are shown separately from send results. Email notifications use a single SMTP attempt and verify recipient acceptance. SMS providers must return message-level acceptance, including ClickSend responses that may return HTTP 200 with a message rejection.

ETA uses no Google services or keys. It uses live device GPS and the existing OpenStreetMap/Photon address lookup. By default it provides a clearly labelled broad distance-based estimate without live traffic or measured road conditions. Suburb/street-only matches are identified as approximate. If the address/GPS cannot be resolved, or the distance is too large for this method, no ETA is invented and the result shows the fix. SMS/email can still be sent without ETA.

Optionally configure `ROUTING_OSRM_URL` to the base URL of a self-hosted or managed OSRM service to get road-based duration. No public demo routing server is used by default. Failure falls back to the labelled distance estimate. Checking ETA alone never resends accepted notifications.

Validation: `node scripts/visit-notification.test.mjs`, `node scripts/customer-tracking.test.mjs`, `node scripts/sms.test.mjs`. Tests mock all messaging services; no real customer notifications are sent.

Provider semantics: https://developers.clicksend.com/docs/messaging/sms and https://nodemailer.com/extras/smtp-connection. OSRM route format: https://project-osrm.org/docs/v5.22.0/api/.

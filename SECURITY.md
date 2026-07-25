# Security Policy

## Supported version

Security fixes are applied to the latest version on `main`.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting feature for this repository.
Do not open a public issue for an unpatched vulnerability or include
sensitive log data in a report.

Include reproduction steps, affected browser/version, impact, and a minimal
sanitized sample when possible. You should receive an acknowledgement within
seven days.

## Data handling

The dashboard is static and client-only:

- Local files are read in the browser and are not uploaded.
- Custom URLs are fetched directly by the browser with credentials and
  referrer data omitted.
- Logs are limited to 10 MiB and remote requests time out after 15 seconds.
- The application has no authentication, telemetry, database, or server-side
  processing.

Only load logs and URLs you are authorized to access.

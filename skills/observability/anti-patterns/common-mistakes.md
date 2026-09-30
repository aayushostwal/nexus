# Correlation mistakes

- The earliest observed error is a candidate, not proof of origin; account for clock skew and missing telemetry.
- A service returning downstream errors may be a propagator. Verify local saturation and dependency health.
- Summarized logs can hide ordering; retain raw timestamps and state the uncertainty window.
- Simultaneous failures can share infrastructure without direct service-to-service causality.
- Fixes must address the established mechanism. Do not disable authentication or isolation to improve availability.

# Investigation examples

## Worker memory grows with each batch
Measure retained objects after equivalent batches and garbage collection. Compare heap and RSS trends. If retained task payloads point to an unbounded cache, reproduce with a fixed input sequence, bound the cache, and repeat the same load. Report peak memory, retained growth, throughput, and any missing production evidence.

## Database driver upgrade
Inventory each consumer and pool configuration. Read the exact version's release notes. Test connection lifecycle, transaction errors, timeouts, and serialization against the supported database versions. Stage the upgrade on representative traffic and confirm whether rollback requires configuration or data changes.

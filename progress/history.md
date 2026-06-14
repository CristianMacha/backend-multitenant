# Historial de sesiones

<!-- Bitácora append-only. Cada sesión añade una entrada al final. -->

---

## Sesión 2026-06-14 — Feature 1: Platform · Notifications module

**Rama:** `feat/platform-notifications` | **Issue:** #18

**Resultado:** DONE — implementación completada y aprobada por reviewer.

- Spec redactado por `spec_author`: R1..R26, 30 tareas, diseño en `src/platform/notifications/`.
- Implementación ejecutada por `implementer`: T1..T30 completados.
- Revisión por `reviewer`: APPROVED.
- `./init.sh` verde: 318 tests / 80 suites / cobertura 84.77%.
- Decisiones clave: solo `NotificationCreated` va al outbox; no `UnitOfWork`; `ActivityReminderWorker` lee tabla `activities` como read model (sin importar internals de `crm/activities`).
- Trazabilidad en `progress/impl_notifications.md`. Revisión en `progress/review_notifications.md`.

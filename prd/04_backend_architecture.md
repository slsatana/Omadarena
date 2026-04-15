# Раздел 4. Архитектура Бэкенда на NestJS (Omad Arena v1.1)

Документ задает целевую архитектуру production backend для Omad Arena с учетом B2B-модели, антифрода, строгой экономики points и ролевой админки.

## 4.1 Архитектурные принципы
1. **Server-authoritative gameplay**: клиент не является источником истины по очкам.
2. **Atomic economy**: каждая операция с points проходит через транзакцию и аудит.
3. **Security-first**: RBAC, rate limiting, anti-abuse, полная трассировка.
4. **Observability-first**: метрики/логи/трейсы как обязательная часть системы.
5. **Fail-safe defaults**: при сомнении score не начисляется автоматически.

## 4.2 High-Level схема
- **Clients**: WebApp (USER), Venue UI, Admin UI.
- **API Layer**: NestJS (REST, Guards, Interceptors, Validation).
- **Core Domain Services**: Auth, Games, Wallet, Shop/Claims, Promo, Leaderboard, Support.
- **Data Layer**: PostgreSQL (source of truth), Redis (sessions/cache/ratelimits/leaderboards).
- **Async Layer**: BullMQ workers (expire claims, recalculation, notifications, fraud post-check).
- **Integrations**: Eskiz SMS, Telegram Bot, Object Storage (изображения призов), Push provider (опционально).

## 4.3 Модульная структура NestJS

### Core
- `AppModule`: bootstrap, config, graceful shutdown.
- `ConfigModule`: ENV + schema validation (zod/joi).
- `DatabaseModule`: PrismaService.
- `RedisModule`: Redis clients.
- `ObservabilityModule`: logs, metrics, traces.

### Identity & Access
- `AuthModule`: SMS login/verify/refresh/logout.
- `SessionModule`: active_device, refresh rotation, revoke.
- `RolesModule`: `USER`, `VENUE`, `ADMIN`, `SUPER_ADMIN`.

### Product Domain
- `UsersModule`: профиль, статус, предпочтения.
- `GamesModule`: список игр, сессии, submit score.
- `AttemptsModule`: per-game daily attempts (GMT+5 через BusinessClock).
- `WalletModule`: только транзакционный update баланса.
- `ShopModule`: товары, покупки, инвентарь.
- `ClaimsModule`: QR claims lifecycle.
- `VenueModule`: scan/redeem + venue history.
- `PromoModule`: redeem с лимитами.
- `LeaderboardModule`: Redis ZSET + snapshots.
- `SupportModule`: тикеты + Telegram relay.

### Backoffice
- `AdminModule`: dashboard, users, games config, prizes, promo, moderation.
- `AuditModule`: immutable audit trail по критичным действиям.

### Platform
- `FilesModule`: upload image assets в object storage.
- `JobsModule`: BullMQ queues + retry/DLQ.
- `RateLimitModule`: per-endpoint and per-identity throttling.

## 4.4 Ключевые потоки данных

### A) SMS Login
1. `POST /auth/send-sms` -> rate limit -> Eskiz.
2. `POST /auth/verify` -> подтверждение кода -> issue access/refresh.
3. Обновление `active_device:{userId}` в Redis.
4. При смене устройства предыдущая сессия revoke.

### B) Start Game
1. Клиент вызывает `POST /games/{gameId}/start`.
2. Сервер проверяет:
   - роль и статус пользователя,
   - `attemptsLeft > 0`,
   - cooldown/ban/fraud flags.
3. В транзакции:
   - увеличивает attemptsUsed,
   - создает `game_session` в БД,
   - кладет Redis session key с TTL.
4. Возвращает `sessionId` и `sessionToken` (server-signed, short TTL).

### C) Submit Score
1. Клиент вызывает `POST /games/{gameId}/submit` с `sessionId`, `score`, `timePlayedSeconds`.
2. Сервер проверяет:
   - session существует и принадлежит user,
   - session не закрыта ранее,
   - idempotency key уникален,
   - античит-пороги per game.
3. Сервер вычисляет `points = ceil(score * ratio)`.
4. Применяет daily cap 5000 (Asia/Tashkent).
5. В одной SQL транзакции:
   - фиксирует `game_result`,
   - создает `wallet_transaction`,
   - обновляет wallet balance,
   - закрывает session.
6. Отправляет event в очередь на обновление leaderboard snapshot.

### D) Shop Purchase
1. `POST /shop/purchase` + `Idempotency-Key`.
2. Транзакция:
   - проверка доступности prize/stock,
   - списание wallet,
   - создание order,
   - создание `prize_claim` (TTL 7 days).

### E) Venue Scan + Redeem
1. `POST /venue/scan` проверяет token, TTL, venueNetwork match.
2. `POST /venue/redeem` меняет статус claim на `REDEEMED`.
3. Все действия пишутся в `audit_log` и `venue_redemption_log`.

## 4.5 Безопасность

### Auth & Sessions
- Access JWT short-lived, refresh rotation.
- Device-bound sessions (`active_device`).
- Suspicious activity -> soft lock/frozen status.

### API Security
- Global validation pipe + DTO schemas.
- RBAC guards (`@Roles`).
- Optional ABAC checks (venue ownership, prize network match).
- CORS strict allowlist + trusted proxy config.

### Anti-Cheat
- **Без frontend secret**.
- Rules:
  - max score per minute per game,
  - min session time sanity,
  - impossible progression detection,
  - duplicate submit detection.
- Strategy:
  - **Sev-Critical**: мгновенный `frozen` (submit без сессии, tampering, экстремальный score-spike),
  - **Sev-Medium**: `reject + flag` на первый инцидент,
  - повторный Sev-Medium -> `frozen`,
  - ручная ревизия в admin moderation queue.

### Abuse Protection
- Rate limits:
  - SMS send,
  - promo redeem,
  - game submit,
  - venue scan/redeem.
- IP/device fingerprint signals.
- Idempotency for monetary endpoints.

## 4.6 Транзакционность и инварианты
- Любое изменение баланса только в `WalletModule`.
- Баланс и транзакция создаются атомарно.
- `SELECT ... FOR UPDATE` для кошелька в момент списания.
- Никаких прямых update points вне domain service.
- Инварианты:
  - no double redeem,
  - no double spend,
  - no score submit after session close.

## 4.7 Redis стратегия
- `game_session:{sessionId}` TTL 1h.
- `active_device:{userId}` TTL = refresh lifetime.
- `ratelimit:*` ключи для throttling.
- `leaderboard:*` ZSET per game/period.
- cache invalidation events после критичных update.

## 4.8 Очереди и фоновые задачи (BullMQ)
- `claims-expire-worker`: перевод claim в `EXPIRED`.
- `leaderboard-recalc-worker`: batch update ranking.
- `notifications-worker`: push/telegram async dispatch.
- `fraud-review-worker`: enrichment suspicious sessions.

Политики:
- retries с exponential backoff,
- dead-letter queue,
- alert на рост fail rate.

## 4.9 Observability и SLO

### Логи
- JSON structured logs с correlationId/requestId.
- Отдельный security audit stream.

### Метрики
- P50/P95 latency per endpoint.
- submit reject ratio.
- redeem success/fail ratio.
- wallet transaction throughput.
- queue lag and job failures.

### SLO (v1)
- API availability: 99.9%.
- P95 read < 300ms.
- P95 write < 500ms.
- Critical job delay < 60s.

## 4.10 Deployment и окружения
- Envs: `dev`, `staging`, `prod`.
- Containerized deployment (Docker).
- Reverse proxy + TLS termination.
- Horizontal scaling для API replicas.
- Redis managed/replicated.
- PostgreSQL primary + read replica (опционально на росте).

## 4.11 CI/CD и quality gates
- PR pipeline:
  - lint + typecheck,
  - unit tests,
  - integration tests (DB/Redis),
  - security scan (deps).
- Deploy pipeline:
  - migration dry-run,
  - blue/green или rolling deploy,
  - smoke tests post-deploy.

## 4.12 Backup, DR, Incident Response
- PostgreSQL: daily full backup + PITR.
- Redis: snapshot policy согласно SLA.
- RPO/RTO targets:
  - RPO <= 15 min,
  - RTO <= 60 min.
- Incident process:
  - severity matrix (Sev1-Sev3),
  - on-call routing,
  - postmortem с action items.

## 4.13 Конфигурации (ENV)
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`
- `BUSINESS_TIMEZONE=Asia/Tashkent`
- `ESKIZ_API_KEY`, `ESKIZ_EMAIL`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_SUPPORT_CHAT_ID`
- `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
- `RATE_LIMIT_*`
- `OTEL_EXPORTER_*` (если tracing включен)

## 4.14 Нефункциональные решения, которые считаем обязательными
1. Idempotency-Key на submit/purchase/redeem/promo.
2. Audit log на admin/venue операции.
3. BusinessClock в timezone Asia/Tashkent.
4. Soft-delete и cooldown по номеру после удаления.
5. ADR-процесс для архитектурных изменений.

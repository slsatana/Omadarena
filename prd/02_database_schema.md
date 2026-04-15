# Раздел 2. Схема Базы Данных (Omad Arena v1.1)

Основной source of truth: **PostgreSQL** (Prisma ORM). Быстрые структуры: **Redis**.
Timezone бизнес-логики: `Asia/Tashkent`.

## 2.1 PostgreSQL (Core Entities)

### `User`
- `id` UUID PK
- `phone` String UNIQUE
- `username` String UNIQUE NULL
- `displayName` String NULL
- `status` Enum (`ACTIVE`, `BANNED_FROZEN`, `DELETED`)
- `createdAt`, `updatedAt`, `lastLoginAt`, `deletedAt`

### `RoleAssignment`
- `id` UUID PK
- `userId` FK -> User
- `role` Enum (`VENUE`, `ADMIN`, `SUPER_ADMIN`)
- `venueNetworkId` FK -> VenueNetwork NULL
- `assignedByUserId` FK -> User
- `createdAt`

### `IdentityCooldown`
- Антиабуз после удаления аккаунта.
- `id` UUID PK
- `phoneHash` String INDEX
- `blockedUntil` DateTime
- `reason` String
- UNIQUE `(phoneHash)`

### `VenueNetwork`
- `id` UUID PK
- `name` String
- `isActive` Boolean

### `Game`
- `id` String PK (`ARENA_RUNNER`, ...)
- `name` String
- `venueNetworkId` FK -> VenueNetwork
- `scoreToPointsRatio` Decimal
- `maxScorePerMinute` Int
- `isActive` Boolean

### `DailyAttemptProgression`
- `id` UUID PK
- `userId` FK -> User
- `gameId` FK -> Game
- `dateKey` Date (Asia/Tashkent)
- `attemptsUsed` Int
- UNIQUE `(userId, gameId, dateKey)`

### `Wallet`
- `id` UUID PK
- `userId` FK -> User UNIQUE
- `balance` BigInt
- `updatedAt` DateTime

### `WalletTransaction`
- `id` UUID PK
- `walletId` FK -> Wallet
- `userId` FK -> User
- `type` Enum (`GAME_EARN`, `PROMO_CODE`, `PRIZE_PURCHASE`, `MANUAL_ADJUSTMENT`)
- `amount` Int
- `balanceBefore` BigInt
- `balanceAfter` BigInt
- `referenceType` String
- `referenceId` String
- `idempotencyKey` String NULL
- `createdAt` DateTime
- INDEX `(userId, createdAt)`
- UNIQUE `(userId, idempotencyKey)` WHERE `idempotencyKey IS NOT NULL`

### `GameSession`
- `id` UUID PK
- `userId` FK -> User
- `gameId` FK -> Game
- `status` Enum (`STARTED`, `SUBMITTED`, `REJECTED`, `EXPIRED`)
- `startedAt`, `endedAt`
- `sessionTokenJti` String UNIQUE
- `ipHash`, `deviceId`, `clientVersion`

### `GameResult`
- `id` UUID PK
- `sessionId` FK -> GameSession UNIQUE
- `rawScore` Int
- `timePlayedSeconds` Int
- `awardedPoints` Int
- `reviewStatus` Enum (`ACCEPTED`, `REJECTED`, `MANUAL_REVIEW`)
- `rejectReason` String NULL
- `createdAt`

### `Prize`
- `id` UUID PK
- `name` String
- `cost` Int
- `gameId` FK -> Game
- `imageUrl` String
- `stockCount` Int
- `isActive` Boolean

### `Order`
- `id` UUID PK
- `userId` FK -> User
- `prizeId` FK -> Prize
- `status` Enum (`CREATED`, `PAID`, `CANCELLED`)
- `cost` Int
- `idempotencyKey` String
- `createdAt`
- UNIQUE `(userId, idempotencyKey)`

### `PrizeClaim`
- `id` UUID PK
- `userId` FK -> User
- `prizeId` FK -> Prize
- `orderId` FK -> Order UNIQUE
- `qrCodeData` String UNIQUE
- `status` Enum (`PURCHASED`, `REDEEMED`, `EXPIRED`)
- `expiresAt` DateTime
- `redeemedAt` DateTime NULL
- `redeemedByVenueUserId` FK -> User NULL

### `PromoCode`
- `id` UUID PK
- `code` String UNIQUE
- `pointsReward` Int
- `maxUsesGlobally` Int
- `currentUses` Int
- `startDate`, `endDate`
- `isActive` Boolean

### `PromoRedemption`
- `id` UUID PK
- `userId` FK -> User
- `promoCodeId` FK -> PromoCode
- `createdAt`
- UNIQUE `(userId, promoCodeId)`

### `SupportTicket`
- `id` UUID PK
- `userId` FK -> User
- `status` Enum (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`)
- `message` Text
- `channel` Enum (`IN_APP`, `TELEGRAM`)
- `createdAt`, `updatedAt`

### `AuditLog`
- `id` UUID PK
- `actorUserId` FK -> User
- `actorRole` String
- `action` String
- `resourceType` String
- `resourceId` String
- `beforeJson` JSONB
- `afterJson` JSONB
- `createdAt`

## 2.2 Redis (In-Memory Structures)

1. **Leaderboards (ZSET)**
   - `leaderboard:{gameId}:{period}:{dateKey}` -> member `userId`, score `bestScore`.

2. **Game Session Cache**
   - `game_session:{sessionId}` -> `{ userId, gameId, startedAt }`, TTL 1h.

3. **Active Device**
   - `active_device:{userId}` -> `deviceId`, TTL refresh lifetime.

4. **Idempotency Cache (optional accelerator)**
   - `idem:{userId}:{idempotencyKey}` -> response hash/status.

5. **Rate Limits**
   - `rl:auth:sms:{phone}`
   - `rl:promo:{userId}`
   - `rl:submit:{userId}:{gameId}`
   - `rl:venue:redeem:{venueUserId}`

## 2.3 Индексы и ограничения (минимум)
- FK + cascade/restrict по доменным правилам.
- Индексы по `createdAt` для журналов (transactions/audit/support).
- Частичные индексы по активным claims (`status='PURCHASED'`).
- Check constraints:
  - `Wallet.balance >= 0`
  - `DailyAttemptProgression.attemptsUsed BETWEEN 0 AND 5`
  - `GameResult.timePlayedSeconds > 0`

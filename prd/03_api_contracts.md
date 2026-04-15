# Раздел 3. REST API Контракты (Omad Arena v1.1)

Контракты синхронизированы с архитектурой `04_backend_architecture.md` и аудитом `06_audit_contradictions.md`.
Все payload/response в JSON. Защищенные endpoint требуют `Authorization: Bearer <JWT>`.

## 3.1 Общие требования
- Для критичных операций обязателен заголовок `Idempotency-Key`:
  - submit score,
  - purchase,
  - venue redeem,
  - promo redeem.
- Все ошибки стандартизированы:
```json
{ "error": "CODE", "message": "Human readable", "requestId": "uuid" }
```

## 3.2 Аутентификация (Auth)

### 1) Отправка SMS
`POST /api/v1/auth/send-sms`
- Payload: `{ "phone": "+998901234567" }`
- Проверки: rate limit, phone normalization.

### 2) Подтверждение SMS
`POST /api/v1/auth/verify`
- Payload: `{ "phone": "+998...", "code": "12345", "deviceId": "client-uuid" }`
- Response:
```json
{ "accessToken": "...", "refreshToken": "...", "user": { "id": "...", "status": "ACTIVE" } }
```
- Дополнительно: enforcement cooldown после удаления аккаунта.

### 3) Обновление токена
`POST /api/v1/auth/refresh`

### 4) Logout
`POST /api/v1/auth/logout`

## 3.3 Игры (Games)

### 1) Список игр и лимитов
`GET /api/v1/games`
- Response:
```json
{
  "games": [{ "id": "ARENA_RUNNER", "attemptsUsedToday": 2, "attemptsLeft": 3 }],
  "totalPointsEarnedToday": 1500,
  "dailyPointCap": 5000,
  "timezone": "Asia/Tashkent"
}
```

### 2) Старт игры
`POST /api/v1/games/{gameId}/start`
- Логика: списывает attempt, создает session.
- Response:
```json
{ "sessionId": "sess-uuid", "sessionToken": "signed-token", "expiresInSec": 3600 }
```

### 3) Submit score
`POST /api/v1/games/{gameId}/submit`
- Headers: `Idempotency-Key: <uuid>`
- Payload:
```json
{
  "sessionId": "sess-uuid",
  "sessionToken": "signed-token",
  "score": 1250,
  "timePlayedSeconds": 45,
  "clientFinishedAt": "2026-04-02T14:00:00Z"
}
```
- Валидации:
  - session ownership,
  - session status,
  - anti-cheat thresholds,
  - daily cap.
- Response:
```json
{
  "awardedPoints": 312,
  "dailyPointsAfter": 1812,
  "walletBalanceAfter": 9420,
  "highScoreUpdated": true,
  "reviewStatus": "ACCEPTED"
}
```

## 3.4 Shop и Claims

### 1) Список призов
`GET /api/v1/shop/prizes?gameId=...`

### 2) Покупка
`POST /api/v1/shop/purchase`
- Headers: `Idempotency-Key`
- Payload: `{ "prizeId": "uuid" }`
- Response:
```json
{
  "orderId": "uuid",
  "walletBalanceAfter": 8800,
  "claim": {
    "claimId": "uuid",
    "status": "PURCHASED",
    "expiresAt": "2026-04-09T14:00:00Z"
  }
}
```

### 3) Активные claims пользователя
`GET /api/v1/inventory/claims`

## 3.5 Venue Scanner

### 1) Проверка QR
`POST /api/v1/venue/scan`
- Payload: `{ "qrCodeData": "token123" }`
- Response: `{ "claimId": "uuid", "prizeName": "Кофе", "status": "VALID" }`

### 2) Redeem
`POST /api/v1/venue/redeem`
- Headers: `Idempotency-Key`
- Payload: `{ "claimId": "uuid" }`
- Response: `{ "status": "REDEEMED", "redeemedAt": "..." }`

## 3.6 Промокоды
`POST /api/v1/promo/redeem`
- Headers: `Idempotency-Key`
- Payload: `{ "code": "OMAD2026" }`
- Response: `{ "awardedPoints": 100, "walletBalanceAfter": 9100 }`

## 3.7 Лидерборды
`GET /api/v1/leaderboards/{gameId}?period=daily`
- Response: top entries + rank текущего пользователя.

## 3.8 Admin API
- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/users/{userId}/status`
- `GET /api/v1/admin/games/config`
- `PATCH /api/v1/admin/games/{gameId}/config`
- `CRUD /api/v1/admin/prizes`
- `CRUD /api/v1/admin/promo`
- `GET /api/v1/admin/audit-logs`

## 3.9 Support API
- `POST /api/v1/support/tickets`
- `GET /api/v1/support/tickets/me`
- `GET /api/v1/admin/support/tickets`
- `POST /api/v1/admin/support/tickets/{ticketId}/reply`

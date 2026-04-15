# Спецификация Omad Arena (Master Index)

Добро пожаловать в проектную документацию Omad Arena.

## Источник истины (priority order)
1. `01_business_logic.md` — продуктовые правила.
2. `04_backend_architecture.md` — технические архитектурные ограничения и обязательные паттерны.
3. `03_api_contracts.md` — публичные backend-контракты.
4. `02_database_schema.md` — модель данных.
5. `05_admin_and_venue_spec.md` — UI и процессы backoffice.
6. `06_audit_contradictions.md` — зафиксированные противоречия и патчи.

Если между документами есть расхождение, приоритет у документа выше в списке.

## Основные документы

1. 📄 **[Бизнес-Логика и Метрики](./01_business_logic.md)**
   — Правила продукта, роли, экономика, античит, призы, support.

2. 📄 **[Схема Базы Данных (PostgreSQL & Redis)](./02_database_schema.md)**
   — Таблицы, индексы, Redis структуры.

3. 📄 **[REST API Контракты](./03_api_contracts.md)**
   — Endpoint-контракты для Frontend, Admin, Venue.

4. 📄 **[Архитектура Бэкенда (NestJS)](./04_backend_architecture.md)**
   — Модули, потоки, security, observability, deployment, DR.

5. 📄 **[Спецификация Админ-Панели и Venue](./05_admin_and_venue_spec.md)**
   — Ролевые интерфейсы, процессы выдачи, backoffice-потоки.

6. 📄 **[Аудит Противоречий и Патчи](./06_audit_contradictions.md)**
   — Конфликты в логике/архитектуре, риски и решения.

## Исторический архив
- `temp_questions_100.md`
- `temp_questions_v2.md`
- `logic_paradoxes.md`

Эти файлы являются историей обсуждений и не считаются нормативной спецификацией.

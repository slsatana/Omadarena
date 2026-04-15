import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  ru: {
    translation: {
      "dashboard.title": "Главная панель",
      "dashboard.users": "Всего пользователей",
      "dashboard.games": "Активные Игры",
      "dashboard.points": "Раздано Очков",
      "dashboard.prizes": "Призов Выдано",

      "users.users": "Пользователи",
      "users.params.phone": "Телефон",
      "users.params.displayName": "Имя",
      "users.params.status": "Статус",
      "users.params.createdAt": "Дата регистрации",
      
      "games.games": "Игры",
      "games.params.name": "Название",
      "games.params.scoreToPointsRatio": "Обмен Очков",
      "games.params.maxScorePerMinute": "Лимит очков в минуту",
      "games.params.isActive": "Игр. Активность",

      "venue_networks.venue_networks": "Спонсорские Сети",
      "venue_networks.params.name": "Название Сети",
      "venue_networks.params.isActive": "Активность",

      "prizes.prizes": "Призы",
      "prizes.params.name": "Название Приза",
      "prizes.params.cost": "Стоимость",
      "prizes.params.stockCount": "В Наличии",

      "promo_codes.promo_codes": "Промокоды",
      "promo_codes.params.code": "Код",
      "promo_codes.params.pointsReward": "Награда (очки)",
      "promo_codes.params.maxUsesGlobally": "Макс. использований",
      "promo_codes.params.currentUses": "Текущие использования",
      "promo_codes.params.isActive": "Активен",

      "wallet_transactions.wallet_transactions": "Транзакции кошельков",
      "wallet_transactions.params.userPhone": "Телефон",
      "wallet_transactions.params.type": "Тип",
      "wallet_transactions.params.amount": "Сумма",
      "wallet_transactions.params.balanceAfter": "Баланс",
      "wallet_transactions.params.createdAt": "Дата",

      "buttons.edit": "Изменить",
      "buttons.delete": "Удалить",
      "buttons.create": "Создать",
      "buttons.save": "Сохранить",
      
      "pages.login.title": "Вход в Панель",
      "pages.login.subtitle": "Введите ваш номер телефона",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "ru",
  fallbackLng: "ru",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

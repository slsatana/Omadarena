export type Language = 'en' | 'ru' | 'uz';

export const translations = {
  en: {
    welcome: {
      title: "Omad Arena",
      desc: "The ultimate arena for luck and skill. Claim your spot, win exclusive prizes.",
      getStarted: "Enter Arena"
    },
    login: {
      title: "Welcome Back",
      desc: "Enter your details to continue",
      email: "Email",
      password: "Password",
      signIn: "Sign In",
      phone: "Phone Number",
      or: "or",
      signInPhone: "Sign in with Phone",
      signInEmail: "Sign in with Email",
      noAccount: "Don't have an account?",
      signUp: "Sign Up"
    },
    onboarding: [
      {
        title: "Welcome to Arenas",
        desc: "Choose an active arena and dive into exciting mini-games."
      },
      {
        title: "Compete & Score",
        desc: "Earn points, climb the leaderboards, and show off your skills."
      },
      {
        title: "Win Epic Prizes",
        desc: "Top players on the leaderboard win exclusive rewards and prizes!"
      }
    ],
    events: {
      title: "ARENAS",
      active: "Active",
      comingSoon: "Coming Soon",
      ended: "Ended",
      score: "High Score",
      players: "Players",
      left: "left",
      playerProfile: "Player Profile"
    },
    eventDetails: {
      featured: "Featured Arena",
      totalPrizes: "Arena Prizes",
      revealDate: "Ends in",
      enterBoard: "Start Playing",
      prizesSuffix: "Prizes",
      daysSuffix: "Days"
    },
    gameBoard: {
      points: "score",
      streak: "streak",
      best: "Best",
      leaderboard: "Leaderboard",
      play: "Play"
    },
    promo: {
      title: "Enter Promo Code",
      desc: "Codes give you extra score or bonuses",
      placeholder: "EX: BONUS50",
      accepted: "Code accepted! Bonus added.",
      invalid: "Invalid or already used code.",
      activate: "Activate Code"
    },
    leaderboard: {
      title: "Leaderboard",
      rank: "Rank",
      player: "Player",
      score: "Score"
    },
    result: {
      congrats: "GAME OVER!",
      youWon: "You scored",
      prizes: "points",
      prize: "point",
      yourPrize: "Your Rank",
      thankYou: "THANK YOU",
      noPrizes: "Great attempt! Keep playing to climb the leaderboard.",
      backEvents: "Back to Arenas",
      viewBoard: "Play Again"
    },
    venueDashboard: {
      title: "Venue Dashboard",
      totalPlayers: "Total Players",
      prizesIssued: "Prizes Issued",
      gameStats: "Game Statistics",
      avgScore: "Avg. Score",
      dailyActive: "Daily Active",
      pendingPrizes: "Pending Prizes",
      scanPrize: "Scan Prize QR"
    },
    profile: {
      title: "Profile",
      memberSince: "Member since March 2026",
      streak: "Streak",
      points: "Points",
      settings: "Settings",
      theme: "Theme",
      help: "Help & Support",
      logout: "Log Out",
      venueControls: "Venue Controls",
      adminConsole: "Admin Console",
      openDashboard: "Open Dashboard",
      enterAdmin: "Enter Admin Console",
      quickScan: "Quick Scan",
      launch: "Launch",
      venueDesc: "Manage your arena, scan player QR codes to issue prizes, and view real-time statistics for your venue.",
      adminDesc: "Full system access. Manage global prizes, monitor user activity, and configure arena settings.",
      account: "Account",
      prizesShop: "Prizes & Shop",
      leaderboards: "Leaderboards"
    },
    settings: {
      title: "Settings",
      notifications: "Notifications",
      sound: "Sound Effects",
      vibration: "Vibration",
      language: "Language",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      version: "Version 1.0.4"
    },
    shop: {
      prizeMarket: "Prize Shop",
      noPrizes: "No prizes found for this game yet.",
      purchaseConfirm: "Purchase {name} for {cost} points?",
      purchaseSuccess: "Successfully purchased: {name}! Check your profile items.",
      notEnoughPoints: "Not enough points! You need {diff} more points.",
      equipped: "Equipped",
      buy: "Buy",
      locked: "Locked"
    },
    support: {
      title: "Help & Support",
      faq: "Frequently Asked Questions",
      contact: "Contact Support",
      message: "Send us a message",
      placeholder: "How can we help you?",
      send: "Send Message",
      success: "Message sent! We'll get back to you soon.",
      telegram: "Join Telegram Support",
      email: "Email Support"
    },
    skyStack: {
      title: "QuadroCity",
      desc: "Build the highest tower in the city. Precision is key!",
      play: "Start Building",
      best: "High Score",
      score: "Current Height",
      limit: "Daily Limit",
      attempts: "Attempts Left",
      pause: "Pause",
      resume: "Resume",
      exit: "Exit to Menu",
      confirmExit: "If you exit, the attempt will be lost.",
      perfect: "PERFECT!",
      gameOver: "Tower Collapsed!",
      today: "Today's Score",
      remaining: "Remaining to limit",
      rules: "Tap to place the block. Align it perfectly to keep the width. If you miss, the tower falls!",
      noAttempts: "No attempts left. Come back tomorrow!",
      limitReached: "Daily limit reached",
      playNow: "PLAY NOW",
      noAttemptsLeft: "NO ATTEMPTS LEFT",
      leaderboard: "Leaderboard",
      shop: "Prizes",
      paused: "PAUSED",
      continue: "CONTINUE",
      areYouSure: "ARE YOU SURE?",
      exitWarning: "If you exit now, your attempt will be lost.",
      exitAndLose: "EXIT & LOSE ATTEMPT",
      cancel: "CANCEL"
    },
    qr: {
      title: "Scan QR Code",
      desc: "Scan the QR code to enter the arena",
      scanning: "Scanning...",
      success: "Entry Granted!",
      error: "Invalid QR Code"
    },
    arenaGame: {
      play: "Play",
      attempts: "Attempts",
      best: "Best",
      rating: "Rating",
      prizes: "Prizes",
      invite: "Invite",
      rules: "Rules",
      start: "Start",
      gameOver: "Game Over",
      score: "Score",
      tryAgain: "Try Again",
      nextLevel: "to next rank",
      cost: "Cost: 1 pt",
      noAttempts: "No attempts left or not enough points! Come back tomorrow.",
      rulesText: "Tap to switch lanes. Avoid obstacles and collect bonuses! Each attempt costs 1 point.",
      neonJumpRules: [
        "Move left and right to land on platforms",
        "Don't fall off the bottom of the screen",
        "Collect bonuses for extra points"
      ],
      cyberShieldRules: [
        "Rotate the mouth to catch sweets",
        "Don't let sweets hit the face",
        "Each attempt costs 1 point"
      ],
      inviteTitle: "Invite Friends",
      inviteDesc: "Get 50 points for every friend who joins!",
      copyLink: "Copy Link",
      prizesTitle: "Arena Rewards",
      available: "Available",
      locked: "Locked"
    },
    snake: {
      title: "Cobra",
      play: "Play",
      best: "Best",
      score: "Score",
      limit: "Limit",
      attempts: "Attempts",
      gameOver: "Game Over",
      maxReached: "Max Score Reached!",
      noAttempts: "No attempts left today!",
      tryAgain: "Try Again",
      rules: "Rules",
      rulesText: "Use arrows or swipe to control the snake. Eat neon blocks to grow and score points. Avoid walls and yourself!",
      prizes: "Prizes",
      leaderboard: "Leaderboard"
    },
    colorSort: {
      title: "Color balls",
      play: "Play",
      best: "Best",
      score: "Score",
      streak: "Streak",
      attempts: "Attempts",
      gameOver: "Game Over",
      maxReached: "Daily Limit Reached!",
      noAttempts: "No attempts left today!",
      tryAgain: "Try Again",
      rules: "Rules",
      rulesText: "Sort colored balls into tubes. You can only move a ball to an empty tube or on top of the same color.",
      leaderboard: "Leaders",
      prizes: "Shop",
      dailyBonus: "Daily Bonus",
      almostThere: "Almost there!",
      continue: "Continue",
      loseAttempt: "Attempt will be lost",
      level: "Level",
      undo: "Undo",
      shuffle: "Shuffle",
      extraTube: "Extra Tube"
    },
    higherLower: {
      title: "HOL",
      rules: "Rules",
      history: "History",
      score: "Score",
      lives: "Lives",
      dailyLimit: "Daily Limit",
      points: "points",
      guess: "Guess",
      higher: "Higher",
      lower: "Lower",
      correct: "Correct!",
      wrong: "Wrong!",
      equal: "Equal! (Loss)",
      gameOver: "Game Over",
      noLives: "You have run out of lives for today. Come back tomorrow!",
      limitReached: "Daily Limit Reached",
      limitDesc: "You have reached the maximum of 5000 points for today. Great job!",
      backToArenas: "Back to Arenas",
      playAgain: "Play Again",
      x2Mode: "x2 Mode",
      x2Desc: "Double points, but lose all 3 life parts on error!",
      start: "Start Game",
      resultDrawn: "Drawn: ",
      resetDebug: "Reset Progress (Debug)",
      rulesText: [
        "Guess if the next number (1-100) will be higher or lower.",
        "Equal numbers count as a loss.",
        "Correct guess gives points equal to the current number.",
        "You have 5 lives per day, each with 3 parts.",
        "Daily limit is 5000 points.",
        "x2 Mode: Double points, but one error takes the whole life!"
      ]
    },
    common: {
      next: "Next",
      finish: "Finish",
      back: "Back",
      dailyPoints: "Daily Points",
      dailyLimit: "Daily Limit",
      backToMenu: "Back to Menu",
      paused: "PAUSED",
      resume: "RESUME",
      exitToMenu: "Exit to Menu",
      areYouSure: "ARE YOU SURE?",
      exitConfirmText: "Exiting now will end your current game and your attempt will be lost.",
      yesExit: "YES, EXIT",
      cancel: "CANCEL",
      health: "Health",
      score: "Score",
      attemptsLeft: "Attempts Left"
    },
    gameDetails: {
      ARENA_RUNNER: {
        title: "Dodge",
        desc: "Race through the neon-lit streets of the future. Avoid obstacles, collect power-ups, and set the highest score in the district!"
      },
      NEON_JUMP: {
        title: "Jump",
        desc: "Jump from platform to platform in this high-energy neon world. How high can you go before the lights go out?"
      },
      CYBER_SHIELD: {
        title: "Shield",
        desc: "Protect the core from incoming cyber attacks. Use your shield wisely to deflect threats and maintain system integrity."
      },
      HIGHER_LOWER: {
        title: "HOL",
        desc: "Test your intuition! Guess if the next number will be higher or lower than the current one. High risk, high reward!"
      },
      SNAKE: {
        title: "Cobra",
        desc: "The classic game reimagined with a neon twist. Grow your snake, avoid walls, and compete for the top spot on the leaderboard."
      },
      SKY_STACK: {
        title: "QuadroCity",
        desc: "Build the highest tower in the city. Precision is key! Align the blocks perfectly to reach the clouds."
      },
      MATCH3: {
        title: "3x1",
        desc: "Match 3 or more blocks to score points. Use combos for massive multipliers!"
      },
      COLOR_SORT: {
        title: "Color balls",
        desc: "Sort the colored balls into their matching tubes. Think ahead!"
      },
      TETRIS: {
        title: "TetrisSS",
        desc: "Clear lines, build combos, and survive as long as possible! Swipe to move/drop, tap to rotate."
      }
    },
    match3: {
      desc: "Match 3 or more blocks to score points. Use combos for massive multipliers!",
      attempts: "Attempts Left",
      play: "PLAY NOW",
      score: "SCORE",
      moves: "MOVES",
      paused: "PAUSED",
      resume: "RESUME",
      exit: "EXIT TO MENU",
      areYouSure: "ARE YOU SURE?",
      exitWarning: "If you exit now, your attempt will be lost.",
      exitAndLose: "EXIT & LOSE ATTEMPT",
      cancel: "CANCEL",
      gameOver: "OUT OF MOVES",
      finalScore: "Final Score",
      limitReached: "Daily point limit reached",
      playAgain: "PLAY AGAIN",
      noAttemptsLeft: "NO ATTEMPTS LEFT",
      backToMenu: "BACK TO MENU",
      outOfAttempts: "Out of Attempts",
      comeBackTomorrow: "You've used all your attempts for today. Come back tomorrow for more!"
    },
    errors: {
      invalidPhone: "Invalid phone number format",
      invalidCodeLength: "Code must be 6 digits",
      otherDevice: "Logged in from another device. Your session has ended.",
      adminPassError: "Invalid access password"
    },
    qrScanner: {
      scannerTitle: "QR Code Scanner",
      manualInput: "Enter code manually...",
      simulateScan: "Simulate Scan",
      validWait: "QR code is valid!",
      validDesc: "The prize can be issued.",
      prizeLabel: "Prize",
      playerLabel: "Player",
      statusLabel: "Status",
      notIssued: "Not issued",
      issuePrize: "Issue prize",
      nextScan: "Scan next",
      invalidQr: "Error",
      invalidDesc: "QR code not found, expired, or belongs to another venue network.",
      retry: "Try again"
    },
    accountChecks: {
      deleteAccount: "Delete Account",
      deleteWarning: "Are you sure you want to PERMANENTLY delete your account? All points and achievements will be erased, and you won't be able to register this number for 1 month!",
      deleteSuccess: "Your account has been successfully deleted.",
      deleteError: "Error deleting account",
      adminPanelDesc: "Enter the universal administrator password.",
      adminPanelEnter: "Go to Admin Panel",
      cancel: "Cancel",
      submit: "Submit"
    }
  },
  ru: {
    welcome: {
      title: "Omad Arena",
      desc: "Главная арена удачи и мастерства. Займи свое место, выиграй эксклюзивные призы.",
      getStarted: "Войти в Арену"
    },
    login: {
      title: "С возвращением",
      desc: "Введите свои данные, чтобы продолжить",
      email: "Email",
      password: "Пароль",
      signIn: "Войти",
      phone: "Номер телефона",
      or: "или",
      signInPhone: "Войти по номеру",
      signInEmail: "Войти по Email",
      noAccount: "Нет аккаунта?",
      signUp: "Зарегистрироваться"
    },
    onboarding: [
      {
        title: "Добро пожаловать на Арены",
        desc: "Выбирайте активную арену и погружайтесь в увлекательные мини-игры."
      },
      {
        title: "Соревнуйтесь и побеждайте",
        desc: "Зарабатывайте очки, поднимайтесь в таблице лидеров и демонстрируйте свои навыки."
      },
      {
        title: "Выигрывайте призы",
        desc: "Лучшие игроки в таблице лидеров получают эксклюзивные награды и призы!"
      }
    ],
    events: {
      title: "АРЕНЫ",
      active: "Активно",
      comingSoon: "Скоро",
      ended: "Завершено",
      score: "Лучший счет",
      players: "Игроков",
      left: "осталось",
      playerProfile: "Профиль игрока"
    },
    eventDetails: {
      featured: "Главная арена",
      totalPrizes: "Призы арены",
      revealDate: "Закончится через",
      enterBoard: "Начать игру",
      prizesSuffix: "Призов",
      daysSuffix: "Дня"
    },
    gameBoard: {
      points: "очков",
      streak: "серия",
      best: "Рекорд",
      leaderboard: "Лидеры",
      play: "Играть"
    },
    promo: {
      title: "Введите промокод",
      desc: "Коды дают бонусы или дополнительные очки",
      placeholder: "ПРИМЕР: BONUS50",
      accepted: "Код принят! Бонус добавлен.",
      invalid: "Неверный или уже использованный код.",
      activate: "Активировать"
    },
    leaderboard: {
      title: "Таблица лидеров",
      rank: "Место",
      player: "Игрок",
      score: "Очки"
    },
    result: {
      congrats: "ИГРА ОКОНЧЕНА!",
      youWon: "Вы набрали",
      prizes: "очков",
      prize: "очко",
      yourPrize: "Ваше место",
      thankYou: "СПАСИБО",
      noPrizes: "Отличная попытка! Продолжайте играть, чтобы подняться выше в таблице.",
      backEvents: "К аренам",
      viewBoard: "Играть снова"
    },
    venueDashboard: {
      title: "Дашборд заведения",
      totalPlayers: "Всего игроков",
      prizesIssued: "Выдано призов",
      gameStats: "Статистика игры",
      avgScore: "Ср. счет",
      dailyActive: "Активно за день",
      pendingPrizes: "Ждут выдачи",
      scanPrize: "Скан QR приза"
    },
    profile: {
      title: "Профиль",
      memberSince: "В игре с марта 2026",
      streak: "Серия",
      points: "Баллы",
      settings: "Настройки",
      theme: "Тема",
      help: "Помощь и поддержка",
      logout: "Выйти",
      venueControls: "Управление заведением",
      adminConsole: "Консоль администратора",
      openDashboard: "Открыть дашборд",
      enterAdmin: "Войти в консоль",
      quickScan: "Быстрое сканирование",
      launch: "Запустить",
      venueDesc: "Управляйте своей ареной, сканируйте QR-коды игроков для выдачи призов и просматривайте статистику вашего заведения в реальном времени.",
      adminDesc: "Полный доступ к системе. Управляйте глобальными призами, следите за активностью пользователей и настраивайте параметры арен.",
      account: "Аккаунт",
      prizesShop: "Призы и магазин",
      leaderboards: "Таблицы лидеров"
    },
    settings: {
      title: "Настройки",
      notifications: "Уведомления",
      sound: "Звуковые эффекты",
      vibration: "Вибрация",
      language: "Язык",
      privacy: "Политика конфиденциальности",
      terms: "Условия использования",
      version: "Версия 1.0.4"
    },
    shop: {
      prizeMarket: "Магазин призов",
      noPrizes: "Для этой игры еще нет призов.",
      purchaseConfirm: "Купить {name} за {cost} очков?",
      purchaseSuccess: "Успешная покупка: {name}! Проверьте ваш профиль.",
      notEnoughPoints: "Недостаточно очков! Вам нужно еще {diff} очков.",
      equipped: "Надето",
      buy: "Купить",
      locked: "Закрыто"
    },
    support: {
      title: "Помощь и поддержка",
      faq: "Часто задаваемые вопросы",
      contact: "Связаться с поддержкой",
      message: "Отправьте нам сообщение",
      placeholder: "Чем мы можем вам помочь?",
      send: "Отправить сообщение",
      success: "Сообщение отправлено! Мы скоро свяжемся с вами.",
      telegram: "Поддержка в Telegram",
      email: "Поддержка по Email"
    },
    skyStack: {
      title: "QuadroCity",
      desc: "Построй самую высокую башню в городе. Точность — залог успеха!",
      play: "Играть",
      best: "Рекорд",
      score: "Текущая высота",
      limit: "Дневной лимит",
      attempts: "Осталось попыток",
      pause: "Пауза",
      resume: "Продолжить",
      exit: "Выйти в меню",
      confirmExit: "Если вы выйдете, попытка будет потеряна.",
      perfect: "ИДЕАЛЬНО!",
      gameOver: "Башня рухнула!",
      today: "Очки сегодня",
      remaining: "Осталось до лимита",
      rules: "Нажимай, чтобы установить блок. Старайся попасть точно, чтобы сохранить ширину. Промах — конец игры!",
      noAttempts: "Попытки закончились. Приходите завтра!",
      limitReached: "Дневной лимит достигнут",
      playNow: "ИГРАТЬ",
      noAttemptsLeft: "НЕТ ПОПЫТОК",
      leaderboard: "Лидеры",
      shop: "Магазин",
      areYouSure: "ВЫ УВЕРЕНЫ?",
      exitWarning: "Если вы выйдете сейчас, текущая попытка будет потеряна.",
      exitAndLose: "ВЫЙТИ И ПОТЕРЯТЬ ПОПЫТКУ",
      cancel: "ОТМЕНА",
      paused: "ПАУЗА",
      continue: "ПРОДОЛЖИТЬ"
    },
    qr: {
      title: "Сканировать QR",
      desc: "Отсканируйте QR-код, чтобы войти на арену",
      scanning: "Сканирование...",
      success: "Доступ разрешен!",
      error: "Неверный QR-код"
    },
    arenaGame: {
      play: "Играть",
      attempts: "Попытки",
      best: "Рекорд",
      rating: "Рейтинг",
      prizes: "Призы",
      invite: "Пригласить",
      rules: "Правила",
      start: "Начать",
      gameOver: "Игра окончена",
      score: "Очки",
      tryAgain: "Еще раз",
      nextLevel: "до след. ранга",
      cost: "Стоимость: 1 очко",
      noAttempts: "Попытки закончились или недостаточно очков! Приходите завтра.",
      rulesText: "Нажимай, чтобы менять полосу. Избегай препятствий и собирай бонусы! Каждая попытка стоит 1 очко.",
      neonJumpRules: [
        "Двигайтесь влево и вправо, чтобы приземляться на платформы",
        "Не падайте за нижний край экрана",
        "Собирайте бонусы для дополнительных очков"
      ],
      cyberShieldRules: [
        "Вращайте рот, чтобы ловить сладости",
        "Не позволяйте сладостям попасть в лицо",
        "Каждая попытка стоит 1 очко"
      ],
      inviteTitle: "Пригласи друзей",
      inviteDesc: "Получи 50 очков за каждого друга!",
      copyLink: "Копировать ссылку",
      prizesTitle: "Награды арены",
      available: "Доступно",
      locked: "Закрыто"
    },
    snake: {
      title: "Cobra",
      play: "Играть",
      best: "Рекорд",
      score: "Счет",
      limit: "Лимит",
      attempts: "Попытки",
      gameOver: "Игра окончена",
      maxReached: "Лимит достигнут!",
      noAttempts: "Попытки закончились!",
      tryAgain: "Еще раз",
      rules: "Правила",
      rulesText: "Используй стрелки или свайпы для управления. Собирай неоновые блоки, чтобы расти и набирать очки. Избегай стен и себя!",
      prizes: "Призы",
      leaderboard: "Лидеры"
    },
    colorSort: {
      title: "Color balls",
      play: "Играть",
      best: "Рекорд",
      score: "Счет",
      streak: "Серия",
      attempts: "Попытки",
      gameOver: "Игра Окончена",
      maxReached: "Дневной лимит достигнут, возвращайся завтра",
      noAttempts: "Попытки закончились!",
      tryAgain: "Еще Раз",
      rules: "Правила",
      rulesText: "Сортируйте цветные шарики по колбам. Можно класть только в пустую колбу или на шарик того же цвета.",
      leaderboard: "Лидеры",
      prizes: "Магазин",
      dailyBonus: "Daily бонус",
      almostThere: "Ты почти прошел уровень",
      continue: "Продолжить",
      loseAttempt: "Попытка будет потеряна",
      level: "Уровень",
      undo: "Отмена",
      shuffle: "Перемешать",
      extraTube: "+ Колба"
    },
    higherLower: {
      title: "HOL",
      rules: "Правила",
      history: "История",
      score: "Счет",
      lives: "Жизни",
      dailyLimit: "Дневной лимит",
      points: "очков",
      guess: "Угадай",
      higher: "Выше",
      lower: "Ниже",
      correct: "Верно!",
      wrong: "Ошибка!",
      equal: "Равно! (Проигрыш)",
      gameOver: "Игра окончена",
      noLives: "У вас закончились жизни на сегодня. Приходите завтра!",
      limitReached: "Лимит достигнут",
      limitDesc: "Вы набрали максимум 5000 очков за сегодня. Отличная работа!",
      backToArenas: "К аренам",
      playAgain: "Играть снова",
      x2Mode: "Режим x2",
      x2Desc: "Двойные очки, но ошибка отнимает всю жизнь (3 части)!",
      start: "Начать игру",
      resultDrawn: "Выпало: ",
      resetDebug: "Сбросить прогресс (Debug)",
      rulesText: [
        "Угадай, будет ли следующее число (1-100) выше или ниже.",
        "Равные числа считаются проигрышем.",
        "Верный ответ дает очки, равные текущему числу.",
        "У вас 5 жизней в день, каждая из 3 частей.",
        "Дневной лимит — 5000 очков.",
        "Режим x2: Двойные очки, но одна ошибка забирает всю жизнь!"
      ]
    },
    common: {
      next: "Далее",
      finish: "Завершить",
      back: "Назад",
      dailyPoints: "Дневные очки",
      dailyLimit: "Дневной лимит",
      backToMenu: "Вернуться в меню",
      paused: "ПАУЗА",
      resume: "ПРОДОЛЖИТЬ",
      exitToMenu: "Выйти в меню",
      areYouSure: "ВЫ УВЕРЕНЫ?",
      exitConfirmText: "Выход сейчас завершит текущую игру, и ваша попытка будет потеряна.",
      yesExit: "ДА, ВЫЙТИ",
      cancel: "ОТМЕНА",
      health: "Здоровье",
      score: "Счет",
      attemptsLeft: "Осталось попыток"
    },
    gameDetails: {
      ARENA_RUNNER: {
        title: "Dodge",
        desc: "Мчитесь по залитым неоном улицам будущего. Избегайте препятствий, собирайте бонусы и установите лучший результат в округе!"
      },
      NEON_JUMP: {
        title: "Jump",
        desc: "Прыгайте с платформы на платформу в этом энергичном неоновом мире. Как высоко вы сможете подняться, пока не погаснет свет?"
      },
      CYBER_SHIELD: {
        title: "Shield",
        desc: "Защитите ядро от входящих кибератак. Используйте свой щит с умом, чтобы отражать угрозы и поддерживать целостность системы."
      },
      HIGHER_LOWER: {
        title: "HOL",
        desc: "Проверьте свою интуицию! Угадайте, будет ли следующее число выше или ниже текущего. Высокий риск — высокая награда!"
      },
      SNAKE: {
        title: "Cobra",
        desc: "Классическая игра в неоновом стиле. Растите свою змейку, избегайте стен и боритесь за первое место в таблице лидеров."
      },
      SKY_STACK: {
        title: "QuadroCity",
        desc: "Построй самую высокую башню в городе. Точность — залог успеха! Выравнивай блоки идеально, чтобы достичь облаков."
      },
      MATCH3: {
        title: "3x1",
        desc: "Соединяй 3 и более блоков, чтобы набрать очки. Используй комбо для огромных множителей!"
      },
      COLOR_SORT: {
        title: "Color balls",
        desc: "Рассортируйте цветные шарики по колбам. Думайте наперед!"
      },
      TETRIS: {
        title: "TetrisSS",
        desc: "Очищайте линии, делайте комбо и выживайте как можно дольше! Свайп для перемещения/сброса, тап для вращения."
      }
    },
    match3: {
      desc: "Соединяй 3 и более блоков, чтобы набрать очки. Используй комбо для огромных множителей!",
      attempts: "Осталось попыток",
      play: "ИГРАТЬ",
      score: "СЧЕТ",
      moves: "ХОДЫ",
      paused: "ПАУЗА",
      resume: "ПРОДОЛЖИТЬ",
      exit: "ВЫЙТИ В МЕНЮ",
      areYouSure: "ВЫ УВЕРЕНЫ?",
      exitWarning: "Если вы выйдете сейчас, попытка будет потеряна.",
      exitAndLose: "ВЫЙТИ И ПОТЕРЯТЬ ПОПЫТКУ",
      cancel: "ОТМЕНА",
      gameOver: "ХОДЫ ЗАКОНЧИЛИСЬ",
      finalScore: "Итоговый счет",
      limitReached: "Дневной лимит достигнут",
      playAgain: "ИГРАТЬ СНОВА",
      noAttemptsLeft: "НЕТ ПОПЫТОК",
      backToMenu: "ВЕРНУТЬСЯ В МЕНЮ",
      outOfAttempts: "Попытки закончились",
      comeBackTomorrow: "Вы использовали все попытки на сегодня. Приходите завтра!"
    },
    errors: {
      invalidPhone: "Неверный формат номера",
      invalidCodeLength: "Код должен состоять из 6 цифр",
      otherDevice: "Вход выполнен с другого устройства. Ваша сессия завершена.",
      adminPassError: "Неверный пароль доступа"
    },
    qrScanner: {
      scannerTitle: "Сканер QR-кодов",
      manualInput: "Ввести код вручную...",
      simulateScan: "Симулировать Скан",
      validWait: "QR-код валиден!",
      validDesc: "Приз можно выдавать.",
      prizeLabel: "Приз",
      playerLabel: "Игрок",
      statusLabel: "Статус",
      notIssued: "Не выдан",
      issuePrize: "Выдать приз",
      nextScan: "Сканировать следующий",
      invalidQr: "Ошибка",
      invalidDesc: "QR-код не найден, истек или принадлежит другой сети заведений.",
      retry: "Попробовать снова"
    },
    accountChecks: {
      deleteAccount: "Удалить аккаунт",
      deleteWarning: "Вы уверены, что хотите НАВСЕГДА удалить свой аккаунт? Все ваши очки и достижения будут стерты, а вы не сможете зарегистрироваться на этот номер в течение 1 месяца!",
      deleteSuccess: "Ваш аккаунт был успешно удален.",
      deleteError: "Ошибка удаления аккаунта",
      adminPanelDesc: "Введите универсальный пароль администратора.",
      adminPanelEnter: "Переход в Админ-Панель",
      cancel: "Отмена",
      submit: "Войти"
    }
  },
  uz: {
    welcome: {
      title: "Omad Arena",
      desc: "Omad va mahoratning asosiy arenasi. O'z o'rningizni egallang, eksklyuziv sovrinlarni yutib oling.",
      getStarted: "Arenaga kirish"
    },
    login: {
      title: "Xush kelibsiz",
      desc: "Davom etish uchun ma'lumotlaringizni kiriting",
      email: "Email",
      password: "Parol",
      signIn: "Kirish",
      phone: "Telefon raqami",
      or: "yoki",
      signInPhone: "Telefon orqali kirish",
      signInEmail: "Email orqali kirish",
      noAccount: "Hisobingiz yo'qmi?",
      signUp: "Ro'yxatdan o'tish"
    },
    onboarding: [
      {
        title: "Arenaga xush kelibsiz",
        desc: "Faol arenani tanlang va qiziqarli mini-o'yinlarga sho'ng'ing."
      },
      {
        title: "Raqobatlashing va yuting",
        desc: "Ballar to'plang, peshqadamlar jadvalida ko'tariling va mahoratingizni ko'rsating."
      },
      {
        title: "Ajoyib sovrinlarni yutib oling",
        desc: "Peshqadamlar jadvalidagi eng yaxshi o'yinchilar eksklyuziv mukofotlar va sovrinlarni yutib olishadi!"
      }
    ],
    events: {
      title: "ARENALAR",
      active: "Faol",
      comingSoon: "Tez kunda",
      ended: "Yakunlandi",
      score: "Eng yaxshi natija",
      players: "O'yinchilar",
      left: "qoldi",
      playerProfile: "O'yinchi profili"
    },
    eventDetails: {
      featured: "Asosiy arena",
      totalPrizes: "Arena sovrinlari",
      revealDate: "Tugashiga qoldi",
      enterBoard: "O'yinni boshlash",
      prizesSuffix: "Sovrinlar",
      daysSuffix: "Kun"
    },
    gameBoard: {
      points: "ball",
      streak: "seriya",
      best: "Rekord",
      leaderboard: "Liderlar",
      play: "O'ynash"
    },
    promo: {
      title: "Promokodni kiriting",
      desc: "Kodlar bonuslar yoki qo'shimcha ballar beradi",
      placeholder: "MISOL: BONUS50",
      accepted: "Kod qabul qilindi! Bonus qo'shildi.",
      invalid: "Noto'g'ri yoki ishlatilgan kod.",
      activate: "Faollashtirish"
    },
    leaderboard: {
      title: "Liderlar jadvali",
      rank: "O'rin",
      player: "O'yinchi",
      score: "Ball"
    },
    result: {
      congrats: "O'YIN TUGADI!",
      youWon: "Siz to'pladingiz",
      prizes: "ball",
      prize: "ball",
      yourPrize: "Sizning o'rningiz",
      thankYou: "RAHMAT",
      noPrizes: "Yaxshi urinish! Jadvalda yuqoriga ko'tarilish uchun o'ynashda davom eting.",
      backEvents: "Arenalarga",
      viewBoard: "Yana o'ynash"
    },
    venueDashboard: {
      title: "Muassasa paneli",
      totalPlayers: "Jami o'yinchilar",
      prizesIssued: "Berilgan sovrinlar",
      gameStats: "O'yin statistikasi",
      avgScore: "O'rtacha hisob",
      dailyActive: "Kundalik faol",
      pendingPrizes: "Kutilayotgan sovrinlar",
      scanPrize: "Yutuq QR skaneri"
    },
    profile: {
      title: "Profil",
      memberSince: "2026-yil martdan beri",
      streak: "Seriya",
      points: "Ballar",
      settings: "Sozlamalar",
      theme: "Mavzu",
      help: "Yordam va qo'llab-quvvatlash",
      logout: "Chiqish",
      venueControls: "Arena boshqaruvi",
      adminConsole: "Admin konsoli",
      openDashboard: "Dashbordni ochish",
      enterAdmin: "Konsolga kirish",
      quickScan: "Tezkor skanerlash",
      launch: "Ishga tushirish",
      venueDesc: "Arenangizni boshqaring, sovrinlar berish uchun o'yinchilarning QR kodlarini skanerlang va real vaqt rejimida statistikani ko'ring.",
      adminDesc: "To'liq tizimga kirish. Global sovrinlarni boshqaring, foydalanuvchilar faolligini kuzatib boring va arena sozlamalarini sozlang.",
      account: "Hisob",
      prizesShop: "Sovrinlar va do'kon",
      leaderboards: "Liderlar jadvali"
    },
    settings: {
      title: "Sozlamalar",
      notifications: "Bildirishnomalar",
      sound: "Ovoz effektlari",
      vibration: "Vibratsiya",
      language: "Til",
      privacy: "Maxfiylik siyosati",
      terms: "Foydalanish shartlari",
      version: "Versiya 1.0.4"
    },
    shop: {
      prizeMarket: "Sovrinlar Do'koni",
      noPrizes: "Bu o'yin uchun hali sovrinlar yo'q.",
      purchaseConfirm: "{name} {cost} ballga sotib olinsinmi?",
      purchaseSuccess: "Sotib olindi: {name}! Profilingizni tekshiring.",
      notEnoughPoints: "Ballar yetarli emas! Yana {diff} ball kerak.",
      equipped: "Tanlangan",
      buy: "Sotib olish",
      locked: "Qulflangan"
    },
    support: {
      title: "Yordam va qo'llab-quvvatlash",
      faq: "Ko'p beriladigan savollar",
      contact: "Qo'llab-quvvatlash bilan bog'lanish",
      message: "Bizga xabar yuboring",
      placeholder: "Sizga qanday yordam bera olamiz?",
      send: "Xabarni yuborish",
      success: "Xabar yuborildi! Tez orada siz bilan bog'lanamiz.",
      telegram: "Telegram orqali yordam",
      email: "Email orqali yordam"
    },
    skyStack: {
      title: "QuadroCity",
      desc: "Shahardagi eng baland minorani quring. Aniqlik — muvaffaqiyat garovi!",
      play: "Qurishni boshlash",
      best: "Rekord",
      score: "Joriy balandlik",
      limit: "Kunlik limit",
      attempts: "Urinishlar qoldi",
      pause: "Pauza",
      resume: "Davom etish",
      exit: "Menyuga chiqish",
      confirmExit: "Agar chiqsangiz, urinish yo'qoladi.",
      perfect: "A'LO!",
      gameOver: "Minora quladi!",
      today: "Bugungi ballar",
      remaining: "Limitgacha qoldi",
      rules: "Blokni o'rnatish uchun bosing. Kenglikni saqlab qolish uchun aniq tushirishga harakat qiling. Xato qilsangiz — o'yin tugaydi!",
      noAttempts: "Urinishlar tugadi. Ertaga qaytib keling!",
      limitReached: "Kunlik limitga yetildi",
      playNow: "O'YNASH",
      noAttemptsLeft: "URINISHLAR YO'Q",
      leaderboard: "Liderlar",
      shop: "Do'kon",
      areYouSure: "ISHONCHINGIZ KOMILMI?",
      exitWarning: "Agar hozir chiqsangiz, joriy urinish yo'qoladi.",
      exitAndLose: "CHIQISH VA URINIShNI YO'QOTISH",
      cancel: "BEKOR QILISH",
      paused: "PAUZA",
      continue: "DAVOM ETISH"
    },
    qr: {
      title: "QR-kodni skanerlash",
      desc: "Arenaga kirish uchun QR-kodni skanerlang",
      scanning: "Skanerlanmoqda...",
      success: "Kirishga ruxsat berildi!",
      error: "Noto'g'ri QR-kod"
    },
    arenaGame: {
      play: "O'ynash",
      attempts: "Urinishlar",
      best: "Rekord",
      rating: "Reyting",
      prizes: "Sovrinlar",
      invite: "Taklif qilish",
      rules: "Qoidalar",
      start: "Boshlash",
      gameOver: "O'yin tugadi",
      score: "Ball",
      tryAgain: "Yana bir bor",
      nextLevel: "keyingi darajagacha",
      cost: "Narxi: 1 ball",
      noAttempts: "Urinishlar tugadi yoki ball yetarli emas! Ertaga qaytib keling.",
      rulesText: "Yo'lakni o'zgartirish uchun bosing. To'siqlardan qoching va bonuslarni to'plang! Har bir urinish 1 ball turadi.",
      neonJumpRules: [
        "Platformalarga qo'nish uchun chapga va o'ngga harakatlaning",
        "Ekranning pastki qismidan tushib ketmang",
        "Qo'shimcha ballar uchun bonuslarni to'plang"
      ],
      cyberShieldRules: [
        "Shirinliklarni tutish uchun og'izni aylantiring",
        "Shirinliklar yuzga tegishiga yo'l qo'ymang",
        "Har bir urinish 1 ball turadi"
      ],
      inviteTitle: "Do'stlarni taklif qiling",
      inviteDesc: "Har bir qo'shilgan do'st uchun 50 ball oling!",
      copyLink: "Havolani nusxalash",
      prizesTitle: "Arena mukofotlari",
      available: "Mavjud",
      locked: "Yopiq"
    },
    snake: {
      title: "Cobra",
      play: "O'ynash",
      best: "Rekord",
      score: "Ball",
      limit: "Limit",
      attempts: "Urinishlar",
      gameOver: "O'yin tugadi",
      maxReached: "Limitga yetildi!",
      noAttempts: "Urinishlar tugadi!",
      tryAgain: "Yana bir bor",
      rules: "Qoidalar",
      rulesText: "Boshqarish uchun o'qlar yoki svayplardan foydalaning. O'sish va ball to'plash uchun neon bloklarni yeng. Devorlardan va o'zingizdan qoching!",
      prizes: "Sovrinlar",
      leaderboard: "Liderlar"
    },
    colorSort: {
      title: "Color balls",
      play: "O'ynash",
      best: "Eng yaxshi",
      score: "Hisob",
      streak: "Seriya",
      attempts: "Urinishlar",
      gameOver: "O'yin Tugadi",
      maxReached: "Kunlik limitga yetildi!",
      noAttempts: "Urinishlar qolmadi!",
      tryAgain: "Yana Urinish",
      rules: "Qoidalar",
      rulesText: "Rangli sharlarni kolbalarga saralang. Faqat bo'sh kolbaga yoki bir xil rangdagi shar ustiga qo'yish mumkin.",
      leaderboard: "Liderlar",
      prizes: "Do'kon",
      dailyBonus: "Kunlik Bonus",
      almostThere: "Deyarli tugatdingiz!",
      continue: "Davom etish",
      loseAttempt: "Urinish yo'qotiladi",
      level: "Daraja",
      undo: "Bekor qilish",
      shuffle: "Aralashtirish",
      extraTube: "Qo'shimcha"
    },
    higherLower: {
      title: "HOL",
      rules: "Qoidalar",
      history: "Tarix",
      score: "Ball",
      lives: "Hayotlar",
      dailyLimit: "Kunlik limit",
      points: "ball",
      guess: "Taxmin",
      higher: "Yuqori",
      lower: "Past",
      correct: "To'g'ri!",
      wrong: "Xato!",
      equal: "Teng! (Mag'lubiyat)",
      gameOver: "O'yin tugadi",
      noLives: "Bugun uchun hayotlaringiz tugadi. Ertaga qaytib keling!",
      limitReached: "Kunlik limitga yetildi",
      limitDesc: "Bugun uchun maksimal 5000 ball to'pladingiz. Ajoyib!",
      backToArenas: "Arenalarga",
      playAgain: "Yana o'ynash",
      x2Mode: "x2 rejimi",
      x2Desc: "Ikki barobar ball, lekin xato butun hayotni (3 qism) olib ketadi!",
      start: "O'yinni boshlash",
      resultDrawn: "Chiqdi: ",
      resetDebug: "Progressni tiklash (Debug)",
      rulesText: [
        "Keyingi son (1-100) yuqori yoki past bo'lishini taxmin qiling.",
        "Teng sonlar mag'lubiyat hisoblanadi.",
        "To'g'ri taxmin joriy songa teng ball beradi.",
        "Kuniga 5 ta hayotingiz bor, har biri 3 qismdan iborat.",
        "Kunlik limit — 5000 ball.",
        "x2 rejimi: Ikki barobar ball, lekin bir xato butun hayotni oladi!"
      ]
    },
    common: {
      next: "Keyingi",
      finish: "Tugatish",
      back: "Orqaga",
      dailyPoints: "Kunlik ballar",
      dailyLimit: "Kunlik limit",
      backToMenu: "Menyuga qaytish",
      paused: "PAUZA",
      resume: "DAVOM ETISH",
      exitToMenu: "Menyudan chiqish",
      areYouSure: "ISHONCHINGIZ KOMILMI?",
      exitConfirmText: "Hozir chiqish joriy o'yinni tugatadi va urinishingiz yo'qoladi.",
      yesExit: "HA, CHIQISH",
      cancel: "BEKOR QILISH",
      health: "Sog'lik",
      score: "Hisob",
      attemptsLeft: "Qolgan urinishlar"
    },
    gameDetails: {
      ARENA_RUNNER: {
        title: "Dodge",
        desc: "Kelajakning neonli ko'chalari bo'ylab yuguring. To'siqlardan qoching, bonuslarni to'plang va tumandagi eng yuqori ballni o'rnating!"
      },
      NEON_JUMP: {
        title: "Neon Jump",
        desc: "Ushbu yuqori energiyali neon dunyosida platformadan platformaga sakrab o'ting. Chiroqlar o'chishidan oldin qanchalik balandga ko'tarila olasiz?"
      },
      CYBER_SHIELD: {
        title: "Cyber Shield",
        desc: "Yadroni kelayotgan kiberhujumlardan himoya qiling. Tahdidlarni qaytarish va tizim yaxlitligini saqlash uchun qalqoningizdan oqilona foydalaning."
      },
      HIGHER_LOWER: {
        title: "Higher or Lower",
        desc: "Intuitsiyangizni sinab ko'ring! Keyingi son joriysidan yuqori yoki past bo'lishini taxmin qiling. Yuqori xavf, yuqori mukofot!"
      },
      SNAKE: {
        title: "Neon Snake",
        desc: "Neon uslubidagi klassik o'yin. Iloningizni o'stiring, devorlardan qoching va liderlar jadvalida birinchi o'rin uchun kurashing."
      },
      SKY_STACK: {
        title: "Sky Stack",
        desc: "Shahardagi eng baland minorani quring. Aniqlik — muvaffaqiyat garovi! Bulutlarga yetish uchun bloklarni aniq joylashtiring."
      },
      MATCH3: {
        title: "Neon Match",
        desc: "Ball to'plash uchun 3 yoki undan ortiq bloklarni birlashtiring. Katta ko'paytirgichlar uchun kombolardan foydalaning!"
      },
      COLOR_SORT: {
        title: "Color Sort",
        desc: "Rangli sharlarni kolbalarga ajrating. Oldindan o'ylang!"
      },
      TETRIS: {
        title: "Tetris",
        desc: "Qatorlarni tozalang, kombolar qiling va iloji boricha uzoqroq yashang! Harakatlanish/tushirish uchun suring, aylantirish uchun bosing."
      }
    },
    match3: {
      desc: "Ball to'plash uchun 3 yoki undan ortiq bloklarni birlashtiring. Katta ko'paytirgichlar uchun kombolardan foydalaning!",
      attempts: "Qolgan urinishlar",
      play: "O'YNA",
      score: "HISOB",
      moves: "YURISH",
      paused: "TANAFFUS",
      resume: "DAVOM ETISH",
      exit: "MENYUGA QAYTISH",
      areYouSure: "ISHONCHINGIZ KOMILMI?",
      exitWarning: "Agar hozir chiqsangiz, urinishingiz bekor qilinadi.",
      exitAndLose: "CHIQISH VA URINISHDAN MAHRUM BO'LISH",
      cancel: "BEKOR QILISH",
      gameOver: "YURISHLAR TUGADI",
      finalScore: "Yakuniy hisob",
      limitReached: "Kunlik ball chegarasiga yetildi",
      playAgain: "YANA O'YNA",
      noAttemptsLeft: "URINISHLAR QOLMADI",
      backToMenu: "MENYUGA QAYTISH",
      outOfAttempts: "Urinishlar tugadi",
      comeBackTomorrow: "Siz bugungi barcha urinishlardan foydalandingiz. Ertaga yana keling!"
    }
  }
};

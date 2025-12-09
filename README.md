# BMSTROY — Сайт ремонтно-строительной компании

Современный веб-сайт для ремонтно-строительной компании на Next.js 14 с админ-панелью, CRM-системой и интеграцией с Telegram.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwind-css)

## Содержание

- [Технологии](#-технологии)
- [Установка](#-установка)
- [Структура проекта](#-структура-проекта)
- [API Документация](#-api-документация)
- [Админ-панель](#-админ-панель)


## 🛠️ Технологии

| Категория | Технологии |
|-----------|------------|
| Frontend | Next.js 14, React 18, TypeScript |
| Стили | Tailwind CSS 3, CSS Modules |
| Анимации | GSAP, CSS Transitions |
| Иконки | Lucide React |
| Эффекты | Canvas Confetti |
| База данных | JSON-файлы (легко заменить на любую БД) |

## 🚀 Установка

### Требования
- Node.js 18+
- npm / yarn / pnpm / bun

### Шаги установки

```bash
# Клонировать репозиторий
git clone https://github.com/meloch287/BMSTROY.git
cd BMSTROY

# Установить зависимости
npm install

# Запустить в режиме разработки
npm run dev

# Собрать для продакшена
npm run build
npm start
```

Приложение будет доступно по адресу: http://localhost:3000

## 📁 Структура проекта

```
bmstroy/
├── data/                    # JSON-база данных
│   ├── clients.json         # Клиенты
│   ├── estimates.json       # Сметы
│   ├── finance.json         # Финансы
│   ├── inventory.json       # Склад
│   ├── leads.json           # Заявки
│   ├── portfolio.json       # Портфолио
│   ├── posts.json           # Блог
│   ├── reviews.json         # Отзывы
│   ├── services.json        # Услуги
│   ├── settings.json        # Настройки
│   └── team.json            # Команда
├── public/
│   └── logo/                # Логотипы
├── src/
│   ├── app/
│   │   ├── admin/           # Админ-панель
│   │   ├── api/             # API endpoints
│   │   ├── blog/            # Страницы блога
│   │   ├── client/          # Клиентский портал
│   │   └── estimate/        # Интерактивные сметы
│   ├── components/          # React-компоненты
│   ├── lib/                 # Утилиты (db, telegram)
│   ├── styles/              # CSS-стили
│   └── utils/               # Хелперы
└── tailwind.config.ts       # Конфигурация Tailwind
```

## 📡 API Документация

Все API-эндпоинты находятся в `/api/`. Данные хранятся в JSON-файлах в папке `/data/`.

### Заявки (Leads)

```http
GET /api/leads
```
Получить все заявки

```http
POST /api/leads
Content-Type: application/json

{
  "name": "Иван Иванов",
  "phone": "+7 999 123-45-67",
  "type": "Замер"
}
```
Создать новую заявку (автоматически отправляется в Telegram)

```http
POST /api/leads/update
Content-Type: application/json

{
  "id": 123456789,
  "status": "call" // new | call | measure | contract
}
```
Обновить статус заявки

---

### Портфолио

```http
GET /api/portfolio
```
Получить все проекты

```http
POST /api/portfolio
Content-Type: application/json

{
  "title": "ЖК Символ",
  "area": "85 м²",
  "location": "Москва",
  "description": "Описание проекта",
  "tags": ["Премиум", "2-комнатная"],
  "cover": "https://..."
}
```
Добавить проект

```http
DELETE /api/portfolio?id=123
```
Удалить проект

---

### Блог

```http
GET /api/blog
```
Получить все статьи

```http
POST /api/blog
Content-Type: application/json

{
  "title": "Заголовок",
  "category": "Советы",
  "desc": "Краткое описание",
  "content": "Полный текст статьи",
  "img": "https://..."
}
```
Создать статью

---

### Услуги

```http
GET /api/services
```
Получить услуги с фоновыми изображениями

```http
POST /api/services
Content-Type: application/json

[
  {
    "id": "design",
    "title": "Дизайн-проект",
    "desc": "Описание",
    "images": ["url1", "url2"]
  }
]
```
Обновить все услуги

---

### Контент (Отзывы, Команда, Hero)

```http
GET /api/content?type=reviews
GET /api/content?type=team
GET /api/content?type=hero
```

```http
POST /api/content
Content-Type: application/json

{
  "type": "reviews",
  "data": {
    "name": "Имя",
    "text": "Текст отзыва",
    "rating": 5
  }
}
```

---

### Финансы

```http
GET /api/finance
POST /api/finance
DELETE /api/finance?id=123
```

---

### Склад

```http
GET /api/inventory
POST /api/inventory
POST /api/inventory (action: update)
DELETE /api/inventory?id=123
```

---

### Сметы

```http
GET /api/estimates
GET /api/estimates?uuid=abc123
POST /api/estimates
```

---

### Клиенты (Порталы)

```http
GET /api/clients
GET /api/clients?uuid=abc123
POST /api/clients (action: create | add_report)
```

---

### Настройки

```http
GET /api/settings
POST /api/settings
```

---

### SEO

```http
GET /api/seo
POST /api/seo
```

---

### AI Генератор

```http
POST /api/ai/generate
Content-Type: application/json

{
  "topic": "Тренды ремонта 2025",
  "platform": "site" // site | telegram | dzen
}
```

## 🔐 Админ-панель

Доступ: `/admin`

**Логин:** `admin123` (временный пароль для демо)

### Разделы админки

| Раздел | Путь | Описание |
|--------|------|----------|
| CRM Доска | `/admin/leads` | Kanban-доска заявок |
| AI Генератор | `/admin/ai` | Генерация контента |
| Услуги | `/admin/services` | Управление фонами услуг |
| Портфолио | `/admin/portfolio` | Проекты компании |
| Команда | `/admin/team` | Сотрудники |
| Блог | `/admin/blog` | Статьи |
| SEO | `/admin/seo` | Meta-теги |
| Финансы | `/admin/finance` | Доходы/расходы |
| Сметы | `/admin/estimates` | Интерактивные сметы |
| Документы | `/admin/documents` | Генератор договоров |
| Склад | `/admin/inventory` | Материалы |
| Рассылка | `/admin/broadcast` | WhatsApp рассылка |
| Настройки | `/admin/settings` | Telegram, цены |

## ⚙️ Конфигурация

### Telegram-уведомления

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен бота
3. Узнайте свой Chat ID через [@userinfobot](https://t.me/userinfobot)
4. Введите данные в `/admin/settings`

### Цены калькулятора

Редактируются в файле `src/components/Calculator.tsx`:

```typescript
const PACKAGES = [
  { id: 'standard', name: 'Стандарт', priceWork: 10800, priceMat: 5000 },
  { id: 'plus', name: 'Стандарт+', priceWork: 12600, priceMat: 7500 },
  { id: 'premium', name: 'Премиум', priceWork: 17500, priceMat: 12000 },
];
```

### Цветовая схема

Настраивается в `tailwind.config.ts`:

```typescript
colors: {
  plaster: { light: '#F5F5F0', DEFAULT: '#E8E8E0', dark: '#D0D0C8' },
  brand: {
    green: '#7CB342',
    'green-dark': '#558B2F',
    'green-light': '#9CCC65',
  },
}
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Лицензия

MIT License

## Автор

Meloch287


import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "en" | "ru" | "uz";
export const LANGS: { code: Lang; label: string }[] = [{ code: "uz", label: "O‘zbek" }, { code: "ru", label: "Русский" }, { code: "en", label: "English" }];

const dict = {
  // nav / common
  agents: { en: "Agents", ru: "Агенты", uz: "Agentlar" },
  logout: { en: "Log out", ru: "Выйти", uz: "Chiqish" },
  save: { en: "Save", ru: "Сохранить", uz: "Saqlash" },
  saved: { en: "Saved", ru: "Сохранено", uz: "Saqlandi" },
  cancel: { en: "Cancel", ru: "Отмена", uz: "Bekor qilish" },
  delete: { en: "Delete", ru: "Удалить", uz: "O‘chirish" },
  edit: { en: "Edit", ru: "Изменить", uz: "Tahrirlash" },
  add: { en: "Add", ru: "Добавить", uz: "Qo‘shish" },
  copy: { en: "Copy", ru: "Копировать", uz: "Nusxalash" },
  copied: { en: "Copied ✓", ru: "Скопировано ✓", uz: "Nusxalandi ✓" },
  loading: { en: "Loading…", ru: "Загрузка…", uz: "Yuklanmoqda…" },
  live: { en: "Live", ru: "Работает", uz: "Ishlamoqda" },
  notTrained: { en: "Not trained", ru: "Не обучен", uz: "O‘qitilmagan" },
  notTrainedYet: { en: "Not trained yet", ru: "Ещё не обучен", uz: "Hali o‘qitilmagan" },
  // auth
  welcomeBack: { en: "Welcome back", ru: "С возвращением", uz: "Xush kelibsiz" },
  signInSub: { en: "Sign in to manage your agents.", ru: "Войдите, чтобы управлять агентами.", uz: "Agentlaringizni boshqarish uchun kiring." },
  startCompany: { en: "Start with your company", ru: "Начните с вашей компании", uz: "Kompaniyangizdan boshlang" },
  registerSub: { en: "One workspace per company. Invite teammates later.", ru: "Одно пространство на компанию. Коллег можно пригласить позже.", uz: "Har kompaniya uchun bitta ish maydoni. Hamkasblarni keyin taklif qilasiz." },
  companyName: { en: "Company name", ru: "Название компании", uz: "Kompaniya nomi" },
  email: { en: "Email", ru: "Эл. почта", uz: "Elektron pochta" },
  password: { en: "Password", ru: "Пароль", uz: "Parol" },
  pwHint: { en: "At least 8 characters", ru: "Не менее 8 символов", uz: "Kamida 8 ta belgi" },
  signIn: { en: "Sign in", ru: "Войти", uz: "Kirish" },
  createWorkspace: { en: "Create workspace", ru: "Создать пространство", uz: "Ish maydoni yaratish" },
  newHere: { en: "New here?", ru: "Впервые здесь?", uz: "Yangimisiz?" },
  createWs: { en: "Create a workspace", ru: "Создать пространство", uz: "Ish maydoni yarating" },
  haveAccount: { en: "Already have an account?", ru: "Уже есть аккаунт?", uz: "Akkauntingiz bormi?" },
  // agents list
  agentsSub: { en: "Each agent has its own knowledge, voice and install code.", ru: "У каждого агента свои знания, голос и код установки.", uz: "Har bir agentning o‘z bilimi, ovozi va o‘rnatish kodi bor." },
  newAgent: { en: "+ New agent", ru: "+ Новый агент", uz: "+ Yangi agent" },
  newAgentTitle: { en: "New agent", ru: "Новый агент", uz: "Yangi agent" },
  name: { en: "Name", ru: "Название", uz: "Nomi" },
  namePh: { en: "e.g. Support assistant", ru: "напр. Помощник поддержки", uz: "masalan, Qo‘llab-quvvatlash yordamchisi" },
  descOpt: { en: "Description (optional)", ru: "Описание (необязательно)", uz: "Tavsif (ixtiyoriy)" },
  descPh: { en: "What this agent helps with", ru: "Чем помогает этот агент", uz: "Bu agent nimada yordam beradi" },
  create: { en: "Create", ru: "Создать", uz: "Yaratish" },
  noAgents: { en: "No agents yet", ru: "Агентов пока нет", uz: "Hali agentlar yo‘q" },
  noAgentsSub: { en: "Create one, add your documents, and train it in about ten minutes.", ru: "Создайте агента, добавьте документы и обучите его за десять минут.", uz: "Agent yarating, hujjatlaringizni qo‘shing va o‘n daqiqada o‘qiting." },
  noDesc: { en: "No description", ru: "Без описания", uz: "Tavsif yo‘q" },
  sources: { en: "sources", ru: "источников", uz: "manba" },
  // agent tabs
  allAgents: { en: "All agents", ru: "Все агенты", uz: "Barcha agentlar" },
  tabKnowledge: { en: "Knowledge", ru: "Знания", uz: "Bilimlar" },
  tabBehaviour: { en: "Behaviour", ru: "Поведение", uz: "Xulq-atvor" },
  tabLook: { en: "Look & install", ru: "Вид и установка", uz: "Ko‘rinish va o‘rnatish" },
  tabChannels: { en: "Channels", ru: "Каналы", uz: "Kanallar" },
  tabConversations: { en: "Conversations", ru: "Диалоги", uz: "Suhbatlar" },
  // knowledge
  addKnowledge: { en: "Add knowledge", ru: "Добавить знания", uz: "Bilim qo‘shish" },
  file: { en: "File", ru: "Файл", uz: "Fayl" }, website: { en: "Website", ru: "Сайт", uz: "Sayt" }, text: { en: "Text", ru: "Текст", uz: "Matn" }, faq: { en: "FAQ", ru: "Вопрос-ответ", uz: "Savol-javob" },
  dropFiles: { en: "Drop files here", ru: "Перетащите файлы сюда", uz: "Fayllarni shu yerga tashlang" },
  orClick: { en: "or click to choose", ru: "или нажмите, чтобы выбрать", uz: "yoki tanlash uchun bosing" },
  fileTypes: { en: "PDF, DOCX, TXT, MD, CSV, HTML · up to 25 MB each", ru: "PDF, DOCX, TXT, MD, CSV, HTML · до 25 МБ каждый", uz: "PDF, DOCX, TXT, MD, CSV, HTML · har biri 25 MB gacha" },
  pageUrl: { en: "Page URL", ru: "Адрес страницы", uz: "Sahifa manzili" },
  title: { en: "Title", ru: "Заголовок", uz: "Sarlavha" },
  textPh: { en: "Paste any information about your company…", ru: "Вставьте любую информацию о компании…", uz: "Kompaniyangiz haqida istalgan ma’lumotni joylashtiring…" },
  question: { en: "Question", ru: "Вопрос", uz: "Savol" }, answer: { en: "Answer", ru: "Ответ", uz: "Javob" },
  addQuestion: { en: "+ Question", ru: "+ Вопрос", uz: "+ Savol" }, addFaq: { en: "Add FAQ", ru: "Добавить", uz: "Qo‘shish" },
  training: { en: "Training", ru: "Обучение", uz: "O‘qitish" },
  trainingSub: { en: "New or changed sources are sent to the engine only when you train. Deleted sources are removed on the next training run.", ru: "Новые и изменённые источники отправляются в движок только при обучении. Удалённые — убираются при следующем запуске.", uz: "Yangi yoki o‘zgargan manbalar faqat o‘qitishda yuboriladi. O‘chirilganlar keyingi o‘qitishda olib tashlanadi." },
  trainAgent: { en: "Train agent", ru: "Обучить агента", uz: "Agentni o‘qitish" },
  training_: { en: "Training…", ru: "Обучение…", uz: "O‘qitilmoqda…" },
  new_: { en: "new", ru: "новых", uz: "yangi" },
  prevRuns: { en: "Previous runs", ru: "Предыдущие запуски", uz: "Oldingi ishga tushirishlar" },
  sourcesTitle: { en: "Sources", ru: "Источники", uz: "Manbalar" },
  noKnowledge: { en: "No knowledge yet", ru: "Знаний пока нет", uz: "Hali bilim yo‘q" },
  noKnowledgeSub: { en: "Add a file, a page of your website, some text or FAQs above.", ru: "Добавьте файл, страницу сайта, текст или вопросы-ответы выше.", uz: "Yuqorida fayl, sayt sahifasi, matn yoki savol-javob qo‘shing." },
  type: { en: "Type", ru: "Тип", uz: "Turi" }, status: { en: "Status", ru: "Статус", uz: "Holat" }, size: { en: "Size", ru: "Размер", uz: "Hajmi" }, indexed: { en: "Indexed", ru: "Проиндексирован", uz: "Indekslangan" },
  chars: { en: "chars", ru: "символов", uz: "belgi" },
  editSource: { en: "Edit source", ru: "Изменить источник", uz: "Manbani tahrirlash" },
  replaceContent: { en: "Replace content", ru: "Заменить содержимое", uz: "Mazmunni almashtirish" },
  replaceHint: { en: "Leave empty to keep current content. Current preview:", ru: "Оставьте пустым, чтобы сохранить текущее. Сейчас:", uz: "Hozirgisini saqlash uchun bo‘sh qoldiring. Hozirgi:" },
  reextractNote: { en: "Changing content re-extracts the text; the agent picks it up on the next training run.", ru: "При изменении текст извлекается заново; агент учтёт его при следующем обучении.", uz: "Mazmun o‘zgarsa matn qayta ajratiladi; agent keyingi o‘qitishda qabul qiladi." },
  confirmDelete: { en: "Delete", ru: "Удалить", uz: "O‘chirilsinmi" },
  // behaviour
  agentSettings: { en: "Agent behaviour", ru: "Поведение агента", uz: "Agent xulq-atvori" },
  replyLang: { en: "Reply language", ru: "Язык ответов", uz: "Javob tili" },
  description: { en: "Description", ru: "Описание", uz: "Tavsif" },
  greeting: { en: "Greeting (first message visitors see)", ru: "Приветствие (первое сообщение)", uz: "Salomlashuv (birinchi xabar)" },
  fallback: { en: "Fallback message (when the answer isn't in the knowledge base)", ru: "Запасной ответ (если ответа нет в базе знаний)", uz: "Zaxira javob (bilimlar bazasida javob bo‘lmasa)" },
  instructions: { en: "Instructions for the agent", ru: "Инструкции для агента", uz: "Agent uchun ko‘rsatmalar" },
  instructionsHint: { en: "— tone, what to avoid, how to refer to your company", ru: "— тон, чего избегать, как называть компанию", uz: "— ohang, nimadan qochish, kompaniyani qanday atash" },
  instructionsPh: { en: "You are the assistant of Safia Bakery. Be short and friendly. Never invent prices; if unsure, suggest calling +998…", ru: "Ты помощник Safia Bakery. Отвечай коротко и дружелюбно. Не выдумывай цены; если не уверен — предложи позвонить +998…", uz: "Siz Safia Bakery yordamchisisiz. Qisqa va samimiy javob bering. Narxlarni o‘ylab topmang; ishonchingiz bo‘lmasa +998… ga qo‘ng‘iroq qilishni taklif qiling" },
  agentActive: { en: "Agent is active (answers visitors)", ru: "Агент активен (отвечает посетителям)", uz: "Agent faol (tashrif buyuruvchilarga javob beradi)" },
  deleteAgent: { en: "Delete agent", ru: "Удалить агента", uz: "Agentni o‘chirish" },
  deleteAgentConfirm: { en: "Delete agent and all its data?", ru: "Удалить агента и все его данные?", uz: "Agent va uning barcha ma’lumotlari o‘chirilsinmi?" },
  // look & install
  appearance: { en: "Appearance", ru: "Внешний вид", uz: "Ko‘rinish" },
  primaryColor: { en: "Primary color", ru: "Основной цвет", uz: "Asosiy rang" },
  position: { en: "Position", ru: "Положение", uz: "Joylashuv" }, bottomRight: { en: "Bottom right", ru: "Справа внизу", uz: "O‘ng pastda" }, bottomLeft: { en: "Bottom left", ru: "Слева внизу", uz: "Chap pastda" },
  headerTitle: { en: "Header title", ru: "Заголовок окна", uz: "Oyna sarlavhasi" },
  placeholder: { en: "Input placeholder", ru: "Подсказка в поле ввода", uz: "Kiritish maydoni matni" },
  showBranding: { en: "Show “Powered by Adaptis”", ru: "Показывать «Powered by Adaptis»", uz: "“Powered by Adaptis” ko‘rsatilsin" },
  allowedSites: { en: "Allowed websites", ru: "Разрешённые сайты", uz: "Ruxsat etilgan saytlar" },
  allowedSitesSub: { en: "Only these origins may load the widget. Leave empty to allow any site.", ru: "Виджет загрузится только на этих сайтах. Пусто — на любом.", uz: "Vidjet faqat shu saytlarda yuklanadi. Bo‘sh qolsa — istalganida." },
  savedPreview: { en: "Saved — preview updated", ru: "Сохранено — превью обновлено", uz: "Saqlandi — ko‘rinish yangilandi" },
  preview: { en: "Preview", ru: "Превью", uz: "Ko‘rinish" },
  previewSub: { en: "Shows the saved look. Changes appear here when you click Save.", ru: "Показывает сохранённый вид. Изменения появятся после «Сохранить».", uz: "Saqlangan ko‘rinish. O‘zgarishlar «Saqlash» bosilganda ko‘rinadi." },
  install: { en: "Install on your website", ru: "Установка на сайт", uz: "Saytga o‘rnatish" },
  installSub: { en: "Paste this once before </body>. The button appears on every page.", ru: "Вставьте один раз перед </body>. Кнопка появится на всех страницах.", uz: "</body> oldiga bir marta qo‘ying. Tugma barcha sahifalarda chiqadi." },
  installWarn: { en: "The widget will reply only after the agent is trained.", ru: "Виджет начнёт отвечать только после обучения агента.", uz: "Vidjet faqat agent o‘qitilgandan keyin javob beradi." },
  // channels
  channelsTitle: { en: "Messenger channels", ru: "Каналы мессенджеров", uz: "Messenjer kanallari" },
  channelsSub: { en: "The same agent answers wherever your customers write. Connect each account once.", ru: "Тот же агент отвечает там, где пишут клиенты. Подключите каждый аккаунт один раз.", uz: "Mijozlar qayerda yozsa, o‘sha agent javob beradi. Har akkauntni bir marta ulang." },
  connected: { en: "Connected", ru: "Подключён", uz: "Ulangan" }, pending: { en: "Not connected", ru: "Не подключён", uz: "Ulanmagan" }, error: { en: "Error", ru: "Ошибка", uz: "Xato" },
  connect: { en: "Connect", ru: "Подключить", uz: "Ulash" }, reconnect: { en: "Reconnect", ru: "Переподключить", uz: "Qayta ulash" }, disconnect: { en: "Remove", ru: "Отключить", uz: "Olib tashlash" },
  tgHow: { en: "Create a bot in @BotFather, copy its token and paste it here. Customers write to the bot; the agent replies.", ru: "Создайте бота в @BotFather, скопируйте токен и вставьте сюда. Клиенты пишут боту — отвечает агент.", uz: "@BotFather’da bot yarating, tokenini nusxalab shu yerga qo‘ying. Mijozlar botga yozadi — agent javob beradi." },
  botToken: { en: "Bot token", ru: "Токен бота", uz: "Bot tokeni" },
  metaHow: { en: "Needs a Meta app with messaging permissions. Enter the Page ID and a Page access token; Adaptis subscribes the page and gives you the webhook URL for the Meta dashboard.", ru: "Нужно приложение Meta с правами на сообщения. Введите ID страницы и токен доступа; Adaptis подпишет страницу и выдаст URL вебхука для панели Meta.", uz: "Xabarlarga ruxsati bor Meta ilovasi kerak. Sahifa ID va kirish tokenini kiriting; Adaptis sahifani obuna qiladi va Meta paneli uchun webhook URL beradi." },
  pageId: { en: "Page ID", ru: "ID страницы", uz: "Sahifa ID" },
  pageToken: { en: "Page access token", ru: "Токен доступа страницы", uz: "Sahifa kirish tokeni" },
  usernameOpt: { en: "Account username (optional, for display)", ru: "Имя аккаунта (необязательно, для отображения)", uz: "Akkaunt nomi (ixtiyoriy, ko‘rsatish uchun)" },
  webhookUrl: { en: "Webhook URL for the Meta app", ru: "URL вебхука для приложения Meta", uz: "Meta ilovasi uchun webhook URL" },
  verifyToken: { en: "Verify token", ru: "Токен проверки", uz: "Tekshiruv tokeni" },
  lastMessage: { en: "Last message", ru: "Последнее сообщение", uz: "Oxirgi xabar" },
  channelNotTrained: { en: "Messengers reply only after the agent is trained.", ru: "Мессенджеры отвечают только после обучения агента.", uz: "Messenjerlar faqat agent o‘qitilgandan keyin javob beradi." },
  // conversations
  conversations: { en: "Conversations", ru: "Диалоги", uz: "Suhbatlar" },
  noConv: { en: "No conversations yet", ru: "Диалогов пока нет", uz: "Hali suhbatlar yo‘q" },
  noConvSub: { en: "They appear here as soon as someone writes to your agent.", ru: "Появятся, как только кто-то напишет агенту.", uz: "Kimdir agentga yozishi bilan shu yerda paydo bo‘ladi." },
  channel: { en: "Channel", ru: "Канал", uz: "Kanal" }, msgs: { en: "Msgs", ru: "Сообщ.", uz: "Xabar" }, when: { en: "When", ru: "Когда", uz: "Qachon" },
  transcript: { en: "Transcript", ru: "Переписка", uz: "Yozishmalar" },
  selectConv: { en: "Select a conversation.", ru: "Выберите диалог.", uz: "Suhbatni tanlang." },
  visitor: { en: "Visitor", ru: "Посетитель", uz: "Tashrif buyuruvchi" }, noPage: { en: "no page", ru: "без страницы", uz: "sahifasiz" },
  // landing
  heroTitle: { en: "Teach it your business. It talks to your customers.", ru: "Научите его вашему бизнесу. Он говорит с вашими клиентами.", uz: "Unga biznesingizni o‘rgating. U mijozlaringiz bilan gaplashadi." },
  heroLede: { en: "Upload your documents, your website, a few FAQs. Adaptis trains an agent that answers customers in their language with your facts only — then you paste one line of code.", ru: "Загрузите документы, сайт, несколько вопросов-ответов. Adaptis обучит агента, который отвечает клиентам на их языке только вашими фактами — а вы вставите одну строку кода.", uz: "Hujjatlaringiz, saytingiz, bir nechta savol-javobni yuklang. Adaptis mijozlarga ularning tilida faqat sizning faktlaringiz bilan javob beradigan agentni o‘qitadi — siz esa bir qator kod qo‘yasiz." },
  createAgent: { en: "Create your agent", ru: "Создать агента", uz: "Agent yaratish" },
  seeHow: { en: "See how it works", ru: "Как это работает", uz: "Qanday ishlaydi" },
  heroNote: { en: "Uzbek, Russian and English. No developers needed.", ru: "Узбекский, русский и английский. Без разработчиков.", uz: "O‘zbek, rus va ingliz tillari. Dasturchi shart emas." },
  stepsTitle: { en: "Three steps, about ten minutes.", ru: "Три шага, около десяти минут.", uz: "Uch qadam, taxminan o‘n daqiqa." },
  stepsSub: { en: "Everything happens in a simple portal. You never touch the model.", ru: "Всё — в простом кабинете. Модель трогать не нужно.", uz: "Hammasi oddiy kabinetda. Modelga tegmaysiz." },
  s1t: { en: "Give it your knowledge", ru: "Дайте ему знания", uz: "Unga bilim bering" },
  s1: { en: "Drop in PDFs and Word files, paste text, add your website address or write FAQs. Change them any time.", ru: "Загрузите PDF и Word, вставьте текст, укажите адрес сайта или напишите вопросы-ответы. Меняйте в любое время.", uz: "PDF va Word fayllarni tashlang, matn qo‘ying, sayt manzilini yoki savol-javob yozing. Istalgan vaqt o‘zgartiring." },
  s2t: { en: "Train", ru: "Обучите", uz: "O‘qiting" },
  s2: { en: "One click. Adaptis reads everything and builds an agent that answers only from your material — and says so when it doesn't know.", ru: "Один клик. Adaptis читает всё и строит агента, который отвечает только по вашим материалам — и честно говорит, если не знает.", uz: "Bir bosish. Adaptis hammasini o‘qib, faqat sizning materiallaringiz asosida javob beradigan agent quradi — bilmasa, shuni aytadi." },
  s3t: { en: "Put it on your site", ru: "Поставьте на сайт", uz: "Saytga qo‘ying" },
  s3: { en: "Copy one line of code into your website. A small button appears in the corner; customers start asking.", ru: "Скопируйте одну строку кода на сайт. В углу появится кнопка — клиенты начнут спрашивать.", uz: "Bir qator kodni saytga ko‘chiring. Burchakda tugma paydo bo‘ladi — mijozlar so‘ray boshlaydi." },
  channelsLandTitle: { en: "One agent, every channel.", ru: "Один агент — все каналы.", uz: "Bitta agent — barcha kanallar." },
  channelsLandSub: { en: "Train once. The same agent answers wherever your customers already write to you.", ru: "Обучите один раз. Тот же агент отвечает там, где клиенты уже пишут вам.", uz: "Bir marta o‘qiting. O‘sha agent mijozlar yozadigan har joyda javob beradi." },
  websiteWidget: { en: "Website widget", ru: "Виджет на сайте", uz: "Sayt vidjeti" },
  voiceSoon: { en: "Voice calls in the browser", ru: "Голосовые звонки в браузере", uz: "Brauzerda ovozli qo‘ng‘iroqlar" },
  wholeIntegration: { en: "This is the whole integration.", ru: "Это вся интеграция.", uz: "Butun integratsiya — shu." },
  madeIn: { en: "Made in Tashkent", ru: "Сделано в Ташкенте", uz: "Toshkentda yaratilgan" },
} as const;

export type Key = keyof typeof dict;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "uz", setLang: () => {} });

function initial(): Lang {
  try { const s = localStorage.getItem("lang") as Lang | null; if (s && ["en", "ru", "uz"].includes(s)) return s; } catch {}
  const n = navigator.language.slice(0, 2);
  return n === "ru" ? "ru" : n === "en" ? "en" : "uz";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial);
  const setLang = (l: Lang) => { setLangState(l); try { localStorage.setItem("lang", l); } catch {} document.documentElement.lang = l; };
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export function useT() {
  const { lang, setLang } = useContext(Ctx);
  const t = (k: Key) => dict[k][lang] ?? dict[k].en;
  return { t, lang, setLang };
}

export function LangSwitch({ dark }: { dark?: boolean }) {
  const { lang, setLang } = useT();
  return (
    <div className={`langs ${dark ? "dark" : ""}`} role="group" aria-label="Language">
      {LANGS.map((l) => <button key={l.code} className={lang === l.code ? "on" : ""} onClick={() => setLang(l.code)}>{l.code.toUpperCase()}</button>)}
    </div>
  );
}

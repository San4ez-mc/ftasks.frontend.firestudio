
'use client';

import { useEffect } from 'react';
import './landing.css';

export default function LoginTasksPage() {
  useEffect(() => {
    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const header = document.querySelector('.header');

    const handleMenuToggle = () => {
      header?.classList.toggle('active');
    };

    if (menuToggle && header) {
      menuToggle.addEventListener('click', handleMenuToggle);
    }

    // Scroll Animations for all cards
    const animatedElements = document.querySelectorAll('.feature-card, .step, .problem-card, .audience-card');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
          }
        });
      },
      {
        threshold: 0.1,
      }
    );

    animatedElements.forEach((el) => {
      observer.observe(el);
    });

    // Cleanup function
    return () => {
      if (menuToggle) {
        menuToggle.removeEventListener('click', handleMenuToggle);
      }
      animatedElements.forEach((el) => {
        observer.unobserve(el);
      });
    };
  }, []);

  return (
    <>
      <header className="header">
        <div className="container">
          <div className="logo">FINEKO</div>
          <nav className="nav">
            <a href="#problem">Проблема</a>
            <a href="#features">Переваги</a>
            <a href="#how-it-works">Як це працює</a>
            <a href="https://t.me/FinekoTasks_Bot?start=auth" className="mobile-cta">Увійти / Спробувати</a>
          </nav>
          <div className="header-actions">
            <a href="https://t.me/FinekoTasks_Bot?start=auth" className="login-link">Увійти</a>
            <a href="https://t.me/FinekoTasks_Bot?start=auth" className="cta-button header-cta">Спробувати безкоштовно</a>
          </div>
          <button className="mobile-menu-toggle">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container">
            <h1>
              Звільніть свій час. <br />
              Систематизуйте бізнес.
            </h1>
            <p className="subtitle">
              Перетворіть ваш Telegram на потужний центр управління командою. Ставте задачі голосом, контролюйте навантаження та досягайте результатів, не виходячи з месенджера.
            </p>
            <a href="https://t.me/FinekoTasks_Bot?start=auth" className="cta-button hero-cta">
              Спробувати безкоштовно
            </a>
            <p className="cta-subtext">Без реєстрації та кредитних карт.</p>
          </div>
        </section>

        <section id="problem" className="problem-solution">
          <div className="container">
            <h2 className="section-title">Навіщо вам таск-трекер, якщо є чати?</h2>
            <div className="problems-grid">
              <div className="problem-card">
                <h3>Хаос у чатах</h3>
                <p>Задачі та домовленості губляться в потоці повідомлень.</p>
              </div>
              <div className="problem-card">
                <h3>Відсутність контролю</h3>
                <p>Незрозуміло, хто чим зайнятий і на якому етапі задача.</p>
              </div>
              <div className="problem-card">
                <h3>Втрачений час</h3>
                <p>Години витрачаються на уточнення: &quot;Що по задачі?&quot;</p>
              </div>
            </div>
            <div className="solution-text">
              <p>
                FINEKO перетворює цей хаос на прозору систему, де кожна задача зафіксована, а кожен співробітник знає свій план на день. <strong>Більше жодна задача не загубиться.</strong>
              </p>
            </div>
          </div>
        </section>

        <section id="for-whom" className="for-whom">
          <div className="container">
            <h2 className="section-title">Для кого цей інструмент?</h2>
            <div className="audience-grid">
              <div className="audience-card">
                <div className="audience-icon">💼</div>
                <h3>Для власників бізнесу</h3>
                <p>Отримуйте повну картину по задачах, не занурюючись в операційну рутину. Звільніть час для стратегії.</p>
              </div>
              <div className="audience-card">
                <div className="audience-icon">📈</div>
                <h3>Для керівників відділів</h3>
                <p>Плануйте навантаження команди, відстежуйте виконання ключових результатів і бачте, хто потребує допомоги.</p>
              </div>
              <div className="audience-card">
                <div className="audience-icon">🎯</div>
                <h3>Для проєктних менеджерів</h3>
                <p>Декомпозуйте великі проєкти, зв'язуйте щоденні задачі з глобальними цілями та тримайте все під контролем.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="features">
          <div className="container">
            <h2 className="section-title">Чому FINEKO — це краще, ніж інші аналоги</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                </div>
                <h3>Повністю в Telegram</h3>
                <p>Всі дії з задачами виконуються прямо в Telegram. Не потрібно відкривати додаткові програми чи браузер.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </div>
                <h3>Задачі текстом та голосом</h3>
                <p>Просто тегніть бота або надішліть йому голосове повідомлення, і задача з'явиться в системі. Штучний інтелект розпізнає деталі.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 12c0-5.25-4.25-9.5-9.5-9.5S2.5 6.75 2.5 12s4.25 9.5 9.5 9.5" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <h3>Автоматичний контроль</h3>
                <p>Після завершення задачі, її автору автоматично створюється задача «перевірити результат». Гарантує, що ніщо не залишиться без уваги.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3>Миттєве підключення команди</h3>
                <p>Просто додайте бота в існуючий робочий чат. FINEKO автоматично побачить учасників, і ви зможете одразу ставити їм задачі.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 12.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 1 1-9 0Z" />
                    <path d="M3 12a9 9 0 1 0 9-9" />
                    <path d="M15 12a3 3 0 1 0-3-3" />
                  </svg>
                </div>
                <h3>Розділення «результатів» і «задач»</h3>
                <p>Мислити результатами, а не просто списком дій. Результат — це ціль, а задачі — кроки для її досягнення. Це допомагає тримати фокус на головному.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v2" />
                    <path d="m4.93 4.93 1.41 1.41" />
                    <path d="M20 12h2" />
                    <path d="m17.66 17.66 1.41 1.41" />
                    <path d="M12 22v-2" />
                    <path d="m6.34 17.66-1.41 1.41" />
                    <path d="M4 12H2" />
                    <path d="m6.34 6.34-1.41-1.41" />
                    <path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
                  </svg>
                </div>
                <h3>Повний контроль підлеглих</h3>
                <p>Керівник бачить не лише задачі, які він поставив, а й усі задачі конкретного працівника, відстежуючи завантаження в режимі реального часу.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="how-it-works">
          <div className="container">
            <h2 className="section-title">Як це працює?</h2>
            <div className="steps-container">
              <div className="step">
                <div className="step-number">1</div>
                <h3>Ставте задачу</h3>
                <p>Напишіть або надиктуйте повідомлення боту в Telegram. Наприклад: &quot;створи задачу 'підготувати звіт' для Марії на завтра&quot;.</p>
              </div>
              <div className="step-arrow">&rarr;</div>
              <div className="step">
                <div className="step-number">2</div>
                <h3>AI обробляє запит</h3>
                <p>Штучний інтелект розпізнає деталі: назву, виконавця, дедлайн. Якщо щось незрозуміло — бот уточнить.</p>
              </div>
              <div className="step-arrow">&rarr;</div>
              <div className="step">
                <div className="step-number">3</div>
                <h3>Контролюйте виконання</h3>
                <p>Задача з'являється у вашому календарі та у виконавця. Ви отримуєте сповіщення про завершення та задачу на перевірку.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="pricing">
          <div className="container">
            <h2 className="section-title">Простий та зрозумілий тариф</h2>
            <div className="price-card">
              <h3>Повний доступ</h3>
              <div className="price">
                2000 грн <span className="price-period">/ місяць</span>
              </div>
              <p className="price-description">За всю команду. Без прихованих платежів та обмежень по кількості користувачів.</p>
              <ul className="price-features">
                <li>Необмежена кількість користувачів</li>
                <li>Всі інтелектуальні функції</li>
                <li>Повний контроль та звітність</li>
                <li>Пріоритетна підтримка</li>
              </ul>
              <a href="https://t.me/FinekoTasks_Bot?start=auth" className="cta-button">
                Почати роботу
              </a>
            </div>
          </div>
        </section>

        <section className="final-cta">
          <div className="container">
            <h2>Готові навести лад у задачах?</h2>
            <p>Припиніть губити задачі в чатах. Почніть керувати бізнесом ефективно.</p>
            <a href="https://t.me/FinekoTasks_Bot?start=auth" className="cta-button hero-cta">
              Спробувати FINEKO зараз
            </a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 FINEKO. Всі права захищено.</p>
        </div>
      </footer>
    </>
  );
}

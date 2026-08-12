import { ArrowLeft, CheckCircle2, Copy, Download, ExternalLink, MoreHorizontal, Share, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../shared/i18n/useI18n';
import { useInstallPrompt } from '../shared/pwa/useInstallPrompt';

function getManualTitle(kind: string) {
  if (kind === 'ios-safari') return 'Как установить МотоГде на iPhone';
  if (kind === 'ios-other') return 'Откройте страницу в Safari';
  if (kind === 'android-yandex') return 'Установите МотоГде через Google Chrome';
  return 'Как установить МотоГде';
}

export function InstallPage() {
  const installPrompt = useInstallPrompt();
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function handleInstall() {
    if (installPrompt.canNativeInstall) {
      await installPrompt.install();
      return;
    }
    setCopied(false);
  }

  async function copyLink() {
    const ok = await installPrompt.copyInstallLink();
    setCopied(ok);
  }

  return (
    <section className="motohub-screen simple-screen install-screen">
      <Link className="back-link" to="/profile">
        <ArrowLeft size={18} aria-hidden="true" />
        {t('common.backToProfile')}
      </Link>
      <header className="simple-screen__header">
        <p>{t('installPage.kicker')}</p>
        <h1>{t('installPage.title')}</h1>
        <span>{t('installPage.subtitle')}</span>
      </header>

      <section className="install-card">
        <img src="/assets/brand/pwa-192x192.png" alt="" aria-hidden="true" />
        <div>
          <strong>{installPrompt.isInstalled ? 'МотоГде установлено' : installPrompt.canNativeInstall ? 'Установить в один клик' : getManualTitle(installPrompt.manualKind)}</strong>
          <span>{installPrompt.isInstalled ? 'Приложение уже открыто как PWA.' : t('installPage.noStores')}</span>
        </div>
        {!installPrompt.isInstalled && installPrompt.canNativeInstall ? (
          <button className="profile-primary-action" type="button" onClick={handleInstall}>
            <Download size={17} aria-hidden="true" />
            Установить МотоГде
          </button>
        ) : null}
      </section>

      {!installPrompt.isInstalled && !installPrompt.canNativeInstall ? (
        <section className="install-manual-card">
          <h2>{getManualTitle(installPrompt.manualKind)}</h2>
          {installPrompt.manualKind === 'ios-safari' ? (
            <ol>
              <li><Share size={18} aria-hidden="true" />Нажмите «Поделиться» в Safari.</li>
              <li><MoreHorizontal size={18} aria-hidden="true" />Выберите «На экран Домой».</li>
              <li><Smartphone size={18} aria-hidden="true" />Включите «Открывать как веб-приложение», если пункт доступен.</li>
              <li><CheckCircle2 size={18} aria-hidden="true" />Нажмите «Добавить».</li>
            </ol>
          ) : installPrompt.manualKind === 'ios-other' ? (
            <div className="install-manual-card__copy">
              <p>На iPhone установка работает через Safari. Скопируйте ссылку, откройте её в Safari и добавьте МотоГде на экран Домой.</p>
              <button className="secondary-action" type="button" onClick={copyLink}>
                <Copy size={17} aria-hidden="true" />
                {copied ? 'Ссылка скопирована' : 'Скопировать ссылку'}
              </button>
            </div>
          ) : installPrompt.manualKind === 'android-yandex' ? (
            <div className="install-manual-card__copy">
              <p>Чтобы МотоГде запускалось как отдельное приложение с иконки на главном экране, откройте эту страницу в Google Chrome и нажмите «Установить».</p>
              <p>Скопируйте ссылку → откройте Chrome → вставьте её → нажмите «Установить МотоГде».</p>
              <button className="secondary-action" type="button" onClick={copyLink}>
                <Copy size={17} aria-hidden="true" />
                {copied ? 'Ссылка скопирована' : 'Скопировать ссылку'}
              </button>
            </div>
          ) : (
            <div className="install-manual-card__copy">
              <p>Откройте меню браузера и выберите «Установить приложение», «Добавить на главный экран» или похожий пункт.</p>
              <p>Если браузер поддерживает PWA, МотоГде появится как отдельное приложение.</p>
              <span><ExternalLink size={16} aria-hidden="true" /> Название пункта зависит от браузера.</span>
            </div>
          )}
        </section>
      ) : null}
    </section>
  );
}

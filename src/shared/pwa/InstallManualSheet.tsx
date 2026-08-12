import { CheckCircle2, Copy, ExternalLink, MoreHorizontal, Share, Smartphone, X } from 'lucide-react';
import { useState } from 'react';

type ManualInstallKind = 'ios-safari' | 'ios-other' | 'android-yandex' | 'browser' | 'unsupported';

interface InstallManualSheetProps {
  kind: ManualInstallKind;
  onClose: () => void;
  onCopyLink: () => Promise<boolean>;
}

function getTitle(kind: ManualInstallKind) {
  if (kind === 'ios-safari') return 'Как установить МотоГде';
  if (kind === 'ios-other') return 'Откройте в Safari';
  if (kind === 'android-yandex') return 'Установите МотоГде через Google Chrome';
  return 'Установка через меню браузера';
}

export function InstallManualSheet({ kind, onClose, onCopyLink }: InstallManualSheetProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const ok = await onCopyLink();
    setCopied(ok);
  }

  return (
    <div className="install-sheet-backdrop" role="presentation" onClick={onClose}>
      <section className="install-sheet" role="dialog" aria-modal="true" aria-label={getTitle(kind)} onClick={(event) => event.stopPropagation()}>
        <button className="install-sheet__close" type="button" onClick={onClose} aria-label="Закрыть">
          <X size={18} aria-hidden="true" />
        </button>
        <img src="/assets/brand/app-icon-192.png" alt="" aria-hidden="true" />
        <h2>{getTitle(kind)}</h2>
        {kind === 'ios-safari' ? (
          <ol>
            <li><Share size={18} aria-hidden="true" />Нажмите «Поделиться».</li>
            <li><MoreHorizontal size={18} aria-hidden="true" />Выберите «На экран Домой».</li>
            <li><Smartphone size={18} aria-hidden="true" />Включите «Открывать как веб-приложение», если пункт доступен.</li>
            <li><CheckCircle2 size={18} aria-hidden="true" />Нажмите «Добавить».</li>
          </ol>
        ) : kind === 'ios-other' ? (
          <div className="install-sheet__copy">
            <p>На iPhone установка работает через Safari. Скопируйте ссылку, откройте её в Safari и добавьте МотоГде на экран Домой.</p>
            <button className="secondary-action" type="button" onClick={copyLink}>
              <Copy size={17} aria-hidden="true" />
              {copied ? 'Ссылка скопирована' : 'Скопировать ссылку'}
            </button>
          </div>
        ) : kind === 'android-yandex' ? (
          <div className="install-sheet__copy">
            <p>Чтобы МотоГде запускалось как отдельное приложение с иконки на главном экране, откройте эту страницу в Google Chrome и нажмите «Установить».</p>
            <span><ExternalLink size={16} aria-hidden="true" /> Скопируйте ссылку → откройте Chrome → вставьте её → нажмите «Установить МотоГде».</span>
            <button className="secondary-action" type="button" onClick={copyLink}>
              <Copy size={17} aria-hidden="true" />
              {copied ? 'Ссылка скопирована' : 'Скопировать ссылку'}
            </button>
          </div>
        ) : (
          <div className="install-sheet__copy">
            <p>Откройте меню браузера и выберите «Установить приложение», «Добавить на главный экран» или похожий пункт.</p>
            <span><ExternalLink size={16} aria-hidden="true" /> Название пункта зависит от браузера.</span>
          </div>
        )}
      </section>
    </div>
  );
}

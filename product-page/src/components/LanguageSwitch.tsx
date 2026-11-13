import { useEffect, useId, useRef, useState } from 'react';
import { TranslationOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import { useLocale, useT } from '@/i18n';
import { isLocale, SITE_LANGUAGES } from '@/i18n/locales';

/** One icon and a selected language menu, shared by wide and narrow navigation. */
export function LanguageSwitch() {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const menuId = useId();
  useEffect(() => {
    if (!open && !returnFocus.current) return;
    const frame = requestAnimationFrame(() => {
      if (open) document.getElementById(menuId)?.focus({ preventScroll: true });
      else { returnFocus.current = false; trigger.current?.focus({ preventScroll: true }); }
    });
    return () => cancelAnimationFrame(frame);
  }, [open, locale, menuId]);

  return <Dropdown
    trigger={['click']}
    placement="bottomRight"
    open={open}
    onOpenChange={setOpen}
    menu={{
      id: menuId,
      selectable: true,
      selectedKeys: [locale],
      'aria-label': t('选择语言'),
      items: SITE_LANGUAGES.map(language => ({
        key: language.code,
        label: <span lang={language.htmlLang}>{language.code} · {language.name}</span>,
      })),
      onClick: ({ key, domEvent }) => {
        // Prevent Enter's release from clicking the trigger after focus returns to it.
        domEvent.preventDefault();
        returnFocus.current = true;
        if (isLocale(key)) setLocale(key);
        setOpen(false);
      },
      onKeyDown: event => {
        if (event.key === 'Escape') {
          returnFocus.current = true;
          setOpen(false);
        }
      },
    }}
  >
    <Button ref={trigger} type="text" size="large" className="locale-switch"
      icon={<TranslationOutlined />} aria-label={t('选择语言')} title={t('选择语言')}
      aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined} />
  </Dropdown>;
}

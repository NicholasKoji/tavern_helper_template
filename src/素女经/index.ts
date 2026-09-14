import { createApp, type App as VueApp } from 'vue';
import { z } from 'zod';
import App from './App.vue';
import { createScriptIdIframe, teleportStyle } from '@util/script';

const BUTTON_NAME = '素女经';
const EXTENSION_MENU_ITEM_ID = 'su-nv-jing-extension-menu-item';
const EXTENSION_MENU_SELECTOR = '#extensionsMenu, #extensions_menu, .extensions_menu';
const EXTENSION_BUTTON_SELECTOR =
  '#extensionsMenuButton, #extensions_button, .extensions_button, #nav_toggle_extensions';

const Preferences = z
  .object({
    favorites: z.array(z.string()).default([]),
    imagesVisible: z.boolean().default(true),
  })
  .prefault({});

type Preferences = z.infer<typeof Preferences>;

function loadPreferences(): Preferences {
  return Preferences.parse(getVariables({ type: 'script', script_id: getScriptId() }));
}

function savePreferences(preferences: Preferences): void {
  insertOrAssignVariables(preferences, { type: 'script', script_id: getScriptId() });
}

function insertIntoTavernInput(prompt: string): void {
  const $input = $('#send_textarea', window.parent.document);
  if ($input.length === 0) {
    toastr.error('没有找到酒馆输入框');
    return;
  }

  const current = String($input.val() ?? '').trimEnd();
  $input.val(current ? `${current}\n\n${prompt}` : prompt);
  $input.trigger('input').trigger('change').trigger('keyup').focus();
  toastr.success('动作提示已插入输入框');
}

$(() => {
  replaceScriptButtons([{ name: BUTTON_NAME, visible: true }]);

  const tavernDocument = window.parent.document;
  const tavernWindow = tavernDocument.defaultView ?? window.parent;
  const dialog = tavernDocument.createElement('dialog');
  dialog.className = 'su-nv-jing-dialog';
  dialog.setAttribute('aria-label', BUTTON_NAME);
  Object.assign(dialog.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    right: 'auto',
    bottom: 'auto',
    width: '100vw',
    height: '100vh',
    maxWidth: 'none',
    maxHeight: 'none',
    margin: '0',
    padding: '0',
    overflow: 'hidden',
    border: '0',
    background: 'transparent',
  });

  const dialogStyle = tavernDocument.createElement('style');
  dialogStyle.textContent = '.su-nv-jing-dialog::backdrop { background: transparent; }';
  tavernDocument.head.appendChild(dialogStyle);

  const $iframe = createScriptIdIframe().attr('title', BUTTON_NAME).css({
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    display: 'block',
    border: '0',
    zIndex: '2147483000',
    background: 'transparent',
  });

  let app: VueApp<Element> | undefined;
  let styleTeleport: ReturnType<typeof teleportStyle> | undefined;
  let lastTrigger: HTMLElement | undefined;

  const syncDialogToViewport = (): void => {
    const viewport = tavernWindow.visualViewport;
    const viewportTop = viewport?.offsetTop ?? 0;
    const viewportHeight = viewport?.height ?? tavernWindow.innerHeight;
    const viewportBottom = viewportTop + viewportHeight;
    const inputBarTop = ['#send_form', '#form_sheld']
      .map(selector => tavernDocument.querySelector<HTMLElement>(selector)?.getBoundingClientRect())
      .filter((rect): rect is DOMRect => Boolean(rect?.height && rect.top > viewportTop && rect.top < viewportBottom))
      .reduce((top, rect) => Math.min(top, rect.top), viewportBottom);

    Object.assign(dialog.style, {
      left: `${viewport?.offsetLeft ?? 0}px`,
      top: `${viewportTop}px`,
      width: `${viewport?.width ?? tavernWindow.innerWidth}px`,
      height: `${Math.max(1, inputBarTop - viewportTop - 6)}px`,
    });
  };

  const hide = (): void => {
    if (dialog.open) dialog.close();
    lastTrigger?.focus();
    lastTrigger = undefined;
  };

  const show = (trigger?: HTMLElement): void => {
    lastTrigger = trigger;
    syncDialogToViewport();
    if (!dialog.open) dialog.showModal();
  };

  const ensureExtensionMenuItem = (): void => {
    if ($(tavernDocument).find(`#${EXTENSION_MENU_ITEM_ID}`).length > 0) return;

    const $menu = $(tavernDocument).find(EXTENSION_MENU_SELECTOR).first();
    if (!$menu.length) return;

    const $item = $(
      `
      <div class="list-group-item extension_item interactable" id="${EXTENSION_MENU_ITEM_ID}" title="${BUTTON_NAME}" style="cursor: pointer;">
        <i class="fa-solid fa-book-open"></i>
        <span>${BUTTON_NAME}</span>
      </div>
    `,
      tavernDocument,
    );

    $item.on('click', event => {
      event.preventDefault();
      event.stopPropagation();

      const $extensionButton = $(tavernDocument).find(EXTENSION_BUTTON_SELECTOR).first();
      const $menuElement = $(tavernDocument).find(EXTENSION_MENU_SELECTOR).first();
      const focusTarget = ($extensionButton[0] ?? $item[0]) as HTMLElement;

      if (
        $extensionButton.length &&
        ($menuElement.is(':visible') || $menuElement.css('display') !== 'none' || $menuElement.hasClass('open'))
      ) {
        $extensionButton.trigger('click');
      }
      if ($menuElement.is(':visible') || $menuElement.css('display') !== 'none') {
        $menuElement.hide();
      }

      setTimeout(() => show(focusTarget), 0);
    });

    $menu.append($item);
  };

  $iframe.on('load', () => {
    const frame = $iframe[0];
    const frameDocument = frame?.contentDocument;
    if (!frame || !frameDocument) return;

    frameDocument.documentElement.style.width = '100%';
    frameDocument.documentElement.style.height = '100%';
    frameDocument.body.style.width = '100%';
    frameDocument.body.style.height = '100%';
    frameDocument.body.style.margin = '0';
    frameDocument.body.style.overflow = 'hidden';

    const mountPoint = frameDocument.createElement('div');
    mountPoint.id = 'app';
    frameDocument.body.appendChild(mountPoint);

    styleTeleport = teleportStyle(frameDocument.head);
    const preferences = loadPreferences();
    app = createApp(App, {
      initialFavorites: preferences.favorites,
      initialImagesVisible: preferences.imagesVisible,
      onClose: hide,
      onSavePreferences: savePreferences,
      onInsertPrompt: insertIntoTavernInput,
    });
    app.mount(mountPoint);
  });

  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    hide();
  });
  dialog.appendChild($iframe[0]);
  tavernDocument.body.appendChild(dialog);

  tavernWindow.addEventListener('resize', syncDialogToViewport);
  tavernWindow.visualViewport?.addEventListener('resize', syncDialogToViewport);
  tavernWindow.visualViewport?.addEventListener('scroll', syncDialogToViewport);

  eventOn(getButtonEvent(BUTTON_NAME), () => show());

  ensureExtensionMenuItem();

  const menuContainer =
    $(tavernDocument).find(EXTENSION_MENU_SELECTOR).first()[0] ??
    $(tavernDocument).find('#extensions_holder, #sheld, #left-nav').first()[0] ??
    tavernDocument.body;
  const menuObserver = new window.parent.MutationObserver(ensureExtensionMenuItem);
  menuObserver.observe(menuContainer, { childList: true, subtree: false });

  const onExtensionMenuButtonClick = (): void => {
    setTimeout(ensureExtensionMenuItem, 0);
  };
  $(tavernDocument).on('click', EXTENSION_BUTTON_SELECTOR, onExtensionMenuButtonClick);

  $(window).on('pagehide', () => {
    menuObserver.disconnect();
    $(tavernDocument).off('click', EXTENSION_BUTTON_SELECTOR, onExtensionMenuButtonClick);
    $(tavernDocument).find(`#${EXTENSION_MENU_ITEM_ID}`).remove();
    tavernWindow.removeEventListener('resize', syncDialogToViewport);
    tavernWindow.visualViewport?.removeEventListener('resize', syncDialogToViewport);
    tavernWindow.visualViewport?.removeEventListener('scroll', syncDialogToViewport);
    app?.unmount();
    styleTeleport?.destroy();
    dialog.remove();
    dialogStyle.remove();
  });
});

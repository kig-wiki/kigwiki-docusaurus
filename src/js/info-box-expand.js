import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

const DEBOUNCE_MS = 320;
const EXPANDED_SELECTOR =
  '.info-box-container.info-box-expanded, .info-box-container-large.info-box-expanded';

function closeInfoBox(container) {
  container.classList.remove('info-box-expanded');
  document.body.style.overflow = '';
}

function initInfoBoxExpand() {
  let lastExpandTime = 0;

  document.addEventListener('click', (e) => {
    const expandedContainer = e.target.closest(EXPANDED_SELECTOR);

    if (expandedContainer && e.target === expandedContainer) {
      closeInfoBox(expandedContainer);
      return;
    }

    const image = e.target.closest('.info-box-image');
    if (!image) return;
    const container = image.closest('.info-box-container, .info-box-container-large');
    if (!container) return;

    if (container.classList.contains('info-box-expanded')) {
      if (Date.now() - lastExpandTime < DEBOUNCE_MS) return;
      closeInfoBox(container);
      return;
    }

    container.classList.add('info-box-expanded');
    document.body.style.overflow = 'hidden';
    lastExpandTime = Date.now();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll(EXPANDED_SELECTOR).forEach(closeInfoBox);
  });
}

if (ExecutionEnvironment.canUseDOM) {
  initInfoBoxExpand();
}

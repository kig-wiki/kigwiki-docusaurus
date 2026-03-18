import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

const DEBOUNCE_MS = 320;

function initInfoBoxExpand() {
  let lastExpandTime = 0;

  document.addEventListener('click', (e) => {
    const expandedContainer = e.target.closest(
      '.info-box-container.info-box-expanded, .info-box-container-large.info-box-expanded'
    );

    if (e.target === expandedContainer) {
      expandedContainer.classList.remove('info-box-expanded');
      return;
    }

    const image = e.target.closest('.info-box-image');
    if (!image) return;
    const container = image.closest('.info-box-container, .info-box-container-large');
    if (!container) return;

    if (container.classList.contains('info-box-expanded')) {
      if (Date.now() - lastExpandTime < DEBOUNCE_MS) return;
    }
    container.classList.toggle('info-box-expanded');
    if (container.classList.contains('info-box-expanded')) {
      lastExpandTime = Date.now();
    }
  });
}

if (ExecutionEnvironment.canUseDOM) {
  initInfoBoxExpand();
}

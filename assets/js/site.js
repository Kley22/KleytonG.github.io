/* Small, progressively enhanced controls. No visitor data is collected. */
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');

if (menuButton && navigation) {
  menuButton.hidden = false;
  navigation.classList.add('enhanced');
  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('open');
  };
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('open', open);
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navigation.classList.contains('open')) {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
}

const filters = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('.project-card')];
const filterStatus = document.querySelector('#filter-status');

filters.forEach(button => {
  button.hidden = false;
  button.addEventListener('click', () => {
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    let count = 0;
    cards.forEach(card => {
      const categories = (card.dataset.category || '').split(/\s+/);
      card.hidden = button.dataset.filter !== 'all' && !categories.includes(button.dataset.filter);
      if (!card.hidden) count++;
    });
    if (filterStatus) {
      filterStatus.textContent = count === 1 ? '1 projeto exibido.' : `${count} projetos exibidos.`;
    }
  });
});

// Every panel starts visible in the HTML. Hide alternatives only after checking
// that this explorer has a complete, local button-to-panel relationship.
document.querySelectorAll('[data-explorer]').forEach(explorer => {
  const controls = [...explorer.querySelectorAll('button[data-panel]')];
  const panels = [...explorer.querySelectorAll('.explorer-panel')];
  const targets = controls.map(button => panels.find(panel => panel.id === button.dataset.panel));
  if (!controls.length || targets.some(panel => !panel) || new Set(targets).size !== panels.length) return;

  const selectPanel = button => {
    controls.forEach(control => control.setAttribute('aria-pressed', String(control === button)));
    panels.forEach(panel => { panel.hidden = panel.id !== button.dataset.panel; });
  };
  const initial = controls.find(button => button.getAttribute('aria-pressed') === 'true') || controls[0];
  controls.forEach((button, index) => {
    button.hidden = false;
    button.setAttribute('aria-controls', targets[index].id);
    button.addEventListener('click', () => selectPanel(button));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % controls.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + controls.length) % controls.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = controls.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectPanel(controls[next]);
      controls[next].focus();
    });
  });
  explorer.classList.add('enhanced');
  selectPanel(initial);
});

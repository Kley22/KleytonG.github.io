const button = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
if (button && nav) {
  button.hidden = false;
  nav.classList.add('enhanced');
  const close = () => {button.setAttribute('aria-expanded','false'); nav.classList.remove('open');};
  button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && nav.classList.contains('open')) {close();button.focus();}});
  document.addEventListener('click',event=>{if(!event.target.closest('.site-header')) close();});
}
const filters = document.querySelectorAll('[data-filter]');
filters.forEach(button=>{
  button.hidden=false;
  button.addEventListener('click',()=>{
    filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    let count=0;
    document.querySelectorAll('.project-card').forEach(card=>{
      card.hidden=button.dataset.filter!=='all' && !card.dataset.category.split(' ').includes(button.dataset.filter);
      if(!card.hidden) count++;
    });
    document.querySelector('#filter-status').textContent=`${count} projetos exibidos.`;
  });
});

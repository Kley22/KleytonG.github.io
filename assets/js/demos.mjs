const financial = new Set(['vigencia-contratual', 'previsao-contratual', 'pagamentos']);
for (const root of document.querySelectorAll('[data-demo]')) {
  try {
    const {mount} = await import(financial.has(root.dataset.demo) ? './finance-demo.mjs' : './operations-demo.mjs');
    mount(root.dataset.demo, root);
    root.dataset.ready = 'true';
  } catch (error) {
    root.replaceChildren();
    const message = document.createElement('p');
    message.className = 'demo-error';
    message.textContent = 'Não foi possível abrir a demonstração. Recarregue a página para tentar novamente.';
    root.append(message);
    console.error('Falha na demonstração:', error);
  }
}

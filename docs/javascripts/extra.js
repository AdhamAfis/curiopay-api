// Mermaid configuration for MkDocs Material
document$.subscribe(function () {
  // Load Mermaid
  if (typeof mermaid === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/mermaid@10/dist/mermaid.min.js';
    script.onload = function () {
      mermaid.initialize({
        startOnLoad: true,
        theme:
          document.body.getAttribute('data-md-color-scheme') === 'slate'
            ? 'dark'
            : 'default',
      });
      mermaid.init();
    };
    document.head.appendChild(script);
  } else {
    // Reinitialize Mermaid for new content
    mermaid.initialize({
      startOnLoad: true,
      theme:
        document.body.getAttribute('data-md-color-scheme') === 'slate'
          ? 'dark'
          : 'default',
    });
    mermaid.init();
  }
});

// Theme change handler for Mermaid
const observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (
      mutation.type === 'attributes' &&
      mutation.attributeName === 'data-md-color-scheme'
    ) {
      if (typeof mermaid !== 'undefined') {
        const isDark =
          document.body.getAttribute('data-md-color-scheme') === 'slate';
        mermaid.initialize({
          startOnLoad: true,
          theme: isDark ? 'dark' : 'default',
        });
        // Redraw all mermaid diagrams
        document.querySelectorAll('.mermaid').forEach(function (element) {
          element.removeAttribute('data-processed');
        });
        mermaid.init();
      }
    }
  });
});

observer.observe(document.body, {
  attributes: true,
  attributeFilter: ['data-md-color-scheme'],
});

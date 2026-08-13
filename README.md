# Video Tuner

Extensão Chrome (Manifest V3) que coloca um controle de **velocidade** e **volume** sobre os vídeos de qualquer site.

## Como funciona

- Passe o mouse sobre um vídeo → aparece um selo discreto no canto (configurável) com os valores atuais.
- Passe o mouse **no selo** → ele expande com os sliders e presets, mais um botão *Voltar ao padrão*.
- O ajuste vale **só para aquele vídeo**. Nada é persistido: os outros vídeos da página, e a próxima visita, seguem o padrão do site.
- Um vídeo que nunca foi ajustado não é tocado — o volume e a velocidade que o próprio player definiu ficam intactos.

O ícone da extensão abre a **tela de configuração** (no lugar do popup, sem página separada):

- quais controles aparecem no overlay: velocidade, volume, ou os dois;
- em qual canto do vídeo o overlay fica (superior/inferior, esquerdo/direito).

Essa configuração é global e aplicada na hora, em todas as abas abertas.

## Recursos

- **Velocidade** de 0.25x a 8x pelo overlay (0.07x a 16x via atalhos), com presets até 8x.
- **Volume de 0% a 600%** — acima de 100% o áudio é amplificado por um `GainNode` do WebAudio.
- **Atalhos de teclado** globais, aplicados ao vídeo sob o ponteiro (ou, na falta dele, ao maior vídeo visível que esteja tocando):
  | Atalho | Ação |
  | --- | --- |
  | `Ctrl+Shift+.` | +0.25x |
  | `Ctrl+Shift+,` | −0.25x |
  | `Ctrl+Shift+0` | volta para 1x |
- Funciona em SPAs (YouTube, Netflix etc.): o `MutationObserver` encontra vídeos novos, e um `<video>` reaproveitado para outra mídia volta ao padrão (evento `emptied`).
- Varre também **Shadow DOM**, cobrindo players customizados.
- Overlay imune ao CSS do site (Shadow DOM) e funcional em fullscreen.

## Build

Overlay e tela de configuração são feitos em **React** e passam por **Vite**, então a extensão precisa ser compilada antes de ser carregada.

```bash
npm install
npm run build         # gera dist/ (configuração + content script)
npm run dev:popup     # rebuild automático da tela de configuração
npm run dev:content   # rebuild automático do content script
```

São dois builds porque content scripts do MV3 não aceitam ES modules: a tela de configuração sai como módulo com code splitting e o content script como um único IIFE (`dist/content.js`).

## Instalação (modo desenvolvedor)

1. `npm install && npm run build`.
2. Abra `chrome://extensions`.
3. Ative **Modo do desenvolvedor**.
4. **Carregar sem compactação** → selecione a pasta **`dist`**.

Depois de um `npm run build`, clique em **Atualizar** no card da extensão.

## Estrutura

```
popup.html                  # entrada HTML da tela de configuração
vite.config.js              # build da tela de configuração
vite.content.config.js      # build do content script (IIFE)
src/
  ui.css                    # tema + controles, compartilhado (`:root` e `:host`)
  settings.js               # configuração global: leitura, escrita e watch no storage
  useSettings.js            # hook reativo em cima do settings.js
  components/               # Control, Presets, Toggle, CornerPicker
  popup/
    main.jsx                # bootstrap do React
    App.jsx                 # tela de configuração
    popup.css               # estrutura só dessa tela
  content/
    index.jsx               # cria o div do overlay e monta o React no Shadow DOM
    engine.js               # estado por vídeo, WebAudio, atalhos, store observável
    Overlay.jsx             # selo + painel expansível
    useHoveredVideo.js      # qual vídeo está sob o ponteiro (hit test geométrico)
    usePlacement.js         # reparenta e posiciona o div no canto escolhido
    overlay.css             # selo/painel (injetado inline no shadow root)
public/                     # copiado para dist/ sem transformação
  manifest.json             # MV3: permissões, content script, commands
  background.js             # service worker: atalhos de teclado
  icons/                    # ícones 16/48/128
dist/                       # build final — é esta pasta que se carrega no Chrome
```

O overlay é **um único div `position: absolute`** para toda a página. Ele é reparentado para o container do vídeo sob o ponteiro, o que mantém o estado do React e dispensa recalcular posição em scroll ou fullscreen — o offset é relativo ao pai. Se esse pai for `position: static`, ele recebe `relative` temporariamente (restaurado quando o overlay sai).

O `engine.js` guarda os ajustes num `WeakMap` por elemento e expõe um store observável (`subscribe`/`getState`) consumido via `useSyncExternalStore`, então mudanças por atalho de teclado aparecem no overlay na hora.

## Limitações conhecidas

O overlay leva o React para dentro de cada página (`dist/content.js`, ~200 kB / ~65 kB gzip). É um custo por página; se isso pesar, o caminho é carregar o overlay sob demanda como recurso web-acessível.

Vídeos menores que 160×90 px não recebem overlay — evita que thumbnails e anúncios ganhem um painel.

Como nada é persistido, recarregar a página zera os ajustes. É o comportamento pedido: configuração por vídeo, padrão para o resto.

O boost acima de 100% usa `createMediaElementSource`. Se a mídia for **cross-origin sem cabeçalhos CORS**, o navegador silencia o áudio nesse caminho; nesse caso a extensão detecta a falha e mantém o volume nativo (máximo 100%). Streams via MSE/blob (YouTube, Netflix, Twitch, Vimeo) não são afetados.

## Licença

MIT

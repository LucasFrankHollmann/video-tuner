# Video Tuner

Extensão Chrome (Manifest V3) para controlar **velocidade** e **volume** de vídeos em qualquer site.

## Recursos

- **Velocidade** de 0.25x a 4x pelo popup (0.07x a 16x via mensagem/atalhos), com presets rápidos.
- **Volume de 0% a 600%** — acima de 100% o áudio é amplificado por um `GainNode` do WebAudio.
- **Memória por site**: cada domínio guarda sua última configuração (pode ser desligado no popup).
- **Atalhos de teclado** globais:
  | Atalho | Ação |
  | --- | --- |
  | `Ctrl+Shift+.` | +0.25x |
  | `Ctrl+Shift+,` | −0.25x |
  | `Ctrl+Shift+0` | volta para 1x |
- Funciona em SPAs (YouTube, Netflix etc.): `MutationObserver` + detecção de troca de URL reaplicam a configuração em vídeos novos.
- Varre também **Shadow DOM**, cobrindo players customizados.
- Overlay discreto na página confirmando cada mudança.

## Instalação (modo desenvolvedor)

1. Abra `chrome://extensions`.
2. Ative **Modo do desenvolvedor**.
3. **Carregar sem compactação** → selecione a pasta `video-tuner`.

## Estrutura

```
manifest.json        # MV3: permissões, content script, commands
background.js        # service worker: atalhos de teclado
content/content.js   # aplica speed/volume, WebAudio, persistência, overlay
popup/               # UI (html/css/js)
icons/               # ícones 16/48/128
```

## Limitação conhecida

O boost acima de 100% usa `createMediaElementSource`. Se a mídia for **cross-origin sem cabeçalhos CORS**, o navegador silencia o áudio nesse caminho; nesse caso a extensão detecta a falha e mantém o volume nativo (máximo 100%). Streams via MSE/blob (YouTube, Netflix, Twitch, Vimeo) não são afetados.

## Licença

MIT

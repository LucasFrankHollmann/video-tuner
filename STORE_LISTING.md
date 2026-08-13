# Publicação na Chrome Web Store

Tudo o que o cadastro pede, já preenchido. Os textos que vão para a loja estão **em inglês**, prontos para colar; as instruções em volta ficam em pt-BR. O que só você pode fazer está marcado com **[você]**.

## 1. Antes de começar

- **[você]** Conta de desenvolvedor no [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) — taxa **única de US$ 5** por conta (não por extensão).
- **[você]** GitHub Pages ligado para a política de privacidade: *Settings → Pages → Branch `main`, pasta `/docs`*. A URL fica `https://lucasfrankhollmann.github.io/video-tuner/`. Confirme que abre antes de enviar — a Store valida o link. A página tem um resumo em inglês no fim, que é o que o revisor vai ler.

## 2. Gerar o pacote

```bash
npm install
npm run build
powershell -ExecutionPolicy Bypass -File scripts/zip.ps1
```

Sai `video-tuner-<versão>.zip` na raiz, com o `manifest.json` na raiz do zip (é o que a Store exige).

> Não troque o script por `Compress-Archive`: no Windows PowerShell 5.1 ele grava os caminhos internos com barra invertida, fora da especificação do ZIP, e o upload falha ou desempacota errado.

## 3. Ficha da loja (Store listing)

| Campo | Valor |
| --- | --- |
| **Name** | `Video Tuner` |
| **Summary** (máx. 132 caracteres) | `Control playback speed (up to 8x) and volume (up to 600%) right on top of the video, on any site.` (97 caracteres) |
| **Category** | Tools |
| **Default language** | English (United States) |
| **Website URL** | `https://github.com/LucasFrankHollmann/video-tuner` |
| **Support URL** | `https://github.com/LucasFrankHollmann/video-tuner/issues` |

O campo *Summary* vem pré-preenchido com a `description` do manifest, que está em pt-BR. Substitua pelo texto em inglês acima.

### Description (colar como está)

```
Control the speed and volume of any video without leaving the page.

Hover a video and a small badge appears in the corner. Hover the badge and it expands into the controls — sliders and presets, right on top of the player.

FEATURES

• Playback speed from 0.25x to 8x, with presets at 0.5x, 1x, 1.5x, 2x, 4x and 8x.
• Volume from 0% to 600%. Above 100% the audio is amplified through the Web Audio API — handy for quietly recorded videos.
• Per-video settings: what you change applies only to that video. Every other video on the page keeps the site's own behavior.
• A video you never adjusted is left untouched — the volume the site set stays exactly as it was.
• A "back to default" button that restores the precise values from before your adjustment.
• Works on any site, including custom players built with Shadow DOM, and in fullscreen.
• Works on single-page apps (YouTube, Netflix and the like): new videos are picked up automatically.
• Keyboard shortcuts: Ctrl+Shift+. to speed up, Ctrl+Shift+, to slow down, Ctrl+Shift+0 to return to 1x.

SETTINGS

The extension icon opens a settings screen where you choose which controls the overlay shows (speed, volume, or both) and which corner of the video it sits in.

PRIVACY

No data is collected, transmitted, or sold. The extension makes no network requests and contains no analytics or trackers. The only thing stored is your display preference, in the browser's own local storage.

Open source (MIT): https://github.com/LucasFrankHollmann/video-tuner
```

## 4. Imagens

| Item | Especificação | Situação |
| --- | --- | --- |
| Ícone | 128×128 PNG | Pronto: `public/icons/icon128.png` (vai dentro do zip) |
| Capturas de tela | 1280×800 ou 640×400, PNG ou JPEG, de 1 a 5 | **[você]** — falta gerar |
| Bloco promocional pequeno | 440×280 PNG | Opcional; sem ele a Store usa o ícone |
| Bloco promocional grande | 1400×560 PNG | Opcional, só para destaque editorial |

**[você]** As capturas precisam sair do navegador de verdade. Sugestão de 3, cobrindo o que a extensão faz:

1. Selo recolhido no canto de um vídeo em reprodução.
2. Painel expandido, mostrando os sliders de velocidade e volume sobre o vídeo.
3. A tela de configuração aberta (clique no ícone da extensão).

Enquadre em 1280×800. Prefira um vídeo sem conteúdo de terceiros identificável na tela.

> A interface da extensão está em pt-BR. Como a ficha está em inglês, vale considerar traduzir a UI antes de gerar as capturas — ou aceitar que as imagens mostrem rótulos em português.

## 5. Práticas de privacidade

**Single purpose:**

```
Adjust the playback speed and volume of videos on the page the user is viewing, through a control overlaid on the video itself.
```

**Justificativa de cada permissão:**

| Permissão | Justificativa (colar) |
| --- | --- |
| `storage` | `Stores only the user's display preference: which controls the overlay shows and which corner of the video it sits in. Nothing else is stored, and nothing leaves the device.` |
| `activeTab` | `The keyboard shortcuts need to identify the active tab in order to apply the speed change to the video the user is currently watching.` |
| Acesso a todos os sites (`host_permissions` / content script em `<all_urls>`) | `Videos exist on any website, and the extension's entire purpose is to control the video wherever it happens to be. The access is used only to inject the script that locates video elements and changes their playbackRate and volume properties, and to draw the overlaid control. The extension does not read page content, does not access cookies, history or form data, and sends nothing to any server — it makes no network requests at all.` |

**Are you using remote code?** *No, I am not using remote code.* Todo o JavaScript vai dentro do pacote; a extensão não carrega script externo nem usa `eval`.

**Data collection:** não marcar nenhuma categoria. Depois marque as três declarações:

- I do not sell or transfer user data to third parties, outside of the approved use cases;
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose;
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** `https://lucasfrankhollmann.github.io/video-tuner/`

## 6. Distribuição

- Visibility: **Public**.
- Regiões: todas.
- Não contém anúncios; não é destinada a crianças.

## 7. Notes for the reviewer (campo opcional, ajuda)

```
Open source: https://github.com/LucasFrankHollmann/video-tuner

How to test: open any site with a video (youtube.com, for example) and hover the video. A badge appears in the corner; hover it and the panel expands with the speed and volume controls. The extension icon opens the settings screen.

Broad site access is required because the extension has to locate the video element on any page. It only reads and writes playbackRate and volume on those elements and draws its overlay inside a Shadow DOM. There are no network requests, no remote code, no analytics, and no data collection.

Note: the extension's user interface is in Brazilian Portuguese.
```

## 8. Depois de enviar

A revisão costuma levar de algumas horas a alguns dias; extensões que pedem acesso a todos os sites tendem a ficar no lado mais longo.

Para publicar uma atualização: suba a `version` em `public/manifest.json`, rode `npm run build` e o `scripts/zip.ps1`, e envie o novo zip no mesmo item da Store. Toda versão passa por nova revisão.

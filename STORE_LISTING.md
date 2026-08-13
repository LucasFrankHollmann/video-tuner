# Publicação na Chrome Web Store

Tudo o que o cadastro pede, já preenchido. O que só você pode fazer está marcado com **[você]**.

## 1. Antes de começar

- **[você]** Conta de desenvolvedor no [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) — taxa **única de US$ 5** por conta (não por extensão).
- **[você]** GitHub Pages ligado para a política de privacidade: *Settings → Pages → Branch `main`, pasta `/docs`*. A URL fica `https://lucasfrankhollmann.github.io/video-tuner/`. Confirme que abre antes de enviar — a Store valida o link.

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
| **Nome** | `Video Tuner` |
| **Resumo** (máx. 132 caracteres) | `Controle a velocidade (até 8x) e o volume (até 600%) direto sobre o vídeo, em qualquer site.` (95 caracteres) |
| **Categoria** | Ferramentas *(Tools)* |
| **Idioma padrão** | Português (Brasil) |
| **URL do site** | `https://github.com/LucasFrankHollmann/video-tuner` |
| **URL de suporte** | `https://github.com/LucasFrankHollmann/video-tuner/issues` |

### Descrição detalhada (colar como está)

```
Controle a velocidade e o volume de qualquer vídeo sem sair da página.

Passe o mouse sobre um vídeo e um selo discreto aparece no canto. Passe o mouse no selo e ele expande com os controles — sliders e presets, ali mesmo sobre o player.

RECURSOS

• Velocidade de 0,25x a 8x, com presets de 0,5x, 1x, 1,5x, 2x, 4x e 8x.
• Volume de 0% a 600%. Acima de 100% o áudio é amplificado pela Web Audio API, útil para vídeos gravados baixo.
• Ajuste por vídeo: o que você muda vale só para aquele vídeo. Os outros da página seguem o padrão do site.
• Um vídeo que você nunca ajustou não é tocado — o volume que o próprio site definiu continua valendo.
• Botão "voltar ao padrão" que restaura exatamente os valores de antes do seu ajuste.
• Funciona em qualquer site, inclusive players customizados que usam Shadow DOM, e em tela cheia.
• Funciona em sites de página única (YouTube, Netflix e afins): vídeos novos são detectados automaticamente.
• Atalhos de teclado: Ctrl+Shift+. para acelerar, Ctrl+Shift+, para desacelerar, Ctrl+Shift+0 para voltar a 1x.

CONFIGURAÇÃO

O ícone da extensão abre uma tela onde você escolhe quais controles aparecem no overlay (velocidade, volume ou os dois) e em qual canto do vídeo ele fica.

PRIVACIDADE

Nenhum dado é coletado, transmitido ou vendido. A extensão não faz requisição de rede nenhuma, não tem analytics nem rastreadores. A única coisa gravada é a sua preferência de exibição, no armazenamento local do próprio navegador.

Código aberto (MIT): https://github.com/LucasFrankHollmann/video-tuner
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

## 5. Práticas de privacidade

**Finalidade única** (campo *Single purpose*):

```
Ajustar a velocidade de reprodução e o volume dos vídeos da página em que o usuário está, por meio de um controle sobreposto ao próprio vídeo.
```

**Justificativa de cada permissão:**

| Permissão | Justificativa (colar) |
| --- | --- |
| `storage` | `Guarda apenas a preferência de exibição do usuário: quais controles aparecem no overlay e em qual canto do vídeo. Nada além disso é gravado, e nada é enviado para fora do dispositivo.` |
| `activeTab` | `Os atalhos de teclado precisam identificar a aba ativa para aplicar a mudança de velocidade ao vídeo que o usuário está assistindo naquele momento.` |
| Acesso a todos os sites (`host_permissions` / content script em `<all_urls>`) | `Vídeos existem em qualquer site, e a função da extensão é justamente controlar o vídeo onde ele estiver. O acesso é usado apenas para inserir o script que localiza elementos de vídeo e altera as propriedades playbackRate e volume, e para desenhar o controle sobreposto. A extensão não lê o conteúdo das páginas, não acessa cookies, histórico ou formulários, e não envia nada para servidor nenhum — não faz requisição de rede.` |

**Uso de código remoto:** *Não, não uso código remoto.* Todo o JavaScript vai dentro do pacote; a extensão não carrega script externo nem usa `eval`.

**Coleta de dados:** não marcar nenhuma categoria. Depois marque as três declarações:

- não vendo nem transfiro dados a terceiros fora dos casos aprovados;
- não uso nem transfiro dados para finalidade alheia à função principal da extensão;
- não uso nem transfiro dados para avaliar crédito ou conceder empréstimos.

**URL da política de privacidade:** `https://lucasfrankhollmann.github.io/video-tuner/`

## 6. Distribuição

- Visibilidade: **Pública**.
- Regiões: todas (ou só Brasil, se preferir começar pequeno — a ficha está em pt-BR).
- Não contém anúncios; não é destinada a crianças.

## 7. Notas para o revisor (campo opcional, ajuda)

```
Extensão de código aberto: https://github.com/LucasFrankHollmann/video-tuner

Como testar: abra qualquer site com vídeo (por exemplo youtube.com) e passe o mouse sobre o vídeo. Um selo aparece no canto inferior esquerdo; passe o mouse nele e o painel expande com os controles de velocidade e volume. O ícone da extensão abre a tela de configuração.

O acesso amplo a sites é necessário porque a extensão precisa localizar o elemento de vídeo em qualquer página. Ela apenas lê e altera playbackRate e volume desses elementos e desenha o overlay em Shadow DOM. Não há requisição de rede, código remoto, analytics ou coleta de dados.
```

## 8. Depois de enviar

A revisão costuma levar de algumas horas a alguns dias; extensões que pedem acesso a todos os sites tendem a ficar no lado mais longo.

Para publicar uma atualização: suba a `version` em `public/manifest.json`, rode `npm run build` e o `scripts/zip.ps1`, e envie o novo zip no mesmo item da Store. Toda versão passa por nova revisão.

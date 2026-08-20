# Assets esperados nesta pasta

Exportados do Figma ("Black Box do Zé - Pages", telas Desk + Phone).
Salve os arquivos com exatamente estes nomes -- o código já referencia
esses caminhos, então assim que o arquivo aparecer aqui ele entra no ar
sem eu precisar tocar em código:

| Arquivo | De onde vem no Figma | Usado em |
|---|---|---|
| `desktop-hero.webp` ✅ | Foto dos dois caras na mesa (camada "Gemini_Generated_Image_yrlmjsyrlmjsyrlm") | `DesktopHero` (fundo full-bleed) |
| `mobile-hero.webp` ✅ | Foto do "vulto atrás do vidro" (camada "image 52") | `MobileLinkBio` (fundo do topo) |
| `icon-community.webp` ✅ | Ícone da caveira do card "Carbmaxxing Community" | `MobileLinkBio` (1º card) |
| `icon-auralab.webp` ✅ | Ícone do "A" do card "Baixe o Auralab" | `MobileLinkBio` (2º card) |
| `icon-tiktok.webp` ✅ | Ícone da notinha musical do card "Siga-me no Tiktok" | `MobileLinkBio` (3º card) |
| `logo-mark.svg` ✅ | Logo pequena "Z" no topo da tela mobile | `MobileLinkBio` (topo) |
| `card-texture.png` ✅ | Textura de grunge repetida | `MobileLinkBio` (overlay dos 3 cards, mix-blend-overlay) |

Ainda falta: `icon-community.png`/`icon-auralab.png`/`icon-tiktok.png` em
PNG puro não são necessários -- os `.webp` com fundo transparente já
funcionam igual. Formatos: os ícones têm fundo transparente (RGBA); a
textura é um PNG pequeno pensado pra repetir (`background-repeat`), não
pra esticar.

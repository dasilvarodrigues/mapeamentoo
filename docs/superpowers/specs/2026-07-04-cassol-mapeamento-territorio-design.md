# Cassol Mapeamento Regional — Cadastro Territorial

## Visão Geral

Módulo de cadastro hierárquico completo do território, partindo de Estado até nível de Rua e ponto GPS. Complementa o dashboard executivo com capacidade de gestão e edição da base territorial.

## Hierarquia

```
Estado → Município → Distrito → Bairro → Comunidade → Setor → Rua
```

## Modelo de Dados (expansão)

```prisma
model Estado {
  id        String      @id
  nome      String
  uf        String      @unique @db.VarChar(2)
  municipios Municipio[]
}

model Municipio {
  id        String   @id @default(cuid())
  nome      String
  estadoId  String
  estado    Estado   @relation(fields: [estadoId], references: [id])
  bairros   Bairro[]
}

// Bairro existente ganha municipioId
model Bairro {
  // campos existentes +
  municipioId String?
  municipio   Municipio? @relation(fields: [municipioId], references: [id])
}

model Setor {
  id       String @id @default(cuid())
  nome     String
  bairroId String
  bairro   Bairro @relation(fields: [bairroId], references: [id])
}

model Rua {
  id        String  @id @default(cuid())
  nome      String
  cep       String?
  latitude  Float?
  longitude Float?
  bairroId  String
  bairro    Bairro  @relation(fields: [bairroId], references: [id])
}
```

## Funcionalidades

- CRUD completo em todos os níveis hierárquicos
- Mapa Leaflet em tela cheia com alternância de camadas
- Desenho de polígonos com Leaflet.draw
- Marcação de pontos via GPS do navegador
- Geocoding reverso via Nominatim (OpenStreetMap)
- Importação de arquivos GeoJSON, KML, KMZ
- Barra de navegação hierárquica (breadcrumb)

## Stack

- Leaflet + react-leaflet + leaflet.draw
- File input + biblioteca de parsing GIS (shpjs para Shapefile, togeojson para KML)
- Nominatim API para geocoding reverso
- React Hook Form para formulários
- ShadCN UI (Dialog, Select, Input)

## Componentes

| Componente | Responsabilidade |
|---|---|
| ArvoreHierarquica | Navegação lateral em árvore |
| MapaTerritorial | Mapa fullscreen com Leaflet |
| FormularioLocalidade | Formulário dinâmico por nível |
| ModalImportacao | Upload + parser GIS |
| BreadcrumbTerritorio | Navegação hierárquica |


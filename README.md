# Balanças Apps LUMAK

Este repositório contém dois aplicativos móveis desenvolvidos para o ecossistema de balanças LUMAK, ambos desenvolvidos com Apache Cordova para Android.

## Aplicativos Disponíveis

### 1. LUMAK BALANÇAS

Aplicativo principal para operação diária de pesagem de animais, com recursos de armazenamento, histórico e impressão via Bluetooth.

**Funcionalidades:**
- Conexão com balança via Bluetooth
- Registro de pesagens com identificação por brinco/nome do animal
- Histórico completo de pesagens
- Exportação de dados em arquivo CSV
- Impressão via Bluetooth para impressoras térmicas
- Configuração de cabeçalho para impressão
- Calibração de balança para medições precisas

[Ver detalhes](./BalancaLumaApp/README.md)

### 2. LUMAK DIAGNÓSTICO

Aplicativo de suporte técnico para diagnóstico e verificação de balanças, permitindo testar componentes específicos.

**Funcionalidades:**
- Escaneamento e conexão a dispositivos Bluetooth
- Teste da comunicação serial da balança
- Teste da célula de carga (leitura de milivolts)
- Atualização em tempo real dos valores
- Interface especializada para técnicos e suporte

[Ver detalhes](./DiagnosticoBalanca/README.md)

## Requisitos

- Android 6.0 ou superior
- Bluetooth 4.0 ou superior
- Permissões de localização para escaneamento Bluetooth

## Desenvolvimento

Ambos os aplicativos usam a mesma base tecnológica:
- Apache Cordova como framework base
- HTML5, CSS3 e JavaScript para interface
- Plugins nativos para funcionalidades específicas como Bluetooth e gerenciamento de arquivos

## Instalação Rápida

```bash
# Para o aplicativo principal
cd BalancaLumaApp
cordova build android

# Para o aplicativo de diagnóstico
cd DiagnosticoBalanca
./install.sh
```

## Licença

Apache License 2.0
# CordovaApps

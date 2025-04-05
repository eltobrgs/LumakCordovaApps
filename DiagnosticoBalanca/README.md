# LUMAK DIAGNÓSTICO

Aplicativo para diagnóstico de balanças via Bluetooth, desenvolvido com Cordova.

## Funcionalidades

- **Escanear por dispositivos BLE** - Encontre dispositivos Bluetooth BLE disponíveis.
- **Teste Serial** - Visualize os dados recebidos pela conexão serial da balança.
- **Teste Célula** - Visualize a leitura da célula de carga em milivolts.

## Requisitos

- Android 6.0 ou superior
- Bluetooth 4.0 ou superior (BLE)
- Permissões de Bluetooth e Localização

## Desenvolvimento

O aplicativo utiliza as seguintes tecnologias e plugins:

- Cordova como framework base
- Plugin BLE Central para comunicação Bluetooth
- Plugin de Vibração para feedback tátil
- Plugin de Permissões para Android

### Comandos para desenvolvimento

```bash
# Instalar dependências
npm install

# Adicionar plataforma Android
cordova platform add android

# Compilar o aplicativo
cordova build android

# Executar em um dispositivo conectado
cordova run android
```

## UUIDs Bluetooth

O aplicativo se comunica com dispositivos que implementam o serviço Environmental Sensing (0x181A) e possui características específicas:

- `00002A6E-0000-1000-8000-00805F9B34FB` - Para dados de serial
- `00002A6F-0000-1000-8000-00805F9B34FB` - Para dados de célula de carga (mV)

## Detalhes de Implementação

O dispositivo ESP32 conectado à balança deve fornecer duas características Bluetooth:

1. Uma para transmitir os dados recebidos pela porta serial da balança
2. Outra para transmitir as leituras em milivolts da célula de carga

## Licença

Apache License 2.0 
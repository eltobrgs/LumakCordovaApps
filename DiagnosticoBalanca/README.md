# LUMAK DIAGNÓSTICO

Aplicativo de diagnóstico para técnicos e suporte da LUMAK, permitindo testar e avaliar os componentes das balanças, com foco nos dados da comunicação serial e nos valores brutos da célula de carga. Desenvolvido com Apache Cordova para Android.

## 📊 Propósito

O aplicativo LUMAK DIAGNÓSTICO foi desenvolvido especificamente para técnicos e equipe de suporte, com o objetivo de diagnosticar problemas em balanças. Diferente do aplicativo principal (LUMAK BALANÇAS), este foca em fornecer acesso direto aos valores brutos dos sensores e comunicação, permitindo verificar se os problemas estão no hardware ou no processamento dos dados.

## 🔍 Funcionalidades

- **Escaneamento BLE**: Encontre rapidamente dispositivos Bluetooth LE disponíveis.
- **Teste Serial**: Visualize em tempo real os dados brutos recebidos pela porta serial da balança, permitindo identificar problemas na comunicação.
- **Teste Célula**: Monitore os valores em milivolts (mV) diretamente da célula de carga, possibilitando diagnosticar se o sensor está funcionando corretamente.
- **Atualização Automática**: Receba atualizações em tempo real (a cada 2 segundos) dos valores medidos.
- **Atualização Manual**: Utilize o botão de atualização para forçar uma nova leitura quando necessário.

## 🔧 Casos de Uso

### Diagnóstico de Problemas na Comunicação Serial

- Se o display da balança não mostra o peso mas o teste de célula mostra valores em mV, pode haver um problema no processamento dos dados.
- Se o teste serial não recebe dados, mas a balança parece funcionar normalmente, pode haver um problema na conexão serial.

### Diagnóstico de Problemas na Célula de Carga

- Se o teste de célula não apresenta variação ao colocar peso na balança, pode indicar célula com falha.
- Se os valores em mV variam muito sem peso adicional, pode indicar instabilidade ou interferência elétrica.

### Verificação de Calibração

- Usando um peso conhecido, observe os valores brutos em mV para verificar a resposta linear da célula.
- Compare com valores esperados para determinar se a calibração está dentro dos parâmetros aceitáveis.

## 📱 Como Usar

### Conexão ao Dispositivo

1. Na tela inicial, toque em "Conectar"
2. Toque em "Escanear" para buscar dispositivos Bluetooth BLE próximos
3. Selecione o dispositivo ESP32 da balança na lista
4. Toque em "Conectar" para estabelecer conexão
5. Após conectado, você será redirecionado para a tela inicial

### Teste Serial

1. Na tela inicial, toque em "Teste Serial"
2. O aplicativo começará a ler automaticamente a cada 2 segundos os dados da porta serial
3. Os dados serão exibidos na tela, mostrando as informações brutas recebidas
4. Para forçar uma nova leitura, toque em "Atualizar"
5. Quando terminar, toque em "Voltar" para retornar à tela inicial

### Teste de Célula de Carga

1. Na tela inicial, toque em "Teste Célula"
2. O aplicativo começará a ler automaticamente a cada 2 segundos os valores em milivolts
3. Os valores em mV serão exibidos na tela, mostrando a leitura bruta da célula de carga
4. Para forçar uma nova leitura, toque em "Atualizar"
5. Quando terminar, toque em "Voltar" para retornar à tela inicial

## 🧪 Interpretação dos Resultados

### Valores de Referência da Comunicação Serial

- Em condições normais, os dados da porta serial devem seguir um padrão específico, geralmente incluindo o valor do peso.
- Caracteres aleatórios ou dados corrompidos podem indicar problemas de baudrate ou configuração incorreta.

### Valores de Referência da Célula de Carga

- Células de carga típicas apresentam valores entre 0 e 2-3 mV/V.
- Com alimentação de 5V, espera-se leituras entre 0 e 15mV para a faixa de peso suportada.
- Valores negativos podem indicar inversão na instalação da célula.
- Valores que não variam com o peso indicam possível dano no sensor.

## 🔌 UUIDs Bluetooth

O aplicativo se comunica com dispositivos que implementam:

- **Service UUID**: 0000181A-0000-1000-8000-00805F9B34FB (Environmental Sensing)
- **Characteristic UUID (Serial)**: 00002A6E-0000-1000-8000-00805F9B34FB
- **Characteristic UUID (Célula)**: 00002A6F-0000-1000-8000-00805F9B34FB

## 📋 Requisitos Técnicos

- **Dispositivo**: Android 6.0 ou superior
- **Bluetooth**: Versão 4.0 ou superior com suporte a BLE
- **Permissões**: Bluetooth, Bluetooth Admin, Bluetooth Scan, Bluetooth Connect, Localização

## 🔌 Plugins Usados

- cordova-plugin-ble-central: Para comunicação Bluetooth BLE
- cordova-plugin-android-permissions: Para gerenciamento de permissões
- cordova-plugin-device: Para informações do dispositivo
- cordova-plugin-vibration: Para feedback tátil

## 🏗️ Compilação

```bash
# Método rápido (usando o script de instalação)
chmod +x install.sh
./install.sh

# Método manual
npm install
cordova platform add android
cordova plugin add cordova-plugin-ble-central
cordova plugin add cordova-plugin-android-permissions
cordova plugin add cordova-plugin-device
cordova plugin add cordova-plugin-vibration
cordova build android
```

## 🔄 Compatibilidade com o ESP32

Este aplicativo é projetado para comunicar-se com o firmware ESP32 que implementa as características BLE específicas para diagnóstico de balanças. O código do ESP32 deve configurar o serviço e as características com os UUIDs corretos para garantir compatibilidade.

## 📄 Licença

Apache License 2.0 
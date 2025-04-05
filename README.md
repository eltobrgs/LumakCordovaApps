# Balança LUMAK App

Aplicativo móvel para gerenciamento de pesagem de animais, com suporte a comunicação Bluetooth com balanças da LUMAK. Desenvolvido com Apache Cordova para Android.

## 📱 Funcionalidades

- **Conexão Bluetooth com Balanças**: Conecte-se facilmente a balanças LUMAK compatíveis via Bluetooth BLE.
- **Registro de Pesagens**: Salve o peso dos animais associando-os a um número de brinco ou identificação.
- **Exibição em Kg e Arrobas**: Visualize o peso simultaneamente em quilogramas e arrobas (1@ = 15kg).
- **Histórico Completo**: Acesse o registro histórico de todas as pesagens realizadas.
- **Exportação de Relatórios**: Exporte o histórico em formato HTML para análise posterior.
- **Impressão via Bluetooth**: Imprima relatórios diretamente em impressoras térmicas Bluetooth.
- **Calibração Remota**: Calibre sua balança diretamente pelo aplicativo.
- **Personalização de Relatórios**: Personalize o cabeçalho dos relatórios impressos.

## 🚀 Como Usar

### Conexão com a Balança

1. Na tela inicial, toque em "Conectar"
2. Clique em "Escanear" para buscar dispositivos Bluetooth próximos
3. Selecione sua balança LUMAK na lista de dispositivos
4. Toque em "Conectar" para estabelecer conexão
5. Após conectado, o indicador de status Bluetooth ficará verde

### Pesagem de Animais

1. Na tela da balança, você verá o peso atual em quilogramas e arrobas
2. Digite o número do brinco ou identificação do animal no campo indicado
3. Toque em "Salvar no App" para registrar a pesagem no histórico
4. Uma confirmação aparecerá indicando que o registro foi salvo

### Histórico de Pesagens

1. Na tela inicial, toque em "Histórico"
2. Visualize todas as pesagens realizadas, ordenadas da mais recente para a mais antiga
3. Cada registro mostra a identificação do animal, o peso em kg, o peso em @ e a data/hora
4. Para excluir um registro, toque no ícone de lixeira ao lado dele
5. Para limpar todo o histórico, toque em "Limpar Tudo"

### Exportação de Relatórios

1. Na tela de histórico, toque em "Exportar Histórico"
2. Um arquivo HTML será gerado com todas as pesagens
3. O arquivo será salvo no armazenamento do dispositivo
4. Uma mensagem indicará o local onde o arquivo foi salvo

### Impressão via Bluetooth

1. Na tela de histórico, toque em "Imprimir Histórico"
2. O aplicativo irá escanear por impressoras Bluetooth disponíveis
3. Selecione a impressora desejada na lista
4. O relatório será enviado para impressão
5. Uma mensagem confirmará o sucesso da operação

## 🔧 Calibração da Balança

A calibração permite ajustar a precisão da balança usando um peso de referência conhecido:

1. Na tela inicial, toque em "Configuração"
2. Toque em "Calibrar Balança"
3. Verifique se está conectado à balança (indicado no topo da tela)
4. Remova qualquer peso da balança
5. Toque em "Iniciar Calibração" e aguarde a mensagem de confirmação
6. Coloque um peso conhecido sobre a balança (por exemplo: 20kg)
7. Digite o valor exato do peso no campo "Peso de referência"
8. Toque em "Confirmar Peso"
9. Aguarde a mensagem de "Calibração concluída com sucesso"

## ⚙️ Configurações

O aplicativo oferece duas configurações principais, acessíveis a partir da tela inicial:

1. Na tela inicial, toque em "Configuração"
2. Escolha entre:
   - **Editar Cabeçalho**: Para personalizar os relatórios impressos
   - **Calibrar Balança**: Para ajustar a precisão das medições

### Personalização do Cabeçalho de Impressão

1. Na tela de configurações, toque em "Editar Cabeçalho"
2. Edite os campos:
   - Linha 1 (Título): Ex. "FAZENDA SÃO JOSÉ"
   - Linha 2 (Subtítulo): Ex. "CONTROLE DE GADO"
3. Uma prévia do cabeçalho será exibida à medida que você digita
4. Toque em "Salvar Configurações" para aplicar as alterações
5. O novo cabeçalho será usado em todos os relatórios impressos e exportados

## 📋 Requisitos Técnicos

- **Dispositivo**: Android 6.0 ou superior
- **Permissões**: Bluetooth, Bluetooth Admin, Localização
- **Armazenamento**: Mínimo de 50MB disponíveis

## 🔄 Compatibilidade

- **Balanças**: Compatível com balanças LUMAK com comunicação Bluetooth LE
- **Impressoras**: Compatível com impressoras térmicas Bluetooth padrão (58mm)

## 🛠️ Solução de Problemas

### Balança não aparece na lista de dispositivos
- Verifique se a balança está ligada e com o Bluetooth ativado
- Certifique-se de que todas as permissões de Bluetooth e Localização foram concedidas
- Tente reiniciar o Bluetooth do seu dispositivo

### Erro na impressão
- Verifique se a impressora está ligada e com papel
- Aproxime-se da impressora para melhorar a conexão
- Tente desconectar e reconectar a impressora

### Erro na calibração
- Certifique-se de que a balança está em uma superfície plana e estável
- Use um peso de referência preciso e conhecido
- Remova completamente o peso entre as etapas de calibração

## 📱 Download

O aplicativo pode ser baixado diretamente na Google Play ou instalado manualmente via APK.
# CordovaApps

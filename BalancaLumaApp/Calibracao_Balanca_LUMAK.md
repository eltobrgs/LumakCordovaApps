# Calibração da Balança LUMAK - Guia Técnico

## Como Funciona o Processo de Calibração Atual

O processo de calibração da balança no aplicativo LUMAK segue estas etapas:

1. **Início da calibração**: Usuário clica em "Iniciar Calibração" e o app envia o comando `calibrar` para a balança.
2. **Configuração do peso**: Usuário informa o peso de referência e o app envia este valor para a balança.
3. **Confirmação**: Usuário coloca o peso na balança e clica em "Confirmar" para finalizar o processo.
4. **Conclusão**: A balança processa a calibração e retorna um status para o app.

### Detecção de Conclusão

Atualmente, o aplicativo reconhece a conclusão da calibração de duas formas:

1. **Sinal da balança**: Quando a balança envia mensagens como "OK", "concluída" ou "sucesso".
2. **Timeout automático**: Se não receber resposta em 5 segundos, o app assume que a calibração foi concluída.

## Problema com Oscilações na Plataforma

O sistema atual tem uma limitação: **não detecta adequadamente oscilações na plataforma da balança**. 

Quando há oscilação:
- A balança não envia o sinal de conclusão enquanto estiver instável
- O app pode encerrar o processo prematuramente após o timeout de 5 segundos
- O usuário não recebe feedback claro sobre o estado de oscilação

## Sugestões de Melhorias

Para aprimorar o sistema de calibração, recomendamos as seguintes mudanças:

### 1. Detecção específica de oscilação

- Modificar o firmware da balança para enviar um status específico (ex: "oscilando") durante instabilidades
- Adaptar o app para mostrar mensagens como "Aguarde a estabilização da balança..." quando detectar oscilação

### 2. Timeout mais inteligente

- Aumentar o tempo máximo de espera (de 5 para 15-30 segundos)
- Implementar um sistema de renovação do timeout enquanto houver comunicação ativa
- Apenas concluir automaticamente quando não houver mais sinais da balança

### 3. Melhorias na interface

- Adicionar indicadores visuais de "aguardando estabilização" (ex: spinner animado)
- Manter o botão de confirmação em estado especial durante todo o processo
- Fornecer feedback em tempo real sobre o estado da plataforma

## Implementação Técnica

Para implementar estas melhorias, seriam necessárias alterações tanto no firmware da balança quanto no código do aplicativo:

```javascript
// Exemplos de código a ser implementado no app:

// Detector de mensagens de oscilação
if (valorRecebido.includes('oscilando')) {
    mostrarMensagemCalibracao('Aguardando estabilização da balança...', 'warning');
    // Reiniciar contagem regressiva
    resetarTimeout();
    return;
}

// Sistema de timeout adaptativo
let timeoutCalibracao;

function resetarTimeout() {
    clearTimeout(timeoutCalibracao);
    timeoutCalibracao = setTimeout(finalizarCalibracao, 15000);
}
```

## Conclusão

O sistema atual funciona bem em situações ideais, mas pode ser aprimorado para oferecer uma experiência mais robusta na presença de oscilações na plataforma da balança. As melhorias sugeridas permitiriam uma calibração mais confiável e uma melhor experiência do usuário.

---

*Documento técnico para equipe de desenvolvimento LUMAK Balanças* 
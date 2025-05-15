// Constantes
const SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0";
const CHARACTERISTIC_UUID = "87654321-4321-8765-4321-abcdef987654";
const COMMAND_UUID = "11223344-5566-7788-99aa-bbccddeeff00";

// Variáveis globais
let bleDevice = null;
let isConnected = false;
let foundDevices = {};
let permissionsRequested = false;
let lastConnectedDeviceId = null; // Armazenar o ID do último dispositivo conectado

// Variáveis para calibração
let calibrando = false;
let aguardandoPeso = false;
let aguardandoConfirmacao = false;
let pesoCalibracao = 0;

// Constantes de conversão
const KG_TO_ARROBA = 1/15; // 1 arroba = 15 kg

// Configurações padrão
const DEFAULT_HEADER = {
    line1: "RELATORIO DE PESAGEM",
    line2: "LUMAK BALANCAS"
};

// Elementos da UI
let statusText = null;
let deviceSelect = null;
let connectBtn = null;
let weightValue = null;
let weightValueArroba = null;
let bluetoothStatus = null;
let braceletInput = null;
let savedData = null;
let historyList = null;
let headerLine1Input = null;
let headerLine2Input = null;
let previewHeader1 = null;
let previewHeader2 = null;
let btnZeroScaleMain = null;
let connectionStatusMessage = null; // Novo elemento para status de conexão

// Elementos de calibração
let calibrationStatus = null;
let btnStartCalibration = null;
let btnSendWeight = null;
let btnConfirmCalibration = null;
let btnZeroScale = null;
let refWeightInput = null;

// Adicionar declarações das variáveis para os novos elementos
let divisaoInput = null;
let capacidadeInput = null;
let btnSetDivision = null;
let btnSetCapacity = null;

// Evento de inicialização
document.addEventListener('deviceready', onDeviceReady, false);

// Função para salvar o ID do último dispositivo conectado
function saveLastConnectedDevice(deviceId) {
    console.log('Salvando último dispositivo conectado:', deviceId);
    lastConnectedDeviceId = deviceId;
    localStorage.setItem('lastConnectedDevice', deviceId);
}

// Função para carregar o ID do último dispositivo conectado
function loadLastConnectedDevice() {
    const deviceId = localStorage.getItem('lastConnectedDevice');
    console.log('Carregando último dispositivo conectado:', deviceId);
    lastConnectedDeviceId = deviceId;
    return deviceId;
}

// Função para tentar conectar automaticamente ao último dispositivo
function tryAutoConnect() {
    const deviceId = loadLastConnectedDevice();
    if (deviceId) {
        console.log('Tentando conectar automaticamente ao dispositivo:', deviceId);
        setTimeout(() => {
            // Mostrar um toast informando a tentativa de conexão
            showToast('Conectando ao último dispositivo...', 3000);
            
            // Atualizar mensagem de status
            updateConnectionStatusMessage('Conectando automaticamente...', 'status-connecting');
            
            // Tentar conectar ao dispositivo
            try {
                ble.connect(deviceId, 
                    peripheral => {
                        console.log('Conectado automaticamente com sucesso!');
                        onConnectSuccess(peripheral);
                        showToast('Conectado automaticamente!', 2000);
                    }, 
                    error => {
                        console.error('Falha na conexão automática:', error);
                        showToast('Falha na conexão automática. Conecte manualmente.', 3000);
                        updateConnectionStatusMessage('Falha na conexão automática. Use o Menu > Conectar.', 'status-error');
                    }
                );
            } catch (error) {
                console.error('Erro ao tentar conexão automática:', error);
                updateConnectionStatusMessage('Erro na conexão. Use o Menu > Conectar.', 'status-error');
            }
        }, 2000); // Atraso para dar tempo de inicializar o BLE
    } else {
        updateConnectionStatusMessage('Não conectado à balança. Use o Menu > Conectar.', '');
    }
}

// Função para mostrar um toast (mensagem temporária)
function showToast(message, duration) {
    // Criar um elemento toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    // Estilizar diretamente
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    toast.style.color = 'white';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.fontSize = '16px';
    toast.style.zIndex = '9999';
    toast.style.textAlign = 'center';
    
    // Adicionar ao corpo do documento
    document.body.appendChild(toast);
    
    // Remover após a duração especificada
    setTimeout(() => {
        if (document.body.contains(toast)) {
            document.body.removeChild(toast);
        }
    }, duration);
}

function onDeviceReady() {
    console.log('Cordova está pronto');
    
    // Inicializar elementos da UI
    statusText = document.getElementById('statusText');
    deviceSelect = document.getElementById('deviceSelect');
    connectBtn = document.getElementById('connectBtn');
    weightValue = document.getElementById('weightValue');
    weightValueArroba = document.getElementById('weightValueArroba');
    bluetoothStatus = document.getElementById('bluetoothStatus');
    braceletInput = document.getElementById('braceletInput');
    savedData = document.getElementById('savedData');
    historyList = document.getElementById('historyList');
    headerLine1Input = document.getElementById('headerLine1');
    headerLine2Input = document.getElementById('headerLine2');
    previewHeader1 = document.getElementById('previewHeader1');
    previewHeader2 = document.getElementById('previewHeader2');
    btnZeroScaleMain = document.getElementById('btn-zero-scale-main');
    connectionStatusMessage = document.getElementById('connection-status-message');
    
    // Inicializar elementos de calibração
    calibrationStatus = document.getElementById('calibration-status');
    btnStartCalibration = document.getElementById('btn-start-calibration');
    btnSendWeight = document.getElementById('btn-send-weight');
    btnConfirmCalibration = document.getElementById('btn-confirm-calibration');
    btnZeroScale = document.getElementById('btn-zero-scale');
    refWeightInput = document.getElementById('refWeight');
    
    // Inicializar novos elementos de calibração
    divisaoInput = document.getElementById('divisaoInput');
    capacidadeInput = document.getElementById('capacidadeInput');
    btnSetDivision = document.getElementById('btn-set-division');
    btnSetCapacity = document.getElementById('btn-set-capacity');
    
    // Adicionar eventos para os botões
    setupEventListeners();
    
    // Solicitar permissões imediatamente ao iniciar
    setTimeout(() => {
        console.log('Solicitando permissões ao iniciar');
        checkPermissions(permissionsGranted => {
            console.log('Resultado das permissões iniciais:', permissionsGranted);
            permissionsRequested = true;
            
            // Tentar conectar automaticamente após obter permissões
            if (permissionsGranted) {
                tryAutoConnect();
            }
        });
    }, 1000);
    
    // Carregar dados salvos
    loadSavedData();
    
    // Carregar histórico
    loadHistory();
    
    // Carregar configurações
    loadSettings();
    
    // Vibrações curtas para indicar que o app está pronto
    vibrate(100);
    
    // Log de informações para debug
    logDeviceInfo();
    
    // Atualizar status da conexão
    updateConnectionStatus();
    
    // Definir mensagem inicial de status
    updateConnectionStatusMessage('Não conectado à balança', '');
    
    // Mostrar a página da balança como página inicial em vez da homepage
    showPage('scalePage');
}

// Função para logar informações do dispositivo
function logDeviceInfo() {
    if (window.device) {
        console.log('Informações do dispositivo:');
        console.log('- Cordova version: ' + device.cordova);
        console.log('- Device model: ' + device.model);
        console.log('- Device platform: ' + device.platform);
        console.log('- Device version: ' + device.version);
        console.log('- Device manufacturer: ' + device.manufacturer);
        console.log('- Device isVirtual: ' + device.isVirtual);
        console.log('- Device serial: ' + device.serial);
    } else {
        console.log('Plugin device não está disponível');
    }
    
    // Verificar plugins de BLE
    if (window.ble) {
        console.log('Plugin BLE Central está disponível');
    } else {
        console.error('Plugin BLE Central NÃO está disponível');
    }
}

// Função de vibração
function vibrate(time) {
    if (navigator.vibrate) {
        navigator.vibrate(time);
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Botões de navegação para páginas
    document.querySelectorAll('.btn[data-page]').forEach(button => {
        button.addEventListener('click', function(e) {
            // Não prevenir o comportamento padrão para botões de navegação comum
            // Apenas verifica se é o botão de calibração para prevenir
            const page = this.getAttribute('data-page');
            if (this.id === 'btn-calibration-settings') {
                e.preventDefault();
                return; // Não prossegue, pois este botão tem seu próprio event listener
            }
            
            console.log('Navegando para página:', page);
            vibrate(50);
            showPage(page);
            
            // Se navegando para a página de histórico, recarregar os dados
            if (page === 'historyPage') {
                loadHistory();
            }
        });
    });
    
    // Botão de menu para ir para a homepage
    const menuBtn = document.getElementById('btn-menu');
    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            console.log('Botão de menu clicado');
            vibrate(50);
            showPage('homePage');
        });
    }
    
    // Botão de configurações
    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            console.log('Botão de configurações clicado');
            vibrate(50);
            showSettings();
        });
    }
    
    // Botão de configuração de impressão
    const printSettingsBtn = document.getElementById('btn-print-settings');
    if (printSettingsBtn) {
        printSettingsBtn.addEventListener('click', function() {
            console.log('Botão de configuração de impressão clicado');
            vibrate(50);
            showPrintSettings();
        });
    }
    
    // Botão de escanear
    const scanBtn = document.getElementById('btn-scan');
    if (scanBtn) {
        scanBtn.addEventListener('click', function() {
            console.log('Botão de escanear clicado');
            vibrate(100);
            scanDevices();
        });
    } else {
        console.error('Botão de escanear não encontrado');
    }
    
    // Botão de conectar
    if (connectBtn) {
        connectBtn.addEventListener('click', function() {
            console.log('Botão de conectar clicado');
            vibrate(100);
            connectToDevice();
        });
    } else {
        console.error('Botão de conectar não encontrado');
    }
    
    // Botão de salvar
    const saveBtn = document.getElementById('btn-save');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            console.log('Botão de salvar no app clicado');
            vibrate(100);
            saveData();
        });
    } else {
        console.error('Botão de salvar não encontrado');
    }
    
    // Botão de exportar
    const exportBtn = document.getElementById('btn-export');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            console.log('Botão de exportar clicado');
            vibrate(100);
            exportAsFile();
        });
    } else {
        console.error('Botão de exportar não encontrado');
    }
    
    // Botão de imprimir
    const printBtn = document.getElementById('btn-print');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            console.log('Botão de imprimir clicado');
            vibrate(100);
            exportDataForPrinting();
        });
    } else {
        console.error('Botão de imprimir não encontrado');
    }
    
    // Botão de desconectar
    const disconnectBtn = document.getElementById('btn-disconnect');
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', function() {
            console.log('Botão de desconectar clicado');
            vibrate(100);
            disconnect();
        });
    } else {
        console.error('Botão de desconectar não encontrado');
    }
    
    // Botão de zerar na tela principal
    if (btnZeroScaleMain) {
        btnZeroScaleMain.addEventListener('click', function() {
            console.log('Botão de zerar balança (tela principal) clicado');
            vibrate(100);
            resetScale(); // Usar a nova função resetScale em vez de zeroScale
        });
    }
    
    // Botão de tarar na tela principal
    const btnTare = document.getElementById('btn-tare');
    if (btnTare) {
        btnTare.addEventListener('click', function() {
            console.log('Botão de tarar balança clicado');
            vibrate(100);
            zeroScale(); // Continuar usando zeroScale para o botão de tarar
        });
    }
    
    // Botão de ver histórico na tela da balança
    const btnHistoryLink = document.getElementById('btn-history-link');
    if (btnHistoryLink) {
        btnHistoryLink.addEventListener('click', function() {
            console.log('Botão de ver histórico clicado');
            vibrate(50);
            showPage('historyPage');
            loadHistory();
        });
    }
    
    // Botão de limpar histórico
    const clearAllBtn = document.getElementById('btn-clear-all');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function() {
            console.log('Botão de limpar tudo clicado');
            vibrate([100, 50, 100]);
            clearAllHistory();
        });
    }
    
    // Botão de exportar histórico
    const exportHistoryBtn = document.getElementById('btn-export-history');
    if (exportHistoryBtn) {
        exportHistoryBtn.addEventListener('click', function() {
            console.log('Botão de exportar histórico clicado');
            vibrate(100);
            exportAsFile();
        });
    }
    
    // Botão de imprimir histórico
    const printHistoryBtn = document.getElementById('btn-print-history');
    if (printHistoryBtn) {
        printHistoryBtn.addEventListener('click', function() {
            console.log('Botão de imprimir histórico clicado');
            vibrate(100);
            exportDataForPrinting();
        });
    }
    
    // Botão de salvar configurações
    const saveSettingsBtn = document.getElementById('btn-save-settings');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', function() {
            console.log('Botão de salvar configurações clicado');
            vibrate(100);
            saveSettings();
        });
    }
    
    // Event listeners para atualização da prévia em tempo real
    if (headerLine1Input) {
        headerLine1Input.addEventListener('input', updateHeaderPreview);
    }
    
    if (headerLine2Input) {
        headerLine2Input.addEventListener('input', updateHeaderPreview);
    }
    
    // Event listeners para botões de calibração
    if (btnStartCalibration) {
        btnStartCalibration.addEventListener('click', function() {
            console.log('Botão de iniciar calibração clicado');
            vibrate(100);
            iniciarCalibracao();
        });
    }
    
    if (btnSendWeight) {
        btnSendWeight.addEventListener('click', function() {
            console.log('Botão de enviar peso clicado');
            vibrate(100);
            enviarPesoCalibracao();
        });
    }
    
    if (btnConfirmCalibration) {
        btnConfirmCalibration.addEventListener('click', function() {
            console.log('Botão de confirmar calibração clicado');
            vibrate(100);
            confirmarCalibracao();
        });
    }
    
    if (btnZeroScale) {
        btnZeroScale.addEventListener('click', function() {
            console.log('Botão de zerar balança clicado');
            vibrate(100);
            zeroScale();
        });
    }
    
    // Event listeners para os novos botões de configuração de divisão e capacidade
    if (btnSetDivision) {
        btnSetDivision.addEventListener('click', function() {
            console.log('Botão de configurar divisão clicado');
            vibrate(100);
            enviarConfigDivisao();
        });
    }
    
    if (btnSetCapacity) {
        btnSetCapacity.addEventListener('click', function() {
            console.log('Botão de configurar capacidade máxima clicado');
            vibrate(100);
            enviarConfigCapacidade();
        });
    }
    
    // Event listener para o botão de calibração no menu
    const calibrationBtn = document.getElementById('btn-calibration-settings');
    if (calibrationBtn) {
        calibrationBtn.addEventListener('click', function(e) {
            console.log('Botão de calibração clicado');
            // Impedir o comportamento padrão de navegação pelo data-page
            e.preventDefault();
            vibrate(50);
            showPasswordModal();
        });
    }
    
    // Botões do modal de senha
    const confirmPasswordBtn = document.getElementById('confirmPasswordBtn');
    if (confirmPasswordBtn) {
        confirmPasswordBtn.addEventListener('click', function() {
            console.log('Confirmando senha');
            vibrate(50);
            verifyCalibrationPassword();
        });
    }
    
    const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
    if (cancelPasswordBtn) {
        cancelPasswordBtn.addEventListener('click', function() {
            console.log('Cancelando entrada de senha');
            vibrate(50);
            hidePasswordModal();
            // Retornar para a página de configurações
            showPage('settingsPage');
        });
    }
    
    // Event listener para o campo de senha (para detectar Enter)
    const passwordInput = document.getElementById('calibrationPassword');
    if (passwordInput) {
        passwordInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                console.log('Enter pressionado no campo de senha');
                verifyCalibrationPassword();
            }
        });
    }
    
    // Log de todos os IDs de botões para depuração
    console.log('Botões disponíveis:', Array.from(document.querySelectorAll('button')).map(btn => {
        return {
            id: btn.id,
            text: btn.textContent.trim(),
            classes: btn.className,
            dataPage: btn.getAttribute('data-page')
        };
    }));
}

// Funções de navegação
function showPage(pageId) {
    console.log('Mudando para página:', pageId);
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    
    // Se estiver indo para a página de conexão, verificar permissões
    if (pageId === 'connectionPage' && !permissionsRequested) {
        checkPermissions();
    }
}

// Função para mostrar a página de configurações (agora é apenas um menu)
function showSettings() {
    console.log('Mostrando página de configurações');
    vibrate(50);
    showPage('settingsPage');
}

// Função para mostrar a página de configurações de impressão
function showPrintSettings() {
    console.log('Mostrando página de configurações de impressão');
    vibrate(50);
    showPage('printSettingsPage');
}

// Função para mostrar a página de calibração
function showCalibrationPage() {
    console.log('Solicitando senha para acesso à calibração');
    vibrate(50);
    
    // Mostrar o modal de senha
    showPasswordModal();
}

// Função para mostrar o modal de senha
function showPasswordModal() {
    // Limpar o campo de senha e mensagem de erro
    document.getElementById('calibrationPassword').value = '';
    document.getElementById('passwordError').textContent = '';
    
    // Mostrar o modal
    const modal = document.getElementById('passwordModal');
    modal.classList.add('active');
    
    // Focar no campo de senha
    setTimeout(() => {
        document.getElementById('calibrationPassword').focus();
    }, 300);
}

// Função para esconder o modal de senha
function hidePasswordModal() {
    const modal = document.getElementById('passwordModal');
    modal.classList.remove('active');
    // Não redirecionar para a página de calibração quando cancelado
}

// Função para verificar a senha
function verifyCalibrationPassword() {
    const passwordInput = document.getElementById('calibrationPassword');
    const enteredPassword = passwordInput.value.trim();
    
    // Gerar a senha baseada na data atual (dia+mês+2011)
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0'); // +1 porque os meses começam em 0
    
    // Senha é a concatenação do dia e mês + 2011
    const diaMes = dia + mes;
    const senhaCorreta = String(parseInt(diaMes) + 2011);
    
    console.log('Data de hoje:', dia + '/' + mes + '/' + hoje.getFullYear());
    console.log('Senha calculada:', senhaCorreta);
    
    if (enteredPassword === senhaCorreta) {
        // Senha correta, esconder o modal e mostrar a página de calibração
        hidePasswordModal();
        showPage('calibrationPage');
        atualizarStatusCalibracao();
        vibrate([100, 50, 100]); // Padrão de sucesso
    } else {
        // Senha incorreta, mostrar mensagem de erro
        document.getElementById('passwordError').textContent = 'Senha incorreta. Tente novamente.';
        passwordInput.value = '';
        passwordInput.focus();
        vibrate([100, 50, 100, 50, 100]); // Padrão de erro
    }
}

// Função para verificar e solicitar permissões no Android
function checkPermissions(callback) {
    if (cordova.platformId === 'android') {
        console.log('Verificando permissões no Android');
        
        try {
            const permissions = cordova.plugins.permissions;
            if (!permissions) {
                console.error('Plugin de permissões não está disponível');
                alert('Plugin de permissões não está disponível. Reinstale o aplicativo.');
                if (callback) callback(false);
                return;
            }
            
            // Versão do Android
            console.log('Device plugin:', device);
            const androidVersion = device.version ? parseInt(device.version.split('.')[0]) : 0;
            console.log('Android version: ' + androidVersion);
            
            // Lista de permissões a serem solicitadas
            let permissionsToRequest = [];
            
            // Para versões anteriores ao Android 12
            if (androidVersion < 12) {
                permissionsToRequest = [
                    permissions.ACCESS_FINE_LOCATION,
                    permissions.BLUETOOTH,
                    permissions.BLUETOOTH_ADMIN
                ];
            } else {
                // Para Android 12+
                permissionsToRequest = [
                    permissions.BLUETOOTH_SCAN,
                    permissions.BLUETOOTH_CONNECT,
                    permissions.ACCESS_FINE_LOCATION
                ];
            }
            
            console.log('Permissões a serem solicitadas:', permissionsToRequest);
            
            // Função para solicitar permissões de forma sequencial
            function requestNextPermission(index) {
                if (index >= permissionsToRequest.length) {
                    // Todas as permissões foram solicitadas
                    permissionsRequested = true;
                    console.log('Todas as permissões solicitadas');
                    vibrate([100, 50, 100]); // Padrão de vibração para indicar conclusão
                    if (callback) callback(true);
                    return;
                }
                
                const permission = permissionsToRequest[index];
                console.log('Verificando permissão: ' + permission);
                
                permissions.checkPermission(permission, status => {
                    console.log('Status da permissão ' + permission + ': ' + status.hasPermission);
                    
                    if (status.hasPermission) {
                        // Já tem permissão, vá para a próxima
                        console.log('Já tem permissão: ' + permission);
                        requestNextPermission(index + 1);
                    } else {
                        // Solicitar permissão
                        console.log('Solicitando permissão: ' + permission);
                        vibrate(200); // Vibração mais longa para chamar atenção para a solicitação
                        
                        permissions.requestPermission(permission, 
                            status => {
                                console.log('Resultado da solicitação de permissão ' + permission + ': ' + status.hasPermission);
                                // Continuar para a próxima permissão, independentemente do resultado
                                requestNextPermission(index + 1);
                            },
                            error => {
                                console.error('Erro ao solicitar permissão ' + permission + ':', error);
                                vibrate([100, 100, 300]); // Padrão de erro
                                // Continuar para a próxima permissão mesmo em caso de erro
                                requestNextPermission(index + 1);
                            }
                        );
                    }
                }, error => {
                    console.error('Erro ao verificar permissão ' + permission + ':', error);
                    // Tentar solicitar mesmo se falhar na verificação
                    permissions.requestPermission(permission, 
                        () => requestNextPermission(index + 1),
                        () => requestNextPermission(index + 1)
                    );
                });
            }
            
            // Iniciar solicitação de permissões
            requestNextPermission(0);
            
        } catch (error) {
            console.error('Erro ao verificar permissões:', error);
            if (callback) callback(false);
        }
    } else {
        // Não é Android, não precisa solicitar permissões
        console.log('Não é Android, permissões não são necessárias');
        permissionsRequested = true;
        if (callback) callback(true);
    }
}

// Funções BLE
function scanDevices() {
    console.log("Função scanDevices chamada");
    
    // Garantir que os elementos da UI estejam inicializados
    if (!statusText || !deviceSelect || !connectBtn) {
        console.error("Elementos da UI não estão inicializados!");
        vibrate([100, 100, 300]); // Padrão de erro
        alert("Erro: Elementos da interface não encontrados. Tente reiniciar o aplicativo.");
        return;
    }
    
    statusText.textContent = 'Verificando permissões...';
    
    // Verificar e solicitar permissões antes de escanear
    checkPermissions(permissionsGranted => {
        console.log('Resultado da verificação de permissões:', permissionsGranted);
        if (permissionsGranted) {
            startScan();
        } else {
            statusText.textContent = '⚠️ Permissões necessárias não concedidas';
            vibrate([100, 100, 300]); // Padrão de erro
            
            // Tentar iniciar o escaneamento mesmo sem todas as permissões
            // Isso é útil porque algumas versões do Android não requerem todas as permissões
            setTimeout(() => {
                console.log('Tentando escanear mesmo sem todas as permissões');
                startScan();
            }, 1000);
        }
    });
}

function startScan() {
    try {
        statusText.textContent = '🔎 Escaneando dispositivos BLE...';
        deviceSelect.innerHTML = '<option value="">Selecione um dispositivo</option>';
        deviceSelect.disabled = true;
        connectBtn.disabled = true;
        foundDevices = {};
        
        // Registrar tempo de início do scan
        const scanStartTime = new Date();
        console.log("Iniciando escaneamento de dispositivos BLE...", scanStartTime);
        vibrate(200); // Vibração longa para indicar início do escaneamento
        
        // Dispositivos temporários para acumular durante o scan
        let tempDevices = {};
        
        // Escanear todos os dispositivos sem filtro (como no app web)
        ble.scan([], 20, function(device) {
            console.log('Dispositivo encontrado:', device);
            // Armazenar no objeto temporário
            if (!tempDevices[device.id]) {
                tempDevices[device.id] = device;
                
                // Atualizar dispositivos encontrados na interface a cada dispositivo novo
                updateDeviceList(tempDevices);
            }
        }, function(error) {
            console.error('Erro no escaneamento:', error);
            onScanError(error);
        });
        
        // Após o término do scan, mostrar mensagem informativa
        setTimeout(() => {
            const scanEndTime = new Date();
            const scanDuration = (scanEndTime - scanStartTime) / 1000;
            console.log(`Scan completo em ${scanDuration} segundos. Encontrados ${Object.keys(tempDevices).length} dispositivos.`);
            
            // Garantir que todos os dispositivos estejam na lista global
            foundDevices = tempDevices;
            
            // Verificar se encontramos algo
            if (Object.keys(foundDevices).length === 0) {
                statusText.textContent = '⚠️ Nenhum dispositivo encontrado. Tente novamente.';
                vibrate([100, 100, 100]); // Padrão de alerta
            } else {
                statusText.textContent = `✅ Scan completo: ${Object.keys(foundDevices).length} dispositivos`;
                vibrate([100, 50, 100]); // Padrão de conclusão
            }
        }, 21000); // Um segundo após o término do scan (que dura 20 segundos)
    } catch (error) {
        console.error('Erro ao iniciar escaneamento:', error);
        statusText.textContent = '⚠️ Erro ao escanear dispositivos: ' + error.message;
        vibrate([100, 100, 300]); // Padrão de erro
        alert('Erro ao iniciar escaneamento: ' + error.message);
    }
}

// Função para atualizar a lista de dispositivos na interface
function updateDeviceList(devices) {
    // Limpar o select, mantendo apenas a opção padrão
    deviceSelect.innerHTML = '<option value="">Selecione um dispositivo</option>';
    
    // Criar uma lista de dispositivos para ordenar
    let deviceList = [];
    for (const id in devices) {
        deviceList.push(devices[id]);
    }
    
    // Ordenar dispositivos: primeiro os que têm nome, depois por força de sinal (RSSI)
    deviceList.sort((a, b) => {
        // Primeiro critério: dispositivos com nome vêm primeiro
        const aHasName = a.name && a.name.trim() !== '';
        const bHasName = b.name && b.name.trim() !== '';
        
        if (aHasName && !bHasName) return -1;
        if (!aHasName && bHasName) return 1;
        
        // Segundo critério: dispositivos com sinal mais forte vêm primeiro
        return (b.rssi || -100) - (a.rssi || -100);
    });
    
    // Adicionar dispositivos ao select
    deviceList.forEach(device => {
        const option = document.createElement('option');
        option.value = device.id;
        
        // Formatação melhorada do nome do dispositivo
        let deviceName = '';
        
        // Verificar se o dispositivo tem um nome
        if (device.name && device.name.trim() !== '') {
            deviceName = device.name;
            
            // Destacar dispositivos que podem ser da balança
            if (deviceName.toLowerCase().includes('balança') || 
                deviceName.toLowerCase().includes('scale') || 
                deviceName.toLowerCase().includes('weight') ||
                deviceName.toLowerCase().includes('lumak')) {
                deviceName = '⭐ ' + deviceName + ' (possível balança)';
            }
        } else {
            // Formatação para dispositivos sem nome com indicação de força do sinal
            let signalStrength = '';
            if (device.rssi) {
                if (device.rssi > -60) signalStrength = '📶 (sinal forte)';
                else if (device.rssi > -80) signalStrength = '📶 (sinal médio)';
                else signalStrength = '📶 (sinal fraco)';
            }
            
            deviceName = 'Dispositivo ' + formatMacAddress(device.id) + ' ' + signalStrength;
        }
        
        option.textContent = deviceName;
        deviceSelect.appendChild(option);
    });
    
    // Habilitar o select e o botão de conectar se houver dispositivos
    if (deviceList.length > 0) {
        deviceSelect.disabled = false;
        connectBtn.disabled = false;
        statusText.textContent = '📡 ' + deviceList.length + ' dispositivos encontrados';
    }
}

function onScanError(error) {
    console.error('Erro no escaneamento:', error);
    statusText.textContent = '⚠️ Erro ao escanear: ' + error;
    vibrate([100, 100, 300]); // Padrão de erro
    alert('Erro ao escanear dispositivos: ' + (typeof error === 'string' ? error : JSON.stringify(error)));
}

function connectToDevice() {
    console.log("Função connectToDevice chamada");
    try {
        const deviceId = deviceSelect.value;
        if (!deviceId) {
            vibrate([50, 50, 50]); // Vibração curta de alerta
            alert('Por favor, selecione um dispositivo');
            return;
        }

        statusText.textContent = '🔗 Conectando...';
        connectBtn.disabled = true;
        vibrate(200); // Vibração longa para indicar início da conexão

        console.log("Tentando conectar ao dispositivo:", deviceId);
        ble.connect(deviceId, 
            function(peripheral) {
                console.log('Conectado ao dispositivo', peripheral);
                onConnectSuccess(peripheral);
            }, 
            function(error) {
                console.error('Falha na conexão:', error);
                onConnectFailure(error);
            }
        );
    } catch (error) {
        console.error('Erro ao conectar:', error);
        statusText.textContent = '⚠️ Erro ao conectar: ' + error.message;
        connectBtn.disabled = false;
        vibrate([100, 100, 300]); // Padrão de erro
        alert('Erro ao conectar: ' + error.message);
    }
}

function onConnectSuccess(peripheral) {
    console.log('Conectado ao dispositivo:', peripheral);
    
    bleDevice = peripheral;
    isConnected = true;
    bluetoothStatus.classList.add('connected');
    
    // Salvar o ID do dispositivo conectado para reconexão automática
    saveLastConnectedDevice(peripheral.id);
    
    // Atualizar mensagem de status
    updateConnectionStatusMessage('Conectado à balança', 'status-connected');
    
    // Tentar iniciar notificações da característica principal
    try {
        console.log("Iniciando notificações:", SERVICE_UUID, CHARACTERISTIC_UUID);
        ble.startNotification(
            peripheral.id,
            SERVICE_UUID,
            CHARACTERISTIC_UUID,
            data => {
                try {
                    const value = bytesToString(data);
                    
                    // Verificar se está em modo de calibração
                    if (calibrando) {
                        console.log('Resposta durante calibração:', value);
                        
                        // Se for uma resposta OK ou a calibração estiver concluída
                        if (value === 'OK' || value.includes('concluída') || value.includes('sucesso')) {
                            finalizarCalibracao();
                            return;
                        }
                        
                        // Mensagem intermediária da balança durante a calibração
                        mostrarMensagemCalibracao(value, 'info');
                    }
                    
                    // Processamento normal de dados
                    processaValorRecebido(value);
                    
                    // Atualizar mensagem de status quando dados são recebidos
                    updateConnectionStatusMessage('Recebendo dados da balança', 'status-connected');
                } catch (error) {
                    console.error("Erro ao processar dados:", error);
                }
            },
            error => {
                console.error("Erro ao receber notificações:", error);
                updateConnectionStatusMessage('Erro ao receber dados', 'status-error');
            }
        );
        
        statusText.textContent = '✅ Conectado como balança!';
    } catch (error) {
        console.log('Falha ao configurar notificações:', error);
        statusText.textContent = '✅ Conectado (erro nas notificações)';
        updateConnectionStatusMessage('Conectado, mas com erros', 'status-error');
    }
    
    // Não precisamos mais redirecionar para a página da balança,
    // pois já estamos nela na interface nova
    
    // Atualizar status da conexão
    updateConnectionStatus();
    
    // Atualizar status da calibração
    atualizarStatusCalibracao();
}

function onConnectFailure(error) {
    console.error('Falha na conexão:', error);
    statusText.textContent = '⚠️ Erro ao conectar: ' + (typeof error === 'string' ? error : JSON.stringify(error));
    connectBtn.disabled = false;
    vibrate([100, 100, 300]); // Padrão de erro
    alert('Falha ao conectar: ' + (typeof error === 'string' ? error : JSON.stringify(error)));
}

function onWeightDataReceived(data) {
    try {
        // Converter os dados ArrayBuffer para string
        const value = bytesToString(data);
        // Usar a função de processamento para exibir kg e @
        processaValorRecebido(value);
    } catch (error) {
        console.error("Erro ao processar dados:", error);
    }
}

function bytesToString(buffer) {
    try {
        return String.fromCharCode.apply(null, new Uint8Array(buffer));
    } catch (error) {
        console.error("Erro ao converter buffer para string:", error);
        return "Erro na leitura";
    }
}

function disconnect() {
    console.log("Função disconnect chamada");
    if (isConnected && bleDevice) {
        try {
            // Atualizar mensagem de status
            updateConnectionStatusMessage('Desconectando...', 'status-connecting');
            
            ble.disconnect(bleDevice.id, 
                () => {
                    console.log('Desconectado com sucesso');
                    vibrate([50, 100, 50]); // Padrão de desconexão
                    updateConnectionStatusMessage('Desconectado da balança', '');
                },
                error => {
                    console.error('Erro ao desconectar:', error);
                    vibrate([100, 100, 300]); // Padrão de erro
                    updateConnectionStatusMessage('Erro ao desconectar', 'status-error');
                }
            );
        } catch (error) {
            console.error('Erro ao desconectar:', error);
            vibrate([100, 100, 300]); // Padrão de erro
            updateConnectionStatusMessage('Erro ao desconectar', 'status-error');
        }
    }
    
    isConnected = false;
    bleDevice = null;
    bluetoothStatus.classList.remove('connected');
    weightValue.textContent = 'Aguardando dados...';
    
    // Atualizar status da conexão
    updateConnectionStatus();
    
    // Permanecer na página da balança, apenas atualizar o status
    // Não é mais necessário navegar para a homePage
}

// Função para atualizar elementos da interface baseado no status da conexão
function updateConnectionStatus() {
    // Mostra "0,0 kg" quando não há conexão, com kg menor
    if (!isConnected && weightValue) {
        weightValue.innerHTML = '0,0 <span class="weight-unit">kg</span>';
        
        // Verificar se há um último dispositivo conhecido
        const lastDevice = loadLastConnectedDevice();
        if (!lastDevice) {
            updateConnectionStatusMessage('Não conectado à balança. Use o Menu > Conectar.', '');
        }
    } else if (isConnected) {
        updateConnectionStatusMessage('Conectado à balança', 'status-connected');
    }
}

// Funções de dados
function saveData() {
    console.log("Função saveData chamada");
    const bracelet = braceletInput.value.trim();
    const weightKg = weightValue.textContent;
    
    if (weightKg !== 'Aguardando dados...') {
        // Salvar no localStorage
        const savedMeasurements = JSON.parse(localStorage.getItem('measurements') || '[]');
        
        // Extrair valor numérico do peso em kg
        let numericWeightKg = '';
        if (weightKg.includes('Peso:')) {
            numericWeightKg = weightKg.replace('📊 Peso:', '').trim();
        } else {
            numericWeightKg = weightKg;
        }
        
        // Criar novo objeto de medição (usar "Sem identificação" se o campo estiver vazio)
        const newMeasurement = {
            id: Date.now().toString(), // ID único baseado no timestamp
            bracelet: bracelet || "N/T",
            weight: weightKg,
            numericWeightKg: numericWeightKg.replace(/[^\d.,]/g, '').trim(),
            timestamp: new Date().toISOString()
        };
        
        savedMeasurements.push(newMeasurement);
        localStorage.setItem('measurements', JSON.stringify(savedMeasurements));
        
        // Limpar campo de identificação
        braceletInput.value = '';
        vibrate([50, 50, 150]); // Vibração para indicar salvamento bem-sucedido
        
        // Feedback visual como popup
        const popup = document.createElement('div');
        popup.className = 'save-popup';
        popup.innerHTML = `
            <div class="save-popup-content">
                <span class="material-icons" style="color: #28a745; font-size: 36px;">check_circle</span>
                <h3>Dados Salvos!</h3>
                <p>Os dados foram salvos com sucesso.</p>
                <p>Para visualizar, acesse a tela de histórico.</p>
                <button id="close-popup" class="btn">OK</button>
            </div>
        `;
        
        // Aplicar estilos diretamente (para evitar necessidade de CSS adicional)
        popup.style.position = 'fixed';
        popup.style.top = '0';
        popup.style.left = '0';
        popup.style.width = '100%';
        popup.style.height = '100%';
        popup.style.display = 'flex';
        popup.style.alignItems = 'center';
        popup.style.justifyContent = 'center';
        popup.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        popup.style.zIndex = '1000';
        
        // Adicionar ao corpo do documento
        document.body.appendChild(popup);
        
        // Event listener para o botão de fechar
        const closeBtn = document.getElementById('close-popup');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                document.body.removeChild(popup);
            });
        }
        
        // Auto-fechar após 3 segundos
        setTimeout(() => {
            if (document.body.contains(popup)) {
                document.body.removeChild(popup);
            }
        }, 3000);
    } else {
        vibrate([50, 50, 50]); // Vibração curta de alerta
        alert('Aguarde uma leitura válida da balança para salvar.');
    }
}

// Carregar dados salvos ao iniciar
function loadSavedData() {
    if (!savedData) {
        console.error("Elemento savedData não está disponível");
        return;
    }
    
    // Como estamos ocultando a div savedData na nova interface, não precisamos criar elementos
    // Deixando esta função mais simples
    console.log("loadSavedData chamada, mas não criando elementos devido ao novo layout");
}

// Carregar histórico completo
function loadHistory() {
    if (!historyList) {
        console.error("Elemento historyList não está disponível");
        return;
    }
    
    const savedMeasurements = JSON.parse(localStorage.getItem('measurements') || '[]');
    historyList.innerHTML = '';
    
    if (savedMeasurements.length === 0) {
        const emptyText = document.createElement('div');
        emptyText.className = 'history-empty';
        emptyText.textContent = 'Nenhum dado salvo ainda';
        historyList.appendChild(emptyText);
        return;
    }
    
    // Ordenar por data (mais recente primeiro)
    savedMeasurements.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    savedMeasurements.forEach(measurement => {
        // Extrair apenas o valor numérico do peso (se disponível)
        let weightValue = measurement.weight;
        if (weightValue.includes('Peso:')) {
            weightValue = weightValue.replace('📊 Peso:', '').trim();
        }
        
        // Formatar a data/hora para formato brasileiro
        const dateTime = new Date(measurement.timestamp);
        const formattedDateTime = dateTime.toLocaleString('pt-BR');
        
        // Criar elemento de item do histórico
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-item-id">${measurement.bracelet}</div>
            <div class="history-item-details">
                <div class="history-item-weight">${weightValue}</div>
                <div class="history-item-date">${formattedDateTime}</div>
            </div>
            <button class="btn-delete" data-id="${measurement.id}">
                <span class="material-icons">delete</span>
            </button>
        `;
        
        historyList.appendChild(historyItem);
        
        // Adicionar evento para botão de exclusão
        const deleteBtn = historyItem.querySelector('.btn-delete');
        deleteBtn.addEventListener('click', function() {
            vibrate(50);
            const itemId = this.getAttribute('data-id');
            deleteHistoryItem(itemId);
        });
    });
}

// Função para excluir um item específico do histórico
function deleteHistoryItem(id) {
    console.log('Excluindo item:', id);
    
    // Confirmar exclusão
    if (confirm('Tem certeza que deseja excluir este item do histórico?')) {
        try {
            // Obter dados salvos
            const savedMeasurements = JSON.parse(localStorage.getItem('measurements') || '[]');
            
            // Filtrar para remover o item
            const updatedMeasurements = savedMeasurements.filter(item => item.id !== id);
            
            // Salvar dados atualizados
            localStorage.setItem('measurements', JSON.stringify(updatedMeasurements));
            
            // Vibrar para confirmar
            vibrate([50, 100, 50]);
            
            // Recarregar histórico
            loadHistory();
            
            // Atualizar a exibição na tela da balança também
            loadSavedData();
        } catch (error) {
            console.error('Erro ao excluir item:', error);
            alert('Erro ao excluir item: ' + error.message);
        }
    }
}

// Função para limpar todo o histórico
function clearAllHistory() {
    console.log('Limpando todo o histórico');
    
    // Confirmar exclusão
    if (confirm('Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.')) {
        try {
            // Limpar dados
            localStorage.removeItem('measurements');
            
            // Vibrar para confirmar
            vibrate([100, 50, 100, 50, 100]);
            
            // Recarregar histórico
            loadHistory();
            
            // Atualizar a exibição na tela da balança também
            loadSavedData();
            
            // Feedback
            alert('Histórico limpo com sucesso!');
        } catch (error) {
            console.error('Erro ao limpar histórico:', error);
            alert('Erro ao limpar histórico: ' + error.message);
        }
    }
}

// Verificar eventos de clique
document.addEventListener('click', function(event) {
    const element = event.target;
    if (element.tagName === 'BUTTON') {
        console.log("Botão clicado:", element.textContent.trim());
    }
}, true);

// Função auxiliar para formatar endereços MAC
function formatMacAddress(macAddress) {
    // Remover caracteres não alfanuméricos
    const cleanMac = macAddress.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
    
    // Verificar se é um endereço MAC válido
    if (cleanMac.length >= 12) {
        // Formatar como XX:XX:XX:XX:XX:XX
        const formattedMac = cleanMac.slice(0, 12).match(/.{1,2}/g).join(':');
        return formattedMac;
    }
    
    // Caso não seja um formato reconhecido, retornar os últimos 8 caracteres
    return macAddress.slice(-8);
}

// Função para exportar dados para impressão via Bluetooth
function exportDataForPrinting() {
    console.log('Iniciando exportação para impressão');
    
    // Verificar se há medições salvas
    const measurements = JSON.parse(localStorage.getItem('measurements') || '[]');
    if (measurements.length === 0) {
        alert('Não há medições salvas para imprimir!');
        vibrate(500);
        return;
    }
    
    // Mostrar diálogo de carregamento enquanto procura dispositivos
    const loadingDialog = document.createElement('div');
    loadingDialog.className = 'bluetooth-search-dialog';
    loadingDialog.innerHTML = `
        <div class="bluetooth-search-content">
            <h3>Buscando Dispositivos</h3>
            <div class="loading-spinner"></div>
            <p>Buscando dispositivos Bluetooth...</p>
        </div>
    `;
    document.body.appendChild(loadingDialog);
    
    // Dispositivos temporários para acumular durante o scan
    let foundDevices = {};
    
    // Escanear todos os dispositivos sem filtro (como na função startScan)
    ble.scan([], 20, function(device) {
        console.log('Dispositivo encontrado:', device);
        // Armazenar no objeto temporário
        if (!foundDevices[device.id]) {
            foundDevices[device.id] = device;
        }
    }, function(error) {
        console.error('Erro no escaneamento:', error);
        if (loadingDialog) {
            document.body.removeChild(loadingDialog);
        }
        alert('Erro ao buscar dispositivos Bluetooth: ' + (typeof error === 'string' ? error : JSON.stringify(error)));
    });
    
    // Após o término do scan, mostrar diálogo de seleção
    setTimeout(() => {
        console.log(`Scan completo. Encontrados ${Object.keys(foundDevices).length} dispositivos.`);
        
        if (loadingDialog) {
            document.body.removeChild(loadingDialog);
        }
        
        // Verificar se encontramos algo
        if (Object.keys(foundDevices).length === 0) {
            vibrate([100, 100, 100]); // Padrão de alerta
            alert('Nenhum dispositivo Bluetooth encontrado. Verifique se suas impressoras estão ligadas e visíveis.');
        } else {
            // Mostrar diálogo para seleção de impressora
            showPrinterSelectionDialog(foundDevices);
            vibrate([100, 50, 100]); // Padrão de conclusão
        }
    }, 21000); // Um segundo após o término do scan (que dura 20 segundos)
}

// Função para mostrar diálogo de seleção de impressora
function showPrinterSelectionDialog(devices) {
    // Verificar se encontramos dispositivos
    const deviceList = Object.values(devices);
    if (deviceList.length === 0) {
        alert('Nenhum dispositivo Bluetooth encontrado. Verifique se as impressoras estão ligadas e visíveis.');
        return;
    }
    
    // Ordenar dispositivos por nome
    const sortedDevices = deviceList.sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB);
    });
    
    // Criar diálogo de seleção de impressora
    const dialog = document.createElement('div');
    dialog.className = 'bluetooth-search-dialog';
    
    let dialogContent = `
        <div class="bluetooth-search-content">
            <h3>Selecione um Dispositivo</h3>
            <p style="text-align: center; margin-bottom: 10px; color: #aaa;">
                Toque em um dispositivo para imprimir
            </p>
            <div class="bluetooth-device-list">
    `;
    
    // Adicionar cada dispositivo à lista
    sortedDevices.forEach(device => {
        const deviceName = device.name || 'Dispositivo Desconhecido';
        
        dialogContent += `
            <div class="bluetooth-device-item" data-device-id="${device.id}">
                <div class="device-name">${deviceName}</div>
            </div>
        `;
    });
    
    dialogContent += `
            </div>
            <div class="bluetooth-dialog-buttons">
                <button id="cancelPrinterSelection">Cancelar</button>
            </div>
        </div>
    `;
    
    dialog.innerHTML = dialogContent;
    document.body.appendChild(dialog);
    
    // Adicionar eventos aos botões e itens da lista
    document.getElementById('cancelPrinterSelection').addEventListener('click', function() {
        document.body.removeChild(dialog);
    });
    
    // Adicionar evento de clique para cada item da impressora
    document.querySelectorAll('.bluetooth-device-item').forEach(item => {
        item.addEventListener('click', function() {
            const deviceId = this.getAttribute('data-device-id');
            document.body.removeChild(dialog);
            
            // Tentar imprimir para o dispositivo selecionado
            connectToBLEPrinter(devices[deviceId]);
        });
    });
}

// Função para conectar a dispositivos e tentar imprimir
function connectToBLEPrinter(device) {
    console.log('Tentando conectar ao dispositivo:', device);
    
    // Mostrar diálogo de carregamento enquanto conecta
    const loadingDialog = document.createElement('div');
    loadingDialog.className = 'bluetooth-search-dialog';
    loadingDialog.innerHTML = `
        <div class="bluetooth-search-content">
            <h3>Conectando</h3>
            <div class="loading-spinner"></div>
            <p>Conectando à impressora...</p>
        </div>
    `;
    document.body.appendChild(loadingDialog);
    
    // Tentar conectar ao dispositivo
    ble.connect(device.id, 
        function(peripheral) {
            console.log('Conectado ao dispositivo', peripheral);
            
            // Atualizar mensagem do diálogo de carregamento
            loadingDialog.querySelector('p').textContent = 'Preparando impressão...';
            
            // Imprimir usando uma abordagem BLE direta
            try {
                // Obter os dados a serem impressos
                const rawMeasurements = JSON.parse(localStorage.getItem('measurements') || '[]');
                
                // Ordenar por data (mais recente primeiro)
                const savedMeasurements = [...rawMeasurements].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                // Carregar o cabeçalho personalizado
                const customHeader = loadSettings();
                
                // Texto para impressão - NOVA FORMATAÇÃO COM CABEÇALHO PERSONALIZADO
                let printData = "\x1B\x40"; // ESC @ - Reset/inicializar impressora
                printData += "\x1B\x61\x01"; // ESC a 1 - Centralizar
                printData += "\x1D\x21\x11"; // GS ! 17 - Fonte um pouco maior e em negrito
                printData += customHeader.line1 + "\r\n";
                printData += customHeader.line2 + "\r\n";
                printData += "\x1D\x21\x00"; // GS ! 0 - Fonte normal
                printData += "--------------------------------\r\n";
                printData += "\x1B\x61\x00"; // ESC a 0 - Alinhar à esquerda
                printData += "Data: " + new Date().toLocaleDateString('pt-BR') + "\r\n\r\n";
                
                // Cabeçalho com colunas bem definidas e sem quebra
                printData += "IDENTIFICAÇÃO    PESO(KG)  HR \r\n";
                printData += "--------------------------------\r\n";
                
                // Limitar a quantidade de itens
                const maxItems = Math.min(savedMeasurements.length, 15);
                
                // Variáveis para totalizar os pesos
                let totalPesoKg = 0;
                
                // Adicionar cada medição - formato mais compacto
                for (let i = 0; i < maxItems; i++) {
                    const measurement = savedMeasurements[i];
                    
                    // Extrair apenas o valor numérico do peso em kg
                    let weightValue = measurement.weight;
                    if (weightValue.includes('Peso:')) {
                        weightValue = weightValue.replace('📊 Peso:', '').trim();
                    }
                    
                    // Calcular o peso em kg numerico
                    const numericWeightKg = parseFloat(weightValue.replace(/[^\d.,]/g, '').replace(',', '.'));
                    if (!isNaN(numericWeightKg)) {
                        // Somar aos totais
                        totalPesoKg += numericWeightKg;
                    }
                    
                    // Extrair apenas a hora da data/hora completa
                    const dateTime = new Date(measurement.timestamp);
                    const hora = dateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    
                    // Formatar como colunas fixas para evitar quebra de linha
                    // Limitar e padronizar o tamanho de cada campo
                    const identificacao = measurement.bracelet.padEnd(14).substring(0, 14);
                    const weightKg = weightValue.replace(/[^\d., ]/g, '').trim().padEnd(8).substring(0, 8);
                    
                    // Linha da tabela compactada para evitar quebra
                    printData += `${identificacao}${weightKg}${hora}\r\n`;
                }
                
                // Formatar totais
                const totalKgFormatado = totalPesoKg.toFixed(1).replace('.', ',');
                
                // Rodapé centralizado com totais
                printData += "\r\n";
                printData += "--------------------------------\r\n";
                printData += `TOTAL: ${totalKgFormatado} Kg\r\n`;
                printData += "--------------------------------\r\n";
                printData += "\x1B\x61\x01"; // ESC a 1 - Centralizar
                printData += `Total: ${savedMeasurements.length} registros\r\n`;
                printData += "App LUMAK Peso\r\n\r\n\r\n\r\n\r\n";
                
                // Corte de papel
                printData += "\x1D\x56\x00"; // GS V 0 - Corte de papel
                
                // Enviar os bytes corretamente
                const encoder = new TextEncoder();
                const printBytes = encoder.encode(printData);
                
                // Usar serviços e características comuns para impressoras BLE
                // Array de objetos com combinações de serviço e característica
                const serviceCharPairs = [
                    { service: "FFE0", characteristic: "FFE1" },
                    { service: "FFF0", characteristic: "FFF1" },
                    { service: "FFB0", characteristic: "FFB1" },
                    { service: "18F0", characteristic: "2AF1" }
                ];
                
                // Iniciar tentativas para cada par
                let currentPairIndex = 0;
                
                // Iniciar barra de progresso
                let progress = 0;
                const progressInterval = setInterval(function() {
                    progress += 5;
                    if (progress <= 95) {
                        loadingDialog.querySelector('p').textContent = `Enviando dados... ${progress}%`;
                    }
                }, 200);
                
                function tryNextPair() {
                    if (currentPairIndex >= serviceCharPairs.length) {
                        // Tentou todos os pares sem sucesso
                        clearInterval(progressInterval);
                        loadingDialog.querySelector('p').textContent = 'Falha na impressão';
                        
                        setTimeout(function() {
                            document.body.removeChild(loadingDialog);
                            ble.disconnect(peripheral.id);
                            alert('Não foi possível encontrar um serviço compatível nesta impressora. Tente outro dispositivo.');
                        }, 1000);
                        return;
                    }
                    
                    const currentPair = serviceCharPairs[currentPairIndex];
                    console.log(`Tentando par ${currentPairIndex+1}/${serviceCharPairs.length}: Serviço=${currentPair.service}, Característica=${currentPair.characteristic}`);
                    
                    // Atualizar mensagem
                    loadingDialog.querySelector('p').textContent = `Tentando método ${currentPairIndex+1}...`;
                    
                    // Enviar os dados em pequenos pedaços
                    const chunkSize = 20; // Tamanho pequeno para compatibilidade
                    let currentPosition = 0;
                    
                    function sendNextChunk() {
                        if (currentPosition >= printBytes.length) {
                            // Terminou de enviar este par com sucesso!
                            clearInterval(progressInterval);
                            loadingDialog.querySelector('p').textContent = 'Impressão concluída!';
                            
                            setTimeout(function() {
                                ble.disconnect(peripheral.id);
                                document.body.removeChild(loadingDialog);
                                alert('Documento enviado para impressão com sucesso!');
                            }, 1000);
                            return;
                        }
                        
                        // Calcular próximo pedaço
                        const endPos = Math.min(currentPosition + chunkSize, printBytes.length);
                        const chunk = printBytes.slice(currentPosition, endPos);
                        
                        // Tentar primeiro com writeWithoutResponse (mais comum em impressoras)
                        ble.writeWithoutResponse(
                            peripheral.id,
                            currentPair.service,
                            currentPair.characteristic,
                            chunk.buffer,
                            function() {
                                // Sucesso, avançar para o próximo pedaço
                                currentPosition = endPos;
                                // Pequeno atraso entre os pedaços (100ms)
                                setTimeout(sendNextChunk, 100);
                            },
                            function(error) {
                                // Tentar com write normal
                                ble.write(
                                    peripheral.id,
                                    currentPair.service,
                                    currentPair.characteristic,
                                    chunk.buffer,
                                    function() {
                                        // Sucesso com write
                                        currentPosition = endPos;
                                        setTimeout(sendNextChunk, 100);
                                    },
                                    function(error2) {
                                        // Ambos falharam, tentar próximo par
                                        console.error(`Erro ao enviar dados com par ${currentPairIndex+1}:`, error, error2);
                                        currentPairIndex++;
                                        tryNextPair();
                                    }
                                );
                            }
                        );
                    }
                    
                    // Iniciar envio para este par
                    sendNextChunk();
                }
                
                // Iniciar tentativas
                tryNextPair();
                
            } catch (error) {
                console.error('Erro ao preparar impressão:', error);
                document.body.removeChild(loadingDialog);
                ble.disconnect(peripheral.id);
                alert('Erro ao preparar os dados para impressão: ' + error.message);
            }
        }, 
        function(error) {
            console.error('Falha na conexão com o dispositivo:', error);
            if (loadingDialog) {
                document.body.removeChild(loadingDialog);
            }
            alert('Não foi possível conectar a este dispositivo. Verifique se ele está ligado e próximo.');
        }
    );
}

// Função para exportar como arquivo
function exportAsFile() {
    console.log('Exportando dados como arquivo');
    
    // Obter os dados salvos
    const savedMeasurements = JSON.parse(localStorage.getItem('measurements') || '[]');
    
    if (savedMeasurements.length === 0) {
        vibrate([50, 50, 50]); // Vibração curta de alerta
        alert('Não há dados salvos para exportar. Salve algumas medições primeiro.');
        return;
    }
    
    vibrate([50, 100, 50, 100]); // Padrão de vibração para processamento
    
    try {
        // Ordenar por data (mais recente primeiro)
        const sortedMeasurements = [...savedMeasurements].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Carregar o cabeçalho personalizado
        const customHeader = loadSettings();
        
        // Criar conteúdo HTML para impressão
        let htmlContent = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>${customHeader.line1} - ${customHeader.line2}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        margin: 20px;
                    }
                    h1 {
                        color: #333;
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .date {
                        text-align: right;
                        margin-bottom: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 12px;
                        text-align: left;
                    }
                    th {
                        background-color: #f2f2f2;
                        font-weight: bold;
                    }
                    tr:nth-child(even) {
                        background-color: #f9f9f9;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 40px;
                        font-size: 12px;
                        color: #666;
                        border-top: 1px solid #ddd;
                        padding-top: 10px;
                    }
                    @media print {
                        body {
                            margin: 0;
                            padding: 10px;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${customHeader.line1}</h1>
                    <h2>${customHeader.line2}</h2>
                </div>
                
                <div class="date">
                    Data: ${new Date().toLocaleDateString('pt-BR')}
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Identificação</th>
                            <th>Peso (Kg)</th>
                            <th>Data/Hora</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Adicionar cada medição à tabela
        sortedMeasurements.forEach((measurement, index) => {
            // Extrair apenas o valor numérico e unidade do peso (se disponível)
            let weightValue = measurement.weight;
            if (weightValue.includes('Peso:')) {
                weightValue = weightValue.replace('📊 Peso:', '').trim();
            }
            
            // Formatar a data/hora para formato brasileiro
            const dateTime = new Date(measurement.timestamp);
            const formattedDateTime = dateTime.toLocaleString('pt-BR');
            
            htmlContent += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${measurement.bracelet}</td>
                    <td>${weightValue}</td>
                    <td>${formattedDateTime}</td>
                </tr>
            `;
        });
        
        // Fechar a tabela e adicionar o rodapé
        htmlContent += `
                    </tbody>
                </table>
                
                <div class="no-print">
                    <p>Para imprimir este relatório, utilize a função de impressão do seu navegador (Ctrl+P ou Cmd+P).</p>
                    <button onclick="window.print()">Imprimir</button>
                </div>
                
                <div class="footer">
                    <p>Gerado pelo aplicativo LUMAK Peso em ${new Date().toLocaleString('pt-BR')}</p>
                    <p>Total de registros: ${sortedMeasurements.length}</p>
                </div>
            </body>
            </html>
        `;
        
        // Criar o blob para download
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const fileName = `relatorio-pesagem-lumak-${new Date().toISOString().slice(0, 10)}.html`;
        
        // Verificar se estamos em um dispositivo móvel ou em um navegador
        if (cordova.platformId === 'android' && window.cordova.file) {
            console.log('Salvando arquivo no Android');
            saveFileOnAndroid(blob, fileName);
        } else if (cordova.platformId === 'ios' && window.cordova.file) {
            console.log('Salvando arquivo no iOS');
            saveFileOnIOS(blob, fileName);
        } else {
            console.log('Salvando arquivo por meio de fallback');
            downloadFallback(blob, fileName);
        }
        
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        vibrate([100, 100, 300]); // Padrão de erro
        alert('Erro ao exportar dados: ' + error.message);
    }
}

// Função para salvar arquivo no Android
function saveFileOnAndroid(blob, fileName) {
    try {
        // Local para salvar em dispositivos Android
        const directory = cordova.file.externalRootDirectory + 'Download/';
        
        // Verificar se o diretório existe ou criar
        window.resolveLocalFileSystemURL(directory, function(dirEntry) {
            // Diretório existe, criar o arquivo
            createFile(dirEntry, blob, fileName);
        }, function(error) {
            // Erro ao acessar diretório, tentar criar
            window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function(rootDirEntry) {
                rootDirEntry.getDirectory('Download', { create: true }, function(dirEntry) {
                    createFile(dirEntry, blob, fileName);
                }, function(error) {
                    console.error('Erro ao criar diretório:', error);
                    // Fallback para armazenamento interno
                    window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function(dirEntry) {
                        createFile(dirEntry, blob, fileName);
                    }, function(error) {
                        console.error('Erro ao acessar armazenamento interno:', error);
                        alert('Não foi possível salvar o arquivo. Erro: ' + JSON.stringify(error));
                    });
                });
            }, function(error) {
                console.error('Erro ao acessar diretório raiz:', error);
                alert('Não foi possível acessar o armazenamento. Erro: ' + JSON.stringify(error));
            });
        });
    } catch (error) {
        console.error('Erro ao salvar arquivo no Android:', error);
        alert('Erro ao salvar arquivo: ' + error.message);
        // Tentar download como fallback
        downloadFallback(blob, fileName);
    }
}

// Função para salvar arquivo no iOS
function saveFileOnIOS(blob, fileName) {
    try {
        // Local para salvar em dispositivos iOS
        const directory = cordova.file.documentsDirectory;
        
        window.resolveLocalFileSystemURL(directory, function(dirEntry) {
            createFile(dirEntry, blob, fileName);
        }, function(error) {
            console.error('Erro ao acessar diretório iOS:', error);
            alert('Não foi possível acessar o local de armazenamento. Erro: ' + JSON.stringify(error));
            // Tentar download como fallback
            downloadFallback(blob, fileName);
        });
    } catch (error) {
        console.error('Erro ao salvar arquivo no iOS:', error);
        alert('Erro ao salvar arquivo: ' + error.message);
        // Tentar download como fallback
        downloadFallback(blob, fileName);
    }
}

// Função auxiliar para criar arquivo
function createFile(dirEntry, blob, fileName) {
    dirEntry.getFile(fileName, { create: true, exclusive: false }, function(fileEntry) {
        writeFile(fileEntry, blob);
    }, function(error) {
        console.error('Erro ao criar arquivo:', error);
        alert('Não foi possível criar o arquivo. Erro: ' + JSON.stringify(error));
    });
}

// Função auxiliar para escrever conteúdo no arquivo
function writeFile(fileEntry, blob) {
    fileEntry.createWriter(function(writer) {
        writer.onwriteend = function() {
            console.log('Arquivo salvo com sucesso:', fileEntry.fullPath);
            vibrate([100, 50, 100]); // Padrão de vibração para sucesso
            
            // Tentar abrir o arquivo após salvar
            if (cordova.plugins.fileOpener2) {
                cordova.plugins.fileOpener2.open(
                    fileEntry.nativeURL,
                    'text/html',
                    {
                        error: function(error) {
                            console.error('Erro ao abrir arquivo:', error);
                            alert('Arquivo salvo em: ' + fileEntry.nativeURL);
                        },
                        success: function() {
                            console.log('Arquivo aberto com sucesso');
                        }
                    }
                );
            } else {
                alert('Arquivo salvo em: ' + fileEntry.nativeURL);
            }
        };
        
        writer.onerror = function(error) {
            console.error('Erro ao escrever no arquivo:', error);
            alert('Erro ao salvar o arquivo: ' + error.message);
        };
        
        writer.write(blob);
    }, function(error) {
        console.error('Erro ao criar writer:', error);
        alert('Erro ao salvar o arquivo: ' + error.message);
    });
}

// Função de fallback para download em navegadores
function downloadFallback(blob, fileName) {
    try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
        
        vibrate([100, 50, 100]); // Padrão de vibração para sucesso
        console.log('Download iniciado');
    } catch (error) {
        console.error('Erro ao fazer download:', error);
        alert('Erro ao baixar o arquivo: ' + error.message);
    }
}

// Função para solicitar permissão do Bluetooth
function requestBluetoothPermission(successCallback, errorCallback) {
    console.log('Solicitando permissões de Bluetooth');
    
    // Flag para acompanhar se o callback já foi chamado
    let callbackCalled = false;
    
    // Verificar se estamos em um dispositivo móvel
    if (!window.cordova) {
        console.log('Não estamos em ambiente Cordova, assumindo permissões');
        if (successCallback && !callbackCalled) {
            callbackCalled = true;
            successCallback();
        }
        return;
    }
    
    // Verificar se o plugin de permissões está disponível
    const permissions = cordova.plugins.permissions;
    
    // Se não tivermos o plugin de permissões ou estivermos no iOS (que gerencia permissões diferente)
    if (!permissions || device.platform === 'iOS') {
        console.log('Plugin de permissões não disponível ou iOS detectado, assumindo permissões concedidas');
        if (successCallback && !callbackCalled) {
            callbackCalled = true;
            successCallback();
        }
        return;
    }
    
    // Para Android, precisamos solicitar permissões específicas
    // Lista de permissões necessárias baseadas na versão do Android
    let requiredPermissions = [permissions.ACCESS_FINE_LOCATION];
    
    // Para Android 12+ (API 31+), adicionar novas permissões de Bluetooth
    const sdkVersion = parseInt(device.version) || 0;
    if (sdkVersion >= 31 && permissions.BLUETOOTH_SCAN) {
        requiredPermissions = [
            permissions.BLUETOOTH_SCAN,
            permissions.BLUETOOTH_CONNECT,
            permissions.ACCESS_FINE_LOCATION
        ];
    } else if (permissions.BLUETOOTH) {
        // Para versões mais antigas do Android
        requiredPermissions = [
            permissions.BLUETOOTH,
            permissions.BLUETOOTH_ADMIN,
            permissions.ACCESS_FINE_LOCATION
        ];
    }
    
    // Função recursiva para verificar cada permissão
    function checkNextPermission(index) {
        // Se já concluímos todas as permissões, chamar o callback de sucesso
        if (index >= requiredPermissions.length) {
            console.log('Todas as permissões de Bluetooth concedidas');
            if (successCallback && !callbackCalled) {
                callbackCalled = true;
                successCallback();
            }
            return;
        }
        
        const permission = requiredPermissions[index];
        
        // Verificar se já temos a permissão
        permissions.checkPermission(permission, function(status) {
            if (status.hasPermission) {
                console.log(`Permissão já concedida: ${permission}`);
                // Verificar próxima permissão
                checkNextPermission(index + 1);
            } else {
                console.log(`Solicitando permissão: ${permission}`);
                // Solicitar permissão
                permissions.requestPermission(permission, function(status) {
                    if (status.hasPermission) {
                        console.log(`Permissão concedida: ${permission}`);
                        // Verificar próxima permissão
                        checkNextPermission(index + 1);
                    } else {
                        console.log(`Permissão negada: ${permission}`);
                        // Se a permissão foi negada e é crítica para o Bluetooth, chamar callback de erro
                        if (errorCallback && !callbackCalled) {
                            callbackCalled = true;
                            errorCallback();
                        } else if (!callbackCalled) {
                            // Se não temos callback de erro ou queremos continuar mesmo com permissão negada
                            callbackCalled = true;
                            successCallback();
                        }
                    }
                }, function(error) {
                    console.error(`Erro ao solicitar permissão: ${permission}`, error);
                    // Em caso de erro, tentar continuar mesmo assim
                    if (successCallback && !callbackCalled) {
                        callbackCalled = true;
                        successCallback();
                    }
                });
            }
        }, function(error) {
            console.error(`Erro ao verificar permissão: ${permission}`, error);
            // Em caso de erro, tentar continuar mesmo assim
            if (successCallback && !callbackCalled) {
                callbackCalled = true;
                successCallback();
            }
        });
    }
    
    // Iniciar verificação de permissões
    checkNextPermission(0);
    
    // Se houver algum problema com o plugin de permissões, garantir que o callback será chamado após um timeout
    setTimeout(function() {
        if (!callbackCalled && successCallback) {
            console.log('Timeout de permissões atingido, prosseguindo mesmo assim');
            callbackCalled = true;
            successCallback();
        }
    }, 3000);
}

// Função simplificada para enviar dados à impressora BLE
function sendPrintDataSimplified(peripheral, data) {
    console.log('Enviando dados para a impressora BLE (modo simplificado)');
    
    // Atualizar mensagem do diálogo de carregamento
    const loadingDialog = document.querySelector('.bluetooth-search-dialog');
    if (loadingDialog) {
        loadingDialog.querySelector('p').textContent = 'Enviando dados para impressão...';
    }
    
    // Para impressoras térmicas comuns, geralmente o serviço SPP é usado
    // UUID do serviço SPP (Serial Port Profile): 0x1101
    const SPP_SERVICE = '1101';
    
    // Lista de UUIDs de serviços conhecidos para impressoras térmicas
    const PRINTER_SERVICE_UUIDS = [
        '1101',    // SPP (Serial Port Profile)
        'ffe0',    // HM-10/HM-11 e similares
        'fff0',    // Outra variante comum
        'ffb0',    // Outra variante comum
        '18f0',    // Outra variante comum
        '1800',    // Generic Access
        '1801'     // Generic Attribute
    ];
    
    // Lista de UUIDs de características conhecidas para impressoras
    const PRINTER_CHAR_UUIDS = [
        'ffe1',    // HM-10/HM-11 e similares
        'fff1',    // Outra variante comum
        'ffb1',    // Outra variante comum
        'ff01',    // Outra variante comum
        '2af1'     // Bluetooth SIG Printing
    ];
    
    // Verificar todos os serviços disponíveis
    ble.services(peripheral.id, function(services) {
        console.log('Serviços disponíveis:', services);
        
        // Procurar serviço compatível
        let serviceToUse = null;
        
        // Primeiro, procurar pelos serviços conhecidos de impressoras
        for (let service of services) {
            // Normalizar UUID para comparação
            const serviceUuid = service.toLowerCase().replace(/-/g, '');
            
            // Verificar se o UUID está na lista de serviços conhecidos
            for (let knownUuid of PRINTER_SERVICE_UUIDS) {
                if (serviceUuid.includes(knownUuid)) {
                    serviceToUse = service;
                    console.log('Serviço de impressora encontrado:', service);
                    break;
                }
            }
            
            if (serviceToUse) break;
        }
        
        // Se não encontrou um serviço específico, usar o primeiro disponível
        if (!serviceToUse && services.length > 0) {
            serviceToUse = services[0];
            console.log('Usando primeiro serviço disponível:', serviceToUse);
        }
        
        if (serviceToUse) {
            // Buscar características
            ble.characteristics(peripheral.id, serviceToUse, function(characteristics) {
                console.log('Características disponíveis:', characteristics);
                
                // Encontrar uma característica que permita escrita
                let charToUse = null;
                
                // Primeiro, procurar pelas características conhecidas de impressoras
                for (let char of characteristics) {
                    if (!char.properties) continue;
                    
                    // Normalizar UUID para comparação
                    const charUuid = char.uuid.toLowerCase().replace(/-/g, '');
                    
                    // Verificar se o UUID está na lista de características conhecidas
                    for (let knownUuid of PRINTER_CHAR_UUIDS) {
                        if (charUuid.includes(knownUuid)) {
                            charToUse = char;
                            console.log('Característica de impressora encontrada:', char.uuid);
                            break;
                        }
                    }
                    
                    if (charToUse) break;
                }
                
                // Se não encontrou uma característica conhecida, procurar uma que permita escrita
                if (!charToUse) {
                    for (let char of characteristics) {
                        if (char.properties && 
                            (char.properties.includes('Write') || 
                             char.properties.includes('WriteWithoutResponse'))) {
                            charToUse = char;
                            console.log('Usando primeira característica com permissão de escrita:', char.uuid);
                            break;
                        }
                    }
                }
                
                // Se encontrou uma característica para escrita
                if (charToUse) {
                    // Determinar método de escrita
                    const writeType = charToUse.properties.includes('WriteWithoutResponse') 
                        ? 'writeWithoutResponse' 
                        : 'write';
                    
                    console.log(`Usando método de escrita: ${writeType}`);
                    
                    // Enviar comando de inicialização primeiro
                    const initCommand = new Uint8Array([
                        0x1B, 0x40  // ESC @ - Inicializar impressora
                    ]);
                    
                    ble[writeType](
                        peripheral.id,
                        serviceToUse,
                        charToUse.uuid,
                        initCommand.buffer,
                        function() {
                            console.log('Comando de inicialização enviado com sucesso');
                            
                            // Após inicializar, enviar os dados em pequenos chunks
                            // Para impressoras térmicas, usar chunks menores
                            const chunkSize = 16; // Tamanho reduzido para compatibilidade
                            const totalChunks = Math.ceil(data.length / chunkSize);
                            let currentChunk = 0;
                            
                            function sendNextChunk() {
                                if (currentChunk >= totalChunks) {
                                    console.log('Todos os chunks enviados com sucesso!');
                                    
                                    // Enviar comando de corte e alimentação de papel no final
                                    const cutCommand = new Uint8Array([
                                        0x1B, 0x64, 0x05, // ESC d n - Avanço de 5 linhas
                                        0x1D, 0x56, 0x42, 0x01 // GS V B n - Corte parcial
                                    ]);
                                    
                                    ble[writeType](
                                        peripheral.id,
                                        serviceToUse,
                                        charToUse.uuid,
                                        cutCommand.buffer,
                                        function() {
                                            console.log('Comando de corte enviado com sucesso');
                                            // Desconectar após uma pausa para dar tempo à impressora
                                            setTimeout(function() {
                                                if (loadingDialog) {
                                                    document.body.removeChild(loadingDialog);
                                                }
                                                ble.disconnect(peripheral.id);
                                                vibrate([100, 50, 100, 50, 100]);
                                                alert('Documento enviado para impressão com sucesso!');
                                            }, 1000);
                                        },
                                        function(error) {
                                            console.error('Erro ao enviar comando de corte:', error);
                                            if (loadingDialog) {
                                                document.body.removeChild(loadingDialog);
                                            }
                                            ble.disconnect(peripheral.id);
                                            vibrate([100, 50, 100, 50, 100]);
                                            alert('Documento enviado para impressão, mas houve erro no corte!');
                                        }
                                    );
                                    return;
                                }
                                
                                const start = currentChunk * chunkSize;
                                const end = Math.min(start + chunkSize, data.length);
                                const chunk = data.slice(start, end);
                                
                                console.log(`Enviando chunk ${currentChunk + 1}/${totalChunks} (${chunk.length} bytes)`);
                                
                                // Atualizar diálogo com progresso
                                if (loadingDialog) {
                                    loadingDialog.querySelector('p').textContent = 
                                        `Enviando dados para impressão (${Math.round((currentChunk/totalChunks)*100)}%)...`;
                                }
                                
                                ble[writeType](
                                    peripheral.id,
                                    serviceToUse,
                                    charToUse.uuid,
                                    chunk.buffer,
                                    function() {
                                        console.log(`Chunk ${currentChunk + 1} enviado`);
                                        currentChunk++;
                                        // Aumento do atraso entre chunks para 100ms - crucial para impressoras térmicas
                                        setTimeout(sendNextChunk, 100);
                                    },
                                    function(error) {
                                        console.error(`Erro ao enviar chunk ${currentChunk + 1}:`, error);
                                        // Tentar continuar mesmo com erro em um chunk
                                        currentChunk++;
                                        setTimeout(sendNextChunk, 100);
                                    }
                                );
                            }
                            
                            // Iniciar envio com um pequeno atraso para a impressora processar o comando de inicialização
                            setTimeout(sendNextChunk, 200);
                        },
                        function(error) {
                            console.error('Erro ao enviar comando de inicialização:', error);
                            // Tentar enviar os dados mesmo assim
                            alert('Aviso: Erro na inicialização da impressora, tentando imprimir mesmo assim...');
                            
                            // Modificar para método mais simples - em alguns casos funciona melhor
                            const simpleCommand = new Uint8Array([
                                0x1B, 0x40  // ESC @ - Inicializar impressora (comando mais básico)
                            ]);
                            
                            // Tentar uma inicialização mais simples
                            ble[writeType](
                                peripheral.id,
                                serviceToUse,
                                charToUse.uuid,
                                simpleCommand.buffer,
                                function() {
                                    // Enviar texto simples como teste após 500ms
                                    setTimeout(function() {
                                        const testText = textToBytes("TESTE DE IMPRESSAO\n\n");
                                        ble[writeType](
                                            peripheral.id, 
                                            serviceToUse, 
                                            charToUse.uuid, 
                                            testText.buffer,
                                            function() {
                                                console.log('Teste de impressão enviado');
                                                if (loadingDialog) {
                                                    document.body.removeChild(loadingDialog);
                                                }
                                                alert('Favor verificar se a impressora imprimiu um teste. Se sim, tente imprimir novamente.');
                                                ble.disconnect(peripheral.id);
                                            },
                                            function(error) {
                                                console.error('Falha no teste de impressão:', error);
                                                if (loadingDialog) {
                                                    document.body.removeChild(loadingDialog);
                                                }
                                                alert('Não foi possível enviar teste para a impressora.');
                                                ble.disconnect(peripheral.id);
                                            }
                                        );
                                    }, 500);
                                },
                                function(error) {
                                    console.error('Erro no comando de inicialização simples:', error);
                                    if (loadingDialog) {
                                        document.body.removeChild(loadingDialog);
                                    }
                                    ble.disconnect(peripheral.id);
                                    alert('Falha na comunicação com a impressora. Tente reiniciar a impressora.');
                                }
                            );
                        }
                    );
                } else {
                    console.error('Nenhuma característica com permissão de escrita encontrada');
                    if (loadingDialog) {
                        document.body.removeChild(loadingDialog);
                    }
                    ble.disconnect(peripheral.id);
                    alert('Esta impressora não possui uma forma compatível de comunicação.');
                }
            }, function(error) {
                console.error('Erro ao buscar características:', error);
                if (loadingDialog) {
                    document.body.removeChild(loadingDialog);
                }
                ble.disconnect(peripheral.id);
                alert('Erro ao buscar características do dispositivo: ' + (typeof error === 'string' ? error : JSON.stringify(error)));
            });
        } else {
            console.error('Nenhum serviço encontrado no dispositivo');
            if (loadingDialog) {
                document.body.removeChild(loadingDialog);
            }
            ble.disconnect(peripheral.id);
            alert('Não foi possível encontrar serviços Bluetooth neste dispositivo.');
        }
    }, function(error) {
        console.error('Erro ao buscar serviços:', error);
        if (loadingDialog) {
            document.body.removeChild(loadingDialog);
        }
        ble.disconnect(peripheral.id);
        alert('Erro ao buscar serviços do dispositivo: ' + (typeof error === 'string' ? error : JSON.stringify(error)));
    });
}

// Função para preparar e enviar dados para a impressora BLE
function prepareDataForPrinting(peripheral) {
    console.log('Preparando dados para impressão');

    // Referência para o diálogo de carregamento
    const loadingDialog = document.querySelector('.bluetooth-search-dialog');
    if (loadingDialog) {
        loadingDialog.querySelector('p').textContent = 'Preparando impressão...';
    }
    
    // Obter os dados a serem impressos
    const rawMeasurements = JSON.parse(localStorage.getItem('measurements') || '[]');
    
    // Ordenar por data (mais recente primeiro)
    const savedMeasurements = [...rawMeasurements].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Obter serviços disponíveis
    ble.services(peripheral.id, function(services) {
        console.log('Serviços disponíveis:', services);
        
        // Escolher o primeiro serviço
        if (services && services.length > 0) {
            const serviceId = services[0];
            
            // Obter características do serviço
            ble.characteristics(peripheral.id, serviceId, function(characteristics) {
                console.log('Características disponíveis:', characteristics);
                
                // Encontrar uma característica que permite escrita
                let charToUse = null;
                for (let i = 0; i < characteristics.length; i++) {
                    const char = characteristics[i];
                    if (char.properties && 
                        (char.properties.includes('Write') || 
                         char.properties.includes('WriteWithoutResponse'))) {
                        charToUse = char;
                        break;
                    }
                }
                
                if (charToUse) {
                    // Determinar o método de escrita
                    const writeMethod = charToUse.properties.includes('WriteWithoutResponse') 
                        ? 'writeWithoutResponse' 
                        : 'write';
                    
                    console.log('Usando método:', writeMethod);
                    
                    // Criar relatório simples (texto puro)
                    let reportText = "RELATORIO DE PESAGEM\n";
                    reportText += "LUMAK BALANCAS\n";
                    reportText += "--------------------------------\n";
                    reportText += "Data: " + new Date().toLocaleDateString('pt-BR') + "\n\n";
                    reportText += "IDENTIFICAÇÃO      PESO(KG)   HR \n";
                    reportText += "--------------------------------\n";
                    
                    // Limitar a 15 itens para não sobrecarregar o buffer
                    const maxItems = Math.min(savedMeasurements.length, 15);
                    
                    // Adicionar cada medição
                    for (let i = 0; i < maxItems; i++) {
                        const item = savedMeasurements[i];
                        
                        // Ajustar o peso (remover prefixo se existir)
                        let weightValue = item.weight;
                        if (weightValue.includes('Peso:')) {
                            weightValue = weightValue.replace('📊 Peso:', '').trim();
                        }
                        
                        // Alinhar em colunas
                        const identificacao = (item.bracelet || '').padEnd(14, ' ');
                        const weight = (weightValue.replace(/[^\d., ]/g, '').trim() || '').padEnd(10, ' ');
                        
                        reportText += identificacao + weight + "\n";
                    }
                    
                    // Rodapé
                    reportText += "\nTotal: " + savedMeasurements.length + " registros\n";
                    reportText += "App LUMAK Peso\n\n\n\n\n";
                    
                    // Converter texto para bytes
                    const encoder = new TextEncoder();
                    const fullData = encoder.encode(reportText);
                    
                    // Enviar em pedaços pequenos
                    const chunkSize = 20; // Tamanho pequeno para compatibilidade máxima
                    const totalChunks = Math.ceil(fullData.length / chunkSize);
                    let currentChunk = 0;
                    
                    // Diálogo de carregamento
                    const loadingDialog = document.querySelector('.loading-dialog');
                    if (loadingDialog) {
                        loadingDialog.querySelector('p').textContent = 'Enviando para impressora...';
                    }
                    
                    function sendNextBLEChunk() {
                        if (currentChunk >= totalChunks) {
                            // Todos os dados enviados
                            console.log('Impressão concluída!');
                            
                            setTimeout(function() {
                                // Desconectar
                                ble.disconnect(peripheral.id, function() {
                                    console.log('Desconectado com sucesso');
                                });
                                
                                // Remover diálogo
                                const loadingDialog = document.querySelector('.bluetooth-search-dialog');
                                if (loadingDialog) {
                                    document.body.removeChild(loadingDialog);
                                }
                                
                                // Notificar usuário
                                vibrate([100, 50, 100]);
                                alert('Documento enviado para impressão!');
                            }, 1000);
                            
                            return;
                        }
                        
                        // Calcular o chunk atual
                        const start = currentChunk * chunkSize;
                        const end = Math.min((currentChunk + 1) * chunkSize, fullData.length);
                        const chunk = fullData.slice(start, end);
                        
                        // Atualizar progresso
                        if (loadingDialog) {
                            const percent = Math.round((currentChunk / totalChunks) * 100);
                            loadingDialog.querySelector('p').textContent = `Enviando para impressora... ${percent}%`;
                        }
                        
                        // Enviar chunk
                        ble[writeMethod](
                            peripheral.id,
                            serviceId,
                            charToUse.uuid,
                            chunk.buffer,
                            function() {
                                // Sucesso - enviar próximo chunk
                                currentChunk++;
                                setTimeout(sendNextBLEChunk, 50);
                            },
                            function(error) {
                                // Erro - tentar continuar
                                console.error('Erro ao enviar chunk:', error);
                                currentChunk++;
                                setTimeout(sendNextBLEChunk, 50);
                            }
                        );
                    }
                    
                    // Iniciar envio
                    sendNextBLEChunk();
                } else {
                    console.error('Nenhuma característica com permissão de escrita encontrada');
                    
                    // Remover diálogo
                    const loadingDialog = document.querySelector('.loading-dialog');
                    if (loadingDialog) {
                        document.body.removeChild(loadingDialog);
                    }
                    
                    alert('Este dispositivo não parece ser uma impressora compatível.');
                    ble.disconnect(peripheral.id);
                }
            }, function(error) {
                console.error('Erro ao obter características:', error);
                
                // Remover diálogo
                const loadingDialog = document.querySelector('.loading-dialog');
                if (loadingDialog) {
                    document.body.removeChild(loadingDialog);
                }
                
                alert('Erro ao comunicar com o dispositivo. Por favor, tente novamente.');
                ble.disconnect(peripheral.id);
            });
        } else {
            console.error('Nenhum serviço encontrado');
            
            // Remover diálogo
            const loadingDialog = document.querySelector('.loading-dialog');
            if (loadingDialog) {
                document.body.removeChild(loadingDialog);
            }
            
            alert('Este dispositivo não possui serviços Bluetooth necessários para impressão.');
            ble.disconnect(peripheral.id);
        }
    }, function(error) {
        console.error('Erro ao obter serviços:', error);
        
        // Remover diálogo
        const loadingDialog = document.querySelector('.loading-dialog');
        if (loadingDialog) {
            document.body.removeChild(loadingDialog);
        }
        
        alert('Não foi possível se comunicar com o dispositivo.');
        ble.disconnect(peripheral.id);
    });
}

// Função para carregar as configurações salvas
function loadSettings() {
    console.log('Carregando configurações salvas');
    
    try {
        // Recuperar configurações do localStorage
        const savedHeader = JSON.parse(localStorage.getItem('printHeader') || JSON.stringify(DEFAULT_HEADER));
        
        // Aplicar aos campos se estiverem disponíveis
        if (headerLine1Input) {
            headerLine1Input.value = savedHeader.line1 || DEFAULT_HEADER.line1;
        }
        
        if (headerLine2Input) {
            headerLine2Input.value = savedHeader.line2 || DEFAULT_HEADER.line2;
        }
        
        // Atualizar prévia
        updateHeaderPreview();
        
        console.log('Configurações carregadas com sucesso:', savedHeader);
        return savedHeader;
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        return DEFAULT_HEADER;
    }
}

// Função para salvar as configurações
function saveSettings() {
    console.log('Salvando configurações');
    
    try {
        // Obter valores dos campos
        const headerLine1 = headerLine1Input ? headerLine1Input.value.trim() : DEFAULT_HEADER.line1;
        const headerLine2 = headerLine2Input ? headerLine2Input.value.trim() : DEFAULT_HEADER.line2;
        
        // Validar valores
        const line1 = headerLine1 || DEFAULT_HEADER.line1;
        const line2 = headerLine2 || DEFAULT_HEADER.line2;
        
        // Criar objeto de configuração
        const headerConfig = {
            line1,
            line2
        };
        
        // Salvar no localStorage
        localStorage.setItem('printHeader', JSON.stringify(headerConfig));
        
        // Atualizar prévia
        updateHeaderPreview();
        
        // Mostrar feedback
        showSettingsFeedback('Configurações salvas com sucesso!');
        
        vibrate([50, 100, 50]); // Padrão de vibração para salvamento
        console.log('Configurações salvas com sucesso:', headerConfig);
        
        return true;
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        alert('Erro ao salvar configurações: ' + error.message);
        vibrate([100, 100, 300]); // Padrão de erro
        return false;
    }
}

// Função para atualizar a prévia do cabeçalho
function updateHeaderPreview() {
    if (previewHeader1 && headerLine1Input) {
        previewHeader1.textContent = headerLine1Input.value || DEFAULT_HEADER.line1;
    }
    
    if (previewHeader2 && headerLine2Input) {
        previewHeader2.textContent = headerLine2Input.value || DEFAULT_HEADER.line2;
    }
}

// Função para mostrar feedback na tela de configurações
function showSettingsFeedback(message) {
    // Verificar se já existe um feedback
    let feedback = document.querySelector('.settings-feedback');
    
    // Se não existe, criar um novo
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'settings-feedback';
        
        // Inserir após o botão de salvar
        const saveBtn = document.getElementById('btn-save-settings');
        if (saveBtn) {
            saveBtn.parentNode.insertBefore(feedback, saveBtn.nextSibling);
        }
    }
    
    // Definir a mensagem
    feedback.textContent = message;
    
    // Mostrar com animação
    feedback.classList.remove('show');
    setTimeout(() => {
        feedback.classList.add('show');
    }, 10);
    
    // Remover após 3 segundos
    setTimeout(() => {
        feedback.classList.remove('show');
    }, 3000);
}

// Função para processar os valores de peso recebidos
function processaValorRecebido(value) {
    console.log('Valor recebido:', value);
    
    try {
        // Se o valor estiver vazio, não fazer nada
        if (!value || value.trim() === '') {
        return;
    }
    
        // Atualizar o peso em kg
        if (weightValue) {
            // Processar o valor para separar o número da unidade
            const valorProcessado = value.trim();
            
            // Separar o número da unidade (kg)
            let valorFormatado;
            if (valorProcessado.toLowerCase().includes('kg')) {
                // Se já tiver "kg", separar para formatar
                const partes = valorProcessado.split('kg');
                valorFormatado = partes[0].trim() + ' <span class="weight-unit">kg</span>';
            } else {
                // Se não tiver "kg", adicionar a unidade
                valorFormatado = valorProcessado + ' <span class="weight-unit">kg</span>';
            }
            
            // Atualizar o elemento com HTML para aplicar o estilo da unidade
            weightValue.innerHTML = valorFormatado;
    }
    
    // Vibração suave quando novos dados são recebidos
    vibrate(50);
        
    } catch (error) {
        console.error('Erro ao processar valor:', error);
    }
}

// Função para atualizar elementos da interface baseado no status da conexão
function updateConnectionStatus() {
    // Mostra "0,0 kg" quando não há conexão, com kg menor
    if (!isConnected && weightValue) {
        weightValue.innerHTML = '0,0 <span class="weight-unit">kg</span>';
        
        // Verificar se há um último dispositivo conhecido
        const lastDevice = loadLastConnectedDevice();
        if (!lastDevice) {
            updateConnectionStatusMessage('Não conectado à balança. Use o Menu > Conectar.', '');
        }
    } else if (isConnected) {
        updateConnectionStatusMessage('Conectado à balança', 'status-connected');
    }
}

// Função para detectar quando novos dados são recebidos
function onData(buffer) {
    // Processar os dados recebidos da balança
    try {
        const value = bytesToString(buffer);
        processaValorRecebido(value);
    } catch (error) {
        console.error("Erro ao processar dados:", error);
    }
}

// Converter string para bytes (para enviar à balança)
function stringToBytes(text) {
    const encoder = new TextEncoder();
    return encoder.encode(text).buffer;
}

// Funções de calibração
function atualizarStatusCalibracao() {
    if (!calibrationStatus) return;
    
    if (isConnected && bleDevice) {
        calibrationStatus.textContent = 'Balança conectada. Pronto para calibrar.';
        calibrationStatus.className = 'status-message info';
        
        // Habilitar todos os botões e campos relacionados à conexão
        if (btnSetDivision) btnSetDivision.disabled = false;
        if (btnSetCapacity) btnSetCapacity.disabled = false;
        if (divisaoInput) divisaoInput.disabled = false;
        if (capacidadeInput) capacidadeInput.disabled = false;
        btnStartCalibration.disabled = false;
    } else {
        calibrationStatus.textContent = 'Conecte-se a uma balança para iniciar a calibração';
        calibrationStatus.className = 'status-message';
        
        // Desabilitar todos os botões e campos relacionados à conexão
        if (btnSetDivision) btnSetDivision.disabled = true;
        if (btnSetCapacity) btnSetCapacity.disabled = true;
        if (divisaoInput) divisaoInput.disabled = true;
        if (capacidadeInput) capacidadeInput.disabled = true;
        btnStartCalibration.disabled = true;
        btnSendWeight.disabled = true;
        btnConfirmCalibration.disabled = true;
        refWeightInput.disabled = true;
        
        // Resetar estado
        calibrando = false;
        aguardandoPeso = false;
        aguardandoConfirmacao = false;
    }
}

function mostrarMensagemCalibracao(mensagem, tipo) {
    if (!calibrationStatus) return;
    
    calibrationStatus.textContent = mensagem;
    calibrationStatus.className = 'status-message';
    
    if (tipo) {
        calibrationStatus.classList.add(tipo);
    }
}

function iniciarCalibracao() {
    if (!isConnected || !bleDevice) {
        mostrarMensagemCalibracao('Não há conexão com a balança', 'error');
        return;
    }
    
    console.log('Iniciando processo de calibração');
    
    try {
        // Enviar comando de calibração para a balança
        ble.write(
            bleDevice.id,
            SERVICE_UUID,
            COMMAND_UUID,
            stringToBytes('calibrar'),
            function() {
                console.log('Comando de calibração enviado com sucesso');
                calibrando = true;
                aguardandoPeso = true;
                aguardandoConfirmacao = false;
                
                // Atualizar UI
                btnStartCalibration.disabled = true;
                refWeightInput.disabled = false;
                btnSendWeight.disabled = false;
                btnConfirmCalibration.disabled = true;
                
                // Exibir mensagem para o usuário
                mostrarMensagemCalibracao('Informe o peso de referência (em kg) que será utilizado para calibração', 'info');
                
                // Vibrar para indicar sucesso
                vibrate([50, 100, 50]);
            },
            function(error) {
                console.error('Erro ao enviar comando de calibração:', error);
                mostrarMensagemCalibracao('Erro ao iniciar calibração: ' + error, 'error');
                calibrando = false;
                vibrate([100, 100, 300]); // Padrão de erro
            }
        );
    } catch (error) {
        console.error('Erro ao iniciar calibração:', error);
        mostrarMensagemCalibracao('Erro ao iniciar calibração: ' + error.message, 'error');
        vibrate([100, 100, 300]); // Padrão de erro
    }
}

function enviarPesoCalibracao() {
    if (!isConnected || !bleDevice || !calibrando || !aguardandoPeso) {
        mostrarMensagemCalibracao('Processo de calibração não iniciado corretamente', 'error');
        return;
    }
    
    // Obter o valor do peso de referência
    pesoCalibracao = parseFloat(refWeightInput.value);
    
    if (isNaN(pesoCalibracao) || pesoCalibracao <= 0) {
        mostrarMensagemCalibracao('Informe um peso de referência válido (maior que zero)', 'warning');
        return;
    }
    
    console.log('Enviando peso de referência:', pesoCalibracao);
    
    try {
        // Enviar o valor do peso de referência para a balança
        ble.write(
            bleDevice.id,
            SERVICE_UUID,
            COMMAND_UUID,
            stringToBytes(pesoCalibracao.toString()),
            function() {
                console.log('Peso de referência enviado com sucesso');
                
                // Atualizar estados
                aguardandoPeso = false;
                aguardandoConfirmacao = true;
                
                // Atualizar UI
                btnSendWeight.disabled = true;
                btnConfirmCalibration.disabled = false;
                
                // Exibir mensagem para o usuário
                mostrarMensagemCalibracao('Agora retire qualquer peso da balança, aguarde a estabilização e depois coloque o peso de ' + pesoCalibracao + ' kg sobre a balança. Em seguida, clique em "Confirmar".', 'info');
                
                // Vibrar para indicar sucesso
                vibrate([50, 100, 50]);
            },
            function(error) {
                console.error('Erro ao enviar peso de referência:', error);
                mostrarMensagemCalibracao('Erro ao enviar peso: ' + error, 'error');
                vibrate([100, 100, 300]); // Padrão de erro
            }
        );
    } catch (error) {
        console.error('Erro ao enviar peso de referência:', error);
        mostrarMensagemCalibracao('Erro ao enviar peso: ' + error.message, 'error');
        vibrate([100, 100, 300]); // Padrão de erro
    }
}

function confirmarCalibracao() {
    if (!isConnected || !bleDevice || !calibrando || !aguardandoConfirmacao) {
        mostrarMensagemCalibracao('Processo de calibração não está na etapa de confirmação', 'error');
        return;
    }
    
    console.log('Confirmando calibração');
    
    try {
        // Enviar comando "ok" para confirmar a calibração
        ble.write(
            bleDevice.id,
            SERVICE_UUID,
            COMMAND_UUID,
            stringToBytes('ok'),
            function() {
                console.log('Comando de confirmação enviado com sucesso');
                
                // Exibir mensagem para o usuário
                mostrarMensagemCalibracao('Aguardando a balança processar a calibração...', 'info');
                
                // Vibrar para indicar sucesso
                vibrate([50, 100, 50]);
                
                // Aguardar resposta da balança (será processada por onData)
                setTimeout(function() {
                    // Se não recebemos resposta em 5 segundos, assumimos sucesso
                    if (calibrando) {
                        finalizarCalibracao();
                    }
                }, 5000);
            },
            function(error) {
                console.error('Erro ao enviar confirmação:', error);
                mostrarMensagemCalibracao('Erro ao confirmar calibração: ' + error, 'error');
                vibrate([100, 100, 300]); // Padrão de erro
            }
        );
    } catch (error) {
        console.error('Erro ao confirmar calibração:', error);
        mostrarMensagemCalibracao('Erro ao confirmar calibração: ' + error.message, 'error');
        vibrate([100, 100, 300]); // Padrão de erro
    }
}

function finalizarCalibracao() {
    // Resetar estados
    calibrando = false;
    aguardandoPeso = false;
    aguardandoConfirmacao = false;
    
    // Atualizar UI
    mostrarMensagemCalibracao('Calibração concluída com sucesso!', 'success');
    btnStartCalibration.disabled = false;
    btnSendWeight.disabled = true;
    btnConfirmCalibration.disabled = true;
    refWeightInput.disabled = true;
    refWeightInput.value = '';
    
    // Vibrar para indicar sucesso
    vibrate([100, 50, 100, 50, 100]);
}

// Sobrescrever função onConnectSuccess para atualizar status de calibração
const originalConnectSuccess = onConnectSuccess;
onConnectSuccess = function(peripheral) {
    originalConnectSuccess(peripheral);
    atualizarStatusCalibracao();
};

// Sobrescrever função disconnect para atualizar status de calibração
const originalDisconnect = disconnect;
disconnect = function() {
    originalDisconnect();
    atualizarStatusCalibracao();
};

// Função para zerar a balança (tare)
function zeroScale() {
    if (!isConnected || !bleDevice) {
        // Se estamos na tela de calibração, mostra mensagem lá
        if (document.getElementById('calibrationPage').classList.contains('active')) {
            mostrarMensagemCalibracao('Não há conexão com a balança', 'error');
        } else {
            // Se estamos na tela principal, mostra um alert
            alert('Não há conexão com a balança');
        }
        return;
    }
    
    console.log('Enviando comando para zerar a balança (tare)');
    
    // Enviar comando "tare" para a balança
    ble.write(
        bleDevice.id,
        SERVICE_UUID,
        COMMAND_UUID,
        stringToBytes('tare'),
        function() {
            console.log('Comando de tare enviado com sucesso');
            // Se estamos na tela de calibração, mostra mensagem lá
            if (document.getElementById('calibrationPage').classList.contains('active')) {
                mostrarMensagemCalibracao('Balança zerada com sucesso!', 'success');
            } else {
                // Se estamos na tela principal, mostra um toast temporário
                const toast = document.createElement('div');
                toast.textContent = '✅ Balança zerada com sucesso!';
                toast.style.position = 'fixed';
                toast.style.bottom = '20px';
                toast.style.left = '50%';
                toast.style.transform = 'translateX(-50%)';
                toast.style.backgroundColor = '#28a745';
                toast.style.color = 'white';
                toast.style.padding = '10px 20px';
                toast.style.borderRadius = '5px';
                toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                toast.style.zIndex = '1000';
                document.body.appendChild(toast);
                setTimeout(() => {
                    toast.remove();
                }, 2000);
            }
            vibrate([100, 50, 100]); // Padrão de vibração de sucesso
        },
        function(error) {
            console.error('Erro ao enviar comando de tare:', error);
            // Se estamos na tela de calibração, mostra mensagem lá
            if (document.getElementById('calibrationPage').classList.contains('active')) {
                mostrarMensagemCalibracao('Erro ao zerar balança: ' + error, 'error');
            } else {
                // Se estamos na tela principal, mostra um alert
                alert('Erro ao zerar balança: ' + error);
            }
            vibrate([100, 50, 100, 50, 100]); // Padrão de vibração de erro
        }
    );
}

// Função para enviar configuração de divisão/casas decimais
function enviarConfigDivisao() {
    if (!isConnected || !bleDevice) {
        mostrarMensagemCalibracao('Não há conexão com a balança', 'error');
        return;
    }
    
    // Obter o valor da divisão
    const divisao = divisaoInput.value.trim();
    
    if (!divisao) {
        mostrarMensagemCalibracao('Informe o número de casas decimais', 'warning');
        return;
    }
    
    console.log('Enviando configuração de divisão:', divisao);
    
    try {
        // Enviar comando no formato "casas:X"
        const comando = `casas:${divisao}`;
        
        ble.write(
            bleDevice.id,
            SERVICE_UUID,
            COMMAND_UUID,
            stringToBytes(comando),
            function() {
                console.log('Comando de divisão enviado com sucesso');
                mostrarMensagemCalibracao(`Divisão configurada para ${divisao} casa(s) decimal(is)`, 'success');
                vibrate([50, 100, 50]); // Padrão de vibração de sucesso
            },
            function(error) {
                console.error('Erro ao enviar comando de divisão:', error);
                mostrarMensagemCalibracao('Erro ao configurar divisão: ' + error, 'error');
                vibrate([100, 100, 300]); // Padrão de erro
            }
        );
    } catch (error) {
        console.error('Erro ao configurar divisão:', error);
        mostrarMensagemCalibracao('Erro ao configurar divisão: ' + error.message, 'error');
        vibrate([100, 100, 300]); // Padrão de erro
    }
}

// Função para enviar configuração de capacidade máxima
function enviarConfigCapacidade() {
    if (!isConnected || !bleDevice) {
        mostrarMensagemCalibracao('Não há conexão com a balança', 'error');
        return;
    }
    
    // Obter o valor da capacidade máxima
    const capacidade = capacidadeInput.value.trim();
    
    if (!capacidade) {
        mostrarMensagemCalibracao('Informe a capacidade máxima', 'warning');
        return;
    }
    
    console.log('Enviando configuração de capacidade máxima:', capacidade);
    
    try {
        // Enviar comando no formato "capmax:X"
        const comando = `capmax:${capacidade}`;
        
        ble.write(
            bleDevice.id,
            SERVICE_UUID,
            COMMAND_UUID,
            stringToBytes(comando),
            function() {
                console.log('Comando de capacidade máxima enviado com sucesso');
                mostrarMensagemCalibracao(`Capacidade máxima configurada para ${capacidade} kg`, 'success');
                vibrate([50, 100, 50]); // Padrão de vibração de sucesso
            },
            function(error) {
                console.error('Erro ao enviar comando de capacidade máxima:', error);
                mostrarMensagemCalibracao('Erro ao configurar capacidade máxima: ' + error, 'error');
                vibrate([100, 100, 300]); // Padrão de erro
            }
        );
    } catch (error) {
        console.error('Erro ao configurar capacidade máxima:', error);
        mostrarMensagemCalibracao('Erro ao configurar capacidade máxima: ' + error.message, 'error');
        vibrate([100, 100, 300]); // Padrão de erro
    }
}

// Função para atualizar o texto de status de conexão
function updateConnectionStatusMessage(message, statusClass) {
    if (!connectionStatusMessage) {
        connectionStatusMessage = document.getElementById('connection-status-message');
        if (!connectionStatusMessage) return;
    }
    
    // Remover todas as classes de status anteriores
    connectionStatusMessage.classList.remove('status-connecting', 'status-connected', 'status-error');
    
    // Definir a mensagem
    connectionStatusMessage.textContent = message;
    
    // Adicionar a classe de status, se fornecida
    if (statusClass) {
        connectionStatusMessage.classList.add(statusClass);
    }
}

// Nova função para zerar a balança (enviando o comando "zerar")
function resetScale() {
    if (!isConnected || !bleDevice) {
        // Se estamos na tela de calibração, mostra mensagem lá
        if (document.getElementById('calibrationPage').classList.contains('active')) {
            mostrarMensagemCalibracao('Não há conexão com a balança', 'error');
        } else {
            // Se estamos na tela principal, mostra um alert
            alert('Não há conexão com a balança');
        }
        return;
    }
    
    console.log('Enviando comando para zerar a balança (reset)');
    
    // Enviar comando "zerar" para a balança
    ble.write(
        bleDevice.id,
        SERVICE_UUID,
        COMMAND_UUID,
        stringToBytes('zerar'),
        function() {
            console.log('Comando de zerar enviado com sucesso');
            // Se estamos na tela de calibração, mostra mensagem lá
            if (document.getElementById('calibrationPage').classList.contains('active')) {
                mostrarMensagemCalibracao('Balança zerada com sucesso!', 'success');
            } else {
                // Se estamos na tela principal, mostra um toast temporário
                const toast = document.createElement('div');
                toast.textContent = '✅ Balança zerada com sucesso!';
                toast.style.position = 'fixed';
                toast.style.bottom = '20px';
                toast.style.left = '50%';
                toast.style.transform = 'translateX(-50%)';
                toast.style.backgroundColor = '#28a745';
                toast.style.color = 'white';
                toast.style.padding = '10px 20px';
                toast.style.borderRadius = '5px';
                toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                toast.style.zIndex = '1000';
                document.body.appendChild(toast);
                setTimeout(() => {
                    toast.remove();
                }, 2000);
            }
            vibrate([100, 50, 100]); // Padrão de vibração de sucesso
        },
        function(error) {
            console.error('Erro ao enviar comando de zerar:', error);
            // Se estamos na tela de calibração, mostra mensagem lá
            if (document.getElementById('calibrationPage').classList.contains('active')) {
                mostrarMensagemCalibracao('Erro ao zerar balança: ' + error, 'error');
            } else {
                // Se estamos na tela principal, mostra um alert
                alert('Erro ao zerar balança: ' + error);
            }
            vibrate([100, 50, 100, 50, 100]); // Padrão de vibração de erro
        }
    );
}

    
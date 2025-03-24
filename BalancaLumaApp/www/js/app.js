// Constantes
const SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0";
const CHARACTERISTIC_UUID = "87654321-4321-8765-4321-abcdef987654";

// Variáveis globais
let bleDevice = null;
let isConnected = false;
let foundDevices = {};
let permissionsRequested = false;

// Elementos da UI
let statusText = null;
let deviceSelect = null;
let connectBtn = null;
let weightValue = null;
let bluetoothStatus = null;
let braceletInput = null;
let savedData = null;
let historyList = null;

// Evento de inicialização
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log('Cordova está pronto');
    
    // Inicializar elementos da UI
    statusText = document.getElementById('statusText');
    deviceSelect = document.getElementById('deviceSelect');
    connectBtn = document.getElementById('connectBtn');
    weightValue = document.getElementById('weightValue');
    bluetoothStatus = document.getElementById('bluetoothStatus');
    braceletInput = document.getElementById('braceletInput');
    savedData = document.getElementById('savedData');
    historyList = document.getElementById('historyList');
    
    // Adicionar eventos para os botões
    setupEventListeners();
    
    // Solicitar permissões imediatamente ao iniciar
    setTimeout(() => {
        console.log('Solicitando permissões ao iniciar');
        checkPermissions(permissionsGranted => {
            console.log('Resultado das permissões iniciais:', permissionsGranted);
            permissionsRequested = true;
        });
    }, 1000);
    
    // Carregar dados salvos
    loadSavedData();
    
    // Carregar histórico
    loadHistory();
    
    // Vibrações curtas para indicar que o app está pronto
    vibrate(100);
    
    // Log de informações para debug
    logDeviceInfo();
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
        button.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            console.log('Navegando para página:', page);
            vibrate(50);
            showPage(page);
            
            // Se navegando para a página de histórico, recarregar os dados
            if (page === 'historyPage') {
                loadHistory();
            }
        });
    });
    
    // Botão de configurações
    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            console.log('Botão de configurações clicado');
            vibrate(50);
            showSettings();
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

function showSettings() {
    vibrate(50);
    alert('Configurações em desenvolvimento');
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
    console.log('Conectado ao dispositivo', peripheral);
    isConnected = true;
    bleDevice = peripheral;
    bluetoothStatus.classList.add('connected');
    vibrate([100, 50, 100, 50, 100]); // Padrão de sucesso na conexão
    
    // Tentar assinar o serviço/característica específico
    try {
        console.log("Tentando iniciar notificações com UUID:", SERVICE_UUID, CHARACTERISTIC_UUID);
        ble.startNotification(
            peripheral.id,
            SERVICE_UUID,
            CHARACTERISTIC_UUID,
            function(data) {
                console.log("Dados recebidos:", data);
                onWeightDataReceived(data);
            },
            function(error) {
                console.log('Não é uma balança LUMAK, erro na notificação:', error);
                statusText.textContent = '✅ Conectado (não é uma balança LUMAK)';
            }
        );
        statusText.textContent = '✅ Conectado como balança!';
    } catch (error) {
        console.log('Falha ao configurar notificações:', error);
        statusText.textContent = '✅ Conectado (erro nas notificações)';
    }
    
    showPage('scalePage');
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
        console.log("Valor recebido:", value);
        weightValue.textContent = `📊 Peso: ${value} Kg`;
        // Vibração suave quando novos dados são recebidos
        vibrate(50);
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
            ble.disconnect(bleDevice.id, 
                () => {
                    console.log('Desconectado com sucesso');
                    vibrate([50, 100, 50]); // Padrão de desconexão
                },
                error => {
                    console.error('Erro ao desconectar:', error);
                    vibrate([100, 100, 300]); // Padrão de erro
                }
            );
        } catch (error) {
            console.error('Erro ao desconectar:', error);
            vibrate([100, 100, 300]); // Padrão de erro
        }
    }
    
    isConnected = false;
    bleDevice = null;
    bluetoothStatus.classList.remove('connected');
    weightValue.textContent = 'Aguardando dados...';
    showPage('homePage');
}

// Funções de dados
function saveData() {
    console.log("Função saveData chamada");
    const bracelet = braceletInput.value;
    const weight = weightValue.textContent;
    
    if (bracelet && weight !== 'Aguardando dados...') {
        // Salvar no localStorage
        const savedMeasurements = JSON.parse(localStorage.getItem('measurements') || '[]');
        
        // Criar novo objeto de medição
        const newMeasurement = {
            id: Date.now().toString(), // ID único baseado no timestamp
            bracelet,
            weight,
            timestamp: new Date().toISOString()
        };
        
        savedMeasurements.push(newMeasurement);
        localStorage.setItem('measurements', JSON.stringify(savedMeasurements));
        
        // Adicionar ao display atual (página da balança)
        const dataElement = document.createElement('div');
        dataElement.textContent = `${bracelet}: ${weight}`;
        savedData.appendChild(dataElement);
        
        // Limpar campo do brinco
        braceletInput.value = '';
        vibrate([50, 50, 150]); // Vibração para indicar salvamento bem-sucedido
        
        // Feedback visual
        const feedback = document.createElement('div');
        feedback.textContent = '✅ Dados salvos com sucesso!';
        feedback.style.color = '#28a745';
        feedback.style.textAlign = 'center';
        feedback.style.padding = '10px';
        document.querySelector('.card').appendChild(feedback);
        
        // Remover feedback após 2 segundos
        setTimeout(() => {
            feedback.remove();
        }, 2000);
    } else {
        vibrate([50, 50, 50]); // Vibração curta de alerta
        alert('Por favor, preencha o número do brinco e aguarde uma leitura válida.');
    }
}

// Carregar dados salvos ao iniciar
function loadSavedData() {
    if (!savedData) {
        console.error("Elemento savedData não está disponível");
        return;
    }
    
    const savedMeasurements = JSON.parse(localStorage.getItem('measurements') || '[]');
    savedData.innerHTML = '';
    
    // Mostrar apenas os últimos 3 registros na tela da balança
    const recentMeasurements = savedMeasurements.slice(-3);
    
    recentMeasurements.forEach(measurement => {
        const dataElement = document.createElement('div');
        dataElement.textContent = `${measurement.bracelet}: ${measurement.weight}`;
        savedData.appendChild(dataElement);
    });
    
    if (recentMeasurements.length > 0) {
        const totalText = document.createElement('div');
        totalText.textContent = `Mostrando ${recentMeasurements.length} de ${savedMeasurements.length} registros`;
        totalText.style.textAlign = 'center';
        totalText.style.fontSize = '12px';
        totalText.style.color = '#aaa';
        totalText.style.marginTop = '5px';
        savedData.appendChild(totalText);
    } else if (savedMeasurements.length === 0) {
        const emptyText = document.createElement('div');
        emptyText.textContent = 'Nenhum dado salvo ainda';
        emptyText.style.textAlign = 'center';
        emptyText.style.color = '#aaa';
        savedData.appendChild(emptyText);
    }
    
    console.log("Dados carregados:", savedMeasurements.length);
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
        
        // Criar elemento para o item do histórico
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.dataset.id = measurement.id;
        
        historyItem.innerHTML = `
            <div class="history-item-content">
                <strong>${measurement.bracelet}</strong>: ${weightValue}
                <span class="history-item-date">${formattedDateTime}</span>
            </div>
            <div class="history-item-actions">
                <button class="delete-item" title="Excluir item">
                    <span class="material-icons">delete</span>
                </button>
            </div>
        `;
        
        // Adicionar evento para excluir item
        historyItem.querySelector('.delete-item').addEventListener('click', function(e) {
            e.stopPropagation();
            deleteHistoryItem(measurement.id);
        });
        
        historyList.appendChild(historyItem);
    });
    
    // Adicionar contador no final
    const counterElement = document.createElement('div');
    counterElement.className = 'history-counter';
    counterElement.textContent = `Total: ${savedMeasurements.length} registros`;
    counterElement.style.textAlign = 'center';
    counterElement.style.padding = '10px';
    counterElement.style.color = '#aaa';
    historyList.appendChild(counterElement);
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
    console.log('Buscando impressoras Bluetooth...');
    
    // Verificar se temos dados para imprimir
    const savedMeasurements = JSON.parse(localStorage.getItem('measurements') || '[]');
    if (savedMeasurements.length === 0) {
        vibrate([50, 50, 50]); // Vibração curta de alerta
        alert('Não há dados salvos para imprimir. Salve algumas medições primeiro.');
        return;
    }
    
    // Mostrar um diálogo de carregamento
    const loadingDialog = document.createElement('div');
    loadingDialog.className = 'loading-dialog';
    loadingDialog.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p>Buscando impressoras Bluetooth...</p>
        </div>
    `;
    document.body.appendChild(loadingDialog);
    
    // Verificar e solicitar permissões
    checkPermissions(permissionsGranted => {
        if (!permissionsGranted) {
            document.body.removeChild(loadingDialog);
            alert('É necessário conceder permissões de Bluetooth para encontrar impressoras.');
            return;
        }
        
        // Escanear dispositivos Bluetooth
        foundDevices = {};
        vibrate(200); // Vibração longa para indicar início do escaneamento
        
        ble.scan([], 10, function(device) {
            // Armazenar dispositivo encontrado
            if (!foundDevices[device.id]) {
                foundDevices[device.id] = device;
                console.log('Dispositivo encontrado para impressão:', device);
            }
        }, function(error) {
            document.body.removeChild(loadingDialog);
            console.error('Erro ao buscar impressoras:', error);
            alert('Erro ao buscar impressoras: ' + (typeof error === 'string' ? error : JSON.stringify(error)));
        });
        
        // Após escanear, mostrar diálogo de seleção de impressora
        setTimeout(() => {
            document.body.removeChild(loadingDialog);
            showPrinterSelectionDialog(foundDevices);
        }, 10000); // 10 segundos de escaneamento
    });
}

// Função para mostrar diálogo de seleção de impressora
function showPrinterSelectionDialog(devices) {
    // Verificar se encontramos dispositivos
    const deviceList = Object.values(devices);
    if (deviceList.length === 0) {
        alert('Nenhum dispositivo Bluetooth encontrado. Verifique se as impressoras estão ligadas e visíveis.');
        return;
    }
    
    // Criar diálogo de seleção de impressora
    const dialog = document.createElement('div');
    dialog.className = 'printer-selection-dialog';
    
    let dialogContent = `
        <div class="printer-selection-content">
            <h3>Selecione uma Impressora</h3>
            <div class="printer-list">
    `;
    
    // Adicionar cada dispositivo à lista
    deviceList.forEach(device => {
        const deviceName = device.name || 'Dispositivo ' + formatMacAddress(device.id);
        const signalStrength = device.rssi ? `(Sinal: ${device.rssi} dBm)` : '';
        
        dialogContent += `
            <div class="printer-item" data-device-id="${device.id}">
                <div class="printer-name">${deviceName}</div>
                <div class="printer-info">${signalStrength}</div>
            </div>
        `;
    });
    
    dialogContent += `
            </div>
            <div class="printer-dialog-buttons">
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
    document.querySelectorAll('.printer-item').forEach(item => {
        item.addEventListener('click', function() {
            const deviceId = this.getAttribute('data-device-id');
            document.body.removeChild(dialog);
            
            // Tentar imprimir para o dispositivo selecionado
            connectToPrinter(devices[deviceId]);
        });
    });
}

// Função para tentar conectar e imprimir para uma impressora
function connectToPrinter(device) {
    console.log('Tentando conectar à impressora:', device);
    
    // Mostrar diálogo de carregamento
    const loadingDialog = document.createElement('div');
    loadingDialog.className = 'loading-dialog';
    loadingDialog.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p>Conectando à impressora...</p>
        </div>
    `;
    document.body.appendChild(loadingDialog);
    
    // Tentar conectar ao dispositivo
    ble.connect(device.id, 
        function(peripheral) {
            console.log('Conectado à impressora', peripheral);
            
            // Verificar se o dispositivo é uma impressora
            const isPrinter = isPrinterDevice(peripheral);
            
            if (isPrinter) {
                // Preparar dados para impressão
                prepareDataForPrinting(peripheral);
            } else {
                document.body.removeChild(loadingDialog);
                ble.disconnect(peripheral.id);
                alert(`O dispositivo "${device.name || 'selecionado'}" não parece ser uma impressora Bluetooth.`);
            }
        }, 
        function(error) {
            document.body.removeChild(loadingDialog);
            console.error('Falha na conexão com a impressora:', error);
            alert('Não foi possível conectar à impressora: ' + (typeof error === 'string' ? error : JSON.stringify(error)));
        }
    );
}

// Função para verificar se um dispositivo é uma impressora
function isPrinterDevice(peripheral) {
    // Tentar identificar impressoras com base nos serviços e características
    // Esta é uma heurística simples, pois não há um padrão universal para impressoras BLE
    if (peripheral.services) {
        const printerServiceUUIDs = [
            "18f0", // Impressoras genéricas
            "1812", // HID (algumas impressoras usam)
            "1800", // Impressoras térmicas
            "1801", // SPP para impressoras
            "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // ESC/POS
            "49535343-fe7d-4ae5-8fa9-9fafd205e455"  // Impressoras compatíveis com ISSC
        ];
        
        for (const service of peripheral.services) {
            const serviceUUID = service.toLowerCase();
            for (const printerUUID of printerServiceUUIDs) {
                if (serviceUUID.includes(printerUUID)) {
                    console.log('Possível impressora detectada:', peripheral);
                    return true;
                }
            }
        }
    }
    
    // Também verificamos pelo nome do dispositivo
    if (peripheral.name) {
        const name = peripheral.name.toLowerCase();
        if (name.includes("print") || 
            name.includes("impressora") || 
            name.includes("escpos") || 
            name.includes("epson") || 
            name.includes("zebra") || 
            name.includes("brother") || 
            name.includes("hp") || 
            name.includes("canon")) {
            return true;
        }
    }
    
    // Se não conseguimos identificar positivamente, vamos considerar que não é uma impressora
    return false;
}

// Função para preparar dados para impressão
function prepareDataForPrinting(peripheral) {
    console.log('Preparando dados para impressão');
    
    // Obter os dados a serem impressos
    const rawMeasurements = JSON.parse(localStorage.getItem('measurements') || '[]');
    
    // Ordenar por data (mais recente primeiro)
    const savedMeasurements = [...rawMeasurements].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Preparar comandos de impressão em formato ESC/POS (formato comum de impressoras térmicas)
    // Iniciar formatação
    let printData = new Uint8Array([
        0x1B, 0x40,             // ESC @ - Inicializar impressora
        0x1B, 0x21, 0x30,       // ESC ! 0 - Texto centralizado e grande
        0x1B, 0x61, 0x01        // ESC a 1 - Alinhamento centralizado
    ]);
    
    // Adicionar texto de cabeçalho
    const headerText = "Relatório de Pesagem - LUMAK\n\n";
    const headerBytes = textToBytes(headerText);
    
    // Adicionar data
    const dateText = "Data: " + new Date().toLocaleDateString('pt-BR') + "\n\n";
    const dateBytes = textToBytes(dateText);
    
    // Formatação de tabela
    let tableBytes = textToBytes("-------------------------------------------\n");
    tableBytes = concatTypedArrays(tableBytes, textToBytes("ID | BRINCO | PESO | DATA\n"));
    tableBytes = concatTypedArrays(tableBytes, textToBytes("-------------------------------------------\n"));
    
    // Adicionar cada medição
    let dataBytes = new Uint8Array(0);
    savedMeasurements.forEach((measurement, index) => {
        // Extrair apenas o valor numérico do peso
        let weightValue = measurement.weight;
        if (weightValue.includes('Peso:')) {
            weightValue = weightValue.replace('📊 Peso:', '').trim();
        }
        
        // Formatar a data para formato brasileiro
        const dateTime = new Date(measurement.timestamp);
        const formattedDate = dateTime.toLocaleDateString('pt-BR');
        
        // Linha da tabela
        const line = `${index + 1} | ${measurement.bracelet} | ${weightValue} | ${formattedDate}\n`;
        dataBytes = concatTypedArrays(dataBytes, textToBytes(line));
    });
    
    // Rodapé
    const footerBytes = textToBytes(`\nTotal: ${savedMeasurements.length} registros\n\nGerado pelo app LUMAK Peso\n\n\n\n`);
    
    // Concatenar todos os comandos e textos
    printData = concatTypedArrays(printData, headerBytes);
    printData = concatTypedArrays(printData, dateBytes);
    printData = concatTypedArrays(printData, tableBytes);
    printData = concatTypedArrays(printData, dataBytes);
    printData = concatTypedArrays(printData, footerBytes);
    
    // Adicionar comando de corte de papel
    const cutCommand = new Uint8Array([0x1D, 0x56, 0x41, 0x10]); // GS V A 16 - Corte parcial com alimentação de 16 linhas
    printData = concatTypedArrays(printData, cutCommand);
    
    // Enviar dados para a impressora
    sendPrintData(peripheral, printData);
}

// Função para converter texto para bytes
function textToBytes(text) {
    const encoder = new TextEncoder();
    return encoder.encode(text);
}

// Função para concatenar arrays tipados
function concatTypedArrays(a, b) {
    const c = new Uint8Array(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
}

// Função para enviar dados para a impressora
function sendPrintData(peripheral, data) {
    console.log('Enviando dados para a impressora');
    
    // Tentar identificar as características de escrita da impressora
    ble.services(peripheral.id, function(services) {
        let found = false;
        
        // Procurar por uma característica que permita escrita
        for (const service of services) {
            ble.characteristics(peripheral.id, service, function(characteristics) {
                for (const characteristic of characteristics) {
                    // Verificar se a característica tem permissão de escrita
                    if (characteristic.properties.includes('Write') || 
                        characteristic.properties.includes('WriteWithoutResponse')) {
                        
                        console.log('Tentando escrever na característica:', characteristic.uuid);
                        
                        // Enviar dados para a impressora
                        ble.write(
                            peripheral.id,
                            service,
                            characteristic.uuid,
                            data.buffer,
                            function() {
                                console.log('Dados enviados com sucesso para a impressora');
                                document.querySelector('.loading-dialog').remove();
                                ble.disconnect(peripheral.id);
                                vibrate([100, 50, 100, 50, 100]);
                                alert('Documento enviado para impressão com sucesso!');
                                found = true;
                            },
                            function(error) {
                                console.error('Erro ao enviar dados para impressora:', error);
                                document.querySelector('.loading-dialog').remove();
                                ble.disconnect(peripheral.id);
                                alert('Erro ao enviar dados para impressora. Tente exportar como arquivo.');
                            }
                        );
                        
                        // Tentar apenas uma característica de cada vez
                        return;
                    }
                }
                
                if (!found) {
                    document.querySelector('.loading-dialog').remove();
                    ble.disconnect(peripheral.id);
                    alert('Não foi possível encontrar uma forma de enviar dados para este dispositivo. Ele pode não ser uma impressora compatível.');
                }
            });
        }
    });
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
        
        // Criar conteúdo HTML para impressão
        let htmlContent = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>Relatório de Pesagem - LUMAK</title>
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
                    <h1>Relatório de Pesagem - LUMAK</h1>
                </div>
                
                <div class="date">
                    Data: ${new Date().toLocaleDateString('pt-BR')}
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Identificação/Brinco</th>
                            <th>Peso</th>
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
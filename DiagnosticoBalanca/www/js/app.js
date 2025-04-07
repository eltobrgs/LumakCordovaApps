// Namespace para o aplicativo
const app = {
    // Constantes para UUIDs BLE
    SERVICE_UUID: "0000181A-0000-1000-8000-00805F9B34FB",
    CHARACTERISTIC_UUID_MV: "00002A6E-0000-1000-8000-00805F9B34FB",     // Para dados de MV/Célula
    CHARACTERISTIC_UUID_SERIAL: "00002A6F-0000-1000-8000-00805F9B34FB", // Para dados de Serial
    
    // Variáveis de estado
    bleDevice: null,
    isConnected: false,
    foundDevices: {},
    permissionsRequested: false,
    autoUpdateTimer: null,
    
    // Elementos da UI
    elements: {
        statusText: null,
        deviceSelect: null,
        connectBtn: null,
        serialData: null,
        cellData: null
    },
    
    // Inicialização do aplicativo
    initialize: function() {
        console.log('Inicializando aplicativo LUMAK DIAGNÓSTICO');
        
        // Configuração de elementos da UI
        this.setupUIElements();
        
        // Configuração de listeners de eventos
        this.setupEventListeners();
        
        // Checagem de permissões
        setTimeout(() => {
            console.log('Solicitando permissões ao iniciar');
            this.checkPermissions(permissionsGranted => {
                console.log('Resultado das permissões iniciais:', permissionsGranted);
                this.permissionsRequested = true;
            });
        }, 1000);
        
        // Vibração para indicar que o app está pronto
        this.vibrate(100);
        
        // Log de informações de dispositivo
        this.logDeviceInfo();
    },
    
    // Configuração de elementos da UI
    setupUIElements: function() {
        this.elements.statusText = document.getElementById('statusText');
        this.elements.deviceSelect = document.getElementById('deviceSelect');
        this.elements.connectBtn = document.getElementById('connectBtn');
        this.elements.serialData = document.getElementById('serialData');
        this.elements.cellData = document.getElementById('cellData');
    },
    
    // Configuração de listeners de eventos
    setupEventListeners: function() {
        // Eventos de navegação
        document.querySelectorAll('[data-page]').forEach(element => {
            element.addEventListener('click', event => {
                const pageName = element.getAttribute('data-page');
                this.showPage(pageName);
                this.vibrate(50);
            });
        });
        
        // Eventos para botões específicos
        const scanBtn = document.getElementById('btn-scan');
        if (scanBtn) {
            scanBtn.addEventListener('click', () => {
                this.vibrate(100);
                this.scanDevices();
            });
        }
        
        if (this.elements.connectBtn) {
            this.elements.connectBtn.addEventListener('click', () => {
                this.vibrate(100);
                this.connectToDevice();
            });
        }
        
        // Botões de atualização de dados
        const refreshSerialBtn = document.getElementById('btn-refresh-serial');
        if (refreshSerialBtn) {
            refreshSerialBtn.addEventListener('click', () => {
                this.vibrate(50);
                this.readSerialData();
            });
        }
        
        const refreshCellBtn = document.getElementById('btn-refresh-cell');
        if (refreshCellBtn) {
            refreshCellBtn.addEventListener('click', () => {
                this.vibrate(50);
                this.readCellData();
            });
        }
    },
    
    // Checagem e solicitação de permissões necessárias
    checkPermissions: function(callback) {
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
                const requestNextPermission = (index) => {
                    if (index >= permissionsToRequest.length) {
                        // Todas as permissões foram solicitadas
                        this.permissionsRequested = true;
                        console.log('Todas as permissões solicitadas');
                        this.vibrate([100, 50, 100]); // Padrão de vibração para indicar conclusão
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
                            this.vibrate(200); // Vibração mais longa para chamar atenção para a solicitação
                            
                            permissions.requestPermission(permission, 
                                status => {
                                    console.log('Resultado da solicitação de permissão ' + permission + ': ' + status.hasPermission);
                                    // Continuar para a próxima permissão, independentemente do resultado
                                    requestNextPermission(index + 1);
                                },
                                error => {
                                    console.error('Erro ao solicitar permissão ' + permission + ':', error);
                                    this.vibrate([100, 100, 300]); // Padrão de erro
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
                };
                
                // Iniciar solicitação de permissões
                requestNextPermission(0);
                
            } catch (error) {
                console.error('Erro ao verificar permissões:', error);
                if (callback) callback(false);
            }
        } else {
            // Não é Android, não precisa solicitar permissões
            console.log('Não é Android, permissões não são necessárias');
            this.permissionsRequested = true;
            if (callback) callback(true);
        }
    },
    
    // Navegação entre páginas
    showPage: function(pageName) {
        console.log(`Navegando para: ${pageName}`);
        
        // Remover a classe active de todas as páginas
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Adicionar a classe active à página selecionada
        const targetPage = document.getElementById(pageName);
        if (targetPage) {
            targetPage.classList.add('active');
            
            // Se estiver indo para uma página de teste, iniciar a leitura
            if (pageName === 'serialTestPage' && this.isConnected) {
                this.startAutoUpdate('serial');
            } else if (pageName === 'cellTestPage' && this.isConnected) {
                this.startAutoUpdate('cell');
            } else {
                this.stopAutoUpdate();
            }
        } else {
            console.error(`Página ${pageName} não encontrada`);
        }
    },
    
    // Escanear por dispositivos BLE
    scanDevices: function() {
        if (!window.ble) {
            this.updateStatusText("Plugin BLE não disponível", "status-error");
            return;
        }
        
        // Limpar dispositivos anteriores
        this.foundDevices = {};
        this.elements.deviceSelect.innerHTML = '<option value="">Selecione um dispositivo</option>';
        this.elements.deviceSelect.disabled = true;
        this.elements.connectBtn.disabled = true;
        
        // Atualizar status
        this.updateStatusText("Escaneando por dispositivos...", "status-connecting");
        
        // Verificar permissões antes de escanear
        if (!this.permissionsRequested) {
            this.updateStatusText("Verificando permissões...", "status-connecting");
            this.checkPermissions(permissionsGranted => {
                console.log('Resultado da verificação de permissões:', permissionsGranted);
                // Iniciar o escaneamento mesmo se as permissões não forem concedidas
                // Em algumas versões do Android, nem todas as permissões são necessárias
                setTimeout(() => {
                    this.startScan();
                }, 500);
            });
        } else {
            this.startScan();
        }
    },
    
    // Iniciar escaneamento BLE
    startScan: function() {
        this.updateStatusText("Escaneando por dispositivos...", "status-connecting");
        
        // Iniciar o escaneamento
        ble.scan([], 5, this.onDeviceDiscovered.bind(this), error => {
            console.error("Erro no escaneamento BLE: ", error);
            this.updateStatusText("Erro ao escanear: " + error, "status-error");
        });
    },
    
    // Callback para quando um dispositivo é encontrado
    onDeviceDiscovered: function(device) {
        if (device.name) {
            console.log(`Dispositivo encontrado: ${device.name} (${device.id})`);
            
            // Armazenar o dispositivo encontrado
            this.foundDevices[device.id] = device;
            
            // Atualizar a seleção de dispositivos
            const option = document.createElement('option');
            option.value = device.id;
            option.text = `${device.name} (${device.id})`;
            this.elements.deviceSelect.appendChild(option);
            
            // Habilitar a seleção e o botão de conectar
            this.elements.deviceSelect.disabled = false;
            this.elements.connectBtn.disabled = false;
            
            // Atualizar status
            this.updateStatusText("Dispositivos encontrados. Selecione um para conectar.", "");
        }
    },
    
    // Conectar ao dispositivo selecionado
    connectToDevice: function() {
        const deviceId = this.elements.deviceSelect.value;
        if (!deviceId) {
            this.updateStatusText("Selecione um dispositivo para conectar", "status-error");
            return;
        }
        
        // Atualizar status
        this.updateStatusText(`Conectando ao dispositivo ${deviceId}...`, "status-connecting");
        this.elements.connectBtn.disabled = true;
        
        // Verificar permissões novamente antes de conectar
        if (!this.permissionsRequested) {
            this.checkPermissions(permissionsGranted => {
                // Tentar conectar independente do resultado das permissões
                // Isso permite que o app funcione mesmo quando algumas permissões são negadas
                this.connectToBleDevice(deviceId);
            });
        } else {
            this.connectToBleDevice(deviceId);
        }
    },
    
    // Função para realizar a conexão BLE
    connectToBleDevice: function(deviceId) {
        console.log(`Iniciando conexão com o dispositivo: ${deviceId}`);
        
        // Conectar ao dispositivo
        ble.connect(
            deviceId, 
            this.onConnected.bind(this), 
            error => {
                console.error("Erro de conexão:", error);
                this.onDisconnected(error);
            }
        );
    },
    
    // Callback para quando o dispositivo é conectado
    onConnected: function(device) {
        console.log("Conectado ao dispositivo: ", device);
        this.bleDevice = device;
        this.isConnected = true;
        
        // Limpar qualquer mensagem de erro de permissão
        this.clearPermissionErrors();
        
        // Vibrar para indicar conexão
        this.vibrate([100, 50, 100]);
        
        // Atualizar status
        this.updateStatusText("Conectado com sucesso!", "status-connected");
        
        // Inscrever-se para notificações de ambas as características
        this.subscribeToNotifications();
        
        // Navegar para a página inicial
        setTimeout(() => {
            this.showPage("homePage");
        }, 1000);
    },
    
    // Inscrever-se para receber notificações contínuas das características
    subscribeToNotifications: function() {
        if (!this.isConnected || !this.bleDevice) {
            console.error("Não é possível se inscrever para notificações: dispositivo não conectado");
            return;
        }
        
        // Notificações para dados seriais
        console.log("Inscrevendo-se para notificações de dados seriais");
        ble.startNotification(
            this.bleDevice.id,
            this.SERVICE_UUID,
            this.CHARACTERISTIC_UUID_SERIAL,
            data => {
                try {
                    const decoder = new TextDecoder('utf-8');
                    const textData = decoder.decode(data);
                    console.log("Notificação serial recebida:", textData);
                    
                    if (this.elements.serialData) {
                        this.elements.serialData.textContent = `TESTE SERIAL: ${textData}`;
                    }
                } catch (error) {
                    console.error("Erro ao processar notificação serial:", error);
                }
            },
            error => {
                console.error("Erro ao iniciar notificações seriais:", error);
            }
        );
        
        // Notificações para dados de célula (MV)
        console.log("Inscrevendo-se para notificações de dados da célula");
        ble.startNotification(
            this.bleDevice.id,
            this.SERVICE_UUID,
            this.CHARACTERISTIC_UUID_MV,
            data => {
                try {
                    const decoder = new TextDecoder('utf-8');
                    const textData = decoder.decode(data);
                    console.log("Notificação da célula recebida:", textData);
                    
                    if (this.elements.cellData) {
                        this.elements.cellData.textContent = `TESTE CÉLULA: ${textData}`;
                    }
                } catch (error) {
                    console.error("Erro ao processar notificação da célula:", error);
                }
            },
            error => {
                console.error("Erro ao iniciar notificações da célula:", error);
            }
        );
    },
    
    // Callback para quando o dispositivo é desconectado
    onDisconnected: function(error) {
        console.log("Desconectado: ", error);
        
        // Parar notificações se o dispositivo estava conectado anteriormente
        if (this.bleDevice) {
            this.stopNotifications();
        }
        
        this.bleDevice = null;
        this.isConnected = false;
        
        // Atualizar UI
        this.elements.connectBtn.disabled = false;
        
        // Parar a atualização automática
        this.stopAutoUpdate();
        
        // Atualizar dados
        if (this.elements.serialData) {
            this.elements.serialData.textContent = "Nenhum dado de serial recebido";
        }
        if (this.elements.cellData) {
            this.elements.cellData.textContent = "Nenhum dado de mv recebido";
        }
        
        // Vibrar para indicar desconexão
        this.vibrate(300);
        
        // Atualizar status com mensagem apropriada
        let errorMsg = "Dispositivo desconectado";
        if (error) {
            // Verificar se é um erro de permissão
            if (typeof error === 'string' && error.includes('permission')) {
                errorMsg = "Erro de permissão Bluetooth. Verifique as configurações do dispositivo.";
            } else if (typeof error === 'object' && error.message && error.message.includes('permission')) {
                errorMsg = "Erro de permissão Bluetooth. Verifique as configurações do dispositivo.";
            }
        }
        
        this.updateStatusText(errorMsg, "status-error");
    },
    
    // Parar notificações das características
    stopNotifications: function() {
        if (!this.bleDevice) {
            return;
        }
        
        try {
            console.log("Parando notificações de dados seriais");
            ble.stopNotification(
                this.bleDevice.id, 
                this.SERVICE_UUID, 
                this.CHARACTERISTIC_UUID_SERIAL,
                () => console.log("Notificações seriais paradas com sucesso"),
                error => console.error("Erro ao parar notificações seriais:", error)
            );
        } catch (e) {
            console.error("Erro ao parar notificações seriais:", e);
        }
        
        try {
            console.log("Parando notificações de dados da célula");
            ble.stopNotification(
                this.bleDevice.id, 
                this.SERVICE_UUID, 
                this.CHARACTERISTIC_UUID_MV,
                () => console.log("Notificações da célula paradas com sucesso"),
                error => console.error("Erro ao parar notificações da célula:", error)
            );
        } catch (e) {
            console.error("Erro ao parar notificações da célula:", e);
        }
    },
    
    // Limpa mensagens de erro relacionadas a permissões
    clearPermissionErrors: function() {
        if (this.elements.statusText) {
            const text = this.elements.statusText.textContent;
            if (text.includes("permissão") || text.includes("Permissões")) {
                this.updateStatusText("", "");
            }
        }
    },
    
    // Ler dados da característica serial
    readSerialData: function() {
        if (!this.isConnected) {
            this.elements.serialData.textContent = "Dispositivo não conectado";
            return;
        }
        
        ble.read(
            this.bleDevice.id,
            this.SERVICE_UUID,
            this.CHARACTERISTIC_UUID_SERIAL,
            data => {
                try {
                    const decoder = new TextDecoder('utf-8');
                    const textData = decoder.decode(data);
                    console.log("Dados serial recebidos: ", textData);
                    
                    // Formatar o texto para exibição, similar ao código Python
                    this.elements.serialData.textContent = `TESTE SERIAL: ${textData}`;
                } catch (error) {
                    console.error("Erro ao decodificar dados serial:", error);
                    this.elements.serialData.textContent = "Erro ao processar dados";
                }
            },
            error => {
                console.error("Erro ao ler dados serial: ", error);
                this.elements.serialData.textContent = "Erro na leitura";
            }
        );
    },
    
    // Ler dados da característica de célula
    readCellData: function() {
        if (!this.isConnected) {
            this.elements.cellData.textContent = "Dispositivo não conectado";
            return;
        }
        
        ble.read(
            this.bleDevice.id,
            this.SERVICE_UUID,
            this.CHARACTERISTIC_UUID_MV,
            data => {
                try {
                    const decoder = new TextDecoder('utf-8');
                    const textData = decoder.decode(data);
                    console.log("Dados célula recebidos: ", textData);
                    
                    // Formatar o texto para exibição, similar ao código Python
                    this.elements.cellData.textContent = `TESTE CÉLULA: ${textData}`;
                } catch (error) {
                    console.error("Erro ao decodificar dados de célula:", error);
                    this.elements.cellData.textContent = "Erro ao processar dados";
                }
            },
            error => {
                console.error("Erro ao ler dados de célula: ", error);
                this.elements.cellData.textContent = "Erro na leitura";
            }
        );
    },
    
    // Iniciar a atualização automática dos dados
    startAutoUpdate: function(type) {
        // Parar qualquer atualização automática anterior
        this.stopAutoUpdate();
        
        // Se estiver conectado, não precisamos de atualizações baseadas em timer
        // porque já estamos recebendo notificações. Mas, como fallback,
        // podemos ainda realizar leituras manuais.
        if (this.isConnected) {
            // Ler uma vez manualmente para garantir os dados iniciais
            if (type === 'serial') {
                this.readSerialData();
            } else if (type === 'cell') {
                this.readCellData();
            }
            
            // Não iniciamos um timer porque já temos notificações
            return;
        }
        
        // Se não estiver conectado, mas ainda assim quiser tentar atualizações periódicas
        // Função de atualização
        const updateFunction = () => {
            if (type === 'serial') {
                this.readSerialData();
            } else if (type === 'cell') {
                this.readCellData();
            }
        };
        
        // Ler imediatamente
        updateFunction();
        
        // Iniciar o timer para atualizações a cada 2 segundos
        this.autoUpdateTimer = setInterval(updateFunction, 2000);
    },
    
    // Parar a atualização automática
    stopAutoUpdate: function() {
        if (this.autoUpdateTimer) {
            clearInterval(this.autoUpdateTimer);
            this.autoUpdateTimer = null;
        }
    },
    
    // Atualizar o texto de status
    updateStatusText: function(message, className) {
        if (this.elements.statusText) {
            // Se o statusText estiver mostrando uma mensagem de erro de permissão,
            // não substitua por mensagens menos importantes
            const currentText = this.elements.statusText.textContent;
            const isCurrentPermissionError = currentText.includes("permissão") || currentText.includes("Permissões");
            const isNewPermissionError = message.includes("permissão") || message.includes("Permissões");
            
            // Só atualiza o texto se:
            // 1. A mensagem atual não é de erro de permissão, ou
            // 2. A nova mensagem é de erro de permissão, ou
            // 3. A nova mensagem está vazia (limpando o estado)
            if (!isCurrentPermissionError || isNewPermissionError || message === "") {
                this.elements.statusText.textContent = message;
                
                // Remover todas as classes de status
                this.elements.statusText.classList.remove("status-error", "status-connecting", "status-connected");
                
                // Adicionar a classe específica se fornecida
                if (className) {
                    this.elements.statusText.classList.add(className);
                }
            }
        }
    },
    
    // Função para vibrar o dispositivo
    vibrate: function(pattern) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    },
    
    // Logar informações do dispositivo para debug
    logDeviceInfo: function() {
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
};

// Exportar o app para a janela global
window.app = app; 
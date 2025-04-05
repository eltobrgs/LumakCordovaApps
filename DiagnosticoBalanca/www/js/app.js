// Namespace para o aplicativo
const app = {
    // Constantes para UUIDs BLE
    SERVICE_UUID: "0000181A-0000-1000-8000-00805F9B34FB",
    CHARACTERISTIC_UUID_SERIAL: "00002A6E-0000-1000-8000-00805F9B34FB",
    CHARACTERISTIC_UUID_MV: "00002A6F-0000-1000-8000-00805F9B34FB",
    
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
        this.checkPermissions();
        
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
    checkPermissions: function() {
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.permissions) {
            const permissions = cordova.plugins.permissions;
            const requiredPermissions = [
                permissions.BLUETOOTH,
                permissions.BLUETOOTH_ADMIN,
                permissions.BLUETOOTH_SCAN,
                permissions.BLUETOOTH_CONNECT,
                permissions.ACCESS_FINE_LOCATION
            ];
            
            // Função para verificar permissões
            const checkPermissionsCb = (status) => {
                if (!status.hasPermission) {
                    // Solicitar permissões
                    permissions.requestPermissions(requiredPermissions, (status) => {
                        if (status.hasPermission) {
                            console.log("Permissões concedidas");
                            this.permissionsRequested = true;
                        } else {
                            console.warn("Permissões negadas");
                            this.updateStatusText("Permissões Bluetooth negadas. O aplicativo não funcionará corretamente.", "status-error");
                        }
                    }, () => {
                        console.error("Erro ao solicitar permissões");
                        this.updateStatusText("Erro ao solicitar permissões.", "status-error");
                    });
                } else {
                    console.log("Já tem todas as permissões necessárias");
                    this.permissionsRequested = true;
                }
            };
            
            // Verificar permissões
            permissions.hasPermission(requiredPermissions, checkPermissionsCb, checkPermissionsCb);
        } else {
            console.warn("Plugin de permissões não disponível");
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
        
        // Conectar ao dispositivo
        ble.connect(deviceId, this.onConnected.bind(this), this.onDisconnected.bind(this));
    },
    
    // Callback para quando o dispositivo é conectado
    onConnected: function(device) {
        console.log("Conectado ao dispositivo: ", device);
        this.bleDevice = device;
        this.isConnected = true;
        
        // Vibrar para indicar conexão
        this.vibrate([100, 50, 100]);
        
        // Atualizar status
        this.updateStatusText("Conectado com sucesso!", "status-connected");
        
        // Navegar para a página inicial
        setTimeout(() => {
            this.showPage("homePage");
        }, 1000);
    },
    
    // Callback para quando o dispositivo é desconectado
    onDisconnected: function(error) {
        console.log("Desconectado: ", error);
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
        
        // Atualizar status
        this.updateStatusText("Dispositivo desconectado", "status-error");
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
                const decoder = new TextDecoder('utf-8');
                const textData = decoder.decode(data);
                console.log("Dados serial recebidos: ", textData);
                this.elements.serialData.textContent = textData;
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
                const decoder = new TextDecoder('utf-8');
                const textData = decoder.decode(data);
                console.log("Dados célula recebidos: ", textData);
                this.elements.cellData.textContent = textData;
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
            this.elements.statusText.textContent = message;
            
            // Remover todas as classes de status
            this.elements.statusText.classList.remove("status-error", "status-connecting", "status-connected");
            
            // Adicionar a classe específica se fornecida
            if (className) {
                this.elements.statusText.classList.add(className);
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
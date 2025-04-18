package com.megster.cordova.ble.central;

import org.apache.cordova.CallbackContext;

import java.util.UUID;

/**
 * Android BLE stack is async but doesn't queue commands, so it ignore additional commands when processing. WTF?
 * This is an object to encapsulate the command data for queuing
 */
class BLECommand {
    // Types
    public static int READ = 10000;
    public static int REGISTER_NOTIFY = 10001;
    public static int REMOVE_NOTIFY = 10002;
    public static int READ_RSSI = 10003;
    // BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE
    // BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT

    private final CallbackContext callbackContext;
    private final UUID serviceUUID;
    private final UUID characteristicUUID;
    private byte[] data;
    private final int type;

    public BLECommand(CallbackContext callbackContext, UUID serviceUUID, UUID characteristicUUID, int type) {
        this.callbackContext = callbackContext;
        this.serviceUUID = serviceUUID;
        this.characteristicUUID = characteristicUUID;
        this.type = type;
    }

    public BLECommand(CallbackContext callbackContext, UUID serviceUUID, UUID characteristicUUID, byte[] data, int type) {
        this.callbackContext = callbackContext;
        this.serviceUUID = serviceUUID;
        this.characteristicUUID = characteristicUUID;
        this.data = data;
        this.type = type;
    }

    public int getType() {
        return type;
    }

    public CallbackContext getCallbackContext() {
        return callbackContext;
    }

    public UUID getServiceUUID() {
        return serviceUUID;
    }

    public UUID getCharacteristicUUID() {
        return characteristicUUID;
    }

    public byte[] getData() {
        return data;
    }
}

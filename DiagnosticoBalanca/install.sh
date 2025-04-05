#!/bin/bash

# Script de instalação para o projeto DiagnosticoBalanca

echo "Iniciando instalação do DiagnosticoBalanca..."

# Verificar se o npm está instalado
if ! [ -x "$(command -v npm)" ]; then
  echo "Erro: npm não está instalado. Por favor, instale o Node.js e o npm."
  exit 1
fi

# Verificar se o cordova está instalado
if ! [ -x "$(command -v cordova)" ]; then
  echo "Cordova não encontrado. Instalando Cordova globalmente..."
  npm install -g cordova
fi

# Instalar as dependências do npm
echo "Instalando dependências do projeto..."
npm install

# Adicionar plataforma Android
echo "Adicionando plataforma Android..."
cordova platform add android

# Adicionar plugins necessários
echo "Adicionando plugins Cordova..."
cordova plugin add cordova-plugin-ble-central
cordova plugin add cordova-plugin-android-permissions
cordova plugin add cordova-plugin-device
cordova plugin add cordova-plugin-vibration

# Compilar o projeto
echo "Compilando o aplicativo..."
cordova build android

echo "Instalação concluída com sucesso!"
echo "O APK está disponível em: platforms/android/app/build/outputs/apk/debug/app-debug.apk" 
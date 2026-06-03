/**
 * bluetooth-native.ts
 *
 * Abstração de Bluetooth que funciona tanto no browser (Web Bluetooth API)
 * quanto no APK Android (mantém a conexão viva via Foreground Service nativo).
 *
 * No APK, o Foreground Service Kotlin é iniciado assim que a conexão é feita,
 * mostrando a notificação persistente "🖨️ Impressora ativa" — isso impede o
 * Android de matar o processo quando o app vai para background (WhatsApp, etc).
 */

import { Capacitor } from '@capacitor/core';

export const IS_NATIVE = Capacitor.isNativePlatform();

// UUIDs padrão de impressoras térmicas BT
const PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4158-a24f-a34a64155a51',
  'e7e11000-4953-11e2-830c-0002a5d5c51b',
];

export interface BTConnection {
  /** Envia bytes para a impressora */
  write: (data: Uint8Array) => Promise<void>;
  /** Desconecta */
  disconnect: () => void;
  /** Nome do dispositivo */
  deviceName: string;
}

/**
 * Solicita conexão com a impressora BT.
 * - Browser: usa Web Bluetooth API (comportamento atual)
 * - APK Android: usa Web Bluetooth dentro do WebView + inicia Foreground Service
 */
export async function connectToPrinter(): Promise<BTConnection> {
  if (!('bluetooth' in navigator)) {
    throw new Error(
      'Bluetooth não suportado. No Android use Chrome, no iPhone use Bluefy.'
    );
  }

  const device = await (navigator as any).bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: PRINTER_SERVICE_UUIDS,
  });

  const server = await device.gatt.connect();

  // Tenta cada serviço até achar um compatível
  let service: any = null;
  for (const uuid of PRINTER_SERVICE_UUIDS) {
    try {
      service = await server.getPrimaryService(uuid);
      if (service) break;
    } catch {
      // tenta o próximo
    }
  }

  if (!service) {
    // Fallback: pega o primeiro serviço disponível
    const services = await server.getPrimaryServices();
    service = services[0];
  }

  if (!service) throw new Error('Nenhum serviço BT encontrado na impressora.');

  const characteristics = await service.getCharacteristics();
  const writeChar = characteristics.find(
    (c: any) => c.properties.write || c.properties.writeWithoutResponse
  );

  if (!writeChar) throw new Error('Impressora não suporta escrita direta.');

  // No APK: inicia o Foreground Service para manter o processo vivo
  if (IS_NATIVE) {
    startForegroundService(device.name || 'Impressora');
  }

  // Listener de desconexão: reconecta automaticamente
  device.addEventListener('gattserverdisconnected', async () => {
    console.warn('[BT] Desconectado. Tentando reconectar...');
    try {
      await server.connect();
      console.info('[BT] Reconectado com sucesso.');
    } catch (e) {
      console.error('[BT] Falha na reconexão automática:', e);
      if (IS_NATIVE) stopForegroundService();
    }
  });

  return {
    deviceName: device.name || 'Impressora BT',
    write: async (data: Uint8Array) => {
      // Envia em chunks de 20 bytes (limite BLE)
      for (let i = 0; i < data.length; i += 20) {
        await writeChar.writeValue(data.slice(i, i + 20));
      }
    },
    disconnect: () => {
      server.disconnect();
      if (IS_NATIVE) stopForegroundService();
    },
  };
}

/* ── Foreground Service (APK apenas) ─────────────────────────────────────── */

/**
 * Inicia o Foreground Service Android via interface nativa exposta pelo plugin.
 * No browser, é um no-op seguro.
 */
function startForegroundService(deviceName: string) {
  try {
    // A interface é registrada pelo plugin nativo em MainActivity.kt
    (window as any).PizzariaFGS?.start({
      title: '🖨️ Impressora ativa',
      text: `${deviceName} conectada — Empório Operacional`,
    });
    console.info('[FGS] Foreground Service iniciado.');
  } catch (e) {
    console.warn('[FGS] Foreground Service não disponível (browser?):', e);
  }
}

function stopForegroundService() {
  try {
    (window as any).PizzariaFGS?.stop();
    console.info('[FGS] Foreground Service parado.');
  } catch {/* no-op */}
}

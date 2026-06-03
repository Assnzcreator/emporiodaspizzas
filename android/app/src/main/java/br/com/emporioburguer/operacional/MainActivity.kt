package br.com.emporioburguer.operacional

import android.content.Intent
import android.os.Build
import com.getcapacitor.BridgeActivity
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * MainActivity
 *
 * Ponto de entrada do APK Capacitor.
 * Registra a interface JavaScript → nativa para controlar o Foreground Service.
 */
class MainActivity : BridgeActivity() {

    override fun onStart() {
        super.onStart()
        // Injeta o objeto "EmporioFGS" no WebView para o React poder chamar
        bridge.webView.evaluateJavascript("""
            window.EmporioFGS = {
                start: function(opts) {
                    window.EmporioFGSBridge?.postMessage(
                        JSON.stringify({ action: 'START', title: opts.title, text: opts.text })
                    );
                },
                stop: function() {
                    window.EmporioFGSBridge?.postMessage(JSON.stringify({ action: 'STOP' }));
                }
            };
        """, null)

        // Listener que recebe as mensagens do React
        bridge.webView.addJavascriptInterface(
            FgsJSInterface(this), "EmporioFGSBridge"
        )
    }
}

/**
 * Interface que recebe chamadas do JavaScript (React) e inicia/para o Foreground Service
 */
class FgsJSInterface(private val activity: MainActivity) {

    @android.webkit.JavascriptInterface
    fun postMessage(json: String) {
        try {
            val obj    = org.json.JSONObject(json)
            val action = obj.getString("action")

            val intent = Intent(activity, BluetoothForegroundService::class.java)
            when (action) {
                "START" -> {
                    intent.action = BluetoothForegroundService.ACTION_START
                    intent.putExtra(BluetoothForegroundService.EXTRA_TITLE, obj.optString("title"))
                    intent.putExtra(BluetoothForegroundService.EXTRA_TEXT,  obj.optString("text"))
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        activity.startForegroundService(intent)
                    } else {
                        activity.startService(intent)
                    }
                }
                "STOP" -> {
                    intent.action = BluetoothForegroundService.ACTION_STOP
                    activity.startService(intent)
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}

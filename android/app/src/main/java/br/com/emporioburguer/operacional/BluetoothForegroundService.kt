package br.com.emporioburguer.operacional

import android.app.*
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

/**
 * BluetoothForegroundService
 *
 * Serviço Android que roda em primeiro plano (Foreground Service),
 * exibindo uma notificação persistente enquanto a impressora BT está conectada.
 *
 * Isso impede o Android de matar o processo quando o app vai para background
 * (ex: usuário abre WhatsApp), mantendo a conexão Bluetooth viva.
 */
class BluetoothForegroundService : Service() {

    companion object {
        const val CHANNEL_ID   = "emporio_bt_channel"
        const val NOTIF_ID     = 1001
        const val ACTION_START = "START"
        const val ACTION_STOP  = "STOP"
        const val EXTRA_TITLE  = "title"
        const val EXTRA_TEXT   = "text"
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopForeground(true)
                stopSelf()
            }
            else -> {
                val title = intent?.getStringExtra(EXTRA_TITLE) ?: "🖨️ Impressora ativa"
                val text  = intent?.getStringExtra(EXTRA_TEXT)  ?: "Empório Operacional em execução"
                startForeground(NOTIF_ID, buildNotification(title, text))
            }
        }
        // START_STICKY: Android reinicia o serviço se ele for morto por falta de memória
        return START_STICKY
    }

    private fun buildNotification(title: String, text: String): Notification {
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, openAppIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_dialog_info) // Substituir por ícone customizado
            .setContentIntent(pendingIntent)
            .setOngoing(true)       // Não pode ser dispensada pelo usuário
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Impressora Bluetooth",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Mantém a impressora BT conectada em segundo plano"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
}

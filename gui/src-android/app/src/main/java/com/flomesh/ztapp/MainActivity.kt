package com.flomesh.ztapp

import android.os.Bundle
import android.content.Intent
import androidx.appcompat.app.AppCompatActivity

import android.util.Log
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.result.ActivityResultLauncher

class MainActivity : TauriActivity() {

    private lateinit var overlayPermissionLauncher: ActivityResultLauncher<Intent>

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        CopyBinaryActivity.start(this)

        overlayPermissionLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
					if (Settings.canDrawOverlays(this)) {
							startFloatingWindowService()
					}
        }

				if (!Settings.canDrawOverlays(this)) {
						val intent = Intent(
								Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
								Uri.parse("package:$packageName")
						)
						overlayPermissionLauncher.launch(intent)
				} else {
						startFloatingWindowService()
				}
    }

    private fun startFloatingWindowService() {
        val intent = Intent(this, FloatingWindowService::class.java)
        startService(intent)
    }
		
    companion object {
        @JvmStatic
        fun startWebViewActivity(url: String, proxyHost: String, proxyPort: Int) {
						Log.d("startWebViewActivity", url)
            val context = MainActivity().applicationContext
            val intent = Intent(context, WebViewActivity::class.java).apply {
                putExtra("url", url)
                putExtra("proxyHost", proxyHost)
                putExtra("proxyPort", proxyPort)
            }
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            context.startActivity(intent)
        }
    }
}

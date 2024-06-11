package com.flomesh.ztapp

import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import android.content.Intent

class WebViewActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
			super.onCreate(savedInstanceState)
			setContentView(R.layout.activity_webview)

			val webView = findViewById<WebView>(R.id.webview)
			webView.webViewClient = WebViewClient()
			webView.settings.javaScriptEnabled = true
			// val intent = Intent(this, WebViewActivity::class.java)
			val url: String = intent.getStringExtra("url").toString();
			val proxyHost: String = intent.getStringExtra("proxyHost").toString();
			val proxyPort: String = intent.getIntExtra("proxyPort", -1).toString();

			if (proxyHost != null) {
				System.setProperty("socksProxyHost", proxyHost)
				System.setProperty("socksProxyPort", proxyPort)
			}
			webView.loadUrl(url)

		}
}

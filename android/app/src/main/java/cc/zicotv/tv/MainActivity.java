package cc.zicotv.tv;

import android.os.Bundle;
import android.os.Message;
import android.webkit.WebView;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {

    /**
     * Bloquea los popup/popunder y los diálogos "abrir con…" (intents) que
     * disparan los reproductores de las fuentes externas incrustadas en el iframe.
     *
     * Capacitor configura el WebView con setJavaScriptCanOpenWindowsAutomatically(true)
     * y no gestiona onCreateWindow, así que cualquier window.open de la web embebida
     * acaba abriendo el navegador y saca al usuario del partido. Aquí activamos el
     * soporte de múltiples ventanas y rechazamos cada solicitud (onCreateWindow →
     * false). Mismo arreglo que app-zicotv; el iframe además va con sandbox.
     */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Bridge bridge = getBridge();
        WebView webView = bridge.getWebView();
        webView.getSettings().setSupportMultipleWindows(true);
        webView.setWebChromeClient(new BridgeWebChromeClient(bridge) {
            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                return false;
            }
        });
    }
}

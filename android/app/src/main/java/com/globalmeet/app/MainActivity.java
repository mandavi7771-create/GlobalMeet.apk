package com.globalmeet.app;

import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.OnUserEarnedRewardListener;
import com.google.android.gms.ads.rewarded.RewardItem;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;

public class MainActivity extends AppCompatActivity {
    private static final String TAG = "GlobalMeetAdMob";
    
    // Real AdMob IDs configured for GlobalMeet
    public static final String ADMOB_APP_ID = "ca-app-pub-9492891304960281~2927769366";
    public static final String REWARDED_AD_UNIT_ID = "ca-app-pub-9492891304960281/7053707476";

    private WebView webView;
    private RewardedAd rewardedAd;
    private boolean isLoadingAd = false;
    private boolean userEarnedReward = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Initialize Google Mobile Ads SDK
        MobileAds.initialize(this, initializationStatus -> {
            Log.d(TAG, "Google Mobile Ads SDK Initialized successfully");
            loadRewardedAd();
        });

        // 2. Setup WebView with JavaScript Interface
        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        // Bind Android AdMob Bridge to window.AndroidAdMob in JavaScript
        webView.addJavascriptInterface(new AdMobBridge(), "AndroidAdMob");
        webView.setWebViewClient(new WebViewClient());

        // Load the GlobalMeet Web application entry point
        webView.loadUrl("file:///android_asset/dist/index.html");
    }

    /**
     * Preload Google AdMob Rewarded Ad
     */
    private void loadRewardedAd() {
        if (isLoadingAd || rewardedAd != null) return;
        isLoadingAd = true;

        AdRequest adRequest = new AdRequest.Builder().build();
        RewardedAd.load(this, REWARDED_AD_UNIT_ID, adRequest, new RewardedAdLoadCallback() {
            @Override
            public void onAdLoaded(@NonNull RewardedAd ad) {
                rewardedAd = ad;
                isLoadingAd = false;
                Log.d(TAG, "Google AdMob Rewarded Ad loaded successfully: " + REWARDED_AD_UNIT_ID);
                setupAdCallbacks();
                notifyJs("if (window.onAdMobLoaded) { window.onAdMobLoaded(); }");
            }

            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                rewardedAd = null;
                isLoadingAd = false;
                Log.e(TAG, "Google AdMob Rewarded Ad failed to load: " + loadAdError.getMessage());
                notifyJs("if (window.onAdMobFailed) { window.onAdMobFailed('" + escapeJs(loadAdError.getMessage()) + "'); }");
            }
        });
    }

    private void setupAdCallbacks() {
        if (rewardedAd == null) return;

        rewardedAd.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdShowedFullScreenContent() {
                Log.d(TAG, "Google AdMob Rewarded Ad showing fullscreen");
                userEarnedReward = false;
            }

            @Override
            public void onAdDismissedFullScreenContent() {
                Log.d(TAG, "Google AdMob Rewarded Ad dismissed. Earned reward: " + userEarnedReward);
                notifyJs("if (window.onAdMobDismissed) { window.onAdMobDismissed(" + userEarnedReward + "); }");
                rewardedAd = null;
                // Preload the next rewarded ad for seamless playback
                loadRewardedAd();
            }

            @Override
            public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
                Log.e(TAG, "Google AdMob Rewarded Ad failed to show: " + adError.getMessage());
                notifyJs("if (window.onAdMobFailed) { window.onAdMobFailed('" + escapeJs(adError.getMessage()) + "'); }");
                rewardedAd = null;
                loadRewardedAd();
            }
        });
    }

    /**
     * Show Rewarded Ad when requested by User via JavaScript
     */
    public void showRewardedAd() {
        runOnUiThread(() -> {
            userEarnedReward = false;
            if (rewardedAd != null) {
                rewardedAd.show(MainActivity.this, new OnUserEarnedRewardListener() {
                    @Override
                    public void onUserEarnedReward(@NonNull RewardItem rewardItem) {
                        int amount = rewardItem.getAmount() > 0 ? rewardItem.getAmount() : 10;
                        userEarnedReward = true;
                        Log.d(TAG, "Google AdMob onUserEarnedReward earned: " + amount + " coins");
                        notifyJs("if (window.onAdMobRewardEarned) { window.onAdMobRewardEarned(" + amount + ", 'coins'); }");
                    }
                });
            } else {
                Log.w(TAG, "Rewarded Ad not ready, loading new one...");
                loadRewardedAd();
                notifyJs("if (window.onAdMobFailed) { window.onAdMobFailed('Ad is loading, please try again in a moment.'); }");
            }
        });
    }

    private void notifyJs(String script) {
        runOnUiThread(() -> {
            if (webView != null) {
                webView.evaluateJavascript(script, null);
            }
        });
    }

    private String escapeJs(String text) {
        if (text == null) return "";
        return text.replace("'", "\\'").replace("\n", " ");
    }

    /**
     * JavaScript Bridge Interface exposed as window.AndroidAdMob
     */
    public class AdMobBridge {
        @JavascriptInterface
        public void showRewardedAd(String unitId) {
            MainActivity.this.showRewardedAd();
        }

        @JavascriptInterface
        public boolean isAdLoaded() {
            return rewardedAd != null;
        }

        @JavascriptInterface
        public void loadRewardedAd(String unitId) {
            MainActivity.this.loadRewardedAd();
        }
    }
}

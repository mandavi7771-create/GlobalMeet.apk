import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PREMIUM_PLANS, COIN_PACKAGES } from '../data/mockData';
import { PremiumPlan, CoinPackage, PurchaseResult } from '../types';
import { 
  X, 
  Crown, 
  Check, 
  Sparkles, 
  Coins, 
  CheckCircle2, 
  CreditCard, 
  ShieldCheck, 
  Loader2, 
  AlertCircle,
  PlaySquare,
  Gift,
  Zap,
  Building2,
  Globe,
  Wallet,
  Smartphone,
  QrCode,
  Lock,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

type PaymentRailCategory = 
  | 'upi' 
  | 'card' 
  | 'bank' 
  | 'intl_card' 
  | 'local' 
  | 'intl_methods';

export const PremiumModal: React.FC = () => {
  const { 
    isPremiumModalOpen, 
    setPremiumModalOpen, 
    currentUser, 
    coins, 
    purchasePremiumPlan, 
    purchaseCoinsPackage,
    openRewardedAd,
    linkedPayPalMerchant 
  } = useApp();

  // Checkout selection state
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PremiumPlan | null>(null);
  const [selectedPackageForCheckout, setSelectedPackageForCheckout] = useState<CoinPackage | null>(null);
  
  // Unified Payment Rail State
  const [selectedCategory, setSelectedCategory] = useState<PaymentRailCategory>('upi');
  
  // Specific Form Details
  const [upiId, setUpiId] = useState('');
  const [upiApp, setUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim'>('gpay');
  const [upiMode, setUpiMode] = useState<'id' | 'qr'>('id');

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedLocalWallet, setSelectedLocalWallet] = useState('Paytm Wallet');
  const [selectedIntlMethod, setSelectedIntlMethod] = useState<'paypal_direct' | 'apple_pay' | 'google_pay_intl' | 'revolut'>('paypal_direct');

  // Processing & Verification
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isPremiumModalOpen) return null;

  const handleStartPlanCheckout = (plan: PremiumPlan) => {
    setSelectedPackageForCheckout(null);
    setSelectedPlanForCheckout(plan);
    setPurchaseResult(null);
    setErrorMessage(null);
    setCardHolder(currentUser.name || 'Account Holder');
  };

  const handleStartCoinCheckout = (pkg: CoinPackage) => {
    setSelectedPlanForCheckout(null);
    setSelectedPackageForCheckout(pkg);
    setPurchaseResult(null);
    setErrorMessage(null);
    setCardHolder(currentUser.name || 'Account Holder');
  };

  const handleCancelCheckout = () => {
    if (isProcessing) return;
    setSelectedPlanForCheckout(null);
    setSelectedPackageForCheckout(null);
    setPurchaseResult(null);
    setErrorMessage(null);
  };

  // Format payment method title for database audit log
  const getSelectedPaymentMethodLabel = (): string => {
    switch (selectedCategory) {
      case 'upi':
        return upiMode === 'qr' ? 'UPI (QR Code Scan)' : `UPI (${upiApp.toUpperCase()}: ${upiId || 'Direct VPA'})`;
      case 'card':
        return `Debit/Credit Card (${cardNumber ? `•••• ${cardNumber.slice(-4)}` : 'Domestic Card'})`;
      case 'bank':
        return `Bank Payment (${selectedBank} Net Banking)`;
      case 'intl_card':
        return `International Card (${cardNumber ? `•••• ${cardNumber.slice(-4)}` : 'Global Card'})`;
      case 'local':
        return `Local Payment (${selectedLocalWallet})`;
      case 'intl_methods':
        if (selectedIntlMethod === 'paypal_direct') return 'PayPal Direct (Pre-linked Merchant Settle)';
        if (selectedIntlMethod === 'apple_pay') return 'Apple Pay (International)';
        if (selectedIntlMethod === 'google_pay_intl') return 'Google Pay (Global)';
        return 'Revolut / SEPA (International)';
      default:
        return 'Unified Payment System (PayPal Gateway)';
    }
  };

  const handleConfirmPurchase = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    // Validation checks for user confidence
    if (selectedCategory === 'upi' && upiMode === 'id' && !upiId.trim()) {
      setIsProcessing(false);
      setErrorMessage('Please enter your UPI ID (e.g. yourname@okhdfcbank or yourname@paytm).');
      return;
    }

    if ((selectedCategory === 'card' || selectedCategory === 'intl_card') && cardNumber.replace(/\s+/g, '').length < 12) {
      setIsProcessing(false);
      setErrorMessage('Please enter a valid 16-digit card number.');
      return;
    }

    const paymentLabel = getSelectedPaymentMethodLabel();
    const paypalOrderId = `PAYPAL-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    try {
      setProcessingStep('Connecting to Unified Gateway...');
      await new Promise(r => setTimeout(r, 450));
      
      setProcessingStep(`Authorizing transaction & routing to PayPal (${linkedPayPalMerchant})...`);
      await new Promise(r => setTimeout(r, 650));

      setProcessingStep('Recording verified transaction & crediting coins...');

      let res: PurchaseResult;
      if (selectedPlanForCheckout) {
        res = await purchasePremiumPlan(selectedPlanForCheckout, paymentLabel, {
          merchantReceiver: linkedPayPalMerchant,
          paypalOrderId
        });
      } else if (selectedPackageForCheckout) {
        res = await purchaseCoinsPackage(selectedPackageForCheckout, paymentLabel, {
          merchantReceiver: linkedPayPalMerchant,
          paypalOrderId
        });
      } else {
        throw new Error('No item selected');
      }

      setIsProcessing(false);
      if (res.success) {
        setPurchaseResult(res);
      } else {
        setErrorMessage(res.message || 'Payment authorization failed.');
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err?.message || 'Transaction could not be processed.');
    }
  };

  // Format Card Number helper
  const handleCardInputChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Format Expiry helper
  const handleExpiryInputChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  return (
    <div 
      id="premium-modal-overlay" 
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          setPremiumModalOpen(false);
        }
      }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto"
    >
      <div 
        id="premium-card" 
        className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative my-auto animate-in zoom-in-95 duration-200 max-h-[94vh] flex flex-col"
      >
        {/* Top Bar / Close Button */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-amber-300 p-0.5 flex items-center justify-center shadow-md shadow-amber-500/20">
              <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center space-x-2">
                <span>GlobalMeet</span>
                <span className="text-amber-400">VIP & Coins Store</span>
              </h2>
              <p className="text-xs text-neutral-400">
                International Video Calling, VIP Badges, and Coin Packages
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Real-time Coins Pill */}
            <div className="bg-neutral-950 border border-amber-500/30 px-3 py-1.5 rounded-full flex items-center space-x-1.5 shadow-inner">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-neutral-400">Your Coins:</span>
              <span className="text-xs font-bold text-white font-mono">{coins.toLocaleString()}</span>
            </div>

            <button
              id="btn-close-premium-modal"
              onClick={() => !isProcessing && setPremiumModalOpen(false)}
              className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
              aria-label="Close Premium Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto pr-1 py-4 space-y-7 flex-1">
          {/* Active VIP Status Banner if user is already Premium */}
          {currentUser.isPremium && (
            <div className="bg-gradient-to-r from-emerald-950/60 to-neutral-900 border border-emerald-500/40 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>VIP Premium Active</span>
                    <span className="text-amber-400 font-normal">• {currentUser.premiumPlan || 'VIP Pass'}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Unlimited 1-to-1 video calls, ad-free experience, and VIP profile status.
                  </p>
                </div>
              </div>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-1 rounded-full border border-emerald-500/30 shrink-0">
                Active Member ⭐
              </span>
            </div>
          )}

          {/* =========================================================================
              1. PREMIUM / VIP SECTION (Plans in required order)
             ========================================================================= */}
          <section id="section-premium-plans" className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>PREMIUM / VIP PLANS</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Choose a VIP subscription to unlock unlimited calling and receive instant Bonus Coins.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {PREMIUM_PLANS.map((plan) => {
                const isCurrentActive = currentUser.isPremium && currentUser.premiumPlan === plan.name;
                const isHighlighted = plan.highlight;

                return (
                  <div
                    key={plan.id}
                    id={`plan-card-${plan.id}`}
                    className={`rounded-2xl border p-4 flex flex-col justify-between relative transition-all duration-200 ${
                      isHighlighted
                        ? 'bg-gradient-to-b from-amber-500/15 via-neutral-900 to-neutral-950 border-amber-500/60 shadow-lg shadow-amber-500/10'
                        : 'bg-neutral-950/90 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                        {plan.badge}
                      </span>
                    )}

                    <div className="space-y-2.5">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center justify-between">
                          <span>{plan.name}</span>
                        </h4>
                        <div className="flex items-baseline space-x-1.5 mt-1">
                          <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                            {plan.price}
                          </span>
                          <span className="text-xs text-neutral-400 font-medium">{plan.billingPeriod}</span>
                        </div>
                      </div>

                      <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-2 flex items-center space-x-2 text-amber-300">
                        <Gift className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-xs font-bold font-mono">
                          +{plan.bonusCoins.toLocaleString()} Bonus Coins
                        </span>
                      </div>

                      <ul className="space-y-1.5 text-xs text-neutral-300 pt-1">
                        {plan.features.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start space-x-2">
                            <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span className="leading-snug">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 mt-3 border-t border-neutral-800/80">
                      <button
                        id={`btn-subscribe-${plan.id}`}
                        onClick={() => handleStartPlanCheckout(plan)}
                        className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-95 ${
                          isCurrentActive
                            ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-600/40'
                            : isHighlighted
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 shadow-md shadow-amber-500/20'
                            : 'bg-neutral-800 hover:bg-neutral-750 text-white hover:text-amber-300 border border-neutral-750'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isCurrentActive ? 'Renew / Extend' : plan.buttonText}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* =========================================================================
              2. BUY COINS SECTION (Directly below Premium Plans on same screen)
             ========================================================================= */}
          <section id="section-buy-coins" className="space-y-3.5 pt-4 border-t border-neutral-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>COINS STORE</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Add coins to call international peers, send gifts, or unlock special match features.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="bg-neutral-950 border border-neutral-800 px-3 py-1 rounded-xl text-xs flex items-center space-x-1.5">
                  <span className="text-neutral-400">Your Coins:</span>
                  <strong className="text-amber-400 font-mono">{coins.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {COIN_PACKAGES.map((pkg) => {
                return (
                  <div
                    key={pkg.id}
                    id={`coin-pack-${pkg.id}`}
                    className={`bg-neutral-950/90 border rounded-2xl p-3.5 text-center flex flex-col justify-between relative transition hover:border-amber-500/50 ${
                      pkg.popular
                        ? 'border-amber-500/60 shadow-md shadow-amber-500/10'
                        : 'border-neutral-800'
                    }`}
                  >
                    {pkg.badge && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-neutral-950 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                        {pkg.badge}
                      </span>
                    )}

                    <div className="space-y-1.5 pt-1">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                        <Coins className="w-5 h-5" />
                      </div>
                      <div className="text-sm font-black text-white font-mono">
                        {pkg.coins.toLocaleString()}
                      </div>
                      <span className="text-[11px] text-neutral-400 block font-medium">Coins</span>
                      <div className="text-xs font-bold text-amber-400 font-mono pt-1">
                        {pkg.price}
                      </div>
                    </div>

                    <button
                      id={`btn-buy-coins-${pkg.id}`}
                      onClick={() => handleStartCoinCheckout(pkg)}
                      className="mt-3 w-full py-1.5 px-2 bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-white font-bold text-xs rounded-xl transition cursor-pointer active:scale-95"
                    >
                      Buy
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* =========================================================================
              3. EXISTING REWARDED AD PROMOTION BANNER (100% Preserved)
             ========================================================================= */}
          <section className="bg-gradient-to-r from-rose-950/40 via-neutral-950 to-neutral-950 border border-rose-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
                <PlaySquare className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                  <span>Earn Free Coins with Rewarded Ads</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Always Free
                  </span>
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Watch a short 5-second sponsor video to get exactly <strong className="text-amber-400">+10 Coins</strong> instantly verified in Firebase.
                </p>
              </div>
            </div>

            <button
              id="btn-open-rewarded-ad-from-premium-modal"
              onClick={() => {
                setPremiumModalOpen(false);
                openRewardedAd('wallet');
              }}
              className="py-2.5 px-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 flex items-center space-x-2 transition cursor-pointer active:scale-95 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Watch Ad → +10 Coins</span>
            </button>
          </section>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-center shrink-0">
          <p className="text-[11px] text-neutral-500 flex items-center justify-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
            <span>Unified Multi-Rail Gateway • Payments received in linked PayPal</span>
          </p>
          <div className="flex items-center space-x-2 text-[10px] text-neutral-400 bg-neutral-950 px-2.5 py-1 rounded-full border border-neutral-800">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span>PayPal Receiving: <strong className="text-blue-300 font-mono">{linkedPayPalMerchant}</strong></span>
          </div>
        </div>

        {/* =========================================================================
            CHECKOUT PAYMENT OVERLAY / MODAL SHEET (UNIFIED MULTI-RAIL SYSTEM)
           ========================================================================= */}
        {(selectedPlanForCheckout || selectedPackageForCheckout) && (
          <div className="absolute inset-0 bg-neutral-950/98 backdrop-blur-md rounded-3xl p-4 sm:p-6 flex flex-col justify-between z-10 animate-in fade-in zoom-in-95 duration-150 overflow-y-auto">
            {/* Checkout Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                  P
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Unified Payment Checkout</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">
                      PayPal Receiving Rail
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Supports UPI, Cards, Bank, Local & International Methods
                  </p>
                </div>
              </div>
              {!isProcessing && (
                <button
                  id="btn-checkout-close"
                  onClick={handleCancelCheckout}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Checkout Content */}
            <div className="my-auto py-3 space-y-4 max-w-xl mx-auto w-full">
              {purchaseResult ? (
                /* Success Confirmation State */
                <div className="text-center space-y-3.5 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Payment Successful & Verified!</h4>
                    <p className="text-xs text-neutral-300 leading-relaxed max-w-md mx-auto mt-1">
                      {purchaseResult.message}
                    </p>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-left space-y-2.5 text-xs">
                    {/* Merchant Receiving Callout */}
                    <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-2.5 flex items-center justify-between text-blue-200">
                      <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>Received In Linked PayPal:</span>
                      </div>
                      <span className="font-mono font-bold text-white">{purchaseResult.merchantReceiver || linkedPayPalMerchant}</span>
                    </div>

                    <div className="flex justify-between text-neutral-400 pt-1">
                      <span>Payment Method:</span>
                      <span className="font-semibold text-neutral-200">{purchaseResult.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>PayPal Order Token:</span>
                      <span className="font-mono text-neutral-300">{purchaseResult.paypalOrderId || purchaseResult.transactionId}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Coins Credited:</span>
                      <span className="font-mono text-emerald-400 font-bold">+{purchaseResult.addedCoins.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400 border-t border-neutral-800 pt-2 font-semibold">
                      <span className="text-white">Updated Coin Balance:</span>
                      <span className="font-mono text-amber-400 text-sm">
                        {purchaseResult.newBalance.toLocaleString()} Coins
                      </span>
                    </div>
                  </div>

                  <button
                    id="btn-checkout-success-close"
                    onClick={() => {
                      handleCancelCheckout();
                      setPremiumModalOpen(false);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
                  >
                    Done & Return to App
                  </button>
                </div>
              ) : (
                /* Active Checkout Selection State */
                <>
                  {/* Merchant Recipient Banner */}
                  <div className="bg-gradient-to-r from-blue-950/50 via-neutral-900 to-blue-950/30 border border-blue-500/35 rounded-2xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                        <Lock className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-[11px] text-neutral-400">
                          Pre-linked PayPal Account (Receiving):
                        </div>
                        <div className="text-xs font-bold text-white font-mono flex items-center space-x-1.5">
                          <span>{linkedPayPalMerchant}</span>
                          <span className="text-[10px] text-emerald-400 font-normal bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                            Verified Merchant
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg shrink-0 hidden sm:inline">
                      Direct Deposit
                    </span>
                  </div>

                  {/* Item Summary Card */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 space-y-2 text-xs">
                    {selectedPlanForCheckout && (
                      <div className="flex justify-between items-baseline">
                        <div>
                          <span className="font-bold text-white text-sm">{selectedPlanForCheckout.name}</span>
                          <span className="text-amber-400 text-[11px] block">
                            +{selectedPlanForCheckout.bonusCoins.toLocaleString()} Bonus Coins
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-amber-400 font-mono">
                            {selectedPlanForCheckout.price}
                          </span>
                          <span className="text-neutral-400 text-[10px] block">
                            {selectedPlanForCheckout.billingPeriod}
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedPackageForCheckout && (
                      <div className="flex justify-between items-baseline">
                        <div>
                          <span className="font-bold text-white text-sm">
                            {selectedPackageForCheckout.coins.toLocaleString()} Coins Pack
                          </span>
                          <span className="text-neutral-400 text-[11px] block">
                            Current Balance: {coins.toLocaleString()} Coins
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-amber-400 font-mono">
                            {selectedPackageForCheckout.price}
                          </span>
                          <span className="text-emerald-400 text-[10px] block font-mono">
                            New: {(coins + selectedPackageForCheckout.coins).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* =========================================================================
                      UNIFIED PAYMENT METHOD SELECTOR (All 6 Supported Categories)
                     ========================================================================= */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <span>Select Your Payment Method</span>
                      </label>
                      <span className="text-[10px] text-neutral-400">
                        International & Domestic Accepted
                      </span>
                    </div>

                    {/* 6 Category Pills Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {/* 1. UPI */}
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('upi')}
                        className={`p-2.5 rounded-xl border text-left flex items-start space-x-2 transition cursor-pointer ${
                          selectedCategory === 'upi'
                            ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <Smartphone className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-white">UPI</div>
                          <div className="text-[10px] text-neutral-400">GPay, PhonePe, Paytm</div>
                        </div>
                      </button>

                      {/* 2. Debit/Credit Card */}
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('card')}
                        className={`p-2.5 rounded-xl border text-left flex items-start space-x-2 transition cursor-pointer ${
                          selectedCategory === 'card'
                            ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-white">Debit/Credit Card</div>
                          <div className="text-[10px] text-neutral-400">Visa, MasterCard, RuPay</div>
                        </div>
                      </button>

                      {/* 3. Bank Payment */}
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('bank')}
                        className={`p-2.5 rounded-xl border text-left flex items-start space-x-2 transition cursor-pointer ${
                          selectedCategory === 'bank'
                            ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <Building2 className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-white">Bank Payment</div>
                          <div className="text-[10px] text-neutral-400">Net Banking / Wire</div>
                        </div>
                      </button>

                      {/* 4. International Card */}
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('intl_card')}
                        className={`p-2.5 rounded-xl border text-left flex items-start space-x-2 transition cursor-pointer ${
                          selectedCategory === 'intl_card'
                            ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <Globe className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-white">International Card</div>
                          <div className="text-[10px] text-neutral-400">Global Visa, Amex, JCB</div>
                        </div>
                      </button>

                      {/* 5. अन्य Local Payment Methods */}
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('local')}
                        className={`p-2.5 rounded-xl border text-left flex items-start space-x-2 transition cursor-pointer ${
                          selectedCategory === 'local'
                            ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <Wallet className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-white">Local Methods</div>
                          <div className="text-[10px] text-neutral-400">Paytm & Local Wallets</div>
                        </div>
                      </button>

                      {/* 6. अन्य International Payment Methods */}
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('intl_methods')}
                        className={`p-2.5 rounded-xl border text-left flex items-start space-x-2 transition cursor-pointer ${
                          selectedCategory === 'intl_methods'
                            ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <Zap className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-white">Int'l Methods</div>
                          <div className="text-[10px] text-neutral-400">PayPal, Apple, Revolut</div>
                        </div>
                      </button>
                    </div>

                    {/* =====================================================================
                        DYNAMIC FORM BASED ON SELECTED CATEGORY
                       ===================================================================== */}
                    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3.5 space-y-3">
                      {/* CATEGORY 1: UPI */}
                      {selectedCategory === 'upi' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-300">Choose UPI Option:</span>
                            <div className="flex items-center space-x-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-[10px]">
                              <button
                                type="button"
                                onClick={() => setUpiMode('id')}
                                className={`px-2.5 py-1 rounded-md transition ${
                                  upiMode === 'id' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                                }`}
                              >
                                Enter UPI ID
                              </button>
                              <button
                                type="button"
                                onClick={() => setUpiMode('qr')}
                                className={`px-2.5 py-1 rounded-md transition ${
                                  upiMode === 'qr' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                                }`}
                              >
                                Scan QR Code
                              </button>
                            </div>
                          </div>

                          {upiMode === 'id' ? (
                            <div className="space-y-2">
                              {/* Quick App Badges */}
                              <div className="grid grid-cols-4 gap-1.5">
                                {[
                                  { id: 'gpay', label: 'Google Pay', suffix: '@okhdfcbank' },
                                  { id: 'phonepe', label: 'PhonePe', suffix: '@ybl' },
                                  { id: 'paytm', label: 'Paytm', suffix: '@paytm' },
                                  { id: 'bhim', label: 'BHIM UPI', suffix: '@upi' },
                                ].map((app) => (
                                  <button
                                    key={app.id}
                                    type="button"
                                    onClick={() => {
                                      setUpiApp(app.id as any);
                                      if (!upiId) setUpiId(`user${app.suffix}`);
                                    }}
                                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold text-center transition ${
                                      upiApp === app.id
                                        ? 'bg-amber-500/20 border-amber-500 text-white'
                                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                                    }`}
                                  >
                                    {app.label}
                                  </button>
                                ))}
                              </div>

                              <div>
                                <label className="text-[11px] text-neutral-400 block mb-1">Enter your Virtual Payment Address (VPA):</label>
                                <input
                                  type="text"
                                  value={upiId}
                                  onChange={(e) => setUpiId(e.target.value)}
                                  placeholder="e.g. mobile@upi or username@okhdfcbank"
                                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-center space-y-2">
                              <div className="w-28 h-28 mx-auto bg-white p-2 rounded-xl flex items-center justify-center shadow-inner">
                                <QrCode className="w-24 h-24 text-neutral-950" />
                              </div>
                              <p className="text-[11px] text-neutral-400">
                                Scan with Google Pay, PhonePe, Paytm, or any UPI app.
                              </p>
                              <span className="text-[10px] text-emerald-400 font-mono">
                                Receiver: {linkedPayPalMerchant}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* CATEGORY 2: DEBIT / CREDIT CARD */}
                      {selectedCategory === 'card' && (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-[11px] text-neutral-400">
                            <span>Supported: Visa, MasterCard, RuPay, Maestro</span>
                            <span className="text-emerald-400 flex items-center space-x-1">
                              <Lock className="w-3 h-3" />
                              <span>256-bit SSL</span>
                            </span>
                          </div>

                          <div>
                            <label className="text-[11px] text-neutral-400 block mb-1">Card Number</label>
                            <input
                              type="text"
                              maxLength={19}
                              value={cardNumber}
                              onChange={(e) => handleCardInputChange(e.target.value)}
                              placeholder="4111 2222 3333 4444"
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[11px] text-neutral-400 block mb-1">Expiry (MM/YY)</label>
                              <input
                                type="text"
                                maxLength={5}
                                value={cardExpiry}
                                onChange={(e) => handleExpiryInputChange(e.target.value)}
                                placeholder="12/28"
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-neutral-400 block mb-1">CVV / CVC</label>
                              <input
                                type="password"
                                maxLength={4}
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                                placeholder="•••"
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] text-neutral-400 block mb-1">Cardholder Name</label>
                            <input
                              type="text"
                              value={cardHolder}
                              onChange={(e) => setCardHolder(e.target.value)}
                              placeholder="Name on card"
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      )}

                      {/* CATEGORY 3: BANK PAYMENT */}
                      {selectedCategory === 'bank' && (
                        <div className="space-y-2.5">
                          <label className="text-[11px] text-neutral-400 block">Select Your Bank for Direct Payment / Net Banking:</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[
                              'State Bank of India',
                              'HDFC Bank',
                              'ICICI Bank',
                              'Axis Bank',
                              'Kotak Mahindra Bank',
                              'Punjab National Bank',
                              'Bank of Baroda',
                              'Canara Bank',
                              'International Wire'
                            ].map((bank) => (
                              <button
                                key={bank}
                                type="button"
                                onClick={() => setSelectedBank(bank)}
                                className={`p-2 rounded-xl border text-[11px] text-left transition ${
                                  selectedBank === bank
                                    ? 'bg-amber-500/20 border-amber-500 text-white font-semibold'
                                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                                }`}
                              >
                                {bank}
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-neutral-400 pt-1">
                            You will complete standard two-factor authentication with your selected bank. Settlement is deposited into linked PayPal merchant.
                          </p>
                        </div>
                      )}

                      {/* CATEGORY 4: INTERNATIONAL CARD */}
                      {selectedCategory === 'intl_card' && (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-neutral-300 font-semibold">Worldwide Multi-Currency Acceptance</span>
                            <span className="text-amber-400 text-[10px]">180+ Countries</span>
                          </div>

                          <div className="flex items-center space-x-1.5 text-[10px] text-neutral-400 bg-neutral-950 p-2 rounded-xl border border-neutral-800">
                            <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span>Accepts American Express, Visa Global, MasterCard International, JCB, and Diners Club with automatic USD conversion.</span>
                          </div>

                          <div>
                            <label className="text-[11px] text-neutral-400 block mb-1">International Card Number</label>
                            <input
                              type="text"
                              maxLength={19}
                              value={cardNumber}
                              onChange={(e) => handleCardInputChange(e.target.value)}
                              placeholder="3782 8224 6310 005"
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[11px] text-neutral-400 block mb-1">MM/YY</label>
                              <input
                                type="text"
                                maxLength={5}
                                value={cardExpiry}
                                onChange={(e) => handleExpiryInputChange(e.target.value)}
                                placeholder="09/29"
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-neutral-400 block mb-1">Security Code (CVV)</label>
                              <input
                                type="password"
                                maxLength={4}
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                                placeholder="4 digits for Amex"
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CATEGORY 5: अन्य LOCAL PAYMENT METHODS */}
                      {selectedCategory === 'local' && (
                        <div className="space-y-2.5">
                          <label className="text-[11px] text-neutral-400 block">Select Local Digital Wallet / Instant Service:</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[
                              'Paytm Wallet',
                              'PhonePe Wallet',
                              'Amazon Pay India',
                              'MobiKwik',
                              'Airtel Money',
                              'Cashfree Instant'
                            ].map((w) => (
                              <button
                                key={w}
                                type="button"
                                onClick={() => setSelectedLocalWallet(w)}
                                className={`p-2 rounded-xl border text-[11px] text-left transition ${
                                  selectedLocalWallet === w
                                    ? 'bg-amber-500/20 border-amber-500 text-white font-semibold'
                                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                                }`}
                              >
                                {w}
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-neutral-400">
                            Local wallet gateway routes payments smoothly through the unified PayPal commerce rail.
                          </p>
                        </div>
                      )}

                      {/* CATEGORY 6: अन्य INTERNATIONAL PAYMENT METHODS */}
                      {selectedCategory === 'intl_methods' && (
                        <div className="space-y-2.5">
                          <label className="text-[11px] text-neutral-400 block">Choose International Payment Method:</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedIntlMethod('paypal_direct')}
                              className={`p-3 rounded-xl border text-left space-y-1 transition ${
                                selectedIntlMethod === 'paypal_direct'
                                  ? 'bg-blue-600/20 border-blue-500 text-white'
                                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                              }`}
                            >
                              <div className="text-xs font-bold text-blue-400 flex items-center space-x-1.5">
                                <span>PayPal Wallet</span>
                                <span className="text-[9px] bg-blue-500/30 text-blue-300 px-1.5 py-0.2 rounded">1-Click</span>
                              </div>
                              <p className="text-[10px] text-neutral-400">Direct PayPal-to-PayPal instant transfer</p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedIntlMethod('apple_pay')}
                              className={`p-3 rounded-xl border text-left space-y-1 transition ${
                                selectedIntlMethod === 'apple_pay'
                                  ? 'bg-amber-500/20 border-amber-500 text-white'
                                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                              }`}
                            >
                              <div className="text-xs font-bold text-white">Apple Pay</div>
                              <p className="text-[10px] text-neutral-400">1-Touch biometric mobile payment</p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedIntlMethod('google_pay_intl')}
                              className={`p-3 rounded-xl border text-left space-y-1 transition ${
                                selectedIntlMethod === 'google_pay_intl'
                                  ? 'bg-amber-500/20 border-amber-500 text-white'
                                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                              }`}
                            >
                              <div className="text-xs font-bold text-white">Google Pay International</div>
                              <p className="text-[10px] text-neutral-400">Global Google Wallet authorization</p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedIntlMethod('revolut')}
                              className={`p-3 rounded-xl border text-left space-y-1 transition ${
                                selectedIntlMethod === 'revolut'
                                  ? 'bg-amber-500/20 border-amber-500 text-white'
                                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                              }`}
                            >
                              <div className="text-xs font-bold text-white">Revolut / SEPA / iDEAL</div>
                              <p className="text-[10px] text-neutral-400">European & cross-border bank rails</p>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Error Notification */}
                  {errorMessage && (
                    <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-2.5 flex items-center space-x-2 text-xs text-rose-300">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Processing Status Banner */}
                  {isProcessing && (
                    <div className="bg-blue-950/40 border border-blue-500/40 rounded-xl p-3 flex items-center space-x-2.5 text-xs text-blue-200">
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                      <span>{processingStep || 'Processing payment through PayPal Merchant gateway...'}</span>
                    </div>
                  )}

                  {/* Confirm & Cancel Buttons */}
                  <div className="space-y-2 pt-1">
                    <button
                      id="btn-confirm-checkout-payment"
                      disabled={isProcessing}
                      onClick={handleConfirmPurchase}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:from-amber-400 hover:to-rose-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 active:scale-[0.98] transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                          <span>Routing to PayPal ({linkedPayPalMerchant})...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 text-neutral-950" />
                          <span>
                            Pay & Receive in PayPal ({selectedPlanForCheckout ? selectedPlanForCheckout.price : selectedPackageForCheckout?.price})
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleCancelCheckout}
                      className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Trust disclaimer */}
            <div className="text-center text-[10px] text-neutral-500 border-t border-neutral-800 pt-2 shrink-0">
              Unified PayPal Commerce Gateway • Receiver: <strong className="text-blue-400">{linkedPayPalMerchant}</strong> • End-to-end encrypted
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

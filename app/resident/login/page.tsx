'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useResidentAuth } from '@/lib/resident-auth-context';
import { useI18n } from '@/lib/i18n-context';
import { showError, showSuccess } from '@/lib/utils';

export default function ResidentLoginPage() {
  const { t } = useI18n();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { requestOtp, login } = useResidentAuth();
  const router = useRouter();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await requestOtp(mobile);
      if (result.success) {
        showSuccess(result.message || t('pages.residentPortal.login.otpSentSuccess'));
        setOtpSent(true);
        setStep('otp');
      } else {
        showError(null, result.message || t('pages.residentPortal.login.otpSendError'));
      }
    } catch (error: any) {
      showError(error, error.response?.data?.message || t('pages.residentPortal.login.otpSendError'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(mobile, otp);
      // Navigation handled by auth context
    } catch (error: any) {
      if (error.response?.data?.multipleResidencies) {
        // Multi-PG scenario - handled by auth context
        return;
      }
      showError(error, error.response?.data?.message || t('pages.residentPortal.login.invalidOtp'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('pages.residentPortal.login.title')}</h1>
          <p className="text-gray-600">{t('pages.residentPortal.login.subtitle')}</p>
        </div>

        {step === 'mobile' ? (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                {t('pages.residentPortal.login.mobileNumber')}
              </label>
              <input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder={t('pages.residentPortal.login.mobilePlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={10}
                maxLength={15}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || mobile.length < 10}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('pages.residentPortal.login.sending') : t('pages.residentPortal.login.sendOtp')}
            </button>

            <p className="text-sm text-gray-500 text-center">
              {t('pages.residentPortal.login.otpMessage')}
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                {t('pages.residentPortal.login.enterOtp')}
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('pages.residentPortal.login.otpPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                required
                minLength={6}
                maxLength={6}
                disabled={loading}
                autoFocus
              />
              <p className="text-sm text-gray-500 mt-2 text-center">
                {t('pages.residentPortal.login.otpSentTo')} {mobile}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('pages.residentPortal.login.verifying') : t('pages.residentPortal.login.verifyLogin')}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setStep('mobile');
                  setOtp('');
                  setOtpSent(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={loading}
              >
                {t('pages.residentPortal.login.changeMobile')}
              </button>
              <span className="mx-2 text-gray-300">|</span>
              <button
                type="button"
                onClick={handleRequestOtp}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={loading}
              >
                {t('pages.residentPortal.login.resendOtp')}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              {t('pages.residentPortal.login.otpValidFor')}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '../../../store';
import { setAuthToken } from '../../../store/slices/auth-slice';
import { apiClient } from '../../../services/api-client';
import { useTranslation } from '../../../i18n';

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('auth_token', token);
      dispatch(setAuthToken({ token }));

      apiClient.getMe().then((user) => {
        dispatch(setAuthToken({ token, user }));
        router.push('/orders');
      }).catch(() => {
        router.push('/orders');
      });
    } else {
      router.push('/orders');
    }
  }, [searchParams, router, dispatch]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40vh',
        color: '#546e7a',
        fontSize: '16px',
      }}
    >
      {t.auth.authenticating}
    </div>
  );
}

export default function AuthCallbackPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div>{t.auth.loading}</div>}>
      <CallbackInner />
    </Suspense>
  );
}

import React, { useEffect, useRef } from 'react';
import { googleAuthService } from '../services/api';

let googleScriptPromise;

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

const loadGoogleScript = () => {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }

  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.google), { once: true });
        existingScript.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = GOOGLE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google);
      script.onerror = () => reject(new Error('Failed to load Google sign-in.'));
      document.head.appendChild(script);
    });
  }

  return googleScriptPromise;
};

const GoogleAuthButton = ({ role, mode = 'login', onError, onSuccess }) => {
  const buttonRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    let disposed = false;

    if (!clientId) {
      onError?.('Google sign-in is not configured.');
      return undefined;
    }

    loadGoogleScript()
      .then(() => {
        if (disposed || !buttonRef.current || !window.google?.accounts?.id) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              const result = await googleAuthService.authenticate(role, response.credential);
              onSuccess?.(result.data);
            } catch (error) {
              onError?.(error.message || 'Google sign-in failed.');
            }
          },
        });

        buttonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          width: Math.min(buttonRef.current.offsetWidth || 360, 400),
          text: mode === 'register' ? 'signup_with' : 'signin_with',
          logo_alignment: 'left',
        });
      })
      .catch((error) => {
        onError?.(error.message || 'Google sign-in failed.');
      });

    return () => {
      disposed = true;
      if (buttonRef.current) {
        buttonRef.current.innerHTML = '';
      }
    };
  }, [clientId, mode, onError, onSuccess, role]);

  return <div ref={buttonRef} className="google-auth-button" />;
};

export default GoogleAuthButton;

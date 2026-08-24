import { useEffect, useRef, useState, useCallback } from 'react';
import { Mic } from 'lucide-react';
import styles from './VoiceInput.module.css';

/**
 * Composant de saisie avec dictée vocale
 * Utilise l'API native Web Speech API pour un meilleur contrôle
 */
const VoiceInput = ({ value, onChange, placeholder, rows = 4, autoFocus = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [interimText, setInterimText] = useState('');

  const recognitionRef = useRef(null);
  const baseValueRef = useRef('');
  const finalTranscriptRef = useRef('');

  // Vérifier le support du navigateur
  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialiser la reconnaissance vocale
  const initRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      // Accumuler le texte final
      if (final) {
        finalTranscriptRef.current += final;
        // Mettre à jour la valeur avec le texte final
        const newValue = baseValueRef.current
          ? `${baseValueRef.current} ${finalTranscriptRef.current}`.trim()
          : finalTranscriptRef.current.trim();
        onChange(newValue);
      }

      // Afficher le texte interim (preview)
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      console.error('Erreur reconnaissance vocale:', event.error);

      let errorMessage = "Erreur de reconnaissance vocale";
      switch (event.error) {
        case 'not-allowed':
          errorMessage = "Accès au microphone refusé. Vérifiez les permissions.";
          break;
        case 'no-speech':
          errorMessage = "Aucune parole détectée. Réessayez.";
          break;
        case 'audio-capture':
          errorMessage = "Impossible d'accéder au microphone.";
          break;
        case 'network':
          errorMessage = "Erreur réseau. Vérifiez votre connexion.";
          break;
        default:
          errorMessage = `Erreur: ${event.error}`;
      }

      setError(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');

      // S'assurer que le texte final est bien sauvegardé
      if (finalTranscriptRef.current) {
        const newValue = baseValueRef.current
          ? `${baseValueRef.current} ${finalTranscriptRef.current}`.trim()
          : finalTranscriptRef.current.trim();
        onChange(newValue);
      }
    };

    return recognition;
  }, [isSupported, onChange]);

  // Démarrer la dictée
  const startListening = useCallback(async () => {
    try {
      setError(null);

      // Demander la permission du microphone
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Sauvegarder la valeur actuelle comme base
      baseValueRef.current = value || '';
      finalTranscriptRef.current = '';
      setInterimText('');

      // Créer une nouvelle instance de reconnaissance
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      recognitionRef.current = initRecognition();

      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (err) {
      console.error('Erreur démarrage dictée:', err);
      setError("Impossible d'accéder au microphone. Vérifiez les permissions.");
      setIsListening(false);
    }
  }, [value, initRecognition]);

  // Arrêter la dictée
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      // Utiliser stop() au lieu de abort() pour finaliser proprement
      recognitionRef.current.stop();
    }
    setInterimText('');
  }, []);

  // Cleanup à la destruction du composant
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Toggle dictée
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Calculer la valeur affichée (valeur actuelle + interim)
  const displayValue = isListening && interimText
    ? `${value}${value ? ' ' : ''}${interimText}`
    : value;

  // Fallback si le navigateur ne supporte pas la Web Speech API
  if (!isSupported) {
    return (
      <div className={styles.container}>
        <textarea
          className={styles.textarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          autoFocus={autoFocus}
        />
        <p className={styles.unsupported}>Dictée vocale non disponible sur ce navigateur</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <textarea
        className={`${styles.textarea} ${isListening ? styles.listening : ''}`}
        value={displayValue}
        onChange={(e) => {
          // Si on tape pendant la dictée, la saisie clavier devient la nouvelle base.
          if (isListening) {
            baseValueRef.current = e.target.value;
            finalTranscriptRef.current = '';
          }
          onChange(e.target.value);
        }}
        rows={rows}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />

      <div className={styles.toolbar}>
        <button
          type="button"
          onClick={toggleListening}
          className={`${styles.micButton} ${isListening ? styles.micActive : ''}`}
          aria-pressed={isListening}
        >
          {isListening ? (
            <>
              <span className={styles.pulse} aria-hidden="true" />
              Écoute en cours…
            </>
          ) : (
            <>
              <Mic size={16} strokeWidth={2} />
              Dicter
            </>
          )}
        </button>

        {isListening && interimText && (
          <span className={styles.interim}>« {interimText} »</span>
        )}
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
};

export default VoiceInput;

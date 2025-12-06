import { useEffect, useRef, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import styles from './VoiceInput.module.css';

const VoiceInput = ({ value, onChange, placeholder, rows = 4, autoFocus = false }) => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const initialValueRef = useRef('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (listening && transcript) {
      // Combiner la valeur initiale avec le transcript actuel
      const newValue = initialValueRef.current
        ? `${initialValueRef.current} ${transcript}`
        : transcript;
      onChange(newValue);
    }
  }, [transcript, listening]);

  const startListening = async () => {
    try {
      setError(null);

      // Demander la permission du microphone explicitement
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Sauvegarder la valeur actuelle avant de commencer
      initialValueRef.current = value || '';
      resetTranscript();

      await SpeechRecognition.startListening({
        language: 'fr-FR',
        continuous: true
      });
    } catch (err) {
      console.error('Erreur reconnaissance vocale:', err);
      setError("Impossible d'accéder au microphone. Vérifiez les permissions.");

      // Arrêter l'écoute en cas d'erreur
      SpeechRecognition.stopListening();
    }
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
    resetTranscript();
    initialValueRef.current = '';
    setError(null);
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
    );
  }

  return (
    <div className={styles.container}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={listening ? styles.listening : ''}
      />
      <button
        type="button"
        onClick={listening ? stopListening : startListening}
        className={`${styles.micButton} ${listening ? styles.active : ''}`}
        title={listening ? "Arrêter la dictée" : "Commencer la dictée vocale"}
      >
        {listening ? '⏹' : '🎤'}
      </button>
      {listening && (
        <div className={styles.listeningIndicator}>
          <span className={styles.pulse}></span>
          <span className={styles.listeningText}>Dictée en cours...</span>
        </div>
      )}
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceInput;

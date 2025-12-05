import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (listening && transcript) {
      // Combiner la valeur initiale avec le transcript actuel
      const newValue = initialValueRef.current
        ? `${initialValueRef.current} ${transcript}`
        : transcript;
      onChange(newValue);
    }
  }, [transcript, listening]);

  const startListening = () => {
    // Sauvegarder la valeur actuelle avant de commencer
    initialValueRef.current = value || '';
    resetTranscript();
    SpeechRecognition.startListening({
      language: 'fr-FR',
      continuous: true
    });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
    resetTranscript();
    initialValueRef.current = '';
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
    </div>
  );
};

export default VoiceInput;

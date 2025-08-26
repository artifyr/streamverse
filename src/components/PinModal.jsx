import React, { useState, useEffect, useCallback } from 'react';

const CORRECT_PIN = "220325";

function PinModal({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handlePinCheck = useCallback((pin) => {
    if (pin === CORRECT_PIN) {
      onUnlock();
    } else {
      setError('Incorrect PIN. Please try again.');
      setPin('');
      // Trigger the shake animation
      setIsShaking(true);
      // Reset the animation state after it completes (500ms)
      setTimeout(() => setIsShaking(false), 500);
    }
  }, [onUnlock]);

  useEffect(() => {
    if (pin.length === 6) {
      // A short delay gives the user feedback that the 6th digit was entered.
      const timer = setTimeout(() => handlePinCheck(pin), 200);
      return () => clearTimeout(timer);
    }
  }, [pin, handlePinCheck]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handlePinCheck(pin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`bg-neutral-800 p-8 rounded-lg shadow-xl text-center w-full max-w-xs ${isShaking ? 'animate-shake' : ''}`}
      >
        <h2 className="text-2xl font-bold mb-4 text-white">Enter PIN to Access</h2>
        <p className="text-neutral-400 mb-6">This site is for my babyy only 💕</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full bg-neutral-900 border-2 border-neutral-700 rounded-lg p-3 text-center text-white placeholder-neutral-500 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/40 transition-colors duration-300 tracking-[0.5em]"
            maxLength="6"
            autoFocus
          />
          {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full mt-6 bg-white hover:bg-neutral-200 text-black font-bold py-2 px-4 rounded-md transition-colors duration-300"
          >
            Unlock
          </button>
        </form>
        <div className="mt-4 text-sm h-5">
          {!showHint ? (
            <button
              onClick={() => setShowHint(true)}
              className="text-neutral-500 hover:text-neutral-300 transition-colors duration-200"
            >
              Forgot PIN?
            </button>
          ) : (
            <p className="text-neutral-400">Hint: It's when we started dating officially (MMDDYY) 💕💕</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PinModal;
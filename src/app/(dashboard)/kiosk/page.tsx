'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ClockEventType } from '@prisma/client'

const KioskClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-8xl font-bold text-center">
      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
    </div>
  );
};

export default function KioskPage() {
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [isLoading, setIsLoading] = useState(false);

  const handleKeyPress = (key: string) => {
    if (isLoading) return;
    setMessage('');
    if (key === 'clear') {
      setPin('');
    } else if (key === 'backspace') {
      setPin(pin.slice(0, -1));
    } else if (pin.length < 4) {
      setPin(pin + key);
    }
  };

  const handleClockAction = async (type: ClockEventType) => {
    if (pin.length !== 4) {
      setMessageType('error');
      setMessage('Please enter a 4-digit PIN.');
      return;
    }

    setIsLoading(true);
    setMessageType('info');
    setMessage(`Processing clock ${type.toLowerCase()}...`);

    try {
        // In a real app, the Kiosk would be configured with its organization and location ID
        const organizationId = process.env.NEXT_PUBLIC_KIOSK_ORGANIZATION_ID || 'clwvxv36j00001234abcd5678'; // Placeholder

        const response = await fetch('/api/kiosk/clock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin, type, organizationId }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'An unknown error occurred.');
        }

        setMessageType('success');
        setMessage(data.message);

    } catch (err: any) {
        setMessageType('error');
        setMessage(err.message);
    } finally {
        setIsLoading(false);
        setPin('');
        setTimeout(() => setMessage(''), 5000); // Clear message after 5 seconds
    }
  }

  const keypadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'backspace'];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <KioskClock />
        <p className="text-center text-gray-500 mb-6">Enter your PIN to clock in or out</p>

        <div className="w-full h-16 bg-gray-200 rounded-md flex items-center justify-center mb-6">
          <p className="text-4xl tracking-[1rem]">{pin.padEnd(4, '•')}</p>
        </div>

        {message && (
            <div className={`p-4 mb-4 text-center rounded-md ${
                messageType === 'success' ? 'bg-green-100 text-green-800' :
                messageType === 'error' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
            }`}>
                {message}
            </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-6">
          {keypadKeys.map((key) => (
            <Button
              key={key}
              onClick={() => handleKeyPress(key)}
              variant="outline"
              className="h-20 text-2xl"
              disabled={isLoading}
            >
              {key}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Button className="h-20 text-xl" onClick={() => handleClockAction(ClockEventType.IN)} disabled={isLoading}>Clock In</Button>
            <Button className="h-20 text-xl" variant="destructive" onClick={() => handleClockAction(ClockEventType.OUT)} disabled={isLoading}>Clock Out</Button>
            <Button className="h-20 text-xl" variant="secondary" onClick={() => handleClockAction(ClockEventType.BREAK_START)} disabled={isLoading}>Start Break</Button>
            <Button className="h-20 text-xl" variant="secondary" onClick={() => handleClockAction(ClockEventType.BREAK_END)} disabled={isLoading}>End Break</Button>
        </div>
      </div>
    </div>
  );
}

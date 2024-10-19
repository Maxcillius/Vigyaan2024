import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

interface PredictionResponse {
  result: string;
}

const VideoCapture: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [alert, setAlert] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);

  const BACKEND_URL = "http://localhost:5000";

  const startDetecting = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        setAlert('');
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsDetecting(true);
      })
      .catch((err) => {
        console.error('Error accessing webcam:', err);
        setAlert('Camera not found or permission denied');
      });
  };

  const stopDetecting = () => {
    
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setIsDetecting(false);

    
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.fillStyle = 'black';
        context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    setAlert('');
  };

  const sendFrameToBackend = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    
    const imageData = canvas.toDataURL('image/jpeg');

    try {
      const response = await axios.post<PredictionResponse>(
        `${BACKEND_URL}/analyze`,
        { image: imageData }
      );
      setPrediction(response.data.result);
    } catch (error) {
      console.error('Error sending frame:', error);
    }
  };


  useEffect(() => {
    if (isDetecting) {
      const interval = setInterval(sendFrameToBackend, 1000);
      return () => clearInterval(interval);
    }
  }, [isDetecting]);

  return (
    <div className="flex h-screen w-screen bg-gray-900">

      <div className="flex flex-col items-center justify-center w-3/4">
        {alert && (
          <div className="p-4 text-2xl text-red-500 font-bold">{alert}</div>
        )}
        <video
          className="bg-black rounded-lg"
          ref={videoRef}
          autoPlay
          width="960"
          height="540"
        />
        <canvas
          ref={canvasRef}
          width="960"
          height="540"
          style={{ display: 'none' }}
        />
        <div className="flex gap-6 p-4">
          <button
            onClick={startDetecting}
            className="px-6 py-2 bg-green-500 rounded-md text-white"
            disabled={isDetecting}
          >
            Start
          </button>
          <button
            onClick={stopDetecting}
            className="px-6 py-2 bg-red-500 rounded-md text-white"
            disabled={!isDetecting}
          >
            Stop
          </button>
        </div>
      </div>

      <div className="w-1/4 bg-gray-800 text-white p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Prediction</h2>
        <div className="text-lg">
          {prediction ? prediction : 'Waiting for prediction...'}
        </div>
      </div>
    </div>
  );
};

export default VideoCapture;

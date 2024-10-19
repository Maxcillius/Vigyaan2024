import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

interface PredictionResponse {
  result: string;
}

const VideoCapture: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);

  // Access the webcam on component mount
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.error('Error accessing webcam:', err));
  }, []);

  const sendFrameToBackend = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Draw the current frame from video to the canvas
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // Convert the canvas image to a base64 string
    const imageData = canvas.toDataURL('image/jpeg');

    try {
      const response = await axios.post<PredictionResponse>(
        'http://localhost:5000/analyze',
        { image: imageData }
      );
      setPrediction(response.data.result); // Update the prediction state
    } catch (error) {
      console.error('Error sending frame:', error);
    }
  };

  // Send a frame every second
  useEffect(() => {
    const interval = setInterval(sendFrameToBackend, 1000);
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  return (
    <div>
      <video ref={videoRef} autoPlay width="640" height="480" />
      <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }} />
      <div>
        <h2>Prediction: {prediction || 'Waiting for prediction...'}</h2>
      </div>
    </div>
  );
};

export default VideoCapture;

import { useState, useEffect, useRef } from 'react';

// Remove the polyfill since we're now using vite-plugin-node-polyfills
import Peer from 'simple-peer/simplepeer.min.js';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import '../styles/VideoConference.css';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaDesktop, FaPhone, FaPhoneSlash } from 'react-icons/fa';

const VideoChat = ({ interviewId, userType, userName }) => {
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState('');
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareStream, setScreenShareStream] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const socketRef = useRef();
  const navigate = useNavigate();
  
  // Connect to socket server when component mounts
  useEffect(() => {
    // Get the token for authentication
    const token = localStorage.getItem('token');
    
    if (!token) {
      setConnectionError('Authentication token not found. Please log in again.');
      return;
    }
    
    console.log('Connecting to socket server with token:', token.substring(0, 10) + '...');
    
    // Connect to the socket server with auth
    socketRef.current = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    // Request access to user's media devices with better error handling
    const initializeMediaDevices = async () => {
      try {
        // First check if any media devices are available
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideoInput = devices.some(device => device.kind === 'videoinput');
        const hasAudioInput = devices.some(device => device.kind === 'audioinput');
        
        if (!hasVideoInput && !hasAudioInput) {
          throw new Error('No camera or microphone detected on this device');
        }
        
        // Try to get access to media devices
        const currentStream = await navigator.mediaDevices.getUserMedia({ 
          video: hasVideoInput, 
          audio: hasAudioInput 
        });
        
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
        
        // Provide more specific error messages based on the error type
        if (err.name === 'NotReadableError' || err.message.includes('Device in use')) {
          setConnectionError(
            'Camera or microphone is already in use by another application or browser tab. ' +
            'Please close other applications using your camera, then refresh this page.'
          );
        } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setConnectionError(
            'Camera and microphone access was denied. ' +
            'Please allow access in your browser settings and refresh this page.'
          );
        } else if (err.name === 'NotFoundError') {
          setConnectionError('No camera or microphone found on this device.');
        } else {
          setConnectionError(`Failed to access camera and microphone: ${err.message}`);
        }
      }
    };
    
    initializeMediaDevices();
    
    // Set up socket event listeners
    socketRef.current.on('connect', () => {
      console.log('Connected to socket server with ID:', socketRef.current.id);
      
      // Join the interview room
      socketRef.current.emit('join-room', { interviewId, userType, userName });
    });
    
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionError('Failed to connect to the video server: ' + error.message);
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        console.log('Attempting to reconnect...');
        socketRef.current.connect();
      }, 5000);
    });
    
    socketRef.current.on('user-joined', (data) => {
      console.log(`${data.userName} (${data.userType}) joined the room`);
    });
    
    socketRef.current.on('call-user', (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });
    
    socketRef.current.on('call-ended', () => {
      endCall();
    });
    
    // Clean up on component unmount
    return () => {
      console.log('VideoChat component unmounting, cleaning up resources...');
      
      // Stop all media tracks
      if (stream) {
        console.log('Stopping camera and microphone tracks');
        stream.getTracks().forEach(track => {
          console.log(`Stopping ${track.kind} track`);
          track.stop();
        });
      }
      
      // Stop screen sharing if active
      if (screenShareStream) {
        console.log('Stopping screen sharing tracks');
        screenShareStream.getTracks().forEach(track => {
          console.log(`Stopping screen sharing ${track.kind} track`);
          track.stop();
        });
      }
      
      // Disconnect from socket server
      if (socketRef.current) {
        console.log('Disconnecting from socket server');
        socketRef.current.disconnect();
      }
      
      // Destroy peer connection
      if (connectionRef.current) {
        console.log('Destroying peer connection');
        connectionRef.current.destroy();
      }
    };
  }, [interviewId, userType, userName]);
  
  // Function to call the other user
  const callUser = () => {
    if (!stream) {
      setConnectionError('No video stream available. Please check your camera and microphone.');
      return;
    }
    
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream
    });
    
    peer.on('signal', (data) => {
      socketRef.current.emit('call-user', {
        interviewId,
        signalData: data,
        from: userName
      });
    });
    
    peer.on('stream', (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });
    
    peer.on('error', (err) => {
      console.error('Peer connection error:', err);
      setConnectionError('Error establishing peer connection. Please try again.');
    });
    
    socketRef.current.on('call-accepted', (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });
    
    connectionRef.current = peer;
  };
  
  // Function to answer a call
  const answerCall = () => {
    if (!stream) {
      setConnectionError('No video stream available. Please check your camera and microphone.');
      return;
    }
    
    setCallAccepted(true);
    setReceivingCall(false);
    
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream
    });
    
    peer.on('signal', (data) => {
      socketRef.current.emit('answer-call', {
        signal: data,
        interviewId
      });
    });
    
    peer.on('stream', (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });
    
    peer.on('error', (err) => {
      console.error('Peer connection error:', err);
      setConnectionError('Error establishing peer connection. Please try again.');
    });
    
    peer.signal(callerSignal);
    connectionRef.current = peer;
  };
  
  // Function to end the call
  const endCall = () => {
    setCallEnded(true);
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
    socketRef.current.emit('end-call', { interviewId });
    
    setTimeout(() => {
      navigate(-1); // Go back to previous page
    }, 1500);
  };
  
  // Toggle microphone
  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };
  
  // Toggle camera
  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };
  
  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          cursor: true
        });
        
        setScreenShareStream(screenStream);
        
        if (connectionRef.current) {
          // Replace video track with screen share track
          const videoTrack = screenStream.getVideoTracks()[0];
          
          const senders = connectionRef.current._senders;
          if (senders) {
            const sender = senders.find(s => s.track.kind === 'video');
            if (sender) {
              sender.replaceTrack(videoTrack);
            }
          }
        }
        
        // Update local video preview
        if (myVideo.current) {
          myVideo.current.srcObject = screenStream;
        }
        
        setIsScreenSharing(true);
        
        // Listen for when user ends screen sharing
        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenSharing();
        };
      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    } else {
      stopScreenSharing();
    }
  };
  
  // Function to stop screen sharing
  const stopScreenSharing = () => {
    if (screenShareStream) {
      screenShareStream.getTracks().forEach(track => track.stop());
      
      if (connectionRef.current && stream) {
        // Replace screen share track with original video track
        const videoTrack = stream.getVideoTracks()[0];
        
        const senders = connectionRef.current._senders;
        if (senders) {
          const sender = senders.find(s => s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        }
      }
      
      // Restore local video preview
      if (myVideo.current && stream) {
        myVideo.current.srcObject = stream;
      }
      
      setScreenShareStream(null);
      setIsScreenSharing(false);
    }
  };
  
  // Display connection error if any
  if (connectionError) {
    return (
      <div className="error-container">
        <div className="alert alert-danger" role="alert">
          {connectionError}
        </div>
        <div className="d-flex gap-2 mt-3">
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setConnectionError(null);
              // Attempt to reinitialize media devices
              navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then((currentStream) => {
                  setStream(currentStream);
                  if (myVideo.current) {
                    myVideo.current.srcObject = currentStream;
                  }
                })
                .catch(err => {
                  console.error('Error on retry:', err);
                  setConnectionError(`Failed to access camera on retry: ${err.message}`);
                });
            }}
          >
            Retry Camera Access
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="video-chat-container">
      {/* Video Grid with improved styling */}
      <div className="video-grid">
        {/* Your video */}
        <div className={`video-box local-video ${isScreenSharing ? 'screen-sharing' : ''}`}>
          <video 
            playsInline 
            muted 
            ref={myVideo} 
            autoPlay 
            className={isVideoOff ? 'video-off' : ''}
          />
          <div className="name-tag">
            <span>{userName || 'You'}</span> 
            {isMuted && <span className="ms-2">(Muted)</span>}
            {isScreenSharing && <span className="ms-2">(Screen)</span>}
          </div>
        </div>
        
        {/* Other person's video */}
        {callAccepted && !callEnded ? (
          <div className="video-box remote-video">
            <video 
              playsInline 
              ref={userVideo} 
              autoPlay
            />
            <div className="name-tag">{caller}</div>
          </div>
        ) : (
          <div className="video-box remote-video waiting-box">
            <div className="waiting-message">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h3>Waiting for other participant...</h3>
              <p className="text-muted">Click "Start Call" when you're ready to begin the interview</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Modern Controls */}
      <div className="controls">
        <button 
          onClick={toggleMute} 
          className={`control-btn ${isMuted ? 'active' : ''}`}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>
        <button 
          onClick={toggleVideo} 
          className={`control-btn ${isVideoOff ? 'active' : ''}`}
          title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
        >
          {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
        </button>
        <button 
          onClick={toggleScreenShare} 
          className={`control-btn ${isScreenSharing ? 'active' : ''}`}
          title={isScreenSharing ? "Stop Screen Sharing" : "Share Screen"}
        >
          <FaDesktop />
        </button>
        
        {callAccepted && !callEnded ? (
          <button 
            onClick={endCall} 
            className="end-call-btn"
            title="End Call"
          >
            <FaPhoneSlash /> <span className="d-none d-md-inline">End Call</span>
          </button>
        ) : (
          <button 
            onClick={callUser} 
            className="call-btn"
            title="Start Call"
          >
            <FaPhone /> <span className="d-none d-md-inline">Start Call</span>
          </button>
        )}
      </div>
      
      {/* Improved Incoming call notification */}
      {receivingCall && !callAccepted && (
        <div className="incoming-call">
          <h3>{caller} is calling...</h3>
          <div className="d-flex justify-content-center gap-3 mt-4">
            <button onClick={answerCall} className="btn btn-success">Answer</button>
            <button onClick={() => setReceivingCall(false)} className="btn btn-danger">Decline</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoChat; 
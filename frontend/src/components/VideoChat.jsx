import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaDesktop,
  FaMicrophone,
  FaMicrophoneSlash,
  FaPhoneSlash,
  FaVideo,
  FaVideoSlash
} from 'react-icons/fa';
import {
  FiCheckCircle,
  FiFileText,
  FiMaximize,
  FiMaximize2,
  FiMinimize,
  FiMinimize2,
  FiRefreshCcw
} from 'react-icons/fi';
import { BACKEND_URL } from '../services/api';
import videoService from '../services/videoService';
import '../styles/VideoConference.css';

/* ── Constants ── */

const EMPTY_MEDIA_STATE = {
  hasMedia: false,
  audioEnabled: false,
  videoEnabled: false,
  screenSharing: false
};

const MEDIA_CONSTRAINT_OPTIONS = [
  {
    kind: 'camera and microphone',
    constraints: {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      }
    }
  },
  {
    kind: 'microphone only',
    constraints: {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: false
    }
  },
  {
    kind: 'camera only',
    constraints: {
      audio: false,
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      }
    }
  }
];

/* ── Helpers ── */

const buildMediaStateFromStream = (stream, screenSharing = false) => {
  const audioTrack = stream?.getAudioTracks?.()[0] || null;
  const videoTrack = stream?.getVideoTracks?.()[0] || null;

  return {
    hasMedia: Boolean(audioTrack || videoTrack || screenSharing),
    audioEnabled: Boolean(audioTrack?.enabled),
    videoEnabled: Boolean(videoTrack?.enabled) || Boolean(screenSharing),
    screenSharing: Boolean(screenSharing)
  };
};

const describeMediaFailure = (error) => {
  if (!error) {
    return 'Camera or microphone access is unavailable on this device.';
  }

  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    return 'Camera or microphone access was denied. You can still join and receive video, or retry after granting permission.';
  }

  if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    return 'Your camera or microphone is already in use elsewhere. The room will stay connected in receive-only mode until you free the device and retry.';
  }

  if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    return 'No compatible camera or microphone was found.';
  }

  return error.message || 'Camera or microphone access is unavailable on this device.';
};

const getConnectionCopy = (phase, counterpartPresent) => {
  switch (phase) {
    case 'booting':
      return 'Preparing room…';
    case 'joining':
      return 'Joining…';
    case 'waiting':
      return counterpartPresent ? 'Establishing media channel…' : 'Waiting for the other participant…';
    case 'connecting':
      return 'Connecting…';
    case 'connected':
      return 'Live video connected.';
    case 'disconnected':
      return counterpartPresent ? 'Reconnecting…' : 'Other participant left.';
    default:
      return '';
  }
};

const getInitials = (value = '') =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'HM';

const formatRoleLabel = (role) => {
  if (role === 'recruiter') return 'Interviewer';
  if (role === 'candidate') return 'Candidate';
  return 'Participant';
};

/* ── Component ── */

const VideoChat = ({
  interviewId,
  userId,
  userType,
  userName,
  counterpartName,
  meetingCode,
  onMarkComplete,
  canMarkComplete,
  isCompleting,
  isCompleted
}) => {
  const navigate = useNavigate();

  const [connectionPhase, setConnectionPhase] = useState('booting');
  const [fatalError, setFatalError] = useState('');
  const [deviceWarning, setDeviceWarning] = useState('');
  const [remoteParticipant, setRemoteParticipant] = useState(null);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [localMediaState, setLocalMediaState] = useState(EMPTY_MEDIA_STATE);
  const [pipMode, setPipMode] = useState(null); // null | 'local' | 'remote'
  const [isFullscreen, setIsFullscreen] = useState(false);

  const roomRef = useRef(null);
  const localVideoRef = useRef(null);
  const userVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const audioSenderRef = useRef(null);
  const videoSenderRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const offerInFlightRef = useRef(false);
  const offerStartedRef = useRef(false);
  const joinedRoomRef = useRef(false);
  const remoteParticipantRef = useRef(null);
  const iceServersRef = useRef([]);

  const counterpartPresent = Boolean(remoteParticipant);
  const statusCopy = useMemo(
    () => getConnectionCopy(connectionPhase, counterpartPresent),
    [connectionPhase, counterpartPresent]
  );
  const localVisualActive = localMediaState.videoEnabled || localMediaState.screenSharing;
  const remoteVisualActive =
    Boolean(remoteParticipant?.mediaState?.videoEnabled) ||
    Boolean(remoteParticipant?.mediaState?.screenSharing);
  const remoteName = remoteParticipant?.userName || counterpartName || 'Participant';
  const remoteRoleLabel = formatRoleLabel(
    remoteParticipant?.userRole || (userType === 'recruiter' ? 'candidate' : 'recruiter')
  );
  const localRoleLabel = formatRoleLabel(userType);
  const isRecruiter = userType === 'recruiter';

  const togglePip = (tile) => {
    setPipMode((prev) => (prev === tile ? null : tile));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      roomRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    const onKeyDown = (e) => {
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        toggleFullscreen();
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  /* ── Media & WebRTC logic (unchanged) ── */

  const updateLocalPreview = (stream) => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream || null;
    }
  };

  const updateRemotePreview = () => {
    if (!remoteStreamRef.current) {
      remoteStreamRef.current = new MediaStream();
    }
    if (userVideoRef.current) {
      userVideoRef.current.srcObject = remoteStreamRef.current;
    }
  };

  const emitMediaState = () => {
    const socket = socketRef.current;
    if (!socket || !joinedRoomRef.current) return;
    const mediaState = buildMediaStateFromStream(localStreamRef.current, Boolean(screenStreamRef.current));
    socket.emit('video:media-state', { interviewId, mediaState });
  };

  const syncLocalMediaState = () => {
    const nextState = buildMediaStateFromStream(localStreamRef.current, Boolean(screenStreamRef.current));
    setLocalMediaState(nextState);
    emitMediaState();
  };

  const stopStream = (stream) => {
    stream?.getTracks?.().forEach((track) => track.stop());
  };

  const acquireBestEffortStream = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      return { stream: null, warning: 'This browser does not expose camera or microphone APIs.' };
    }

    let lastError = null;
    for (const option of MEDIA_CONSTRAINT_OPTIONS) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(option.constraints);
        return {
          stream,
          warning: option.kind === 'camera and microphone'
            ? ''
            : `Joined with ${option.kind}.`
        };
      } catch (error) {
        lastError = error;
      }
    }

    return { stream: null, warning: describeMediaFailure(lastError) };
  };

  const replaceSenderTrack = async (sender, track) => {
    if (!sender) return;
    try {
      await sender.replaceTrack(track || null);
    } catch (error) {
      console.error('Failed to replace sender track:', error);
    }
  };

  const applyLocalTracksToConnection = async () => {
    await replaceSenderTrack(audioSenderRef.current, localStreamRef.current?.getAudioTracks?.()[0] || null);
    const publishedVideoTrack =
      screenStreamRef.current?.getVideoTracks?.()[0] ||
      localStreamRef.current?.getVideoTracks?.()[0] ||
      null;
    await replaceSenderTrack(videoSenderRef.current, publishedVideoTrack);
  };

  const flushPendingIceCandidates = async () => {
    const peerConnection = peerConnectionRef.current;
    if (!peerConnection?.remoteDescription?.type) return;
    while (pendingIceCandidatesRef.current.length > 0) {
      const candidate = pendingIceCandidatesRef.current.shift();
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Failed to add queued ICE candidate:', error);
      }
    }
  };

  const emitSignal = async (targetUserId, signal) =>
    new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket) {
        reject(new Error('Socket connection is not available'));
        return;
      }
      socket.emit('video:signal', { interviewId, targetUserId, signal }, (response) => {
        if (response?.success) {
          resolve(response);
          return;
        }
        reject(new Error(response?.message || 'Unable to send signaling message'));
      });
    });

  const resetPeerConnection = () => {
    offerInFlightRef.current = false;
    offerStartedRef.current = false;
    pendingIceCandidatesRef.current = [];
    setRemoteConnected(false);

    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    audioSenderRef.current = null;
    videoSenderRef.current = null;
    remoteStreamRef.current = new MediaStream();
    updateRemotePreview();
  };

  const ensurePeerConnection = async () => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    updateRemotePreview();

    const peerConnection = new RTCPeerConnection({
      iceServers: iceServersRef.current.length > 0 ? iceServersRef.current : undefined,
      iceCandidatePoolSize: 4
    });

    const audioTransceiver = peerConnection.addTransceiver('audio', { direction: 'sendrecv' });
    const videoTransceiver = peerConnection.addTransceiver('video', { direction: 'sendrecv' });
    audioSenderRef.current = audioTransceiver.sender;
    videoSenderRef.current = videoTransceiver.sender;

    peerConnection.onicecandidate = ({ candidate }) => {
      if (!candidate || !remoteParticipantRef.current?.userId) return;
      emitSignal(remoteParticipantRef.current.userId, { candidate }).catch((error) => {
        console.error('Failed to send ICE candidate:', error);
      });
    };

    peerConnection.ontrack = ({ streams, track }) => {
      const [incomingStream] = streams;
      if (incomingStream) {
        remoteStreamRef.current = incomingStream;
      } else {
        updateRemotePreview();
        const alreadyTracked = remoteStreamRef.current.getTracks().some((item) => item.id === track.id);
        if (!alreadyTracked) remoteStreamRef.current.addTrack(track);
      }
      updateRemotePreview();
    };

    peerConnection.onconnectionstatechange = () => {
      const { connectionState } = peerConnection;
      if (connectionState === 'connected') {
        setRemoteConnected(true);
        setConnectionPhase('connected');
        return;
      }
      if (['connecting', 'new'].includes(connectionState)) {
        setConnectionPhase(counterpartPresent ? 'connecting' : 'waiting');
        return;
      }
      if (['disconnected', 'failed'].includes(connectionState)) {
        setRemoteConnected(false);
        setConnectionPhase(counterpartPresent ? 'disconnected' : 'waiting');
        return;
      }
      if (connectionState === 'closed') setRemoteConnected(false);
    };

    peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection.iceConnectionState === 'failed') setConnectionPhase('disconnected');
    };

    peerConnectionRef.current = peerConnection;
    await applyLocalTracksToConnection();
    return peerConnection;
  };

  const startOffer = async () => {
    if (
      userType !== 'recruiter' ||
      !remoteParticipantRef.current?.userId ||
      offerInFlightRef.current ||
      offerStartedRef.current
    ) return;

    offerInFlightRef.current = true;
    offerStartedRef.current = true;

    try {
      const peerConnection = await ensurePeerConnection();
      if (
        peerConnection.signalingState !== 'stable' ||
        peerConnection.localDescription?.type ||
        peerConnection.remoteDescription?.type ||
        ['connecting', 'connected'].includes(peerConnection.connectionState)
      ) {
        offerInFlightRef.current = false;
        return;
      }

      setConnectionPhase('connecting');
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      await emitSignal(remoteParticipantRef.current.userId, {
        description: peerConnection.localDescription
      });
    } catch (error) {
      console.error('Failed to create offer:', error);
      offerStartedRef.current = false;
      setFatalError(error.message || 'Unable to start the call');
    } finally {
      offerInFlightRef.current = false;
    }
  };

  const handleSignal = async ({ fromUserId, fromUserName, fromUserRole, signal }) => {
    if (!signal) return;

    remoteParticipantRef.current = { userId: fromUserId, userName: fromUserName, userRole: fromUserRole };
    setRemoteParticipant((current) =>
      current?.userId === fromUserId
        ? current
        : {
            userId: fromUserId,
            userName: fromUserName,
            userRole: fromUserRole,
            mediaState: current?.mediaState || EMPTY_MEDIA_STATE
          }
    );

    const peerConnection = await ensurePeerConnection();

    if (signal.description) {
      const description = new RTCSessionDescription(signal.description);

      if (description.type === 'offer') {
        if (!['stable', 'have-remote-offer'].includes(peerConnection.signalingState)) resetPeerConnection();
        const answeringConnection = peerConnectionRef.current || (await ensurePeerConnection());
        await answeringConnection.setRemoteDescription(description);
        await flushPendingIceCandidates();
        const answer = await answeringConnection.createAnswer();
        await answeringConnection.setLocalDescription(answer);
        await emitSignal(fromUserId, { description: answeringConnection.localDescription });
        setConnectionPhase('connecting');
        return;
      }

      if (description.type === 'answer') {
        await peerConnection.setRemoteDescription(description);
        await flushPendingIceCandidates();
        return;
      }
    }

    if (signal.candidate) {
      const candidate = new RTCIceCandidate(signal.candidate);
      if (peerConnection.remoteDescription?.type) {
        await peerConnection.addIceCandidate(candidate);
      } else {
        pendingIceCandidatesRef.current.push(candidate);
      }
    }
  };

  const joinRoom = async (socket) =>
    new Promise((resolve, reject) => {
      socket.emit('video:join-room', { interviewId, userName }, (response) => {
        if (response?.success) { resolve(response); return; }
        reject(new Error(response?.message || 'Unable to join the interview room'));
      });
    });

  const hydrateRoomState = (participants = []) => {
    const nextRemoteParticipant =
      participants.find((participant) =>
        userId ? participant.userId !== userId : participant.userRole !== userType
      ) || null;

    remoteParticipantRef.current = nextRemoteParticipant;
    setRemoteParticipant(nextRemoteParticipant);

    if (!nextRemoteParticipant) {
      setRemoteConnected(false);
      setConnectionPhase('waiting');
      resetPeerConnection();
      return;
    }

    if (!remoteConnected) setConnectionPhase('waiting');
    if (userType === 'recruiter') {
      startOffer().catch((error) => {
        console.error('Failed to start offer after room sync:', error);
      });
    }
  };

  const retryLocalMedia = async () => {
    setFatalError('');
    const { stream, warning } = await acquireBestEffortStream();
    stopStream(localStreamRef.current);
    localStreamRef.current = stream;
    updateLocalPreview(stream);
    setDeviceWarning(warning);
    await applyLocalTracksToConnection();
    syncLocalMediaState();
  };

  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks?.()[0];
    if (!audioTrack) {
      setDeviceWarning('No microphone active. Retry device access to publish audio.');
      return;
    }
    audioTrack.enabled = !audioTrack.enabled;
    syncLocalMediaState();
  };

  const toggleVideo = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks?.()[0];
    if (!videoTrack) {
      setDeviceWarning('No camera active. Retry device access to publish video.');
      return;
    }
    videoTrack.enabled = !videoTrack.enabled;
    syncLocalMediaState();
  };

  const stopScreenShare = async () => {
    stopStream(screenStreamRef.current);
    screenStreamRef.current = null;
    updateLocalPreview(localStreamRef.current);
    await applyLocalTracksToConnection();
    syncLocalMediaState();
  };

  const toggleScreenShare = async () => {
    if (screenStreamRef.current) { await stopScreenShare(); return; }
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setDeviceWarning('Screen sharing is not available in this browser.');
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = screenStream;
      updateLocalPreview(screenStream);
      await applyLocalTracksToConnection();
      syncLocalMediaState();

      const [screenTrack] = screenStream.getVideoTracks();
      if (screenTrack) {
        screenTrack.onended = () => {
          stopScreenShare().catch((error) => {
            console.error('Failed to stop screen share cleanly:', error);
          });
        };
      }
    } catch (error) {
      console.error('Unable to start screen sharing:', error);
      setDeviceWarning(error.message || 'Unable to start screen sharing.');
    }
  };

  const leaveRoom = () => {
    socketRef.current?.emit('video:leave-room', { interviewId });
    navigate(-1);
  };

  useEffect(() => {
    updateLocalPreview(localStreamRef.current);
    updateRemotePreview();
  }, [remoteConnected, localMediaState.hasMedia, localMediaState.videoEnabled, localMediaState.screenSharing]);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    let isCancelled = false;

    const bootstrap = async () => {
      try {
        if (!window.RTCPeerConnection) throw new Error('This browser does not support WebRTC video calls.');

        setConnectionPhase('booting');

        const meetingResponse = await videoService.getMeetingDetails(interviewId);
        if (!meetingResponse?.success) throw new Error(meetingResponse?.message || 'Unable to load meeting details');

        iceServersRef.current = meetingResponse.data?.iceServers || [];

        const { stream, warning } = await acquireBestEffortStream();
        if (isCancelled) { stopStream(stream); return; }

        localStreamRef.current = stream;
        updateLocalPreview(stream);
        setDeviceWarning(warning);
        syncLocalMediaState();

        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token missing. Please sign in again.');

        setConnectionPhase('joining');

        const socket = io(BACKEND_URL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 8,
          reconnectionDelay: 1200
        });

        socketRef.current = socket;

        socket.on('connect', async () => {
          try {
            const response = await joinRoom(socket);
            if (isCancelled) return;
            joinedRoomRef.current = true;
            hydrateRoomState(response.participants || []);
            emitMediaState();
          } catch (error) {
            console.error('Failed to join room:', error);
            setFatalError(error.message || 'Unable to join interview room');
          }
        });

        socket.on('video:room-state', ({ participants = [] }) => {
          if (isCancelled) return;
          hydrateRoomState(participants);
        });

        socket.on('video:signal', (payload) => {
          handleSignal(payload).catch((error) => {
            console.error('Failed to process signaling payload:', error);
            setConnectionPhase('disconnected');
          });
        });

        socket.on('video:participant-left', ({ userId: departedUserId }) => {
          if (remoteParticipantRef.current?.userId === departedUserId) {
            setRemoteParticipant(null);
            remoteParticipantRef.current = null;
            setConnectionPhase('waiting');
            resetPeerConnection();
          }
        });

        socket.on('video:session-replaced', ({ message }) => {
          setFatalError(message || 'This room session was replaced by another browser window.');
        });

        socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setFatalError(error.message || 'Unable to connect to the video signaling service.');
        });

        socket.on('disconnect', () => {
          joinedRoomRef.current = false;
          setConnectionPhase('disconnected');
          setRemoteConnected(false);
        });
      } catch (error) {
        console.error('Video room bootstrap failed:', error);
        if (!isCancelled) setFatalError(error.message || 'Unable to prepare the video room.');
      }
    };

    bootstrap();

    return () => {
      isCancelled = true;
      joinedRoomRef.current = false;
      socketRef.current?.emit('video:leave-room', { interviewId });
      socketRef.current?.disconnect();
      socketRef.current = null;
      resetPeerConnection();
      stopStream(screenStreamRef.current);
      stopStream(localStreamRef.current);
      screenStreamRef.current = null;
      localStreamRef.current = null;
    };
  }, [interviewId, userId, userName, userType]);
  /* eslint-enable react-hooks/exhaustive-deps */

  /* ── Render ── */

  if (fatalError) {
    return (
      <div className="vc-fatal">
        <span className="signal-chip alert">Room issue</span>
        <p>{fatalError}</p>
        <div className="vc-fatal-actions">
          <button type="button" className="action-link primary" onClick={retryLocalMedia}>Retry devices</button>
          <button type="button" className="action-link secondary" onClick={() => navigate(-1)}>Go back</button>
        </div>
      </div>
    );
  }

  const remoteTileClass = `vc-tile${pipMode === 'remote' ? ' vc-tile-pip' : ''}${pipMode === 'local' ? ' vc-tile-main' : ''}`;
  const localTileClass = `vc-tile${pipMode === 'local' ? ' vc-tile-pip' : ''}${pipMode === 'remote' ? ' vc-tile-main' : ''}`;

  return (
    <div className="vc-room" ref={roomRef}>
      {/* Recruiter top bar – Complete & Feedback */}
      {isRecruiter && (
        <div className="vc-top-bar">
          <button
            type="button"
            className="vc-top-complete"
            onClick={onMarkComplete}
            disabled={!canMarkComplete || isCompleting}
            title="Mark interview as complete"
          >
            <FiCheckCircle />
            {isCompleted ? 'Done' : isCompleting ? 'Saving…' : 'Complete'}
          </button>
          <Link
            to={`/dashboard/recruiter/interviews/${interviewId}/feedback`}
            className="vc-top-feedback"
            title="Provide interview feedback"
          >
            <FiFileText />
            Feedback
          </Link>
        </div>
      )}

      {deviceWarning && (
        <div className="vc-warning">
          <p>{deviceWarning}</p>
          <button type="button" className="vc-warning-btn" onClick={retryLocalMedia}>Retry</button>
        </div>
      )}

      <div className={`vc-tiles${pipMode ? ' pip' : ''}`}>
        {/* Remote participant */}
        <article
          className={remoteTileClass}
          onClick={pipMode === 'remote' ? () => setPipMode(null) : undefined}
        >
          <video
            playsInline
            ref={userVideoRef}
            autoPlay
            className={!remoteConnected || !remoteVisualActive ? 'video-off' : ''}
          />
          {(!remoteConnected || !remoteVisualActive) && (
            <div className="vc-placeholder">
              {!remoteConnected && <div className="vc-pulse" />}
              <div className="vc-avatar">{getInitials(remoteName)}</div>
              <strong>{remoteName}</strong>
              <p>
                {remoteConnected
                  ? 'Camera is off'
                  : counterpartPresent
                    ? 'Connecting…'
                    : 'Waiting to join'}
              </p>
            </div>
          )}
          <div className="vc-tile-pills">
            {!remoteParticipant?.mediaState?.audioEnabled && remoteConnected && (
              <span className="vc-pill alert">Muted</span>
            )}
            {remoteParticipant?.mediaState?.screenSharing && (
              <span className="vc-pill info">Sharing</span>
            )}
          </div>
          <div className="vc-tile-label">
            <span className={`vc-dot ${remoteConnected ? 'live' : counterpartPresent ? 'connecting' : 'waiting'}`} />
            <strong>{remoteName}</strong>
            <span className="vc-role">{remoteRoleLabel}</span>
          </div>
          <button
            type="button"
            className="vc-pip-btn"
            onClick={(e) => { e.stopPropagation(); togglePip('remote'); }}
            title={pipMode === 'remote' ? 'Expand' : 'Minimize'}
          >
            {pipMode === 'remote' ? <FiMaximize2 /> : <FiMinimize2 />}
          </button>
        </article>

        {/* Local participant */}
        <article
          className={localTileClass}
          onClick={pipMode === 'local' ? () => setPipMode(null) : undefined}
        >
          <video
            playsInline
            muted
            ref={localVideoRef}
            autoPlay
            className={!localVisualActive ? 'video-off' : ''}
          />
          {!localVisualActive && (
            <div className="vc-placeholder">
              <div className="vc-avatar">{getInitials(userName)}</div>
              <strong>{userName || 'You'}</strong>
              <p>{localMediaState.hasMedia ? 'Camera off' : 'No media'}</p>
            </div>
          )}
          <div className="vc-tile-pills">
            {!localMediaState.audioEnabled && <span className="vc-pill alert">Muted</span>}
            {localMediaState.screenSharing && <span className="vc-pill info">Sharing</span>}
          </div>
          <div className="vc-tile-label">
            <span className="vc-dot you" />
            <strong>You</strong>
            <span className="vc-role">{localRoleLabel}</span>
          </div>
          <button
            type="button"
            className="vc-pip-btn"
            onClick={(e) => { e.stopPropagation(); togglePip('local'); }}
            title={pipMode === 'local' ? 'Expand' : 'Minimize'}
          >
            {pipMode === 'local' ? <FiMaximize2 /> : <FiMinimize2 />}
          </button>
        </article>
      </div>

      {/* Floating control dock */}
      <div className="vc-dock">
        <button
          type="button"
          onClick={toggleMute}
          className={`vc-ctrl ${!localMediaState.audioEnabled ? 'off' : ''}`}
          title={localMediaState.audioEnabled ? 'Mute' : 'Unmute'}
        >
          <span className="vc-ctrl-icon">
            {localMediaState.audioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
          </span>
          <span className="vc-ctrl-text">{localMediaState.audioEnabled ? 'Mute' : 'Unmute'}</span>
        </button>
        <button
          type="button"
          onClick={toggleVideo}
          className={`vc-ctrl ${!localMediaState.videoEnabled ? 'off' : ''}`}
          title={localMediaState.videoEnabled ? 'Camera off' : 'Camera on'}
        >
          <span className="vc-ctrl-icon">
            {localMediaState.videoEnabled ? <FaVideo /> : <FaVideoSlash />}
          </span>
          <span className="vc-ctrl-text">{localMediaState.videoEnabled ? 'Camera' : 'Start'}</span>
        </button>
        <button
          type="button"
          onClick={toggleScreenShare}
          className={`vc-ctrl ${localMediaState.screenSharing ? 'on' : ''}`}
          title={localMediaState.screenSharing ? 'Stop sharing' : 'Share screen'}
        >
          <span className="vc-ctrl-icon"><FaDesktop /></span>
          <span className="vc-ctrl-text">{localMediaState.screenSharing ? 'Stop' : 'Present'}</span>
        </button>
        <button
          type="button"
          onClick={retryLocalMedia}
          className="vc-ctrl vc-ctrl-secondary"
          title="Retry devices"
        >
          <span className="vc-ctrl-icon"><FiRefreshCcw /></span>
          <span className="vc-ctrl-text">Retry</span>
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="vc-ctrl vc-ctrl-secondary"
          title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
        >
          <span className="vc-ctrl-icon">{isFullscreen ? <FiMinimize /> : <FiMaximize />}</span>
          <span className="vc-ctrl-text">{isFullscreen ? 'Exit' : 'Full'}</span>
        </button>

        <span className="vc-dock-sep" />
        <button type="button" onClick={leaveRoom} className="vc-leave" title="Leave room">
          <FaPhoneSlash />
          <span>Leave</span>
        </button>
      </div>

      <p className="vc-status-line">{statusCopy}</p>
    </div>
  );
};

export default VideoChat;

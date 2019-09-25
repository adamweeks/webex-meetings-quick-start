const Webex = require('webex');

// Change to your access token from developer.webex.com
const myAccessToken = 'YOUR_ACCESS_TOKEN';

if (myAccessToken === 'YOUR_ACCESS_TOKEN') {
  alert('Make sure to update your access token in the index.js file!');
  throw new Error('Make sure to update your access token in the index.js file!');
}

const leftVideo = document.getElementById('leftVideo');
let stream;

// Video tag capture must be set up after video tracks are enumerated.
leftVideo.oncanplay = maybeCreateStream;
if (leftVideo.readyState >= 3) { // HAVE_FUTURE_DATA
  // Video is already ready to play, call maybeCreateStream in case oncanplay
  // fired before we registered the event handler.
  maybeCreateStream();
}

leftVideo.play();

const remoteStatus = {
  audio: false,
  video: false,
  joined: false
};

const webex = Webex.init({
  credentials: {
    access_token: myAccessToken
  }
});

webex.config.logger.level = 'debug';

webex.meetings.register()
  .catch((err) => {
    console.error(err);
    alert(err);
    throw err;
  });

function bindMeetingEvents(meeting) {
  meeting.on('error', (err) => {
    console.error(err);
  });

  // Handle media streams changes to ready state
  meeting.on('media:ready', (media) => {
    if (!media) {
      return;
    }
    if (media.type === 'local') {
      document.getElementById('self-view').srcObject = media.stream;
    }
    if (media.type === 'remoteVideo') {
      remoteStatus.video = true;
      document.getElementById('remote-view-video').srcObject = media.stream;
    }
    if (media.type === 'remoteAudio') {
      remoteStatus.audio = true;
      document.getElementById('remote-view-audio').srcObject = media.stream;
    }
    if (remoteStatus.video && remoteStatus.audio) {
      // alert('remote connected with media');
    }
  });

  // Handle media streams stopping
  meeting.on('media:stopped', (media) => {
    // Remove media streams
    if (media.type === 'local') {
      document.getElementById('self-view').srcObject = null;
    }
    if (media.type === 'remoteVideo') {
      document.getElementById('remote-view-video').srcObject = null;
    }
    if (media.type === 'remoteAudio') {
      document.getElementById('remote-view-audio').srcObject = null;
    }
  });

  // Of course, we'd also like to be able to leave the meeting:
  document.getElementById('hangup').addEventListener('click', () => {
    meeting.leave();
  });
}

// Join the meeting and add media
function joinMeeting(meeting) {
  
  return meeting.join().then(() => {
    const mediaSettings = {
      receiveVideo: true,
      receiveAudio: true,
      receiveShare: false,
      sendVideo: true,
      sendAudio: true,
      sendShare: false
    };

    

    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();
    if (videoTracks.length > 0) {
      console.log(`Using video device: ${videoTracks[0].label}`);
    }
    if (audioTracks.length > 0) {
      console.log(`Using audio device: ${audioTracks[0].label}`);
    }

    // Get our local media stream and add it to the meeting
    return meeting.getMediaStreams(mediaSettings).then((mediaStreams) => {
      const [localStream, localShare] = mediaStreams;
      meeting.addMedia({
        localShare,
        localStream: stream,
        mediaSettings
      });
    });
  });
}

document.getElementById('destination').addEventListener('submit', (event) => {
  // again, we don't want to reload when we try to join
  event.preventDefault();

  // const destination = document.getElementById('invitee').value;
  const destination = 'patient2@amwelldemo.rooms.webex.com';

  return webex.meetings.create(destination).then((meeting) => {
    // Call our helper function for binding events to meetings
    bindMeetingEvents(meeting);

    return joinMeeting(meeting);
  })
  .catch((error) => {
    // Report the error
    console.error(error);
  });
});

function maybeCreateStream() {
  if (stream) {
    return;
  }
  if (leftVideo.captureStream) {
    stream = leftVideo.captureStream();
    console.log('Captured stream from leftVideo with captureStream',
      stream);
    
  } else if (leftVideo.mozCaptureStream) {
    stream = leftVideo.mozCaptureStream();
    console.log('Captured stream from leftVideo with mozCaptureStream()',
      stream);
    
  } else {
    console.log('captureStream() not supported');
  }
}
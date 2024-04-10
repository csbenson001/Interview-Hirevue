let mediaRecorder;
let recordedChunks = [];
let recording = false; // boolean state recording or not

// random number
let randomNumber = Math.floor(Math.random() * 1000);

// counter, local storage
let counter = localStorage.getItem('counter');
if (counter === null) {
    counter = 0;
    localStorage.setItem('counter', counter);
}

const liveFeed = document.getElementById('liveFeed');
const startRecordingButton = document.getElementById('startRecording');
const previewVideo = document.getElementById('preview');
const timerDisplay = document.getElementById('timer');

const question = document.getElementById('question');

const submit = document.getElementById('submit');

// id parameter
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
const set_number = urlParams.get('set_number');

console.log(id);
console.log(set_number);

// ----------------------------------------------------------------------------------

// Questions
const set1 = ["What is your name?", "What is your age", "What is your height?", "What is your weight?", "What is your favorite color?"];
const set2 = ["What is your favorite food?", "What is your favorite movie?", "What is your favorite song?", "What is your favorite book?", "What is your favorite sport?"];
const set3 = ["What is your favorite animal?", "What is your favorite place?", "What is your favorite hobby?", "What is your favorite subject?", "What is your favorite season?"];
const set4 = ["What is your favorite holiday?", "What is your favorite memory?", "What is your favorite quote?", "What is your favorite joke?", "What is your favorite game?"];
const set5 = ["What is your favorite TV show?", "What is your favorite restaurant?", "What is your favorite drink?", "What is your favorite snack?", "What is your favorite dessert?"];

const questions = [set1, set2, set3, set4, set5];

// update question
question.textContent = questions[set_number][counter];

// ----------------------------------------------------------------------------------

let timerInterval;
let secondsElapsed = 0;

// Function to start capturing video and audio
function startRecording() {
  // Clear previous timer
  clearInterval(timerInterval);
  secondsElapsed = 0;
  updateTimerDisplay();

  //previewVideo.src = '#';
  // Clear previous recording chunks
    recordedChunks = [];

  timerInterval = setInterval(() => {
    secondsElapsed++;
    updateTimerDisplay();
  }, 1000);

  // Get video stream for live feed (without audio)
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(videoStream => {
      liveFeed.srcObject = videoStream;

      // Get combined stream for recording (audio and video)
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(recordingStream => {

            // state recording
            recording = true;

            // color change to red
            startRecordingButton.style.backgroundColor = 'red';

          mediaRecorder = new MediaRecorder(recordingStream);

          mediaRecorder.ondataavailable = function(event) {
            if (event.data.size > 0) {
              recordedChunks.push(event.data);
            }
          };

          mediaRecorder.onstop = function() {
            // clear the previous recording preview
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            previewVideo.src = URL.createObjectURL(blob);
            clearInterval(timerInterval);
            updateTimerDisplay();

            // Release recording stream resources after stopping
            recordingStream.getTracks().forEach(track => track.stop());

          };

          mediaRecorder.start();
          startRecordingButton.textContent = 'Stop Recording';
          startRecordingButton.removeEventListener('click', startRecording);

          // time limit for recording is 2 minutes
            setTimeout(() => {
                stopRecording();
            }, 120000);

          startRecordingButton.addEventListener('click', stopRecording);
        })
        .catch(error => {
          console.error('Error accessing recording stream:', error);
        });
    })
    .catch(error => {
      console.error('Error accessing video stream:', error);
    });
}

// Function to stop recording
function stopRecording() {
  mediaRecorder.stop();
  startRecordingButton.textContent = 'Start Recording';
  startRecordingButton.removeEventListener('click', stopRecording);
  startRecordingButton.addEventListener('click', startRecording);

  // color change back to blue
  startRecordingButton.style.backgroundColor = '#007bff';

  // state recording
  recording = false;
}

// Function to update timer display
function updateTimerDisplay() {
  const minutes = Math.floor(secondsElapsed / 60);
  const seconds = secondsElapsed % 60;
  timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Function to submit recording
// Function to submit recording
function submitRecording() {
  // Disable submit button and change its text to "Wait"
  submit.disabled = true;
  submit.textContent = 'Uploading...';

  //color change of submit button to green
  submit.style.backgroundColor = 'green';

  //block the start recording button
  startRecordingButton.disabled = true;

  // state recording not allowed to submit
  if (recording) {
      alert('Please stop recording before submitting');
      // Re-enable submit button and restore its text
      submit.disabled = false;
      submit.textContent = 'Submit';

      // color change of submit button to blue
      submit.style.backgroundColor = '#007bff';

      // Re-enable start recording button
      startRecordingButton.disabled = false;

      return;
  }

  // video available for submission, not empty
  if (recordedChunks.length === 0) {
      alert('Record your answer before submitting');
      // Re-enable submit button and restore its text
      submit.disabled = false;
      submit.textContent = 'Submit';

      // color change of submit button to blue
      submit.style.backgroundColor = '#007bff';

      // Re-enable start recording button
      startRecordingButton.disabled = false;
      return;
  }

  // Combine all recorded chunks into a single blob
  const blob = new Blob(recordedChunks, { type: 'video/webm' });

  // convert blob to file
  const file = new File([blob], 'recording.webm', { type: 'video/webm' });

  // Create a FormData object to send the video blob
  const formData = new FormData();

  folder_name = id + " (" + set_number + ")"; // folder name is id + set number
  file_name = set_number + "_" + counter + "_" + randomNumber + ".webm";

  console.log(folder_name);
  console.log(file_name);

  // API format video, folder_name, file_name
  formData.append('file', file);
  formData.append('folder_name', folder_name);
  formData.append('file_name', file_name);

  // API endpoint
  const url = 'https://interview-hirevue-ae9c2f5fd450.herokuapp.com/upload';

  // Send the video blob to the server
  fetch(url, {
      method: 'POST',
      body: formData
  })
  .then(response => response.json())
  .then(data => {
      console.log(data);

      if (data.message == "success") {
          alert('Recording submitted successfully');
          
          // increment the counter
          counter++;
          console.log(counter);
          localStorage.setItem('counter', counter);

          // if counter is 5, redirect to the next page
          if (counter === 5) {
              localStorage.removeItem('counter');
              localStorage.removeItem('set_number');
              window.location.href = `thankyou.html?id=${id}`;
          }

          // update the question
          updateQuestion();

          // clear the preview video
          previewVideo.src = '#';
          recordedChunks = [];

          // clear the timer
          clearInterval(timerInterval);
          secondsElapsed = 0;

          // update timer display
          updateTimerDisplay();
      }

      else {
          alert('Error submitting recording, please try again!');
      }
  })
  // Error handling
  .catch(error => {
      console.error('Error:', error);
      alert('Error submitting recording');
  })
  .finally(() => {
      // Re-enable submit button and restore its text
      submit.disabled = false;
      submit.textContent = 'Submit';

      // color change of submit button to blue
      submit.style.backgroundColor = '#007bff';

      // Re-enable start recording button
      startRecordingButton.disabled = false;
  });
}

// function to update question
function updateQuestion() {
    // update question in the html
    question.textContent = questions[set_number][counter];
}

// Get live camera feed (without audio initially)
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    liveFeed.srcObject = stream;
  })
  .catch(error => {
    console.error('Error accessing camera:', error);
  });

startRecordingButton.addEventListener('click', startRecording);
submit.addEventListener('click', submitRecording);
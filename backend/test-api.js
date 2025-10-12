// Simple API test for coding question generation
const testCodingQuestionAPI = async () => {
    try {
        console.log('Testing coding question API...');

        const response = await fetch('http://localhost:3000/api/coding/question?domain=frontend&difficulty=intermediate&language=javascript', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ API call successful!');
            console.log('Response data:', JSON.stringify(data, null, 2));
        } else {
            const errorText = await response.text();
            console.log('❌ API call failed:');
            console.log('Error:', errorText);
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
};

testCodingQuestionAPI();
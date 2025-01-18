const dotenv = require('dotenv')
dotenv.config();
const express = require('express');
const axios = require('axios');
const Sentiment = require('sentiment');
const app = express();
const PORT = 5000;



// Import cors
const cors = require('cors');
// const { count } = require('console');

// Use cors middleware
app.use(cors());


app.use(express.json());

app.post('/analyze', async (req, res) => {
  const { url } = req.body;
  const videoId = new URL(url).searchParams.get('v');
  const API_KEY = process.env.API_KEY;
  const sentiment = new Sentiment();

  try {
    let comments = [];
    let nextPageToken = '';
    do {
      const response = await axios.get(`https://www.googleapis.com/youtube/v3/commentThreads`, {
        params: {
          part: 'snippet',
          videoId,
          key: API_KEY,
          maxResults: 100,
          pageToken: nextPageToken,
        },
      });

      

      const items = response.data.items.map((item) => ({
        text: item.snippet.topLevelComment.snippet.textDisplay,
        date: item.snippet.topLevelComment.snippet.publishedAt,
      }));
      comments = comments.concat(items);
      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    // Sentiment Analysis
    const agreeCount = comments.filter((comment) => sentiment.analyze(comment.text).score > 0).length;
    const disagreeCount = comments.filter((comment) => sentiment.analyze(comment.text).score < 0).length;
    
    
    

    // Monthly Distribution
    const monthlyData = comments.reduce((acc, comment) => {
      const month = new Date(comment.date).toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const formattedData = Object.entries(monthlyData).map(([month, count]) => ({ month, count }));
    let totalComment=0;
    formattedData.map((month_data)=>{
        totalComment=totalComment+month_data.count;
    })

    
    
    res.json({ agreeCount, disagreeCount,totalComment, monthlyData: formattedData });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).send('Error analyzing comments');
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

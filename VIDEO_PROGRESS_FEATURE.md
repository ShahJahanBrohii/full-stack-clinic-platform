# Video Progress Tracking Feature

## Overview
Comprehensive video progress tracking system for the clinic application that allows users to track their exercise video viewing progress with precise duration and completion metrics.

---

## Architecture

### 1. **Backend Components**

#### VideoProgress Model (`backend/models/VideoProgress.js`)
```javascript
{
  userId: ObjectId (required, indexed)
  videoId: ObjectId (required, indexed)
  watchedDuration: Number (seconds, default: 0)
  watchedPercentage: Number (0-100, default: 0)
  completed: Boolean (default: false)
  completedAt: Date (auto-set when completed = true)
  createdAt: Date (auto-timestamp)
  updatedAt: Date (auto-timestamp)
}
```

**Features:**
- Composite index on `userId` and `videoId` for efficient queries
- Auto-deletion when associated videos are deleted (cascade)
- Automatic calculation of watched percentage from duration
- Timestamps for analytics and audit trails

#### Video Progress Routes (`backend/routes/videoProgressRoutes.js`)
Restful endpoints for progress management:

- **GET** `/api/video-progress` - Get all progress records for authenticated user
- **GET** `/api/video-progress/:videoId` - Get progress for specific video
- **POST** `/api/video-progress` - Create or update progress
  - Body: `{ videoId, watchedDuration, watchedPercentage, completed }`
- **PATCH** `/api/video-progress/:videoId` - Mark video as completed
- **DELETE** `/api/video-progress/:videoId` - Delete progress record

**Features:**
- All endpoints require authentication
- Automatic user context from JWT token
- Input validation and error handling
- Prevents duplicate progress records

---

### 2. **Frontend Components**

#### API Service (`frontend/src/services/api.js`)
New export: `videoProgressAPI` with methods:

```javascript
videoProgressAPI.getAll()                    // Get user's all progress
videoProgressAPI.getByVideoId(videoId)      // Get progress for one video
videoProgressAPI.updateProgress(data)       // Update/create progress
videoProgressAPI.markCompleted(videoId)     // Mark video as done
videoProgressAPI.deleteProgress(videoId)    // Remove progress record
```

---

## Setup Instructions

### Backend Setup
1. **Ensure dependencies are installed:**
   ```bash
   cd backend
   npm install
   ```

2. **Environment variables needed in `.env`:**
   ```
   MONGO_URI=mongodb://...
   JWT_SECRET=your_secret_key
   ```

3. **Video Progress routes automatically mounted** in `server.js` at `/api/video-progress`

### Frontend Setup
1. **Verify API base URL in `.env`:**
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

2. **Import in your components:**
   ```javascript
   import { videoProgressAPI } from '@/services/api';
   ```

---

## Usage Examples

### Basic: Track Video Progress
```javascript
import { videoProgressAPI } from '@/services/api';

// Update progress when user watches 2 minutes of a 10 minute video
try {
  await videoProgressAPI.updateProgress({
    videoId: '65a1b2c3d4e5f6g7h8i9j0k1',
    watchedDuration: 120, // seconds
    watchedPercentage: 20
  });
  console.log('Progress updated');
} catch (error) {
  console.error('Failed to update progress:', error);
}
```

### Advanced: Mark as Completed
```javascript
try {
  await videoProgressAPI.markCompleted(videoId);
  console.log('Video marked as completed');
} catch (error) {
  console.error('Failed to mark complete:', error);
}
```

### Fetch User's Progress
```javascript
try {
  const progressList = await videoProgressAPI.getAll();
  const completedCount = progressList.data.filter(p => p.completed).length;
  console.log(`Completed ${completedCount} videos`);
} catch (error) {
  console.error('Failed to fetch progress:', error);
}
```

---

## Hook for VideoLibrary Component

### Suggested Implementation (`src/hooks/useVideoProgress.js`)
```javascript
import { useEffect, useState } from 'react';
import { videoProgressAPI } from '@/services/api';

export const useVideoProgress = (videoId) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const response = await videoProgressAPI.getByVideoId(videoId);
        setProgress(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (videoId) fetchProgress();
  }, [videoId]);

  const updateProgress = async (data) => {
    try {
      const response = await videoProgressAPI.updateProgress({
        videoId,
        ...data,
      });
      setProgress(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const markCompleted = async () => {
    try {
      const response = await videoProgressAPI.markCompleted(videoId);
      setProgress(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { progress, loading, error, updateProgress, markCompleted };
};
```

---

## Integration Points

### 1. VideoLibrary Component
```javascript
import { useVideoProgress } from '@/hooks/useVideoProgress';

export default function VideoLibrary() {
  const [video, setVideo] = useState(null);
  const { progress, updateProgress } = useVideoProgress(video?._id);

  const handleVideoPlay = (time) => {
    updateProgress({
      watchedDuration: Math.floor(time),
      watchedPercentage: Math.round((time / video.duration) * 100)
    });
  };

  return (
    <div>
      <VideoPlayer onTimeUpdate={handleVideoPlay} />
      {progress && <ProgressBar percent={progress.watchedPercentage} />}
    </div>
  );
}
```

### 2. Dashboard Component
```javascript
import { useEffect, useState } from 'react';
import { videoProgressAPI } from '@/services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      const all = await videoProgressAPI.getAll();
      const completed = all.data.filter(p => p.completed).length;
      const avgProgress = (
        all.data.reduce((sum, p) => sum + p.watchedPercentage, 0) / 
        all.data.length
      ).toFixed(0);
      
      setStats({ completed, avgProgress, total: all.data.length });
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h3>Video Progress</h3>
      <p>{stats?.completed} / {stats?.total} videos completed</p>
      <p>Average progress: {stats?.avgProgress}%</p>
    </div>
  );
}
```

---

## Database Indexes

The VideoProgress model automatically creates:
1. **Compound Index:** `{ userId: 1, videoId: 1 }` - Ensures unique progress per user/video
2. **userId Index:** For efficient user progress queries
3. **videoId Index:** For cascade deletion support

---

## Error Handling

Common errors and their meanings:

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| 401 | Unauthorized | Not authenticated | Login first |
| 404 | Not Found | Video doesn't exist | Verify videoId |
| 409 | Conflict | Duplicate progress | Update instead of create |
| 500 | Server Error | Database issue | Check server logs |

---

## Testing Endpoints

### Using cURL:
```bash
# Get all progress for current user
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/video-progress

# Create progress
curl -X POST http://localhost:5000/api/video-progress \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "watchedDuration": 120,
    "watchedPercentage": 20
  }'

# Mark as completed
curl -X PATCH http://localhost:5000/api/video-progress/65a1b2c3d4e5f6g7h8i9j0k1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

### Using Postman:
1. Set Authorization header: `Bearer YOUR_TOKEN`
2. Base URL: `http://localhost:5000/api/video-progress`
3. Test each endpoint with sample payloads

---

## Future Enhancements

1. **Advanced Analytics**
   - Watched time trends
   - Category completion rates
   - User engagement metrics

2. **Smart Recommendations**
   - Suggest related videos based on progress
   - Adaptive difficulty recommendations

3. **Progress Sync**
   - Real-time progress updates
   - Offline progress caching

4. **Gamification**
   - Achievements/badges for completion
   - Leaderboards
   - Streak tracking

---

## Troubleshooting

**Problem:** Progress not updating
- Check JWT token is valid
- Verify videoId exists in database
- Check console for API errors

**Problem:** Completed flag not persisting
- Ensure PATCH request sent correctly
- Check updated record in database

**Problem:** 404 on video-progress endpoints
- Verify server.js has videoProgressRoutes mounted
- Check backend running on correct port

---

## Files Modified/Created

### Created:
- `backend/models/VideoProgress.js`
- `backend/routes/videoProgressRoutes.js`

### Modified:
- `backend/server.js` (added route mounting)
- `frontend/src/services/api.js` (added videoProgressAPI)

### Suggested:
- `frontend/src/hooks/useVideoProgress.js` (hook implementation)

---

## Contact & Support

For questions or issues with the video progress tracking feature:
1. Check the error messages in console/logs
2. Verify all environment variables are set
3. Review database connection status
4. Test endpoints with Postman/cURL

---

**Last Updated:** 2024
**Status:** ✅ Ready for Integration

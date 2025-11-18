# Chatbot Feature Documentation

## Overview
A fully functional chatbot page with YouTube video recommendations following the website's green gradient theme.

## Features Implemented

### 1. Chatbot Page (`/chatbot`)
- **Location**: `frontend/src/app/chatbot/page.tsx`
- **Features**:
  - Real-time chat interface with message history
  - User and bot message differentiation
  - Timestamps for each message
  - Auto-scroll to latest message
  - Message input with send button
  - Simulated bot responses (1 second delay)
  - Back to home navigation

### 2. Layout Structure
Following the screenshot provided:
- **Left Side (2/3 width)**: Main chatbot interface
  - Chat header with title and description
  - Scrollable message container
  - Message input area with send button
  
- **Right Side (1/3 width)**: YouTube video recommendations
  - 3 recommendation cards
  - Each card shows:
    - YouTube icon placeholder (or thumbnail)
    - Video title
    - Brief description
    - Clickable link to open in new tab

### 3. Theme Consistency
- **Colors**: 
  - Background: `bg-white/40` with backdrop blur
  - Primary accent: `#b8d4c6` (mint green)
  - Text colors: `#3A4F3A`, `#4A5F4A`, `#6B8E6B`
  - Hover states: `#a8c4b6`
  
- **Typography**: 
  - Outfit font (inherited from globals.css)
  - Font-light for most text
  - Consistent sizing with home page

- **Components**:
  - Rounded-3xl corners
  - Backdrop blur effects
  - Smooth transitions
  - Hover animations

### 4. Navigation
- **FeatureCard Component** updated with optional `href` prop
- Chatbot card on home page now links to `/chatbot`
- Back button on chatbot page returns to home

## File Structure
```
frontend/src/
├── app/
│   ├── chatbot/
│   │   └── page.tsx          # Chatbot page
│   ├── page.tsx              # Home page (updated)
│   └── globals.css           # Global styles
└── components/
    └── FeatureCard.tsx       # Updated with navigation
```

## Usage

### Customizing Bot Responses
Edit the `handleSendMessage` function in `chatbot/page.tsx`:
```typescript
setTimeout(() => {
  const botResponse: Message = {
    id: messages.length + 2,
    text: "Your custom bot response here",
    sender: "bot",
    timestamp: new Date(),
  };
  setMessages((prev) => [...prev, botResponse]);
}, 1000);
```

### Adding Video Recommendations
Update the `videoRecommendations` array:
```typescript
const videoRecommendations: VideoRecommendation[] = [
  {
    id: "1",
    title: "Your Video Title",
    thumbnail: "https://img.youtube.com/vi/VIDEO_ID/mqdefault.jpg",
    url: "https://www.youtube.com/watch?v=VIDEO_ID",
    description: "Video description",
  },
  // ... more videos
];
```

### Making Other Cards Clickable
In `frontend/src/app/page.tsx`, add `href` property to any feature:
```typescript
{
  icon: BarChart3,
  title: "Sentiment Analysis",
  subtitle: "Understand your emotional patterns",
  href: "/sentiment-analysis",  // Add this
},
```

## Responsive Design
- **Mobile**: Single column layout, full-width chatbot, stacked recommendations
- **Tablet**: Optimized spacing and font sizes
- **Desktop**: Two-column layout (2:1 ratio)

## Future Enhancements
1. Connect to actual chatbot API (OpenAI, etc.)
2. Add typing indicators
3. Implement message reactions
4. Add image/file upload
5. Voice message support
6. Chat history persistence
7. Dynamic video recommendations based on conversation
8. User authentication
9. Multiple chat sessions


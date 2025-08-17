# The prompt used to generate this version of YT-DOG:

```
Create a next.js project that is ready to be deployed to the vercel's service.
The app should
- Provide an ui so that the user can enter a youtube channel url
- There may be multiple channgel urls entered
- There should be a list of "channels" that have been entered
- The app should download a list of all videos from youtube for that channel
- The app should use zustand to manage local data
- The downloaded list of videos should be stored in a zustand store

- The user should be able to watch the videos

- When user has watched a video it should be marked as watched
- User can also mark a video watched and skip a video

- The app should show 10 videos that are not marked as viewed
- The app should have a button to show next 10 videos
- The app should not show the entire list of videos

- When user opens the app, it should first check existing list of videos from the store and render
- If there are videos those should be used to show 10 latest that are not yet watched
- The app should check the Youtube api if there are any newer videos available that are not in the local storate. The app should do this in the background.
- There should be some subtle animated indication that background list fetching is taking place and it should seise when there are not any more requests running


- The app should keep track which videos have been watched and suggest the newest videos that have not yet been watched.

- Use typescript for the language
- Use tailwind for the styles
- Use zustand for state management

- The videos in the list should show: thumbnail, title, watched-status, lenght of the video, publishing date of the video
- The video-component should show the thumbnail in the left side of the component and the details on the right side. Even on mobile layout.

- When on mobile, and the video is put in fullscreen mode, the video should automatically rotate to landscape view even if the device autorotation was disabled.

- The UI should show how many videos there are total in the channel and how many of them have been watched. This should be visible for all of the channels in the channels list


- There should not be any backend storage like database etc.
```

# Notes

- The GTP-5 put the api-key on the client side. Had to tell it to put it to server side

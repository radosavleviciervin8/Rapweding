# Wedding Rap Style Studio — Runway API Integration Specification

## Overview
WEDDING RAP STYLE — Private Asset Studio (Founder: Ervin Remus Radosavlevici) integrates Runway's Gen-3 Alpha Turbo video generation pipeline to produce cinematic music video visuals, ceremony background projections, and reception entrance motion assets.

## Architectural Flow

1. **Client Request**:
   - The user inputs wedding theme parameters (e.g., couple name, rap style, aesthetic mood, aspect ratio: 16:9 or 9:16 vertical for social/reels).
   - The browser initiates a request to `/api/runway/generate-video` without exposing API secrets to the client.

2. **Host Server (`server.js`)**:
   - Securely accesses `process.env.RUNWAYML_API_SECRET`.
   - Sends task creation payload to Runway API endpoint: `https://api.dev.runwayml.com/v1/image_to_video` or `text_to_video` with header `X-Runway-Version: 2024-11-06`.
   - Returns `{ taskId, status: 'PENDING' }` to the client.

3. **Status Polling & Playback**:
   - Client polls `/api/runway/status/:taskId`.
   - Server queries Runway API `GET /v1/tasks/:id`.
   - When completed, the video URI is streamed/displayed directly in the studio vault interface.

4. **Environment Configuration**:
   - `RUNWAYML_API_SECRET`: Added to `.env.example` and accessed server-side only.

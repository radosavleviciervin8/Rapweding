import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.json());
app.use(express.static(__dirname, { index: false }));

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory mock task store for Runway previews
const mockTasks = new Map();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    runwayConfigured: Boolean(process.env.RUNWAYML_API_SECRET),
    studio: 'WEDDING RAP STYLE — Private Asset Studio',
    founder: 'Ervin Remus Radosavlevici',
  });
});

// Gemini Rap Composition & Asset Generation API
app.post('/api/gemini/generate-rap', async (req, res) => {
  try {
    const { coupleNames, style, story, bpm, vibe } = req.body || {};

    const prompt = `You are the lead lyrical architect and executive producer at WEDDING RAP STYLE — Private Asset Studio, founded by Ervin Remus Radosavlevici.
Compose an authentic, bespoke, world-class wedding rap song tailored for the couple.

Couple / Commission: ${coupleNames || 'Elena & Marcus'}
Style & Flow: ${style || '90s Golden Era Romance Boom-Bap'}
Target Tempo: ${bpm || '88-92 BPM'}
Vibe / Tone: ${vibe || 'Soulful, celebratory, luxury, head-nodding romance'}
Love Story & Key Highlights: ${story || 'Met in university coffee shop, shared adventures across the globe, unconditional support, unforgettable laughter'}

Please format the response with:
1. TRACK TITLE & ASSET DESIGNATION
2. FLOW & CADENCE BLUEPRINT (delivery tips, rhythm pocket, beat vibe)
3. INTRO (atmospheric spoken intro / beat drop hype)
4. VERSE 1 (how they met, individual quirks, magnetic spark)
5. CHORUS / HOOK (catchy, rhythmic, celebratory, easy for wedding guests to chant)
6. VERSE 2 (adventures, growth, promises, inside memories)
7. OUTRO (dedication to forever, celebratory toast, mic drop salute)
8. STUDIO MASTER CERTIFICATION NOTES (Signed by Founder Ervin Remus Radosavlevici)

Keep it high energy, authentic, emotional yet hype, avoiding cheesy clichés and delivering genuine rhyme schemes with internal rhymes and smooth pockets.`;

    let generatedText = '';

    if (process.env.GEMINI_API_KEY) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an elite hip-hop ghostwriter and private studio producer specializing in bespoke wedding rap masterpieces for luxury celebrations.',
          temperature: 0.8,
        },
      });
      generatedText = response.text || '';
    } else {
      generatedText = `[STUDIO ARCHIVE PREVIEW — Connect GEMINI_API_KEY in Settings > Secrets for live AI generation]

TRACK TITLE: "Forever in the Pocket" (WRS Master Asset)
STYLE: ${style || '90s Golden Era Romance Boom-Bap'} | TEMPO: ${bpm || '90 BPM'}

[INTRO]
Yeah... Turn the monitor up a little bit.
Private Asset Studio session.
Ervin Remus Radosavlevici on the boards.
To ${coupleNames || 'the happy couple'}... let's take it from the start.

[VERSE 1]
Stepped into the room, spotlight hit the floor
One glance across the crowd, didn't need to look no more
From late nights talking in that corner coffee booth
To building up a future grounded deep in honest truth
Two hearts synched in rhythm, now we locking in the groove
Every step you took together was a calculated move.

[CHORUS]
Raise your glasses up, let the bass line roll
This is real life poetry written for the soul
${coupleNames || 'Two hearts, one crown'} taking over the stage
Turn the page, start the story, welcome to the golden age!

[VERSE 2]
Through the high tides, low tides, passport stamps and flights
Quiet Sunday mornings turning into legendary nights
They said forever is a promise, but you made it look effortless
Gold-plated memories, every single second priceless.

[OUTRO]
Cheers to the journey. Cheers to the crown.
WEDDING RAP STYLE Private Asset Studio.
Archived and certified under Founder Ervin Remus Radosavlevici.`;
    }

    res.json({
      success: true,
      result: generatedText,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error generating wedding rap composition',
    });
  }
});

// Runway API - Create Video Generation Task
app.post('/api/runway/generate-video', async (req, res) => {
  try {
    const { promptText, ratio, duration, model, promptImage } = req.body || {};
    const runwaySecret = process.env.RUNWAYML_API_SECRET;

    if (runwaySecret) {
      const endpoint = promptImage 
        ? 'https://api.dev.runwayml.com/v1/image_to_video'
        : 'https://api.dev.runwayml.com/v1/tasks';

      const payload = {
        promptText: promptText || 'Cinematic wedding entrance luxury hip hop gold aura 4k',
        model: model || 'gen3a_turbo',
        duration: Number(duration) || 5,
        ratio: ratio || '16:9',
      };
      if (promptImage) {
        payload.promptImage = promptImage;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${runwaySecret}`,
          'X-Runway-Version': '2024-11-06',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: data.message || data.error || 'Runway API error',
        });
      }

      return res.json({
        success: true,
        taskId: data.id,
        status: data.status || 'PENDING',
      });
    } else {
      // In-memory demo simulation when RUNWAYML_API_SECRET is pending
      const taskId = 'runway_mock_' + Date.now();
      mockTasks.set(taskId, {
        id: taskId,
        createdAt: Date.now(),
        promptText: promptText || 'Cinematic Wedding Rap Visual',
        ratio: ratio || '16:9',
        duration: duration || 5,
      });

      return res.json({
        success: true,
        taskId: taskId,
        status: 'PENDING',
        isMock: true,
        note: 'Live Runway API secret can be attached in Settings > Secrets (RUNWAYML_API_SECRET)',
      });
    }
  } catch (err) {
    console.error('Runway generate error:', err);
    res.status(500).json({ success: false, error: err.message || 'Runway generation failed' });
  }
});

// Runway API - Poll Video Task Status
app.get('/api/runway/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const runwaySecret = process.env.RUNWAYML_API_SECRET;

    if (runwaySecret && !taskId.startsWith('runway_mock_')) {
      const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${runwaySecret}`,
          'X-Runway-Version': '2024-11-06',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: data.message || 'Error fetching Runway task',
        });
      }

      return res.json({
        success: true,
        id: data.id,
        status: data.status,
        progress: data.progress ?? 0,
        output: data.output || [],
        failure: data.failure || null,
      });
    } else {
      // Simulated progress for preview
      const task = mockTasks.get(taskId) || { createdAt: Date.now() - 4000 };
      const elapsed = Date.now() - (task.createdAt || Date.now());
      
      if (elapsed > 4000) {
        return res.json({
          success: true,
          id: taskId,
          status: 'SUCCEEDED',
          progress: 1.0,
          output: ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'],
          isMock: true,
        });
      } else {
        const progress = Math.min(0.95, elapsed / 4500);
        return res.json({
          success: true,
          id: taskId,
          status: 'RUNNING',
          progress: Number(progress.toFixed(2)),
          isMock: true,
        });
      }
    }
  } catch (err) {
    console.error('Runway status error:', err);
    res.status(500).json({ success: false, error: err.message || 'Status check failed' });
  }
});

// Root route with explicit Content-Type
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Fallback for all other routes
app.get('*', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Wedding Rap Style Studio listening on http://${HOST}:${PORT}`);
});

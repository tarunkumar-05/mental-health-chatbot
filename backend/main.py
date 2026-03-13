from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv
import httpx
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

class Message(BaseModel):
    text: str

SYSTEM_PROMPT = """You are MindEase, a compassionate mental health support chatbot.
Listen carefully and respond with empathy.
Provide emotional support and encouragement.
Suggest healthy coping strategies when appropriate.
Always be kind, non-judgmental, and supportive.
Keep responses concise but meaningful.
If someone is in crisis, encourage professional help.
Never diagnose or prescribe medication."""

def simple_sentiment(text):
    text_lower = text.lower()
    positive_words = ["happy", "good", "great", "amazing", "wonderful", "excited",
                      "joy", "love", "better", "awesome", "fantastic", "blessed",
                      "grateful", "calm", "peaceful", "hopeful", "motivated",
                      "proud", "confident", "relieved", "glad", "fine", "okay"]
    negative_words = ["sad", "depressed", "anxious", "stressed", "worried",
                      "scared", "afraid", "terrible", "awful", "bad", "hate",
                      "angry", "frustrated", "hopeless", "worthless", "lonely",
                      "tired", "exhausted", "hurt", "pain", "crying", "upset",
                      "miserable", "lost", "confused", "overwhelmed"]
    pos_count = sum(1 for word in positive_words if word in text_lower)
    neg_count = sum(1 for word in negative_words if word in text_lower)
    if pos_count > neg_count:
        return "POSITIVE", min(95, 70 + pos_count * 5)
    elif neg_count > pos_count:
        return "NEGATIVE", min(95, 70 + neg_count * 5)
    else:
        return "NEUTRAL", 75

async def save_to_supabase(user_message, bot_response, sentiment, confidence):
    if not SUPABASE_URL or not SUPABASE_KEY:
        return
    try:
        async with httpx.AsyncClient() as client_http:
            await client_http.post(
                f"{SUPABASE_URL}/rest/v1/chat_history",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                json={
                    "user_message": user_message,
                    "bot_response": bot_response,
                    "sentiment": sentiment,
                    "confidence": confidence
                },
                timeout=5.0
            )
    except Exception:
        pass

@app.get("/")
def home():
    return {"status": "MindEase API is running!"}

@app.post("/chat")
async def chat(message: Message):
    sentiment, score = simple_sentiment(message.text)
    prompt = f"{SYSTEM_PROMPT}\n\nUser emotional state: {sentiment}\nUser message: {message.text}\n\nRespond with empathy:"
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    await save_to_supabase(message.text, response.text, sentiment, score)
    return {
        "response": response.text,
        "sentiment": sentiment,
        "confidence": score
    }